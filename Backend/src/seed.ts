import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import Medicine from './models/Medicine';
import User from './models/User';

dotenv.config();

const medicines = [
  {
    name: 'Paracetamol',
    brand: 'Crocin',
    genericName: 'Paracetamol 500mg',
    price: 24,
    mrp: 30,
    discount: 20,
    description: 'Used for pain relief and fever reduction',
    category: 'Pain Relief',
    inStock: true,
    requiresPrescription: false,
    manufacturer: 'GSK',
    packSize: '15 tablets',
    nearbyAvailability: true,
    estimatedDeliveryTime: 30,
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
  },
  {
    name: 'Amoxicillin',
    brand: 'Amoxil',
    genericName: 'Amoxicillin 500mg',
    price: 145,
    mrp: 180,
    discount: 19,
    description: 'Antibiotic used to treat bacterial infections',
    category: 'Antibiotics',
    inStock: true,
    requiresPrescription: true,
    manufacturer: 'Cipla',
    packSize: '10 capsules',
    nearbyAvailability: true,
    estimatedDeliveryTime: 35,
    imageUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400',
  },
  {
    name: 'Cetirizine',
    brand: 'Alerid',
    genericName: 'Cetirizine 10mg',
    price: 32,
    mrp: 40,
    discount: 20,
    description: 'Antihistamine for allergy relief',
    category: 'Allergy',
    inStock: true,
    requiresPrescription: false,
    manufacturer: 'Cipla',
    packSize: '10 tablets',
    nearbyAvailability: true,
    estimatedDeliveryTime: 25,
    imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400',
  },
  {
    name: 'Metformin',
    brand: 'Glycomet',
    genericName: 'Metformin 500mg',
    price: 85,
    mrp: 100,
    discount: 15,
    description: 'Used to treat type 2 diabetes',
    category: 'Diabetes',
    inStock: true,
    requiresPrescription: true,
    manufacturer: 'USV',
    packSize: '30 tablets',
    nearbyAvailability: true,
    estimatedDeliveryTime: 40,
    imageUrl: 'https://images.unsplash.com/photo-1550572017-4a6e8c7a8f28?w=400',
  },
  {
    name: 'Omeprazole',
    brand: 'Omez',
    genericName: 'Omeprazole 20mg',
    price: 68,
    mrp: 85,
    discount: 20,
    description: 'Treats acid reflux and stomach ulcers',
    category: 'Gastro',
    inStock: true,
    requiresPrescription: false,
    manufacturer: "Dr. Reddy's",
    packSize: '15 capsules',
    nearbyAvailability: true,
    estimatedDeliveryTime: 30,
    imageUrl: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=400',
  },
  {
    name: 'Ibuprofen',
    brand: 'Brufen',
    genericName: 'Ibuprofen 400mg',
    price: 48,
    mrp: 60,
    discount: 20,
    description: 'Anti-inflammatory pain reliever',
    category: 'Pain Relief',
    inStock: true,
    requiresPrescription: false,
    manufacturer: 'Abbott',
    packSize: '10 tablets',
    nearbyAvailability: true,
    estimatedDeliveryTime: 30,
    imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400',
  }
];

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medszop');
    console.log('✅ MongoDB Connected');

    // Clear existing data
    await Medicine.deleteMany({});
    await User.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Insert medicines
    await Medicine.insertMany(medicines);
    console.log('✅ Sample medicines added');

    // Create sample users - explicitly hash passwords before saving
    const usersData = [
      {
        name: 'Shreya',
        email: 'shreya@test.com',
        password: 'Meds257',
        phone: '9876543210',
        role: 'user'
      },
      {
        name: 'Admin User',
        email: 'admin@test.com',
        password: 'Meds257',
        phone: '9876543211',
        role: 'admin'
      },
      {
        name: 'Apollo Pharmacy',
        email: 'pharmacy@test.com',
        password: 'password123',
        phone: '9876543212',
        role: 'pharmacy'
      }
    ];

    // Hash passwords and insert users directly (bypass middleware to avoid double hashing)
    const hashedUsers = [];
    for (const userData of usersData) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      hashedUsers.push({
        ...userData,
        password: hashedPassword,
        addresses: [],
        savedPrescriptions: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    await User.collection.insertMany(hashedUsers);
    console.log('✅ Sample users added');

    console.log('\n📋 Sample Login Credentials:');
    console.log('User: shreya@test.com / Meds257');
    console.log('Admin: admin@test.com / Meds257');
    console.log('Pharmacy: pharmacy@test.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
