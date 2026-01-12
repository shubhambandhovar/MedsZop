# MedsZop - Quick Start Guide

## 🚀 Getting Started

Your complete MedsZop application (Frontend + Backend + Database Models) is ready to use!

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas cloud)
- VS Code or any code editor
- Terminal/Command Prompt

## ⚡ Quick Start (5 minutes)

### 1. Start MongoDB
```bash
# Windows - if using MongoDB as service
net start MongoDB

# Or start MongoDB manually
mongod
```

### 2. Terminal 1 - Start Backend
```bash
cd Backend
npm install  # (if not done)
npm run seed # Populate sample data
npm run dev  # Start server
```
✅ Backend running on http://localhost:5000

### 3. Terminal 2 - Start Frontend
```bash
cd Frontend
npm run dev
```
✅ Frontend running on http://localhost:5174 (or check terminal for actual port)

### 4. Login with Sample Account
- **Email**: user@test.com
- **Password**: password123

Done! 🎉

## 📁 Project Structure

```
MedsZop/
├── Frontend/               # React TypeScript frontend
│   ├── src/
│   │   ├── services/      # API services (NEW!)
│   │   │   ├── api.ts
│   │   │   ├── authService.ts
│   │   │   ├── medicineService.ts
│   │   │   └── orderService.ts
│   │   └── app/
│   │       ├── components/
│   │       ├── data/
│   │       └── types.ts
│   ├── package.json
│   └── vite.config.ts
│
├── Backend/               # Express TypeScript backend
│   ├── src/
│   │   ├── config/       # Database config
│   │   ├── controllers/  # Business logic
│   │   ├── middleware/   # Auth, validation
│   │   ├── models/       # Database schemas
│   │   ├── routes/       # API endpoints
│   │   ├── app.ts        # Express app
│   │   ├── server.ts     # Server startup
│   │   └── seed.ts       # Sample data
│   ├── .env              # Config file
│   ├── package.json
│   └── tsconfig.json
│
└── Documentation/        # Guides
    ├── README.md
    ├── INTEGRATION_GUIDE.md
    ├── FRONTEND_BACKEND_INTEGRATION.md
    └── Backend/IMPLEMENTATION_SUMMARY.md
```

## 🔑 Key Features

### Authentication ✅
- [x] User registration
- [x] Email/password login
- [x] JWT tokens
- [x] Password hashing
- [x] Role-based access

### Medicine Catalog ✅
- [x] Browse medicines
- [x] Search by name/brand
- [x] Filter by category
- [x] Price filtering
- [x] Stock status

### Shopping Cart ✅
- [x] Add/remove medicines
- [x] Quantity adjustment
- [x] Cart total calculation
- [x] Persistent storage

### Orders ✅
- [x] Place orders
- [x] Multiple delivery addresses
- [x] Payment method selection
- [x] Order tracking
- [x] Order cancellation

### Additional ✅
- [x] Multiple languages (English/Hindi)
- [x] Dark mode support
- [x] Responsive design
- [x] Error handling
- [x] Toast notifications

## 🧪 Testing Checklist

### Authentication
- [ ] Register new account
- [ ] Login with test credentials
- [ ] Logout works
- [ ] Token persists across page refresh

### Medicines
- [ ] Homepage shows medicines from backend
- [ ] Search finds medicines
- [ ] Filter by category works
- [ ] Medicine details page loads

### Shopping
- [ ] Add medicine to cart
- [ ] Update quantity
- [ ] Remove from cart
- [ ] Cart total updates

### Orders
- [ ] Place order creates entry in database
- [ ] Order appears in order history
- [ ] Can view order details
- [ ] Can cancel order

### Error Handling
- [ ] Invalid login shows error
- [ ] Network error shows toast
- [ ] Empty search handled gracefully

## 🛠️ Useful Commands

### Frontend
```bash
cd Frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm install          # Install dependencies
npm install axios    # Add axios if needed
```

### Backend
```bash
cd Backend
npm run dev          # Start with auto-reload
npm run build        # Compile TypeScript
npm start            # Run production build
npm run seed         # Populate sample data
npm install          # Install dependencies
```

