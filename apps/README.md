# apps/

- `web/`: Next.js-Website (App Router). Grundgerüst vorhanden: Startseite, mehrstufiger Rechner mit Zwischenspeicherung, Ergebnis-Seite (bewusst ohne Zahlen), Rechtsseiten-Entwürfe, Geschäftsmodell-Schalter in `web/config/business.ts`. Offene Teile von Prompt 6 in `docs/STATUS.md`.
- `report/` (entsteht mit Prompt 5): Berichtsgenerator – HTML-Template → PDF via Playwright, Eingabe = `CalcResult` + Eligibility-Ergebnis + Kundendaten; braucht `brand/`.
