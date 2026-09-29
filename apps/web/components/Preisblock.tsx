/**
 * Preisblock (Prompt 14, Abschnitt 4) – Startseite und Schritt 11. Kein
 * Streichpreis; Zeilen aus lib/preisblock.ts (Anrechnung nur mit
 * PREIS_ANRECHNUNG, Vergleichssatz nur mit Quelle).
 */
import { BERICHT_PREIS_HINWEIS } from '@/config/business';
import { preisblockZeilen } from '@/lib/preisblock';

export function Preisblock({ kompakt }: { kompakt?: boolean | undefined }) {
  const zeilen = preisblockZeilen();
  return (
    <div className={kompakt === true ? 'preisblock preisblock--kompakt' : 'preisblock'}>
      {zeilen.map((zeile, index) => (
        <p key={index} className={index === 0 ? 'preisblock-haupt' : 'preisblock-zeile'}>
          {zeile.fett !== '' && <strong>{zeile.fett}</strong>}
          {zeile.fett !== '' && zeile.rest !== '' ? ' ' : ''}
          {zeile.rest}
        </p>
      ))}
      <p className="erklaerung" style={{ margin: 0 }}>
        {BERICHT_PREIS_HINWEIS}. Kein Abo, keine Folgekosten.
      </p>
    </div>
  );
}