## 📝 Sample Test Accounts

After running `npm run seed`:

| Role | Email | Password | Access |
|------|-------|----------|--------|
| User | user@test.com | password123 | Browse, Order |
| Admin | admin@test.com | password123 | Manage all |
| Pharmacy | pharmacy@test.com | password123 | Manage inventory |

## 🔍 API Endpoints

### Core Endpoints
```
Auth:
  POST   /api/auth/register      - Create account
  POST   /api/auth/login         - Login
  GET    /api/auth/me            - Get profile
  PUT    /api/auth/profile       - Update profile

Medicines:
  GET    /api/medicines          - List all
  GET    /api/medicines/:id      - Get details
  GET    /api/medicines/categories - Get categories
  POST   /api/medicines          - Create (pharmacy/admin)
  PUT    /api/medicines/:id      - Update (pharmacy/admin)
  DELETE /api/medicines/:id      - Delete (admin)

Orders:
  POST   /api/orders             - Create order
  GET    /api/orders             - My orders
  GET    /api/orders/:id         - Get order
  PUT    /api/orders/:id/cancel  - Cancel order
  GET    /api/orders/all/orders  - All orders (pharmacy/admin)
  PUT    /api/orders/:id/status  - Update status (pharmacy/admin)
```

## 🌍 Environment Variables

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/medszop
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5174
```

## 🚨 Troubleshooting

### Backend won't start
```
Error: connect ECONNREFUSED 127.0.0.1:27017

Solution: Start MongoDB
  net start MongoDB        (Windows)
  brew services start mongodb-community  (Mac)
  sudo systemctl start mongod  (Linux)
```

### Frontend can't call backend
```
Error: Network Error

Solution:
  1. Check backend is running on port 5000
  2. Check CORS: Backend has FRONTEND_URL=http://localhost:5174
  3. Restart both servers
```

### Seed script fails
```
Solution:
  1. Make sure MongoDB is running
  2. Clear existing data: delete /medszop database
  3. Run: npm run seed
```

### Port already in use
```
Frontend already on 5174:
  npm run dev        (Will auto-use 5175, 5176, etc.)

Backend already on 5000:
  Change PORT in .env and restart
  Or kill process: lsof -ti:5000 | xargs kill -9
```

## 📚 Documentation Files

1. **README.md** - Project overview
2. **INTEGRATION_GUIDE.md** - How to integrate backend with frontend
3. **FRONTEND_BACKEND_INTEGRATION.md** - Integration details & testing
4. **Backend/README.md** - Backend API documentation
5. **Backend/IMPLEMENTATION_SUMMARY.md** - Backend features list

## 🎯 Next Steps

### Immediate
1. Run quick start steps above
2. Test login with sample account
3. Browse medicines
4. Place test order

### Short Term
1. Customize company name/branding
2. Add your medicines to database
3. Configure payment gateway
4. Add prescription verification

### Medium Term
1. Deploy frontend (Netlify/Vercel)
2. Deploy backend (Railway/Render)
3. Use MongoDB Atlas (cloud)
4. Set up CI/CD pipeline

### Long Term
1. Add admin dashboard
2. Add analytics
3. Add seller/pharmacy dashboard
4. Add recommendations engine
5. Mobile app

## 📞 Support

### Check These First
1. Is MongoDB running?
2. Are both servers running?
3. Check browser console (F12)
4. Check backend terminal
5. Check if ports are correct

### Common Issues
- **Login fails**: Check test account credentials
- **Medicines not showing**: Run `npm run seed`
- **CORS error**: Restart backend
- **API calls hang**: Check network tab in DevTools

## 🎉 You're All Set!

Your MedsZop application is fully functional with:
- ✅ Complete Frontend UI
- ✅ Full Backend API
- ✅ Database Models
- ✅ Authentication System
- ✅ API Integration

**Time to build! 🚀**

---

Questions? Check the documentation files listed above or look at the console errors for specific details.
