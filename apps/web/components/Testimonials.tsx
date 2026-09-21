import { TESTIMONIALS } from '@/content/testimonials';
import type { Testimonial } from '@/content/testimonials';

/** Nur Einträge mit Prüfvermerk UND Einwilligungs-Kennung (Prompt 10, Abschnitt 5). */
export function nurVerifizierte(liste: Testimonial[]): Testimonial[] {
  return liste.filter((t) => t.verified && t.consent_id.trim() !== '');
}

/**
 * Rendert ausschließlich verifizierte Stimmen mit Einwilligungs-Kennung
 * (Prompt 10, Abschnitt 5). Ohne solche Einträge: nichts – kein Platzhalter,
 * kein „demnächst“.
 */
export function Testimonials() {
  const echte = nurVerifizierte(TESTIMONIALS);
  if (echte.length === 0) {
    return null;
  }
  return (
    <section aria-labelledby="stimmen-titel">
      <h2 id="stimmen-titel">Was Erstkunden sagen</h2>
      <div className="hero-raster">
        {echte.map((t) => (
          <blockquote key={t.consent_id} className="wert-karte" cite={t.consent_id}>
            <p>„{t.zitat}“</p>
            <footer className="erklaerung">
              {t.vorname}, {t.alter}, {t.bundesland} · dokumentierte Einwilligung
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}
