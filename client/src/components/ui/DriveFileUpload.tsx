'use client';

import React, { useRef, useState } from 'react';
import { api } from '@/lib/api';
import { formatDriveImageUrl } from '@/lib/drive';
import { Upload, X, Loader2, Image as ImageIcon, Link as LinkIcon, CheckCircle } from 'lucide-react';

interface DriveFileUploadProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  helperText?: string;
  accept?: string;
}

export const DriveFileUpload: React.FC<DriveFileUploadProps> = ({
  label = 'ছবি বা থাম্বনেইল আপলোড করুন (Google Drive)',
  value,
  onChange,
  placeholder = 'https://drive.google.com/... অথবা নিচে থেকে ফাইল আপলোড করুন',
  helperText = 'ছবি সরাসরি নির্বাচন করুন, এটি স্বয়ংক্রিয়ভাবে ড্রাইভে আপলোড হয়ে লিংক বসে যাবে।',
  accept = 'image/jpeg,image/png,image/webp,image/gif,application/pdf',
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setError('ফাইলের আকার ২৫ মেগাবাইটের বেশি হতে পারবে না।');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percentCompleted);
          }
        },
      });

      if (res.data?.success && res.data?.data) {
        let uploadedUrl = res.data.data.url || res.data.data.fileUrl || `/api/documents/${res.data.data._id}/stream`;
        if (file.type.startsWith('image/')) {
          uploadedUrl = formatDriveImageUrl(uploadedUrl);
        }
        onChange(uploadedUrl);
      } else {
        setError(res.data?.message || 'আপলোড ব্যর্থ হয়েছে।');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'ফাইল ড্রাইভে আপলোড করতে সমস্যা হয়েছে।');
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          {label}
        </label>
      )}

      {/* Input Row: Direct URL / Preview + Upload Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <LinkIcon className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-rose-500"
              title="মুছে ফেলুন"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Upload Trigger Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-75 shrink-0 min-w-[150px]"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{progress > 0 && progress < 100 ? `আপলোড হচ্ছে ${progress}%` : progress === 100 ? 'প্রসেসিং হচ্ছে...' : 'আপলোড হচ্ছে...'}</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span>ফাইল আপলোড করুন</span>
            </>
          )}
        </button>
      </div>

      {/* Upload Progress Bar */}
      {uploading && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping inline-block" />
              {progress === 100 ? 'সার্ভার ও ড্রাইভে ফাইলটি সংরক্ষণ করা হচ্ছে...' : 'ফাইল আপলোড হচ্ছে...'}
            </span>
            <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
              {progress}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.max(progress, 5)}%` }}
            />
          </div>
        </div>
      )}

      {/* Image Preview if value looks like image URL */}
      {value && (
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <div className="w-14 h-10 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 relative">
            <img
              src={formatDriveImageUrl(value)}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                // hide on error
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>ড্রাইভ ফাইল লিংক সংযুক্ত রয়েছে</span>
            </span>
            <span className="text-[10px] text-slate-400 truncate block">
              {value}
            </span>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
          {error}
        </p>
      )}

      {helperText && !error && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          {helperText}
        </p>
      )}
    </div>
  );
};
