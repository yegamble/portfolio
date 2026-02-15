'use client';

import ScrambledText from '@/components/ScrambledText';

interface SectionHeaderProps {
  title: string;
  className?: string;
}

export default function SectionHeader({
  title,
  className = '',
}: SectionHeaderProps) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <h2 className="text-sm font-bold uppercase tracking-widest text-text-primary">
        <ScrambledText>{title}</ScrambledText>
      </h2>
      <div className="h-px flex-1 bg-slate-800" />
    </div>
  );
}
