import { TESTIMONIALS } from '@/content/testimonials';
import type { Testimonial } from '@/content/testimonials';

/** Nur Einträge mit Prüfvermerk UND dokumentierter Einwilligung (Prompt 12, Abschnitt 5). */
export function nurVerifizierte(liste: Testimonial[]): Testimonial[] {
  return liste.filter((t) => t.verified && t.consent_at.trim() !== '');
}

/**
 * „Das sagen Kunden“ (Startseite): rendert ausschließlich verifizierte
 * Stimmen mit dokumentierter Einwilligung. Ohne solche Einträge: nichts –
 * kein Platzhalter, kein „demnächst“.
 */
export function Testimonials() {
  const echte = nurVerifizierte(TESTIMONIALS);
  if (echte.length === 0) {
    return null;
  }
  return (
    <section className="abschnitt" aria-labelledby="stimmen-titel">
      <div className="container">
        <h2 id="stimmen-titel">Das sagen Kunden</h2>
        <div className="preis-raster">
          {echte.map((t) => (
            <blockquote key={t.customer_ref} className="karte" cite={t.customer_ref}>
              <p>„{t.quote_display}“</p>
              <footer className="erklaerung">
                {t.name_display}, {t.age} · {t.contract_type} · dokumentierte Einwilligung
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
