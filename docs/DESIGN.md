# Gestaltungsplan Renten-Rettung (Prompt 8, Aufgabe 6)

Stand: 18.09.2026 · Grundlage für die Umsetzung in `apps/web` (Freigabe-Dokument). Alle Werte liegen in `apps/web/config/brand.ts`; Änderungen nach der Freigabe sind Konfigurationsänderungen, kein Umbau.

## 1. Farben

| Rolle | Wert | Einsatz |
|---|---|---|
| Marineblau (Grundton) | `#0A1F33` | Fließtext, Überschriften, Kopf-/Fußzeile, Knopf-Text auf Orange |
| Weiß | `#FFFFFF` | Seitengrund |
| Helles Blaugrau | `#F1F4F8` | Abschnittsflächen, Kästen, Formularfelder |
| Rettungsorange (Signal) | `#F2541B` | **nur** Hauptknopf (Fläche) und einzelne Wörter in großen Überschriften |
| Orange dunkel | `#B34011` | Orange-Betonung in kleiner Schrift (Ersatz, wenn 3:1 nicht reicht) |
| Sekundärtext | `#4A5A66` | Erklärtexte, Fußnoten |
| Linien | `#D7DFE4` | Rahmen, Tabellenlinien |
| Ampel Grün | `#1E8E4E` | **ausschließlich** Ampel |
| Ampel Gelb | `#F2B705` | **ausschließlich** Ampel |
| Ampel Rot | `#C62828` | **ausschließlich** Ampel |

Kontraste (WCAG 2.1, gemessen): Marineblau auf Weiß 16,7:1 · Marineblau auf Blaugrau 15,2:1 · **Marineblau auf Orange 4,8:1 (Hauptknopf, AA für Normaltext)** · Weiß auf Orange nur 3,5:1 (deshalb kein weißer Knopftext) · Orange auf Weiß 3,5:1 (nur große Überschriften ≥ 24 px, AA-Großtext) · Sekundärtext auf Weiß 7,1:1 · Ampel: Navy auf Gelb 9,2:1, Weiß auf Rot 5,6:1, Weiß auf Grün 4,2:1 (Ampel-Beschriftung steht daher immer in Marineblau **neben** dem Licht, nie weiß im Licht).

Diagramme: Die Website-Kurve (Nettoverzinsung) läuft einfarbig in Marineblau, Branchenreferenz in Sekundärgrau gestrichelt – eine Reihe braucht keine kategoriale Palette. Der PDF-Bericht behält seine validierte Palette (sachliche Optik).

## 2. Schrift

- Überschriften: **Archivo ExtraBold (800)**, eng gesetzt, Zeilenhöhe 1,1. Startseiten-H1 mobil 34 px, Desktop 48 px.
- Fließtext: **Source Sans 3**, Regular 400 / Semibold 600, **mindestens 18 px**, Zeilenhöhe 1,55.
- Beträge und Jahreszahlen mit Tabellenziffern (`font-variant-numeric: tabular-nums`).
- Beide Schriften sind Open-Font-License; Next lädt sie beim Build und liefert sie von der eigenen Domain (kein Google-Request zur Laufzeit).

## 3. Das Erkennungszeichen: die Ampel

Eine große, senkrechte Ampel (drei Lichter, Marineblau-Gehäuse) steht neben dem Schnellcheck. Sie „springt an“, während die vier Felder ausgefüllt werden: pro ausgefülltem Feld wird ein Segment des Gehäuses hell; sind alle vier Felder gefüllt, pulsiert das oberste Licht kurz als „bereit“-Signal (bei `prefers-reduced-motion` kein Pulsieren, nur Zustandswechsel). Farben in der Ampel sind ausschließlich die drei Ampelfarben; vor dem Ergebnis sind alle Lichter grau.

Auf der Ergebnis-Seite zeigt dieselbe Ampel genau ein Licht: Grün, Gelb oder Rot – mit Text in Marineblau daneben („Grün: Rechnen lohnt sich voraussichtlich“, „Rot: Finger weg – kündigen bringt hier nicht weniger“).

## 4. Startseiten-Skizze (mobil zuerst)

