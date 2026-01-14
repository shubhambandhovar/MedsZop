# MedsZop Deployment Guide - v0.8 Beta

## ✅ What We've Done
- ✓ Updated versions to 0.8.0 (Beta)
- ✓ Created `.env.production` files with feature flags
- ✓ Added beta badge to frontend
- ✓ Ready for deployment!

---

## 📋 STEP-BY-STEP DEPLOYMENT (30 mins)

### **STEP 1: Commit to GitHub** (5 mins)

Open PowerShell in `s:\Project 2\MedsZop`:

```powershell
git add .
git commit -m "v0.8: Prepare for beta deployment with feature flags"
git push origin main
```

**What this does:** Saves all changes to GitHub

---

### **STEP 2: Deploy Backend to Render** (10 mins)

#### 2a. Create Render Account
1. Go to https://render.com
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Select your MedsZop GitHub repo
5. Configure:
   - **Name:** `medszop-backend`
   - **Root Directory:** `Backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node

#### 2b. Add Environment Variables
In Render dashboard, go to your service → "Environment"
Add these variables:

```
MONGODB_URI=mongodb+ts://your_username:your_password@your_cluster.mongodb.net/medszop_dev?retryWrites=true&w=majority
JWT_SECRET=change_me_to_random_string_12345
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
FRONTEND_URL=https://medszop.vercel.app
PORT=5000
FEATURE_DOCTOR_CONSULTATION=false
FEATURE_ADVANCED_ANALYTICS=false
FEATURE_AI_RECOMMENDATIONS=false
```

**Note:** Get your actual MongoDB URI from MongoDB Atlas

#### 2c. Deploy
- Click "Deploy"
- Wait 2-3 minutes
- Copy your backend URL (looks like: `https://medszop-backend.onrender.com`)

---

### **STEP 3: Deploy Frontend to Vercel** (10 mins)

#### 3a. Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub
3. Click "Add New Project"
4. Select your MedsZop repo
5. Configure:
   - **Framework:** Vite
   - **Root Directory:** `Frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

#### 3b. Add Environment Variables
In Vercel project settings → "Environment Variables"
Add:

```
VITE_API_URL=https://medszop-backend.onrender.com
VITE_ENV=production
VITE_FEATURE_DOCTOR_CONSULTATION=false
VITE_FEATURE_ADVANCED_ANALYTICS=false
VITE_FEATURE_AI_RECOMMENDATIONS=false
```

Replace `https://medszop-backend.onrender.com` with your actual Render URL

#### 3c. Deploy
- Click "Deploy"
- Wait 1-2 minutes
- Your app is live! (URL looks like: `https://medszop.vercel.app`)

---

### **STEP 4: Update Backend with Frontend URL** (5 mins)

Go back to Render Backend settings → Environment Variables

Update:
```
FRONTEND_URL=https://medszop.vercel.app
```
(Use your actual Vercel URL)

Redeploy backend (click Redeploy button in Render)

---

## 🔐 IMPORTANT SECURITY NOTES

### DO NOT commit `.env.production` to GitHub!
Add to [.gitignore](.gitignore):
```
.env.production
.env.local
.env
```

**Why?** Your database passwords and API keys are in there!

### Render & Vercel Handle Secrets Safely
- They store env variables encrypted
- Never visible in public
- You manage them in dashboard only

---

## ✅ VERIFY DEPLOYMENT IS WORKING

After deployment, test:

1. **Frontend loads:** Visit your Vercel URL
2. **See beta badge:** Bottom right corner says "MedsZop v0.8 (Beta)"
3. **Login works:** Try registering an account
4. **Browse medicines:** Test medicine search
5. **Check console:** Open DevTools (F12) → Console for any errors

---

## 🔄 WHAT'S WORKING NOW (Deploy with confidence!)

✅ User Authentication (Login/Signup)
✅ Medicine Search & Browse
✅ Prescription Upload
✅ Order Placement & Tracking
✅ Pharmacy Dashboard
✅ Admin User Management
✅ Basic Subscription Plans
✅ Cart & Checkout

---

## 🚧 WHAT'S STILL BEING BUILT (Hidden from users)

🚧 Doctor Consultation System (FEATURE_DOCTOR_CONSULTATION=false)
🚧 Advanced Analytics (FEATURE_ADVANCED_ANALYTICS=false)
🚧 AI Recommendations (FEATURE_AI_RECOMMENDATIONS=false)

Users won't see these yet — perfect for beta!

---

## 🐛 TROUBLESHOOTING

### Backend won't start on Render?
- Check MongoDB URI is correct
- Check all env variables are set
- Look at Logs in Render dashboard

### Frontend shows errors?
- Clear browser cache (Ctrl+Shift+Delete)
- Check VITE_API_URL matches your Render URL
- Check browser console (F12) for errors

### Still getting errors?
1. Go to Render → Logs tab (for backend)
2. Go to Vercel → Deployments → Logs (for frontend)
3. Look for the error message
4. Fix locally, push to GitHub, redeploy

---

## 📈 AFTER DEPLOYMENT

You can:
- Keep coding locally (no changes!)
- Test features on live site
- Get real user feedback
- Push new features and redeploy anytime

**To deploy updates:**
```
git add .
git commit -m "your message"
git push origin main
```
Render & Vercel automatically redeploy!

---

## 📞 NEXT STEPS

1. ✅ Complete steps 1-4 above
2. ✅ Test your live app
3. ✅ Share the Vercel URL with friends/teachers
4. ✅ Continue building features locally
5. 🔄 Redeploy when you add new features

**Questions?** Check Render & Vercel documentation or reach out!

Good luck! 🚀
