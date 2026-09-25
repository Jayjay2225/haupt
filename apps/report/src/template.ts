/**
 * HTML-Template des Prüfberichts (Prompt 5, umgebaut nach Prompt 12):
 * sieben Abschnitte/Seiten, de-DE-Formate, Design B (Nachtblau & Salbei,
 * Abschnitt 4.5), Diagramme als Inline-SVG, Schriften Base64-eingebettet
 * (kein Netzzugriff bei der Erzeugung).
 *
 * Die Berechnung folgt der Rückabwicklungsformel für alle Vertragsjahrgänge
 * gleich; welche rechtliche Grundlage im Einzelfall trägt, prüft der
 * Rechtsanwalt (Methodikabsatz, Abschnitt 1.4). Die Belehrungsbewertung
 * erscheint nur in der Kanzlei-Variante (belehrungsCheck).
 */
import type { CalcResult, ContractInput, Jahreszeile, JahresZins, SzenarioName } from '@rueckab/calc';
import type { EligibilityResult } from '@rueckab/eligibility';
import ansatzpunkteJson from '../../../config/ansatzpunkte.json';
import { esc, formatDatum, formatEuro, formatMonat, formatProzent, formatZahl } from './format';
import { MANROPE_WOFF2_BASE64, NEWSREADER_WOFF2_BASE64 } from './schriften';
import { ZITATE_METHODIK, ZITATE_REGIME_ALT, ZITAT_ANTRAGSMODELL, ZITAT_QUELLENHINWEIS } from './zitate';

export interface BerichtInput {
  marke: string;
  aktenzeichen: string;
  kundenname: string;
  /** ISO-Datum der Erstellung. */
  erstelltAm: string;
  versichererAnzeigename: string;
  contract: ContractInput;
  calc: CalcResult;
  eligibility: EligibilityResult;
  /** Kanzlei-Variante (Modell C): Belehrungsbewertung anzeigen. */
  belehrungsCheck?: boolean;
  /** Grün-Schwelle der wirtschaftlichen Ampel (Standard wie config/ampel.ts). */
  ampelSchwellen?: { mehrwertMinAbsolut: number };
}

/** Design B – Token (Prompt 12, Abschnitt 4.1/4.5). */
const FARBEN = {
  bg: '#F5F8F7',
  surface: '#FFFFFF',
  ink: '#17202A',
  muted: '#5B6772',
  brand: '#14365D',
  sage: '#7FAF9B',
  sageLight: '#E4EFEA',
  line: '#DDE4E6',
  cta: '#C24E2B',
  ampelGruen: '#1E8E4E',
  ampelGelb: '#D9A400',
  ampelRot: '#C62828',
  ampelAus: '#B9CCC3',
};

interface Ansatzpunkte {
  abJahr: number | null;
  punkte: string[];
}

const ANSATZPUNKTE = ansatzpunkteJson as unknown as Ansatzpunkte;

type AmpelFarbe = 'gruen' | 'gelb' | 'rot';

interface WirtschaftlicheAmpel {
  farbe: AmpelFarbe;
  label: string;
  punktFarbe: string;
}

/** Die eine, wirtschaftliche Ampel (Prompt 12, 1.3) – Basis-Szenario gegen den Vergleichsmaßstab. */
function wirtschaftlicheAmpel(calc: CalcResult, contract: ContractInput, schwelle: number): WirtschaftlicheAmpel {
  const basis = calc.szenarien.basis;
  const beendet = contract.status === 'gekuendigt' || contract.status === 'abgelaufen';
  const mehrwert = basis.mehrwertGegenKuendigung ?? (beendet ? basis.nettoanspruch : undefined);
  const vergleich = beendet ? 'dem bereits Erhaltenen' : 'dem Rückkaufswert';
  if (mehrwert === undefined) {
    return { farbe: 'gelb', label: 'Gelb – ohne Rückkaufswert kein Vergleich möglich', punktFarbe: FARBEN.ampelGelb };
  }
  if (mehrwert >= schwelle) {
    return { farbe: 'gruen', label: `Grün – rechnerisch deutlich mehr drin als ${vergleich}`, punktFarbe: FARBEN.ampelGruen };
  }
  if (mehrwert > 0) {
    return { farbe: 'gelb', label: `Gelb – knapp über ${vergleich}`, punktFarbe: FARBEN.ampelGelb };
  }
  return { farbe: 'rot', label: `Rot – rechnerisch nicht mehr drin als ${vergleich}`, punktFarbe: FARBEN.ampelRot };
}

