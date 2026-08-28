import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin', 'cyrillic'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: 'Take Phone — магазин техники в Тюмени',
  description: 'Демо-концепция интернет-магазина Take Phone: актуальные цены, наличие и оформление заявки.',
  openGraph: {
    title: 'Take Phone — техника в Тюмени',
    description: 'Каталог техники с актуальными ценами и наличием.',
    images: ['/take-phone-hero.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body></html>;
}
