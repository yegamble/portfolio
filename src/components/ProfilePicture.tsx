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
      <div className="h-32 w-32 overflow-hidden rounded-full bg-slate-800 ring-2 ring-primary/50 sm:h-40 sm:w-40">
        <Image
          src="/images/profile.jpg"
          alt={t('hero.profileAlt')}
          width={160}
          height={160}
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );
}
