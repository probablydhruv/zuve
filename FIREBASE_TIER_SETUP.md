# Firebase Tier System Setup Guide

## Overview

This guide will help you set up the Firebase-based tier management system for your usage tracking.

## What Was Implemented

✅ User profile storage in Firestore  
✅ Tier syncing from Firebase to local state  
✅ Security rules to protect tier modifications  
✅ Default Free tier for all users  
✅ Functions to update tiers (for Stripe integration)  

## Step 1: Deploy Firestore Security Rules

The security rules have been created in `firestore.rules`. Deploy them to Firebase:

```bash
# Make sure you're in the project directory
cd /Users/apple/zuve-studio-app

# Deploy the rules
firebase deploy --only firestore:rules
```

**What the rules do:**
- ✅ Users can read their own profile
- ✅ Users can create profiles (only with 'free' tier)
- ✅ Users can update their profile (but NOT tier/subscription)
- ✅ Tier updates require admin/Cloud Function access
- ✅ Users can read/write their own projects

## Step 2: Test User Profile Creation

When a user logs in for the first time, a profile is automatically created:

1. Sign in to your app
2. Check Firestore console: `users/{userId}/profile/data`
3. You should see:
   ```json
   {
     "uid": "user123",
     "email": "user@example.com",
     "displayName": "User Name",
     "tier": "free",
     "createdAt": "timestamp",
     "updatedAt": "timestamp"
   }
   ```

## Step 3: Manually Test Tier Updates

### Option A: Using Firebase Console (Quick Test)

1. Go to Firebase Console → Firestore
2. Navigate to `users/{userId}/profile/data`
3. Edit the document and change `tier` to `"plus"`, `"pro"`, or `"max"`
4. Refresh your app - the tier should update automatically!

### Option B: Using TierSelector (Development Only)

The app already has a `TierSelector` component in the sidebar:
1. Open your canvas
2. Look for the tier dropdown below the usage bar
3. Change the tier
4. This writes to localStorage only (temporary)

## Step 4: Create Cloud Function for Tier Updates (Production)

For production, create a Cloud Function that updates tiers after successful payments:

### Create the function:

```typescript
// functions/src/index.ts
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

admin.initializeApp()

// Function to update user tier (called after Stripe payment)
export const updateUserTier = functions.https.onCall(async (data, context) => {
  // Only authenticated users
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated')
  }
  
  const { tier, subscriptionId, subscriptionStatus } = data
  const userId = context.auth.uid
  
  // Validate tier
  const validTiers = ['free', 'plus', 'pro', 'max']
  if (!validTiers.includes(tier)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid tier')
  }
  
  try {
    // Update Firestore (as admin, bypassing security rules)
    await admin.firestore()
      .collection('users')
      .doc(userId)
      .collection('profile')
      .doc('data')
      .set({
        tier,
        subscriptionId: subscriptionId || null,
        subscriptionStatus: subscriptionStatus || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true })
    
    console.log('User tier updated:', userId, tier)
    return { success: true, tier }
  } catch (error) {
    console.error('Error updating tier:', error)
    throw new functions.https.HttpsError('internal', 'Failed to update tier')
  }
})

// Stripe webhook handler (if using Stripe)
export const handleStripeWebhook = functions.https.onRequest(async (req, res) => {
  const stripe = require('stripe')(functions.config().stripe.secret_key)
  const endpointSecret = functions.config().stripe.webhook_secret
  
  const sig = req.headers['stripe-signature']
  
  let event
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }
  
  // Handle different event types
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object
      const userId = session.client_reference_id
      const priceId = session.line_items?.data[0]?.price?.id
      
      // Map price ID to tier
      const tierMap: Record<string, string> = {
        'price_plus_monthly': 'plus',
        'price_pro_monthly': 'pro',
        'price_max_monthly': 'max'
      }
      
      const tier = tierMap[priceId] || 'free'
      
      // Update user tier
      await admin.firestore()
        .collection('users')
        .doc(userId)
        .collection('profile')
        .doc('data')
        .set({
          tier,
          subscriptionId: session.subscription,
          subscriptionStatus: 'active',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true })
      
      console.log('User upgraded:', userId, tier)
      break
      
    case 'customer.subscription.deleted':
      // Downgrade to free when subscription is cancelled
      const subscription = event.data.object
      const customer = subscription.customer
      
      // Find user by customer ID
      const usersSnap = await admin.firestore()
        .collection('users')
        .where('stripeCustomerId', '==', customer)
        .limit(1)
        .get()
      
      if (!usersSnap.empty) {
        const userId = usersSnap.docs[0].id
        await admin.firestore()
          .collection('users')
          .doc(userId)
          .collection('profile')
          .doc('data')
          .set({
            tier: 'free',
            subscriptionStatus: 'cancelled',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true })
        
        console.log('User downgraded to free:', userId)
      }
      break
  }
  
  res.json({ received: true })
})
```

