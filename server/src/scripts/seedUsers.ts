import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { ROLES } from '../types/roles';

dotenv.config();

const seedSimpleUsers = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is missing');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(uri);
    console.log('Connected!');

    const salt = await bcrypt.genSalt(10);
    // Easy requested password: 123456
    const passwordHash = await bcrypt.hash('123456', salt);

    const simpleUsers = [
      // 1 Admin
      {
        name: 'Admin User',
        email: 'admin1@gravacademy.com',
        passwordHash,
        role: ROLES.ADMIN,
        phone: '+880 1711-000001',
        status: 'active' as const,
        emailVerified: true,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      },

      // 3 Teachers
      {
        name: 'Teacher One (Physics)',
        email: 'teacher1@gravacademy.com',
        passwordHash,
        role: ROLES.TEACHER,
        phone: '+880 1812-000001',
        status: 'active' as const,
        emailVerified: true,
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
      },
      {
        name: 'Teacher Two (Mathematics)',
        email: 'teacher2@gravacademy.com',
        passwordHash,
        role: ROLES.TEACHER,
        phone: '+880 1812-000002',
        status: 'active' as const,
        emailVerified: true,
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
      },
      {
        name: 'Teacher Three (Bangla & ICT)',
        email: 'teacher3@gravacademy.com',
        passwordHash,
        role: ROLES.TEACHER,
        phone: '+880 1812-000003',
        status: 'active' as const,
        emailVerified: true,
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
      },

      // 3 Students
      {
        name: 'Student One',
        email: 'student1@gravacademy.com',
        passwordHash,
        role: ROLES.STUDENT,
        phone: '+880 1715-000001',
        status: 'active' as const,
        emailVerified: true,
        avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250',
      },
      {
        name: 'Student Two',
        email: 'student2@gravacademy.com',
        passwordHash,
        role: ROLES.STUDENT,
        phone: '+880 1715-000002',
        status: 'active' as const,
        emailVerified: true,
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=250',
      },
      {
        name: 'Student Three',
        email: 'student3@gravacademy.com',
        passwordHash,
        role: ROLES.STUDENT,
        phone: '+880 1715-000003',
        status: 'active' as const,
        emailVerified: true,
        avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=250',
      },

      // 3 Guardians
      {
        name: 'Guardian One',
        email: 'guardian1@gravacademy.com',
        passwordHash,
        role: ROLES.GUARDIAN,
        phone: '+880 1920-000001',
        status: 'active' as const,
        emailVerified: true,
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250',
      },
      {
        name: 'Guardian Two',
        email: 'guardian2@gravacademy.com',
        passwordHash,
        role: ROLES.GUARDIAN,
        phone: '+880 1920-000002',
        status: 'active' as const,
        emailVerified: true,
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250',
      },
      {
        name: 'Guardian Three',
        email: 'guardian3@gravacademy.com',
        passwordHash,
        role: ROLES.GUARDIAN,
        phone: '+880 1920-000003',
        status: 'active' as const,
        emailVerified: true,
        avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=250',
      },
    ];

    for (const u of simpleUsers) {
      await User.findOneAndUpdate(
        { email: u.email },
        { $set: u },
        { upsert: true, new: true }
      );
      console.log(`✅ Upserted ${u.role}: ${u.email} (Password: 123456)`);
    }

    console.log('\n🎉 Successfully created all simple test accounts!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedSimpleUsers();
