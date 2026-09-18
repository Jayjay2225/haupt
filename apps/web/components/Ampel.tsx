/**
 * Das Erkennungszeichen: die Ampel (docs/DESIGN.md, Abschnitt 3).
 * Ampelfarben werden ausschließlich hier verwendet. Zustände:
 * - aus:    alle Lichter grau (Ausgangszustand)
 * - bereit: Schnellcheck vollständig, oberstes Licht pulsiert einmal kurz
 *           (bei prefers-reduced-motion nur Zustandswechsel)
 * - gruen | gelb | rot: genau ein Licht leuchtet
 * `fortschritt` (0–4) lässt beim Ausfüllen des Schnellchecks die Segmente
 * nacheinander hell werden.
 */
export type AmpelZustand = 'aus' | 'bereit' | 'gruen' | 'gelb' | 'rot';

interface AmpelProps {
  zustand: AmpelZustand;
  fortschritt?: number | undefined;
  gross?: boolean | undefined;
  /** Sichtbare Beschriftung (in Marineblau, neben der Ampel). */
  beschriftung?: string | undefined;
}

const BESCHREIBUNG: Record<AmpelZustand, string> = {
  aus: 'Ampel aus – noch kein Ergebnis',
  bereit: 'Ampel bereit – Angaben vollständig',
  gruen: 'Ampel zeigt Grün',
  gelb: 'Ampel zeigt Gelb',
  rot: 'Ampel zeigt Rot',
};

export function Ampel({ zustand, fortschritt, gross, beschriftung }: AmpelProps) {
  return (
    <div className="ampel-zeile">
      <div
        className={gross === true ? 'ampel ampel--gross' : 'ampel'}
        data-zustand={zustand}
        data-fortschritt={fortschritt !== undefined ? Math.min(Math.max(fortschritt, 0), 4) : undefined}
        role="img"
        aria-label={beschriftung ?? BESCHREIBUNG[zustand]}
      >
        <span className="licht licht--rot" />
        <span className="licht licht--gelb" />
        <span className="licht licht--gruen" />
      </div>
      {beschriftung !== undefined && <div className="ampel-text">{beschriftung}</div>}
    </div>
  );
}
