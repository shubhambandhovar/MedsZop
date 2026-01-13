import mongoose from 'mongoose';
import Order from './models/Order';
import { connectDB } from './config/db';

const fixIndexes = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Drop the problematic orderId index if it exists
    try {
      await Order.collection.dropIndex('orderId_1');
      console.log('✅ Dropped orderId_1 index');
    } catch (error: any) {
      if (error.code === 27) {
        console.log('ℹ️  orderId_1 index does not exist (already removed)');
      } else {
        console.log('Error dropping index:', error.message);
      }
    }

    // List all current indexes
    const indexes = await Order.collection.getIndexes();
    console.log('\nCurrent indexes on Order collection:');
    console.log(JSON.stringify(indexes, null, 2));

    console.log('\n✅ Index fix completed');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixIndexes();
