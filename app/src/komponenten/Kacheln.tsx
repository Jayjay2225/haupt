/** Kachel-Raster: eine Frage pro Screen, ein Tap genügt (Konzept Kapitel 5.2). */

export interface KachelEintrag {
  id: string;
  label: string;
  hinweis?: string; // z. B. „vielleicht das?“ — sanfter Vorschlag, keine Vorauswahl
}

export function Kacheln({
  eintraege,
  gewaehlt,
  onWahl,
}: {
  eintraege: KachelEintrag[];
  gewaehlt?: string;
  onWahl: (id: string) => void;
}) {
  return (
    <div className="kachel-raster" role="group">
      {eintraege.map((e) => (
        <button
          key={e.id}
          type="button"
          className={'kachel' + (gewaehlt === e.id ? ' kachel-aktiv' : '')}
          onClick={() => onWahl(e.id)}
        >
          <span>{e.label}</span>
          {e.hinweis && <span className="kachel-hinweis">{e.hinweis}</span>}
        </button>
      ))}
    </div>
  );
}
