'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { USFlagIcon, IsraelFlagIcon, RussiaFlagIcon } from '@/components/icons';
import { getLocalizedPathname, type AppLocale } from '@/lib/i18n';

interface LanguageOption {
  code: AppLocale;
  label: string;
  initials: string;
  Flag: (props: { className?: string }) => React.ReactElement;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', initials: 'EN', Flag: USFlagIcon },
  { code: 'he', label: 'עברית', initials: 'עב', Flag: IsraelFlagIcon },
  { code: 'ru', label: 'Русский', initials: 'RU', Flag: RussiaFlagIcon },
];

function buildLanguageHref(
  pathname: string | null,
  locale: AppLocale,
  searchParams: { toString(): string } | null
) {
  const localizedPath = getLocalizedPathname(pathname, locale);
  const query = searchParams?.toString() ?? '';

  return query ? `${localizedPath}?${query}` : localizedPath;
}

export default function LanguageSelector() {
  const { t, i18n } = useTranslation();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const menuId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const currentLang = LANGUAGES.find((language) => language.code === i18n.language) ?? LANGUAGES[0];

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current?.contains(event.target as Node)) {
        return;
      }

      close();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [close, isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        className="flex items-center gap-1.5 rounded-md border border-slate-700 px-2 py-1 text-xs font-bold tracking-wide text-text-muted transition-colors hover:border-primary hover:text-primary"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-label={t('language.selectLabel')}
      >
        <currentLang.Flag className="h-3.5 w-5" />
        <span>{currentLang.initials}</span>
      </button>

      {isOpen && (
        <div
          id={menuId}
          className="absolute end-0 top-full z-50 mt-1 min-w-[140px] rounded-md border border-slate-700 bg-slate-800 p-1 shadow-lg"
        >
          <nav aria-label={t('language.selectLabel')}>
            <ul className="space-y-1">
              {LANGUAGES.map((language) => {
                const isCurrent = language.code === i18n.language;
                const href = buildLanguageHref(pathname, language.code, searchParams);

                return (
                  <li key={language.code}>
                    <Link
                      href={href}
                      lang={language.code}
                      hrefLang={language.code}
                      prefetch={false}
                      aria-current={isCurrent ? 'page' : undefined}
                      onClick={() => {
                        void i18n.changeLanguage(language.code);
                        close();
                      }}
                      className={`flex items-center gap-2.5 rounded px-3 py-2 text-sm transition-colors ${
                        isCurrent
                          ? 'bg-slate-700/50 text-primary'
                          : 'text-text-muted hover:bg-slate-700 hover:text-text-primary'
                      }`}
                    >
                      <language.Flag className="h-3.5 w-5" />
                      <span className="flex-1 text-start">{language.label}</span>
                      <span className="text-xs font-bold tracking-wide opacity-60">
                        {language.initials}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
}
