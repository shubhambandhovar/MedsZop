# Payment System - Quick Start Guide

## ⚡ Quick Setup (5 Minutes)

### Step 1: Install Dependencies

```bash
# Backend
cd Backend
npm install razorpay

# Frontend (Razorpay script loaded dynamically)
```

### Step 2: Environment Variables

**Backend `.env`:**
```env
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_secret_key
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

**Frontend `.env`:**
```env
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id
VITE_API_URL=http://localhost:5000/api
```

### Step 3: Register Routes (Already Done!)

Routes are registered in `Backend/src/app.ts`:
- `/api/payments/*` - Payment endpoints
- `/api/insurance/*` - Insurance endpoints

### Step 4: Test the System

```bash
# Start backend
cd Backend
npm run dev

# Start frontend
cd Frontend
npm run dev
```

## 🎯 Quick Integration

### Add Payment to Checkout Page

```typescript
import PaymentMethodSelector from './components/payment/PaymentMethodSelector';
import PaymentBreakdown from './components/payment/PaymentBreakdown';
import RazorpayCheckout from './components/payment/RazorpayCheckout';
import paymentService from './services/paymentService';

function Checkout() {
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  
  const handlePay = async () => {
    // Create order
    const order = await paymentService.createOrder({
      orderId: cart.orderId,
      amount: cart.total,
      insuranceId: selectedInsurance?._id
    });
    
    setShowPayment(true);
  };
  
  return (
    <>
      <PaymentMethodSelector 
        selectedMethod={paymentMethod}
        onMethodSelect={setPaymentMethod}
        insuranceAvailable={hasInsurance}
      />
      
      <PaymentBreakdown
        subtotal={cart.subtotal}
        insuranceCovered={insurance?.covered || 0}
        total={cart.total}
        userPayable={cart.total - (insurance?.covered || 0)}
      />
      
      <button onClick={handlePay}>Pay Now</button>
    </>
  );
}
```

## 🛡️ Quick Insurance Setup

```typescript
import InsuranceUpload from './components/payment/InsuranceUpload';

function InsuranceSettings() {
  return (
    <InsuranceUpload
      onUploadSuccess={(id) => alert('Uploaded! ID: ' + id)}
      onUploadError={(err) => alert('Error: ' + err)}
    />
  );
}
```

## 🧪 Test Credentials

### Razorpay Test Mode
```
Key ID: rzp_test_YOUR_KEY
Test Card: 4111 1111 1111 1111
CVV: 123
Expiry: Any future date
```

## 📋 API Quick Reference

### Create Payment
```http
POST /api/payments/create-order
{
  "orderId": "ORD123",
  "amount": 500,
  "insuranceId": "optional"
}
```

### Upload Insurance
```http
POST /api/insurance/upload
FormData:
  - provider: "PolicyBazaar"
  - policyNumber: "POL123"
  - policyDocument: <file>
```

### Check Coverage
```http
POST /api/insurance/check-coverage/:insuranceId
{
  "items": [
    {"itemId": "med1", "itemType": "medicine", "price": 500}
  ]
}
```

## ✅ Verification Checklist

- [ ] Razorpay credentials configured
- [ ] Routes registered in app.ts
- [ ] Frontend can create payment orders
- [ ] Razorpay checkout opens correctly
- [ ] Payment success callback works
- [ ] Webhook endpoint receives events
- [ ] Insurance upload works
- [ ] Coverage calculation displays correctly

## 🚨 Common Issues

### Payment Modal Doesn't Open
- Check `VITE_RAZORPAY_KEY_ID` in frontend `.env`
- Ensure Razorpay script loads (check browser console)

### Webhook Not Working
- Configure webhook URL in Razorpay dashboard: `https://your-domain.com/api/payments/webhook`
- Add webhook secret to `.env`

### Insurance Upload Fails
- Check file size < 5MB
- Ensure file type is PDF or image
- Verify authentication token

## 📞 Support

See [PAYMENT_SYSTEM_GUIDE.md](./PAYMENT_SYSTEM_GUIDE.md) for detailed documentation.

---

**Ready to use!** All files created and integrated. 🎉
