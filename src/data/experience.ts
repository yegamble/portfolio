export interface ExperienceEntry {
  companyUrl: string;
  technologies: string[];
}

export const experienceEntries: ExperienceEntry[] = [
  {
    companyUrl: 'https://github.com/yegamble',
    technologies: ['Go', 'ActivityPub', 'Docker', 'PostgreSQL', 'Redis', 'Cloudflare'],
  },
  {
    companyUrl: 'https://www.realestate.co.nz',
    technologies: ['AWS Lambda', 'CDK', 'EmberJS', 'PHP', 'Braze', 'New Relic'],
  },
  {
    companyUrl: '#',
    technologies: ['PHP', 'AngularJS', 'Android', 'Digital Ocean', 'REST APIs'],
  },
];
