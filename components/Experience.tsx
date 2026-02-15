'use client';

import { useTranslation } from 'react-i18next';
import SectionHeader from '@/components/SectionHeader';
import TechTag from '@/components/TechTag';
import { ArrowOutwardIcon, ArrowRightIcon } from '@/components/icons';

interface ExperienceItem {
  dates: string;
  title: string;
  company: string;
  companyUrl: string;
  description: string;
  technologies: string[];
}

const experiencesMeta: Pick<ExperienceItem, 'companyUrl' | 'technologies'>[] = [
  {
    companyUrl: 'https://github.com/yegamble',
    technologies: ['Go', 'ActivityPub', 'Docker', 'PostgreSQL', 'Redis', 'Cloudflare'],
  },
  {
    companyUrl: 'https://www.realestate.co.nz',
    technologies: ['AWS Lambda', 'CDK', 'EmberJS', 'PHP', 'Braze', 'New Relic'],
  },
  {
    companyUrl: '#',
    technologies: ['PHP', 'AngularJS', 'Android', 'Digital Ocean', 'REST APIs'],
  },
];

export default function Experience() {
  const { t } = useTranslation();

  const jobs = t('experience.jobs', { returnObjects: true }) as {
    dates: string;
    title: string;
    company: string;
    description: string;
  }[];

  return (
    <section
      id="experience"
      className="scroll-mt-24 border-t border-slate-800/30 py-16 md:py-24"
      aria-label={t('experience.ariaLabel')}
    >
      <SectionHeader title={t('experience.heading')} className="mb-12" />
      <ol className="space-y-12">
        {jobs.map((job, index) => {
          const meta = experiencesMeta[index];
          return (
            <li key={`${job.company}-${job.dates}`}>
              <div className="group relative grid grid-cols-1 gap-2 transition-all sm:grid-cols-12 sm:gap-6">
                <header
                  className="pt-1 text-xs font-semibold uppercase tracking-wide text-text-muted sm:col-span-3"
                  aria-label={job.dates}
                >
                  {job.dates}
                </header>
                <div className="sm:col-span-9">
                  <h3 className="text-lg font-medium leading-snug text-text-primary">
                    <a
                      className="group/link inline-flex items-baseline font-medium leading-tight text-text-primary transition-colors hover:text-primary"
                      href={meta.companyUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label={`${job.title} at ${job.company} ${t('experience.opensInNewTab')}`}
                    >
                      <span>
                        {job.title} &middot; {job.company}
                      </span>
                      <ArrowOutwardIcon className="ms-1 inline-block h-4 w-4 shrink-0 translate-y-px transition-transform group-hover/link:-translate-y-1 group-hover/link:translate-x-1 rtl:group-hover/link:-translate-x-1" />
                    </a>
                  </h3>
                  <p className="mt-2 text-base leading-relaxed text-text-secondary">
                    {job.description}
                  </p>
                  <ul
                    className="mt-4 flex flex-wrap gap-2"
                    aria-label={t('experience.techAriaLabel')}
                  >
                    {meta.technologies.map((tech) => (
                      <TechTag key={tech} label={tech} />
                    ))}
                  </ul>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="mt-16 flex justify-start">
        <a
          className="group inline-flex items-center gap-2 font-semibold text-text-primary"
          href="/resume.pdf"
          aria-label={t('experience.viewResume')}
        >
          <span className="border-b border-transparent pb-px transition-all group-hover:border-primary">
            {t('experience.viewResume')}
          </span>
          <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
        </a>
      </div>
    </section>
  );
}
