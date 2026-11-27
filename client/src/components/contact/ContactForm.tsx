'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';

interface ContactFormProps {
  supportEmail: string;
  whatsappDigits?: string;
}

export default function ContactForm({ supportEmail, whatsappDigits }: ContactFormProps) {
  const [name, setName] = useState('');
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [subject, setSubject] = useState('ভর্তি ও ব্যাচ সংক্রান্ত');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const bodyText = `নাম: ${name}\nযোগাযোগ: ${phoneOrEmail}\nবিষয়: ${subject}\n\nবার্তা:\n${message}`;
    if (whatsappDigits) {
      window.open(`https://wa.me/${whatsappDigits}?text=${encodeURIComponent(bodyText)}`, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
    }
    setSubmitted(true);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {submitted && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>আপনার বার্তাটি পাঠানোর জন্য প্রস্তুত করা হয়েছে। আমাদের টিম শীঘ্রই যোগাযোগ করবে।</span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">আপনার নাম</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="যেমন: তানভীর আহমেদ"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-orange-500 focus:outline-none dark:border-[#262b34] dark:bg-[#151921] dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">মোবাইল নম্বর বা ইমেইল</label>
          <input
            type="text"
            required
            value={phoneOrEmail}
            onChange={(e) => setPhoneOrEmail(e.target.value)}
            placeholder="01XXXXXXXXX বা email@example.com"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-orange-500 focus:outline-none dark:border-[#262b34] dark:bg-[#151921] dark:text-white"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">বিষয়</label>
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-orange-500 focus:outline-none dark:border-[#262b34] dark:bg-[#151921] dark:text-white"
        >
          <option value="ভর্তি ও ব্যাচ সংক্রান্ত">ভর্তি ও ব্যাচ সংক্রান্ত</option>
          <option value="কোর্স ফি ও পেমেন্ট">কোর্স ফি ও পেমেন্ট</option>
          <option value="টেকনিক্যাল সহায়তা">টেকনিক্যাল সহায়তা</option>
          <option value="অন্যান্য প্রশ্ন">অন্যান্য প্রশ্ন</option>
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">আপনার বার্তা</label>
        <textarea
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="আপনার প্রশ্ন বা প্রয়োজনীয় তথ্য লিখুন..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-orange-500 focus:outline-none dark:border-[#262b34] dark:bg-[#151921] dark:text-white"
        />
      </div>

      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:from-orange-700 hover:to-orange-800"
      >
        <Send className="h-3.5 w-3.5" />
        <span>বার্তা পাঠান</span>
      </button>
    </form>
  );
}
