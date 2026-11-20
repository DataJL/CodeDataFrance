import React, { useState } from 'react';
import { User as UserIcon } from 'lucide-react';
import { UserAccount } from '../types/athletics';

interface UserAvatarProps {
  user?: Partial<UserAccount> | {
    firstName?: string;
    lastName?: string;
    avatarColor?: string;
    avatarUrl?: string;
    email?: string;
  } | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showBorder?: boolean;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-xs',
  lg: 'w-11 h-11 text-sm',
  xl: 'w-16 h-16 text-lg',
  '2xl': 'w-24 h-24 text-2xl',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'md',
  className = '',
  showBorder = true,
}) => {
  const [imageError, setImageError] = useState(false);

  const firstName = user?.firstName || '';
  const lastName = user?.lastName || '';
  const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || (user?.email ? user.email.charAt(0).toUpperCase() : 'U');
  const bgColor = user?.avatarColor || '#0284C7';
  const sizeClass = sizeClasses[size] || sizeClasses.md;

  const hasImage = Boolean(user?.avatarUrl && !imageError);

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-2xl select-none overflow-hidden font-bold ${sizeClass} ${
        showBorder ? 'border border-slate-700/60 shadow-sm' : ''
      } ${className}`}
      style={{ backgroundColor: hasImage ? '#0f172a' : bgColor }}
    >
      {hasImage ? (
        <img
          src={user?.avatarUrl}
          alt={`${firstName} ${lastName}`}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className="text-white drop-shadow-sm flex items-center justify-center">
          {initials || <UserIcon className="w-1/2 h-1/2 text-white" />}
        </span>
      )}
    </div>
  );
};
