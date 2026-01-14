import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medszop';
    
    if (!process.env.MONGODB_URI) {
      console.warn('⚠️ MONGODB_URI not set, using default connection');
    }
    
    await mongoose.connect(mongoURI);
    
    console.log('✅ MongoDB Connected Successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    console.error('⚠️ Server will continue running without database connection');
    // DO NOT exit - let server start anyway
  }
};
