export interface InstructorCard {
  name: string;
  institution: string;
  department: string;
  exp: string;
  subjects: string[];
  badge: string;
  studentsCount: string;
  classesCount: string;
  photo: string;
}

export const DEFAULT_INSTRUCTOR_CARDS: InstructorCard[] = [
  { name: 'মাহমুদুল হাসান', institution: 'বুয়েট (BUET)', department: 'কম্পিউটার সায়েন্স অ্যান্ড ইঞ্জিনিয়ারিং', exp: '৮+ বছরের শিক্ষকতা অভিজ্ঞতা', subjects: ['উচ্চতর গণিত', 'পদার্থবিজ্ঞান'], badge: 'মাস্টার ট্রেইনার', studentsCount: '১৫,০০০+', classesCount: '৪৫০+ লাইভ ক্লাস', photo: '/images/teacher-2.jpg' },
  { name: 'রফিকুল ইসলাম', institution: 'ঢাকা বিশ্ববিদ্যালয় (DU)', department: 'ফলিত রসায়ন ও কেমিকৌশল বিভাগ', exp: '৬+ বছরের শিক্ষকতা অভিজ্ঞতা', subjects: ['রসায়ন', 'সাধারণ বিজ্ঞান'], badge: 'বোর্ড স্পেশালিস্ট', studentsCount: '১২,০০০+', classesCount: '৩৮০+ লাইভ ক্লাস', photo: '/images/teacher-3.jpg' },
  { name: 'তানভীর আহমেদ', institution: 'ঢাকা মেডিকেল কলেজ (DMC)', department: 'এমবিবিএস (MBBS)', exp: '৫+ বছরের শিক্ষকতা অভিজ্ঞতা', subjects: ['জীববিজ্ঞান', 'তথ্য ও যোগাযোগ প্রযুক্তি'], badge: 'সিনিয়র মেন্টর', studentsCount: '১০,০০০+', classesCount: '৩২০+ লাইভ ক্লাস', photo: '/images/teacher-1.jpg' },
  { name: 'ফারজানা আক্তার', institution: 'বুয়েট (BUET - EEE)', department: 'তড়িৎ ও ইলেকট্রনিক কৌশল', exp: '৬+ বছরের শিক্ষকতা অভিজ্ঞতা', subjects: ['পদার্থবিজ্ঞান', 'উচ্চতর গণিত'], badge: 'কনসেপ্ট স্পেশালিস্ট', studentsCount: '১১,০০০+', classesCount: '৩৬০+ লাইভ ক্লাস', photo: '/images/teacher-2.jpg' },
];
