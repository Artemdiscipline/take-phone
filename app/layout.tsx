import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin', 'cyrillic'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: 'Take Phone — магазин техники в Тюмени',
  description: 'Каталог техники Take Phone с актуальными ценами и наличием, гарантией до 5 лет и собственным сервисом.',
  openGraph: {
    title: 'Take Phone — магазин техники в Тюмени',
    description: 'Актуальные цены, наличие, гарантия до 5 лет и собственный сервис.',
    images: ['/iphone-17-pro-hero.jpg'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body></html>;
}
