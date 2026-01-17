# Payment System - Installation & Deployment

## 📦 Installation Steps

### 1. Install Backend Dependencies

```bash
cd Backend
npm install
```

**New dependencies added:**
- `razorpay@^2.9.2` - Razorpay SDK for payment processing
- `@types/razorpay@^2.0.3` - TypeScript types for Razorpay

### 2. Configure Environment Variables

Create/update `.env` file in `Backend/` directory:

```env
# Existing variables...
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5174

# Add these new Payment System variables
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_secret_key
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

Create/update `.env` file in `Frontend/` directory:

```env
# Existing variables...
VITE_API_URL=http://localhost:5000/api

# Add Razorpay key
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id
```

### 3. Get Razorpay Credentials

#### Test Mode (Development)
1. Sign up at [https://razorpay.com/](https://razorpay.com/)
2. Go to Dashboard → Settings → API Keys
3. Click "Generate Test Key"
4. Copy Key ID and Key Secret
5. Go to Settings → Webhooks
6. Add webhook URL: `http://localhost:5000/api/payments/webhook`
7. Select events: `payment.captured`, `payment.failed`
8. Copy Webhook Secret

#### Production Mode
1. Complete KYC verification on Razorpay
2. Activate your account
3. Generate Live API Keys
4. Configure production webhook URL
5. Update `.env` with live credentials

## 🚀 Running the Application

### Development Mode

```bash
# Terminal 1 - Backend
cd Backend
npm run dev

# Terminal 2 - Frontend
cd Frontend
npm run dev
```

Backend will run on: `http://localhost:5000`  
Frontend will run on: `http://localhost:5174`

### Production Build

```bash
# Build Backend
cd Backend
npm run build
npm start

# Build Frontend
cd Frontend
npm run build
npm run preview
```

## 🧪 Testing the Payment System

### Quick Test Checklist

1. **Payment Order Creation**
   ```bash
   curl -X POST http://localhost:5000/api/payments/create-order \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{
       "orderId": "TEST001",
       "amount": 500
     }'
   ```

2. **Insurance Upload**
   - Navigate to Insurance Settings page
   - Upload a test policy document (PDF or image)
   - Fill in provider and policy number
   - Click "Upload Policy"

3. **Payment Flow**
   - Add items to cart
   - Go to checkout
   - Select payment method
   - Click "Pay Now"
   - Complete payment using test card: `4111 1111 1111 1111`

### Test Credentials

**Razorpay Test Cards:**
```
Success Card: 4111 1111 1111 1111
Failure Card: 4000 0000 0000 0002
CVV: Any 3 digits
Expiry: Any future date
OTP: 1234
```

**Test Insurance Policy:**
```
Provider: PolicyBazaar
Policy Number: TEST123456
Coverage: ₹10,000
```

## 🔧 Configuration Checklist

### Backend Configuration
- [x] Razorpay package installed
- [x] Models created (Payment, Insurance)
- [x] Services implemented (PaymentService, InsuranceService)
- [x] Controllers created (PaymentController, InsuranceController)
- [x] Routes registered in app.ts
- [ ] Environment variables configured
- [ ] Razorpay credentials added
- [ ] MongoDB running and connected
- [ ] JWT authentication working

### Frontend Configuration
- [x] Payment components created
- [x] Insurance components created
- [x] Services implemented
- [ ] Environment variables configured
- [ ] Razorpay key added
- [ ] API URL configured
- [ ] Components integrated into checkout flow

### Razorpay Dashboard
- [ ] Account created
- [ ] Test mode API keys generated
- [ ] Webhook URL configured
- [ ] Webhook events selected (payment.captured, payment.failed)
- [ ] Webhook secret copied to .env

## 📋 Database Setup

### Automatic Setup
The models will automatically create collections and indexes when the app starts.

### Manual Verification
Connect to MongoDB and verify collections:

```javascript
// Check collections exist
db.getCollectionNames()
// Should include: payments, insurances

// Check indexes on payments
db.payments.getIndexes()
// Should have indexes on: orderId, userId, transactionId, paymentStatus

// Check indexes on insurances
db.insurances.getIndexes()
// Should have indexes on: userId, policyNumber, verificationStatus
```

## 🔐 Security Setup

### JWT Middleware
Ensure `authenticate` middleware is working:

```typescript
// Backend/src/middleware/auth.ts should export:
export const authenticate = (req, res, next) => {
  // JWT verification logic
}

export const authorize = (roles: string[]) => (req, res, next) => {
  // Role-based access control
}
```

### CORS Configuration
Update CORS settings in `Backend/src/app.ts`:

```typescript
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5174',
    'https://your-production-domain.com'
  ],
  credentials: true
}));
```

## 🌐 Deployment

### Backend Deployment (Render/Heroku)

1. **Environment Variables** (Set in hosting platform):
   ```
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=your_secure_secret
   RAZORPAY_KEY_ID=rzp_live_...
   RAZORPAY_KEY_SECRET=your_live_secret
   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
   FRONTEND_URL=https://your-frontend.com
   NODE_ENV=production
   ```

2. **Build Command**: `npm run build`
3. **Start Command**: `npm start`
4. **Port**: Auto-detected from `PORT` env variable

### Frontend Deployment (Vercel/Netlify)

1. **Environment Variables**:
   ```
   VITE_API_URL=https://your-backend-api.com/api
   VITE_RAZORPAY_KEY_ID=rzp_live_...
   ```

