# Schriften (Design B, Prompt 12 Abschnitt 4.2)

Beide Schriften stehen unter der SIL Open Font License 1.1 (Lizenztexte hier
im Ordner). Variable Fonts, Latin-Subset, WOFF2 – geladen am 25.09.2026 von
Google Fonts (fonts.gstatic.com):

| Datei | Familie | Achsen | Quelle |
|---|---|---|---|
| `newsreader-latin-var.woff2` | Newsreader (Überschriften, 600) | opsz, wght | https://fonts.gstatic.com/s/newsreader/v26/cY9AfjOCX1hbuyalUrK4397yjA.woff2 |
| `manrope-latin-var.woff2` | Manrope (Text, 400/600/700) | wght | https://fonts.gstatic.com/s/manrope/v20/xn7gYHE41ni1AdIRggexSg.woff2 |

Verwendung:
- **Website:** `apps/web/app/layout.tsx` über `next/font/local` (self-hosted,
  kein Drittanbieter-Request zur Laufzeit).
- **Bericht (PDF):** `apps/report/src/schriften.ts` (Base64-Einbettung,
  generiert mit `pnpm --filter @rueckab/report schriften` aus diesen Dateien;
  kein Netzzugriff bei der Erzeugung).

Projektquellen der Schriften: https://github.com/productiontype/Newsreader ·
https://github.com/googlefonts/manrope
