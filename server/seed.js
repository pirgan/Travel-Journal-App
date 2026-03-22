import 'dotenv/config';
import mongoose from 'mongoose';
import User from './src/models/User.js';

await mongoose.connect(process.env.MONGODB_URI);

const email = 'test@wanderlog.com';
const existing = await User.findOne({ email });

if (existing) {
  console.log('User already exists — deleting and recreating...');
  await User.deleteOne({ email });
}

await User.create({ name: 'Test User', email, password: 'password123' });
console.log('✅ Seed user created:');
console.log('   Email:    test@wanderlog.com');
console.log('   Password: password123');

await mongoose.disconnect();
