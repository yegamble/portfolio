'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import SocialLinks from '@/components/SocialLinks';

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
            <SocialLinks className="pl-2 sm:border-l sm:border-slate-800 sm:pl-6" />
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
