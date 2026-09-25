import Link from 'next/link';
import { CALC_VERSION } from '@rueckab/calc';
import { BRAND } from '@/config/brand';
import { VARIANTE } from '@/config/variante';
import { insurersDaten } from '@/lib/insurers-data';

/** Fußzeile (Prompt 12, Abschnitt 3.1). */
export function SiteFooter() {
  return (
    <footer className="fuss">
      <div className="container fuss-innen">
        <p style={{ margin: 0, fontWeight: 600 }}>Schätzung mit Bandbreite · keine Rechtsberatung</p>
        <nav className="fuss-nav" aria-label="Rechtliches">
          <Link href="/impressum">Impressum</Link>
          <Link href="/datenschutz">Datenschutz</Link>
          <Link href="/agb">AGB</Link>
          <Link href="/widerrufsbelehrung">Widerruf</Link>
        </nav>
        <nav className="fuss-nav" aria-label="Weitere Seiten">
          <Link href="/rechner">Rechner</Link>
          {VARIANTE.ankaufHinweis && <Link href="/verkaufen">Verkaufen</Link>}
          {VARIANTE.transparenzKasten && <Link href="/so-verdienen-wir">So verdienen wir</Link>}
          <Link href="/anfrage">Individuelle Prüfung</Link>
          <Link href="/lebensversicherung">Versicherer</Link>
        </nav>
        <p className="tabellenziffern" style={{ margin: 0 }}>
          Rechenkern {CALC_VERSION} · Datenbank {insurersDaten.data.version} ({insurersDaten.data.stand}) ·
          Anbieter: {BRAND.anbieter}
        </p>
      </div>
    </footer>
  );
}
