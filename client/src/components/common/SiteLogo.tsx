'use client';

import React from 'react';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { formatDriveImageUrl } from '@/lib/drive';
import { GraduationCap } from 'lucide-react';

interface SiteLogoProps {
  className?: string;
  iconClassName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textClassName?: string;
  taglineClassName?: string;
  href?: string;
}

export const SiteLogo: React.FC<SiteLogoProps> = ({
  className = '',
  iconClassName = '',
  size = 'md',
  showText = false,
  textClassName = '',
  taglineClassName = '',
}) => {
  const { settings } = useSiteSettings();
  const logoUrl = settings?.logoUrl ? formatDriveImageUrl(settings.logoUrl) : '';

  const sizeBoxMap = {
    sm: 'w-7 h-7 rounded-lg text-xs',
    md: 'w-9 h-9 rounded-xl text-sm',
    lg: 'w-12 h-12 rounded-2xl text-base',
    xl: 'w-14 h-14 rounded-2xl text-lg',
  };

  const iconSizeMap = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
    xl: 'w-8 h-8',
  };

  const boxClasses = `${sizeBoxMap[size]} bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 overflow-hidden shrink-0 ${className}`;

  return (
    <div className="flex items-center gap-2.5">
      <div className={boxClasses}>
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={settings?.siteName || 'Logo'}
            className="w-full h-full object-cover"
          />
        ) : (
          <GraduationCap className={iconClassName || iconSizeMap[size]} />
        )}
      </div>

      {showText && (
        <div>
          <span
            className={`font-extrabold text-slate-900 dark:text-white text-base tracking-tight block leading-tight ${textClassName}`}
          >
            {settings?.siteName || 'গ্র্যাভ একাডেমি'}
          </span>
          <span
            className={`text-[11px] text-slate-500 dark:text-slate-400 block font-medium leading-tight ${taglineClassName}`}
          >
            {settings?.siteTagline || 'ক্লাস ৬ – ১২ একাডেমিক কেয়ার'}
          </span>
        </div>
      )}
    </div>
  );
};
