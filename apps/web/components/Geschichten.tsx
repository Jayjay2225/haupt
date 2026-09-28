import { GESCHICHTEN, initialen, nurFreigegebene } from '@/content/stories';

/**
 * „Geschichten“ (Prompt 14, Abschnitt 5): Erfahrungen von Verkäufern mit
 * demselben Freigabeprozess wie die Kundenstimmen. Rendert ausschließlich
 * freigegebene Einträge (verified + consent_at); ohne solche bleibt die
 * Sektion ausgeblendet. Initialen-Avatar, keine Bilder, keine Beträge.
 */
export function Geschichten() {
  const echte = nurFreigegebene(GESCHICHTEN);
  if (echte.length === 0) {
    return null;
  }
  return (
    <section className="abschnitt" aria-labelledby="geschichten-titel">
      <div className="container">
        <h2 id="geschichten-titel">Geschichten</h2>
        <p className="schmal erklaerung">Erfahrungen von Menschen, die verkauft haben – im eigenen Wortlaut, mit dokumentierter Einwilligung.</p>
        <div className="preis-raster">
          {echte.map((g) => (
            <article key={g.customer_ref} className="karte geschichte">
              <div className="geschichte-kopf">
                <span className="avatar" aria-hidden="true">
                  {initialen(g.name_display)}
                </span>
                <div>
                  <h3>{g.title}</h3>
                  <p className="erklaerung" style={{ margin: 0 }}>
                    {g.name_display}, {g.age} · {g.context}
                  </p>
                </div>
              </div>
              <p>{g.story_display}</p>
              <p className="erklaerung" style={{ margin: 0 }}>
                dokumentierte Einwilligung
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
