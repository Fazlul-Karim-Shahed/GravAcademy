import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn(
      '⚠️  MONGODB_URI is not defined in server/.env.\n' +
      '👉 Please set your Online MongoDB Atlas connection string in server/.env to enable database operations.'
    );
    return;
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Atlas connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB Atlas connection error:', error);
    process.exit(1);
  }
};
