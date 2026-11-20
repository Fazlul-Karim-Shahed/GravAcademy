import React from 'react';
import {
  Trophy,
  Target,
  Backpack,
  Rocket,
  Tent,
  BookOpenCheck,
  GraduationCap,
  Sparkles,
  Award,
  Flame,
  Zap,
  BookOpen,
  Star,
  ShieldCheck,
  ScrollText,
} from 'lucide-react';

export interface HeroCardItem {
  id: string;
  category: string;
  mainText: string;
  title: string;
  badge: string;
  link: string;
  icon: string;
  colorScheme: string;
  openInNewTab?: boolean;
}

export const DEFAULT_HERO_CARDS: HeroCardItem[] = [
  {
    id: '1',
    category: 'HSC',
    mainText: '২৬',
    title: 'HSC ২৬',
    badge: 'ভার্সিটি ও ইঞ্জি.',
    link: '/courses?class=Class%2012',
    icon: 'Trophy',
    colorScheme: 'sky',
  },
  {
    id: '2',
    category: 'HSC',
    mainText: '২৭',
    title: 'HSC ২৭',
    badge: 'বোর্ড স্ট্যান্ডার্ড',
    link: '/courses?class=Class%2011',
    icon: 'Target',
    colorScheme: 'blue',
  },
  {
    id: '3',
    category: 'HSC',
    mainText: '২৮',
    title: 'HSC ২৮',
    badge: 'ফুল কোর্স',
    link: '/courses?class=Class%2011',
    icon: 'Backpack',
    colorScheme: 'cyan',
  },
  {
    id: '4',
    category: 'SSC',
    mainText: '২৭',
    title: 'SSC ২৭',
    badge: 'লাইভ ও রিভিশন',
    link: '/courses?class=Class%2010',
    icon: 'Rocket',
    colorScheme: 'teal',
  },
  {
    id: '5',
    category: 'CLASS',
    mainText: '৯',
    title: '৯ম শ্রেণি',
    badge: 'নতুন কারিকুলাম',
    link: '/courses?class=Class%209',
    icon: 'Tent',
    colorScheme: 'emerald',
  },
  {
    id: '6',
    category: 'CLASS',
    mainText: '৬-৮',
    title: '৬ষ্ঠ - ৮ম',
    badge: 'বেসিক টু প্রো',
    link: '/courses?class=Class%208',
    icon: 'BookOpenCheck',
    colorScheme: 'teal',
  },
];

export const HERO_COLOR_SCHEMES = [
  { id: 'sky', label: 'আকাশি নীল (Sky Blue)', previewClass: 'from-[#38bdf8] via-[#0284c7] to-[#0369a1]' },
  { id: 'blue', label: 'রয়্যাল ব্লু (Royal Blue)', previewClass: 'from-[#60a5fa] via-[#2563eb] to-[#1d4ed8]' },
  { id: 'cyan', label: 'সায়ান অ্যাকোয়া (Cyan Aqua)', previewClass: 'from-[#38bdf8] via-[#0284c7] to-[#0f766e]' },
  { id: 'teal', label: 'টিল ব্লু (Teal Blue)', previewClass: 'from-[#38bdf8] via-[#0ea5e9] to-[#0284c7]' },
  { id: 'emerald', label: 'পান্না সবুজ (Emerald)', previewClass: 'from-[#34d399] via-[#059669] to-[#047857]' },
  { id: 'indigo', label: 'ইন্ডিগো (Indigo)', previewClass: 'from-[#818cf8] via-[#4f46e5] to-[#3730a3]' },
  { id: 'purple', label: 'পার্পল বেগুনি (Purple)', previewClass: 'from-[#c084fc] via-[#9333ea] to-[#6b21a8]' },
  { id: 'rose', label: 'গোলাপি লাল (Rose Red)', previewClass: 'from-[#fb7185] via-[#e11d48] to-[#9f1239]' },
  { id: 'amber', label: 'অ্যাম্বার গোল্ড (Amber Gold)', previewClass: 'from-[#fbbf24] via-[#d97706] to-[#b45309]' },
  { id: 'orange', label: 'ব্র্যান্ড অরেঞ্জ (Brand Orange)', previewClass: 'from-[#fb923c] via-[#ea580c] to-[#c2410c]' },
];

export const HERO_ICONS = [
  { id: 'Trophy', label: 'Trophy (ট্রফি)' },
  { id: 'Target', label: 'Target (টার্গেট)' },
  { id: 'Backpack', label: 'Backpack (স্কুলব্যাগ)' },
  { id: 'Rocket', label: 'Rocket (রকেট)' },
  { id: 'Tent', label: 'Tent (তাঁবু)' },
  { id: 'BookOpenCheck', label: 'BookOpenCheck (বই ও টিক)' },
  { id: 'GraduationCap', label: 'GraduationCap (গ্র্যাজুয়েশন ক্যাপ)' },
  { id: 'Sparkles', label: 'Sparkles (চকচকে তারা)' },
  { id: 'Award', label: 'Award (অ্যাওয়ার্ড ব্যাজ)' },
  { id: 'Flame', label: 'Flame (আগুনের শিখা)' },
  { id: 'Zap', label: 'Zap (বিদ্যুৎ)' },
  { id: 'BookOpen', label: 'BookOpen (খোলা বই)' },
  { id: 'Star', label: 'Star (স্টার)' },
  { id: 'ShieldCheck', label: 'ShieldCheck (সুরক্ষা শিল্ড)' },
  { id: 'ScrollText', label: 'ScrollText (সনদপত্র)' },
];

