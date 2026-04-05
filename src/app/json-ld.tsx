const SCHEMA_ORG = 'https://schema.org';
const PERSON_NAME = 'Yosef Gamble';
const PERSON_URL = 'https://yosefgamble.com';
const JSON_LD_TYPE = 'application/ld+json';
const CITY_TYPE = 'City';
const COLLEGE_OR_UNIVERSITY_TYPE = 'CollegeOrUniversity';

const personSchema = {
  '@context': SCHEMA_ORG,
  '@type': 'Person',
  name: PERSON_NAME,
  jobTitle: 'Senior Software Engineer',
  url: PERSON_URL,
  image: `${PERSON_URL}/images/og-image.jpg`,
  sameAs: [
    'https://github.com/yegamble',
    'https://linkedin.com/in/yosefgamble',
  ],
  knowsAbout: [
    'Go',
    'Golang',
    'TypeScript',
    'AWS',
    'Video Streaming',
    'Real Estate Technology',
    'ActivityPub',
    'Docker',
    'PostgreSQL',
  ],
  workLocation: [
    { '@type': CITY_TYPE, name: 'New York' },
    { '@type': CITY_TYPE, name: 'Auckland' },
  ],
  alumniOf: [
    { '@type': COLLEGE_OR_UNIVERSITY_TYPE, name: 'University of Auckland' },
    { '@type': COLLEGE_OR_UNIVERSITY_TYPE, name: 'Central Washington University' },
  ],
};

const websiteSchema = {
  '@context': SCHEMA_ORG,
  '@type': 'WebSite',
  name: PERSON_NAME,
  url: PERSON_URL,
};

export default function JsonLd(): React.ReactElement {
  return (
    <>
      <script
        type={JSON_LD_TYPE}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <script
        type={JSON_LD_TYPE}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  );
}
