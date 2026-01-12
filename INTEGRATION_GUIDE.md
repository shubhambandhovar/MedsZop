# Frontend-Backend Integration Guide

## Backend Setup Complete! ✅

Your backend is now running at: **http://localhost:5000**

## What's Been Built

### 1. **Database Models**
- User (with authentication)
- Medicine
- Order
- Pharmacy
- Prescription

### 2. **Authentication System**
- JWT-based authentication
- Role-based access control (user, pharmacy, admin)
- Password hashing with bcryptjs

### 3. **API Endpoints**

#### Authentication (`/api/auth`)
```typescript
POST /api/auth/register - Register new user
POST /api/auth/login - Login user
GET /api/auth/me - Get current user (requires token)
PUT /api/auth/profile - Update profile (requires token)
```

#### Medicines (`/api/medicines`)
```typescript
GET /api/medicines - Get all medicines with filters
  Query params: search, category, requiresPrescription, inStock, minPrice, maxPrice, page, limit
GET /api/medicines/:id - Get single medicine
GET /api/medicines/categories - Get all categories
POST /api/medicines - Create medicine (pharmacy/admin only)
PUT /api/medicines/:id - Update medicine (pharmacy/admin only)
DELETE /api/medicines/:id - Delete medicine (admin only)
```

#### Orders (`/api/orders`)
```typescript
POST /api/orders - Create new order
GET /api/orders - Get my orders
GET /api/orders/:id - Get order by ID
PUT /api/orders/:id/cancel - Cancel order
GET /api/orders/all/orders - Get all orders (pharmacy/admin)
PUT /api/orders/:id/status - Update order status (pharmacy/admin)
```

## Next Steps: Frontend Integration

### Step 1: Install Axios in Frontend
```bash
cd Frontend
npm install axios
```

### Step 2: Create API Service

Create `Frontend/src/services/api.ts`:
```typescript
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### Step 3: Create Auth Service

Create `Frontend/src/services/authService.ts`:
```typescript
import api from './api';

export const authService = {
  register: async (data: {
    name: string;
    email: string;
    password: string;
    phone: string;
  }) => {
    const response = await api.post('/auth/register', data);
    if (response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};
```

### Step 4: Create Medicine Service

Create `Frontend/src/services/medicineService.ts`:
```typescript
import api from './api';

export const medicineService = {
  getMedicines: async (filters?: {
    search?: string;
    category?: string;
    requiresPrescription?: boolean;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/medicines', { params: filters });
    return response.data;
  },

  getMedicineById: async (id: string) => {
    const response = await api.get(`/medicines/${id}`);
    return response.data;
  },

  getCategories: async () => {
    const response = await api.get('/medicines/categories');
    return response.data;
  },
};
```

### Step 5: Create Order Service

Create `Frontend/src/services/orderService.ts`:
```typescript
import api from './api';

export const orderService = {
  createOrder: async (orderData: {
    items: Array<{
      medicineId: string;
      name: string;
      brand: string;
      price: number;
      quantity: number;
    }>;
    deliveryAddress: any;
    paymentMethod: string;
    prescriptionId?: string;
  }) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  getMyOrders: async () => {
    const response = await api.get('/orders');
    return response.data;
  },

  getOrderById: async (id: string) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  cancelOrder: async (id: string) => {
    const response = await api.put(`/orders/${id}/cancel`);
    return response.data;
  },
};
```

### Step 6: Update Your Components

Example: Update Login Component
```typescript
import { authService } from '../services/authService';

const handleLogin = async (email: string, password: string) => {
  try {
    const result = await authService.login(email, password);
    setIsLoggedIn(true);
    setUser(result.data.user);
    toast.success('Login successful!');
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Login failed');
  }
};
```

Example: Update Medicine Search
```typescript
import { medicineService } from '../services/medicineService';

const searchMedicines = async (query: string) => {
  try {
    const result = await medicineService.getMedicines({ 
      search: query,
      page: 1,
      limit: 20 
    });
    setMedicines(result.data);
  } catch (error) {
    toast.error('Failed to fetch medicines');
  }
};
```

## Testing the Backend

### Option 1: Using the Seed Script
```bash
cd Backend
npm run seed
```

This creates sample data and test accounts:
- User: user@test.com / password123
- Admin: admin@test.com / password123
- Pharmacy: pharmacy@test.com / password123

### Option 2: Using Thunder Client / Postman

1. Register a new user:
```
POST http://localhost:5000/api/auth/register
Body: {
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "9876543210"
}
```

2. Login:
```
POST http://localhost:5000/api/auth/login
Body: {
  "email": "john@example.com",
  "password": "password123"
}
```

3. Get medicines:
```
GET http://localhost:5000/api/medicines
```

## CORS Configuration

The backend is already configured to allow requests from:
- Frontend URL: http://localhost:5174

If your frontend runs on a different port, update `.env`:
```
FRONTEND_URL=http://localhost:YOUR_PORT
```

## Environment Variables

Make sure your Backend `.env` file has:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/medszop
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5174
```

## Common Issues & Solutions

### Issue: MongoDB Connection Failed
**Solution**: Make sure MongoDB is running
```bash
# Windows (if using MongoDB as a service)
net start MongoDB

# Or start MongoDB manually
mongod
```

### Issue: CORS Error
**Solution**: Check FRONTEND_URL in .env matches your frontend port

### Issue: Authentication Failed
**Solution**: Make sure you're sending the token in headers:
```typescript
Authorization: Bearer <your-token>
```

## API Response Format

All API responses follow this format:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description"
}
```

## Ready to Use!

Your backend is fully functional and ready to be integrated with your frontend. Start by:

1. Running `npm run seed` to create sample data
2. Creating the API services in your frontend
3. Updating your components to use the API services instead of mock data

Happy coding! 🚀
