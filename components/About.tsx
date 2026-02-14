export default function About() {
  return (
    <section
      id="about"
      className="scroll-mt-24 border-t border-slate-800/30 py-16 md:py-24"
      aria-label="About me"
    >
      <div className="mb-8 flex items-center gap-4 md:mb-10">
        <h2 className="text-sm font-bold uppercase tracking-widest text-text-primary">
          About
        </h2>
        <div className="h-px flex-1 bg-slate-800" />
      </div>
      <div className="space-y-6 text-lg leading-relaxed text-text-secondary">
        <p>
          I started writing code at Central Washington University in 2013,
          where I served as Student Government President and earned the Boeing
          Scholarship. My path took me across the Pacific to New Zealand
          &mdash; first for a degree at the University of Auckland, then into
          the tech industry building software that would reach millions of
          users.
        </p>
        <p>
          At{' '}
          <a
            className="font-medium text-text-primary underline decoration-slate-700 underline-offset-4 transition-colors hover:text-primary"
            href="https://www.realestate.co.nz"
            target="_blank"
            rel="noreferrer noopener"
          >
            realestate.co.nz
          </a>
          , I became a key engineer on New Zealand&apos;s most established
          real estate portal. I shipped industry-first features &mdash;
          instant price change alerts and transparent price history &mdash;
          that competitors copied months later. I designed a serverless
          notification system on AWS Lambda integrated with Braze that
          delivered listing alerts to every user on the platform, and led
          company-wide workshops on serverless architecture and observability.
        </p>
        <p>
          Now back in New York, I&apos;m building an open-source video
          streaming backend in Go &mdash; implementing ActivityPub federation
          and ATProto for decentralized content sharing, and cutting bandwidth
          costs to nearly $0 through Cloudflare CDN and Backblaze B2
          integration. I care about scalable systems, infrastructure
          automation, and the open web.
        </p>
      </div>
    </section>
  );
}
