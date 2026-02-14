interface ExperienceItem {
  dates: string;
  title: string;
  company: string;
  companyUrl: string;
  description: string;
  technologies: string[];
}

const experiences: ExperienceItem[] = [
  {
    dates: '2024 — Present',
    title: 'Full Stack Engineer',
    company: 'Independent',
    companyUrl: 'https://github.com/yegamble',
    description:
      'Building an open-source, PeerTube-compatible video streaming backend in Go with decentralized social networking protocols — ActivityPub federation and ATProto integration for cross-platform content sharing. Cut bandwidth costs from hundreds of dollars monthly to nearly $0 by integrating Backblaze B2 and Cloudflare CDN via the Bandwidth Alliance. Containerized with Docker, CI/CD via GitHub Actions, PostgreSQL for storage, Redis for caching and rate-limiting.',
    technologies: ['Go', 'ActivityPub', 'Docker', 'PostgreSQL', 'Redis', 'Cloudflare'],
  },
  {
    dates: '2021 — 2024',
    title: 'Full Stack Engineer',
    company: 'realestate.co.nz',
    companyUrl: 'https://www.realestate.co.nz',
    description:
      'Shipped industry-first features for New Zealand\u2019s most established real estate portal — instant price change alerts and transparent price history that competitors copied months later. Designed and built a serverless notification system on AWS Lambda integrated with Braze, delivering daily and weekly listing alerts platform-wide. Led company-wide workshops on Serverless architecture and New Relic observability. Contributed to the EmberJS frontend rebuild that received positive feedback from agents and users nationally.',
    technologies: ['AWS Lambda', 'CDK', 'EmberJS', 'PHP', 'Braze', 'New Relic'],
  },
  {
    dates: '2019 — 2024',
    title: 'Software Developer',
    company: 'ProStock',
    companyUrl: '#',
    description:
      'Built the core platform for a warehouse management system saving operators over $250K annually. Developed APIs supporting international order fulfillment for Zoono across NZ, Australia, and Asia. Deployed an Android scanner application for warehouse staff to receive, transfer, and ship products globally. Created an AngularJS portal for clients to track product status and orders in real-time. Migrated infrastructure to Digital Ocean, improving uptime across production environments.',
    technologies: ['PHP', 'AngularJS', 'Android', 'Digital Ocean', 'REST APIs'],
  },
];

export default function Experience() {
  return (
    <section
      id="experience"
      className="scroll-mt-24 border-t border-slate-800/30 py-16 md:py-24"
      aria-label="Work experience"
    >
      <div className="mb-12 flex items-center gap-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-text-primary">
          Experience
        </h2>
        <div className="h-px flex-1 bg-slate-800" />
      </div>
      <ol className="space-y-12">
        {experiences.map((exp) => (
          <li key={`${exp.company}-${exp.dates}`}>
            <div className="group relative grid grid-cols-1 gap-2 transition-all sm:grid-cols-12 sm:gap-6">
              <header
                className="pt-1 text-xs font-semibold uppercase tracking-wide text-text-muted sm:col-span-3"
                aria-label={exp.dates}
              >
                {exp.dates}
              </header>
              <div className="sm:col-span-9">
                <h3 className="text-lg font-medium leading-snug text-text-primary">
                  <a
                    className="group/link inline-flex items-baseline font-medium leading-tight text-text-primary transition-colors hover:text-primary"
                    href={exp.companyUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={`${exp.title} at ${exp.company} (opens in a new tab)`}
                  >
                    <span>
                      {exp.title} &middot; {exp.company}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="ml-1 inline-block h-4 w-4 shrink-0 translate-y-px transition-transform group-hover/link:-translate-y-1 group-hover/link:translate-x-1"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </a>
                </h3>
                <p className="mt-2 text-base leading-relaxed text-text-secondary">
                  {exp.description}
                </p>
                <ul
                  className="mt-4 flex flex-wrap gap-2"
                  aria-label="Technologies used"
                >
                  {exp.technologies.map((tech) => (
                    <li key={tech}>
                      <div className="rounded-full border border-border-subtle bg-slate-800/50 px-3 py-1 text-xs font-medium text-primary">
                        {tech}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-16 flex justify-start">
        <a
          className="group inline-flex items-center gap-2 font-semibold text-text-primary"
          href="/resume.pdf"
          aria-label="View Full Résumé"
        >
          <span className="border-b border-transparent pb-px transition-all group-hover:border-primary">
            View Full Résumé
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4 transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
              clipRule="evenodd"
            />
          </svg>
        </a>
      </div>
    </section>
  );
}
