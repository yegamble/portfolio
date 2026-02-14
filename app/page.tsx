import Header from '@/components/Header';
import About from '@/components/About';
import Experience from '@/components/Experience';
import Projects from '@/components/Projects';
import Footer from '@/components/Footer';
import SpotlightEffect from '@/components/SpotlightEffect';

export default function Home() {
  return (
    <>
      <SpotlightEffect />
      <div className="lg:flex lg:justify-between lg:gap-4">
        <Header />
        <main id="content" className="pt-24 lg:w-1/2 lg:py-24">
          <About />
          <Experience />
          <Projects />
          <Footer />
        </main>
      </div>
    </>
  );
}
