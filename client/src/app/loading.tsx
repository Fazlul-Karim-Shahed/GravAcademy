import React from 'react';

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border-2 border-blue-500/20 border-t-blue-600 animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
          অনুগ্রহ করে অপেক্ষা করুন...
        </p>
      </div>
    </div>
  );
}
