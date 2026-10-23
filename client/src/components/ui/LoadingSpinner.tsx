'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: string; // Optional custom border-t color
}

export function LoadingSpinner({
  size = 'md',
  className = '',
  color,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 rounded-lg border-2',
    md: 'w-10 h-10 rounded-xl border-2',
    lg: 'w-12 h-12 rounded-2xl border-2',
    xl: 'w-16 h-16 rounded-[22px] border-[3px]',
  };

  return (
    <div
      className={`bg-blue-600/10 border-blue-500/20 border-t-blue-600 animate-spin mx-auto ${sizeClasses[size]} ${className}`}
      style={color ? { borderTopColor: color } : undefined}
    />
  );
}

interface PageLoaderProps {
  message?: string;
  minHeight?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function PageLoader({
  message = 'তথ্য লোড হচ্ছে...',
  minHeight = 'min-h-[50vh]',
  size = 'lg',
}: PageLoaderProps) {
  return (
    <div
      className={`w-full ${minHeight} flex items-center justify-center bg-transparent`}
    >
      <div className="text-center space-y-3.5">
        <LoadingSpinner size={size} />
        {message && (
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wide animate-pulse">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
