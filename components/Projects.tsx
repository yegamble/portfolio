export default function Projects() {
  return (
    <section
      aria-label="Selected projects"
      className="scroll-mt-24 border-t border-slate-800/30 py-16 md:py-24"
      id="projects"
    >
      <div className="mb-12 flex items-center gap-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-200">
          Projects
        </h2>
        <div className="h-px flex-1 bg-slate-800"></div>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
        <div className="group relative flex flex-col rounded-2xl border border-slate-700/30 bg-slate-800/30 p-8 shadow-xl shadow-black/20 transition-all hover:border-slate-700/50 hover:bg-slate-800/50">
          <div className="mb-6 flex items-start justify-between">
            <span className="material-icons text-4xl text-primary/90">
              folder_open
            </span>
            <span className="material-icons text-slate-500 transition-colors group-hover:text-primary">
              arrow_outward
            </span>
          </div>
          <h3 className="mb-3 text-xl font-bold text-slate-100">
            <a className="before:absolute before:inset-0" href="#">
              Project Alpha
            </a>
          </h3>
          <p className="mb-6 flex-grow text-sm leading-relaxed text-slate-400">
            A distributed data processing engine capable of handling petabytes of
            logs in real-time. Built with Rust and Kafka to ensure high
            availability.
          </p>
          <ul className="mt-auto flex flex-wrap gap-x-4 gap-y-2">
            <li className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Rust
            </li>
            <li className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Kafka
            </li>
            <li className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
              AWS
            </li>
          </ul>
        </div>
        <div className="group relative flex flex-col rounded-2xl border border-slate-700/30 bg-slate-800/30 p-8 shadow-xl shadow-black/20 transition-all hover:border-slate-700/50 hover:bg-slate-800/50">
          <div className="mb-6 flex items-start justify-between">
            <span className="material-icons text-4xl text-primary/90">
              layers
            </span>
            <span className="material-icons text-slate-500 transition-colors group-hover:text-primary">
              arrow_outward
            </span>
          </div>
          <h3 className="mb-3 text-xl font-bold text-slate-100">
            <a className="before:absolute before:inset-0" href="#">
              Neon UI Kit
            </a>
          </h3>
          <p className="mb-6 flex-grow text-sm leading-relaxed text-slate-400">
            An open-source React component library focused on accessibility and
            dark mode aesthetics. 2k+ stars on GitHub.
          </p>
          <ul className="mt-auto flex flex-wrap gap-x-4 gap-y-2">
            <li className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
              React
            </li>
            <li className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Tailwind
            </li>
            <li className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
              A11y
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
