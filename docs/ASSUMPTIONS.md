# Annahmen und Festlegungen

Laufende Liste gemäß Grundprinzip 8 (`CLAUDE.md`). Jede fachliche oder technische Annahme wird hier mit Datum geführt; überholte Einträge werden als „ersetzt am …“ markiert, nicht gelöscht.

## 11.09.2026 – Projektaufsatz (Prompt 0)

1. **Marke offen.** „[MARKE]“ bleibt Platzhalter in `CLAUDE.md` und allen Texten, bis Marke, Domain und Absender entschieden sind (laut Prompt-Set vor Prompt 6). Interner Arbeitsname des Monorepos: `lv-rueckabwicklung`; npm-Scope vorläufig `@rueckab/*` – wird bei der Branding-Entscheidung umbenannt.
2. **Werkzeuge.** pnpm-Workspaces (pnpm 10, über `packageManager` im Root-`package.json` gepinnt), Node ≥ 20, durchgängig ESM. TypeScript strikt (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) – bewusst streng, weil der Rechenkern Geldbeträge deterministisch verarbeiten muss. Tests mit Vitest über eine Root-Konfiguration (`vitest.config.ts`).
3. **Struktur.** `packages/calc` und `packages/eligibility` sind nur als Paket-Gerüste angelegt (Versionskonstante + Smoke-Test), damit Tooling und Tests von Anfang an laufen. Die fachliche Implementierung folgt strikt Prompt 3 bzw. 4: erst Spezifikation und Testfälle, dann Implementierung. `apps/report` und `apps/web` werden erst mit Prompt 5/6 angelegt, weil dafür `brand/` bzw. die Marken- und Geschäftsmodell-Entscheidungen nötig sind.
4. **Versionierung.** `calc.version` startet mit `0.1.0` (Konstante `CALC_VERSION` in `packages/calc`); `data.version` wird mit Prompt 2 in `data/insurers.json` eingeführt. Beide erscheinen laut Grundprinzip 7 in jedem Bericht.
5. **Postgres/Prisma.** Datenbank und Prisma werden erst eingerichtet, wenn die erste Persistenz gebraucht wird (spätestens mit `apps/web`, Prompt 6). Der Rechenkern bleibt frei von I/O.
