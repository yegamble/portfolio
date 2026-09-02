'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SectionHeader from '@/components/SectionHeader';
import CipherText from '@/components/CipherText';
import { FolderIcon, GitHubIcon, LayersIcon } from '@/components/icons';
import { projectEntries } from '@/data/projects';
import { prefersReducedMotion } from '@/lib/media';

const iconMap = {
  folder: <FolderIcon />,
  layers: <LayersIcon />,
};

interface ProjectItem {
  id: string;
  title: string;
  description: string;
}

const METADATA_BY_ID = new Map(projectEntries.map((entry) => [entry.id, entry]));

export default function Projects() {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const items = t('projects.items', { returnObjects: true }) as ProjectItem[];

  const itemsWithMetadata = useMemo(
    () =>
      (Array.isArray(items) ? items : []).flatMap((project) => {
        const meta = METADATA_BY_ID.get(project.id);
        return meta ? [{ project, meta }] : [];
      }),
    [items]
  );

  useEffect(() => {
    if (itemsWithMetadata.length === 0) return;

    const observers: IntersectionObserver[] = [];

    itemsWithMetadata.forEach((_, index) => {
      const el = cardRefs.current[index];
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveIndex(index);
          }
        },
        { threshold: 0.5 }
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => {
      observers.forEach((o) => o.disconnect());
    };
  }, [itemsWithMetadata]);

  if (itemsWithMetadata.length === 0) {
    return null;
  }

  return (
    <section
      id="projects"
      className="scroll-mt-24 border-t border-slate-800/30 py-16 md:py-24"
      aria-label={t('projects.ariaLabel')}
    >
      <SectionHeader title={<CipherText>{t('projects.heading')}</CipherText>} className="mb-12" />

      {/* Carousel on mobile, grid on md+ */}
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-2 md:gap-8 md:overflow-visible md:pb-0">
        {itemsWithMetadata.map(({ project, meta }, index) => (
          <div
            key={project.id}
            ref={(el) => {
              cardRefs.current[index] = el;
            }}
            className="group relative flex shrink-0 snap-center flex-col rounded-2xl border border-border-card bg-bg-card p-8 shadow-xl shadow-black/20 transition-all hover:border-border-card-hover hover:bg-bg-card-hover w-[85vw] md:w-auto"
          >
            <div className="mb-6 flex items-start justify-between">{iconMap[meta.icon]}</div>

            <h3 className="mb-3 text-xl font-bold text-slate-100">
              <CipherText>{project.title}</CipherText>
            </h3>

            <p className="mb-6 flex-grow text-sm leading-relaxed text-text-secondary">
              <CipherText block>{project.description}</CipherText>
            </p>

            {/* Technology names and repo names below both come from
                src/data/projects.ts, which is never translated: they stay
                English on every locale, so each is marked as an English part. */}
            <ul className="flex flex-wrap gap-x-4 gap-y-2" aria-label={t('projects.techAriaLabel')}>
              {meta.technologies.map((tech) => (
                <li
                  key={tech}
                  lang="en"
                  className="text-[11px] font-bold uppercase tracking-widest text-text-muted"
                >
                  <CipherText>{tech}</CipherText>
                </li>
              ))}
            </ul>

            {/* Repo links */}
            <ul
              className="mt-4 flex flex-wrap gap-x-4 gap-y-2"
              aria-label={t('projects.viewRepos')}
            >
              {meta.repos.map((repo) => {
                const isExternal = repo.url !== '#';

                return (
                  <li key={repo.name}>
                    {/* No aria-label: it would replace the visible repo name as
                        the accessible name and, being one string, would drop the
                        lang="en" the name is wrapped in — so the Hebrew page
                        announced "לצפייה ב-vidra-core ב-GitHub" with the repo
                        name read as Hebrew. The visible name leads; the rest is
                        a translated suffix inside the link. */}
                    <a
                      href={repo.url}
                      target={isExternal ? '_blank' : undefined}
                      rel={isExternal ? 'noreferrer noopener' : undefined}
                      className="flex items-center gap-1.5 text-[11px] font-medium text-text-muted transition-colors hover:text-primary"
                    >
                      <GitHubIcon className="h-3.5 w-3.5" />
                      <span lang="en">
                        <CipherText>{repo.name}</CipherText>
                      </span>{' '}
                      <span className="sr-only">
                        {isExternal
                          ? `${t('projects.onGitHub')} ${t('projects.opensInNewTab')}`
                          : t('projects.onGitHub')}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Dot indicators — visible on mobile only. The carousel scrolls by touch
          on its own, so these are a supplement; they are still real controls,
          hence a 24px target around the 8px dot (WCAG 2.5.8) and a name taken
          from the card each one scrolls to rather than an ordinal. */}
      <div
        role="group"
        aria-label={t('projects.pagination')}
        className="mt-6 flex justify-center gap-2 md:hidden"
      >
        {itemsWithMetadata.map(({ project }, index) => (
          <button
            key={project.id}
            type="button"
            aria-label={project.title}
            aria-current={index === activeIndex ? 'true' : undefined}
            onClick={() => {
              cardRefs.current[index]?.scrollIntoView({
                behavior: prefersReducedMotion() ? 'auto' : 'smooth',
                block: 'nearest',
                inline: 'center',
              });
            }}
            className="flex h-6 w-6 items-center justify-center rounded-full"
          >
            <span
              aria-hidden="true"
              className={`h-2 w-2 rounded-full transition-colors ${
                index === activeIndex ? 'bg-primary' : 'bg-slate-500'
              }`}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
