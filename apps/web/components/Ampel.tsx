/**
 * Das Ampel-Element (Prompt 12, Abschnitt 4.4): eine Pille in Salbei-Hell mit
 * drei Punkten – bewusst KEINE Straßenampel-Grafik. Ampelfarben werden
 * ausschließlich hier verwendet. Zustände:
 * - aus:            alle Punkte neutral (Ausgangszustand)
 * - gruen|gelb|rot: genau ein Punkt leuchtet (Glow, kein Dauerblinken)
 * - grau:           kein Punkt leuchtet (Prompt 13: „für unser Verfahren zu
 *                   klein“) – wie „aus“, aber mit eigener Beschreibung
 * `fortschritt` (0–4) lässt die Punkte beim Ausfüllen der Einstiegskarte
 * nacheinander heller werden.
 */
export type AmpelZustand = 'aus' | 'gruen' | 'gelb' | 'rot' | 'grau';

interface AmpelProps {
  zustand: AmpelZustand;
  fortschritt?: number | undefined;
  /** Ergebnis-Seite: 40-px-Punkte. */
  gross?: boolean | undefined;
  /** Sichtbare Beschriftung neben der Pille (z. B. „Grün“). */
  beschriftung?: string | undefined;
}

const BESCHREIBUNG: Record<AmpelZustand, string> = {
  aus: 'Ampel aus – noch kein Ergebnis',
  gruen: 'Ampel zeigt Grün',
  gelb: 'Ampel zeigt Gelb',
  rot: 'Ampel zeigt Rot',
  grau: 'Ampel ohne Licht – für unser Verfahren zu klein',
};

export function Ampel({ zustand, fortschritt, gross, beschriftung }: AmpelProps) {
  return (
    <div className="ampel-zeile">
      <div
        className={gross === true ? 'ampel ampel--gross' : 'ampel'}
        data-zustand={zustand}
        data-fortschritt={fortschritt !== undefined ? Math.min(Math.max(fortschritt, 0), 4) : undefined}
        role="img"
        aria-label={beschriftung !== undefined ? `Ampel: ${beschriftung}` : BESCHREIBUNG[zustand]}
      >
        <span className="punkt punkt--gruen" />
        <span className="punkt punkt--gelb" />
        <span className="punkt punkt--rot" />
      </div>
      {beschriftung !== undefined && <div className="ampel-text">{beschriftung}</div>}
    </div>
  );
}
