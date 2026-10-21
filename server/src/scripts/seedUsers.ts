import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { ROLES } from '../types/roles';

dotenv.config();

const seedUsers = async () => {
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
    const passwordHash = await bcrypt.hash('Grav@123456', salt);

    const usersToCreate = [
      // 1 Admin
      {
        name: 'Mahmudul Hasan (Admin)',
        email: 'admin.mahmud@gravacademy.com',
        passwordHash,
        role: ROLES.ADMIN,
        phone: '+880 1711-223344',
        status: 'active' as const,
        emailVerified: true,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      },

      // 3 Teachers
      {
        name: 'Dr. Rafiqul Islam',
        email: 'rafiqul.physics@gravacademy.com',
        passwordHash,
        role: ROLES.TEACHER,
        phone: '+880 1812-334455',
        status: 'active' as const,
        emailVerified: true,
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
      },
      {
        name: 'Nusrat Jahan (Math)',
        email: 'nusrat.math@gravacademy.com',
        passwordHash,
        role: ROLES.TEACHER,
        phone: '+880 1913-445566',
        status: 'active' as const,
        emailVerified: true,
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
      },
      {
        name: 'Tanvir Hossain (Bangla & ICT)',
        email: 'tanvir.ict@gravacademy.com',
        passwordHash,
        role: ROLES.TEACHER,
        phone: '+880 1614-556677',
        status: 'active' as const,
        emailVerified: true,
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
      },

      // 3 Students
      {
        name: 'Samiul Alim (Class 10)',
        email: 'samiul.student@gravacademy.com',
        passwordHash,
        role: ROLES.STUDENT,
        phone: '+880 1715-667788',
        status: 'active' as const,
        emailVerified: true,
        avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250',
      },
      {
        name: 'Fariha Tasnim (Class 9)',
        email: 'fariha.student@gravacademy.com',
        passwordHash,
        role: ROLES.STUDENT,
        phone: '+880 1816-778899',
        status: 'active' as const,
        emailVerified: true,
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=250',
      },
      {
        name: 'Abrar Zahin (Class 8)',
        email: 'abrar.student@gravacademy.com',
        passwordHash,
        role: ROLES.STUDENT,
        phone: '+880 1917-889900',
        status: 'active' as const,
        emailVerified: true,
        avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=250',
      },

      // 3 Guardians
      {
        name: 'Anisur Rahman (Guardian of Samiul)',
        email: 'anisur.parent@gravacademy.com',
        passwordHash,
        role: ROLES.GUARDIAN,
        phone: '+880 1718-990011',
        status: 'active' as const,
        emailVerified: true,
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250',
      },
      {
        name: 'Naznin Sultana (Guardian of Fariha)',
        email: 'naznin.parent@gravacademy.com',
        passwordHash,
        role: ROLES.GUARDIAN,
        phone: '+880 1819-001122',
        status: 'active' as const,
        emailVerified: true,
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250',
      },
      {
        name: 'Kamrul Hasan (Guardian of Abrar)',
        email: 'kamrul.parent@gravacademy.com',
        passwordHash,
        role: ROLES.GUARDIAN,
        phone: '+880 1920-112233',
        status: 'active' as const,
        emailVerified: true,
        avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=250',
      },
    ];

    for (const u of usersToCreate) {
      const existing = await User.findOne({ email: u.email });
      if (!existing) {
        await User.create(u);
        console.log(`✅ Created ${u.role}: ${u.name} (${u.email})`);
      } else {
        await User.updateOne({ email: u.email }, { $set: u });
        console.log(`ℹ️ Updated ${u.role}: ${u.name}`);
      }
    }

    console.log('\n🎉 All 1 Admin, 3 Teachers, 3 Students, and 3 Guardians seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedUsers();
