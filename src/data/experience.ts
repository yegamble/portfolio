export interface ExperienceEntry {
  id: string;
  companyUrl?: string | null;
  technologies: string[];
}

export const experienceEntries: ExperienceEntry[] = [
  {
    id: 'independent',
    companyUrl: 'https://github.com/yegamble',
    technologies: ['Go', 'ActivityPub', 'Docker', 'PostgreSQL', 'Redis', 'Cloudflare'],
  },
  {
    id: 'realestate',
    companyUrl: 'https://www.realestate.co.nz',
    technologies: ['AWS Lambda', 'CDK', 'EmberJS', 'PHP', 'Braze', 'New Relic'],
  },
  {
    id: 'prostock',
    companyUrl: null,
    technologies: ['PHP', 'AngularJS', 'Android', 'Digital Ocean', 'REST APIs'],
  },
];
