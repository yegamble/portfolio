interface Project {
  title: string;
  url: string;
  description: string;
  technologies: string[];
  icon: React.ReactNode;
}

const FolderIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="h-9 w-9 text-primary/90"
    aria-hidden="true"
  >
    <path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-15a3 3 0 00-3 3V18a3 3 0 003 3h15zM1.5 10.146V6a3 3 0 013-3h5.379a2.25 2.25 0 011.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 013 3v1.146A4.483 4.483 0 0019.5 9h-15a4.483 4.483 0 00-3 1.146z" />
  </svg>
);

const LayersIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="h-9 w-9 text-primary/90"
    aria-hidden="true"
  >
    <path d="M11.644 1.59a.75.75 0 01.712 0l9.75 5.25a.75.75 0 010 1.32l-9.75 5.25a.75.75 0 01-.712 0l-9.75-5.25a.75.75 0 010-1.32l9.75-5.25z" />
    <path d="M3.265 10.602l7.668 4.129a2.25 2.25 0 002.134 0l7.668-4.13 1.37.739a.75.75 0 010 1.32l-9.75 5.25a.75.75 0 01-.71 0l-9.75-5.25a.75.75 0 010-1.32l1.37-.738z" />
    <path d="M3.265 15.602l7.668 4.129a2.25 2.25 0 002.134 0l7.668-4.13 1.37.739a.75.75 0 010 1.32l-9.75 5.25a.75.75 0 01-.71 0l-9.75-5.25a.75.75 0 010-1.32l1.37-.738z" />
  </svg>
);

const ArrowOutwardIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="h-5 w-5 text-text-muted transition-colors group-hover:text-primary"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z"
      clipRule="evenodd"
    />
  </svg>
);

const projects: Project[] = [
  {
    title: 'Project Alpha',
    url: '#',
    description:
      'A distributed data processing engine capable of handling petabytes of logs in real-time. Built with Rust and Kafka to ensure high availability.',
    technologies: ['Rust', 'Kafka', 'AWS'],
    icon: <FolderIcon />,
  },
  {
    title: 'Neon UI Kit',
    url: '#',
    description:
      'An open-source React component library focused on accessibility and dark mode aesthetics. 2k+ stars on GitHub.',
    technologies: ['React', 'Tailwind', 'A11y'],
    icon: <LayersIcon />,
  },
];

export default function Projects() {
  return (
    <section
      id="projects"
      className="scroll-mt-24 border-t border-slate-800/30 py-16 md:py-24"
      aria-label="Selected projects"
    >
      <div className="mb-12 flex items-center gap-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-text-primary">
          Projects
        </h2>
        <div className="h-px flex-1 bg-slate-800" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
        {projects.map((project) => (
          <div
            key={project.title}
            className="group relative flex flex-col rounded-2xl border border-border-card bg-bg-card p-8 shadow-xl shadow-black/20 transition-all hover:border-border-card-hover hover:bg-bg-card-hover"
          >
            <div className="mb-6 flex items-start justify-between">
              {project.icon}
              <ArrowOutwardIcon />
            </div>
            <h3 className="mb-3 text-xl font-bold text-slate-100">
              <a
                className="before:absolute before:inset-0"
                href={project.url}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={`${project.title} (opens in a new tab)`}
              >
                {project.title}
              </a>
            </h3>
            <p className="mb-6 flex-grow text-sm leading-relaxed text-text-secondary">
              {project.description}
            </p>
            <ul
              className="mt-auto flex flex-wrap gap-x-4 gap-y-2"
              aria-label="Technologies used"
            >
              {project.technologies.map((tech) => (
                <li
                  key={tech}
                  className="text-[11px] font-bold uppercase tracking-widest text-text-muted"
                >
                  {tech}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
