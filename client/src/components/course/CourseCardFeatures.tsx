import {
  PlayCircle,
  FileText,
  Award,
  BookOpen,
  CheckCircle,
  Star,
  HelpCircle,
  Clock,
  Video,
  Bookmark,
  Users,
  Layers,
  LucideIcon,
} from 'lucide-react';

export interface CourseCardFeature {
  text: string;
  icon?: string;
}

export const AVAILABLE_FEATURE_ICONS: { [key: string]: { label: string; icon: LucideIcon } } = {
  play: { label: 'ভিডিও / লাইভ', icon: PlayCircle },
  sheet: { label: 'লেকচার শিট / নোট', icon: FileText },
  exam: { label: 'টেস্ট / অ্যাসেসমেন্ট', icon: Award },
  book: { label: 'বই / পাঠ্যবই', icon: BookOpen },
  check: { label: 'চেক / নিশ্চয়তা', icon: CheckCircle },
  star: { label: 'স্টার / বিশেষ', icon: Star },
  help: { label: 'ডাউট সলভ / সাপোর্ট', icon: HelpCircle },
  clock: { label: 'সময়সূচী / রুটিন', icon: Clock },
  video: { label: 'মিট / লাইভ রুম', icon: Video },
  bookmark: { label: 'হ্যান্ডনোট / গাইড', icon: Bookmark },
  users: { label: 'মেন্টর / ডিসকাশন', icon: Users },
  layer: { label: 'অধ্যায় / মডিউল', icon: Layers },
};

export const DEFAULT_CARD_FEATURES: string[] = [
  'লাইভ ক্লাস ও সার্বক্ষণিক ডাউট সলভ',
  'অধ্যায়ভিত্তিক লেকচার শিট ও নোট',
  'অনলাইন উইকলি টেস্ট ও এনালাইসিস',
];

const DEFAULT_FEATURE_STYLES = [
  { icon: PlayCircle, colorBg: 'bg-blue-100 dark:bg-blue-950/60', colorText: 'text-blue-600 dark:text-blue-400' },
  { icon: FileText, colorBg: 'bg-purple-100 dark:bg-purple-950/60', colorText: 'text-purple-600 dark:text-purple-400' },
  { icon: Award, colorBg: 'bg-emerald-100 dark:bg-emerald-950/60', colorText: 'text-emerald-600 dark:text-emerald-400' },
  { icon: Star, colorBg: 'bg-amber-100 dark:bg-amber-950/60', colorText: 'text-amber-600 dark:text-amber-400' },
  { icon: HelpCircle, colorBg: 'bg-indigo-100 dark:bg-indigo-950/60', colorText: 'text-indigo-600 dark:text-indigo-400' },
];

/**
 * Parses feature string or object:
 * Features can be stored as either:
 * - "লাইভ ক্লাস ও সার্বক্ষণিক ডাউট সলভ" (plain text, uses rotating default icons)
 * - "icon:play|লাইভ ক্লাস ও সার্বক্ষণিক ডাউট সলভ" (explicit icon syntax)
 * - or JSON string / object
 */
export function parseFeatureItem(raw: any, index: number) {
  let text = '';
  let iconKey = '';

  if (typeof raw === 'string') {
    if (raw.startsWith('icon:') && raw.includes('|')) {
      const parts = raw.split('|');
      iconKey = parts[0].replace('icon:', '').trim().toLowerCase();
      text = parts.slice(1).join('|').trim();
    } else {
      text = raw.trim();
    }
  } else if (raw && typeof raw === 'object') {
    text = raw.text || raw.label || '';
    iconKey = raw.icon || '';
  }

  const defaultStyle = DEFAULT_FEATURE_STYLES[index % DEFAULT_FEATURE_STYLES.length];
  const matched = AVAILABLE_FEATURE_ICONS[iconKey];

  return {
    text,
    IconComponent: matched ? matched.icon : defaultStyle.icon,
    colorBg: defaultStyle.colorBg,
    colorText: defaultStyle.colorText,
    iconKey: matched ? iconKey : (index === 0 ? 'play' : index === 1 ? 'sheet' : index === 2 ? 'exam' : 'star'),
  };
}

export function CourseCardFeatures({ features }: { features?: any[] }) {
  const listToRender = Array.isArray(features) && features.length > 0 ? features : DEFAULT_CARD_FEATURES;

  return (
    <div className="space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
      {listToRender.map((item, idx) => {
        const { text, IconComponent, colorBg, colorText } = parseFeatureItem(item, idx);
        if (!text) return null;
        return (
          <div key={idx} className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded-full ${colorBg} ${colorText} flex items-center justify-center shrink-0`}>
              <IconComponent className="w-3.5 h-3.5" />
            </div>
            <span className="line-clamp-1">{text}</span>
          </div>
        );
      })}
    </div>
  );
}
