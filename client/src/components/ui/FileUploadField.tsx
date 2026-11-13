'use client';

import React, { useRef, useState } from 'react';
import { CheckCircle2, Eye, UploadCloud, X } from 'lucide-react';

interface FileUploadFieldProps {
  selectedFile: File | null;
  onFileChange: (file: File | null) => void;
  multiple?: boolean;
  selectedFiles?: File[];
  onFilesChange?: (files: File[]) => void;
  onError?: (message: string) => void;
  existingUrl?: string;
  existingFileName?: string;
  onPreviewExisting?: () => void;
  onClearExisting?: () => void;
  label?: string;
  accept?: string;
  maxSizeMb?: number;
  disabled?: boolean;
  urlValue?: string;
  onUrlChange?: (value: string) => void;
  urlPlaceholder?: string;
}

export const FileUploadField: React.FC<FileUploadFieldProps> = ({
  selectedFile,
  onFileChange,
  multiple = false,
  selectedFiles = [],
  onFilesChange,
  onError,
  existingUrl = '',
  existingFileName = '',
  onPreviewExisting,
  onClearExisting,
  label = 'File upload',
  accept = 'image/*,application/pdf',
  maxSizeMb = 25,
  disabled = false,
  urlValue,
  onUrlChange,
  urlPlaceholder = 'https://drive.google.com/...',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const oversized = files.find((file) => file.size > maxSizeMb * 1024 * 1024);
    if (oversized) {
      const message = `File size must be ${maxSizeMb} MB or less.`;
      setErrorMessage(message);
      onError?.(message);
      onFileChange(null);
      onFilesChange?.(selectedFiles);
      event.target.value = '';
      return;
    }
    setErrorMessage('');
    if (multiple && onFilesChange) {
      onFilesChange([...selectedFiles, ...files]);
    } else {
      onFileChange(files[0]);
    }
  };

  const removeSelected = () => {
    setErrorMessage('');
    onFileChange(null);
    onFilesChange?.([]);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-2 min-w-0 max-w-full">
      {label && <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>}
      <div className="min-w-0 max-w-full overflow-hidden p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
        <div className="flex min-w-0 max-w-full flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">
              <UploadCloud className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Select a file</span>
            </div>
            <input
              ref={inputRef}
              type="file"
              multiple={multiple}
              accept={accept}
              onChange={handleChange}
              disabled={disabled}
              className="block min-w-0 max-w-full w-full text-xs file:mr-2 file:py-2.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer disabled:opacity-60"
            />
          </div>
          {onUrlChange && (
            <>
              <span className="text-xs text-slate-500 text-center sm:text-left shrink-0">or add link</span>
              <input
                type="url"
                value={urlValue || ''}
                onChange={(event) => onUrlChange(event.target.value)}
                placeholder={urlPlaceholder}
                disabled={disabled}
                className="flex-1 min-w-0 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white disabled:opacity-60"
              />
            </>
          )}
        </div>

        {multiple && selectedFiles.length > 0 ? (
          <div className="mt-3 space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={`${file.name}-${file.lastModified}-${index}`} className="flex min-w-0 items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60 text-xs">
                <span className="min-w-0 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span className="truncate">{file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                </span>
                <button type="button" onClick={() => onFilesChange?.(selectedFiles.filter((_, itemIndex) => itemIndex !== index))} className="shrink-0 text-rose-600 hover:text-rose-700 font-bold inline-flex items-center gap-1">
                  <X className="w-3.5 h-3.5" /> Remove
                </button>
              </div>
            ))}
          </div>
        ) : selectedFile ? (
          <div className="mt-3 flex min-w-0 max-w-full items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60 text-xs">
            <span className="min-w-0 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="truncate">Selected: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
            </span>
            <button type="button" onClick={removeSelected} className="shrink-0 text-rose-600 hover:text-rose-700 font-bold inline-flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Remove
            </button>
          </div>
        ) : (existingUrl || urlValue) ? (
          <div className="mt-3 flex min-w-0 max-w-full items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
            <span className="min-w-0 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span className="truncate">Attached: {existingFileName || 'File'}</span>
            </span>
            {(onPreviewExisting || onClearExisting) && (
              <div className="flex items-center gap-2 shrink-0">
                {onPreviewExisting && <button type="button" onClick={onPreviewExisting} className="text-blue-600 hover:underline inline-flex items-center gap-1 font-semibold"><Eye className="w-3.5 h-3.5" /> View</button>}
                {onClearExisting && <button type="button" onClick={onClearExisting} className="text-rose-600 hover:underline font-semibold">Remove</button>}
              </div>
            )}
          </div>
        ) : null}
      </div>
      {errorMessage ? <p className="text-[11px] text-rose-600 font-semibold">{errorMessage}</p> : <p className="text-[11px] text-slate-400">Max {maxSizeMb} MB. Upload starts only after submit/save.</p>}
    </div>
  );
};
