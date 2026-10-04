# Recherche: Welche Vertragsjahrgänge kommen infrage? (1990–2016)

Stand 21.09.2026, Abruf aller Quellen am selben Tag. Anlass: Aussage der Abwicklungspartner, dass Verträge „bis 2016 und so alt wie möglich“ bearbeitbar sind – und zwar nicht nur über fehlerhafte Widerspruchsbelehrungen, sondern auch über versprochene, aber nicht ausgezahlte Überschüsse/Rückkaufswerte. Diese Recherche belegt die Zeiträume mit Rechtsprechung und begründet die neue Ampel-Logik (`apps/web/lib/ampel.ts`). **Keine Rechtsberatung; anwaltliche Abnahme ausstehend (LEGAL-OPEN-QUESTIONS Nr. 19).**

## Übersicht

| Beginn | Lösungsrecht | Kernrechtsprechung | Wirtschaftliche Einordnung | Ampel |
|---|---|---|---|---|
| bis 31.12.1990 | kein Widerrufs-/Widerspruchsrecht; nur Nachforderungen (Rückkaufswert/Überschüsse) | BVerfG 26.07.2005 (1 BvR 80/95); BGH-Rückkaufswert-Linie (unten) | Nachforderungen stark verjährungsanfällig | Gelb (vor-1994), Hinweis Partnerprüfung |
| 01.01.1991 – 28.07.1994 | Widerruf § 8 Abs. 4 VVG i.d.F. 17.12.1990: 10 Tage; **keine belehrungsunabhängige Erlöschensfrist** → ohne ordnungsgemäße Belehrung „ewig“ | Fassungshistorie § 8 VVG a.F. (dejure); BGH 17.12.2014 – IV ZR 260/11 (zur Folgeregelung; Rückabwicklung nach § 346 BGB) | Rückabwicklung mit Nutzungsersatz möglich; unser Rechenkern (Bereicherungsrecht § 5a-Linie) passt nur näherungsweise | Gelb (vor-1994) |
| 29.07.1994 – 31.12.2007 | Widerspruch § 5a VVG a.F. (Policenmodell) bzw. Rücktritt § 8 Abs. 5 VVG a.F. (Antragsmodell); Erlöschensregeln richtlinienkonform unanwendbar | BGH 07.05.2014 – IV ZR 76/11; BGH 17.12.2014 – IV ZR 260/11 (Antragsmodell, „ewiger Rücktritt“, § 346 BGB) | Kerngeschäft; Rechenkern rechnet vollständig | wie bisher (Grün/Gelb/Rot nach Zahlen) |
| 01.01.2008 – 10.06.2010 | Widerruf § 8 VVG n.F. (30 Tage LV, § 152); fehlerhafte Belehrung → Frist läuft nicht | BGH 29.07.2015 – IV ZR 384/14 (Belehrung ohne vollständigen Rechtsfolgenhinweis fehlerhaft; Nutzungsherausgabe) | Hebel kleiner als § 5a, aber real; einzelfallabhängig | Gelb (neu-2008) |
| 11.06.2010 – 2016 | wie vor; **Muster-Widerrufsbelehrung** (Anlage zu § 8 Abs. 5 VVG) mit Gesetzlichkeitsfiktion – aber nur bei tatsächlicher, unveränderter Verwendung | Anlage VVG (gesetze-im-internet); BGH 27.03.2019 – IV ZR 132/18 (kein Zwang zur Doppel-Belehrung); BGH 10.02.2021 – IV ZR 32/20 (nur formale Fehler → Ausübung ggf. treuwidrig) | nur noch Verträge ohne/mit abgewandelter Musterbelehrung; Partneraussage „bis 2016“ deckt sich damit | Gelb (neu-2008), enger Filter |
| ab 2017 | Belehrungen praktisch durchgehend musterkonform | – | Widerruf läuft regelmäßig ins Leere | Rot (ab-2017) |

## Zweiter Anspruchsstrang: „versprochene, nie ausgezahlte Mehrerlöse“

