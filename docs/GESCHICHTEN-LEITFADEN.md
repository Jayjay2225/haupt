# Leitfaden „Geschichten“ (Prompt 14, Abschnitt 5)

„Geschichten“ sind Erfahrungen von Menschen, die ihre Police **verkauft** haben – die
zweite Stimme neben den Kundenstimmen („Das sagen Kunden“). Es gilt derselbe
Freigabeprozess wie für Kundenstimmen (Prompt 12, Abschnitt 5): Keine Geschichte ohne
dokumentierte Einwilligung, keine erfundene Geschichte, keine Kürzung, die den Sinn
verändert. Ohne freigegebene Geschichte bleibt die Sektion ausgeblendet – kein
Platzhalter, kein „demnächst“ (Test `prompt14.test.ts`).

## Datensatz (`data/stories.json`)

| Feld | Inhalt |
|---|---|
| `title` | Kurze Überschrift in den Worten der Person (höchstens acht Wörter). |
| `story_display` | Anzeigefassung, **höchstens 90 Wörter**; nur Kürzung des Originals, kein Umschreiben. |
| `story_original` | Wortlaut, wie er eingegangen ist (E-Mail, Brief, Gesprächsnotiz mit Datum). |
| `name_display` | Vorname und abgekürzter Nachname, z. B. „Karin M.“ – so, wie die Person es freigegeben hat. |
| `age` | Alter zum Zeitpunkt der Freigabe. |
| `context` | Vertragsart und Jahr des Verkaufs, z. B. „Kapitallebensversicherung, verkauft 2026“. |
| `consent_text` | Der Freigabetext (unten) im Wortlaut der Person. |
| `consent_at` | ISO-Zeitstempel der Freigabe – **Pflicht fürs Rendern**. |
| `consent_channel` | Kanal der Freigabe: E-Mail, Brief, Formular. |
| `customer_ref` | Interne Referenz (Bestell- oder Vorgangsnummer), nie öffentlich. |
| `verified` | `true` erst, wenn Jack Freigabe und Original abgeglichen hat. |

Regeln für den Text: **keine Beträge, keine Prozentwerte**, keine Namen von Aufkäufern,
keine Bewertung des Ankaufspreises, keine Aussagen über Mehrerlöse. Es wird nichts
empfohlen – die Person erzählt, was sie getan hat und wie es sich anfühlte. Beträge
oder Prozente im Original werden in der Anzeigefassung entfernt (Kürzung, keine
Umformulierung). Ein Initialen-Avatar ersetzt Fotos; keine Bilder neben Geschichten.

## Die fünf Fragen (Gesprächsleitfaden)

Die Fragen werden in dieser Reihenfolge gestellt, die Antworten wörtlich notiert.
Nachfragen nur zum Verständnis, nie mit Vorschlägen für Formulierungen.

1. **Ausgangslage.** Wie war die Situation, bevor Sie sich mit dem Vertrag beschäftigt haben? Was hat den Anstoß gegeben?
2. **Moment der Entscheidung.** Wann und woran haben Sie gemerkt, dass Sie verkaufen wollen – und nicht kündigen oder behalten?
3. **Wie lief es.** Wie ist der Verkauf abgelaufen? Was war einfacher als gedacht, was schwieriger?
4. **Was wurde daraus.** Was haben Sie mit dem Ergebnis gemacht, was hat sich verändert?
5. **Was raten Sie anderen.** Was würden Sie jemandem sagen, der heute vor derselben Entscheidung steht?

## Freigabe-Vorlage (per E-Mail an die Person, Antwort = Einwilligung)

> Betreff: Ihre Geschichte auf renten-rettung.de – bitte um Freigabe
>
> Guten Tag [Anrede Name],
>
> vielen Dank für das Gespräch. Unten steht die Fassung, die wir auf renten-rettung.de
> zeigen möchten – unter dem Titel „[Titel]“, mit der Angabe „[Vorname N.], [Alter] ·
> [Vertragsart], verkauft [Jahr]“ und einem Initialen-Avatar, ohne Foto.
>
> [Anzeigefassung, höchstens 90 Wörter]
>
> Wenn das so in Ordnung ist, antworten Sie bitte mit dem Satz: „Ich gebe diese Fassung
> zur Veröffentlichung auf renten-rettung.de frei.“ Sie können die Freigabe jederzeit
> per E-Mail an info@renten-rettung.de widerrufen; wir entfernen die Geschichte dann
> innerhalb von zwei Werktagen. Änderungswünsche schreiben Sie einfach dazu – wir
> übernehmen sie wörtlich.
>
> Freundliche Grüße
> [Name], Renten-Rettung

Ablage: Antwort-E-Mail (oder Brief) als PDF unter `docs/freigaben/` mit Datum, dazu der
Eintrag in `data/stories.json` mit `consent_at` = Zeitstempel der Antwort und
`consent_channel`. Erst dann `verified: true`.

## Prüfung vor Veröffentlichung

- [ ] Original und Anzeigefassung liegen vor, die Anzeigefassung ist nur gekürzt.
- [ ] Höchstens 90 Wörter, keine Beträge, keine Prozente, kein Aufkäufer-Name.
- [ ] Freigabe im Wortlaut, mit Datum und Kanal, unter `docs/freigaben/` abgelegt.
- [ ] Keine Aussage, die als Empfehlung zu verkaufen, kündigen oder behalten gelesen werden kann.
- [ ] Wording-Test läuft grün (`pnpm test`).
