export interface ProjectEntry {
  id: string;
  url: string;
  technologies: string[];
  icon: 'folder' | 'layers';
}

export const projectEntries: ProjectEntry[] = [
  {
    id: 'project-alpha',
    url: '#',
    technologies: ['Rust', 'Kafka', 'AWS'],
    icon: 'folder',
  },
  {
    id: 'neon-ui-kit',
    url: '#',
    technologies: ['React', 'Tailwind', 'A11y'],
    icon: 'layers',
  },
];
