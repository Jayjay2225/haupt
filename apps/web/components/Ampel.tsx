/**
 * Das Ampel-Element. Zwei Varianten:
 *
 * - `verkehr` (Prompt 14, Abschnitt 1.2): hochkant, realistisch wie eine
 *   Verkehrsampel – dunkles Gehäuse #1E2A33 mit abgerundeten Ecken, drei
 *   Leuchten übereinander mit Blende, Mast angedeutet. Inline-SVG, keine
 *   Bilddatei. Desktop 120 × 300 px, mobil 96 × 240 px (CSS). Aus: alle
 *   Leuchten matt (#3A4A55). An: eine Leuchte
 *   in voller Farbe mit Glow (24 px, 45 % Alpha), Übergang 300 ms; bei
 *   `prefers-reduced-motion` ohne Animation. Grau: alle matt, Rahmen in Salbei,
 *   Etikett „zu klein für unser Verfahren“ unter dem Gehäuse.
 * - `pille` (Prompt 12, 4.4): Pille in Salbei-Hell mit drei Punkten – bleibt
 *   für die Kanzlei-Variante (Ergebnis-Seite mit Eignungs-Check).
 *
 * Ampelfarben werden ausschließlich hier verwendet.
 */
export type AmpelZustand = 'aus' | 'gruen' | 'gelb' | 'rot' | 'grau';

interface AmpelProps {
  zustand: AmpelZustand;
  variante?: 'pille' | 'verkehr' | undefined;
  fortschritt?: number | undefined;
  /** Pille: 40-px-Punkte. */
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

export const AMPEL_GRAU_ETIKETT = 'zu klein für unser Verfahren';

const LEUCHTEN: { farbe: Exclude<AmpelZustand, 'aus' | 'grau'>; cy: number }[] = [
  { farbe: 'rot', cy: 58 },
  { farbe: 'gelb', cy: 138 },
  { farbe: 'gruen', cy: 218 },
];

function Verkehrsampel({ zustand }: { zustand: AmpelZustand }) {
  return (
    <div className="ampel-verkehr-behaelter">
      <svg
        className="ampel-verkehr"
        data-zustand={zustand}
        viewBox="0 0 120 300"
        role="img"
        aria-label={BESCHREIBUNG[zustand]}
        focusable="false"
      >
        <defs>
          <filter id="ampel-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
        </defs>
        {/* Mast (angedeutet) */}
        <rect className="ampel-mast" x="52" y="262" width="16" height="38" rx="3" />
        {/* Gehäuse */}
        <rect className="ampel-gehaeuse" x="10" y="4" width="100" height="264" rx="20" />
        {LEUCHTEN.map(({ farbe, cy }) => (
          <g key={farbe} className={`ampel-leuchte ampel-leuchte--${farbe}`} data-an={zustand === farbe ? 'ja' : 'nein'}>
            {/* Glow hinter der Leuchte (nur wenn an) */}
            <circle className="ampel-glow" cx="60" cy={cy} r="30" filter="url(#ampel-glow)" />
            {/* Fassung */}
            <circle className="ampel-fassung" cx="60" cy={cy} r="34" />
            {/* Leuchte */}
            <circle className="ampel-lampe" cx="60" cy={cy} r="29" />
            {/* Blende: Halbschatten als Kreisabschnitt über dem oberen Rand der Leuchte (Sehne 18 über der Mitte, r 29) */}
            <path className="ampel-blende" d={`M37.26 ${cy - 18} A29 29 0 0 1 82.74 ${cy - 18} Z`} />
          </g>
        ))}
      </svg>
      {zustand === 'grau' && <p className="ampel-etikett">{AMPEL_GRAU_ETIKETT}</p>}
    </div>
  );
}

export function Ampel({ zustand, variante, fortschritt, gross, beschriftung }: AmpelProps) {
  if (variante === 'verkehr') {
    return <Verkehrsampel zustand={zustand} />;
  }
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
