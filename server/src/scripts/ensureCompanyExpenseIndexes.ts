import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const ensureIndexes = async () => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required.');
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const collection = mongoose.connection.db!.collection('companyexpenses');
    await collection.createIndex({ expenseNo: 1 }, { unique: true, name: 'expenseNo_1' });
    await collection.createIndex({ expenseDate: -1, createdAt: -1 }, { name: 'expenseDate_-1_createdAt_-1' });
    await collection.createIndex({ category: 1, expenseDate: -1 }, { name: 'category_1_expenseDate_-1' });
    console.log(JSON.stringify({ indexes: (await collection.indexes()).map((index) => index.name) }));
  } finally {
    await mongoose.disconnect();
  }
};

ensureIndexes().catch((error) => {
  console.error('Failed to ensure company expense indexes:', error);
  process.exitCode = 1;
});
