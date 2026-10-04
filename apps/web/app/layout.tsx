import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import localFont from 'next/font/local';
import './globals.css';
import { BRAND, RANGE_TEXT } from '@/config/brand';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

// Design B (Prompt 12, 4.2): Newsreader für Überschriften, Manrope für Text.
// Beide OFL, vendored unter brand/fonts/ und von der eigenen Domain geliefert
// (kein Drittanbieter-Request zur Laufzeit).
const schriftTitel = localFont({
  src: '../../../brand/fonts/newsreader-latin-var.woff2',
  weight: '200 800',
  style: 'normal',
  variable: '--schrift-titel',
  display: 'swap',
});

const schriftText = localFont({
  src: '../../../brand/fonts/manrope-latin-var.woff2',
  weight: '200 800',
  style: 'normal',
  variable: '--schrift-text',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} – ${BRAND.claim}`,
    template: `%s · ${BRAND.name}`,
  },
  description: `Lebens- oder Rentenversicherung von ${RANGE_TEXT}? In 5 Minuten wissen Sie, ob rechnerisch mehr drin ist als der Rückkaufswert – kostenlose Ampel, klare Worte, auch beim Nein.`,
  robots: {
    // Beta bleibt noindex; erst mit NEXT_PUBLIC_INDEXIERUNG=1 (Go-live nach docs/DOMAIN-UMZUG.md) indexierbar.
    index: process.env['NEXT_PUBLIC_INDEXIERUNG'] === '1',
    follow: process.env['NEXT_PUBLIC_INDEXIERUNG'] === '1',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de" data-optik={BRAND.optik} className={`${schriftTitel.variable} ${schriftText.variable}`}>
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
