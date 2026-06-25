import { notFound } from 'next/navigation';
import ScrollHeader from '@/components/ScrollHeader';
import About from '@/components/About';
import Experience from '@/components/Experience';
import Projects from '@/components/Projects';
import Footer from '@/components/Footer';
import { isAppLocale } from '@/lib/i18n';

export default async function LocalizedHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isAppLocale(locale)) {
    notFound();
  }

  return (
    <>
      {/* ScrollHeader renders the <header> banner and the hero <section> as
          adjacent siblings (the layout-stability suite selects the hero via
          `header + section`). Keeping <header> and <footer> outside <main>
          exposes them as the banner and contentinfo landmarks. */}
      <ScrollHeader />
      <main className="mx-auto w-full max-w-3xl px-6 pb-24 lg:px-8">
        <About />
        <Experience />
        <Projects />
      </main>
      <Footer />
    </>
  );
}
