import { api } from './api';

export interface AcademicClassFeature {
  title: string;
  description: string;
  icon?: string;
}

export interface AcademicClassFAQ {
  question: string;
  answer: string;
}

export interface AcademicClassItem {
  _id: string;
  name: string;
  slug?: string;
  order: number;
  description?: string;
  subtitle?: string;
  heroBannerUrl?: string;
  curriculumHighlights?: string[];
  features?: AcademicClassFeature[];
  faqs?: AcademicClassFAQ[];
  subjects?: string[];
  createdAt?: string;
}

const STORAGE_KEY = 'grav_academic_classes';

export const DEFAULT_ACADEMIC_CLASSES: AcademicClassItem[] = [
  {
    _id: 'class-6',
    name: 'Class 6',
    slug: 'class-6',
    order: 1,
    subtitle: '৬ষ্ঠ শ্রেণির পূর্ণাঙ্গ ফাউন্ডেশন ও নতুন কারিকুলাম প্রস্তুতি',
    description: 'নতুন শিক্ষাক্রমের আলোকে কনসেপ্ট ক্লিয়ারিং, এক্টিভিটি ও হ্যান্ডস-অন প্রজেক্ট ভিত্তিক শিখন।',
    curriculumHighlights: ['নতুন শিক্ষাক্রম অনুযায়ী অধ্যায়ভিত্তিক ক্লাস', 'সাপ্তাহিক ও মাসিক প্রগ্রেস মূল্যায়ন', 'অভিভাবক মিটিং ও নিয়মিত ফিডব্যাক'],
    features: [
      { title: 'লাইভ ইন্টারঅ্যাক্টিভ ক্লাস', description: 'অভিজ্ঞ শিক্ষকদের সাথে সরাসরি প্রশ্নোত্তরের সুযোগ।' },
      { title: 'ডিজিটাল লেকচার নোটস', description: 'প্রতিটি অধ্যায়ের গোছানো পিডিএফ ও রিভিশন শিট।' },
      { title: 'হোমওয়ার্ক ও মূল্যায়ন', description: 'নিয়মিত হোমওয়ার্ক চেকিং ও প্র্যাকটিস সেশন।' },
    ],
    faqs: [
      { question: 'ক্লাসগুলো কীভাবে অনুষ্ঠিত হবে?', answer: 'সবগুলো ক্লাস প্ল্যাটফর্মের নিজস্ব লাইভ ক্লাসরুমের মাধ্যমে সরাসরি ইন্টারঅ্যাক্টিভভাবে নেওয়া হবে।' },
      { question: 'রেকর্ডেড ক্লাস পাওয়া যাবে কি?', answer: 'হ্যাঁ, লাইভ ক্লাস শেষে ক্লাসরুমে সম্পূর্ণ রেকর্ডিং ও নোটস পাওয়া যাবে।' },
    ],
    subjects: [],
  },
  {
    _id: 'class-7',
    name: 'Class 7',
    slug: 'class-7',
    order: 2,
    subtitle: '৭ম শ্রেণির বেসিক অ্যান্ড কনসেপ্ট বিল্ডিং প্রোগ্রাম',
    description: 'বিজ্ঞান ও গণিতের ভীতি দূর করে বাস্তবভিত্তিক ধারণার মাধ্যমে উচ্চতর দক্ষতার প্রস্তুতি।',
    curriculumHighlights: ['গণিত ও বিজ্ঞানের কনসেপ্ট মাস্টারক্লাস', 'নিয়মিত কুইজ ও অধ্যায়ভিত্তিক এসেসমেন্ট', '২৪/৭ ডাউট সলভিং সাপোর্ট'],
    features: [
      { title: 'অভিজ্ঞ মেন্টর প্যানেল', description: 'শীর্ষস্থানীয় বিশ্ববিদ্যালয়ের মেধাবী শিক্ষকবৃন্দ।' },
      { title: 'স্মার্ট প্র্যাকটিস টেস্ট', description: 'পরীক্ষাভীতি কাটাতে নিয়মিত মডেল টেস্ট।' },
      { title: 'পার্সোনালাইজড কেয়ার', description: 'দুর্বল বিষয়ের জন্য আলাদা রিভিশন ও মনিটরিং।' },
    ],
    faqs: [
      { question: 'কোন কোন বিষয় পড়ানো হবে?', answer: 'পাঠ্যক্রমের প্রধান প্রধান সব মৌলিক বিষয় পূর্ণাঙ্গভাবে কভার করা হয়।' },
    ],
    subjects: [],
  },
  {
    _id: 'class-8',
    name: 'Class 8',
    slug: 'class-8',
    order: 3,
    subtitle: '৮ম শ্রেণির বোর্ড পরীক্ষার ভিত্তি ও জুনিয়র স্কিল ডেভেলপমেন্ট',
    description: 'মাধ্যমিক স্তরে প্রবেশের পূর্বে মূল বিষয়সমূহের ওপর গভীর ধারণা অর্জন ও ধারাবাহিক প্রস্তুতি।',
    curriculumHighlights: ['মৌলিক সূত্রের গভীরে শেখা', 'সৃজনশীল প্রশ্নের উত্তর লেখার সহজ কৌশল', 'অধ্যায়ভিত্তিক রিভিশন ও প্র্যাকটিস শিট'],
    features: [
      { title: 'টপিকভিত্তিক স্পেশাল ক্লাস', description: 'কঠিন অধ্যায়গুলোর উপর বিশেষ আলোচনা ও ডাউট ক্লিয়ারিং।' },
      { title: 'অভিভাবক ড্যাশবোর্ড', description: 'সন্তানের উপস্থিতি ও ফলাফল সার্বক্ষণিক পর্যবেক্ষণের সুবিধা।' },
    ],
    subjects: [],
  },
  {
    _id: 'class-9',
    name: 'Class 9',
    slug: 'class-9',
    order: 4,
    subtitle: '৯ম শ্রেণির বিজ্ঞান, বাণিজ্য ও মানবিক বিভাগের ফাউন্ডেশন',
    description: 'এসএসসি পরীক্ষার সিলেবাসের অর্ধেক অংশ নবম শ্রেণিতেই সর্বোচ্চ গুরুত্ব দিয়ে সম্পূর্ণ করার নিশ্চয়তা।',
    curriculumHighlights: ['পদার্থ, রসায়ন, উচ্চতর গণিত ও জীববিজ্ঞানের ফাউন্ডেশন', 'গাণিতিক সমস্যার শর্টকাট ও বেসিক টেকনিক', 'সাপ্তাহিক রিটেন ও এমসিকিউ টেস্ট'],
    features: [
      { title: 'বোর্ড স্ট্যান্ডার্ড এক্সাম', description: 'বোর্ড পরীক্ষার অনুরূপ প্রশ্নপত্রে নিয়মিত পরীক্ষা।' },
      { title: 'স্পেশাল গাইডেন্স', description: 'পড়াশোনার রুটিন ও ক্যারিয়ার প্ল্যানিং সেশন।' },
    ],
    subjects: [],
  },
  {
    _id: 'class-10',
    name: 'Class 10',
    slug: 'class-10',
    order: 5,
    subtitle: '১০ম শ্রেণির এসএসসি গোল্ডেন এ+ টার্গেট প্রোগ্রাম',
    description: 'টেস্ট পরীক্ষা ও বোর্ড পরীক্ষায় শতভাগ সফলতার জন্য টেস্ট পেপার সলভ ও এক্সক্লুসিভ মডেল টেস্ট।',
    curriculumHighlights: ['বোর্ড কোশ্চেন ও শীর্ষ স্কুলের প্রশ্ন বিশ্লেষণ', 'ফুল সিলেবাস স্পেশাল রিভিশন সাইকেল', 'টাইম ম্যানেজমেন্ট ও মডেল টেস্ট সিরিজ'],
    features: [
      { title: 'এক্সক্লুসিভ টেস্ট পেপার সলভ', description: 'বিগত বছরের প্রশ্ন ও শীর্ষ স্কুলের প্রশ্নের সমাধান।' },
      { title: 'টপার স্ট্র্যাটেজি সেশন', description: 'বোর্ড শীর্ষ মেধাবীদের টিপস ও গাইডলাইন।' },
    ],
    subjects: [],
  },
  {
    _id: 'class-11',
    name: 'Class 11',
    slug: 'class-11',
    order: 6,
    subtitle: '১১শ শ্রেণির এইচএসসি ও অ্যাডমিশন ফাউন্ডেশন',
    description: 'কলেজ জীবনের শুরু থেকেই কঠিন তত্ত্বসমূহ সহজে আয়ত্ত করে ইঞ্জিনিয়ারিং, মেডিকেল ও ভার্সিটির ভিত্তি তৈরি।',
    curriculumHighlights: ['উচ্চমাধ্যমিক পদার্থ, রসায়ন, গণিত ও জীববিজ্ঞানের বুনিয়াদি ব্যাচ', 'কলেজের প্রথম ও দ্বিতীয় টার্মের ১০০% প্রস্তুতি', 'কনসেপচুয়াল ও এডমিশন ওরিয়েন্টেড ক্লাস'],
    features: [
      { title: 'বুয়েট-মেডিকেলিয়ানদের মেন্টরশিপ', description: 'সরাসরি অভিজ্ঞতা শেয়ারিং ও গাইডলাইন।' },
      { title: 'উন্নত স্টাডি ম্যাটেরিয়াল', description: 'স্ট্যান্ডার্ড প্র্যাকটিস বুকলেট ও লেকচার নোট।' },
    ],
    subjects: [],
  },
  {
    _id: 'class-12',
    name: 'Class 12',
    slug: 'class-12',
    order: 7,
    subtitle: '১২শ শ্রেণির এইচএসসি ফাইনাল রিভিশন ও বিশ্ববিদ্যালয় ভর্তি প্রস্তুতি',
    description: 'বোর্ড পরীক্ষায় জিপিএ ৫ নিশ্চিত করা এবং পাশাপাশি সেরা বিশ্ববিদ্যালয়ে ভর্তির জন্য যুগোপযোগী প্রস্তুতি।',
    curriculumHighlights: ['দ্রুত ও কার্যকর সম্পূর্ণ সিলেবাস রিভিশন', 'মেগা মডেল টেস্ট ও ওএমআর এসেসমেন্ট', 'ভার্সিটি ও ইঞ্জিনিয়ারিং প্রশ্নব্যাংক আলোচনা'],
    features: [
      { title: 'মেগা মডেল টেস্ট', description: 'সারাদেশের শিক্ষার্থীদের সাথে প্রতিযোগিতা করার সুযোগ।' },
      { title: 'এডমিশন অ্যাডভান্সড ট্রিকস', description: 'কম সময়ে নির্ভুল উত্তর বের করার টেকনিক।' },
    ],
    subjects: [],
  },
];

/**
 * Single source of truth to fetch academic classes across the whole app.
 * If backend responds with classes, it caches them in localStorage and returns them.
 * If backend is 404/down or empty, it returns the locally persisted classes.
 */
export async function getSharedAcademicClasses(): Promise<AcademicClassItem[]> {
  try {
    const res = await api.get('/classes');
    if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(res.data.data));
      }
      return res.data.data;
    }
  } catch (err) {
    // Backend offline / 404 before git push
  }

  // Fallback to single shared storage
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to read classes from localStorage:', e);
    }
  }

  return DEFAULT_ACADEMIC_CLASSES;
}

/**
 * Single source of truth to save academic classes across the whole app.
 */
export async function saveSharedAcademicClasses(updatedList: AcademicClassItem[]): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
      // Dispatch custom window event so any open component/tab updates instantly
      window.dispatchEvent(new Event('grav_classes_updated'));
    } catch (e) {
      console.warn('Failed to write classes to localStorage:', e);
    }
  }
}

/**
 * Generate a consistent URL slug for a class
 */
export function getClassSlug(cls: AcademicClassItem | { name: string; slug?: string }): string {
  if (cls.slug && cls.slug.trim()) return cls.slug.trim().toLowerCase();
  return cls.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

