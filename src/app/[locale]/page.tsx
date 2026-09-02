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
      {/* tabIndex -1 so following the skip link moves focus here, not just the
          viewport — otherwise the next Tab press returns to the header. The
          outline is what tells a keyboard user the jump landed; focus-visible
          keeps it off a mouse click into the same region. */}
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-3xl px-6 pb-24 focus-visible:outline-2 focus-visible:outline-primary lg:px-8"
      >
        <About />
        <Experience />
        <Projects />
      </main>
      <Footer />
    </>
  );
}
