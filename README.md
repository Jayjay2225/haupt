# Rückabwicklungs-Rechner für Lebens- und Rentenversicherungen

**Renten-Rettung** (renten-rettung.de; Produkt „Policen-Check“ – bis Prompt 8 Arbeitstitel „[MARKE]“). Web-Tool, das für Inhaber deutscher Lebens- und Rentenversicherungen (Kapital-LV, private RV, fondsgebundene LV/RV, Rückdeckungsversicherungen) eine schriftliche Kurzprüfung erstellt: geschätzter bereicherungsrechtlicher Rückabwicklungsanspruch nach Widerspruch (§ 5a VVG a.F.), Rücktritt (§ 8 VVG a.F.) oder Widerruf (§ 8 VVG n.F.) – in drei Szenarien (Min / Basis / Max), stets im Vergleich zum aktuellen Rückkaufswert. Das Tool leistet keine Rechtsberatung im Einzelfall.

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
apps/
  web/                  Next.js-Website „Renten-Rettung“: Startseite mit Schnellcheck, Rechner-Funnel,
                        kostenlose Ampel, Versichererseiten, Rechtsseiten-Entwürfe
  report/               PDF-Berichtsgenerator (Playwright/Chromium)
scripts/                Datenpflege: update-insurers, import-bafin, import-altjahre, data-scans, sensitivitaet-altjahre
data/raw/               Rohdaten mit Provenienz: BaFin Tabelle 160 (bafin/), Altjahres-Belege (altjahre/), Bibliotheks-Scans (scans/)
sites/unternehmer/      Geparkter Geschäftsführer-Bereich (Archiv der alten Startseite, nicht ausgeliefert)
brand/                  Logo, Farben, Typografie (Gestaltungsplan in docs/DESIGN.md)
```

## Entwicklung

Voraussetzungen: Node ≥ 20, pnpm 10.

```bash
pnpm install
pnpm test        # Vitest über alle Pakete (inkl. Wording-Verbotsliste)
pnpm typecheck   # tsc --noEmit je Paket
pnpm dev         # Website lokal starten (http://localhost:3000)
pnpm build       # Produktions-Build der Website
pnpm data:check  # data/insurers.json validieren, data/COVERAGE.md erzeugen
pnpm data:bafin  # BaFin Tabelle 160 (data/raw/bafin) nach data/insurers.json importieren
pnpm data:scans  # Zwei-Lesungen-Vergleich der Bibliotheks-Scans (data/raw/scans)
pnpm data:altjahre # Altjahres-Werte (data/raw/altjahre) prüfen; Import: node --experimental-strip-types scripts/import-altjahre.ts import
pnpm exec tsx scripts/sensitivitaet-altjahre.ts   # docs/SENSITIVITAET-ALTJAHRE.md erzeugen
pnpm --filter @rueckab/report beispiele           # Beispielberichte in examples/ erzeugen
```

Umgebungsvariablen der Website (Vorlage: `apps/web/.env.example`): `NEXT_PUBLIC_PRODUKT_VARIANTE` (`privat` Standard | `kanzlei` für die markenneutrale Kanzlei-Lizenz), `BETA_PASSWORT` (Passwortschutz der Beta), `NEXT_PUBLIC_INDEXIERUNG` (erst zum Go-live `1`), `NEXT_PUBLIC_BASIS_URL`; Bestellung und Zahlung: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, optional `STRIPE_ZAHLUNGSARTEN`, `STRIPE_STEUERSATZ_ID`; Auslieferung: `AUSLIEFERUNG_VERZEICHNIS`, `RESEND_API_KEY`, `MAIL_ABSENDER`, `CHROMIUM_PATH`; in der Kanzlei-Variante zusätzlich `NEXT_PUBLIC_KANZLEI_*` (Name, Domain, Anbieter, Anschrift, Vertretung, Register, USt-ID, Telefon, E-Mail).

## Bereitstellung

Die Website läuft bei Vercel (Root Directory `apps/web`), die Domain bleibt bei united-domains: Anleitung in `docs/DEPLOY-VERCEL.md`, DNS-Umstellung in `docs/DOMAIN-UMZUG.md`.

## Bestellung und Zahlung

Zahlung vorab über Stripe Checkout (Karte, PayPal, Klarna); nach Zahlungseingang erzeugt der Webhook `POST /api/stripe/webhook` den Bericht (PDF) und verschickt ihn zusammen mit dem Rechnungslink per E-Mail. Ohne `STRIPE_SECRET_KEY` ist die Bestellung ausgeblendet. Ablauf und offene Punkte: `docs/STATUS.md` (Stand 20.09.2026).

## Vorgehen

Das Projekt wird entlang des Prompt-Sets in `docs/PROMPTS.md` aufgebaut: 0 Kontext → 1 Rechtsregeln → 2 Versichererdaten → 3 Rechenkern → 4 Eignungs-Check → 5 PDF-Bericht → 6 Website → 7 Review → 8 Renten-Rettung Privat (Marke, Hybrid-Modell, Design, Domain-Umzug) → 9 Altjahres-Kennzahlen. Der aktuelle Stand steht in `docs/STATUS.md`, alle Annahmen in `docs/ASSUMPTIONS.md`.
