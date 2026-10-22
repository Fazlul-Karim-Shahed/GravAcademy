export type DayOfWeek = 'saturday' | 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

export interface ScheduleSlot {
  day: DayOfWeek;
  startTime: string; // e.g. "07:00 PM"
  endTime?: string;   // e.g. "08:30 PM"
  topic?: string;     // e.g. "Physics Math Problems" or "হায়ার ম্যাথ কনসেপ্ট"
}

export const DAYS_OF_WEEK: { key: DayOfWeek; labelEn: string; labelBn: string; shortBn: string }[] = [
  { key: 'saturday', labelEn: 'Saturday', labelBn: 'শনিবার', shortBn: 'শনি' },
  { key: 'sunday', labelEn: 'Sunday', labelBn: 'রবিবার', shortBn: 'রবি' },
  { key: 'monday', labelEn: 'Monday', labelBn: 'সোমবার', shortBn: 'সোম' },
  { key: 'tuesday', labelEn: 'Tuesday', labelBn: 'মঙ্গলবার', shortBn: 'মঙ্গল' },
  { key: 'wednesday', labelEn: 'Wednesday', labelBn: 'বুধবার', shortBn: 'বুধ' },
  { key: 'thursday', labelEn: 'Thursday', labelBn: 'বৃহস্পতিবার', shortBn: 'বৃহস্পতি' },
  { key: 'friday', labelEn: 'Friday', labelBn: 'শুক্রবার', shortBn: 'শুক্র' },
];

export const getDayInfo = (day: string) => {
  const normalized = (day || '').toLowerCase() as DayOfWeek;
  return DAYS_OF_WEEK.find((d) => d.key === normalized) || {
    key: normalized,
    labelEn: day,
    labelBn: day,
    shortBn: day,
  };
};

/**
 * Convert any time string (like "19:00", "07:00 PM", "7:00 pm", "19:00:00") to 12-hour format "07:00 PM"
 */
export const formatTo12Hour = (timeStr?: string): string => {
  if (!timeStr) return '';
  const trimmed = timeStr.trim();
  if (!trimmed) return '';

  // If already in 12-hour format like "07:00 PM" or "7:00 PM"
  const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM|am|pm)$/i);
  if (ampmMatch) {
    let hour = parseInt(ampmMatch[1], 10);
    const minute = ampmMatch[2];
    const period = ampmMatch[3].toUpperCase();
    if (hour === 0) hour = 12;
    if (hour > 12) hour = hour % 12 || 12;
    return `${hour.toString().padStart(2, '0')}:${minute} ${period}`;
  }

  // If in 24-hour format like "19:00" or "09:30"
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match24) {
    let hour = parseInt(match24[1], 10);
    const minute = match24[2];
    const period = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${hour.toString().padStart(2, '0')}:${minute} ${period}`;
  }

  return trimmed;
};

/**
 * Parse a time string into 12-hour components: hour (1-12), minute ("00", "15", "30", "45"), period ("AM"|"PM")
 */
export const parse12HourTime = (timeStr?: string) => {
  const formatted = formatTo12Hour(timeStr || '07:00 PM');
  const match = formatted.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match) {
    return {
      hour: parseInt(match[1], 10).toString().padStart(2, '0'),
      minute: match[2],
      period: match[3].toUpperCase() as 'AM' | 'PM',
    };
  }
  return { hour: '07', minute: '00', period: 'PM' as 'AM' | 'PM' };
};

/**
 * Compose 12-hour time string
 */
export const build12HourTime = (hour: string, minute: string, period: 'AM' | 'PM'): string => {
  const h = hour.padStart(2, '0');
  const m = minute.padStart(2, '0');
  return `${h}:${m} ${period}`;
};

/**
 * Automatically generate a clean scheduleText from weekly slots if empty
 */
export const formatScheduleSlots = (slots: ScheduleSlot[]): string => {
  if (!slots || slots.length === 0) return '';
  return slots
    .map((s) => {
      const dayInfo = getDayInfo(s.day);
      const start = formatTo12Hour(s.startTime);
      const end = s.endTime ? formatTo12Hour(s.endTime) : '';
      const timeStr = end ? `${start} - ${end}` : start;
      return `${dayInfo.shortBn} (${timeStr})`;
    })
    .join(', ');
};
