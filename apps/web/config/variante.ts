/**
 * Produktvariante (Prompt 8, Entscheidung 3 – Hybrid-Modell).
 *
 * privat  = renten-rettung.de: kostenlose wirtschaftliche Ampel ohne Euro-
 *           Beträge, kostenpflichtiger Bericht, KEINE Belehrungsbewertung
 *           (stattdessen neutrale Unterlagen-Checkliste), Ankauf-Hinweis und
 *           Transparenz-Kasten.
 * kanzlei = Modell C (Kanzlei-Lizenz): markenneutral, Belehrungs-Check an,
 *           Beträge sichtbar, kein Ankauf, kein Transparenz-Kasten.
 *
 * Umschalten per Umgebungsvariable NEXT_PUBLIC_PRODUKT_VARIANTE=kanzlei.
 */
export type ProduktVariante = 'privat' | 'kanzlei';

export const PRODUKT_VARIANTE: ProduktVariante =
  process.env['NEXT_PUBLIC_PRODUKT_VARIANTE'] === 'kanzlei' ? 'kanzlei' : 'privat';

export interface VariantenFlags {
  /** Belehrung wird bewertet (Ampel aus legal-rules) statt nur Checkliste. */
  belehrungsCheck: boolean;
  /** Euro-Beträge in der kostenlosen Vorschau sichtbar. */
  euroInVorschau: boolean;
  /** Hinweisblock „Verkaufen statt kündigen“ mit eigener Einwilligung. */
  ankaufHinweis: boolean;
  /** Pflicht-Kasten „So verdienen wir“. */
  transparenzKasten: boolean;
  /** Kostenpflichtiger Bericht wird angeboten. */
  berichtKostenpflichtig: boolean;
}

const FLAGS: Record<ProduktVariante, VariantenFlags> = {
  privat: {
    belehrungsCheck: false,
    euroInVorschau: false,
    ankaufHinweis: true,
    transparenzKasten: true,
    berichtKostenpflichtig: true,
  },
  kanzlei: {
    belehrungsCheck: true,
    euroInVorschau: true,
    ankaufHinweis: false,
    transparenzKasten: false,
    berichtKostenpflichtig: false,
  },
};

export const VARIANTE: VariantenFlags = FLAGS[PRODUKT_VARIANTE];