2. **Build Command**: `npm run build`
3. **Output Directory**: `dist`
4. **Framework**: Vite

### Post-Deployment Steps

1. **Update Razorpay Webhook**
   - Go to Razorpay Dashboard → Settings → Webhooks
   - Update URL to: `https://your-backend.com/api/payments/webhook`
   - Verify webhook secret is set

2. **Test Production Payment**
   - Use test mode first
   - Create a test order
   - Complete payment
   - Verify webhook is received
   - Check payment status updated

3. **Switch to Live Mode**
   - Update to live API credentials
   - Test with small amount first
   - Monitor for any errors

## 🐛 Troubleshooting

### Issue: "Razorpay is not defined"
**Solution:** Ensure Razorpay script is loaded in `RazorpayCheckout.tsx`:
```typescript
const script = document.createElement('script');
script.src = 'https://checkout.razorpay.com/v1/checkout.js';
document.body.appendChild(script);
```

### Issue: "Payment verification failed"
**Solution:** Check webhook secret matches between Razorpay and .env:
```bash
# In Backend/.env
RAZORPAY_WEBHOOK_SECRET=your_secret_from_razorpay_dashboard
```

### Issue: "Insurance upload fails"
**Solution:** 
1. Check file size < 5MB
2. Verify file type is PDF or image
3. Ensure authentication token is valid
4. Check backend logs for errors

### Issue: "Webhook not received"
**Solution:**
1. Verify webhook URL is correct and accessible publicly
2. Check Razorpay dashboard for webhook delivery logs
3. Ensure webhook secret is configured correctly
4. Test webhook using Razorpay's test webhook feature

### Issue: "Cannot create payment order"
**Solution:**
1. Verify Razorpay credentials are correct
2. Check user is authenticated
3. Ensure amount is greater than 0
4. Check orderId is unique
5. Review backend logs for detailed error

## 📊 Monitoring & Logs

### Backend Logs to Monitor
```typescript
// Payment creation
console.log('Creating payment order:', { orderId, amount, userId });

// Payment verification
console.log('Verifying payment:', { razorpay_order_id });

// Webhook received
console.log('Webhook received:', event.type);

// Insurance upload
console.log('Insurance uploaded:', { userId, policyNumber });
```

### Razorpay Dashboard
- Monitor payment success/failure rates
- Check webhook delivery status
- View transaction details
- Track refunds and disputes

### Database Queries
```javascript
// Recent payments
db.payments.find().sort({ createdAt: -1 }).limit(10)

// Failed payments
db.payments.find({ paymentStatus: 'failed' })

// Pending insurance verifications
db.insurances.find({ verificationStatus: 'pending' })

// Insurance coverage usage
db.insurances.aggregate([
  { $match: { verificationStatus: 'approved' } },
  { $group: { _id: null, totalUsed: { $sum: '$usedCoverage' } } }
])
```

## 🔄 Updates & Maintenance

### Regular Tasks
1. **Monitor Failed Payments** - Check for patterns, retry if needed
2. **Review Insurance Verifications** - Approve/reject pending policies
3. **Update Coverage Rates** - Adjust mock coverage percentages if needed
4. **Security Audits** - Regularly update dependencies
5. **Backup Data** - Regular database backups

### Updating Dependencies
```bash
# Check for updates
cd Backend
npm outdated

# Update specific package
npm update razorpay

# Update all packages
npm update

# Re-run tests
npm test
```

## 📞 Support Resources

- **Razorpay Documentation**: https://razorpay.com/docs/
- **Razorpay Support**: https://razorpay.com/support/
- **Razorpay Test Mode**: https://razorpay.com/docs/payments/payments/test-card-details/
- **MongoDB Documentation**: https://docs.mongodb.com/
- **Express.js Documentation**: https://expressjs.com/

## ✅ Final Verification Checklist

Before going live, verify:

### Backend
- [ ] All environment variables set
- [ ] Razorpay credentials (live mode)
- [ ] MongoDB connected
- [ ] All routes responding
- [ ] Webhook endpoint accessible
- [ ] JWT authentication working
- [ ] CORS configured for production domain
- [ ] SSL/HTTPS enabled

### Frontend
- [ ] Razorpay key configured
- [ ] API URL pointing to production
- [ ] All components rendering correctly
- [ ] Payment flow working end-to-end
- [ ] Insurance upload working
- [ ] Error handling displaying correctly
- [ ] Dark mode working

### Razorpay
- [ ] Live mode enabled
- [ ] Webhook URL updated
- [ ] Webhook secret matches
- [ ] Test payment successful
- [ ] Webhook delivery confirmed
- [ ] Payment methods enabled

### Testing
- [ ] Test payment creation
- [ ] Test payment verification
- [ ] Test webhook delivery
- [ ] Test insurance upload
- [ ] Test coverage calculation
- [ ] Test error scenarios
- [ ] Test on mobile devices

---

## 🎉 You're Ready to Go Live!

Once all items are checked, your payment system is production-ready!

For any issues, refer to:
- `PAYMENT_SYSTEM_GUIDE.md` - Detailed documentation
- `PAYMENT_QUICKSTART.md` - Quick setup guide
- `PAYMENT_VISUAL_GUIDE.md` - Visual flows and diagrams
- `PAYMENT_IMPLEMENTATION_COMPLETE.md` - Implementation summary

---

**Last Updated:** 2024  
**Version:** 1.0.0  
**Maintained By:** MedsZop Development Team
