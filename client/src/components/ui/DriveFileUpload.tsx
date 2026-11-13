'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { formatDriveImageUrl } from '@/lib/drive';
import { Loader2, Upload } from 'lucide-react';
import { FileUploadField } from './FileUploadField';

interface DriveFileUploadProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  helperText?: string;
  accept?: string;
}

export const DriveFileUpload: React.FC<DriveFileUploadProps> = ({
  label = 'File upload',
  value,
  onChange,
  placeholder = 'https://drive.google.com/...',
  helperText = 'Select a file, then press Upload to save it to Drive.',
  accept = 'image/jpeg,image/png,image/webp,image/gif,application/pdf',
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const uploadSelectedFile = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setProgress(0);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          if (event.total) setProgress(Math.round((event.loaded * 100) / event.total));
        },
      });
      if (!res.data?.success || !res.data?.data) throw new Error(res.data?.message || 'Upload failed.');
      let uploadedUrl = res.data.data.url || res.data.data.fileUrl || `/api/documents/${res.data.data._id}/stream`;
      if (selectedFile.type.startsWith('image/')) uploadedUrl = formatDriveImageUrl(uploadedUrl);
      onChange(uploadedUrl);
      setSelectedFile(null);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'File upload failed.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-2">
      <FileUploadField
        label={label}
        selectedFile={selectedFile}
        onFileChange={(file) => { setError(''); setSelectedFile(file); }}
        urlValue={value}
        onUrlChange={onChange}
        urlPlaceholder={placeholder}
        accept={accept}
        disabled={uploading}
        maxSizeMb={25}
      />
      <button
        type="button"
        onClick={uploadSelectedFile}
        disabled={!selectedFile || uploading}
        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        <span>{uploading ? `Uploading${progress ? ` ${progress}%` : '...'}` : 'Upload selected file'}</span>
      </button>
      {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}
      {!error && helperText && <p className="text-[11px] text-slate-400">{helperText}</p>}
    </div>
  );
};
