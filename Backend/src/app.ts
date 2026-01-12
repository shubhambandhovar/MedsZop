import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.routes';
import medicineRoutes from './routes/medicine.routes';
import orderRoutes from './routes/order.routes';

const app: Application = express();

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5174',
    'http://localhost:5173',
    'http://localhost:5175'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/orders', orderRoutes);

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'MedsZop API is running',
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to MedsZop API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      medicines: '/api/medicines',
      orders: '/api/orders'
    }
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error(err.stack);
  
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

export default app;
