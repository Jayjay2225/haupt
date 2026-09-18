import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { BRAND } from '@/config/brand';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} – ${BRAND.claim}`,
    template: `%s · ${BRAND.name}`,
  },
  description:
    'Strukturierte Kurzprüfung für deutsche Lebens- und Rentenversicherungen: geschätzter Rückabwicklungswert in drei Szenarien, verglichen mit dem Rückkaufswert. Keine Rechtsberatung im Einzelfall.',
  robots: {
    // Vorabversion: nicht indexieren, bis Marke, Rechtstexte und Berechnung stehen.
    index: false,
    follow: false,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
