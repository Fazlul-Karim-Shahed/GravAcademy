import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const migrate = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required to migrate enrollment indexes.');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const collection = mongoose.connection.db!.collection('enrollments');

  try {
    const indexes = await collection.indexes();
    for (const legacyIndex of ['studentId_1_batchId_1', 'studentId_1']) {
      if (indexes.some((index) => index.name === legacyIndex)) {
        await collection.dropIndex(legacyIndex);
        console.log(`Dropped legacy enrollment index: ${legacyIndex}`);
      }
    }

    const legacyFields = await collection.updateMany(
      { studentId: { $exists: true } },
      { $unset: { studentId: '' } }
    );

    const updatedIndexes = await collection.indexes();
    const gravIdBatchUnique = updatedIndexes.some(
      (index) => index.name === 'gravId_1_batchId_1' && index.unique === true
    );
    if (!gravIdBatchUnique) {
      await collection.createIndex({ gravId: 1, batchId: 1 }, { unique: true });
    }

    console.log(JSON.stringify({
      removedLegacyStudentIdFields: legacyFields.modifiedCount,
      gravIdBatchUniqueIndex: true,
      remainingIndexes: (await collection.indexes()).map((index) => index.name),
    }));
  } finally {
    await mongoose.disconnect();
  }
};

migrate().catch((error) => {
  console.error('Enrollment index migration failed:', error);
  process.exitCode = 1;
});
