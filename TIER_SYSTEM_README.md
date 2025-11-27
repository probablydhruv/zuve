# Tier-Based Usage System

## Overview

The new usage tracking system implements a flexible tier-based approach with 4 subscription levels, each with different usage limits and time windows.

## Tier Configuration

### Free Tier
- **Limit**: 5 images per 48 hours
- **Overdraft**: 1 extra image (UX buffer)
- **Cooldown**: 1 hour when limit exceeded
- **Use Case**: Trial users, basic usage

### Plus Tier
- **Dual Constraints**:
  - 10 images per 48 hours (burst protection)
  - 60 images per 30 days (monthly cap)
- **Overdraft**: 2 extra images
- **Cooldown**: 2 hours when limit exceeded
- **Use Case**: Regular users who need consistent access
- **Note**: Most restrictive constraint wins - prevents both burst abuse and sustained overuse

### Pro Tier
- **Limit**: 1000 images per 30 days
- **Overdraft**: 5 extra images
- **Cooldown**: 30 minutes (gentle reminder)
- **Use Case**: Professional users, power users

### Max Tier
- **Limit**: 2000 images per 30 days
- **Overdraft**: 10 extra images
- **Cooldown**: None (soft limit only)
- **Use Case**: Enterprise, high-volume users

## How It Works

### Usage Tracking
1. **Rolling Windows**: All limits use rolling time windows (not calendar-based)
   - Free/Plus short-term: Last 48 hours
   - Plus/Pro/Max long-term: Last 30 days

2. **Event Recording**: Each generation is recorded with a timestamp
   - Events older than the window are automatically pruned
   - Events are stored in localStorage with the format:
     ```json
     {
       "events": [1700000000, 1700000100, ...],
       "cooldownUntil": 1700005000,
       "tier": "plus"
     }
     ```

3. **Constraint Checking**: 
   - For single-window tiers (Free, Pro, Max): Simple count check
   - For Plus tier: Both constraints checked, most restrictive applies

### Color Indicators

- **Green**: Comfortable usage (< 80% of quota)
- **Yellow**: Approaching limit (80-100% or using overdraft)
- **Red**: Limit exceeded or in cooldown

### Overdraft System

The overdraft buffer allows users to slightly exceed their quota for better UX:
- Provides flexibility for users near their limit
- Triggers cooldown when exceeded
- Prevents hard stops that frustrate users

### Cooldown Mechanism

When users exceed their quota + overdraft:
1. Generation is blocked
2. Timer shows when usage will be available again
3. Cooldown duration varies by tier
4. UI displays countdown timer with pulsing animation

## Testing the System

### 1. Change Tiers
Use the tier selector in the left sidebar (below the usage bar):
- Select different tiers from the dropdown
- Tier changes are immediately effective
- Usage history is preserved across tier changes

### 2. Test Scenarios

#### Free Tier Test
1. Set tier to "Free"
2. Generate 5 images quickly
3. Should see: Green → Yellow (at 5) → Red (at 6)
4. Try to generate 6th image → Should trigger 1-hour cooldown

#### Plus Tier Test (Dual Constraints)
1. Set tier to "Plus"
2. Test short-term limit:
   - Generate 10 images within minutes
   - Should see green → yellow → red
3. Test long-term limit:
   - If you have used 50+ images over past days
   - Short bursts will be limited even if under 10/48h

#### Pro/Max Tier Test
1. Set tier to "Pro" or "Max"
2. Should have very generous limits
3. Overdraft is larger (5-10 images)
4. Cooldown is minimal or none

### 3. Monitor Usage

The usage bar displays:
- Current tier name
- Most restrictive window usage (e.g., "8/10 (48h)")
- Status indicator (Good/Warning/Limit Reached)
- For Plus tier with dual constraints, hover over info icon to see both limits

### 4. Reset Usage (Development Only)

Click the refresh icon next to the usage bar to reset:
- Clears all usage events
- Removes cooldown
- Preserves current tier
- Useful for testing different scenarios

## Implementation Files

### Core Files Modified

1. **`src/lib/usageTracker.ts`**
   - Main logic for tier-based usage tracking
   - Window constraint checking
   - Cooldown calculation
   - Event pruning and storage

