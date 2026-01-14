# CORS Fix - Environment Setup Required

## The Problem
Your frontend at `https://medszop-frontend.vercel.app` cannot access the backend API at `https://medszop-backend.onrender.com` due to CORS policy.

## The Root Cause
The Render environment doesn't have the `FRONTEND_URL` environment variable set properly.

## ✅ Quick Fix - Update Render Environment

### Step 1: Go to Render Dashboard
1. Visit https://dashboard.render.com
2. Select **medszop-backend** service
3. Click **Environment** tab (on the left sidebar)

### Step 2: Update Environment Variable
Add or update this variable:
```
FRONTEND_URL=https://medszop-frontend.vercel.app
```

### Step 3: Save & Redeploy
- Click **Save**
- Render will automatically redeploy
- Wait 2-3 minutes

### Step 4: Test
Try calling your API from the frontend. The CORS error should be gone.

## Current CORS Configuration
Your backend is already configured to accept:
- `https://medszop-frontend.vercel.app` ✅ (hardcoded in app.ts)
- `process.env.FRONTEND_URL` (from Render env variables)
- All localhost URLs (for development)

## If Issue Persists
1. Check Render logs: `Render Dashboard → medszop-backend → Logs`
2. Look for CORS errors
3. Verify the frontend URL is exactly: `https://medszop-frontend.vercel.app`

## Alternative: Update CORS Dynamically
If you want more control, you can use a dynamic origin function in `app.ts`:

```typescript
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'https://medszop-frontend.vercel.app',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

## Reference
- CORS Documentation: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
- Render Environment Variables: https://render.com/docs/environment-variables
