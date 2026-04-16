import { headers } from 'next/headers';
import { Inter, Heebo } from 'next/font/google';
import JsonLd from '@/app/json-ld';
import { DEFAULT_LOCALE, getDirection, isAppLocale } from '@/lib/i18n';
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerStore = await headers();
  const localeHeader = headerStore.get('x-locale');
  const locale = isAppLocale(localeHeader) ? localeHeader : DEFAULT_LOCALE;

  return (
    <html lang={locale} dir={getDirection(locale)} className={`${inter.variable} ${heebo.variable}`}>
      <body className="min-h-screen font-[family-name:var(--font-inter),var(--font-heebo)] antialiased leading-relaxed">
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900" />
          <div className="absolute -right-[10%] -top-[10%] h-[40rem] w-[40rem] rounded-full bg-[#1e293b] opacity-30 blur-[100px]" />
          <div className="absolute -bottom-[10%] -left-[10%] h-[30rem] w-[30rem] rounded-full bg-[#1e293b] opacity-30 blur-[80px]" />
        </div>
        <JsonLd />
        {children}
      </body>
    </html>
  );
}
