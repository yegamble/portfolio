import { getLocaleHref, LOCALES, SITE_URL, type AppLocale } from '@/lib/i18n';

const SCHEMA_ORG = 'https://schema.org';
const PERSON_NAME = 'Yosef Gamble';
const JSON_LD_TYPE = 'application/ld+json';
const CITY_TYPE = 'City';
const COLLEGE_OR_UNIVERSITY_TYPE = 'CollegeOrUniversity';
const CONTEXT_KEY = '@context';
const TYPE_KEY = '@type';

interface JsonLdProps {
  locale: AppLocale;
}

function buildPersonSchema(locale: AppLocale) {
  return {
    [CONTEXT_KEY]: SCHEMA_ORG,
    [TYPE_KEY]: 'Person',
    name: PERSON_NAME,
    jobTitle: 'Senior Software Engineer',
    url: SITE_URL,
    // The portrait, not the 1200x630 Open Graph banner: `image` on a Person is
    // read as a photo of the person, and a wide banner crops badly wherever it
    // is surfaced.
    image: `${SITE_URL}/images/profile.jpg`,
    // The localized route is the page that actually describes this person.
    mainEntityOfPage: `${SITE_URL}${getLocaleHref(locale)}`,
    sameAs: ['https://github.com/yegamble', 'https://linkedin.com/in/yosefgamble'],
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
      { [TYPE_KEY]: CITY_TYPE, name: 'New York' },
      { [TYPE_KEY]: CITY_TYPE, name: 'Auckland' },
    ],
    alumniOf: [
      { [TYPE_KEY]: COLLEGE_OR_UNIVERSITY_TYPE, name: 'University of Auckland' },
      {
        [TYPE_KEY]: COLLEGE_OR_UNIVERSITY_TYPE,
        name: 'Central Washington University',
      },
    ],
  };
}

const websiteSchema = {
  [CONTEXT_KEY]: SCHEMA_ORG,
  [TYPE_KEY]: 'WebSite',
  name: PERSON_NAME,
  url: SITE_URL,
  // Every locale is a first-class route with its own hreflang alternate, so the
  // site itself is available in all four languages.
  inLanguage: [...LOCALES],
};

export default function JsonLd({ locale }: JsonLdProps): React.ReactElement {
  return (
    <>
      <script
        type={JSON_LD_TYPE}
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildPersonSchema(locale)),
        }}
      />
      <script
        type={JSON_LD_TYPE}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  );
}
