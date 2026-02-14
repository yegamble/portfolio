export default function About() {
  return (
    <section
      id="about"
      className="mb-16 scroll-mt-16 md:mb-24 lg:mb-36 lg:scroll-mt-24"
      aria-label="About me"
    >
      <div className="sticky top-0 z-20 -mx-6 mb-4 w-screen bg-bg-dark/75 px-6 py-5 backdrop-blur md:-mx-12 md:px-12 lg:sr-only lg:relative lg:top-auto lg:mx-auto lg:w-full lg:px-0 lg:py-0 lg:opacity-0">
        <h2 className="text-sm font-bold uppercase tracking-widest text-text-primary lg:sr-only">
          About
        </h2>
      </div>
      <div className="space-y-4">
        <p>
          Back in 2012, I decided to try my hand at creating custom Tumblr
          themes and tumbled head first into the rabbit hole of coding and web
          development. Fast-forward to today, and I&apos;ve had the privilege of
          building software for a{' '}
          <a
            className="font-medium text-text-primary hover:text-primary focus-visible:text-primary"
            href="https://www.realestate.co.nz"
            target="_blank"
            rel="noreferrer noopener"
          >
            real estate marketplace
          </a>
          , a{' '}
          <a
            className="font-medium text-text-primary hover:text-primary focus-visible:text-primary"
            href="#"
            target="_blank"
            rel="noreferrer noopener"
          >
            fintech startup
          </a>
          , and an{' '}
          <a
            className="font-medium text-text-primary hover:text-primary focus-visible:text-primary"
            href="#"
            target="_blank"
            rel="noreferrer noopener"
          >
            enterprise SaaS platform
          </a>
          .
        </p>
        <p>
          My main focus these days is building robust, scalable backend services
          and APIs at{' '}
          <a
            className="font-medium text-text-primary hover:text-primary focus-visible:text-primary"
            href="#"
            target="_blank"
            rel="noreferrer noopener"
          >
            TechCorp
          </a>
          . I enjoy working at the intersection of design and engineering &mdash;
          where pixel-perfect frontends meet battle-tested distributed systems.
        </p>
        <p>
          When I&apos;m not at the computer, I&apos;m usually exploring NYC,
          reading about distributed systems, or diving deep into the latest in
          cloud-native architecture.
        </p>
      </div>
    </section>
  );
}
