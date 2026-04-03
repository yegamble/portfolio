import type { Metadata } from 'next';
import { Inter, Heebo } from 'next/font/google';
import I18nProvider from '@/components/I18nProvider';
import JsonLd from '@/app/json-ld';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
  variable: '--font-inter',
});

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  display: 'swap',
  variable: '--font-heebo',
});

export const metadata: Metadata = {
  title: 'Yosef Gamble | Senior Software Engineer — Go, TypeScript, AWS',
  description:
    'Yosef Gamble — Senior Software Engineer in New York & Auckland. Go (Golang), TypeScript, AWS specialist. Real estate portals, video streaming platforms, and scalable cloud systems.',
  metadataBase: new URL('https://yosefgamble.com'),
  keywords: [
    'Yosef Gamble',
    'senior software engineer',
    'Golang',
    'Go developer',
    'TypeScript',
    'AWS',
    'New York software engineer',
    'Auckland software engineer',
    'New Zealand developer',
    'real estate portal engineer',
    'video streaming',
    'full-stack engineer',
    'ActivityPub',
    'cloud infrastructure',
  ],
  openGraph: {
    title: 'Yosef Gamble | Senior Software Engineer — Go, TypeScript, AWS',
    description:
      'Senior Software Engineer in New York & Auckland. Go (Golang), TypeScript, AWS. Real estate portals, video streaming, and scalable cloud systems.',
    url: 'https://yosefgamble.com',
    siteName: 'Yosef Gamble',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Yosef Gamble — Senior Software Engineer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Yosef Gamble | Senior Software Engineer — Go, TypeScript, AWS',
    description:
      'Senior Software Engineer in New York & Auckland. Go (Golang), TypeScript, AWS. Real estate portals, video streaming, and scalable cloud systems.',
    images: ['/images/og-image.jpg'],
  },
  alternates: {
    canonical: 'https://yosefgamble.com',
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
    <html lang="en" className={`${inter.variable} ${heebo.variable}`}>
      <body className="font-[family-name:var(--font-inter),var(--font-heebo)] antialiased leading-relaxed min-h-screen">
        {/* Background decorative blurs */}
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900" />
          <div className="absolute -right-[10%] -top-[10%] h-[40rem] w-[40rem] rounded-full bg-[#1e293b] opacity-30 blur-[100px]" />
          <div className="absolute -bottom-[10%] -left-[10%] h-[30rem] w-[30rem] rounded-full bg-[#1e293b] opacity-30 blur-[80px]" />
        </div>
        <JsonLd />
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
