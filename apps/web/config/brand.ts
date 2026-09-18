/**
 * Marken-Konfiguration. „[MARKE]“ ist bewusst Platzhalter: Marke, Domain und
 * Absender werden laut Prompt-Set vor Prompt 6 entschieden
 * (docs/STATUS.md, docs/ASSUMPTIONS.md). Bis dahin läuft die Website als
 * Vorabversion mit noindex (siehe app/layout.tsx).
 */
export const BRAND = {
  name: '[MARKE]',
  istPlatzhalter: true,
  claim: 'Kurzprüfung zur Rückabwicklung von Lebens- und Rentenversicherungen',
} as const;
