import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';

dotenv.config();

const cleanOldUsers = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Missing MONGODB_URI');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);

    const oldEmails = [
      'admin.mahmud@gravacademy.com',
      'rafiqul.physics@gravacademy.com',
      'nusrat.math@gravacademy.com',
      'tanvir.ict@gravacademy.com',
      'samiul.student@gravacademy.com',
      'fariha.student@gravacademy.com',
      'abrar.student@gravacademy.com',
      'anisur.parent@gravacademy.com',
      'naznin.parent@gravacademy.com',
      'kamrul.parent@gravacademy.com',
    ];

    const result = await User.deleteMany({ email: { $in: oldEmails } });
    console.log(`🗑️ Successfully deleted ${result.deletedCount} old dummy accounts.`);

    const remaining = await User.find({}, { name: 1, email: 1, role: 1 });
    console.log('\n✅ Remaining active accounts in database:');
    remaining.forEach((u) => console.log(`• [${u.role.toUpperCase()}] ${u.name} (${u.email})`));

    process.exit(0);
  } catch (error) {
    console.error('Error cleaning users:', error);
    process.exit(1);
  }
};

cleanOldUsers();
