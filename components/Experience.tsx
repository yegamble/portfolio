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
    dates: '2020 — Present',
    title: 'Senior Engineer',
    company: 'TechCorp',
    companyUrl: '#',
    description:
      'Architect and maintain critical backend services processing millions of daily transactions using Go microservices. Lead cross-functional initiatives to migrate legacy systems to cloud-native infrastructure, reducing operational costs by 40%. Mentor junior engineers and establish engineering best practices across teams.',
    technologies: [
      'Go',
      'gRPC',
      'Kubernetes',
      'AWS',
      'PostgreSQL',
      'Redis',
      'Terraform',
      'Docker',
    ],
  },
  {
    dates: '2018 — 2020',
    title: 'Software Engineer',
    company: 'realestate.co.nz',
    companyUrl: 'https://www.realestate.co.nz',
    description:
      'Developed and maintained high-traffic property listing features serving 2M+ monthly visitors. Built RESTful APIs and server-rendered pages with a focus on performance and SEO. Collaborated with product and design teams to ship user-facing features on a two-week sprint cycle.',
    technologies: [
      'TypeScript',
      'React',
      'Node.js',
      'AWS Lambda',
      'DynamoDB',
      'GraphQL',
    ],
  },
  {
    dates: '2016 — 2018',
    title: 'Frontend Developer',
    company: 'Proactiv',
    companyUrl: '#',
    description:
      'Built responsive, accessible web interfaces for a direct-to-consumer e-commerce platform. Implemented A/B testing frameworks that increased conversion rates by 15%. Worked closely with UX designers to translate Figma mockups into production-ready React components.',
    technologies: [
      'JavaScript',
      'React',
      'Sass',
      'Webpack',
      'Jest',
      'Cypress',
    ],
  },
];

export default function Experience() {
  return (
    <section
      id="experience"
      className="mb-16 scroll-mt-16 md:mb-24 lg:mb-36 lg:scroll-mt-24"
      aria-label="Work experience"
    >
      <div className="sticky top-0 z-20 -mx-6 mb-4 w-screen bg-bg-dark/75 px-6 py-5 backdrop-blur md:-mx-12 md:px-12 lg:sr-only lg:relative lg:top-auto lg:mx-auto lg:w-full lg:px-0 lg:py-0 lg:opacity-0">
        <h2 className="text-sm font-bold uppercase tracking-widest text-text-primary lg:sr-only">
          Experience
        </h2>
      </div>
      <ol className="group/list">
        {experiences.map((exp) => (
          <li key={`${exp.company}-${exp.dates}`} className="mb-12">
            <div className="group relative grid pb-1 transition-all sm:grid-cols-8 sm:gap-8 md:gap-4 lg:hover:!opacity-100 lg:group-hover/list:opacity-50">
              <div className="absolute -inset-x-4 -inset-y-4 z-0 hidden rounded-md transition motion-reduce:transition-none lg:-inset-x-6 lg:block lg:group-hover:bg-bg-card lg:group-hover:shadow-[inset_0_1px_0_0_rgba(148,163,184,0.1)] lg:group-hover:drop-shadow-lg" />
              <header
                className="z-10 mb-2 mt-1 text-xs font-semibold uppercase tracking-wide text-text-secondary sm:col-span-2"
                aria-label={exp.dates}
              >
                {exp.dates}
              </header>
              <div className="z-10 sm:col-span-6">
                <h3 className="font-medium leading-snug text-text-primary">
                  <a
                    className="group/link inline-flex items-baseline text-base font-medium leading-tight text-text-heading hover:text-primary focus-visible:text-primary"
                    href={exp.companyUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={`${exp.title} at ${exp.company} (opens in a new tab)`}
                  >
                    <span className="absolute -inset-x-4 -inset-y-2.5 hidden rounded md:-inset-x-6 md:-inset-y-4 lg:block" />
                    <span>
                      {exp.title} &middot;{' '}
                      <span className="inline-block">
                        {exp.company}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="ml-1 inline-block h-4 w-4 shrink-0 translate-y-px transition-transform group-hover/link:-translate-y-1 group-hover/link:translate-x-1 group-focus-visible/link:-translate-y-1 group-focus-visible/link:translate-x-1 motion-reduce:transition-none"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    </span>
                  </a>
                </h3>
                <p className="mt-2 text-sm leading-normal">
                  {exp.description}
                </p>
                <ul className="mt-2 flex flex-wrap" aria-label="Technologies used">
                  {exp.technologies.map((tech) => (
                    <li key={tech} className="mr-1.5 mt-2">
                      <div className="flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium leading-5 text-primary">
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
      <div className="mt-12">
        <a
          className="group inline-flex items-center font-medium leading-tight text-text-heading hover:text-primary focus-visible:text-primary"
          href="/resume.pdf"
          aria-label="View Full Résumé (opens in a new tab)"
        >
          <span className="border-b border-transparent pb-px transition group-hover:border-primary motion-reduce:transition-none">
            View Full Résumé
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="ml-1 inline-block h-4 w-4 shrink-0 translate-y-px transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 group-focus-visible:-translate-y-1 group-focus-visible:translate-x-1 motion-reduce:transition-none"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z"
              clipRule="evenodd"
            />
          </svg>
        </a>
      </div>
    </section>
  );
}