Gemeint sind zu niedrige Rückkaufswerte/Überschüsse – unabhängig vom Widerruf, v. a. bei gekündigten oder beitragsfrei gestellten Verträgen:

1. **BVerfG 26.07.2005 – 1 BvR 80/95:** Schutzdefizit bei der Ermittlung des Schlussüberschusses (stille Reserven, Querverrechnungen); Gesetzgeber musste bis 31.12.2007 nachbessern (→ § 153 VVG n.F., Beteiligung an Bewertungsreserven).
2. **BGH 09.05.2001 (BGHZ 147, 354/373) und 12.10.2005 – IV ZR 162/03 u. a.:** Klauseln zu Rückkaufswert, Stornoabzug und Abschlusskostenverrechnung (Tarifgeneration 1994–2001) intransparent/unwirksam; **Mindestleistung = hälftiges ungezillmertes Deckungskapital**, Stornoabzug entfällt.
3. **BGH 26.06.2013 – IV ZR 39/10:** dieselbe Linie für die Klauselgeneration ab 2001 (Verträge Juli 1995–März 2001 im Fall; Fortschreibung für 2001–2007); Mindestwert ohne Abschlusskosten, Auskunftsanspruch des Kunden.
4. **Verjährung:** Nachforderungen aus Kündigung/Abrechnung verjähren regelmäßig in 3 Jahren ab Schluss des Abrechnungsjahres (§§ 195, 199 BGB) – für Altkündigungen heute meist verjährt; relevant für frische Kündigungen und als Rechenposten in der Rückabwicklung. Der **Widerspruch/Widerruf selbst ist ein Gestaltungsrecht und verjährt nicht**; der Bereicherungsanspruch entsteht erst mit Ausübung und verjährt 3 Jahre ab Jahresende der Erklärung (**BGH 08.04.2015 – IV ZR 103/15**). Das trägt die Partneraussage „so alt wie möglich, unbegrenzt“ für laufende bzw. nicht widerrufene Verträge.

## Konsequenz für die Ampel (umgesetzt)

- **vor 29.07.1994 → Gelb** statt Rot: Hebel Widerruf a.F. (ab 1991) plus Mindestrückkaufswert-Linie; Zahlenschätzung nur eingeschränkt, Partnerprüfung.
- **2008–2016 → Gelb** statt Rot: Widerruf n.F. bei fehlerhafter Belehrung; einzelfallabhängig.
- **ab 2017 → Rot** (neuer Grund `ab-2017`).
- Bericht (Zahlenrechnung) weiterhin nur für 29.07.1994–2007; für die neuen Gelb-Jahrgänge verweist die Ergebnis-Seite auf die Partnerprüfung statt auf den Berichtskauf.

## Offen / anwaltlich zu klären

- Reichweite des „ewigen“ Widerrufs für 1991–1994 (Fassungshistorie § 8 Abs. 4 VVG 1990 primär verifizieren; Rückabwicklungsmaßstab § 346 BGB vs. § 812 BGB).
- 2010–2016: Quote musterkonformer Belehrungen je Versicherer (Partnererfahrung) vs. BGH-Treuwidrigkeits-Linie (IV ZR 32/20) – Filterfragen im Funnel ergänzen?
- Cutoff „ab 2017 Rot“ ist Partner-/Geschäftsentscheidung, keine gesicherte Rechtsgrenze.
- Verjährungsprüfung je Fallgruppe in den Eignungs-Check aufnehmen (gekündigt vor > 3 Jahren → Hinweis).

## Quellen (Abruf 21.09.2026)

