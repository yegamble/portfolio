export default function About() {
  return (
    <section
      aria-label="About me"
      className="scroll-mt-24 border-t border-slate-800/30 py-16 md:py-24"
      id="about"
    >
      <div className="mb-8 flex items-center gap-4 md:mb-10">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-200">
          About
        </h2>
        <div className="h-px flex-1 bg-slate-800"></div>
      </div>
      <div className="space-y-6 text-lg leading-relaxed text-slate-400">
        <p>
          Back in 2012, I decided to try my hand at creating custom Tumblr themes
          and tumbled head first into the rabbit hole of coding and web
          development. Fast-forward to today, and I’ve had the privilege of
          building software for an{' '}
          <a
            className="font-medium text-slate-200 underline decoration-slate-700 underline-offset-4 transition-colors hover:text-primary"
            href="#"
          >
            advertising agency
          </a>
          , a{' '}
          <a
            className="font-medium text-slate-200 underline decoration-slate-700 underline-offset-4 transition-colors hover:text-primary"
            href="#"
          >
            start-up
          </a>
          , and a{' '}
          <a
            className="font-medium text-slate-200 underline decoration-slate-700 underline-offset-4 transition-colors hover:text-primary"
            href="#"
          >
            huge corporation
          </a>
          .
        </p>
        <p>
          My main focus these days is engineering accessible, inclusive products
          and digital experiences at{' '}
          <span className="font-medium text-slate-200">TechCorp</span> for a
          variety of clients.
        </p>
        <p>
          I build scalable, high-performance web applications with a relentless
          focus on user experience and code quality. Currently engineering
          distributed systems. With over 8 years of experience in full-stack
          development, I specialize in bridging the gap between complex backend
          architecture and intuitive frontend design.
        </p>
      </div>
    </section>
  );
}
