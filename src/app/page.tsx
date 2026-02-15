import ScrollHeader from '@/components/ScrollHeader';
import About from '@/components/About';
import Experience from '@/components/Experience';
import Projects from '@/components/Projects';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <>
      <ScrollHeader />
      <main className="mx-auto w-full max-w-3xl px-6 pb-24 lg:px-8">
        <About />
        <Experience />
        <Projects />
        <Footer />
      </main>
    </>
  );
}
