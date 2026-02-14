interface Project {
  title: string;
  url: string;
  description: string;
  technologies: string[];
}

const projects: Project[] = [
  {
    title: 'Project Alpha',
    url: '#',
    description:
      'A distributed data processing engine built for real-time analytics at scale. Handles millions of events per second with sub-millisecond latency using a custom event-driven architecture.',
    technologies: ['Rust', 'Apache Kafka', 'AWS', 'Terraform', 'Prometheus'],
  },
  {
    title: 'Neon UI Kit',
    url: '#',
    description:
      'An open-source React component library focused on accessibility and developer experience. Ships with 40+ composable components, comprehensive docs, and full WCAG 2.1 AA compliance.',
    technologies: [
      'React',
      'TypeScript',
      'Tailwind CSS',
      'Storybook',
      'A11y',
    ],
  },
];

export default function Projects() {
  return (
    <section
      id="projects"
      className="mb-16 scroll-mt-16 md:mb-24 lg:mb-36 lg:scroll-mt-24"
      aria-label="Selected projects"
    >
      <div className="sticky top-0 z-20 -mx-6 mb-4 w-screen bg-bg-dark/75 px-6 py-5 backdrop-blur md:-mx-12 md:px-12 lg:sr-only lg:relative lg:top-auto lg:mx-auto lg:w-full lg:px-0 lg:py-0 lg:opacity-0">
        <h2 className="text-sm font-bold uppercase tracking-widest text-text-primary lg:sr-only">
          Projects
        </h2>
      </div>
      <ul className="group/list">
        {projects.map((project) => (
          <li key={project.title} className="mb-12">
            <div className="group relative grid gap-4 pb-1 transition-all sm:grid-cols-8 sm:gap-8 md:gap-4 lg:hover:!opacity-100 lg:group-hover/list:opacity-50">
              <div className="absolute -inset-x-4 -inset-y-4 z-0 hidden rounded-md transition motion-reduce:transition-none lg:-inset-x-6 lg:block lg:group-hover:bg-bg-card lg:group-hover:shadow-[inset_0_1px_0_0_rgba(148,163,184,0.1)] lg:group-hover:drop-shadow-lg" />
              <div className="z-10 sm:order-2 sm:col-span-6">
                <h3>
                  <a
                    className="group/link inline-flex items-baseline text-base font-medium leading-tight text-text-heading hover:text-primary focus-visible:text-primary"
                    href={project.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={`${project.title} (opens in a new tab)`}
                  >
                    <span className="absolute -inset-x-4 -inset-y-2.5 hidden rounded md:-inset-x-6 md:-inset-y-4 lg:block" />
                    <span>
                      {project.title}
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
                  </a>
                </h3>
                <p className="mt-2 text-sm leading-normal">
                  {project.description}
                </p>
                <ul
                  className="mt-2 flex flex-wrap"
                  aria-label="Technologies used"
                >
                  {project.technologies.map((tech) => (
                    <li key={tech} className="mr-1.5 mt-2">
                      <div className="flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium leading-5 text-primary">
                        {tech}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="z-10 flex items-center justify-center rounded border border-border-subtle sm:order-1 sm:col-span-2 sm:h-20">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="h-8 w-8 text-text-secondary"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
                  />
                </svg>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