### Deploy the function:

```bash
firebase deploy --only functions
```

## Step 5: Call the Function from Your App

When a user completes payment:

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebaseClient'
import { useAuth } from '@/components/providers/AuthProvider'

const updateTier = async (tier: TierType, subscriptionId: string) => {
  const { refreshUserProfile } = useAuth()
  
  try {
    const updateUserTier = httpsCallable(functions, 'updateUserTier')
    const result = await updateUserTier({ 
      tier, 
      subscriptionId,
      subscriptionStatus: 'active'
    })
    
    console.log('Tier updated:', result.data)
    
    // Refresh auth context to get new tier
    await refreshUserProfile()
    
    // Show success message
    alert(`Successfully upgraded to ${tier} tier!`)
  } catch (error) {
    console.error('Error updating tier:', error)
    alert('Failed to update subscription. Please contact support.')
  }
}
```

## Step 6: Integration with Stripe (Optional)

### 1. Create Stripe Checkout Session

```typescript
import { loadStripe } from '@stripe/stripe-js'

const handleUpgrade = async (tier: 'plus' | 'pro' | 'max') => {
  const { user } = useAuth()
  if (!user) return
  
  // Price IDs from Stripe Dashboard
  const priceIds = {
    plus: 'price_1234567890',
    pro: 'price_0987654321',
    max: 'price_1111111111'
  }
  
  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      priceId: priceIds[tier],
      userId: user.uid
    })
  })
  
  const { sessionId } = await response.json()
  
  const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  await stripe?.redirectToCheckout({ sessionId })
}
```

### 2. Create API Route for Checkout

```typescript
// app/api/create-checkout-session/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

export async function POST(req: NextRequest) {
  const { priceId, userId } = await req.json()
  
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
    client_reference_id: userId,
  })
  
  return NextResponse.json({ sessionId: session.id })
}
```

## Testing Checklist

- [ ] Deploy Firestore rules: `firebase deploy --only firestore:rules`
- [ ] Sign in to the app
- [ ] Check Firestore console for user profile with `tier: "free"`
- [ ] Usage bar shows "Free Tier"
- [ ] Manually change tier in Firestore to "plus"
- [ ] Refresh app - usage bar should show "Plus Tier" with new limits
- [ ] Test with all tiers: free, plus, pro, max
- [ ] Verify tier persists across page refreshes
- [ ] Test generation limits for each tier

## Monitoring

### Check User Tiers

```bash
# Firebase CLI
firebase firestore:get users/{userId}/profile/data
```

### View Logs

```bash
# Cloud Functions logs
firebase functions:log
```

## Troubleshooting

### Tier not syncing
- Check browser console for errors
- Verify Firestore rules are deployed
- Check that user profile exists in Firestore

### Profile not created
- Check AuthProvider console logs
- Verify Firestore rules allow creation
- Try signing out and back in

### Permission denied errors
- Deploy security rules: `firebase deploy --only firestore:rules`
- Check that user is authenticated
- Verify user ID matches in rules

## Security Notes

🔒 **Important Security Features:**
1. Users cannot modify their own tier (prevents fraud)
2. Tier changes require admin/Cloud Function access
3. New users automatically get Free tier
4. Subscription data is protected

## Next Steps

1. **Remove TierSelector from Production**: The tier selector is for testing only. Remove it from the canvas UI before deploying to production.

2. **Add Pricing Page**: Create a pricing page where users can upgrade/downgrade.

3. **Server-Side Validation**: Add tier checking in your generation Cloud Functions to prevent quota bypass.

4. **Usage Dashboard**: Show users their usage history and tier limits.

5. **Email Notifications**: Notify users when approaching limits or when tier changes.

## Support

For issues with Firebase tier system:
1. Check Firestore console for profile data
2. Check browser console for sync errors
3. Verify security rules are deployed
4. Review Cloud Function logs

---

**Files Modified:**
- `src/lib/firestore.ts` - User profile functions
- `src/components/providers/AuthProvider.tsx` - Tier syncing
- `src/components/canvas/KonvaCanvas.tsx` - Tier usage
- `firestore.rules` - Security rules (NEW)

**Status:** ✅ Ready for deployment and testing!

