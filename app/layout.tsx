import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import I18nProvider from '@/components/I18nProvider';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Yosef Gamble | Senior Full-Stack Engineer',
  description:
    'NYC based senior full-stack engineer specializing in Go, TypeScript, and AWS. Building accessible, pixel-perfect digital experiences.',
  metadataBase: new URL('https://yosefgamble.com'),
  openGraph: {
    title: 'Yosef Gamble | Senior Full-Stack Engineer',
    description:
      'NYC based senior full-stack engineer specializing in Go, TypeScript, and AWS.',
    url: 'https://yosefgamble.com',
    siteName: 'Yosef Gamble',
    locale: 'en_US',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-[family-name:var(--font-inter)] antialiased leading-relaxed min-h-screen">
        {/* Background decorative blurs */}
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900" />
          <div className="absolute -right-[10%] -top-[10%] h-[40rem] w-[40rem] rounded-full bg-[#1e293b] opacity-30 blur-[100px]" />
          <div className="absolute -bottom-[10%] -left-[10%] h-[30rem] w-[30rem] rounded-full bg-[#1e293b] opacity-30 blur-[80px]" />
        </div>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