2. **`src/components/canvas/UsageBar.tsx`**
   - Visual display of usage status
   - Progress bar with color indicators
   - Cooldown timer
   - Multi-window tooltip for Plus tier

3. **`src/components/canvas/TierSelector.tsx`** (NEW)
   - Dropdown to select subscription tier
   - Visual tier information
   - For development and testing

4. **`src/components/canvas/KonvaCanvas.tsx`**
   - Integrated tier system
   - Added `setUserTier()` function
   - Updated usage initialization
   - Preserves tier in localStorage

## Integration with Subscription System

To connect this with your payment/subscription system:

### 1. Store Tier in User Profile

Add tier to your Firestore user document:
```typescript
// In your user profile schema
interface UserProfile {
  uid: string
  email: string
  tier: TierType  // 'free' | 'plus' | 'pro' | 'max'
  subscriptionId?: string
  subscriptionStatus?: 'active' | 'cancelled' | 'past_due'
}
```

### 2. Sync Tier on Auth

Update `AuthProvider.tsx` to fetch and sync tier:
```typescript
useEffect(() => {
  const unsub = onAuthStateChanged(auth, async (u) => {
    setUser(u)
    if (u) {
      // Fetch user profile from Firestore
      const profile = await getUserProfile(u.uid)
      // Update usage tier
      if (profile?.tier) {
        setUserTier(profile.tier)
      }
    }
    setLoading(false)
  })
  return () => unsub()
}, [])
```

### 3. Update on Subscription Change

When user upgrades/downgrades:
```typescript
const handleSubscriptionChange = async (newTier: TierType) => {
  // Update Firestore
  await updateUserProfile(user.uid, { tier: newTier })
  
  // Update local state
  setUserTier(newTier)
  
  // Optionally: don't reset usage, let them keep their history
  // Or reset if moving to a higher tier as a "fresh start"
}
```

### 4. Server-Side Validation (Recommended)

Add tier checking in your Cloud Function:
```typescript
// In your generateImage function
const userProfile = await admin.firestore()
  .collection('users')
  .doc(context.auth.uid)
  .get()

const tier = userProfile.data()?.tier || 'free'
const usageData = userProfile.data()?.usageData || { events: [] }

// Validate on server side
const usageStatus = handleRequest(usageData, now, 1)
if (usageStatus.allowed <= 0) {
  throw new functions.https.HttpsError(
    'resource-exhausted',
    'Usage limit exceeded'
  )
}

// Continue with generation...
```

## Future Enhancements

### Potential Improvements
1. **Usage Analytics Dashboard**
   - Show usage history chart
   - Compare against limit visually
   - Usage trends over time

2. **Usage Notifications**
   - Email when approaching limit
   - Push notification when cooldown ends
   - Daily/weekly usage reports

3. **Flexible Overdraft**
   - Allow purchasing one-time image packs
   - Temporary limit increases
   - Rollover unused images

4. **Team/Organization Tiers**
   - Shared usage pools
   - Per-user sub-limits
   - Usage attribution

5. **Grace Periods**
   - Don't immediately block at limit
   - Warning phase before cooldown
   - Softer enforcement for Pro/Max tiers

## Testing Checklist

- [ ] Free tier: Can generate 5 images, blocked at 6
- [ ] Free tier: Cooldown timer displays correctly
- [ ] Plus tier: Short-term limit (10/48h) works
- [ ] Plus tier: Long-term limit (60/30d) works
- [ ] Plus tier: Most restrictive constraint applies
- [ ] Plus tier: Info tooltip shows both constraints
- [ ] Pro tier: Can generate 100+ images rapidly
- [ ] Max tier: No cooldown triggered
- [ ] Tier selector changes tier immediately
- [ ] Usage bar color changes correctly (green/yellow/red)
- [ ] Reset button clears usage but preserves tier
- [ ] Usage persists across page refreshes
- [ ] Tier persists in localStorage

## Support

For questions or issues with the tier system:
1. Check console logs (detailed logging enabled)
2. Inspect localStorage: `localStorage.getItem('zuve-usage-data')`
3. Verify tier configuration in `usageTracker.ts`
4. Test with different tier settings

## License

Part of Zuve Studio application.

