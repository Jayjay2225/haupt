/**
 * HTML-Template der PDF-Kurzprüfung (Prompt 5): sieben Abschnitte/Seiten,
 * de-DE-Formate, eigenständiges Design, Diagramme als Inline-SVG mit
 * validierter Palette (Details docs/PROMPTS.md Prompt 5; Farb-Validierung
 * per dataviz-Referenzpalette).
 */
import type { CalcResultAlt, ContractInput, SzenarioName } from '@rueckab/calc';
import type { EligibilityResult } from '@rueckab/eligibility';
import { esc, formatDatum, formatEuro, formatMonat, formatProzent, formatZahl } from './format';
import { ZITATE_REGIME_ALT, ZITAT_ANTRAGSMODELL, ZITAT_QUELLENHINWEIS } from './zitate';

export interface BerichtInput {
  marke: string;
  aktenzeichen: string;
  kundenname: string;
  /** ISO-Datum der Erstellung. */
  erstelltAm: string;
  versichererAnzeigename: string;
  contract: ContractInput;
  calc: CalcResultAlt;
  eligibility: EligibilityResult;
}

// Validierte Diagrammfarben (dataviz-Referenzpalette, Light-Slots 1–4;
// Werte < 3:1 Kontrast erhalten direkte Beschriftung in Textfarbe).
const FARBEN = {
  spar: '#2a78d6',
  risiko: '#eb6834',
  abschluss: '#1baf7a',
  verwaltung: '#eda100',
  referenzGrau: '#6b7280',
  tinte: '#1a2530',
  tinteSanft: '#4a5a66',
  linie: '#d7dfe4',
};

const AMPEL_TEXT: Record<EligibilityResult['ampel'], { label: string; farbe: string; grund: string }> = {
  gruen: {
    label: 'Grün – Merkmale sprechen für eine vertiefte Prüfung',
    farbe: '#008300',
    grund: 'Nach Ihren Angaben liegen Merkmale vor, die Gerichte als wesentlichen Belehrungsfehler bewertet haben.',
  },
  gelb: {
    label: 'Gelb – offene Punkte, Unterlagen erforderlich',
    farbe: '#b97b00',
    grund: 'Einzelne Punkte sind offen; die genannten Unterlagen ermöglichen eine belastbarere Einordnung.',
  },
  rot: {
    label: 'Rot – kein geeigneter Fall erkennbar',
    farbe: '#c22827',
    grund: 'Nach Ihren Angaben ist ein wirtschaftlich sinnvolles Lösungsrecht nicht erkennbar.',
  },
};

function svgBeitragsaufteilung(calc: CalcResultAlt): string {
  const basis = calc.szenarien.basis;
  const teile = [
    { label: 'Sparanteil', wert: basis.summeSparanteil, farbe: FARBEN.spar },
    { label: 'Risikoanteil (inkl. BUZ)', wert: basis.summeRisiko + basis.summeBuz, farbe: FARBEN.risiko },
    { label: 'Abschlusskosten', wert: basis.summeAbschluss, farbe: FARBEN.abschluss },
    { label: 'Verwaltungskosten', wert: basis.summeVerwaltung, farbe: FARBEN.verwaltung },
  ].filter((t) => t.wert > 0);
  const gesamt = teile.reduce((a, t) => a + t.wert, 0);
  if (gesamt <= 0) {
    return '';
  }
  const breite = 660;
  const hoehe = 40;
  const luecke = 2;
  let x = 0;
  const segmente = teile
    .map((t, i) => {
      const w = Math.max(0, (t.wert / gesamt) * (breite - luecke * (teile.length - 1)));
      const rect = `<rect x="${x.toFixed(1)}" y="0" width="${w.toFixed(1)}" height="${hoehe}" fill="${t.farbe}" />`;
      x += w + (i < teile.length - 1 ? luecke : 0);
      return rect;
    })
    .join('');
  const legende = teile
    .map(
      (t) =>
        `<span class="legende-eintrag"><span class="legende-farbe" style="background:${t.farbe}"></span>${esc(t.label)}: ${formatEuro(t.wert)} (${formatProzent((t.wert / gesamt) * 100)})</span>`,
    )
    .join('');
  return `
    <figure class="diagramm" role="img" aria-label="Aufteilung der Beiträge in Spar-, Risiko-, Abschluss- und Verwaltungskostenanteil">
      <svg viewBox="0 0 ${breite} ${hoehe}" width="100%" height="${hoehe}">
        <clipPath id="bar-clip"><rect x="0" y="0" width="${breite}" height="${hoehe}" rx="4" /></clipPath>
        <g clip-path="url(#bar-clip)">${segmente}</g>
      </svg>
      <figcaption class="legende">${legende}</figcaption>
    </figure>`;
}

