import CipherText from '@/components/CipherText';

interface TechTagProps {
  label: string;
}

export default function TechTag({ label }: TechTagProps) {
  return (
    <li>
      <div className="rounded-full border border-border-subtle bg-slate-800/50 px-3 py-1 text-xs font-medium text-primary">
        <CipherText>{label}</CipherText>
      </div>
    </li>
  );
}
