import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';

dotenv.config();

const backfillUserIds = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is missing');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(uri);
    console.log('Connected!');

    // Find all users missing userId or with null/empty userId
    const usersWithoutId = await User.find({
      $or: [{ userId: { $exists: false } }, { userId: null }, { userId: '' }],
    }).sort({ createdAt: 1 });

    console.log(`Found ${usersWithoutId.length} users needing User ID.`);

    // Group assignment by creation date so serial starts from 001 for each date
    const dateGroups: { [key: string]: typeof usersWithoutId } = {};

    for (const u of usersWithoutId) {
      const dateObj = u.createdAt ? new Date(u.createdAt) : new Date();
      const yy = String(dateObj.getFullYear()).slice(-2);
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      const dateKey = `${yy}${mm}${dd}`;

      if (!dateGroups[dateKey]) {
        dateGroups[dateKey] = [];
      }
      dateGroups[dateKey].push(u);
    }

    let updatedCount = 0;

    for (const [dateKey, group] of Object.entries(dateGroups)) {
      // Find highest existing seq for this dateKey
      const regex = new RegExp(`^${dateKey}(\\d{3})$`);
      const existingToday = await User.find({ userId: regex }).select('userId').sort({ userId: -1 }).limit(1);

      let seq = 1;
      if (existingToday.length > 0 && existingToday[0].userId) {
        const lastSeq = parseInt(existingToday[0].userId.slice(-3), 10);
        if (!isNaN(lastSeq)) {
          seq = lastSeq + 1;
        }
      }

      for (const user of group) {
        const newId = `${dateKey}${String(seq).padStart(3, '0')}`;
        await User.updateOne({ _id: user._id }, { $set: { userId: newId } });
        console.log(`✔ Assigned ${newId} to ${user.name} (${user.email || 'No email'})`);
        seq++;
        updatedCount++;
      }
    }

    console.log(`🎉 Successfully assigned User IDs to ${updatedCount} users!`);
    process.exit(0);
  } catch (err) {
    console.error('Error during backfill:', err);
    process.exit(1);
  }
};

backfillUserIds();
