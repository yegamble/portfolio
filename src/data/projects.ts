export interface ProjectEntry {
  url: string;
  technologies: string[];
  icon: 'folder' | 'layers';
}

export const projectEntries: ProjectEntry[] = [
  {
    url: '#',
    technologies: ['Rust', 'Kafka', 'AWS'],
    icon: 'folder',
  },
  {
    url: '#',
    technologies: ['React', 'Tailwind', 'A11y'],
    icon: 'layers',
  },
];
