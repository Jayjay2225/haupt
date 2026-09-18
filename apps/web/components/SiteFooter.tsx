import Link from 'next/link';
import { CALC_VERSION } from '@rueckab/calc';
import { BRAND } from '@/config/brand';

export function SiteFooter() {
  return (
    <footer className="fuss">
      <div className="container fuss-innen">
        <nav className="fuss-nav" aria-label="Rechtliches">
          <Link href="/impressum">Impressum</Link>
          <Link href="/datenschutz">Datenschutz</Link>
          <Link href="/agb">AGB</Link>
          <Link href="/widerrufsbelehrung">Widerrufsbelehrung</Link>
        </nav>
        <p>
          {BRAND.name} erstellt strukturierte Berechnungen und Hinweise zur Vorbereitung einer
          anwaltlichen Prüfung. Es handelt sich nicht um Rechtsberatung im Einzelfall; die
          rechtliche Bewertung obliegt einem Rechtsanwalt.
        </p>
        <p>
          Rechenkern-Version {CALC_VERSION} · Versichererdaten: noch nicht hinterlegt
          (data.version folgt mit der Versicherer-Datenbank).
        </p>
      </div>
    </footer>
  );
}
