import Link from 'next/link';
import { BRAND } from '@/config/brand';

export function SiteHeader() {
  return (
    <>
      <p className="vorab-banner">
        Vorabversion im Aufbau – die Berechnung ist noch nicht freigeschaltet.
      </p>
      <header className="kopf">
        <div className="container kopf-innen">
          <Link href="/" className="marke">
            {BRAND.name}
          </Link>
          <nav className="kopf-nav" aria-label="Hauptnavigation">
            <Link href="/rechner">Rechner</Link>
            <Link href="/#methodik">Methodik</Link>
            <Link href="/#faq">Häufige Fragen</Link>
          </nav>
        </div>
      </header>
    </>
  );
}
