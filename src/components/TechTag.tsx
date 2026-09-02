import CipherText from '@/components/CipherText';

interface TechTagProps {
  label: string;
}

export default function TechTag({ label }: TechTagProps) {
  return (
    <li>
      {/* Every label comes from src/data/*, which is English-only and never
          translated, so it stays English inside the Hebrew, Russian and
          Estonian pages. Marking the part keeps a screen reader from reading it
          with the surrounding language's phonetics. */}
      <div
        lang="en"
        className="rounded-full border border-border-subtle bg-slate-800/50 px-3 py-1 text-xs font-medium text-primary"
      >
        <CipherText>{label}</CipherText>
      </div>
    </li>
  );
}
