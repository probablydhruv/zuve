# 🚀 Vercel Deployment Checklist

## ✅ Pre-Deployment (COMPLETED)

- [x] API keys moved to environment variables
- [x] `.env.local` created with all keys
- [x] `.env.example` created for reference
- [x] `firebaseClient.ts` updated to use env vars
- [x] `.gitignore` includes `.env*` files
- [x] Build tested successfully
- [x] Deployment guide created

---

## 📋 Your Deployment Steps

### 1. Push to GitHub ⏱️ 5 minutes

```bash
# If you haven't initialized git yet:
git init
git add .
git commit -m "Prepare for Vercel deployment"

# Create repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/zuve-studio-app.git
git branch -M main
git push -u origin main
```

**Status:** ⬜ Not started

---

### 2. Sign Up for Vercel ⏱️ 2 minutes

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Choose "Continue with GitHub"
4. Authorize Vercel

**Status:** ⬜ Not started

---

### 3. Import Project ⏱️ 1 minute

1. Click "Add New..." → "Project"
2. Find `zuve-studio-app`
3. Click "Import"

**Status:** ⬜ Not started

---

### 4. Add Environment Variables ⏱️ 5 minutes

**IMPORTANT:** Open `VERCEL_ENV_VARS.txt` and copy/paste each variable.

**Total variables to add:** 13

**Remember:** Select "Production", "Preview", AND "Development" for each!

**Status:** ⬜ Not started

---

### 5. Deploy ⏱️ 3 minutes

1. Click "Deploy"
2. Wait for build to complete
3. Get your URL: `https://your-project.vercel.app`

**Status:** ⬜ Not started

---

### 6. Test Deployment ⏱️ 5 minutes

Visit your Vercel URL and test:

- [ ] Homepage loads correctly
- [ ] Sign in with Google works
- [ ] Canvas page opens
- [ ] Can create a new project
- [ ] Can draw on canvas
- [ ] AI Generate works
- [ ] AI Harmonize works
- [ ] Aura Assist works
- [ ] Projects save and load

**Status:** ⬜ Not started

---

### 7. Update Firebase Auth Domain ⏱️ 2 minutes

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select `zuve-jewellery` project
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Click **"Add domain"**
5. Add: `your-project.vercel.app`
6. Click **"Add"**

**Status:** ⬜ Not started

---

### 8. (Optional) Connect Hostinger Domain ⏱️ 10 minutes + 24-48 hours DNS

#### In Vercel:
1. Project → Settings → Domains
2. Add your domain: `yourdomain.com`
3. Copy the DNS records Vercel provides

#### In Hostinger:
1. Domains → DNS Zone
2. Add the DNS records from Vercel
3. Wait 24-48 hours for DNS propagation

**Status:** ⬜ Not started

---

## 🎯 Total Time Estimate

**Without custom domain:** ~25 minutes  
**With custom domain:** ~35 minutes + DNS wait time

---

## 📚 Reference Files

- `DEPLOYMENT_GUIDE.md` - Detailed step-by-step guide
- `VERCEL_ENV_VARS.txt` - All environment variables to copy/paste
- `.env.example` - Template for environment variables

---

## 🆘 Need Help?

### Common Issues:

**Build fails:**
- Check all 13 environment variables are added
- Verify no typos in variable names
- Check Vercel build logs

**Sign in doesn't work:**
- Add Vercel domain to Firebase authorized domains
- Check browser console for errors

**AI features don't work:**
- Verify Firebase Functions are deployed
- Check Firebase Functions logs
- Ensure CORS is configured

---

## 🎉 Success!

Once all steps are complete, your app will be:
- ✅ Live on the internet
- ✅ Automatically deployed on every git push
- ✅ Secure with environment variables
- ✅ Fast with global CDN
- ✅ Free SSL certificate included

**Your Vercel URL:** `https://________.vercel.app`

**Your Custom Domain (if added):** `https://________`

---

Good luck with your deployment! 🚀

