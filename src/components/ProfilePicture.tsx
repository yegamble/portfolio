'use client';

import Image from 'next/image';
import { useTranslation } from 'react-i18next';

interface ProfilePictureProps {
  className?: string;
}

export default function ProfilePicture({ className = '' }: ProfilePictureProps) {
  const { t } = useTranslation();

  return (
    <div className={`inline-block ${className}`}>
      <div className="relative h-32 w-32 overflow-hidden rounded-full bg-slate-800 ring-2 ring-primary/50 sm:h-40 sm:w-40">
        <svg
          viewBox="0 0 100 100"
          fill="currentColor"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
        >
          <circle cx="50" cy="50" r="50" opacity="0.1" />
          <circle cx="50" cy="38" r="16" opacity="0.2" />
          <ellipse cx="50" cy="80" rx="28" ry="20" opacity="0.2" />
        </svg>
        <Image
          src="/images/profile.jpg"
          alt={t('hero.profileAlt')}
          width={160}
          height={160}
          className="relative h-full w-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
    </div>
  );
}
