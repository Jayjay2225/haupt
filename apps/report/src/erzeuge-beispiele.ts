/**
 * Erzeugt die Beispielberichte für die beiden Golden-Verträge
 * (docs/PROMPTS.md, Prompt 3/5) unter examples/.
 *
 * Datenschutz: Es werden ausschließlich anonymisierte Musterdaten verwendet;
 * geloggt werden nur Aktenzeichen und Dateipfade, keine Personendaten.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { berechneRueckabwicklung } from '@rueckab/calc';
import type { CalcResultAlt, ContractInput, InsurersDaten, RiskDefaults } from '@rueckab/calc';
import { pruefeEignung } from '@rueckab/eligibility';
import type { EligibilityInput, Regelwerk } from '@rueckab/eligibility';
import { renderBerichtHtml, type BerichtInput } from './template';
import { htmlZuPdf } from './pdf';
import { formatDatum } from './format';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const HEUTE = '2026-09-18';

const daten = JSON.parse(readFileSync(resolve(REPO, 'data/insurers.json'), 'utf8')) as InsurersDaten;
const defaults = JSON.parse(readFileSync(resolve(REPO, 'data/risk-defaults.json'), 'utf8')) as RiskDefaults;
const regelwerk = JSON.parse(readFileSync(resolve(REPO, 'data/legal-rules.json'), 'utf8')) as Regelwerk;

interface Beispiel {
  aktenzeichen: string;
  kundenname: string;
  versichererAnzeigename: string;
  contract: ContractInput;
  eligibility: EligibilityInput;
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
    versichererAnzeigename: 'Allianz Lebensversicherungs-AG (Kennzahlen: Branchendurchschnitt)',
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
  },
];

const ausgabe = resolve(REPO, 'examples');
mkdirSync(ausgabe, { recursive: true });

for (const beispiel of beispiele) {
  const calc = berechneRueckabwicklung(beispiel.contract, daten, defaults);
  if (calc.regime !== 'alt-policenmodell') {
    throw new Error(`${beispiel.aktenzeichen}: unerwartetes Regime ${calc.regime}`);
  }
  const eligibility = pruefeEignung(beispiel.eligibility, regelwerk);
  const bericht: BerichtInput = {
    marke: '[MARKE]',
    aktenzeichen: beispiel.aktenzeichen,
    kundenname: beispiel.kundenname,
    erstelltAm: HEUTE,
    versichererAnzeigename: beispiel.versichererAnzeigename,
    contract: beispiel.contract,
    calc: calc as CalcResultAlt,
    eligibility,
  };
  const html = renderBerichtHtml(bericht);
  const basisname = `Kurzpruefung_${beispiel.aktenzeichen}_${HEUTE}`;
  writeFileSync(resolve(ausgabe, `${basisname}.html`), html);
  await htmlZuPdf(html, resolve(ausgabe, `${basisname}.pdf`), {
    marke: '[MARKE]',
    aktenzeichen: beispiel.aktenzeichen,
    kundenname: beispiel.kundenname,
    datum: formatDatum(HEUTE),
  });
  console.log(`erzeugt: examples/${basisname}.pdf (Ampel ${eligibility.ampel}, Basis ${calc.szenarien.basis.rueckabwicklungswert.toFixed(2)} €)`);
}
