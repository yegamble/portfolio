'use client';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// The last resort: this replaces the root layout, which since the move to
// `[locale]/layout.tsx` is the only thing rendering <html>/<body>. Nothing from
// the app is available here — no I18nProvider, no globals.css — so the copy is
// English and the styling is inline.
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en" dir="ltr">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 1.5rem',
          backgroundColor: '#0f172a',
          color: '#94a3b8',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif',
          lineHeight: 1.6,
        }}
      >
        <main style={{ maxWidth: '28rem', textAlign: 'center' }} role="alert">
          <h1 style={{ margin: '0 0 1rem', fontSize: '2rem', color: '#e2e8f0' }}>
            Something went wrong
          </h1>
          <p style={{ margin: '0 0 2rem', fontSize: '1.125rem' }}>
            An unexpected error occurred. Please reload the page.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              border: 0,
              borderRadius: '0.375rem',
              padding: '0.75rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: 700,
              cursor: 'pointer',
              backgroundColor: '#5eead4',
              color: '#0f172a',
            }}
          >
            Reload
          </button>
        </main>
      </body>
    </html>
  );
}
