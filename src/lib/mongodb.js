import mongoose from 'mongoose';
// Import all models to ensure they're registered
import '../models/index.js';

const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.warn('MONGODB_URI not set, database operations will fail');
    return;
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully');
    console.log('Models registered:', Object.keys(mongoose.models));
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    // Don't throw error, allow app to continue with limited functionality
  }
};

export default connectDB;



// sudo fuser -k 3000/tcp