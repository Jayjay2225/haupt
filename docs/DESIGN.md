# Gestaltung: Design B „Nachtblau & Salbei“ (Prompt 12, Abschnitt 4)

Stand 28.09.2026 (Prompt 14: Verkehrsampel und grüner Kaufknopf ergänzt).
Ersetzt den Gestaltungsplan aus Prompt 8 (Marine/Orange, Archivo/Source Sans –
freigegeben 20.09.2026, durch Prompt 12 abgelöst). Umsetzung:
`apps/web/config/brand.ts` (COLORS), `apps/web/app/globals.css`, Bericht in
`apps/report/src/template.ts`.

## 1. Farb-Token (4.1)

| Token | Wert | Verwendung |
|---|---|---|
| bg | `#F5F8F7` | Seitengrund |
| surface | `#FFFFFF` | Karten, Tabellen |
| ink / inkSoft / muted | `#17202A` / `#3A4652` / `#5B6772` | Text / Nebentext / Erklärungen |
| brand / brandDeep | `#14365D` / `#0C2440` | Kopfzeile, Überschriften, Sekundärknöpfe |
| sage / sageLight | `#7FAF9B` / `#E4EFEA` | Akzente, getönte Abschnitte, Ampel-Pille |
| line | `#DDE4E6` | Ränder, Trennlinien |
| cta / ctaHover | `#C24E2B` / `#A9411F` | Hauptknopf (immer weiße Schrift) |
| **ctaKauf / ctaKaufHover** | `#1B7D45` / `#155F35` | **nur der Kaufknopf** „Detailliertes Gutachten bestellen · 89 €“ und „Zahlungspflichtig bestellen“ (Prompt 14, 1.3); weiße Schrift 19 px/700 |
| ampelGruen / ampelGelb / ampelRot / ampelAus | `#1E8E4E` / `#D9A400` / `#C62828` / `#B9CCC3` | ausschließlich im Ampel-Element |
| **ampelGehaeuse / ampelMatt** | `#1E2A33` / `#3A4A55` | Gehäuse und ausgeschaltete Leuchten der Verkehrsampel (Prompt 14, 1.2) |
| focus | `#14365D` | Fokusring 3 px, 2 px Abstand |

Regeln: Ampelfarben nur im Ampel-Element; auf `cta`, `ctaKauf` und `brand`
immer weiße Schrift; auf `ampelGelb` immer dunkle (`ink`). Keine Verläufe,
keine Archivfotos (Stimmungsbilder nur lizenziert, `docs/LIZENZEN.md`), keine
Emojis. Die Ampel ist seit Prompt 14 eine hochkante Verkehrsampel als
Inline-SVG auf der Startseite (die Pille bleibt für die Kanzlei-Ergebnisseite).

## 2. Schrift (4.2)

- Überschriften **Newsreader 600** (variable, opsz/wght), H1 58/1.06 Desktop
  → 34/1.15 mobil (clamp), H2 bis 36, Kartentitel 25.
- Text **Manrope** 400/600/700; Fließtext 18/1.5, klein 16, Mikro 15, Knöpfe
  19/700, Formularfelder 17. Beträge mit Tabellenziffern, in Tabellen
  rechtsbündig (`td.betrag`). Zeilenlänge < 70 Zeichen (`p { max-width: 46rem }`).
- Dateien vendored unter `brand/fonts/` (OFL, Provenienz in
  `brand/fonts/README.md`); Website über `next/font/local` (self-hosted),
  Bericht Base64-eingebettet (`apps/report/src/schriften.ts`, Generator
  `apps/report/scripts/erzeuge-schriften.mjs`) – keine Netzabfrage.

## 3. Form und Komponenten (4.3/4.4)

- Radien: Knöpfe 999 px (Pille), Karten 24 px, Felder/kleine Karten 14 px.
- Schatten nur auf der Einstiegskarte (`.karte.einstieg`):
  `0 16px 48px rgba(20,54,93,.10)`.
- Abstände im 8-px-Raster; Container 1280 px, Rand 72 px (mobil 20 px).
- Knopf primär `cta`, min. 56 px; sekundär 2 px Rand `brand`, transparent.
- Eingabefeld min. 52 px, Rand 1 px `line`, Fokus `brand` + Ring, Label 16/600,
  Fehlertext in `ampelRot` nur als Text.
- **Verkehrsampel (Prompt 14, 1.2 – Startseite):** Inline-SVG `viewBox 0 0
  120 300`, Gehäuse `ampelGehaeuse` mit Radius 20, drei Leuchten (r 29) in
  dunkler Fassung `#121B22` mit Blende (Halbschatten oben), Mast angedeutet.
  Größe Desktop 120 × 300 px, mobil 96 × 240 px. Aus: alle Leuchten
  `ampelMatt`. An: eine Leuchte in voller Ampelfarbe plus Glow (Weichzeichner
  ≈ 24 px, 45 % Alpha), Übergang 300 ms; `prefers-reduced-motion` schaltet
  Übergänge ab. Grau: alle matt, Gehäuse-Rahmen in `sage`, Etikett „zu klein
  für unser Verfahren“ unter dem Gehäuse. Der Zustand steht immer zusätzlich
  als Text unter der Ampel und im `aria-label`.
- **Kaufknopf (Prompt 14, 1.3):** `ctaKauf`, Hover `ctaKaufHover`, weiße
  Schrift 19 px/700, Pille, min. 56 px; in der Ampel-Karte volle Breite (max.
  26 rem); gesperrt (55 % Deckkraft) bis die Ampel Grün oder Gelb zeigt. Alle
  anderen Knöpfe bleiben Koralle/Brandblau.
