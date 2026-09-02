'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { USFlagIcon, IsraelFlagIcon, RussiaFlagIcon, EstoniaFlagIcon } from '@/components/icons';
import { getDirection, getLocalizedPathname, type AppLocale } from '@/lib/i18n';

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
  { code: 'et', label: 'Eesti', initials: 'ET', Flag: EstoniaFlagIcon },
];

// The href is the localized pathname only. A query string would have to come
// from useSearchParams, which opts the whole route out of static rendering
// unless it sits under a Suspense boundary — and this site has no query-string
// routes. A live query/hash is re-attached from window.location on selection.
function buildLanguageHref(pathname: string | null, locale: AppLocale) {
  return getLocalizedPathname(pathname, locale);
}

// Landmarks worth pinning: the hero, the content sections and the footer. The
// sticky page header is excluded (it never drifts) and so are the per-job
// <header> elements inside Experience, which are far too small to anchor on.
const ANCHOR_SELECTOR = 'header + section, main section, footer';

/**
 * Keep the content the reader is looking at visually stationary while the page
 * reflows into the new language. Different languages have different text
 * lengths, so content above the fold grows/shrinks and would otherwise jerk the
 * whole page up or down. We pin the landmark currently under the viewport
 * centre and scroll to cancel its drift for the duration of the transition.
 * Cancels immediately on any user scroll/keypress so it never fights the reader.
 *
 * MUST be called before the language mutation, not after: `startTop` is sampled
 * synchronously, and setting documentElement.lang alone already reflows the page
 * (globals.css swaps the font stack on `html:lang(he)`, so the still-untranslated
 * Hebrew text re-wraps in Inter's metrics). Measured on a production build,
 * he->en with #experience at top 112: the lang flip alone moved it to 141.25, so
 * sampling afterwards pinned the page 29px away from where the reader left it.
 *
 * The window has to outlast the whole cipher animation. The last reflow is the
 * animating ghost structure unmounting when the scramble finishes (~1.6s after
 * the click), and the loop only sees it if it is still polling.
 */
function pinViewportDuringReflow(durationMs = 2000) {
  if (typeof window === 'undefined' || typeof requestAnimationFrame !== 'function') {
    return;
  }

  const centerY = window.innerHeight / 2;
  const anchor = Array.from(document.querySelectorAll<HTMLElement>(ANCHOR_SELECTOR)).find((el) => {
    const rect = el.getBoundingClientRect();
    return rect.top <= centerY && rect.bottom >= centerY;
  });
  if (!anchor) return;

  const startTop = anchor.getBoundingClientRect().top;
  const deadline = performance.now() + durationMs;
  let active = true;

  const stop = () => {
    active = false;
    window.removeEventListener('wheel', stop);
    window.removeEventListener('touchstart', stop);
    window.removeEventListener('keydown', stop);
  };
  window.addEventListener('wheel', stop, { passive: true });
  window.addEventListener('touchstart', stop, { passive: true });
  window.addEventListener('keydown', stop);

  const compensate = (now: number) => {
    if (!active) return;
    const drift = anchor.getBoundingClientRect().top - startTop;
    // Poll for the whole window and scroll only when there is drift to cancel.
    // Settling early on still frames is not safe here: the reflow arrives in
    // bursts (a production build commits the i18n store in a microtask after
    // the handler, and the scramble structure unmounts ~1.6s later), so a loop
    // that stops after the first quiet frames abandons the later ones. A rect
    // read per frame for two seconds is far cheaper than the animation it is
    // riding alongside.
    if (Math.abs(drift) >= 1) {
      // behavior:'instant' is required. Per CSSOM View, 'auto' defers to the
      // element's CSS scroll-behavior, which globals.css sets to `smooth`, so
      // each correction would ease over 7-16 frames and the page would visibly
      // glide back instead of never appearing to move. On a production build one
      // instant correction is all it takes (+117px desktop he->en and en->ru,
      // +263px mobile en->ru, all in a single frame ~90ms after the click).
      window.scrollBy({ top: drift, behavior: 'instant' });
    }
    if (now < deadline) {
      requestAnimationFrame(compensate);
    } else {
      stop();
    }
  };
  requestAnimationFrame(compensate);
}

