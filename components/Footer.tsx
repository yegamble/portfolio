export default function Footer() {
  return (
    <footer className="mt-12 border-t border-slate-800/30 pb-8 pt-12 text-center text-sm text-text-muted">
      <div className="mb-8 flex justify-center gap-8">
        <a
          className="transition-colors hover:text-text-primary"
          href="https://github.com/yegamble"
          target="_blank"
          rel="noreferrer noopener"
        >
          <span className="sr-only">GitHub</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="h-6 w-6"
            aria-hidden="true"
          >
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
        </a>
        <a
          className="transition-colors hover:text-text-primary"
          href="https://linkedin.com/in/yosefgamble"
          target="_blank"
          rel="noreferrer noopener"
        >
          <span className="sr-only">LinkedIn</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-6 w-6"
            aria-hidden="true"
          >
            <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.21-.43-1.56-1.1-1.56-.91 0-1.28.66-1.28 1.95V19h-3v-9h2.9v1.3c.36-.63 1.26-1.23 2.88-1.23 2.16 0 2.6 1.56 2.6 4.3z" />
          </svg>
        </a>
        <a
          className="transition-colors hover:text-text-primary"
          href="mailto:hello@yosefgamble.com"
        >
          <span className="sr-only">Email</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-6 w-6"
            aria-hidden="true"
          >
            <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
            <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
          </svg>
        </a>
      </div>
      <p className="mx-auto max-w-md">
        Coded in{' '}
        <a
          className="font-medium text-text-secondary transition-colors hover:text-primary"
          href="https://code.visualstudio.com/"
          target="_blank"
          rel="noreferrer noopener"
        >
          Visual Studio Code
        </a>
        . Built with{' '}
        <a
          className="font-medium text-text-secondary transition-colors hover:text-primary"
          href="https://tailwindcss.com/"
          target="_blank"
          rel="noreferrer noopener"
        >
          Tailwind CSS
        </a>
        {' '}and{' '}
        <a
          className="font-medium text-text-secondary transition-colors hover:text-primary"
          href="https://fonts.google.com/specimen/Inter"
          target="_blank"
          rel="noreferrer noopener"
        >
          Inter
        </a>
        {' '}font.
      </p>
    </footer>
  );
}
