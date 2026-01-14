# Quick Deployment Checklist

## ✅ BEFORE YOU START
- [ ] You have a GitHub account with MedsZop repo
- [ ] You have a MongoDB Atlas account with connection string ready
- [ ] You have Gmail account for email notifications (optional)

---

## 📝 STEP 1: GITHUB COMMIT (Copy & Paste)

Open PowerShell in: `S:\Project 2\MedsZop`

```powershell
git add .
git commit -m "v0.8: Prepare for beta deployment with feature flags"
git push origin main
```

---

## 🔧 STEP 2: RENDER BACKEND SETUP

**Time: 5-10 minutes**

1. Go to: https://render.com
2. Sign in with GitHub
3. Click: "New +" → "Web Service"
4. Select: MedsZop repository
5. Fill out form:
   - **Name:** medszop-backend
   - **Root Directory:** Backend
   - **Build Command:** npm install
   - **Start Command:** npm start
6. Click "Create Web Service"

### Add Environment Variables:
Go to: Settings → Environment Variables

Add each one:
```
MONGODB_URI=YOUR_MONGODB_CONNECTION_STRING
JWT_SECRET=YOUR_RANDOM_SECRET_KEY
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=YOUR_EMAIL@gmail.com
EMAIL_PASS=YOUR_APP_PASSWORD
FRONTEND_URL=https://medszop.vercel.app
PORT=5000
FEATURE_DOCTOR_CONSULTATION=false
FEATURE_ADVANCED_ANALYTICS=false
FEATURE_AI_RECOMMENDATIONS=false
```

7. Click "Deploy"
8. **COPY YOUR RENDER URL** (you'll need it next!)

---

## 🎨 STEP 3: VERCEL FRONTEND SETUP

**Time: 5-10 minutes**

1. Go to: https://vercel.com
2. Sign in with GitHub
3. Click: "Add New Project"
4. Select: MedsZop repository
5. Configure:
   - **Framework:** Vite
   - **Root Directory:** Frontend
   - **Build Command:** npm run build
   - **Output Directory:** dist

### Add Environment Variables:
```
VITE_API_URL=YOUR_RENDER_BACKEND_URL
VITE_ENV=production
VITE_FEATURE_DOCTOR_CONSULTATION=false
VITE_FEATURE_ADVANCED_ANALYTICS=false
VITE_FEATURE_AI_RECOMMENDATIONS=false
```

6. Click "Deploy"
7. **COPY YOUR VERCEL URL** (looks like: medszop.vercel.app)

---

## 🔄 STEP 4: UPDATE RENDER WITH VERCEL URL

1. Go back to Render dashboard
2. Find your backend service
3. Go to: Settings → Environment Variables
4. Find: FRONTEND_URL
5. Update to: `https://YOUR_VERCEL_URL.vercel.app`
6. Click "Redeploy"

---

## ✅ VERIFY EVERYTHING WORKS

After all deployments complete:

1. Open: https://YOUR_VERCEL_URL.vercel.app
2. Check for **yellow "v0.8 (Beta)" badge** in bottom right
3. Try to **Login/Signup**
4. Try to **Browse medicines**
5. Open **DevTools (F12)** → **Console** for any red errors

---

## 🎉 YOU'RE DEPLOYED!

Your app is now live online! You have:
- Frontend: https://YOUR_VERCEL_URL.vercel.app
- Backend: https://YOUR_RENDER_URL.onrender.com

---

## 📚 TO UPDATE YOUR APP

Whenever you make changes locally:

```powershell
git add .
git commit -m "your message"
git push origin main
```

Both Render & Vercel auto-redeploy!

---

## 🆘 COMMON ISSUES

| Issue | Solution |
|-------|----------|
| Backend won't deploy | Check MongoDB URI in Env Vars, view Render Logs |
| Frontend blank page | Check VITE_API_URL matches Render URL, clear cache |
| Email not sending | Check EMAIL_USER and EMAIL_PASS in env vars |
| API 404 errors | Verify VITE_API_URL doesn't have trailing slash |

---

Good luck! 🚀
