import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Archivo, Source_Sans_3 } from 'next/font/google';
import './globals.css';
import { BRAND } from '@/config/brand';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

// Beide Schriften sind Open-Font-License; Next lädt sie beim Build und liefert
// sie von der eigenen Domain (kein Drittanbieter-Request zur Laufzeit).
const schriftTitel = Archivo({
  subsets: ['latin'],
  weight: ['800'],
  variable: '--schrift-titel',
  display: 'swap',
});

const schriftText = Source_Sans_3({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--schrift-text',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} – ${BRAND.claim}`,
    template: `%s · ${BRAND.name}`,
  },
  description:
    'Alte Lebens- oder Rentenversicherung? Der Policen-Check rechnet, ob ein Widerspruch mehr bringen kann als die Kündigung – kostenlose Ampel, klare Worte, auch beim Nein.',
  robots: {
    // Beta: nicht indexieren, bis Rechtstexte und Regelwerk anwaltlich abgenommen sind.
    index: false,
    follow: false,
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
