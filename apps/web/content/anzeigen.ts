/**
 * Anzeigentexte (Prompt 12, Abschnitt 6). Google-RSA-Grenzen: Überschrift
 * höchstens 30, Beschreibung höchstens 90 Zeichen – der Wording-Test prüft
 * Längen und Verbotsliste. Zwei Zeilen des Decks mussten dafür gekürzt
 * werden (dokumentiert in docs/ADS.md und docs/TEXT-REVIEW.md).
 */
export const GOOGLE_UEBERSCHRIFTEN: string[] = [
  'Alte Lebensversicherung?',
  'Rückkaufswert zu niedrig?',
  'Erst rechnen, dann kündigen',
  'Ampel in 5 Minuten',
  'Vertrag von 1980 bis 2020?',
  'Mit echten Versichererzahlen',
  // Prompt 13, §5: ersetzt „Ergebnis sofort …“; neue Übernahme-Überschrift.
  'Bericht in 12 Stunden',
  'Wir übernehmen Ihren Fall',
];

export const GOOGLE_BESCHREIBUNGEN: string[] = [
  // Deck-Fassung hatte 94 Zeichen – gekürzt:
  'Vertrag von 1980 bis 2020? Oft ist mehr drin als der Rückkaufswert. Jetzt rechnen.',
  // Deck-Fassung hatte 91 Zeichen – gekürzt:
  '5 Minuten, Ihre Police, eine klare Ampel. Rot heißt: lohnt nicht – das sagen wir auch.',
];

export const META_HAUPTTEXT =
  'Der Brief vom Versicherer kommt. Die Zahl ist kleiner als gedacht. Wenn Ihr Vertrag zwischen 1980 und 2020 begann, ist das oft nicht das letzte Wort. Wir rechnen in 5 Minuten aus, ob mehr drin ist – mit den echten Zahlen Ihres Versicherers. Und wenn nicht, sagen wir das auch.';
