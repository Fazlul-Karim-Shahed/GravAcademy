import React from 'react';
import { User as UserIcon } from 'lucide-react';
import { formatDriveImageUrl } from '@/lib/drive';

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  role?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-11 h-11 text-sm',
  xl: 'w-14 h-14 text-base',
};

const iconSizes = {
  xs: 'w-3.5 h-3.5',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-7 h-7',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  avatarUrl,
  size = 'md',
  className = '',
  role,
}) => {
  const [imgError, setImgError] = React.useState(false);

  // If valid avatar image URL provided and hasn't errored
  if (avatarUrl && !imgError) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-2xl overflow-hidden shrink-0 border border-slate-200/80 dark:border-slate-800 shadow-2xs relative bg-slate-100 dark:bg-slate-800 ${className}`}
      >
        <img
          src={formatDriveImageUrl(avatarUrl)}
          alt={name || 'User'}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Fallback: Default avatar with stylized neutral gradient & friendly user silhouette
  const isTeacher = role === 'teacher';
  const isAdmin = role === 'admin' || role === 'superadmin';

  const bgStyle = isAdmin
    ? 'from-blue-600 to-indigo-600 text-white'
    : isTeacher
    ? 'from-purple-600 to-indigo-600 text-white'
    : 'from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 text-slate-600 dark:text-slate-300';

  return (
    <div
      className={`${sizeClasses[size]} rounded-2xl bg-gradient-to-br ${bgStyle} flex items-center justify-center font-bold shrink-0 border border-slate-200/80 dark:border-slate-700/60 shadow-2xs relative overflow-hidden select-none ${className}`}
      title={name}
    >
      {/* Subtle default user icon overlay */}
      <UserIcon className={`${iconSizes[size]} opacity-80 stroke-[2]`} />
    </div>
  );
};