- BGH IV ZR 76/11 und Folgerechtsprechung: [dejure zu IV ZR 260/11](https://dejure.org/dienste/vernetzung/rechtsprechung?Aktenzeichen=IV+ZR+260/11&Datum=17.12.2014&Gericht=BGH), [Sausen: „Ewiges Rücktrittsrecht“ im Antragsmodell](https://sausen.de/bgh-ewiges-ruecktrittsrecht-auch-bei-lebens-und-rentenversicherungen-nach-dem-antragsmodell/), [Rechtslupe zur Rücktrittsfrist im Antragsmodell](https://www.rechtslupe.de/wirtschaftsrecht/versicherungsrecht/lebensversicherungen-und-die-widerrufsfrist-beim-alten-antragsmodell-389499)
- § 8 VVG a.F. Fassungen: [dejure § 8 VVG a.F.](https://dejure.org/gesetze/0VVG311207/8.html), [dejure § 8 VVG n.F.](https://dejure.org/gesetze/VVG/8.html), [Verbraucherzentrale Hamburg zum Rücktritt](https://www.vzhh.de/themen/versicherungen/lebens-rentenversicherung/ruecktritt-von-der-lebensversicherung), [Finanztip-Überblick](https://www.finanztip.de/lebensversicherung/lebensversicherung-widerrufen/)
- Widerruf ab 2008: [dejure zu IV ZR 384/14 (29.07.2015)](https://dejure.org/dienste/vernetzung/rechtsprechung?Gericht=BGH&Datum=29.07.2015&Aktenzeichen=IV+ZR+384/14), [ilex-Besprechung](https://www.ilex-recht.de/nachricht-im-detail/bgh-staerkt-rechte-der-versicherungsnehmer-von-kapitallebensversicherungen-bei-fehlerhafter-widerrufsbelehrung.html), [LTO zu IV ZR 268/21 (Treuwidrigkeit)](https://www.lto.de/recht/nachrichten/n/bgh-ivzr26821-lebensversicherung-widerspruch-belehrung-bereicherungsrecht-rueckabwicklung-treuwidrig), [BGH IV ZR 132/18, Volltext PDF](https://juris.bundesgerichtshof.de/cgi-bin/rechtsprechung/document.py?Gericht=bgh&Art=en&Datum=2019-3-27&nr=94398&pos=15&anz=24&Blank=1.pdf)
- Musterbelehrung: [Anlage zu § 8 Abs. 5 VVG (gesetze-im-internet)](https://www.gesetze-im-internet.de/vvg_2008/anlage.html), [Art. 8 EGVVG](https://dejure.org/gesetze/EGVVG/8.html)
- Rückkaufswert/Überschüsse: [BVerfG-Pressemitteilung 67/2005 zu 1 BvR 80/95](https://www.bundesverfassungsgericht.de/SharedDocs/Pressemitteilungen/DE/2005/bvg05-067.html), [BVerfG-Volltext](https://www.bundesverfassungsgericht.de/SharedDocs/Entscheidungen/DE/2005/07/rs20050726_1bvr008095.html), [dejure zu IV ZR 162/03 (12.10.2005)](https://dejure.org/dienste/vernetzung/rechtsprechung?Gericht=BGH&Datum=12.10.2005&Aktenzeichen=IV+ZR+162%2F03), [rewis: IV ZR 39/10 (26.06.2013)](https://rewis.io/urteile/urteil/s7y-26-06-2013-iv-zr-3910/), [vzhh-Bilanz nach den BGH-Urteilen (PDF)](https://epub.sub.uni-hamburg.de/epub/volltexte/2017/69954/pdf/vzhh_Zwischenbilanz_BGH_Lebensversicherungen_Aug2013.pdf), [Bund der Versicherten: Musterbrief Neuberechnung (PDF)](https://www.bundderversicherten.de/downloads/musterbriefe/musterbriefe-zu-lebensversicherungen/1518-muster-neuberechnung-gekundigter-vertrag.pdf)
- Verjährung: [anwalt24 zu IV ZR 103/15 (08.04.2015)](https://www.anwalt24.de/urteile/bgh/2015-04-08/iv-zr-103_15), [JUSTUS zur Verjährung nach Widerspruch](https://kanzleimitte.de/recht/themen/lebensversicherungen-widerruf/verjaehrung-nach-widerspruch-und-kuendigung-der-lebensversicherung/)
