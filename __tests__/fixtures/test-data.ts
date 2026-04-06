import type { ExperienceEntry } from '@/data/experience';
import type { ProjectEntry } from '@/data/projects';

export const testExperienceEntries: ExperienceEntry[] = [
  {
    id: 'edge-corp',
    companyUrl: 'https://example.com/edge-corp?q=test&lang=en#section',
    technologies: ['C++', 'Rust', 'Go', 'PostgreSQL', 'Redis', 'gRPC'],
  },
  {
    id: 'cafe-societe',
    companyUrl: 'https://cafe-societe.example.com/',
    technologies: ['TypeScript', 'React', 'Node.js', 'GraphQL', 'Stripe'],
  },
  {
    id: 'open-src',
    companyUrl: '#',
    technologies: ['Python', 'Kotlin', 'Swift', 'Unicode', 'CI/CD'],
  },
];

export const testProjectEntries: ProjectEntry[] = [
  {
    id: 'vidra',
    repos: [
      { name: 'vidra-core', url: 'https://github.com/yegamble/vidra-core' },
      { name: 'vidra-user', url: '#' },
    ],
    technologies: ['Go', 'ActivityPub', 'Docker'],
    icon: 'layers',
  },
  {
    id: 'aurialis',
    repos: [{ name: 'Aurialis', url: 'https://github.com/yegamble/Aurialis' }],
    technologies: ['Next.js', 'TypeScript'],
    icon: 'layers',
  },
  {
    id: 'goimg',
    repos: [
      { name: 'goimg-user', url: '#' },
      { name: 'goimg-datalayer', url: '#' },
    ],
    technologies: ['Go', 'PostgreSQL'],
    icon: 'folder',
  },
  {
    id: 'iota-token-creator',
    repos: [
      { name: 'iota-token-creator-web', url: '#' },
      { name: 'iota-token-creator-api', url: '#' },
    ],
    technologies: ['Next.js', 'Go'],
    icon: 'folder',
  },
];
