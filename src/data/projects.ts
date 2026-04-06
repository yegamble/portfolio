export interface ProjectRepo {
  name: string;
  url: string;
}

export interface ProjectEntry {
  id: string;
  repos: ProjectRepo[];
  technologies: string[];
  icon: 'folder' | 'layers';
}

export const projectEntries: ProjectEntry[] = [
  {
    id: 'vidra',
    repos: [
      { name: 'vidra-core', url: 'https://github.com/yegamble/vidra-core' },
      { name: 'vidra-user', url: '#' },
    ],
    technologies: ['Go', 'ActivityPub', 'ATProto', 'PostgreSQL', 'Redis', 'Docker'],
    icon: 'layers',
  },
  {
    id: 'aurialis',
    repos: [
      { name: 'Aurialis', url: 'https://github.com/yegamble/Aurialis' },
    ],
    technologies: ['Next.js', 'TypeScript', 'Web Audio API', 'Tailwind CSS'],
    icon: 'layers',
  },
  {
    id: 'goimg',
    repos: [
      { name: 'goimg-user', url: '#' },
      { name: 'goimg-datalayer', url: '#' },
    ],
    technologies: ['Next.js', 'TypeScript', 'Go', 'PostgreSQL', 'S3'],
    icon: 'folder',
  },
  {
    id: 'iota-token-creator',
    repos: [
      { name: 'iota-token-creator-web', url: '#' },
      { name: 'iota-token-creator-api', url: '#' },
    ],
    technologies: ['Next.js', 'TypeScript', 'Go', 'IOTA'],
    icon: 'folder',
  },
];
