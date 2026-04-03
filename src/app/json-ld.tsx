const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Yosef Gamble',
  jobTitle: 'Senior Software Engineer',
  url: 'https://yosefgamble.com',
  image: 'https://yosefgamble.com/images/og-image.jpg',
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
    { '@type': 'City', name: 'New York' },
    { '@type': 'City', name: 'Auckland' },
  ],
  alumniOf: [
    { '@type': 'CollegeOrUniversity', name: 'University of Auckland' },
    { '@type': 'CollegeOrUniversity', name: 'Central Washington University' },
  ],
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Yosef Gamble',
  url: 'https://yosefgamble.com',
};

export default function JsonLd(): React.ReactElement {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  );
}
