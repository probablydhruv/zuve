# Vercel Deployment Guide for Zuve Studio

## ✅ Security Fixed
Your Firebase API keys are now stored in environment variables instead of being hardcoded.

---

## Step-by-Step Vercel Deployment

### 1. Push Your Code to GitHub

**If you haven't already:**

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Prepare for Vercel deployment with environment variables"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/zuve-studio-app.git
git branch -M main
git push -u origin main
```

---

### 2. Sign Up / Log In to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"** or **"Log In"**
3. Choose **"Continue with GitHub"** (recommended)
4. Authorize Vercel to access your GitHub account

---

### 3. Import Your Project

1. Click **"Add New..."** → **"Project"**
2. Find your `zuve-studio-app` repository
3. Click **"Import"**

---

### 4. Configure Project Settings

**Framework Preset:** Next.js (auto-detected)

**Root Directory:** `./` (leave as default)

**Build Command:** `npm run build` (auto-filled)

**Output Directory:** `.next` (auto-filled)

---

### 5. Add Environment Variables

Click **"Environment Variables"** and add these **one by one**:

#### Firebase Main Project (zuve-jewellery)

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyD9r3tLp785GdPpK2bP46QcKrxPygwIDOo` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `zuve-jewellery.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `zuve-jewellery` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `zuve-jewellery.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `78294265791` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:78294265791:web:8663b854e180a7a9607b0a` |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | `G-QTE80Y0KJZ` |

#### Firebase Functions Project (zuvestudio50)

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_FUNCTIONS_API_KEY` | `AIzaSyCZa3dCnAbFYQDfeR5vJzgOvMv4zifdpns` |
| `NEXT_PUBLIC_FUNCTIONS_AUTH_DOMAIN` | `zuvestudio50.firebaseapp.com` |
| `NEXT_PUBLIC_FUNCTIONS_PROJECT_ID` | `zuvestudio50` |
| `NEXT_PUBLIC_FUNCTIONS_STORAGE_BUCKET` | `zuvestudio50.firebasestorage.app` |
| `NEXT_PUBLIC_FUNCTIONS_MESSAGING_SENDER_ID` | `78019259365` |
| `NEXT_PUBLIC_FUNCTIONS_APP_ID` | `1:78019259365:web:1c2930e804d4aee6b21d0c` |

**Important:** Make sure to select **"Production"**, **"Preview"**, and **"Development"** for each variable.

---

### 6. Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for the build to complete
3. You'll get a URL like: `https://zuve-studio-app.vercel.app`

---

### 7. Test Your Deployment

Visit your Vercel URL and test:
- ✅ Homepage loads
- ✅ Sign in with Google works
- ✅ Canvas page works
- ✅ AI features (Generate, Harmonize, Aura Assist) work
- ✅ Projects save and load

---

### 8. Connect Your Hostinger Domain (Optional)

#### In Vercel:
1. Go to your project → **Settings** → **Domains**
2. Click **"Add"**
3. Enter your domain: `yourdomain.com`
4. Vercel will show you DNS records to add

#### In Hostinger:
1. Log in to Hostinger
2. Go to **Domains** → **DNS Zone**
3. Add the DNS records Vercel provided:
   - **A Record**: Point to Vercel's IP
   - **CNAME**: `www` → your-project.vercel.app

**DNS propagation takes 24-48 hours.**

---

## 🔒 Firebase Security Rules

Make sure your Firestore Security Rules are set correctly:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**Apply these rules in Firebase Console:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `zuve-jewellery`
3. Go to **Firestore Database** → **Rules**
4. Paste the rules above
5. Click **"Publish"**

---

## 🎉 You're Done!

Your app is now live on Vercel with:
- ✅ Secure environment variables
- ✅ Automatic deployments on every git push
- ✅ Free SSL certificate
- ✅ Global CDN
- ✅ Automatic preview deployments for pull requests

---

## Troubleshooting

### Build Fails
- Check Vercel build logs
- Ensure all environment variables are added correctly
- Make sure `.env.local` is in `.gitignore` (it is)

### Firebase Auth Not Working
- Add your Vercel domain to Firebase Console:
  - Firebase Console → Authentication → Settings → Authorized domains
  - Add: `your-project.vercel.app`

### AI Features Not Working
- Check browser console for CORS errors
- Verify Firebase Functions are deployed to `zuvestudio50`
- Check Firebase Functions logs in Firebase Console

---

## Need Help?

Contact Vercel Support or check:
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)

