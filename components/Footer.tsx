export default function Footer() {
  return (
    <footer className="max-w-md pb-16 text-sm text-text-secondary sm:pb-0">
      <p>
        Coded in{' '}
        <a
          className="font-medium text-text-primary hover:text-primary focus-visible:text-primary"
          href="https://code.visualstudio.com/"
          target="_blank"
          rel="noreferrer noopener"
        >
          Visual Studio Code
        </a>
        . Built with{' '}
        <a
          className="font-medium text-text-primary hover:text-primary focus-visible:text-primary"
          href="https://nextjs.org/"
          target="_blank"
          rel="noreferrer noopener"
        >
          Next.js
        </a>
        {' '}and{' '}
        <a
          className="font-medium text-text-primary hover:text-primary focus-visible:text-primary"
          href="https://tailwindcss.com/"
          target="_blank"
          rel="noreferrer noopener"
        >
          Tailwind CSS
        </a>
        , set in the{' '}
        <a
          className="font-medium text-text-primary hover:text-primary focus-visible:text-primary"
          href="https://rsms.me/inter/"
          target="_blank"
          rel="noreferrer noopener"
        >
          Inter
        </a>
        {' '}typeface.
      </p>
    </footer>
  );
}
