import Link from 'next/link';
import { BRAND } from '@/config/brand';
import { VARIANTE } from '@/config/variante';

/** Kopfzeile (Prompt 12, Abschnitt 3.1): Marke · Navigation · „Jetzt prüfen“. */
export function SiteHeader() {
  const beta = (process.env['BETA_PASSWORT'] ?? '') !== '';
  return (
    <>
      {beta && <p className="vorab-banner">Beta-Version – nur mit Passwort erreichbar, noch nicht freigeschaltet.</p>}
      <header className="kopf">
        <div className="container kopf-innen">
          <Link href="/" className="marke">
            {BRAND.name}
          </Link>
          <nav className="kopf-nav" aria-label="Hauptnavigation">
            <Link href="/rechner">Rechner</Link>
            {VARIANTE.ankaufHinweis && <Link href="/verkaufen">Verkaufen</Link>}
            {VARIANTE.transparenzKasten && <Link href="/so-verdienen-wir">So verdienen wir</Link>}
            <Link href="/#fragen">Fragen</Link>
            <Link href="/rechner" className="knopf haupt kopf-knopf">
              Jetzt prüfen
            </Link>
          </nav>
        </div>
      </header>
    </>
  );
}
