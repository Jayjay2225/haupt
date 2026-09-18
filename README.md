# Jetztgut — Phase 1

Eine App für die Frage **„Was ist jetzt gut für mich?“** — sie hilft, im Moment eines
Impulses kurz innezuhalten, das Bedürfnis dahinter zu verstehen und dann bewusst zu
entscheiden. Leitsatz: *Quit short dopamine, invest in serotonin* — „Weniger Kick, mehr Kompass.“

Dieses Repository enthält die **Phase-1-Lieferung** (Konzept, Design-Richtungen,
Mini-Prototyp) und den **Phase-2-Prototyp**: die lauffähige App in der
freigegebenen Richtung A „Morgenlicht“.

## Inhalt

| Pfad | Was es ist |
|---|---|
| `app/` | **Die App (Phase 2)** — React + TypeScript + Vite, local-first (IndexedDB), PWA. Start: `cd app && npm install && npm run dev`. Demo-Daten: `/?demo=1`. Details in `app/README.md` |
| `Konzept_Jetztgut.pdf` | Das vollständige Konzept: Vision, Personas, psychologisches Fundament, Bereiche-Modell, Kernflows, Scoring, Dialog-Design, Wireframes, Designsystem, Architektur, Datenschutz, Roadmap, Annahmen — plus Anhang A mit allen Optionskatalogen |
| `design/richtung-a.html` | Design-Richtung **A „Morgenlicht“** — Tannengrün, warmes Graphit-Papier, Ockerlicht (Bricolage Grotesque + Source Sans 3) |
| `design/richtung-b.html` | Design-Richtung **B „Werkbank“** — Graphit, Cognac-Leder, Kupfer (Instrument Sans + IBM Plex Sans) |
| `design/richtung-c.html` | Design-Richtung **C „Glut“** — Nachtblau dark-first, Bernstein-Glut (Literata + Atkinson Hyperlegible) |
| `design/screenshots/` | Screenshots der drei Richtungen (auch im PDF, Kapitel 9) |
| `prototyp/moment.html` | Klickbarer Mini-Prototyp des Moment-Flows in der empfohlenen Richtung — eine Datei, kein Build nötig |
| `daten/` | Vollständige Optionskataloge als JSON (10 Bereiche, Werte, Impulse, Bedürfnisse, Gefühle, Alternativen, Krisen-Wortgruppen) — wandern in Phase 2 unverändert in den Code |

## Jury-Ergebnis der Design-Richtungen

Drei Linsen (psychologische Passung, Lesbarkeit/Zugänglichkeit, Eigenständigkeit):

| Richtung | Psychologie | Lesbarkeit | Marke | Summe |
|---|---|---|---|---|
| **A Morgenlicht** | 9 | 9 | 6 | **24** |
| B Werkbank | 7 | 8 | 9 | 24 |
| C Glut | 8 | 7 | 7 | 22 |

Gleichstand A/B — die Lesbarkeits-Linse gibt den Ausschlag: **Empfehlung Richtung A**,
angereichert um die stärksten Elemente aus B (materieller Atemkreis, 38-px-Skalen-Pills)
und C (warmer Dark Mode als Maßstab). Details in Kapitel 9 des Konzepts.

## Prototyp ausprobieren

`prototyp/moment.html` im Browser öffnen (Doppelklick genügt, funktioniert offline):

- Einstieg über den **Innehalten**-Button, eine Impuls-Kachel oder das Textfeld
  („ich will jetzt ein eis“) — die regelbasierte Erkennung läuft bereits.
- Demo-Schalter **Mit Ziel / Ohne Ziel** zeigt beide Kompass-Spiegel-Varianten.
- Der 10-Minuten-Timer hat eine kleine **×60**-Demo-Taste zum Raffen.
- Jeder Schritt ist direkt ansteuerbar: `#start`, `#ankommen`, `#gefuehl`,
  `#beduerfnis`, `#entscheidung`, `#timer`, `#abschluss`, `#krise`.
- Der gesamte Flow bleibt unter 90 Sekunden; „Bewusst ja“ erhält dasselbe warme
  Feedback wie jede andere Entscheidung.

## Stand

Phase 1 abgenommen, **Richtung A freigegeben**, Phase 2 geliefert: Onboarding/Kompass,
Moment-Flow (Kacheln + Text + Sprache, regelbasierte Interpretation, Krisen-Check),
Scoring Variante A, Wochenreflexion, Dashboard mit Trends, Einsichten, Einstellungen
mit Export und vollständigem Löschen — Design-Tokens als einzige Farbquelle.
**Phase 3 (später):** KI-Dialog über die Claude API hinter einem Proxy, Whisper-Option,
Sync, Notifications. Offene Fragen: Konzept, Kapitel 13.

*Hinweis: Jetztgut ist ein Selbsthilfe-Werkzeug und ersetzt keine Therapie.
In Krisen: Telefonseelsorge 0800 111 0 111 oder 116 123, bei akuter Gefahr 112.*