```
┌──────────────────────────────────────┐
│ Renten-Rettung        Für Unternehmer│  Kopfzeile (Navy, weiß)
├──────────────────────────────────────┤
│ Beta – nur mit Passwort              │  schmaler Hinweisstreifen
├──────────────────────────────────────┤
│                                      │
│  ALTE LEBENSVERSICHERUNG?            │  H1 Archivo 800, „rechnen“
│  ERST RECHNEN. DANN KÜNDIGEN.        │  in Rettungsorange
│                                      │
│  Kündigen bringt den Rückkaufswert.  │  Source Sans 18 px
│  Ein Widerspruch kann mehr bringen.  │
│                                      │
│  ┌──────┐  Versicherer  [_________]  │  Schnellcheck: 4 Felder
│  │ ○    │  Beginn       [MM/JJJJ  ]  │  Ampel-Gehäuse links,
│  │ ○    │  Monatsbeitrag[______ € ]  │  Segmente füllen sich
│  │ ○    │  Rückkaufswert[______ € ]  │  mit jedem Feld
│  └──────┘                            │
│  [  Jetzt rechnen – kostenlos      ] │  Hauptknopf Orange/Navy,
│  5 Minuten. Ihre Police. Eine Ampel. │  mobil unten fixiert
├──────────────────────────────────────┤
│ SO LÄUFT ES        1 → 2 → 3         │  drei kurze Schritte
├──────────────────────────────────────┤
│ MUSTERFALL                           │  gerundete Werte aus dem
│ Rückkaufswert rund 310.000 €         │  eigenen Rechenkern,
│ Rückabwicklung rund 620.000 €        │  Zusatz „Musterfall,
│ (590.000 bis 650.000 €)              │  Schätzung mit Bandbreite“
├──────────────────────────────────────┤
│ WAS KOSTET ES?     Ampel: 0 €        │
│                    Bericht: 89 €     │  Preis aus Konfiguration
├──────────────────────────────────────┤
│ ▌SO VERDIENEN WIR                    │  Pflicht-Kasten (Kurzfassung)
│ ▌Am Bericht. Wenn Sie über uns       │
│ ▌verkaufen. Nicht daran, ob Sie      │
│ ▌klagen.                             │
├──────────────────────────────────────┤
│ FRAGEN  ▸ ▸ ▸                        │  aufklappbar
├──────────────────────────────────────┤
│ Fußzeile: Verkaufen · So verdienen   │
│ wir · Für Unternehmer · Impressum …  │
└──────────────────────────────────────┘
```

Ruhe: keine Archivfotos, keine Verläufe, keine Kartenraster; Abschnitte wechseln nur zwischen Weiß und Blaugrau.

## 5. Tonalität (Aufgabe 1) – Prüfregeln

- Überschriften und Knöpfe: höchstens acht Wörter, aktive Verben, ein Gedanke.
- Alltagswörter zuerst („Police“, „kündigen“, „mehr drin“, „rechnen“); Fachbegriffe im Fließtext erklärt.
- Zahlen nur aus dem Rechenkern oder mit Quelle; der Musterfall gerundet und beschriftet.
- Negativ-Ergebnis laut: „Rot heißt: Finger weg. Das sagen wir Ihnen auch.“
- Verbotsliste (automatisch getestet in `apps/web/test/wording.test.ts`): „bis zu … %“, „garantiert“, „sichern Sie sich“, „steht Ihnen zu“, „Anspruch“ als Zusage, „nur heute“, künstliche Verknappung, Vorher-Nachher-Versprechen, Emojis, Großbuchstaben-Geschrei im Fließtext; für den Ankauf zusätzlich: BaFin/Erlaubnis/Zulassung, Name des Aufkäufers, Prozentangaben zu Auszahlungen, „Wirtschaftsprüfer“.

## 6. Bewegung und Barrierefreiheit

- `prefers-reduced-motion: reduce` schaltet Pulsieren und weiche Übergänge ab.
- Fokusringe in Orange dunkel (`#B34011`) auf Weiß, in Weiß auf Navy.
- Hauptknopf mobil unten fixiert (`position: sticky`), Mindesthöhe 56 px.
- Alle Formularfelder mit sichtbarem Label, Fehlertexte per `aria-describedby`.
