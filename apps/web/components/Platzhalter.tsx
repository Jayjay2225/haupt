/**
 * Platzhalter für Bilder und Erklärvideo (Prompt 14, Abschnitte 1.7 und 1.9).
 *
 * - `Bildplatzhalter`: Rahmen mit Bildbeschreibung, bis lizenzierte Aufnahmen
 *   vorliegen (docs/LIZENZEN.md). Alt-Text neutral; keine Bildunterschrift,
 *   die Personen als Kunden ausgibt; nie neben Kundenstimmen, Geschichten
 *   oder Beträgen (Platzierung: Startseite).
 * - `VideoPlatzhalter`: 16:9, Poster mit Play-Symbol, „Erklärvideo (90
 *   Sekunden)“. Mit NEXT_PUBLIC_VIDEO_URL wird eine selbst gehostete MP4
 *   eingebunden (keine YouTube-Einbettung ohne Einwilligung); Drehbuch in
 *   docs/VIDEO.md.
 */

export interface BildMotiv {
  /** Neutrale Beschreibung = Alt-Text, z. B. „Paar im Ruhestand am Küchentisch“. */
  beschreibung: string;
  /** Eingebundene Datei unter public/bilder/, sobald lizenziert (docs/LIZENZEN.md). */
  datei?: string | undefined;
}

export const BILDER: Record<'ruhestand' | 'enkel', BildMotiv> = {
  ruhestand: { beschreibung: 'Paar im Ruhestand am Küchentisch', datei: process.env['NEXT_PUBLIC_BILD_RUHESTAND'] },
  enkel: { beschreibung: 'Paar mit Enkelkindern im Garten', datei: process.env['NEXT_PUBLIC_BILD_ENKEL'] },
};

export function Bildplatzhalter({ motiv }: { motiv: keyof typeof BILDER }) {
  const bild = BILDER[motiv];
  if (bild.datei !== undefined && bild.datei !== '') {
    // Stimmungsbild ohne Unterschrift (Prompt 14, 1.7).
    return <img className="stimmungsbild" src={bild.datei} alt={bild.beschreibung} loading="lazy" />;
  }
  return (
    <div className="bild-platzhalter" role="img" aria-label={`Platzhalter für ein Bild: ${bild.beschreibung}`}>
      <span className="bild-platzhalter-text">
        Bild folgt: {bild.beschreibung}
        <br />
        <span className="erklaerung">[[BILD: lizenzierte Aufnahme, Nachweis in docs/LIZENZEN.md]]</span>
      </span>
    </div>
  );
}

export const VIDEO_URL = process.env['NEXT_PUBLIC_VIDEO_URL'] ?? '';
export const VIDEO_POSTER = process.env['NEXT_PUBLIC_VIDEO_POSTER'] ?? '';

export function VideoPlatzhalter() {
  if (VIDEO_URL !== '') {
    return (
      <div className="video-rahmen">
        <video className="video" controls preload="metadata" poster={VIDEO_POSTER !== '' ? VIDEO_POSTER : undefined}>
          <source src={VIDEO_URL} type="video/mp4" />
          Ihr Browser spielt dieses Video nicht ab.
        </video>
      </div>
    );
  }
  return (
    <div className="video-rahmen video-platzhalter" role="img" aria-label="Platzhalter für das Erklärvideo (90 Sekunden)">
      <span className="video-play" aria-hidden="true">
        <svg viewBox="0 0 64 64" width="64" height="64">
          <circle cx="32" cy="32" r="31" fill="rgba(255,255,255,0.92)" />
          <path d="M26 20l18 12-18 12z" fill="#14365D" />
        </svg>
      </span>
      <span className="video-text">Erklärvideo (90 Sekunden)</span>
      <span className="erklaerung video-hinweis">[[VIDEO: eigenes Hosting als MP4 – Drehbuch in docs/VIDEO.md]]</span>
    </div>
  );
}
