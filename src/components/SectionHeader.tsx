import type { ReactNode } from 'react';

interface SectionHeaderProps {
  title: ReactNode;
  className?: string;
}

export default function SectionHeader({
  title,
  className = '',
}: SectionHeaderProps) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <h2 className="text-sm font-bold uppercase tracking-widest text-text-primary">
        {title}
      </h2>
      <div className="h-px flex-1 bg-slate-800" role="separator" />
    </div>
  );
}
