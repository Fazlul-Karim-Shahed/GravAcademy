'use client';

import React from 'react';
import {
  ScheduleSlot,
  DAYS_OF_WEEK,
  DayOfWeek,
  parse12HourTime,
  build12HourTime,
} from '@/lib/schedule';
import { Calendar, Clock, Plus, Trash2, BookOpen, X } from 'lucide-react';

interface WeeklyScheduleBuilderProps {
  slots: ScheduleSlot[];
  onChange: (slots: ScheduleSlot[]) => void;
}

const HOURS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

interface Time12PickerProps {
  label: string;
  value?: string;
  onChange: (time12: string) => void;
}

function Time12Picker({ label, value, onChange }: Time12PickerProps) {
  const parsed = parse12HourTime(value);

  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(build12HourTime(e.target.value, parsed.minute, parsed.period));
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(build12HourTime(parsed.hour, e.target.value, parsed.period));
  };

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(build12HourTime(parsed.hour, parsed.minute, e.target.value as 'AM' | 'PM'));
  };

  return (
    <div className="w-full">
      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1 truncate">
        <Clock className="w-3 h-3 text-indigo-500 shrink-0" />
        <span className="truncate">{label}</span>
      </label>
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1.5 shadow-2xs h-10">
        <div className="flex items-center gap-0.5">
          {/* Hour */}
          <select
            value={parsed.hour}
            onChange={handleHourChange}
            className="appearance-none bg-transparent text-xs font-black text-slate-900 dark:text-white px-1.5 py-0.5 rounded-md focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer text-center"
            title="Hour"
          >
            {HOURS.map((h) => (
              <option key={h} value={h} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                {h}
              </option>
            ))}
          </select>

          <span className="text-slate-400 font-black text-xs select-none px-0.5">:</span>

          {/* Minute */}
          <select
            value={parsed.minute}
            onChange={handleMinuteChange}
            className="appearance-none bg-transparent text-xs font-semibold text-slate-900 dark:text-white px-1.5 py-0.5 rounded-md focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer text-center"
            title="Minute"
          >
            {MINUTES.map((m) => (
              <option key={m} value={m} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* AM / PM */}
        <select
          value={parsed.period}
          onChange={handlePeriodChange}
          className="appearance-none bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 text-[11px] font-black px-2 py-0.5 rounded-lg focus:outline-none cursor-pointer text-center"
          title="AM or PM"
        >
          <option value="AM" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">AM</option>
          <option value="PM" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">PM</option>
        </select>
      </div>
    </div>
  );
}

export default function WeeklyScheduleBuilder({ slots, onChange }: WeeklyScheduleBuilderProps) {
  const handleAddSlot = (day: DayOfWeek = 'saturday') => {
    const newSlot: ScheduleSlot = {
      day,
      startTime: '07:00 PM',
      endTime: '08:30 PM',
      topic: 'Lecture Day',
    };
    onChange([...slots, newSlot]);
  };

  const handleUpdateSlot = (index: number, updated: Partial<ScheduleSlot>) => {
    const next = [...slots];
    next[index] = { ...next[index], ...updated };
    onChange(next);
  };

  const handleRemoveSlot = (index: number) => {
    onChange(slots.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-500" />
            সাপ্তাহিক রুটিন ও নির্দিষ্ট ক্লাসের সময়সূচী (Day & Time Slots)
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            প্রতিটি দিনের জন্য আলাদা সময় (১২-ঘণ্টা AM / PM) ও বিষয় নির্ধারণ করুন।
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleAddSlot('saturday')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> ক্লাস স্লট যোগ করুন
        </button>
      </div>

      {slots.length === 0 ? (
        <div className="p-6 text-center rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800">
          <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            কোনো নির্দিষ্ট সাপ্তাহিক ক্লাস রুটিন যুক্ত করা হয়নি
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5 mb-3">
            দিনভিত্তিক ক্লাস নির্ধারণ করতে ওপরের &apos;ক্লাস স্লট যোগ করুন&apos; বাটন অথবা দ্রুত দিনের শর্টকাটে ক্লিক করুন:
          </p>

          <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-md mx-auto">
            {DAYS_OF_WEEK.map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => handleAddSlot(d.key)}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold hover:border-indigo-500 hover:text-indigo-600 transition-colors shadow-2xs"
              >
                + {d.labelBn}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {slots.map((slot, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 transition-all hover:border-indigo-300 dark:hover:border-indigo-800 shadow-2xs"
            >
              {/* Responsive Grid for Day, Times, and Delete */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">
                {/* 1. Day Column (Span 4 on Desktop) */}
                <div className="lg:col-span-4">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    বার / দিন (Day)
                  </label>
                  <select
                    value={slot.day}
                    onChange={(e) => handleUpdateSlot(idx, { day: e.target.value as DayOfWeek })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:border-indigo-500 h-10 shadow-2xs"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d.key} value={d.key}>
                        {d.labelBn} ({d.labelEn})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Start Time Column (Span 3 on Desktop) */}
                <div className="lg:col-span-3">
                  <Time12Picker
                    label="শুরু (Start Time)"
                    value={slot.startTime}
                    onChange={(val) => handleUpdateSlot(idx, { startTime: val })}
                  />
                </div>

                {/* 3. End Time Column (Span 3 on Desktop) */}
                <div className="lg:col-span-3">
                  <Time12Picker
                    label="শেষ (End Time)"
                    value={slot.endTime || '08:30 PM'}
                    onChange={(val) => handleUpdateSlot(idx, { endTime: val })}
                  />
                </div>

                {/* 4. Delete Action (Span 2 on Desktop) */}
                <div className="lg:col-span-2 flex items-center justify-end sm:justify-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveSlot(idx)}
                    className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors h-10 w-full flex items-center justify-center gap-1.5 border border-slate-200/60 dark:border-slate-800 hover:border-rose-200 dark:hover:border-rose-900 text-xs font-semibold"
                    title="Remove this slot"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>মুছুন</span>
                  </button>
                </div>
              </div>

              {/* Topic / Note Row */}
              <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
                <input
                  type="text"
                  value={slot.topic ?? 'Lecture Day'}
                  onChange={(e) => handleUpdateSlot(idx, { topic: e.target.value })}
                  placeholder="ক্লাসের পাঠ্য বিষয় / টপিক (যেমন: Lecture Day)"
                  className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
                />
                {slot.topic && slot.topic !== 'Lecture Day' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateSlot(idx, { topic: 'Lecture Day' })}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 shrink-0 px-2 py-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="রিসেট করে Lecture Day করুন"
                  >
                    <span>ডিফল্ট</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
