import Link from 'next/link';
import { CALC_VERSION } from '@rueckab/calc';
import { BRAND } from '@/config/brand';
import { VARIANTE } from '@/config/variante';
import { insurersDaten } from '@/lib/insurers-data';

export function SiteFooter() {
  return (
    <footer className="fuss">
      <div className="container fuss-innen">
        <nav className="fuss-nav" aria-label="Weitere Seiten">
          <Link href="/rechner">Rechner</Link>
          {VARIANTE.ankaufHinweis && <Link href="/verkaufen">Verkaufen statt kündigen</Link>}
          {VARIANTE.transparenzKasten && <Link href="/so-verdienen-wir">So verdienen wir</Link>}
          <Link href="/lebensversicherung">Versicherer</Link>
          {BRAND.b2bDomain !== '' && <Link href="/unternehmer">Für Unternehmer</Link>}
        </nav>
        <nav className="fuss-nav" aria-label="Rechtliches">
          <Link href="/impressum">Impressum</Link>
          <Link href="/datenschutz">Datenschutz</Link>
          <Link href="/agb">AGB</Link>
          <Link href="/widerrufsbelehrung">Widerrufsbelehrung</Link>
        </nav>
        <p>
          {BRAND.name} rechnet und ordnet ein. Wir sind keine Anwälte und beraten nicht im Einzelfall.
          Ob ein Widerspruch wirksam ist, prüft eine Kanzlei – wir bereiten das vor.
        </p>
        <p className="tabellenziffern">
          Rechenkern {CALC_VERSION} · Datenbank {insurersDaten.data.version} ({insurersDaten.data.stand}) ·
          Anbieter: {BRAND.anbieter}
        </p>
      </div>
    </footer>
  );
}
