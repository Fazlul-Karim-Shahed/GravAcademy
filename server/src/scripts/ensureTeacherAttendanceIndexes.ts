import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const ensureIndexes = async () => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required.');
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const collection = mongoose.connection.db!.collection('teacherattendances');
    await collection.createIndex(
      { teacherId: 1, batchId: 1, attendanceDate: 1 },
      { unique: true, name: 'teacherId_1_batchId_1_attendanceDate_1' }
    );
    await collection.createIndex(
      { attendanceDate: -1, teacherId: 1 },
      { name: 'attendanceDate_-1_teacherId_1' }
    );
    console.log(JSON.stringify({ indexes: (await collection.indexes()).map((index) => index.name) }));
  } finally {
    await mongoose.disconnect();
  }
};

ensureIndexes().catch((error) => {
  console.error('Failed to ensure teacher attendance indexes:', error);
  process.exitCode = 1;
});
