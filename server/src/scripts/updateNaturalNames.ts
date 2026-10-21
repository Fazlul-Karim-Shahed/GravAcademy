import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';

dotenv.config();

const updateNaturalNames = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Missing MONGODB_URI');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);

    const naturalProfiles = [
      {
        email: 'admin1@gravacademy.com',
        name: 'Mahmudul Hasan',
      },
      {
        email: 'teacher1@gravacademy.com',
        name: 'Dr. Rafiqul Islam',
      },
      {
        email: 'teacher2@gravacademy.com',
        name: 'Nusrat Jahan',
      },
      {
        email: 'teacher3@gravacademy.com',
        name: 'Tanvir Hossain',
      },
      {
        email: 'student1@gravacademy.com',
        name: 'Samiul Alim',
      },
      {
        email: 'student2@gravacademy.com',
        name: 'Fariha Tasnim',
      },
      {
        email: 'student3@gravacademy.com',
        name: 'Abrar Zahin',
      },
      {
        email: 'guardian1@gravacademy.com',
        name: 'Anisur Rahman',
      },
      {
        email: 'guardian2@gravacademy.com',
        name: 'Naznin Sultana',
      },
      {
        email: 'guardian3@gravacademy.com',
        name: 'Kamrul Hasan',
      },
    ];

    for (const p of naturalProfiles) {
      await User.updateOne({ email: p.email }, { $set: { name: p.name } });
      console.log(`✅ Updated ${p.email} -> Name: "${p.name}"`);
    }

    console.log('\n🎉 All account names updated to natural Bangladeshi human names!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating names:', error);
    process.exit(1);
  }
};

updateNaturalNames();