function svgSzenarioVergleich(calc: CalcResultAlt, rueckkaufswert: number | undefined): string {
  const reihen: { label: string; wert: number; farbe: string }[] = [];
  if (rueckkaufswert !== undefined) {
    reihen.push({ label: 'Aktueller Rückkaufswert', wert: rueckkaufswert, farbe: FARBEN.referenzGrau });
  }
  for (const name of ['min', 'basis', 'max'] as SzenarioName[]) {
    const bezeichnung = name === 'min' ? 'Szenario Min' : name === 'max' ? 'Szenario Max' : 'Szenario Basis';
    reihen.push({ label: bezeichnung, wert: calc.szenarien[name].rueckabwicklungswert, farbe: FARBEN.spar });
  }
  const max = Math.max(...reihen.map((r) => r.wert), 1);
  const breite = 660;
  const balkenMax = 420;
  const zeilenhoehe = 34;
  const balken = reihen
    .map((r, i) => {
      const w = Math.max(2, (r.wert / max) * balkenMax);
      const y = i * zeilenhoehe;
      return `
        <text x="0" y="${y + 21}" class="svg-label">${esc(r.label)}</text>
        <rect x="170" y="${y + 6}" width="${w.toFixed(1)}" height="20" rx="4" fill="${r.farbe}" />
        <text x="${(176 + w).toFixed(1)}" y="${y + 21}" class="svg-wert">${formatEuro(r.wert)}</text>`;
    })
    .join('');
  return `
    <figure class="diagramm" role="img" aria-label="Vergleich von Rückkaufswert und geschätztem Rückabwicklungswert in den Szenarien Min, Basis und Max">
      <svg viewBox="0 0 ${breite} ${reihen.length * zeilenhoehe}" width="100%" height="${reihen.length * zeilenhoehe}">
        ${balken}
      </svg>
    </figure>`;
}

