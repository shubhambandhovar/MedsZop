# MedsZop Backend API

Backend API for MedsZop - Online Pharmacy Platform

## Features

- ✅ User Authentication (JWT)
- ✅ Medicine Management
- ✅ Order Management
- ✅ Role-based Access Control (User, Pharmacy, Admin)
- ✅ Prescription Management
- ✅ Search & Filter Medicines

## Tech Stack

- Node.js
- Express.js
- TypeScript
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs for password hashing

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/medszop
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5174
# Email (optional for local, required for invites)
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
EMAIL_FROM=no-reply@medszop.com
EMAIL_FROM_NAME=MedsZop Admin
```

3. Seed sample data:
```bash
npm run seed
```

4. Start development server:
```bash
npm run dev
```

## Sample Login Credentials

After running seed:
- **User**: user@test.com / password123
- **Admin**: admin@test.com / password123
- **Pharmacy**: pharmacy@test.com / password123

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (Protected)
- `PUT /api/auth/profile` - Update profile (Protected)

### Medicines
- `GET /api/medicines` - Get all medicines (with filters)
- `GET /api/medicines/:id` - Get single medicine
- `GET /api/medicines/categories` - Get all categories
- `POST /api/medicines` - Create medicine (Pharmacy/Admin)
- `PUT /api/medicines/:id` - Update medicine (Pharmacy/Admin)
- `DELETE /api/medicines/:id` - Delete medicine (Admin)

### Orders
- `POST /api/orders` - Create order (Protected)
- `GET /api/orders` - Get my orders (Protected)
- `GET /api/orders/:id` - Get order by ID (Protected)
- `PUT /api/orders/:id/cancel` - Cancel order (Protected)
- `GET /api/orders/all/orders` - Get all orders (Pharmacy/Admin)
- `PUT /api/orders/:id/status` - Update order status (Pharmacy/Admin)

## Project Structure

```
Backend/
├── src/
│   ├── config/
│   │   └── db.ts
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── medicineController.ts
│   │   └── orderController.ts
│   ├── middleware/
│   │   └── auth.middleware.ts
│   ├── models/
│   │   ├── User.ts
│   │   ├── Medicine.ts
│   │   ├── Order.ts
│   │   ├── Pharmacy.ts
│   │   └── Prescription.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── medicine.routes.ts
│   │   └── order.routes.ts
│   ├── app.ts
│   ├── server.ts
│   └── seed.ts
├── .env
├── .gitignore
├── package.json
└── tsconfig.json
```

## Development

```bash
# Run in development mode with auto-reload
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## API Testing

You can test the API using:
- Postman
- Thunder Client (VS Code extension)
- cURL
- Frontend application

Example request:
```bash
# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "phone": "9876543210"
  }'
```
