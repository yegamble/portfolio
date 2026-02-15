'use client';

interface ErrorPageProps {
  error: Error;
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-6">
      <div className="max-w-md text-center" role="alert">
        <h1 className="mb-4 text-4xl font-bold text-text-primary">
          Something Went Wrong
        </h1>
        <p className="mb-8 text-lg text-text-secondary">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="rounded-md bg-primary px-6 py-3 text-sm font-bold text-slate-900 transition-colors hover:bg-primary/90"
        >
          Try Again
        </button>
      </div>
    </main>
  );
}
