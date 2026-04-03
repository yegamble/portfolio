'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { USFlagIcon, IsraelFlagIcon, RussiaFlagIcon } from '@/components/icons';

interface LanguageOption {
  code: string;
  label: string;
  initials: string;
  Flag: (props: { className?: string }) => React.ReactElement;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', initials: 'EN', Flag: USFlagIcon },
  { code: 'he', label: 'עברית', initials: 'עב', Flag: IsraelFlagIcon },
  { code: 'ru', label: 'Русский', initials: 'RU', Flag: RussiaFlagIcon },
];

const AUTO_CLOSE_DELAY = 1500;

export default function LanguageSelector() {
  const isEnabled = process.env.NEXT_PUBLIC_I18N_ENABLED === 'true';
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];

  const close = useCallback(() => {
    setIsOpen(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const selectLanguage = useCallback(
    (code: string) => {
      i18n.changeLanguage(code);
      close();
    },
    [i18n, close]
  );

  // Click outside handler
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, close]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  const handleMouseLeave = () => {
    if (!isOpen) return;
    timerRef.current = setTimeout(() => {
      setIsOpen(false);
      timerRef.current = null;
    }, AUTO_CLOSE_DELAY);
  };

  const handleMouseEnter = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  if (!isEnabled) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 rounded-md border border-slate-700 px-2 py-1 text-xs font-bold tracking-wide text-text-muted transition-colors hover:border-primary hover:text-primary"
        aria-label={t('language.selectLabel')}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <currentLang.Flag className="h-3.5 w-5" />
        <span>{currentLang.initials}</span>
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label={t('language.selectLabel')}
          className="absolute end-0 top-full z-50 mt-1 min-w-[140px] overflow-hidden rounded-md border border-slate-700 bg-slate-800 shadow-lg"
        >
          {LANGUAGES.map((lang) => {
            const isCurrent = lang.code === i18n.language;
            return (
              <button
                key={lang.code}
                type="button"
                role="option"
                aria-selected={isCurrent}
                onClick={() => selectLanguage(lang.code)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                  isCurrent
                    ? 'bg-slate-700/50 text-primary'
                    : 'text-text-muted hover:bg-slate-700 hover:text-text-primary'
                }`}
              >
                <lang.Flag className="h-3.5 w-5" />
                <span className="flex-1 text-start">{lang.label}</span>
                <span className="text-xs font-bold tracking-wide opacity-60">{lang.initials}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
