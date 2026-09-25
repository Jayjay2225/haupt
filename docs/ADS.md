# Anzeigentexte (Prompt 12, Abschnitt 6)

Quelle im Code: `apps/web/content/anzeigen.ts` – alle Texte laufen durch den
Wording-Test (fünf harte Linien, Längen, Zeitraum 1980–2020).

## Google Responsive Search Ads

**Überschriften (≤ 30 Zeichen):**

| Text | Zeichen |
|---|---|
| Alte Lebensversicherung? | 24 |
| Rückkaufswert zu niedrig? | 25 |
| Erst rechnen, dann kündigen | 27 |
| Ampel in 5 Minuten | 18 |
| Vertrag von 1980 bis 2020? | 26 |
| Mit echten Versichererzahlen | 28 |
| Ergebnis sofort statt in Tagen | 30 |

**Beschreibungen (≤ 90 Zeichen):**

| Text | Zeichen |
|---|---|
| Vertrag von 1980 bis 2020? Oft ist mehr drin als der Rückkaufswert. Jetzt rechnen. | 82 |
| 5 Minuten, Ihre Police, eine klare Ampel. Rot heißt: lohnt nicht – das sagen wir auch. | 86 |

## Meta-Haupttext

> Der Brief vom Versicherer kommt. Die Zahl ist kleiner als gedacht. Wenn Ihr
> Vertrag zwischen 1980 und 2020 begann, ist das oft nicht das letzte Wort.
> Wir rechnen in 5 Minuten aus, ob mehr drin ist – mit den echten Zahlen Ihres
> Versicherers. Und wenn nicht, sagen wir das auch.

## Abweichungen vom Deck (gemeldet, nicht stillschweigend – Prompt 10 Regel)

Drei Deck-Zeilen überschreiten die Google-Grenzen und wurden minimal gekürzt
(Details auch in `docs/TEXT-REVIEW.md`):

1. Überschrift „Ergebnis sofort, nicht in Tagen“ (31 Zeichen) →
   **„Ergebnis sofort statt in Tagen“** (30).
2. Beschreibung „Vertrag von 1980 bis 2020? Rechnerisch ist oft mehr drin als
   der Rückkaufswert. Jetzt rechnen.“ (94) →
   **„… Oft ist mehr drin als der Rückkaufswert. Jetzt rechnen.“** (82).
3. Beschreibung „5 Minuten, Ihre Police, eine klare Ampel. Rot heißt: lohnt
   nicht. Das sagen wir Ihnen auch.“ (91) →
   **„… Rot heißt: lohnt nicht – das sagen wir auch.“** (86).

## Schaltungshinweise

- Zielseite: Startseite (`/`) bzw. direkt `/rechner`; Beta bleibt hinter
  Passwort – Anzeigen erst nach Go-live schalten.
- Keine Anzeigen mit Prozent- oder Euro-Versprechen; der Musterfall bleibt der
  Website vorbehalten (gekennzeichnet).
- Vor Schaltung: anwaltliche Abnahme der Anzeigentexte zusammen mit den
  Website-Texten (docs/LEGAL-OPEN-QUESTIONS.md Nr. 21).
