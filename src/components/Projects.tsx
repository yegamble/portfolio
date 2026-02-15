'use client';

import { useTranslation } from 'react-i18next';
import SectionHeader from '@/components/SectionHeader';
import CipherText from '@/components/CipherText';
import { ArrowOutwardIcon, FolderIcon, LayersIcon } from '@/components/icons';
import { projectEntries } from '@/data/projects';

const iconMap = {
  folder: <FolderIcon />,
  layers: <LayersIcon />,
};

export default function Projects() {
  const { t } = useTranslation();

  const items = t('projects.items', { returnObjects: true }) as {
    title: string;
    description: string;
  }[];

  if (!Array.isArray(items) || items.length === 0) {
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
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
        {items.map((project, index) => {
          const meta = projectEntries[index];
          return (
            <div
              key={project.title}
              className="group relative flex flex-col rounded-2xl border border-border-card bg-bg-card p-8 shadow-xl shadow-black/20 transition-all hover:border-border-card-hover hover:bg-bg-card-hover"
            >
              <div className="mb-6 flex items-start justify-between">
                {iconMap[meta.icon]}
                <ArrowOutwardIcon className="h-5 w-5 text-text-muted transition-colors group-hover:text-primary" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-slate-100">
                <a
                  className="before:absolute before:inset-0"
                  href={meta.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={`${project.title} ${t('projects.opensInNewTab')}`}
                >
                  <CipherText>{project.title}</CipherText>
                </a>
              </h3>
              <p className="mb-6 flex-grow text-sm leading-relaxed text-text-secondary">
                <CipherText>{project.description}</CipherText>
              </p>
              <ul
                className="mt-auto flex flex-wrap gap-x-4 gap-y-2"
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
            </div>
          );
        })}
      </div>
    </section>
  );
}
