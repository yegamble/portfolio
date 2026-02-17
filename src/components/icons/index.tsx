import type { ReactNode } from 'react';

interface IconProps {
  className?: string;
}

interface BaseIconProps extends IconProps {
  viewBox: string;
  children: ReactNode;
}

function BaseIcon({ className, viewBox, children }: BaseIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function GitHubIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <BaseIcon viewBox="0 0 16 16" className={className}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </BaseIcon>
  );
}

export function LinkedInIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <BaseIcon viewBox="0 0 24 24" className={className}>
      <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.21-.43-1.56-1.1-1.56-.91 0-1.28.66-1.28 1.95V19h-3v-9h2.9v1.3c.36-.63 1.26-1.23 2.88-1.23 2.16 0 2.6 1.56 2.6 4.3z" />
    </BaseIcon>
  );
}

export function EmailIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <BaseIcon viewBox="0 0 24 24" className={className}>
      <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
      <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
    </BaseIcon>
  );
}

export function SecureEmailIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <BaseIcon viewBox="0 0 24 24" className={className}>
      <path
        fillRule="evenodd"
        d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3A5.25 5.25 0 0012 1.5zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5zM12 13.5a1.5 1.5 0 00-.75 2.803V17.25a.75.75 0 001.5 0v-.947A1.5 1.5 0 0012 13.5z"
        clipRule="evenodd"
      />
    </BaseIcon>
  );
}

export function ArrowOutwardIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <BaseIcon viewBox="0 0 20 20" className={className}>
      <path
        fillRule="evenodd"
        d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z"
        clipRule="evenodd"
      />
    </BaseIcon>
  );
}

export function ArrowRightIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <BaseIcon viewBox="0 0 20 20" className={className}>
      <path
        fillRule="evenodd"
        d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
        clipRule="evenodd"
      />
    </BaseIcon>
  );
}

export function FolderIcon({ className = 'h-9 w-9 text-primary/90' }: IconProps) {
  return (
    <BaseIcon viewBox="0 0 24 24" className={className}>
      <path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-15a3 3 0 00-3 3V18a3 3 0 003 3h15zM1.5 10.146V6a3 3 0 013-3h5.379a2.25 2.25 0 011.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 013 3v1.146A4.483 4.483 0 0019.5 9h-15a4.483 4.483 0 00-3 1.146z" />
    </BaseIcon>
  );
}

export function LayersIcon({ className = 'h-9 w-9 text-primary/90' }: IconProps) {
  return (
    <BaseIcon viewBox="0 0 24 24" className={className}>
      <path d="M11.644 1.59a.75.75 0 01.712 0l9.75 5.25a.75.75 0 010 1.32l-9.75 5.25a.75.75 0 01-.712 0l-9.75-5.25a.75.75 0 010-1.32l9.75-5.25z" />
      <path d="M3.265 10.602l7.668 4.129a2.25 2.25 0 002.134 0l7.668-4.13 1.37.739a.75.75 0 010 1.32l-9.75 5.25a.75.75 0 01-.71 0l-9.75-5.25a.75.75 0 010-1.32l1.37-.738z" />
      <path d="M3.265 15.602l7.668 4.129a2.25 2.25 0 002.134 0l7.668-4.13 1.37.739a.75.75 0 010 1.32l-9.75 5.25a.75.75 0 01-.71 0l-9.75-5.25a.75.75 0 010-1.32l1.37-.738z" />
    </BaseIcon>
  );
}
