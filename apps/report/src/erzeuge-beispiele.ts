/**
 * Erzeugt die Beispiel-Gutachten für die Golden-Verträge (docs/PROMPTS.md,
 * Prompt 3/5) unter examples/ – seit Prompt 14 als „Gutachten“, dazu für
 * Musterfall B die Druckvorlage des Postversands (Deckblatt + Beileger).
 *
 * Datenschutz: Es werden ausschließlich anonymisierte Musterdaten verwendet;
 * geloggt werden nur Aktenzeichen und Dateipfade, keine Personendaten.
 */
import { mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { berechneRueckabwicklung } from '@rueckab/calc';
import type { ContractInput, InsurersDaten, RiskDefaults } from '@rueckab/calc';
import { pruefeEignung } from '@rueckab/eligibility';
import type { EligibilityInput, Regelwerk } from '@rueckab/eligibility';
import { renderBerichtHtml, renderDruckvorlageHtml, type BerichtInput } from './template';
import { htmlZuPdf } from './pdf';
import { formatDatum } from './format';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const HEUTE = '2026-09-28';

const daten = JSON.parse(readFileSync(resolve(REPO, 'data/insurers.json'), 'utf8')) as InsurersDaten;
const defaults = JSON.parse(readFileSync(resolve(REPO, 'data/risk-defaults.json'), 'utf8')) as RiskDefaults;
const regelwerk = JSON.parse(readFileSync(resolve(REPO, 'data/legal-rules.json'), 'utf8')) as Regelwerk;

interface Beispiel {
  aktenzeichen: string;
  kundenname: string;
  versichererAnzeigename: string;
  contract: ContractInput;
  eligibility: EligibilityInput;
  /** Annahmen aus „Weiß ich nicht“-Antworten (Prompt 14) – nur zur Illustration. */
  annahmenKunde?: string[];
  /** Druckvorlage (Postversand) mit Musteradresse erzeugen. */
  druck?: boolean;
}

const beispiele: Beispiel[] = [
  {
    aktenzeichen: 'BSP-2026-A',
    kundenname: 'Musterfall A (anonymisiert)',
    versichererAnzeigename: 'nicht benannt (Branchendurchschnitt)',
    contract: {
      versichererId: 'unbekannt',
      vertragsart: 'private-rv',
      beginn: '2004-12',
      zahlweise: 'jaehrlich',
      erstbeitrag: { betrag: 1200, waehrung: 'EUR' },
      dynamik: { aktiv: false },
      gesamtsummeLautMitteilung: 25600,
      status: 'laufend',
      rueckkaufswert: { betrag: 39857 },
      eintrittsalter: 40,
      stichtag: '2026-09',
    },
    eligibility: {
      vertragsschluss: '2004-12',
      vertragsart: 'private-rv',
      zustandekommen: 'policenmodell',
      belehrungVorhanden: 'unbekannt',
      belehrungFrist: 'unbekannt',
      belehrungForm: 'unbekannt',
      hervorhebung: 'unbekannt',
      status: 'laufend',
      abgetretenOderBeliehen: 'nein',
      auszahlungenErhalten: 'nein',
    },
  },
  {
    aktenzeichen: 'BSP-2026-B',
    kundenname: 'Musterfall B (anonymisiert)',
    versichererAnzeigename: 'Allianz Lebensversicherungs-AG',
    contract: {
      versichererId: 'allianz-leben',
      vertragsart: 'kapital-lv',
      beginn: '1995-10',
      zahlweise: 'monatlich',
      erstbeitrag: { betrag: 1000, waehrung: 'DM' },
      dynamik: { aktiv: true, satzProzent: 5 },
      gesamtsummeLautMitteilung: 439455,
      status: 'laufend',
      rueckkaufswert: { betrag: 310658 },
      eintrittsalter: 35,
      stichtag: '2026-09',
    },
    eligibility: {
      vertragsschluss: '1995-10-01',
      vertragsart: 'kapital-lv',
      zustandekommen: 'policenmodell',
      belehrungVorhanden: 'ja',
      belehrungFrist: '14-tage',
      belehrungForm: 'schriftform',
      hervorhebung: 'nein',
      status: 'laufend',
      abgetretenOderBeliehen: 'nein',
      auszahlungenErhalten: 'nein',
    },
    druck: true,
  },
  // Prompt 12, Abschnitt 1.6: Vertrag von 1986 (150 DM monatlich, ohne
  // Dynamik) läuft mit derselben Formel durch; Branchenjahre bis 2003 sind
  // als estimated_branch gekennzeichnet. Prompt 14: mit Annahmen-Kasten.
  {
    aktenzeichen: 'BSP-2026-C',
    kundenname: 'Musterfall C (anonymisiert)',
    versichererAnzeigename: 'nicht benannt (Branchendurchschnitt)',
    contract: {
      versichererId: 'unbekannt',
      vertragsart: 'kapital-lv',
      beginn: '1986-06',
      zahlweise: 'monatlich',
      erstbeitrag: { betrag: 150, waehrung: 'DM' },
      dynamik: { aktiv: false },
      status: 'laufend',
      rueckkaufswert: { betrag: 32000 },
      eintrittsalter: 30,
      stichtag: '2026-09',
    },
    eligibility: {
      vertragsschluss: '1986-06',
      vertragsart: 'kapital-lv',
      zustandekommen: 'unbekannt',
      belehrungVorhanden: 'unbekannt',
      belehrungFrist: 'unbekannt',
      belehrungForm: 'unbekannt',
      hervorhebung: 'unbekannt',
      status: 'laufend',
      abgetretenOderBeliehen: 'nein',
      auszahlungenErhalten: 'nein',
    },
    annahmenKunde: [
      'Annahme: Der Vertragsbeginn ist nur ungefähr bekannt (Jahr 1986); gerechnet wurde mit der Jahresmitte. Mit dem genauen Monat aus der Police wird die Zahl präziser.',
      'Annahme: Ob eine Dynamik vereinbart war, ist nicht bekannt; gerechnet wurde ohne Dynamik. Mit Dynamik läge die Zahl höher – bitte in Police oder Nachträgen nachsehen.',
    ],
  },
];

const ausgabe = resolve(REPO, 'examples');
mkdirSync(ausgabe, { recursive: true });
// Alte Beispiele (frühere Daten/Namen) entfernen – es gilt immer der aktuelle Stand.
for (const datei of readdirSync(ausgabe)) {
  if (/^(Pruefbericht|Gutachten)_BSP-2026-/.test(datei)) {
    unlinkSync(resolve(ausgabe, datei));
  }
}

for (const beispiel of beispiele) {
  const calc = berechneRueckabwicklung(beispiel.contract, daten, defaults);
  const eligibility = pruefeEignung(beispiel.eligibility, regelwerk);
  const bericht: BerichtInput = {
    marke: 'Renten-Rettung',
    aktenzeichen: beispiel.aktenzeichen,
    kundenname: beispiel.kundenname,
    erstelltAm: HEUTE,
    versichererAnzeigename: beispiel.versichererAnzeigename,
    contract: beispiel.contract,
    calc,
    eligibility,
    durchsetzungUrl: 'https://renten-rettung.de/durchsetzung',
    verkaufenUrl: 'renten-rettung.de/verkaufen',
    konditionenText: '[[KONDITIONEN: Erfolgsbeteiligung, Kostenübernahme]]',
    absender: 'Renten-Rettung · Kaufmannsladen Gebhard GmbH · Helmkrautstraße 35 A · 13503 Berlin',
    ...(beispiel.annahmenKunde !== undefined ? { annahmenKunde: beispiel.annahmenKunde } : {}),
  };
  const kopf = {
    marke: 'Renten-Rettung',
    aktenzeichen: beispiel.aktenzeichen,
    kundenname: beispiel.kundenname,
    datum: formatDatum(HEUTE),
  };
  const html = renderBerichtHtml(bericht);
  const basisname = `Gutachten_${beispiel.aktenzeichen}_${HEUTE}`;
  writeFileSync(resolve(ausgabe, `${basisname}.html`), html);
  await htmlZuPdf(html, resolve(ausgabe, `${basisname}.pdf`), kopf);
  const mehrwert = calc.szenarien.basis.mehrwertGegenKuendigung;
  console.log(
    `erzeugt: examples/${basisname}.pdf (Basis ${calc.szenarien.basis.rueckabwicklungswert.toFixed(2)} €, Mehrwert ${mehrwert === undefined ? '–' : mehrwert.toFixed(2)} €)`,
  );
  if (beispiel.druck === true) {
    const druckHtml = renderDruckvorlageHtml(bericht, {
      name: beispiel.kundenname,
      strasse: 'Musterstraße 1',
      plz: '12345',
      ort: 'Musterstadt',
    });
    writeFileSync(resolve(ausgabe, `${basisname}_Druck.html`), druckHtml);
    await htmlZuPdf(druckHtml, resolve(ausgabe, `${basisname}_Druck.pdf`), kopf);
    console.log(`erzeugt: examples/${basisname}_Druck.pdf (Druckvorlage: Deckblatt, Gutachten, Beileger)`);
  }
}
