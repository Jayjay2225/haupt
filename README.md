# Rückabwicklungs-Rechner für Lebens- und Rentenversicherungen

Arbeitstitel „[MARKE]“ (Marke wird vor Prompt 6 entschieden). Web-Tool, das für Inhaber deutscher Lebens- und Rentenversicherungen (Kapital-LV, private RV, fondsgebundene LV/RV, Rückdeckungsversicherungen) eine schriftliche Kurzprüfung erstellt: geschätzter bereicherungsrechtlicher Rückabwicklungsanspruch nach Widerspruch (§ 5a VVG a.F.), Rücktritt (§ 8 VVG a.F.) oder Widerruf (§ 8 VVG n.F.) – in drei Szenarien (Min / Basis / Max), stets im Vergleich zum aktuellen Rückkaufswert. Das Tool leistet keine Rechtsberatung im Einzelfall.

**Methodischer Kern** (Details in `CLAUDE.md`): Nutzungen werden nur auf den Sparanteil gerechnet, Maßstab ist die versichererindividuelle Nettoverzinsung der Kapitalanlagen – keine Aufzinsung des Vollbeitrags, keine Rohüberschussquoten als Zinssatz. Jede Zahl hat eine Quelle.

## Struktur

```
CLAUDE.md               Projektkontext und Grundprinzipien (Prompt 0)
docs/
  PROMPTS.md            vollständiges Prompt-Set (Bauplan, Prompts 0–7)
  STATUS.md             Umsetzungsstand je Prompt
  ASSUMPTIONS.md        laufende Annahmenliste
data/                   fachliche Datensätze (legal-rules, insurers, …) – entstehen mit Prompts 1–3
packages/
  calc/                 Rechenkern (reine Funktionen, keine I/O) – Implementierung mit Prompt 3
  eligibility/          Eignungs- und Belehrungs-Check – Implementierung mit Prompt 4
apps/                   report (Prompt 5) und web (Prompt 6) – werden mit ihren Prompts angelegt
scripts/                Datenpflege-Skripte (Prompt 2)
brand/                  Logo, Farben, Typografie (vor Prompt 5 zu befüllen)
```

## Entwicklung

Voraussetzungen: Node ≥ 20, pnpm 10.

```bash
pnpm install
pnpm test        # Vitest über alle Pakete
pnpm typecheck   # tsc --noEmit je Paket
```

## Vorgehen

Das Projekt wird entlang des Prompt-Sets in `docs/PROMPTS.md` aufgebaut: 0 Kontext → 1 Rechtsregeln → 2 Versichererdaten → 3 Rechenkern → 4 Eignungs-Check → 5 PDF-Bericht → 6 Website → 7 Review. Der aktuelle Stand steht in `docs/STATUS.md`, alle Annahmen in `docs/ASSUMPTIONS.md`.
