export default function Experience() {
  return (
    <section
      aria-label="Work experience"
      className="scroll-mt-24 border-t border-slate-800/30 py-16 md:py-24"
      id="experience"
    >
      <div className="mb-12 flex items-center gap-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-200">
          Experience
        </h2>
        <div className="h-px flex-1 bg-slate-800"></div>
      </div>
      <ol className="space-y-12">
        <li>
          <div className="group relative grid grid-cols-1 gap-2 transition-all sm:grid-cols-12 sm:gap-6">
            <header className="pt-1 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:col-span-3">
              2020 — Present
            </header>
            <div className="sm:col-span-9">
              <h3 className="text-lg font-medium leading-snug text-slate-200">
                <a
                  className="group/link inline-flex items-baseline font-medium leading-tight text-slate-200 hover:text-primary"
                  href="#"
                  rel="noreferrer"
                  target="_blank"
                >
                  <span>Senior Engineer · TechCorp</span>
                  <svg
                    aria-hidden="true"
                    className="ml-1 translate-y-px inline-block h-4 w-4 shrink-0 transition-transform group-hover/link:-translate-y-1 group-hover/link:translate-x-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      clipRule="evenodd"
                      d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z"
                      fillRule="evenodd"
                    ></path>
                  </svg>
                </a>
              </h3>
              <p className="mt-2 text-base leading-relaxed text-slate-400">
                Leading the core platform team in redesigning the microservices
                architecture to support 5M+ daily active users. Improved system
                latency by 40% through aggressive caching strategies and database
                optimization.
              </p>
              <ul aria-label="Technologies used" className="mt-4 flex flex-wrap gap-2">
                <li className="rounded-full border border-slate-700/50 bg-slate-800/50 px-3 py-1 text-xs font-medium text-primary">
                  Go
                </li>
                <li className="rounded-full border border-slate-700/50 bg-slate-800/50 px-3 py-1 text-xs font-medium text-primary">
                  gRPC
                </li>
                <li className="rounded-full border border-slate-700/50 bg-slate-800/50 px-3 py-1 text-xs font-medium text-primary">
                  Kubernetes
                </li>
                <li className="rounded-full border border-slate-700/50 bg-slate-800/50 px-3 py-1 text-xs font-medium text-primary">
                  AWS
                </li>
              </ul>
            </div>
          </div>
        </li>
        <li>
          <div className="group relative grid grid-cols-1 gap-2 transition-all sm:grid-cols-12 sm:gap-6">
            <header className="pt-1 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:col-span-3">
              2018 — 2020
            </header>
            <div className="sm:col-span-9">
              <h3 className="text-lg font-medium leading-snug text-slate-200">
                <a
                  className="group/link inline-flex items-baseline font-medium leading-tight text-slate-200 hover:text-primary"
                  href="#"
                  rel="noreferrer"
                  target="_blank"
                >
                  <span>Software Engineer · realestate.co.nz</span>
                  <svg
                    aria-hidden="true"
                    className="ml-1 translate-y-px inline-block h-4 w-4 shrink-0 transition-transform group-hover/link:-translate-y-1 group-hover/link:translate-x-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      clipRule="evenodd"
                      d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z"
                      fillRule="evenodd"
                    ></path>
                  </svg>
                </a>
              </h3>
              <p className="mt-2 text-base leading-relaxed text-slate-400">
                Architected and built the MVP for a fintech dashboard that
                secured Series A funding. Collaborated closely with product
                designers to implement pixel-perfect, responsive interfaces.
              </p>
              <ul aria-label="Technologies used" className="mt-4 flex flex-wrap gap-2">
                <li className="rounded-full border border-slate-700/50 bg-slate-800/50 px-3 py-1 text-xs font-medium text-primary">
                  React
                </li>
                <li className="rounded-full border border-slate-700/50 bg-slate-800/50 px-3 py-1 text-xs font-medium text-primary">
                  TypeScript
                </li>
                <li className="rounded-full border border-slate-700/50 bg-slate-800/50 px-3 py-1 text-xs font-medium text-primary">
                  Node.js
                </li>
              </ul>
            </div>
          </div>
        </li>
        <li>
          <div className="group relative grid grid-cols-1 gap-2 transition-all sm:grid-cols-12 sm:gap-6">
            <header className="pt-1 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:col-span-3">
              2016 — 2018
            </header>
            <div className="sm:col-span-9">
              <h3 className="text-lg font-medium leading-snug text-slate-200">
                <a
                  className="group/link inline-flex items-baseline font-medium leading-tight text-slate-200 hover:text-primary"
                  href="#"
                  rel="noreferrer"
                  target="_blank"
                >
                  <span>Frontend Developer · Proactiv</span>
                  <svg
                    aria-hidden="true"
                    className="ml-1 translate-y-px inline-block h-4 w-4 shrink-0 transition-transform group-hover/link:-translate-y-1 group-hover/link:translate-x-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      clipRule="evenodd"
                      d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z"
                      fillRule="evenodd"
                    ></path>
                  </svg>
                </a>
              </h3>
              <p className="mt-2 text-base leading-relaxed text-slate-400">
                Developed interactive marketing sites for Fortune 500 clients.
                Focused on WebGL animations and high-fidelity transitions to
                drive engagement.
              </p>
              <ul aria-label="Technologies used" className="mt-4 flex flex-wrap gap-2">
                <li className="rounded-full border border-slate-700/50 bg-slate-800/50 px-3 py-1 text-xs font-medium text-primary">
                  JavaScript
                </li>
                <li className="rounded-full border border-slate-700/50 bg-slate-800/50 px-3 py-1 text-xs font-medium text-primary">
                  WebGL
                </li>
                <li className="rounded-full border border-slate-700/50 bg-slate-800/50 px-3 py-1 text-xs font-medium text-primary">
                  GSAP
                </li>
              </ul>
            </div>
          </div>
        </li>
      </ol>
      <div className="mt-16 flex justify-start">
        <a
          aria-label="View Full Résumé"
          className="group inline-flex items-center gap-2 font-semibold text-slate-200"
          href="#"
        >
          <span className="border-b border-transparent pb-px transition-all group-hover:border-primary">
            View Full Résumé
          </span>
          <svg
            aria-hidden="true"
            className="h-4 w-4 transition-transform group-hover:translate-x-1"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              clipRule="evenodd"
              d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
              fillRule="evenodd"
            ></path>
          </svg>
        </a>
      </div>
    </section>
  );
}
