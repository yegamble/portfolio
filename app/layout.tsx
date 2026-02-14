import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
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
      <body className="font-[family-name:var(--font-inter)] antialiased leading-relaxed">
        <div className="relative mx-auto min-h-screen max-w-screen-xl px-6 py-12 md:px-12 md:py-20 lg:px-24 lg:py-0">
          {children}
        </div>
      </body>
    </html>
  );
}
