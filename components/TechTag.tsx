interface TechTagProps {
  label: string;
}

export default function TechTag({ label }: TechTagProps) {
  return (
    <li>
      <div className="rounded-full border border-border-subtle bg-slate-800/50 px-3 py-1 text-xs font-medium text-primary">
        {label}
      </div>
    </li>
  );
}
