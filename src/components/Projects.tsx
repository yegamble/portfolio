'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SectionHeader from '@/components/SectionHeader';
import CipherText from '@/components/CipherText';
import { FolderIcon, GitHubIcon, LayersIcon } from '@/components/icons';
import { projectEntries } from '@/data/projects';

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
      <SectionHeader
        title={<CipherText>{t('projects.heading')}</CipherText>}
        className="mb-12"
      />

      {/* Carousel on mobile, grid on md+ */}
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-2 md:gap-8 md:overflow-visible md:pb-0">
        {itemsWithMetadata.map(({ project, meta }, index) => (
          <div
            key={project.id}
            ref={(el) => { cardRefs.current[index] = el; }}
            className="group relative flex shrink-0 snap-center flex-col rounded-2xl border border-border-card bg-bg-card p-8 shadow-xl shadow-black/20 transition-all hover:border-border-card-hover hover:bg-bg-card-hover w-[85vw] md:w-auto"
          >
            <div className="mb-6 flex items-start justify-between">
              {iconMap[meta.icon]}
            </div>

            <h3 className="mb-3 text-xl font-bold text-slate-100">
              {project.title}
            </h3>

            <p className="mb-6 flex-grow text-sm leading-relaxed text-text-secondary">{project.description}</p>

            <ul
              className="flex flex-wrap gap-x-4 gap-y-2"
              aria-label={t('projects.techAriaLabel')}
            >
              {meta.technologies.map((tech) => (
                <li
                  key={tech}
                  className="text-[11px] font-bold uppercase tracking-widest text-text-muted"
                >
                  {tech}
                </li>
              ))}
            </ul>

            {/* Repo links */}
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2" aria-label={t('projects.viewRepos')}>
              {meta.repos.map((repo) => (
                <a
                  key={repo.name}
                  href={repo.url}
                  target={repo.url !== '#' ? '_blank' : undefined}
                  rel={repo.url !== '#' ? 'noreferrer noopener' : undefined}
                  aria-label={t('projects.viewOnGitHub', { name: repo.name })}
                  className="flex items-center gap-1.5 text-[11px] font-medium text-text-muted transition-colors hover:text-primary"
                >
                  <GitHubIcon className="h-3.5 w-3.5" />
                  <span>{repo.name}</span>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Dot indicators — visible on mobile only */}
      <div className="mt-6 flex justify-center gap-2 md:hidden">
        {itemsWithMetadata.map((_, index) => (
          <button
            key={index}
            aria-label={`${t('projects.heading')} ${index + 1}`}
            aria-current={index === activeIndex ? 'true' : undefined}
            onClick={() => {
              cardRefs.current[index]?.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center',
              });
            }}
            className={`h-2 w-2 rounded-full transition-colors ${
              index === activeIndex ? 'bg-primary' : 'bg-slate-600'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
