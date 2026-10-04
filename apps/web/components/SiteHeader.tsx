import Link from 'next/link';
import { BRAND } from '@/config/brand';
import { VARIANTE } from '@/config/variante';

/**
 * Kopfzeile (Prompt 12, 3.1): Marke · Navigation · „Jetzt prüfen“. Seit
 * Prompt 14 führt „Jetzt prüfen“ zur Ampel-Karte der Startseite – der
 * Rechner ist nur über den grünen Knopf bei Grün/Gelb erreichbar.
 */
export function SiteHeader() {
  const beta = (process.env['BETA_PASSWORT'] ?? '') !== '';
  const rechnerZiel = VARIANTE.berichtKostenpflichtig ? '/#ampel' : '/rechner';
  return (
    <>
      {beta && <p className="vorab-banner">Beta-Version – nur mit Passwort erreichbar, noch nicht freigeschaltet.</p>}
      <header className="kopf">
        <div className="container kopf-innen">
          <Link href="/" className="marke">
            {BRAND.name}
          </Link>
          <nav className="kopf-nav" aria-label="Hauptnavigation">
            <Link href="/gutachten">Gutachten</Link>
            {VARIANTE.ankaufHinweis && <Link href="/verkaufen">Verkaufen</Link>}
            <Link href="/#fragen">Fragen</Link>
            <Link href={rechnerZiel} className="knopf haupt kopf-knopf">
              Jetzt prüfen
            </Link>
          </nav>
        </div>
      </header>
    </>
  );
}
