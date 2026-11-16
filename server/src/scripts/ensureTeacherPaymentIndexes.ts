import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const ensureIndexes = async () => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required.');
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const collection = mongoose.connection.db!.collection('teacherpayments');
    await collection.createIndex(
      { classKeys: 1 },
      { unique: true, name: 'teacher_payment_class_once' },
    );
    await collection.createIndex(
      { teacherId: 1, paidAt: -1 },
      { name: 'teacherId_1_paidAt_-1' },
    );
    console.log(JSON.stringify({ indexes: (await collection.indexes()).map((index) => index.name) }));
  } finally {
    await mongoose.disconnect();
  }
};

ensureIndexes().catch((error) => {
  console.error('Failed to ensure teacher payment indexes:', error);
  process.exitCode = 1;
});
