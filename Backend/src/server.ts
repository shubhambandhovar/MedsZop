import app from './app';
import { connectDB } from './config/db';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});
