# Jetztgut — App (Phase 2)

Lauffähiger MVP-Prototyp in Design-Richtung **A „Morgenlicht“**: Onboarding/Kompass,
Moment-Flow (Kacheln + Text + Sprache, regelbasierte Interpretation, Krisen-Check),
Scoring, Wochenreflexion, Dashboard mit Trends, Einsichten, Einstellungen mit
Export und vollständigem Löschen. Local-first — läuft ohne Backend, Daten liegen
in IndexedDB und überleben jedes Neuladen.

## Starten

```bash
npm install
npm run dev        # Entwicklung: http://localhost:5173
npm run build      # Produktions-Build (inkl. Copy-Lint gegen die Wortliste)
npm run preview    # Build lokal serven: http://localhost:4173
npm run test       # Vitest: Scoring- und Interpretations-Regeln (19 Tests)
npm run lint       # ESLint (verbietet u. a. Hex-Farben außerhalb tokens.css)
```

**Demo-Modus:** `http://localhost:5173/?demo=1` richtet einen Beispiel-Kompass ein
und lädt acht Beispielwochen — Trends und Einsichten leben sofort. Entfernbar
unter Einstellungen → Demo-Daten.

**Smoke-Test** (kompletter Klick-Durchlauf mit Screenshots, braucht den Preview-Server):

```bash
npm run build && npx vite preview --port 4173 &
node skripte/smoke.mjs   # 16 Screenshots in skripte/shots/
```

## Wie die App gebaut ist

| Schicht | Inhalt |
|---|---|
| `src/tokens.css` | **Einzige Farbquelle** (Morgenlicht, Light + warmer Dark Mode). ESLint weist Hex-Werte im Code zurück. |
| `src/logik/` | Reines TypeScript, UI-frei: Scoring (Variante A), regelbasierte Interpretation + Krisen-Check, Einsichten-Muster, ISO-Wochen, ULID, Seed. |
| `src/daten/` | Importiert die Kataloge **direkt aus `/daten` der Repo-Wurzel** — eine Quelle für Konzept und Code. |
| `src/db.ts` | Dexie/IndexedDB, eine Tabelle je Entität; Export (JSON vollständig, CSV Excel-kompatibel), physisches Löschen. Jede Entität trägt ULID, `updatedAt`, `deletedAt`, `deviceId` als Sync-Vorbereitung. |
| `src/screens/` | Home, Moment-Overlay (alle Verzweigungen aus Konzept Kap. 5), Onboarding, Kompass + Bereichs-Editor, Rückblick (Reflexion · Trends · Einsichten), Einstellungen. |
| `src/texte/de.json` | Alle UI-Texte (i18n vorbereitet); `skripte/copy-lint.mjs` prüft sie im Build gegen die Verbotsliste aus Konzept Kap. 7. |
| `public/` | PWA: Manifest mit „Innehalten“-Shortcut (`/?moment=1`), Service Worker (offline nach dem ersten Besuch), Icons. |

Bewusste Abweichung vom Technik-Vorschlag: Die Trend-Diagramme sind eine kleine
eigene SVG-Komponente statt Recharts — eine Serie je Panel, keine Doppelachsen,
Farben zu 100 % aus den Tokens, null zusätzliche Abhängigkeiten.

## Stand der Akzeptanzkriterien (Briefing Kap. 10)

- Moment-Flow unter 90 Sekunden spielbar, jederzeit abbrechbar, jede Frage überspringbar; „Bewusst ja“ erhält denselben warmen Abschluss. ✓ (Smoke-Test)
- Keine Schuld-Sprache: Copy-Lint über alle UI-Texte als Build-Schritt. ✓
- Wochenreflexion je Bereich 0–10 + Freitext + „Woran ich nächste Woche arbeite“, vorbefüllt aus Momenten und Vorwoche. ✓
- Läuft lokal ohne Backend; Daten überleben ein Neuladen. ✓ (Smoke-Test)
- Barrierefreiheit: AA-Kontraste über die geprüften Morgenlicht-Tokens, komplette Tastaturbedienung (echte Buttons, sichtbarer Fokus, Esc schließt den Moment), `prefers-reduced-motion` stoppt den Atemkreis. ✓

Screenshots vom automatisierten Durchlauf: `doku/` (Auswahl) bzw. `skripte/shots/` nach einem Testlauf.

## Krisenfall

Freie Eingaben werden vor jedem Scoring gegen `daten/krise.json` geprüft. Bei einem
Treffer endet der Flow ohne Scoring und ohne Log-Eintrag; die App zeigt ruhig die
Telefonseelsorge (0800 111 0 111 · 116 123, antippbar) und den Hinweis auf die 112.

*Jetztgut ist ein Selbsthilfe-Werkzeug und ersetzt keine Therapie.*
