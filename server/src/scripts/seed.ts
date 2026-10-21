import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { ROLES } from '../types/roles';
import { Course } from '../models/Course';
import { Batch } from '../models/Batch';
import { Module, Section, Lesson } from '../models/ContentHierarchy';

dotenv.config();

const seed = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not defined in server/.env');
    process.exit(1);
  }

  try {
    console.log('Connecting to Online MongoDB Atlas...');
    await mongoose.connect(uri);
    console.log('Connected to MongoDB Atlas!');

    // 1. Create or ensure Superadmin
    const superadminEmail = 'admin@gravacademy.com';
    let superadmin = await User.findOne({ email: superadminEmail });

    if (!superadmin) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('Admin@123456', salt);

      superadmin = await User.create({
        name: 'Super Administrator',
        email: superadminEmail,
        passwordHash,
        role: ROLES.SUPERADMIN,
        status: 'active',
        emailVerified: true,
      });
      console.log('Superadmin user created: admin@gravacademy.com (Password: Admin@123456)');
    } else {
      console.log('Superadmin user already exists.');
    }

    // 2. Create Sample Courses for Class 6 - 10 if none exist
    const courseCount = await Course.countDocuments();
    if (courseCount === 0) {
      console.log('Seeding initial Class 6 - 12 courses...');
      
      const banglaCourse = await Course.create({
        title: 'Class 6 Bangla Comprehensive',
        slug: 'class-6-bangla-comprehensive',
        description: 'Complete syllabus coverage for Class 6 Bangla First & Second Paper with grammar, literature, and exercises.',
        gradeLevel: 'Class 6',
        subject: 'Bangla',
        courseFee: 1500,
        duration: '6 Months',
        isPublished: true,
      });

      const physicsCourse = await Course.create({
        title: 'Class 10 Physics Masterclass',
        slug: 'class-10-physics-masterclass',
        description: 'In-depth conceptual mastery for SSC Physics: Mechanics, Waves, Electricity, and Modern Physics.',
        gradeLevel: 'Class 10',
        subject: 'Physics',
        courseFee: 2500,
        duration: '1 Year',
        isPublished: true,
      });

      // 3. Create Sample Batch for Class 6 Bangla
      const batch1 = await Batch.create({
        name: 'Class 6 Bangla — Batch 1 (Regular)',
        courseId: banglaCourse._id,
        status: 'active',
        scheduleText: 'Sun, Tue, Thu 6:00 PM',
        capacity: 45,
      });

      // 4. Create sample hierarchy in Batch 1
      const mod1 = await Module.create({
        batchId: batch1._id,
        title: 'Module 1: Bangla Grammar Fundamentals',
        order: 0,
        isPublished: true,
      });

      const sec1 = await Section.create({
        batchId: batch1._id,
        moduleId: mod1._id,
        title: 'Section 1.1: Bhasha O Byakoron (ভাষা ও ব্যাকরণ)',
        order: 0,
      });

      await Lesson.create({
        batchId: batch1._id,
        moduleId: mod1._id,
        sectionId: sec1._id,
        title: 'Lesson 1: Introduction to Bangla Language Structure',
        order: 0,
        description: 'Detailed overview of language phonetics, alphabets, and origins.',
        youtubeVideoId: 'dQw4w9WgXcQ', // Sample video ID
        videoDurationSeconds: 1800,
        isPublished: true,
        resources: [
          {
            title: 'Lecture 1 Lecture Notes (Grammar Basics).pdf',
            type: 'pdf',
          },
        ],
      });

      await Lesson.create({
        batchId: batch1._id,
        moduleId: mod1._id,
        sectionId: sec1._id,
        title: 'Lesson 2: Shobdo O Pod Prokoron',
        order: 1,
        description: 'Parts of speech classification and identification in Bangla.',
        youtubeVideoId: 'dQw4w9WgXcQ',
        videoDurationSeconds: 2100,
        isPublished: true,
      });

      const mod2 = await Module.create({
        batchId: batch1._id,
        title: 'Module 2: Literature & Poetry Appreciation',
        order: 1,
        isPublished: true,
      });

      await Lesson.create({
        batchId: batch1._id,
        moduleId: mod2._id,
        title: 'Lesson 1: Shob Kotha (Poem Analysis)',
        order: 0,
        description: 'Detailed analysis of rhythm, theme, and author perspectives.',
        isPublished: true,
      });

      console.log('Seeded sample courses, batches, modules, and lessons!');
    } else {
      console.log(`Database already has ${courseCount} courses.`);
    }

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
