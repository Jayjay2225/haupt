/** 0–10-Skala wie in der Excel: 38-px-Pills (Übernahme aus Richtung B, Kapitel 9). */

export function Punktreihe({
  wert,
  onWahl,
}: {
  wert: number | null;
  onWahl?: (wert: number) => void;
}) {
  const werte = Array.from({ length: 11 }, (_, i) => i);
  if (!onWahl) {
    return (
      <div className="punktreihe punktreihe-anzeige" aria-hidden="true">
        {werte.map((w) => (
          <span key={w} className={'punkt' + (wert != null && w <= wert ? ' punkt-voll' : '')} />
        ))}
      </div>
    );
  }
  return (
    <div className="punktreihe" role="radiogroup" aria-label="0 bis 10">
      {werte.map((w) => (
        <button
          key={w}
          type="button"
          role="radio"
          aria-checked={wert === w}
          className={'pill' + (wert === w ? ' pill-aktiv' : '')}
          onClick={() => onWahl(w)}
        >
          {w}
        </button>
      ))}
    </div>
  );
}
