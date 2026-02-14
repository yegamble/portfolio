'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const navItems = [
  { label: 'About', href: '#about' },
  { label: 'Experience', href: '#experience' },
  { label: 'Projects', href: '#projects' },
];

export default function ScrollHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsScrolled(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-64px 0px 0px 0px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Sticky Navigation Bar */}
      <header
        className={`sticky top-0 z-50 w-full transition-colors duration-500 ease-out motion-reduce:duration-0 ${
          isScrolled
            ? 'border-b border-slate-800/50 bg-slate-900/95 backdrop-blur-md'
            : 'border-b border-transparent bg-slate-900'
        }`}
      >
        <div
          className={`mx-auto flex h-16 w-full max-w-5xl items-center px-6 transition-all duration-500 ease-out motion-reduce:duration-0 lg:px-8 ${
            isScrolled ? 'justify-between' : 'justify-center'
          }`}
        >
          {/* Name — visible only when scrolled past hero */}
          <div
            className={`flex items-center gap-4 overflow-hidden whitespace-nowrap transition-all duration-500 ease-out motion-reduce:duration-0 ${
              isScrolled
                ? 'max-w-[11rem] lg:max-w-[28rem] translate-y-0 opacity-100'
                : 'max-w-0 -translate-y-2 opacity-0 pointer-events-none'
            }`}
            aria-hidden={!isScrolled}
          >
            <Link
              className="text-base font-bold tracking-tight text-text-primary"
              href="/"
              tabIndex={isScrolled ? 0 : -1}
            >
              Yosef Gamble
            </Link>
            <span className="hidden h-4 w-px shrink-0 bg-slate-700 lg:inline-block" />
            <span className="hidden text-xs font-medium uppercase tracking-widest text-text-muted lg:inline-block">
              Senior Full-Stack Engineer
            </span>
          </div>

          {/* Nav links + social icons — always visible */}
          <div className="flex shrink-0 items-center gap-6 md:gap-8">
            <nav aria-label="Main navigation" className="hidden sm:block">
              <ul className="flex items-center gap-6">
                {navItems.map(({ label, href }) => (
                  <li key={href}>
                    <a
                      className="text-xs font-bold uppercase tracking-widest text-text-muted transition-colors hover:text-primary"
                      href={href}
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="flex items-center gap-3 pl-2 sm:border-l sm:border-slate-800 sm:pl-6">
              <a
                className="text-text-muted transition-colors hover:text-text-primary"
                href="https://github.com/yegamble"
                target="_blank"
                rel="noreferrer noopener"
              >
                <span className="sr-only">GitHub</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                </svg>
              </a>
              <a
                className="text-text-muted transition-colors hover:text-text-primary"
                href="https://linkedin.com/in/yosefgamble"
                target="_blank"
                rel="noreferrer noopener"
              >
                <span className="sr-only">LinkedIn</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.21-.43-1.56-1.1-1.56-.91 0-1.28.66-1.28 1.95V19h-3v-9h2.9v1.3c.36-.63 1.26-1.23 2.88-1.23 2.16 0 2.6 1.56 2.6 4.3z" />
                </svg>
              </a>
              <a
                className="text-text-muted transition-colors hover:text-text-primary"
                href="mailto:yegamble@gmail.com"
              >
                <span className="sr-only">Email</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                  <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
                </svg>
              </a>
              <a
                className="text-text-muted transition-colors hover:text-text-primary"
                href="mailto:yosef.gamble@protonmail.com"
              >
                <span className="sr-only">Secure email</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3A5.25 5.25 0 0012 1.5zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5zM12 13.5a1.5 1.5 0 00-.75 2.803V17.25a.75.75 0 001.5 0v-.947A1.5 1.5 0 0012 13.5z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section — large name + tagline, scrolls with content */}
      <section className="mx-auto flex w-full max-w-3xl flex-col justify-center px-6 pb-16 pt-16 md:pb-24 md:pt-24 lg:px-8">
        <div ref={sentinelRef}>
          <p className="mb-2 text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
            Yosef Gamble
          </p>
          <p className="mb-8 text-sm font-medium uppercase tracking-widest text-text-muted">
            Senior Full-Stack Engineer
          </p>
        </div>
        <h1 className="mb-8 text-4xl font-semibold leading-tight tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
          NYC based. Go, TypeScript, &amp; AWS focus. Building accessible,
          pixel-perfect digital experiences.
        </h1>
        <div className="h-1 w-24 rounded-full bg-primary" />
      </section>
    </>
  );
}
