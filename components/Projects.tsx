import SectionHeader from '@/components/SectionHeader';
import { ArrowOutwardIcon, FolderIcon, LayersIcon } from '@/components/icons';

interface Project {
  title: string;
  url: string;
  description: string;
  technologies: string[];
  icon: React.ReactNode;
}

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
      <SectionHeader title="Projects" className="mb-12" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
        {projects.map((project) => (
          <div
            key={project.title}
            className="group relative flex flex-col rounded-2xl border border-border-card bg-bg-card p-8 shadow-xl shadow-black/20 transition-all hover:border-border-card-hover hover:bg-bg-card-hover"
          >
            <div className="mb-6 flex items-start justify-between">
              {project.icon}
              <ArrowOutwardIcon className="h-5 w-5 text-text-muted transition-colors group-hover:text-primary" />
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
