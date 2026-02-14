import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Header from '@/components/Header';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Yosef Gamble | Senior Full-Stack Engineer',
  description: 'Senior Full-Stack Engineer based in NYC.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} min-h-screen bg-background-dark font-sans leading-relaxed text-slate-400 antialiased selection:bg-primary selection:text-primary-900`}
      >
        <div className="pointer-events-none fixed left-0 top-0 -z-10 h-full w-full overflow-hidden">
          <div className="absolute left-0 top-0 h-full w-full bg-slate-900"></div>
          <div className="absolute right-[-10%] top-[-10%] h-[40rem] w-[40rem] rounded-full bg-[#1e293b] opacity-30 blur-[100px]"></div>
          <div className="absolute bottom-[-10%] left-[-10%] h-[30rem] w-[30rem] rounded-full bg-[#1e293b] opacity-30 blur-[80px]"></div>
        </div>
        <Header />
        {children}
      </body>
    </html>
  );
}
