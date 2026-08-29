import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { RequestDrawer } from '@/components/order/request-drawer';
import { RequestProvider } from '@/components/order/request-store';
import { Footer } from '@/components/site/footer';
import { Header } from '@/components/site/header';
import { withBase } from '@/lib/build-mode';
import { site } from '@/lib/site';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin', 'cyrillic'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin', 'cyrillic'] });

const title = 'Take Phone — магазин техники в Тюмени';
const description =
  'Каталог iPhone с актуальными ценами и наличием в Тюмени. Гарантия до 5 лет, '
  + 'собственный сервис, trade-in, самовывоз на Герцена, 84к2 и доставка по городу.';

export const metadata: Metadata = {
  title: {
    default: title,
    template: '%s — Take Phone',
  },
  description,
  applicationName: site.name,
  keywords: ['iPhone Тюмень', 'купить айфон Тюмень', 'Take Phone', 'техника Тюмень', 'trade-in Тюмень'],
  icons: { icon: withBase('/favicon.png') },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: site.name,
    title,
    description,
    images: [{ url: withBase('/assets/hero/iphone-17-pro-lineup.webp'), width: 2000, height: 1125 }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [withBase('/assets/hero/iphone-17-pro-lineup.webp')],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#26142e',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <RequestProvider>
          <Header />
          <main className="min-h-[60vh]">{children}</main>
          <Footer />
          <RequestDrawer />
        </RequestProvider>
      </body>
    </html>
  );
}
