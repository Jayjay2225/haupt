'use client';

/**
 * Verkaufen-Karte (Prompt 13, 2.2 / Prompt 14, 1.2): erscheint bei Rot
 * (rechnerisch kein Vorteil) anstelle des Kaufknopfs. Eigene, nie
 * vorangekreuzte Einwilligung mit Vergütungs-Offenlegung; erst mit Häkchen
 * geht es zum Ankaufsangebot.
 */
import Link from 'next/link';
import { BRAND } from '@/config/brand';

export function VerkaufenKarte({
  einwilligung,
  onEinwilligung,
}: {
  einwilligung: boolean;
  onEinwilligung: (angehakt: boolean) => void;
}) {
  return (
    <section aria-labelledby="verkaufen-karte-titel" className="karte klein verkaufen-karte">
      <h3 id="verkaufen-karte-titel">Nicht streiten? Verkaufen prüfen.</h3>
      <p>Der dritte Weg neben Kündigen und Rückabwicklung.</p>
      <div className="feld">
        <div className="optionen">
          <label>
            <input
              type="checkbox"
              checked={einwilligung}
              onChange={(ereignis) => onEinwilligung(ereignis.target.checked)}
            />
            <span>
              Ja, {BRAND.name} darf mich zu einem Ankaufsangebot kontaktieren und dafür meine
              Vertragsangaben nutzen. Wir erhalten vom Organisationspartner eine Vergütung.
              (freiwillig, jederzeit widerrufbar)
            </span>
          </label>
        </div>
      </div>
      <p style={{ marginBottom: 0 }}>
        <Link
          href="/verkaufen"
          className="knopf zweitrangig"
          aria-disabled={!einwilligung}
          onClick={(ereignis) => {
            if (!einwilligung) {
              ereignis.preventDefault();
            }
          }}
        >
          Unverbindliches Ankaufsangebot anfordern
        </Link>
      </p>
      {!einwilligung && (
        <p className="erklaerung" style={{ marginTop: '0.5rem', marginBottom: 0 }}>
          Erst mit Ihrem Häkchen geht es weiter – ohne Ja geben wir nichts weiter.
        </p>
      )}
    </section>
  );
}
