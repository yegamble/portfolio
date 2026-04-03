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
    id: 'uber-proj',
    url: 'https://example.com/unicode-engine',
    technologies: ['C++', 'Rust', 'WASM'],
    icon: 'folder',
  },
  {
    id: 'nihon-proj',
    url: '#',
    technologies: ['Python', 'TensorFlow', 'FastAPI'],
    icon: 'layers',
  },
];