function svgBeitragsaufteilung(calc: CalcResult): string {
  const basis = calc.szenarien.basis;
  const teile = [
    { label: 'Sparanteil', wert: basis.summeSparanteil, farbe: FARBEN.brand },
    { label: 'Risikoanteil (inkl. BUZ)', wert: basis.summeRisiko + basis.summeBuz, farbe: FARBEN.cta },
    { label: 'Abschlusskosten', wert: basis.summeAbschluss, farbe: FARBEN.muted },
    { label: 'Verwaltungskosten', wert: basis.summeVerwaltung, farbe: FARBEN.sage },
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

/**
 * Szenario-Vergleich (4.5): Rückkaufswert in Grau (muted), Szenarien in
 * Brand/Salbei, „Mehrwert gegenüber Rückkaufswert“ (Basis) in CTA-Orange.
 */
function svgSzenarioVergleich(calc: CalcResult, rueckkaufswert: number | undefined): string {
  const reihen: { label: string; wert: number; farbe: string }[] = [];
  if (rueckkaufswert !== undefined) {
    reihen.push({ label: 'Aktueller Rückkaufswert', wert: rueckkaufswert, farbe: FARBEN.muted });
  }
  for (const name of ['min', 'basis', 'max'] as SzenarioName[]) {
    const bezeichnung =
      name === 'min' ? 'Szenario konservativ' : name === 'max' ? 'Szenario maximal' : 'Szenario Basis';
    reihen.push({
      label: bezeichnung,
      wert: calc.szenarien[name].rueckabwicklungswert,
      farbe: name === 'basis' ? FARBEN.brand : FARBEN.sage,
    });
  }
  const mehrwert = calc.szenarien.basis.mehrwertGegenKuendigung;
  if (mehrwert !== undefined && mehrwert > 0) {
    reihen.push({ label: 'Mehrwert ggü. Rückkaufswert (Basis)', wert: mehrwert, farbe: FARBEN.cta });
  }
  const max = Math.max(...reihen.map((r) => r.wert), 1);
  const breite = 660;
  const balkenMax = 380;
  const zeilenhoehe = 34;
  const balken = reihen
    .map((r, i) => {
      const w = Math.max(2, (r.wert / max) * balkenMax);
      const y = i * zeilenhoehe;
      return `
        <text x="0" y="${y + 21}" class="svg-label">${esc(r.label)}</text>
        <rect x="210" y="${y + 6}" width="${w.toFixed(1)}" height="20" rx="4" fill="${r.farbe}" />
        <text x="${(216 + w).toFixed(1)}" y="${y + 21}" class="svg-wert">${formatEuro(r.wert)}</text>`;
    })
    .join('');
  return `
    <figure class="diagramm" role="img" aria-label="Vergleich von Rückkaufswert und geschätztem Rückabwicklungswert in den drei Szenarien">
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

function jahrestabelle(calc: CalcResult): string {
  const kopf = ['Jahr', 'Beiträge', 'Risiko (inkl. BUZ)', 'Abschluss', 'Verwaltung', 'Sparanteil', 'Zinssatz', 'Quelle', 'Nutzungen', 'Stand kumuliert'];
  const herkunft: Record<string, string> = {
    insurer: 'Versicherer',
    branche: 'Branche',
    fallback: 'Näherung',
    override: 'Vorgabe',
  };
  const zeilen = calc.jahrestabelle
    .map(
      (z: Jahreszeile) => `<tr>
        <th scope="row">${z.jahr}</th>
        <td class="betrag">${formatZahl(z.beitraege)}</td>
        <td class="betrag">${formatZahl(z.risiko + z.buz)}</td>
        <td class="betrag">${formatZahl(z.abschluss)}</td>
        <td class="betrag">${formatZahl(z.verwaltung)}</td>
        <td class="betrag">${formatZahl(z.sparanteil)}</td>
        <td class="betrag">${formatZahl(z.zinssatzProzent)} %</td>
        <td>${herkunft[z.zinsherkunft] ?? z.zinsherkunft}</td>
        <td class="betrag">${formatZahl(z.nutzungenImJahr)}</td>
        <td class="betrag">${formatZahl(z.kumulierterWert)}</td>
      </tr>`,
    )
    .join('');
  return `<table class="tabelle klein zebra">
    <caption>Jahresweise Aufschlüsselung (Basis-Szenario, Beträge in Euro)</caption>
    <thead><tr>${kopf.map((k) => `<th scope="col">${k}</th>`).join('')}</tr></thead>
    <tbody>${zeilen}</tbody>
  </table>`;
}

function szenarienTabelle(calc: CalcResult): string {
  const namen: [SzenarioName, string][] = [
    ['min', 'Konservativ'],
    ['basis', 'Basis'],
    ['max', 'Maximal (Obergrenze)'],
  ];
  const zeilen = namen
    .map(([name, label]) => {
      const s = calc.szenarien[name];
      return `<tr>
        <th scope="row">${label}</th>
        <td class="betrag">${formatEuro(s.erstattungsfaehigeBeitraege)}</td>
        <td class="betrag">${formatEuro(s.nutzungen)}</td>
        <td class="betrag">${formatEuro(s.rueckabwicklungswert)}</td>
        <td class="betrag">${formatEuro(s.erhalteneLeistungenAufgezinst)}</td>
        <td class="betrag">${formatEuro(s.nettoanspruch)}</td>
        <td class="betrag">${s.mehrwertGegenKuendigung !== undefined ? formatEuro(s.mehrwertGegenKuendigung) : '–'}</td>
      </tr>`;
    })
    .join('');
  return `<table class="tabelle zebra">
    <caption>Gesamtrechnung in allen drei Szenarien</caption>
    <thead><tr>
      <th scope="col">Szenario</th><th scope="col">Erstattungsfähige Beiträge</th><th scope="col">Nutzungen</th>
      <th scope="col">Rückabwicklungswert</th><th scope="col">./. erhaltene Leistungen (aufgezinst)</th>
      <th scope="col">Netto-Wert (geschätzt)</th><th scope="col">Mehrwert ggü. Rückkaufswert</th>
    </tr></thead>
    <tbody>${zeilen}</tbody>
  </table>`;
}

function zinsreihenTabelle(calc: CalcResult): string {
  const eintraege = calc.szenarien.basis.zinsreihe
    .map((j: JahresZins) => {
      const quelle =
        j.herkunft === 'insurer'
          ? 'Versicherer'
          : j.herkunft === 'branche'
            ? (j.quelle?.titel ?? 'Branchendurchschnitt')
            : j.herkunft === 'override'
              ? 'Vorgabe'
              : 'Näherung (nächstliegender Branchenwert)';
      const kennzeichen = j.kennzeichen === 'estimated_branch' ? ' *' : '';
      return `<tr><th scope="row">${j.jahr}</th><td class="betrag">${formatZahl(j.satzProzent)} %</td><td>${esc(quelle)}${kennzeichen}</td></tr>`;
    })
    .join('');
  return `<div class="spalten"><table class="tabelle klein zebra">
    <caption>Verwendete Zinsreihe (Basis-Szenario) mit Quelle je Jahr</caption>
    <thead><tr><th scope="col">Jahr</th><th scope="col">Satz</th><th scope="col">Quelle</th></tr></thead>
    <tbody>${eintraege}</tbody>
  </table></div>
  <p class="fussnote">* = Branchen- oder Näherungswert statt Unternehmenswert (Datenkennzeichen „estimated_branch“, Schätzung).</p>`;
}

function liste(punkte: string[]): string {
  return `<ul>${punkte.map((p) => `<li>${p}</li>`).join('')}</ul>`;
}

/** Methodikabsatz (Prompt 12, Abschnitt 1.4) – Wortlaut der Vorgabe. */
const METHODIK_ABSATZ =
  'Die Berechnung folgt der Rückabwicklungsformel: eingezahlte Beiträge abzüglich Risikoanteil, zuzüglich der Nutzungen, die der Versicherer aus den Beiträgen gezogen hat. Sie wird für alle Vertragsjahrgänge gleich angewendet. Welche rechtliche Grundlage im Einzelfall trägt (Widerspruch, Widerruf, Rücktritt, unwirksame Klauseln, Nachforderung beim Rückkaufswert oder anderes), prüft der Rechtsanwalt anhand der Vertragsunterlagen. Dieser Bericht ersetzt diese Prüfung nicht. Die meisten Verfahren enden durch Vergleich; das Ergebnis ist eine Verhandlungsbasis mit Bandbreite.';

function ansatzpunkteKasten(): string {
  if (ANSATZPUNKTE.punkte.length === 0) {
    return '';
  }
  const titel =
    ANSATZPUNKTE.abJahr !== null
      ? `Typische Ansatzpunkte für Verträge ab ${ANSATZPUNKTE.abJahr}`
      : 'Typische Ansatzpunkte';
  return `<div class="hinweisbox"><strong>${esc(titel)}:</strong>${liste(ANSATZPUNKTE.punkte.map((p) => esc(p)))}</div>`;
}

export function renderBerichtHtml(b: BerichtInput): string {
  const basis = b.calc.szenarien.basis;
  const min = b.calc.szenarien.min;
  const max = b.calc.szenarien.max;
  const rkw = b.contract.rueckkaufswert?.betrag;
  const belehrungsCheck = b.belehrungsCheck === true;
  const schwelle = b.ampelSchwellen?.mehrwertMinAbsolut ?? 2000;
  const ampel = wirtschaftlicheAmpel(b.calc, b.contract, schwelle);
  const keinVorteil = basis.wirtschaftlichKeinVorteil === true;
  const regimeB = b.eligibility.regime === 'alt-antragsmodell';
  const zitate = belehrungsCheck
    ? regimeB
      ? [...ZITATE_REGIME_ALT.slice(0, 2), ZITAT_ANTRAGSMODELL]
      : ZITATE_REGIME_ALT
    : ZITATE_METHODIK;

  const mehrwertSatz =
    basis.mehrwertGegenKuendigung === undefined
      ? 'Ein Vergleich mit dem Rückkaufswert war mangels Angabe nicht möglich; bei beendeten Verträgen zählt der Netto-Wert über das bereits Erhaltene hinaus.'
      : keinVorteil
        ? `Nach dieser Schätzung ist gegenüber dem aktuellen Rückkaufswert <strong>rechnerisch kein Vorteil erkennbar</strong> (Basis-Szenario: ${formatEuro(basis.mehrwertGegenKuendigung)}).`
        : `Gegenüber dem aktuellen Rückkaufswert ergäbe sich im Basis-Szenario ein geschätzter Mehrwert von <strong>${formatEuro(basis.mehrwertGegenKuendigung)}</strong> – unter den auf Seite 4 genannten Annahmen.`;

  const dokumente = b.eligibility.benoetigteDokumente;

  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>Prüfbericht ${esc(b.aktenzeichen)}</title>
<style>
  @font-face {
    font-family: 'Newsreader';
    font-style: normal;
    font-weight: 200 800;
    src: url(data:font/woff2;base64,${NEWSREADER_WOFF2_BASE64}) format('woff2');
  }
  @font-face {
    font-family: 'Manrope';
    font-style: normal;
    font-weight: 200 800;
    src: url(data:font/woff2;base64,${MANROPE_WOFF2_BASE64}) format('woff2');
  }
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: 'Manrope', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.5;
    color: ${FARBEN.ink};
  }
  .seite { page-break-after: always; }
  .seite:last-child { page-break-after: auto; }
  h1, h2, h3 { font-family: 'Newsreader', Georgia, serif; font-weight: 600; color: ${FARBEN.brand}; }
  h1 { font-size: 21pt; margin: 0 0 4mm; line-height: 1.2; }
  h2 { font-size: 14pt; margin: 0 0 3mm; border-bottom: 1.5pt solid ${FARBEN.line}; padding-bottom: 1.5mm; }
  h3 { font-size: 11.5pt; margin: 4mm 0 1.5mm; }
  p { margin: 0 0 2.5mm; }
  .sekundaer { color: ${FARBEN.muted}; }
  .kopfbalken {
    background: ${FARBEN.brand};
    color: #ffffff;
    border-radius: 2mm;
    padding: 3mm 5mm;
    margin: 0 0 5mm;
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }
  .kopfbalken .marke { font-family: 'Newsreader', Georgia, serif; font-weight: 600; font-size: 14pt; }
  .kopfbalken .zusatz { font-size: 9pt; color: #dbe4ee; }
  .meta-box { border: 1pt solid ${FARBEN.line}; border-radius: 3mm; padding: 3mm 4mm; margin: 4mm 0; display: grid; grid-template-columns: 1fr 1fr; gap: 1mm 6mm; font-size: 9.5pt; }
  .hero { background: ${FARBEN.bg}; border-radius: 3mm; padding: 5mm; margin: 5mm 0; }
  .hero .zahl { font-family: 'Newsreader', Georgia, serif; font-size: 26pt; font-weight: 600; font-variant-numeric: tabular-nums; }
  .hero .spanne { color: ${FARBEN.muted}; margin-top: 1mm; }
  .ampel { display: inline-flex; align-items: center; gap: 2.5mm; background: ${FARBEN.sageLight}; border-radius: 10mm; padding: 2mm 4.5mm; font-weight: 600; margin-top: 3mm; }
  .ampel .punkt { width: 3.5mm; height: 3.5mm; border-radius: 50%; display: inline-block; background: ${FARBEN.ampelAus}; }
  .hinweisbox { background: ${FARBEN.sageLight}; border-radius: 2mm; padding: 3mm 4mm; margin: 3mm 0; }
  .gegenposition { background: ${FARBEN.surface}; border: 1pt solid ${FARBEN.line}; border-radius: 2mm; padding: 3mm 4mm; margin: 3mm 0; }
  .tabelle { width: 100%; border-collapse: collapse; margin: 3mm 0; font-size: 9.5pt; }
  .tabelle caption { text-align: left; font-weight: 700; margin-bottom: 1.5mm; }
  .tabelle th, .tabelle td { border-bottom: 0.5pt solid ${FARBEN.line}; padding: 1.4mm 2mm; text-align: left; vertical-align: top; }
  .tabelle thead th { background: ${FARBEN.brand}; color: #ffffff; font-size: 8.5pt; border-bottom: none; }
  .tabelle thead th:first-child { border-radius: 1mm 0 0 0; }
  .tabelle thead th:last-child { border-radius: 0 1mm 0 0; }
  .tabelle.zebra tbody tr:nth-child(even) td, .tabelle.zebra tbody tr:nth-child(even) th { background: ${FARBEN.bg}; }
  .tabelle tbody th { font-weight: 600; color: ${FARBEN.muted}; }
  .tabelle:not(.klein) tbody th[scope='row'] { width: 34%; }
  .tabelle.klein { font-size: 8pt; }
  .tabelle.klein td, .tabelle.klein th { padding: 1mm 1.5mm; }
  .tabelle td.betrag { text-align: right; font-variant-numeric: tabular-nums; }
  .diagramm { margin: 4mm 0; }
  .legende { display: flex; flex-wrap: wrap; gap: 2mm 6mm; font-size: 8.5pt; margin-top: 2mm; color: ${FARBEN.ink}; }
  .legende-farbe { width: 3mm; height: 3mm; display: inline-block; border-radius: 0.8mm; margin-right: 1.5mm; }
  .svg-label { font-size: 12px; fill: ${FARBEN.ink}; font-family: 'Manrope', sans-serif; }
  .svg-wert { font-size: 12px; font-weight: 600; fill: ${FARBEN.ink}; font-family: 'Manrope', sans-serif; }
  .zitat { border-left: 1.5pt solid ${FARBEN.sage}; padding-left: 4mm; margin: 3mm 0; }
  .zitat .quelle { font-weight: 700; }
  .formel { font-family: ui-monospace, 'Cascadia Mono', Consolas, monospace; background: ${FARBEN.bg}; padding: 2mm 3mm; border-radius: 1.5mm; display: inline-block; font-size: 9.5pt; }
  .spalten { column-count: 2; column-gap: 8mm; }
  .spalten .tabelle { break-inside: avoid-column; }
  ul { margin: 0 0 2.5mm; padding-left: 5mm; }
  li { margin-bottom: 1mm; }
  .fussnote { font-size: 8pt; color: ${FARBEN.muted}; }
  .disclaimer { border: 1pt solid ${FARBEN.line}; border-radius: 2mm; padding: 3mm 4mm; font-size: 8.5pt; color: ${FARBEN.muted}; }
</style>
</head>
<body>

<!-- Seite 1: Deckblatt -->
<section class="seite">
  <div class="kopfbalken"><span class="marke">${esc(b.marke)}</span><span class="zusatz">Prüfbericht · Schätzung mit Bandbreite</span></div>
  <h1>Prüfbericht zu Ihrer ${b.contract.vertragsart === 'private-rv' || b.contract.vertragsart === 'fonds-rv' ? 'Rentenversicherung' : 'Lebensversicherung'}</h1>
  <div class="meta-box">
    <span><strong>Bestellnummer:</strong> ${esc(b.aktenzeichen)}</span>
    <span><strong>Erstellt am:</strong> ${formatDatum(b.erstelltAm)}</span>
    <span><strong>Für:</strong> ${esc(b.kundenname)}</span>
    <span><strong>Versicherer:</strong> ${esc(b.versichererAnzeigename)}</span>
  </div>
  <div class="hero">
    <p class="sekundaer" style="margin:0">Geschätzter Rückabwicklungswert (Basis-Szenario)</p>
    <p class="zahl">${formatEuro(basis.rueckabwicklungswert)}</p>
    <p class="spanne">Spanne der Szenarien konservativ–maximal: ${formatEuro(min.rueckabwicklungswert)} bis ${formatEuro(max.rueckabwicklungswert)}</p>
    ${rkw !== undefined ? `<p class="spanne">Zum Vergleich – aktueller Rückkaufswert: <strong>${formatEuro(rkw)}</strong></p>` : ''}
  </div>
  <p>${mehrwertSatz}</p>
  <p class="ampel"><span class="punkt" style="background:${ampel.punktFarbe}"></span> ${esc(ampel.label)}</p>
  <div class="hinweisbox">
    <strong>Wichtig:</strong> Alle Werte sind Schätzungen unter offengelegten Annahmen (Seite 4) auf Basis öffentlich
    verfügbarer Kennzahlen – es wird kein Betrag zugesagt und keine Rechtsberatung im Einzelfall erteilt. Ob und auf
    welchem Weg sich das durchsetzen lässt, prüft Ihr Anwalt mit diesem Bericht in der Hand.
  </div>
</section>

<!-- Seite 2: Grundlage und Methodik -->
<section class="seite">
  <h2>1. Grundlage und Methodik</h2>
  <p>${METHODIK_ABSATZ}</p>
  ${ansatzpunkteKasten()}
  ${
    belehrungsCheck
      ? `<h3>Einordnung Ihres Vertrags (Eignungs-Check)</h3>
  ${liste(b.eligibility.begruendungen.map((x) => `${esc(x.text)} <span class="fussnote">[${x.regelIds.join(', ')}]</span>`))}`
      : ''
  }
  <h3>Rechtsprechung zur Rechenformel</h3>
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
      'eine Rechen- und Verhandlungsgrundlage für Anwalt und Rechtsschutzversicherung',
    ])}</div>
    <div>${liste([
      'keine Rechtsberatung im Einzelfall und keine Vertretung',
      'keine Zusage eines Betrags oder Erfolgs',
      'keine steuerliche Beratung; keine Empfehlung, zu kündigen, zu verkaufen oder zu behalten',
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

<!-- Seite 4: Methodik im Detail -->
<section class="seite">
  <h2>3. Rechenweg und Annahmen</h2>
  <h3>Aufteilung Ihrer Beiträge (Basis-Szenario, Summe über die Laufzeit)</h3>
  ${svgBeitragsaufteilung(b.calc)}
  <p>
    Nutzungen werden – der Rechtsprechung folgend – nur auf den <strong>Sparanteil</strong> gerechnet
    (im Maximal-Szenario zusätzlich auf den Verwaltungskostenanteil als begründungsbedürftige Obergrenze).
    Jeder Monatsbeitrag wächst vom Zahlungsmonat bis zum Stichtag mit einem Zwölftel des Jahressatzes:
  </p>
  <p class="formel">Wert = Sparanteil × ∏ (1 + Jahreszins ÷ 12)</p>
  <h3>Die drei Szenarien</h3>
  ${liste([
    '<strong>Konservativ:</strong> je Jahr der niedrigere Wert aus Nettoverzinsung und laufender Durchschnittsverzinsung; Risikoanteil am oberen Rand; keine Nutzungen auf Kostenanteile.',
    '<strong>Basis:</strong> Nettoverzinsung der Kapitalanlagen; Risikoanteil im Mittel; keine Nutzungen auf Kostenanteile.',
    '<strong>Maximal:</strong> Nettoverzinsung; Risikoanteil am unteren Rand; zusätzlich Nutzungen auf den Verwaltungskostenanteil – von Gerichten nur bei konkretem Nachweis zuerkannt, daher ausdrücklich Obergrenze.',
  ])}
  <h3>Annahmen und Vereinfachungen dieser Berechnung</h3>
  ${liste(b.calc.annahmen.map((a) => esc(a.text)))}
  ${b.calc.warnungen.length > 0 ? `<h3>Warnhinweise</h3>${liste(b.calc.warnungen.map((w) => esc(w.text)))}` : ''}
</section>

<!-- Seite 5: Jahrestabelle -->
<section class="seite">
  <h2>4. Jahresweise Aufschlüsselung</h2>
  ${jahrestabelle(b.calc)}
  <p class="fussnote">Herkunft „Branche“ = Branchendurchschnitt (Datenkennzeichen „estimated_branch“, Schätzung); „Näherung“ = nächstliegender Branchenwert bei Datenlücke.</p>
</section>

<!-- Seite 6: Gesamtrechnung -->
<section class="seite">
  <h2>5. Gesamtrechnung</h2>
  <p>
    Rechenweg: <strong>Beiträge − Risikoanteil (inkl. BUZ) + Nutzungen = Rückabwicklungswert</strong>;
    abzüglich bereits erhaltener Leistungen samt Gegenverzinsung ergibt sich der geschätzte Netto-Wert.
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
  <div class="gegenposition">
    <strong>Gegenposition des Versicherers (typische Einwände):</strong> Nutzungen seien nur aus den konkreten
    Zahlen des jeweiligen Unternehmens herzuleiten – ein Branchendurchschnitt genüge der Darlegungslast nicht;
    die Nettoverzinsung enthalte Einmaleffekte (z. B. realisierte Bewertungsreserven ab 2012) und überzeichne
    die laufenden Erträge; Risiko- und Kostenanteile seien höher als pauschal angesetzt. Diese Einwände
    betreffen die Höhe, nicht das Ob der Methodik; sie sind der Grund, warum dieser Prüfbericht eine Schätzung
    mit Bandbreite ist und die anwaltliche Prüfung mit Unternehmenszahlen der nächste Schritt bleibt.
  </div>
</section>

<!-- Seite 7: Einordnung und nächste Schritte -->
<section class="seite">
  <h2>6. Einordnung und nächste Schritte</h2>
  ${svgSzenarioVergleich(b.calc, rkw)}
  ${
    keinVorteil
      ? '<div class="hinweisbox"><strong>Ergebnis:</strong> Nach dieser Schätzung ist rechnerisch kein Vorteil gegenüber dem aktuellen Rückkaufswert erkennbar. Ein Vorgehen „um jeden Preis“ wäre nicht sachgerecht; besprechen Sie Alternativen mit Ihrer Beratung.</div>'
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
    'Diesen Bericht einer auf Versicherungsrecht spezialisierten Kanzlei vorlegen; erst dort wird geklärt, ob und auf welchem Weg sich der Wert durchsetzen lässt.',
    'Keine Kündigung und keine Erklärung gegenüber dem Versicherer ohne anwaltlichen Rat.',
  ])}
  <div class="disclaimer">
    <strong>Rechtlicher Hinweis:</strong> Dieser Prüfbericht ist eine strukturierte Berechnung und keine
    Rechtsdienstleistung im Sinne des RDG; die rechtliche Prüfung des Einzelfalls obliegt einem Rechtsanwalt.
    Alle Werte sind Schätzungen mit Bandbreite auf Basis der genannten Quellen und Annahmen; es wird kein Betrag
    zugesagt. ${esc(ZITAT_QUELLENHINWEIS)}<br>
    Datenstand: insurers-Datenbank ${esc(b.calc.meta.dataVersion)} · Rechenkern ${esc(b.calc.meta.calcVersion)} ·
    Regelwerk ${esc(b.eligibility.meta.rulesVersion)} (${esc(b.eligibility.meta.rulesStand)}) ·
    Eignungs-Check ${esc(b.eligibility.meta.eligibilityVersion)} · Stichtag ${formatMonat(b.calc.meta.stichtag)}.
  </div>
</section>

</body>
</html>`;
}
