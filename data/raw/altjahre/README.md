# Altjahres-Kennzahlen 1990–2003 (Prompt 9, Teil A)

Eingang für **unternehmensindividuelle** Nettoverzinsung / laufende Durchschnittsverzinsung aus Geschäftsberichten (Mehrjahresübersichten), Pressemitteilungen oder anderen belegbaren Dokumenten. Eine Datei je Gesellschaft: `<insurerId>.json` (ids aus `data/insurers.json`), Aufbau wie `VORLAGE.json`. Heruntergeladene Belege liegen unter `dokumente/` (Wayback-Kopien sind zulässig; die Wayback-URL ist dann die Quelle).

Regeln – **lieber eine Lücke als ein geratener Wert**:

- Jeder Wert braucht `quelle.titel`, `quelle.url` **oder** `quelle.dokument`, `quelle.abrufdatum` und eine `fundstelle` (Seite/Tabelle/Zeile). Ohne diese Angaben wird nichts importiert.
- `quelle.typ`: `primary` = Geschäftsbericht/Aufsichtsstatistik des Unternehmens; `secondary` = Pressemitteilung, Fachpresse, Datenbank. Ein Primärwert wird nie durch einen Sekundärwert ersetzt.
- `lesung2`: unabhängige zweite Lesung derselben Stelle (andere Person oder anderer Tag). Abweichungen landen in `REVIEW.md` und werden **am Dokument** geklärt.
- Plausibilität 0–15 %, Sprung > 3 Prozentpunkte zum Nachbarjahr → `REVIEW.md`; nach Prüfung `geprueft: true` setzen.
- Vorhandene Werte in `data/insurers.json` werden nur mit `ersetzen: true` überschrieben.
- Steht in der Quelle „Reinverzinsung“, gehört der Wert in `nettoverzinsung` (gleiche Kennzahl); Definition aus der Fußnote in `hinweis` notieren.

Ablauf:

```bash
pnpm data:altjahre                                            # prüfen, REVIEW.md schreiben
node --experimental-strip-types scripts/import-altjahre.ts import   # schreiben, data.version anheben
pnpm data:check                                               # validieren, COVERAGE.md (Matrix 1990–2003) aktualisieren
```

Nicht gefundene Werte werden nicht „aufgefüllt“: Der Recherchestand je Gesellschaft (geprüfte Wege, offene Spuren) steht in `RECHERCHE.md`; die Lücken selbst zeigt `data/COVERAGE.md`.