- **Info-Symbol „Wo finde ich das?“ (Prompt 14, 1.4):** 44 × 44 px
  Tippfläche, Symbol 22 px in `brand`, Info-Fenster als natives `<dialog>`
  (Radius 24, Backdrop brandDeep 45 %), Skizze als Inline-SVG mit Markierung in
  `sage`/`sageLight` (keine Ampelfarben außerhalb der Ampel).
- **Ampel-Pille (Kanzlei-Ergebnisseite):** Pille `sageLight` mit drei Punkten
  14 px (`ampelAus`), aktiver Punkt in Ergebnisfarbe mit Glow `0 0 0 6px` bei
  18 % Alpha; 40-px-Punkte auf der Ergebnis-Seite. Feine Kontur (1 px, ink
  35 %) für den Nicht-Text-Kontrast (s. u.). Kein Dauerblinken;
  `prefers-reduced-motion` schaltet Übergänge ab.
- Accordion min. 54 px, Chevron `brand`, Trennlinie `#EDF1F0`; Badge
  `sageLight`/`brand` 15/700; Kopfzeile `brand` mit Marke Newsreader 27/600.
- Mobil: Hauptknopf unten fixiert (`.fix-unten`, safe-area), Tippflächen
  ≥ 48 px (Monatsauswahl 48 px, Optionen min. 48 px Zeilenhöhe).

## 4. Bericht (4.5)

Kopfbalken `brand` mit weißer Marke (Newsreader); Überschriften Newsreader in
`brand`; Text Manrope 11 pt `ink`; Tabellenkopf `brand`/weiß, Zebra `bg`,
Beträge rechtsbündig; Diagramm „Mehrwert gegenüber Rückkaufswert“ in `cta`,
Rückkaufswert `muted`, Szenarien `brand`/`sage` (als Netto-Wert, damit
Basis − Rückkaufswert dem Mehrwert-Balken entspricht; Balkenlänge lässt
Platz für siebenstellige Beträge); Ampel-Pille in Ampelfarben;
Hinweisflächen `sageLight`; Gegenposition mit Rand `line`.
PDF-Kopf-/Fußzeile: Chromium rendert sie ohne eingebettete Schriften →
Systemschrift, Marke fett in `brand`.

## 5. Gemessene Kontraste (WCAG 2.1, 25.09.2026)

Text (AA: ≥ 4,5:1 normal, ≥ 3:1 groß/fett ab 18,66 px fett bzw. 24 px):

| Paar | Kontrast | Bewertung |
|---|---|---|
| ink auf bg / surface / sageLight | 15,40 / 16,45 / 13,97 | AAA |
| inkSoft auf bg | 9,02 | AAA |
| muted auf bg / surface | 5,42 / 5,79 | AA (auch für 16-px-Erklärtexte) |
| weiß auf brand / brandDeep | 12,24 / 15,65 | AAA |
| **weiß auf cta (Hauptknopf)** | **4,75** | AA normal; Knöpfe sind zudem 19 px/700 (groß: 3:1) |
| weiß auf ctaHover | 6,06 | AA |
| **weiß auf ctaKauf (Kaufknopf, Prompt 14)** | **5,16** | AA normal (≥ 4,5:1 nachgewiesen); Knopf 19 px/700 |
| weiß auf ctaKaufHover | 7,72 | AAA |
| weiß auf ampelGehaeuse (Verkehrsampel-Gehäuse) | 14,64 | AAA (falls Text) |
| brand auf bg / surface / sageLight | 11,46 / 12,24 / 10,40 | AAA |
| ink auf ampelGelb | 7,25 | AA (Regel „auf Gelb dunkle Schrift“) |
| ampelRot als Fehlertext auf surface / bg | 5,62 / 5,26 | AA |

Nicht-Text (1.4.11, ≥ 3:1): Grün-Punkt auf sageLight 3,54 ✓, Rot-Punkt 4,77 ✓;
**Gelb-Punkt 1,93 und Aus-Punkt 1,43 liegen darunter** → deshalb tragen alle
Punkte eine 1-px-Kontur in ink/35 % und der Zustand steht zusätzlich als Wort
neben der Ampel („Gelb“) bzw. im `aria-label` – Information hängt nie an der
Farbe allein.

Verkehrsampel (Prompt 14, gemessen 28.09.2026): Gehäuse `#1E2A33` auf weißer
Karte 14,64 ✓. Leuchte an gegen ihre Fassung `#121B22`: Grün 4,18 ✓, Gelb 7,68
✓, Rot 3,10 ✓; gegen das Gehäuse: Grün 3,51 ✓, Gelb 6,46 ✓, **Rot 2,60** (unter
3:1) – deshalb liegt jede Leuchte in der dunkleren Fassung, die leuchtende
Lampe trägt den Glow, und Zustand plus Grund stehen als Text unter der Ampel
(`ampelKartenText`) und im `aria-label`. Kaufknopf-Sperre wird nicht nur über
Deckkraft, sondern über `disabled`/`aria-disabled` vermittelt.

## 6. Bewusst offen

- Logo: Wortmarke „Renten-Rettung“ in Newsreader; ein Bildzeichen ist nicht
  definiert (bewusst, bis Jack eines liefert).
- Kanzlei-Variante (`data-optik="neutral"`): CTA wechselt auf `brand`,
  Salbei wird blaugrau – Feinschliff erst mit erster Kanzlei.
