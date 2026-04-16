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
    <main className="mx-auto w-full max-w-3xl px-6 pb-24 lg:px-8">
      <ScrollHeader />
      <About />
      <Experience />
      <Projects />
      <Footer />
    </main>
  );
}