export default function LanguageSelector() {
  const { t, i18n } = useTranslation();
  const pathname = usePathname();
  const menuId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [openedByKeyboard, setOpenedByKeyboard] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find((language) => language.code === i18n.language) ?? LANGUAGES[0];

  const close = useCallback(() => {
    setIsOpen(false);
    setOpenedByKeyboard(false);
  }, []);

  const selectLanguage = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, language: LanguageOption, href: string) => {
      // Let the browser handle modifier / non-primary clicks so the localized URL
      // can still open in a new tab, etc.
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      event.preventDefault();
      close();
      // Closing unmounts the link that currently has focus, which would strand
      // keyboard and screen-reader users on <body>.
      triggerRef.current?.focus({ preventScroll: true });

      if (language.code === i18n.language) {
        return;
      }

      // Sample the reader's viewport anchor before anything mutates: the lang
      // flip below reflows the page on its own.
      pinViewportDuringReflow();

      // Flip <html lang/dir> synchronously (before the next paint) so RTL/LTR
      // direction never lags the new text by a frame, then animate the text in
      // place via i18n. We deliberately avoid a Next.js route navigation here:
      // navigating remounts the tree, which both cuts the cipher decrypt animation
      // short and causes a layout jump. history.replaceState keeps the URL (and a
      // refresh / share / crawl) on the correct localized route without remounting.
      document.documentElement.lang = language.code;
      document.documentElement.dir = getDirection(language.code);
      void i18n.changeLanguage(language.code).then(() => {
        // Nothing else tells assistive tech the page just changed language —
        // the text swaps in place with no navigation and no focus change.
        setAnnouncement(`${i18n.t('language.current')}: ${language.label}`);
      });
      window.history.replaceState(
        window.history.state,
        '',
        `${href}${window.location.search}${window.location.hash}`
      );
    },
    [close, i18n]
  );

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLAnchorElement>('a[hreflang]') ?? []
    );
    if (items.length === 0) return;

    const current = items.indexOf(document.activeElement as HTMLAnchorElement);
    let next: number;

    switch (event.key) {
      case 'ArrowDown':
        next = current < 0 ? 0 : (current + 1) % items.length;
        break;
      case 'ArrowUp':
        next = current < 0 ? items.length - 1 : (current - 1 + items.length) % items.length;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = items.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    items[next]?.focus({ preventScroll: true });
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    setOpenedByKeyboard(true);
    setIsOpen(true);
  };

  // Opened from the keyboard: put focus on the current language so the arrow
  // keys have somewhere to start. Pointer users keep focus on the trigger.
  useEffect(() => {
    if (!isOpen || !openedByKeyboard) return;
    const menu = menuRef.current;
    const target =
      menu?.querySelector<HTMLAnchorElement>('a[aria-current="page"]') ??
      menu?.querySelector<HTMLAnchorElement>('a[hreflang]');
    target?.focus({ preventScroll: true });
  }, [isOpen, openedByKeyboard]);

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
        triggerRef.current?.focus({ preventScroll: true });
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
        onClick={(event) => {
          // detail === 0 means Enter/Space, not a pointer.
          setOpenedByKeyboard(event.detail === 0);
          setIsOpen((previous) => !previous);
        }}
        onKeyDown={handleTriggerKeyDown}
        className="flex items-center gap-1.5 rounded-md border border-slate-700 px-2 py-1 text-xs font-bold tracking-wide text-text-muted transition-colors hover:border-primary hover:text-primary"
        aria-expanded={isOpen}
        aria-controls={menuId}
      >
        <currentLang.Flag className="h-3.5 w-5" />
        {/* WCAG 2.5.3: the accessible name has to contain the visible label, so
            the description is part of the button's own text rather than an
            aria-label that replaces "EN" with something a speech-input user
            cannot see. */}
        <span className="sr-only">{t('language.selectLabel')}: </span>
        <span>{currentLang.initials}</span>
      </button>

      {isOpen && (
        <div
          id={menuId}
          ref={menuRef}
          onKeyDown={handleMenuKeyDown}
          className="absolute end-0 top-full z-50 mt-1 min-w-[140px] rounded-md border border-slate-700 bg-slate-800 p-1 shadow-lg"
        >
          <nav aria-label={t('language.selectLabel')}>
            <ul className="space-y-1">
              {LANGUAGES.map((language) => {
                const isCurrent = language.code === i18n.language;
                const href = buildLanguageHref(pathname, language.code);

                return (
                  <li key={language.code}>
                    <a
                      href={href}
                      lang={language.code}
                      hrefLang={language.code}
                      aria-current={isCurrent ? 'page' : undefined}
                      onClick={(event) => selectLanguage(event, language, href)}
                      className={`flex items-center gap-2.5 rounded px-3 py-2 text-sm transition-colors ${
                        isCurrent
                          ? 'bg-slate-700/50 text-primary'
                          : 'text-text-secondary hover:bg-slate-700 hover:text-text-primary'
                      }`}
                    >
                      <language.Flag className="h-3.5 w-5" />
                      <span className="flex-1 text-start">{language.label}</span>
                      <span className="text-xs font-bold tracking-wide">{language.initials}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      )}

      {/* Outside the button so the announcement never becomes part of the
          trigger's accessible name. */}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
