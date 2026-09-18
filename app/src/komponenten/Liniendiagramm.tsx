import { useRef, useState } from 'react';

/**
 * Ein Panel, eine Serie — Identität trägt der Titel, nie die Farbe allein.
 * Ruhige Linien (2 px), betonter Endpunkt, zurückhaltendes Raster; Hover zeigt
 * den nächstliegenden Wochenwert. Keine Doppelachsen (zwei Maße = zwei Panels).
 */
export interface LinienPunkt {
  x: string; // Wochen-Label, z. B. "W35"
  wert: number | null;
}

export function Liniendiagramm({
  titel,
  daten,
  yMax = 10,
  hinweis,
}: {
  titel: string;
  daten: LinienPunkt[];
  yMax?: number;
  hinweis?: string;
}) {
  const [aktiv, setAktiv] = useState<number | null>(null);
  const flaeche = useRef<SVGSVGElement>(null);

  const B = 320;
  const H = 96;
  const randL = 8;
  const randR = 34;
  const randO = 10;
  const randU = 22;
  const innenB = B - randL - randR;
  const innenH = H - randO - randU;

  const gueltig = daten.filter((d) => d.wert != null) as { x: string; wert: number }[];
  const xPos = (i: number) => randL + (daten.length <= 1 ? innenB / 2 : (i * innenB) / (daten.length - 1));
  const yPos = (wert: number) => randO + innenH - (Math.min(wert, yMax) / yMax) * innenH;

  const pfad = daten
    .map((d, i) => (d.wert == null ? null : `${xPos(i).toFixed(1)},${yPos(d.wert).toFixed(1)}`))
    .filter(Boolean)
    .map((p, i) => (i === 0 ? `M${p}` : `L${p}`))
    .join(' ');

  const letzterIndex = (() => {
    for (let i = daten.length - 1; i >= 0; i--) if (daten[i].wert != null) return i;
    return -1;
  })();

  function beiBewegung(clientX: number) {
    const svg = flaeche.current;
    if (!svg) return;
    const box = svg.getBoundingClientRect();
    const rel = ((clientX - box.left) / box.width) * B;
    let bester = -1;
    let abstand = Infinity;
    daten.forEach((d, i) => {
      if (d.wert == null) return;
      const a = Math.abs(xPos(i) - rel);
      if (a < abstand) { abstand = a; bester = i; }
    });
    setAktiv(bester >= 0 ? bester : null);
  }

  const gezeigt = aktiv ?? letzterIndex;

  return (
    <figure className="diagramm">
      <figcaption className="diagramm-titel">
        <span>{titel}</span>
        {gezeigt >= 0 && daten[gezeigt].wert != null && (
          <span className="diagramm-wert">
            {daten[gezeigt].x} · {formatiere(daten[gezeigt].wert as number)}
          </span>
        )}
      </figcaption>
      <svg
        ref={flaeche}
        viewBox={`0 0 ${B} ${H}`}
        className="diagramm-flaeche"
        role="img"
        aria-label={titel}
        onMouseMove={(e) => beiBewegung(e.clientX)}
        onMouseLeave={() => setAktiv(null)}
      >
        {[0, 0.5, 1].map((f) => (
          <line
            key={f}
            x1={randL} x2={B - randR}
            y1={randO + innenH * f} y2={randO + innenH * f}
            className="diagramm-raster"
          />
        ))}
        <text x={B - randR + 6} y={randO + 4} className="diagramm-achse">{yMax}</text>
        <text x={B - randR + 6} y={randO + innenH + 4} className="diagramm-achse">0</text>
        {daten.map((d, i) =>
          i % Math.ceil(daten.length / 4) === 0 || i === daten.length - 1 ? (
            <text key={d.x} x={xPos(i)} y={H - 6} textAnchor="middle" className="diagramm-achse">
              {d.x}
            </text>
          ) : null,
        )}
        {gueltig.length > 1 && <path d={pfad} className="diagramm-linie" />}
        {gezeigt >= 0 && daten[gezeigt].wert != null && (
          <circle cx={xPos(gezeigt)} cy={yPos(daten[gezeigt].wert as number)} r={4} className="diagramm-punkt" />
        )}
      </svg>
      {hinweis && <p className="diagramm-hinweis">{hinweis}</p>}
    </figure>
  );
}

function formatiere(w: number): string {
  return Number.isInteger(w) ? String(w) : w.toFixed(1).replace('.', ',');
}