function angabenTabelle(b: BerichtInput): string {
  const c = b.contract;
  const zeilen: [string, string][] = [
    ['Auftrags-/Aktenzeichen', b.aktenzeichen],
    ['Name', b.kundenname],
    ['Versicherer (Angabe laut Police)', b.versichererAnzeigename],
    ['Vertragsart', c.vertragsart],
    ['Vertragsbeginn', formatMonat(c.beginn)],
    ['Geplantes Vertragsende', c.ende !== undefined ? formatMonat(c.ende) : '–'],
    ['Stand des Vertrags', c.status + (c.statusDatum !== undefined ? ` (seit/zum ${formatMonat(c.statusDatum)})` : '')],
    ['Zahlweise', c.zahlweise],
    [
      'Erstbeitrag',
      `${formatZahl(c.erstbeitrag.betrag)} ${c.erstbeitrag.waehrung}` +
        (c.erstbeitrag.waehrung === 'DM' ? ' (Umrechnung: 1 € = 1,95583 DM)' : ''),
    ],
    ['Aktueller Beitrag', c.aktuellerBeitrag !== undefined ? formatEuro(c.aktuellerBeitrag) : '–'],
    [
      'Beitragsdynamik',
      c.dynamik.aktiv ? `ja${c.dynamik.satzProzent !== undefined ? `, ${formatZahl(c.dynamik.satzProzent)} % p. a.` : ''}` : 'nein',
    ],
    ['Eingezahlt laut Standmitteilung', c.gesamtsummeLautMitteilung !== undefined ? formatEuro(c.gesamtsummeLautMitteilung) : '–'],
    ['Aktueller Rückkaufswert', c.rueckkaufswert !== undefined ? formatEuro(c.rueckkaufswert.betrag) : '–'],
    [
      'Erhaltene Auszahlungen',
      (c.auszahlungen ?? []).length > 0
        ? (c.auszahlungen ?? []).map((a) => `${formatEuro(a.betrag)} (${formatMonat(a.monat)})`).join('; ')
        : 'keine angegeben',
    ],
    ['Eintrittsalter', c.eintrittsalter !== undefined ? String(c.eintrittsalter) : '– (Annahme laut Methodik)'],
    ['Stichtag der Berechnung', formatMonat(c.stichtag)],
  ];
  return `<table class="tabelle">
    <caption>Ihre Angaben im Überblick</caption>
    <tbody>${zeilen
      .map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`)
      .join('')}</tbody>
  </table>`;
}

function jahrestabelle(calc: CalcResultAlt): string {
  const kopf = ['Jahr', 'Beiträge', 'Risiko (inkl. BUZ)', 'Abschluss', 'Verwaltung', 'Sparanteil', 'Zinssatz', 'Quelle', 'Nutzungen', 'Stand kumuliert'];
  const herkunft: Record<string, string> = {
    insurer: 'Versicherer',
    branche: 'Branche',
    fallback: 'Näherung',
    override: 'Vorgabe',
  };
  const zeilen = calc.jahrestabelle
    .map(
      (z) => `<tr>
        <th scope="row">${z.jahr}</th>
        <td>${formatZahl(z.beitraege)}</td>
        <td>${formatZahl(z.risiko + z.buz)}</td>
        <td>${formatZahl(z.abschluss)}</td>
        <td>${formatZahl(z.verwaltung)}</td>
        <td>${formatZahl(z.sparanteil)}</td>
        <td>${formatZahl(z.zinssatzProzent)} %</td>
        <td>${herkunft[z.zinsherkunft] ?? z.zinsherkunft}</td>
        <td>${formatZahl(z.nutzungenImJahr)}</td>
        <td>${formatZahl(z.kumulierterWert)}</td>
      </tr>`,
    )
    .join('');
  return `<table class="tabelle klein">
    <caption>Jahresweise Aufschlüsselung (Basis-Szenario, Beträge in Euro)</caption>
    <thead><tr>${kopf.map((k) => `<th scope="col">${k}</th>`).join('')}</tr></thead>
    <tbody>${zeilen}</tbody>
  </table>`;
}

function szenarienTabelle(calc: CalcResultAlt): string {
  const namen: [SzenarioName, string][] = [
    ['min', 'Min (vorsichtig)'],
    ['basis', 'Basis'],
    ['max', 'Max (Obergrenze)'],
  ];
  const zeilen = namen
    .map(([name, label]) => {
      const s = calc.szenarien[name];
      return `<tr>
        <th scope="row">${label}</th>
        <td>${formatEuro(s.erstattungsfaehigeBeitraege)}</td>
        <td>${formatEuro(s.nutzungen)}</td>
        <td>${formatEuro(s.rueckabwicklungswert)}</td>
        <td>${formatEuro(s.erhalteneLeistungenAufgezinst)}</td>
        <td>${formatEuro(s.nettoanspruch)}</td>
        <td>${s.mehrwertGegenKuendigung !== undefined ? formatEuro(s.mehrwertGegenKuendigung) : '–'}</td>
      </tr>`;
    })
    .join('');
  return `<table class="tabelle">
    <caption>Gesamtrechnung in allen drei Szenarien</caption>
    <thead><tr>
      <th scope="col">Szenario</th><th scope="col">Erstattungsfähige Beiträge</th><th scope="col">Nutzungen</th>
      <th scope="col">Rückabwicklungswert</th><th scope="col">./. erhaltene Leistungen (aufgezinst)</th>
      <th scope="col">Nettoanspruch (geschätzt)</th><th scope="col">Mehrwert ggü. Kündigung</th>
    </tr></thead>
    <tbody>${zeilen}</tbody>
  </table>`;
}

function zinsreihenTabelle(calc: CalcResultAlt): string {
  const eintraege = calc.szenarien.basis.zinsreihe
    .map((j) => {
      const quelle =
        j.herkunft === 'insurer'
          ? 'Versicherer'
          : j.herkunft === 'branche'
            ? (j.quelle?.titel ?? 'Branchendurchschnitt')
            : j.herkunft === 'override'
              ? 'Vorgabe'
              : 'Näherung (letzter Branchenwert)';
      return `<tr><th scope="row">${j.jahr}</th><td>${formatZahl(j.satzProzent)} %</td><td>${esc(quelle)}</td></tr>`;
    })
    .join('');
  return `<div class="spalten"><table class="tabelle klein">
    <caption>Verwendete Zinsreihe (Basis-Szenario) mit Quelle je Jahr</caption>
    <thead><tr><th scope="col">Jahr</th><th scope="col">Satz</th><th scope="col">Quelle</th></tr></thead>
    <tbody>${eintraege}</tbody>
  </table></div>`;
}

function liste(punkte: string[]): string {
  return `<ul>${punkte.map((p) => `<li>${p}</li>`).join('')}</ul>`;
}

export function renderBerichtHtml(b: BerichtInput): string {
  if (b.calc.regime !== 'alt-policenmodell') {
    throw new Error('Der Berichtsgenerator unterstützt in dieser Version nur Altverträge (Regime § 5a/§ 8 VVG a.F.).');
  }
  const basis = b.calc.szenarien.basis;
  const min = b.calc.szenarien.min;
  const max = b.calc.szenarien.max;
  const rkw = b.contract.rueckkaufswert?.betrag;
  const ampel = AMPEL_TEXT[b.eligibility.ampel];
  const keinVorteil = basis.wirtschaftlichKeinVorteil === true;
  const regimeB = b.eligibility.regime === 'alt-antragsmodell';
  const zitate = regimeB ? [...ZITATE_REGIME_ALT.slice(0, 2), ZITAT_ANTRAGSMODELL] : ZITATE_REGIME_ALT;

  const mehrwertSatz =
    basis.mehrwertGegenKuendigung === undefined
      ? 'Ein Vergleich mit dem Rückkaufswert war mangels Angabe nicht möglich.'
      : keinVorteil
        ? `Nach dieser Schätzung ist gegenüber dem aktuellen Rückkaufswert <strong>wirtschaftlich kein Vorteil erkennbar</strong> (Basis-Szenario: ${formatEuro(basis.mehrwertGegenKuendigung)}).`
        : `Gegenüber dem aktuellen Rückkaufswert ergäbe sich im Basis-Szenario ein geschätzter Mehrwert von <strong>${formatEuro(basis.mehrwertGegenKuendigung)}</strong> – unter den auf Seite 4 genannten Annahmen.`;

  const dokumente = b.eligibility.benoetigteDokumente;

  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>Kurzprüfung ${esc(b.aktenzeichen)}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 9.5pt;
    line-height: 1.5;
    color: ${FARBEN.tinte};
  }
  .seite { page-break-after: always; }
  .seite:last-child { page-break-after: auto; }
  h1 { font-size: 19pt; margin: 0 0 4mm; line-height: 1.25; }
  h2 { font-size: 13pt; margin: 0 0 3mm; border-bottom: 1.5pt solid ${FARBEN.linie}; padding-bottom: 1.5mm; }
  h3 { font-size: 10.5pt; margin: 4mm 0 1.5mm; }
  p { margin: 0 0 2.5mm; }
  .sekundaer { color: ${FARBEN.tinteSanft}; }
  .kicker { text-transform: uppercase; letter-spacing: 0.08em; font-size: 8pt; color: ${FARBEN.tinteSanft}; margin-bottom: 2mm; }
  .meta-box { border: 1pt solid ${FARBEN.linie}; border-radius: 3mm; padding: 3mm 4mm; margin: 4mm 0; display: grid; grid-template-columns: 1fr 1fr; gap: 1mm 6mm; font-size: 9pt; }
  .hero { background: #f3f6f8; border-radius: 3mm; padding: 5mm; margin: 5mm 0; }
  .hero .zahl { font-size: 26pt; font-weight: 700; }
  .hero .spanne { color: ${FARBEN.tinteSanft}; margin-top: 1mm; }
  .ampel { display: inline-flex; align-items: center; gap: 2mm; border: 1pt solid ${FARBEN.linie}; border-radius: 10mm; padding: 1.5mm 4mm; font-weight: 600; margin-top: 3mm; }
  .ampel .punkt { width: 3.5mm; height: 3.5mm; border-radius: 50%; display: inline-block; }
  .hinweisbox { background: #fdf6ec; border: 1pt solid #e5cfa3; border-radius: 2mm; padding: 3mm 4mm; margin: 3mm 0; }
  .tabelle { width: 100%; border-collapse: collapse; margin: 3mm 0; }
  .tabelle caption { text-align: left; font-weight: 700; margin-bottom: 1.5mm; }
  .tabelle th, .tabelle td { border-bottom: 0.5pt solid ${FARBEN.linie}; padding: 1.2mm 2mm 1.2mm 0; text-align: left; vertical-align: top; }
  .tabelle thead th { border-bottom: 1pt solid ${FARBEN.tinteSanft}; font-size: 8.5pt; }
  .tabelle tbody th { font-weight: 600; color: ${FARBEN.tinteSanft}; width: 34%; }
  .tabelle.klein { font-size: 8pt; }
  .tabelle.klein td, .tabelle.klein th { padding: 0.9mm 1.5mm 0.9mm 0; }
  .tabelle.klein tbody th { width: auto; }
  .tabelle td:nth-child(n+2):not(:last-child) { font-variant-numeric: tabular-nums; }
  .diagramm { margin: 4mm 0; }
  .legende { display: flex; flex-wrap: wrap; gap: 2mm 6mm; font-size: 8.5pt; margin-top: 2mm; color: ${FARBEN.tinte}; }
  .legende-farbe { width: 3mm; height: 3mm; display: inline-block; border-radius: 0.8mm; margin-right: 1.5mm; }
  .svg-label { font-size: 12px; fill: ${FARBEN.tinte}; font-family: inherit; }
  .svg-wert { font-size: 12px; font-weight: 600; fill: ${FARBEN.tinte}; font-family: inherit; }
  .zitat { border-left: 1.5pt solid ${FARBEN.linie}; padding-left: 4mm; margin: 3mm 0; }
  .zitat .quelle { font-weight: 700; }
  .formel { font-family: ui-monospace, 'Cascadia Mono', Consolas, monospace; background: #f3f6f8; padding: 2mm 3mm; border-radius: 1.5mm; display: inline-block; }
  .spalten { column-count: 2; column-gap: 8mm; }
  .spalten .tabelle { break-inside: avoid-column; }
  ul { margin: 0 0 2.5mm; padding-left: 5mm; }
  li { margin-bottom: 1mm; }
  .fussnote { font-size: 8pt; color: ${FARBEN.tinteSanft}; }
  .disclaimer { border: 1pt solid ${FARBEN.linie}; border-radius: 2mm; padding: 3mm 4mm; font-size: 8.5pt; color: ${FARBEN.tinteSanft}; }
</style>
</head>
<body>

<!-- Seite 1: Deckblatt -->
<section class="seite">
  <p class="kicker">${esc(b.marke)} · Schriftliche Kurzprüfung</p>
  <h1>Kurzprüfung zur Rückabwicklung Ihrer ${b.contract.vertragsart === 'private-rv' || b.contract.vertragsart === 'fonds-rv' ? 'Rentenversicherung' : 'Lebensversicherung'}</h1>
  <div class="meta-box">
    <span><strong>Aktenzeichen:</strong> ${esc(b.aktenzeichen)}</span>
    <span><strong>Erstellt am:</strong> ${formatDatum(b.erstelltAm)}</span>
    <span><strong>Für:</strong> ${esc(b.kundenname)}</span>
    <span><strong>Versicherer:</strong> ${esc(b.versichererAnzeigename)}</span>
  </div>
  <div class="hero">
    <p class="sekundaer" style="margin:0">Geschätzter Rückabwicklungswert (Basis-Szenario)</p>
    <p class="zahl">${formatEuro(basis.rueckabwicklungswert)}</p>
    <p class="spanne">Spanne der Szenarien Min–Max: ${formatEuro(min.rueckabwicklungswert)} bis ${formatEuro(max.rueckabwicklungswert)}</p>
    ${rkw !== undefined ? `<p class="spanne">Zum Vergleich – aktueller Rückkaufswert: <strong>${formatEuro(rkw)}</strong></p>` : ''}
  </div>
  <p>${mehrwertSatz}</p>
  <p class="ampel"><span class="punkt" style="background:${ampel.farbe}"></span> Eignungs-Check: ${ampel.label}</p>
  <p style="margin-top:2mm" class="sekundaer">${esc(ampel.grund)} Die Begründung im Einzelnen finden Sie auf Seite 2 und 7.</p>
  <div class="hinweisbox">
    <strong>Wichtig:</strong> Alle Werte sind Schätzungen unter offengelegten Annahmen (Seite 4) auf Basis öffentlich
    verfügbarer Kennzahlen – kein Anspruch in bestimmter Höhe und keine Rechtsberatung im Einzelfall. Ob ein
    Widerspruch bzw. Rücktritt wirksam erklärt werden kann, beurteilt ausschließlich ein Rechtsanwalt.
  </div>
</section>

<!-- Seite 2: Grundlage und Einordnung -->
<section class="seite">
  <h2>1. Grundlage und rechtliche Einordnung</h2>
  <p>
    Diese Kurzprüfung schätzt, welchen Wert die bereicherungsrechtliche Rückabwicklung Ihres Vertrags hätte,
    wenn ein Widerspruch (§ 5a VVG a.F.) bzw. Rücktritt (§ 8 VVG a.F.) wirksam wäre – und vergleicht ihn mit dem
    aktuellen Rückkaufswert. Sie ersetzt keine anwaltliche Prüfung, sondern bereitet sie vor.
  </p>
  <h3>Einordnung Ihres Vertrags</h3>
  ${liste(b.eligibility.begruendungen.map((x) => `${esc(x.text)} <span class="fussnote">[${x.regelIds.join(', ')}]</span>`))}
  <h3>Maßgebliche Rechtsprechung</h3>
  ${zitate
    .map(
      (z) => `<div class="zitat">
        <p class="quelle" style="margin:0">${z.gericht}, Urteil vom ${z.datum} – ${z.az}</p>
        <p class="sekundaer" style="margin:0 0 1mm">${esc(z.einordnung)}</p>
        <p style="margin:0">${z.zitat}</p>
      </div>`,
    )
    .join('')}
  <p class="fussnote">${esc(ZITAT_QUELLENHINWEIS)}</p>
  <h3>Was dieser Bericht ist – und was nicht</h3>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:6mm">
    <div>${liste([
      'eine strukturierte, nachvollziehbare Schätzung in drei Szenarien',
      'jede Kennzahl mit Quelle und Herkunft (Seite 4–5)',
      'eine Vorprüfung der Belehrung als Hinweis für die Kanzlei',
    ])}</div>
    <div>${liste([
      'keine Rechtsberatung im Einzelfall und keine Vertretung',
      'keine Zusage eines Anspruchs oder Erfolgs',
      'keine steuerliche Beratung; keine Empfehlung, den Vertrag zu kündigen oder zu behalten',
    ])}</div>
  </div>
</section>

<!-- Seite 3: Ihre Angaben -->
<section class="seite">
  <h2>2. Ihre Angaben</h2>
  ${angabenTabelle(b)}
  ${b.contract.erstbeitrag.waehrung === 'DM' ? '<p class="sekundaer">DM-Beträge wurden mit dem amtlichen Kurs 1 € = 1,95583 DM umgerechnet.</p>' : ''}
  <div class="hinweisbox">
    <strong>Bitte prüfen Sie diese Angaben auf Richtigkeit.</strong> Die Schätzung ist nur so gut wie die
    Eingaben; Abweichungen (z. B. bei Beitragshöhe, Dynamik oder Auszahlungen) verändern das Ergebnis.
    ${dokumente.length > 0 ? `Für eine belastbarere Einordnung fehlen: ${dokumente.map((d) => esc(d)).join('; ')}.` : ''}
  </div>
</section>

<!-- Seite 4: Methodik -->
<section class="seite">
  <h2>3. Methodik und Annahmen</h2>
  <h3>Aufteilung Ihrer Beiträge (Basis-Szenario, Summe über die Laufzeit)</h3>
  ${svgBeitragsaufteilung(b.calc)}
  <p>
    Nutzungen werden – der Rechtsprechung folgend – nur auf den <strong>Sparanteil</strong> gerechnet
    (im Max-Szenario zusätzlich auf den Verwaltungskostenanteil als begründungsbedürftige Obergrenze).
    Jeder Monatsbeitrag wächst vom Zahlungsmonat bis zum Stichtag mit einem Zwölftel des Jahressatzes:
  </p>
  <p class="formel">Wert = Sparanteil × ∏ (1 + Jahreszins ÷ 12)</p>
  <h3>Die drei Szenarien</h3>
  ${liste([
    '<strong>Min:</strong> je Jahr der niedrigere Wert aus Nettoverzinsung und laufender Durchschnittsverzinsung; Risikoanteil am oberen Rand; keine Nutzungen auf Kostenanteile.',
    '<strong>Basis:</strong> Nettoverzinsung der Kapitalanlagen; Risikoanteil im Mittel; keine Nutzungen auf Kostenanteile.',
    '<strong>Max:</strong> Nettoverzinsung; Risikoanteil am unteren Rand; zusätzlich Nutzungen auf den Verwaltungskostenanteil – von Gerichten nur bei konkretem Nachweis zuerkannt, daher ausdrücklich Obergrenze.',
  ])}
  <h3>Annahmen und Vereinfachungen dieser Berechnung</h3>
  ${liste(b.calc.annahmen.map((a) => esc(a.text)))}
  ${b.calc.warnungen.length > 0 ? `<h3>Warnhinweise</h3>${liste(b.calc.warnungen.map((w) => esc(w.text)))}` : ''}
</section>

<!-- Seite 5: Jahrestabelle -->
<section class="seite">
  <h2>4. Jahresweise Aufschlüsselung</h2>
  ${jahrestabelle(b.calc)}
  <p class="fussnote">Herkunft „Branche" = Branchendurchschnitt (als Schätzung markiert); „Näherung" = letzter verfügbarer Branchenwert bei Datenlücke.</p>
</section>

<!-- Seite 6: Gesamtrechnung -->
<section class="seite">
  <h2>5. Gesamtrechnung</h2>
  <p>
    Rechenweg: <strong>Beiträge − Risikoanteil (inkl. BUZ) + Nutzungen = Rückabwicklungswert</strong>;
    abzüglich bereits erhaltener Leistungen samt Gegenverzinsung ergibt sich der geschätzte Nettoanspruch.
  </p>
  ${szenarienTabelle(b.calc)}
  <p class="sekundaer">
    Nutzungen im Basis-Szenario entsprechen ${formatProzent(basis.nutzungenProzentDerBeitraege)} der eingezahlten
    Beiträge – diese Kennzahl ist nur zusammen mit der daneben ausgewiesenen Zinsreihe aussagekräftig.
  </p>
  <p>
    <strong>Datenbasis der Nutzungen:</strong> ${formatProzent(basis.anteilUnternehmenswerteProzent)} der Nutzungen
    beruhen auf Kennzahlen des Versicherers (${formatEuro(basis.nutzungenNachHerkunft.insurer)}),
    ${formatProzent(basis.nutzungen > 0 ? Math.round((basis.nutzungenNachHerkunft.branche / basis.nutzungen) * 1000) / 10 : 0)}
    auf Branchendurchschnitten (${formatEuro(basis.nutzungenNachHerkunft.branche)}) und
    ${formatProzent(basis.nutzungen > 0 ? Math.round((basis.nutzungenNachHerkunft.fallback / basis.nutzungen) * 1000) / 10 : 0)}
    auf Näherungen für Jahre ohne Daten (${formatEuro(basis.nutzungenNachHerkunft.fallback)}).
    Je höher der Unternehmensanteil, desto belastbarer ist die Schätzung gegenüber dem Versicherer.
  </p>
  ${zinsreihenTabelle(b.calc)}
  <div class="hinweisbox">
    <strong>Gegenposition des Versicherers (typische Einwände):</strong> Nutzungen seien nur aus den konkreten
    Zahlen des jeweiligen Unternehmens herzuleiten – ein Branchendurchschnitt genüge der Darlegungslast nicht;
    die Nettoverzinsung enthalte Einmaleffekte (z. B. realisierte Bewertungsreserven ab 2012) und überzeichne
    die laufenden Erträge; Risiko- und Kostenanteile seien höher als pauschal angesetzt. Diese Einwände
    betreffen die Höhe, nicht das Ob der Methodik; sie sind der Grund, warum diese Kurzprüfung eine Schätzung
    mit Bandbreite ist und die anwaltliche Prüfung mit Unternehmenszahlen der nächste Schritt bleibt.
  </div>
</section>

<!-- Seite 7: Einordnung und nächste Schritte -->
<section class="seite">
  <h2>6. Einordnung und nächste Schritte</h2>
  ${svgSzenarioVergleich(b.calc, rkw)}
  ${
    keinVorteil
      ? '<div class="hinweisbox"><strong>Ergebnis:</strong> Nach dieser Schätzung ist wirtschaftlich kein Vorteil gegenüber dem aktuellen Rückkaufswert erkennbar. Ein Vorgehen „um jeden Preis" wäre nicht sachgerecht; besprechen Sie Alternativen mit Ihrer Beratung.</div>'
      : ''
  }
  <h3>Was bei einer Rückabwicklung aufgegeben würde</h3>
  ${liste([
    'der Versicherungsschutz des Vertrags (insbesondere Todesfallschutz, ggf. BUZ)',
    'Garantiezins und künftige Überschussbeteiligung bis zum Ablauf',
    'die vertragliche Ablaufleistung',
  ])}
  <h3>Hinweise</h3>
  ${liste([
    ...b.eligibility.hinweise.map((h) => `${esc(h.text)} <span class="fussnote">[${h.regelIds.join(', ')}]</span>`),
    'Steuern: Auszahlungen und eine Rückabwicklung können steuerliche Folgen haben; einbehaltene Kapitalertragsteuer ist anzurechnen. Dieser Bericht enthält keine steuerliche Beratung.',
  ])}
  <h3>Empfohlene nächste Schritte</h3>
  ${liste([
    dokumente.length > 0
      ? `Unterlagen vervollständigen: ${dokumente.map((d) => esc(d)).join('; ')}.`
      : 'Police, Begleitschreiben, Verbraucherinformationen und aktuelle Standmitteilung bereitlegen.',
    'Diesen Bericht einer auf Versicherungsrecht spezialisierten Kanzlei vorlegen; erst dort wird geklärt, ob ein Lösungsrecht besteht und durchsetzbar ist.',
    'Keine Kündigung und keine Erklärung gegenüber dem Versicherer ohne anwaltlichen Rat.',
  ])}
  <div class="disclaimer">
    <strong>Rechtlicher Hinweis:</strong> Diese Kurzprüfung ist eine strukturierte Berechnung und keine
    Rechtsdienstleistung im Sinne des RDG; die rechtliche Prüfung des Einzelfalls obliegt einem Rechtsanwalt.
    Alle Werte sind Schätzungen mit Bandbreite auf Basis der genannten Quellen und Annahmen; ein Anspruch in
    bestimmter Höhe wird nicht zugesagt. ${esc(ZITAT_QUELLENHINWEIS)}<br>
    Datenstand: insurers-Datenbank ${esc(b.calc.meta.dataVersion)} · Rechenkern ${esc(b.calc.meta.calcVersion)} ·
    Regelwerk ${esc(b.eligibility.meta.rulesVersion)} (${esc(b.eligibility.meta.rulesStand)}) ·
    Eignungs-Check ${esc(b.eligibility.meta.eligibilityVersion)} · Stichtag ${formatMonat(b.calc.meta.stichtag)}.
  </div>
</section>

</body>
</html>`;
}