export function getHeroCardStyles(scheme: string) {
  switch (scheme) {
    case 'blue':
      return {
        bubbleBg: 'bg-gradient-to-b from-[#60a5fa] via-[#2563eb] to-[#1d4ed8]',
        border: 'border-sky-400/30',
        glow: 'glow-card-sky',
        badge: 'bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 shadow-red-600/30',
        categoryText: 'text-blue-100',
        hoverTitle: 'group-hover:text-sky-300',
      };
    case 'cyan':
      return {
        bubbleBg: 'bg-gradient-to-b from-[#38bdf8] via-[#0284c7] to-[#0f766e]',
        border: 'border-cyan-400/30',
        glow: 'glow-card-blue',
        badge: 'bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 shadow-blue-600/30',
        categoryText: 'text-cyan-100',
        hoverTitle: 'group-hover:text-cyan-300',
      };
    case 'teal':
      return {
        bubbleBg: 'bg-gradient-to-b from-[#38bdf8] via-[#0ea5e9] to-[#0284c7]',
        border: 'border-teal-500/30',
        glow: 'glow-card-teal',
        badge: 'bg-gradient-to-r from-sky-600 via-cyan-600 to-blue-600 shadow-cyan-600/30',
        categoryText: 'text-teal-100',
        hoverTitle: 'group-hover:text-teal-300',
      };
    case 'emerald':
      return {
        bubbleBg: 'bg-gradient-to-b from-[#34d399] via-[#059669] to-[#047857]',
        border: 'border-emerald-500/30',
        glow: 'glow-card-teal',
        badge: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 shadow-emerald-600/30',
        categoryText: 'text-emerald-100',
        hoverTitle: 'group-hover:text-emerald-300',
      };
    case 'indigo':
      return {
        bubbleBg: 'bg-gradient-to-b from-[#818cf8] via-[#4f46e5] to-[#3730a3]',
        border: 'border-indigo-400/30',
        glow: 'glow-card-blue',
        badge: 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-indigo-600/30',
        categoryText: 'text-indigo-100',
        hoverTitle: 'group-hover:text-indigo-300',
      };
    case 'purple':
      return {
        bubbleBg: 'bg-gradient-to-b from-[#c084fc] via-[#9333ea] to-[#6b21a8]',
        border: 'border-purple-400/30',
        glow: 'glow-card-blue',
        badge: 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 shadow-purple-600/30',
        categoryText: 'text-purple-100',
        hoverTitle: 'group-hover:text-purple-300',
      };
    case 'rose':
      return {
        bubbleBg: 'bg-gradient-to-b from-[#fb7185] via-[#e11d48] to-[#9f1239]',
        border: 'border-rose-400/30',
        glow: 'glow-card-blue',
        badge: 'bg-gradient-to-r from-rose-600 via-pink-600 to-red-600 shadow-rose-600/30',
        categoryText: 'text-rose-100',
        hoverTitle: 'group-hover:text-rose-300',
      };
    case 'amber':
      return {
        bubbleBg: 'bg-gradient-to-b from-[#fbbf24] via-[#d97706] to-[#b45309]',
        border: 'border-amber-400/30',
        glow: 'glow-card-sky',
        badge: 'bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 shadow-amber-600/30',
        categoryText: 'text-amber-100',
        hoverTitle: 'group-hover:text-amber-300',
      };
    case 'orange':
      return {
        bubbleBg: 'bg-gradient-to-b from-[#fb923c] via-[#ea580c] to-[#c2410c]',
        border: 'border-orange-400/30',
        glow: 'glow-card-sky',
        badge: 'bg-gradient-to-r from-orange-600 via-red-600 to-rose-600 shadow-orange-600/30',
        categoryText: 'text-orange-100',
        hoverTitle: 'group-hover:text-orange-300',
      };
    case 'sky':
    default:
      return {
        bubbleBg: 'bg-gradient-to-b from-[#38bdf8] via-[#0284c7] to-[#0369a1]',
        border: 'border-sky-400/30',
        glow: 'glow-card-sky',
        badge: 'bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 shadow-blue-600/30',
        categoryText: 'text-sky-100',
        hoverTitle: 'group-hover:text-sky-300',
      };
  }
}

export function HeroCardIcon({ name, className = 'w-12 h-12' }: { name?: string; className?: string }) {
  switch (name) {
    case 'Target':
      return <Target className={className} />;
    case 'Backpack':
      return <Backpack className={className} />;
    case 'Rocket':
      return <Rocket className={className} />;
    case 'Tent':
      return <Tent className={className} />;
    case 'BookOpenCheck':
      return <BookOpenCheck className={className} />;
    case 'GraduationCap':
      return <GraduationCap className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'Award':
      return <Award className={className} />;
    case 'Flame':
      return <Flame className={className} />;
    case 'Zap':
      return <Zap className={className} />;
    case 'BookOpen':
      return <BookOpen className={className} />;
    case 'Star':
      return <Star className={className} />;
    case 'ShieldCheck':
      return <ShieldCheck className={className} />;
    case 'ScrollText':
      return <ScrollText className={className} />;
    case 'Trophy':
    default:
      return <Trophy className={className} />;
  }
}
