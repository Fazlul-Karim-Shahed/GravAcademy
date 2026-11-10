'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  ExternalLink,
  Download,
  FileText,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
  fileName?: string;
}

export default function DocumentPreviewModal({
  isOpen,
  onClose,
  title,
  url,
  fileName,
}: DocumentPreviewModalProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Reset loading whenever URL changes
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
    }
  }, [url, isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !url) return null;

  // Determine if URL is a direct image
  const isImage =
    url.startsWith('data:image/') ||
    url.startsWith('blob:') ||
    url.includes('googleusercontent.com') ||
    /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(url);

  // Normalize Drive URL for iframe embedding
  const getEmbeddableUrl = (rawUrl: string): string => {
    if (rawUrl.includes('drive.google.com/file/d/')) {
      const match = rawUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `https://drive.google.com/file/d/${match[1]}/preview`;
      }
      return rawUrl.replace('/view', '/preview');
    }
    return rawUrl;
  };

  const previewUrl = getEmbeddableUrl(url);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all duration-300 ${
          isFullScreen
            ? 'fixed inset-2 sm:inset-4 rounded-2xl z-50'
            : 'w-full max-w-5xl h-[88vh] rounded-3xl'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              {isImage ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            </div>
            <div className="truncate">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {title || fileName || 'ডকুমেন্ট প্রিভিউ'}
              </h3>
              {fileName && (
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                  {fileName}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Open in New Tab Fallback */}
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              title="নতুন ট্যাবে খুলুন"
              className="p-2 rounded-xl text-slate-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullScreen((prev) => !prev)}
              title={isFullScreen ? 'ছোট করুন' : 'ফুলস্ক্রিন'}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              title="বন্ধ করুন (Esc)"
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content / Preview Area */}
        <div className="relative flex-1 w-full h-full bg-slate-100 dark:bg-slate-950 overflow-hidden flex items-center justify-center">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-50/90 dark:bg-slate-900/90 z-10">
              <Loader2 className="w-8 h-8 text-purple-600 dark:text-purple-400 animate-spin" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                ডকুমেন্ট লোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...
              </p>
            </div>
          )}

          {isImage ? (
            <div className="w-full h-full p-4 flex items-center justify-center overflow-auto bg-slate-900/95">
              <img
                src={url}
                alt={title || 'Document preview'}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                onLoad={() => setLoading(false)}
                onError={() => setLoading(false)}
              />
            </div>
          ) : (
            <iframe
              src={previewUrl}
              className="w-full h-full border-0"
              allow="autoplay"
              title={title || 'Document Preview'}
              onLoad={() => setLoading(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
