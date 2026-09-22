/**
 * Orchestrierung des Rechenkerns (CALC-SPEC Abschnitte 1–8):
 * Regime bestimmen → Beitragsreihe → Aufteilung → Nutzungen →
 * Gegenrechnung → Szenario-Ergebnisse und Jahrestabelle.
 */
import { baueBeitragsreihe } from './beitragsreihe';
import { teileBeitraegeAuf, type MonatsAufteilung } from './aufteilung';
import { monatsIndex, jahrVonIndex } from './monat';
import { zinseAuf, zinseLeistungAuf, zinsMap } from './nutzungen';
import { loeseZinsreihe } from './zinsreihe';
import { CALC_VERSION } from './version';
import type {
  Annahme,
  CalcResult,
  CalcResultAlt,
  ContractInput,
  Geldleistung,
  InsurersDaten,
  Jahreszeile,
  Regime,
  RiskDefaults,
  SzenarioErgebnis,
  SzenarioName,
  Warnung,
  Zinsherkunft,
} from './types';

const GRENZE_ALT_BEGINN = monatsIndex('1994-07'); // Juli 1994: Tag entscheidet (29.07.1994)
const GRENZE_NEU = monatsIndex('2008-01');

function rund(x: number): number {
  return Math.round(x * 100) / 100;
}

function bestimmeRegime(beginnIndex: number): Regime {
  if (beginnIndex < GRENZE_ALT_BEGINN) {
    return 'vor-1994';
  }
  if (beginnIndex >= GRENZE_NEU) {
    return 'neu-2008';
  }
  return 'alt-policenmodell';
}

interface Sammler {
  annahmen: Map<string, Annahme>;
  warnungen: Map<string, Warnung>;
}

function sammle(s: Sammler, annahmen: Annahme[], warnungen: Warnung[]): void {
  for (const a of annahmen) {
    s.annahmen.set(`${a.code}:${a.text}`, a);
  }
  for (const w of warnungen) {
    s.warnungen.set(`${w.code}:${w.text}`, w);
  }
}

export function berechneRueckabwicklung(
  input: ContractInput,
  daten: InsurersDaten,
  defaults: RiskDefaults,
): CalcResult {
  const beginnIndex = monatsIndex(input.beginn);
  const stichtagIndex = monatsIndex(input.stichtag);
  const regime = bestimmeRegime(beginnIndex);
  const s: Sammler = { annahmen: new Map(), warnungen: new Map() };

  const meta = {
    calcVersion: CALC_VERSION,
    dataVersion: daten.data.version,
    stichtag: input.stichtag,
    regime,
  };

  if (regime === 'vor-1994') {
    return {
      regime,
      hinweis:
        'Vertragsschluss vor dem 29.07.1994: § 5a VVG a.F. galt noch nicht – die Rückabwicklung nach dem Policenmodell kommt nicht in Betracht (docs/LEGAL.md Abschnitt 6).',
      annahmen: [],
      warnungen: [],
      meta,
    };
  }

  if (beginnIndex === GRENZE_ALT_BEGINN) {
    s.warnungen.set('GRENZMONAT', {
      code: 'GRENZMONAT',
      text: 'Vertragsbeginn im Juli 1994: Maßgeblich ist der genaue Tag des Vertragsschlusses (Stichtag 29.07.1994) – bitte anhand der Police prüfen.',
    });
  }

  // Beitragsreihe (für alle Regime/ Szenarien identisch).
  const reihe = baueBeitragsreihe(input);
  sammle(s, reihe.annahmen, reihe.warnungen);

  if (regime === 'neu-2008') {
    const erstesJahr = reihe.reihe
      .filter((b) => b.index - beginnIndex < 12)
      .reduce((acc, b) => acc + b.betrag, 0);
    const vergleich: { rueckkaufswert?: number; praemienErstesJahr: number } = {
      praemienErstesJahr: rund(erstesJahr),
    };
    if (input.rueckkaufswert !== undefined) {
      vergleich.rueckkaufswert = rund(input.rueckkaufswert.betrag);
    }
    return {
      regime,
      hinweis:
        'Vertragsschluss ab 2008: Es gilt das Widerrufsrecht nach § 8/§ 152 VVG n.F. Wirtschaftlich führt der Widerruf im Regelfall etwa zum Rückkaufswert nach § 169 VVG, bei fehlender Belehrung zuzüglich der Prämien des ersten Jahres (§ 9 VVG) – deutlich weniger als die Rückabwicklung nach altem Recht. Eine Szenariorechnung nach der § 5a-Methodik findet deshalb nicht statt (docs/LEGAL.md Abschnitt 1, Regime C).',
      vergleich,
      annahmen: [...s.annahmen.values()],
      warnungen: [...s.warnungen.values()],
      meta,
    };
  }

  // --- Regime alt: drei Szenarien -----------------------------------------

  const jahrVon = jahrVonIndex(beginnIndex);
  const jahrBis = jahrVonIndex(stichtagIndex);

  // Erhaltene Leistungen inkl. Gegenverzinsung (szenariounabhängig).
  const leistungen: Geldleistung[] = [...(input.auszahlungen ?? []), ...(input.policendarlehen ?? [])];
  if (input.status === 'gekuendigt' && input.rueckkaufswert !== undefined) {
    const monat = input.statusDatum ?? input.stichtag;
    leistungen.push({ monat, betrag: input.rueckkaufswert.betrag });
    s.annahmen.set('RKW_ALS_LEISTUNG', {
      code: 'RKW_ALS_LEISTUNG',
      text: `Der Vertrag ist gekündigt; der Rückkaufswert (${input.rueckkaufswert.betrag.toFixed(2)} €) wurde als erhaltene Leistung zum ${monat} angerechnet. Falls er zusätzlich unter „Auszahlungen" erfasst wurde, bitte doppelte Erfassung korrigieren.`,
    });
  }
  if ((input.policendarlehen ?? []).length > 0) {
    s.annahmen.set('DARLEHEN', {
      code: 'DARLEHEN',
      text: 'Policendarlehen wurden wie Auszahlungen behandelt; Zins- und Tilgungsflüsse an den Versicherer sind nicht modelliert (Einzelfallprüfung).',
    });
  }
  let leistungenAufgezinst = 0;
  let monateOhneReferenz = 0;
  for (const leistung of leistungen) {
    const ergebnis = zinseLeistungAuf(
      leistung.betrag,
      monatsIndex(leistung.monat),
      stichtagIndex,
      daten.referenzzinsen.einlagenzins.werte,
    );
    leistungenAufgezinst += ergebnis.aufgezinst;
    monateOhneReferenz += ergebnis.monateOhneReferenz;
  }
  if (monateOhneReferenz > 0) {
    s.annahmen.set('REFERENZZINS_LUECKE', {
      code: 'REFERENZZINS_LUECKE',
      text: `Für ${monateOhneReferenz} Monat(e) lag kein Referenz-Einlagenzins vor (Reihe beginnt 2003); dort wurde mit 0 % gegenverzinst (anspruchsschonend).`,
    });
  }

  const szenarien = {} as Record<SzenarioName, SzenarioErgebnis>;
  let basisMonate: MonatsAufteilung[] = [];
  let basisZinsen: ReturnType<typeof loeseZinsreihe> | undefined;
  let basisNutzungenProJahr = new Map<number, number>();
  let basisStandProJahr = new Map<number, number>();

  for (const name of ['min', 'basis', 'max'] as SzenarioName[]) {
    const aufteilung = teileBeitraegeAuf(reihe.reihe, input, daten, defaults, name);
    const zinsen = loeseZinsreihe(
      daten,
      input.versichererId,
      jahrVon,
      jahrBis,
      name,
      input.szenarioOverrides?.zinssatzProzent,
    );
    if (name === 'basis') {
      sammle(s, aufteilung.annahmen, aufteilung.warnungen);
      sammle(s, zinsen.annahmen, zinsen.warnungen);
    }

    const einzahlungen = new Map<number, number>();
    for (const m of aufteilung.monate) {
      const basisBetrag = name === 'max' ? m.sparanteil + m.verwaltung : m.sparanteil;
      einzahlungen.set(m.index, (einzahlungen.get(m.index) ?? 0) + basisBetrag);
    }
    const aufgezinst = zinseAuf(einzahlungen, zinsMap(zinsen.jahre), beginnIndex, stichtagIndex);

    const summeBeitraege = aufteilung.monate.reduce((a, m) => a + m.beitrag, 0);
    const summeBuz = aufteilung.monate.reduce((a, m) => a + m.buz, 0);
    const summeRisiko = aufteilung.monate.reduce((a, m) => a + m.risiko, 0);
    const summeAbschluss = aufteilung.monate.reduce((a, m) => a + m.abschluss, 0);
    const summeVerwaltung = aufteilung.monate.reduce((a, m) => a + m.verwaltung, 0);
    const summeSpar = aufteilung.monate.reduce((a, m) => a + m.sparanteil, 0);

    const erstattung = summeBeitraege - summeBuz - summeRisiko;
    const rueckabwicklungswert = erstattung + aufgezinst.nutzungen;
    const nettoanspruch = rueckabwicklungswert - leistungenAufgezinst;
    const nutzungenProzent = summeBeitraege > 0 ? (aufgezinst.nutzungen / summeBeitraege) * 100 : 0;

    // Plausibilität (CALC-SPEC Abschnitt 8): Obergrenze = Vollbeitrags-
    // Aufzinsung mit dem Maximum der Reihe.
    const maxSatz = Math.max(...zinsen.jahre.map((j) => j.satzProzent));
    const vollEinzahlungen = new Map<number, number>();
    for (const b of reihe.reihe) {
      vollEinzahlungen.set(b.index, (vollEinzahlungen.get(b.index) ?? 0) + b.betrag);
    }
    const obergrenze = zinseAuf(
      vollEinzahlungen,
      new Map(zinsen.jahre.map((j) => [j.jahr, maxSatz])),
      beginnIndex,
      stichtagIndex,
    ).nutzungen;
    const alleSaetzeNichtNegativ = zinsen.jahre.every((j) => j.satzProzent >= 0);
    if (aufgezinst.nutzungen > obergrenze + 0.01 || (alleSaetzeNichtNegativ && aufgezinst.nutzungen < -0.01)) {
      s.warnungen.set(`PLAUSIBILITAET_NUTZUNGEN:${name}`, {
        code: 'PLAUSIBILITAET_NUTZUNGEN',
        text: `Szenario ${name}: Die berechneten Nutzungen (${rund(aufgezinst.nutzungen)} €) liegen außerhalb der aus der Zinsreihe ableitbaren Bandbreite (0 … ${rund(obergrenze)} €) – Ergebnis manuell prüfen.`,
      });
    }

    const nachHerkunft: Record<Zinsherkunft, number> = { insurer: 0, branche: 0, fallback: 0, override: 0 };
    const herkunftProJahr = new Map(zinsen.jahre.map((j) => [j.jahr, j.herkunft]));
    for (const [jahr, zins] of aufgezinst.nutzungenProJahr) {
      const herkunft = herkunftProJahr.get(jahr) ?? 'fallback';
      nachHerkunft[herkunft] += zins;
    }
    const anteilUnternehmen =
      aufgezinst.nutzungen > 0 ? Math.round((nachHerkunft.insurer / aufgezinst.nutzungen) * 1000) / 10 : 0;

    const ergebnis: SzenarioErgebnis = {
      name,
      summeBeitraege: rund(summeBeitraege),
      summeBuz: rund(summeBuz),
      summeRisiko: rund(summeRisiko),
      summeAbschluss: rund(summeAbschluss),
      summeVerwaltung: rund(summeVerwaltung),
      summeSparanteil: rund(summeSpar),
      erstattungsfaehigeBeitraege: rund(erstattung),
      nutzungen: rund(aufgezinst.nutzungen),
      rueckabwicklungswert: rund(rueckabwicklungswert),
      erhalteneLeistungenAufgezinst: rund(leistungenAufgezinst),
      nettoanspruch: rund(nettoanspruch),
      nutzungenProzentDerBeitraege: Math.round(nutzungenProzent * 10) / 10,
      nutzungenNachHerkunft: {
        insurer: rund(nachHerkunft.insurer),
        branche: rund(nachHerkunft.branche),
        fallback: rund(nachHerkunft.fallback),
        override: rund(nachHerkunft.override),
      },
      anteilUnternehmenswerteProzent: anteilUnternehmen,
      zinsreihe: zinsen.jahre,
    };
    if (
      (input.status === 'laufend' || input.status === 'beitragsfrei') &&
      input.rueckkaufswert !== undefined
    ) {
      // Vergleichsmaßstab ist der NETTO-Anspruch: Erhaltene Auszahlungen sind bei
      // der Rückabwicklung (aufgezinst) gegenzurechnen; bei der Kündigung behielte
      // der Kunde sie ebenfalls und bekäme den (bereits geminderten) Rückkaufswert.
      ergebnis.mehrwertGegenKuendigung = rund(nettoanspruch - input.rueckkaufswert.betrag);
      if (name === 'basis') {
        ergebnis.wirtschaftlichKeinVorteil = ergebnis.mehrwertGegenKuendigung <= 0;
      }
    }
    szenarien[name] = ergebnis;

    if (name === 'basis') {
      basisMonate = aufteilung.monate;
      basisZinsen = zinsen;
      basisNutzungenProJahr = aufgezinst.nutzungenProJahr;
      basisStandProJahr = aufgezinst.standProJahr;
    }
  }

  // Jahrestabelle (Basis-Szenario).
  const jahrestabelle: Jahreszeile[] = [];
  const zinsProJahr = new Map(basisZinsen!.jahre.map((j) => [j.jahr, j]));
  const proJahr = new Map<number, { beitraege: number; buz: number; risiko: number; abschluss: number; verwaltung: number; spar: number }>();
  for (const m of basisMonate) {
    const jahr = jahrVonIndex(m.index);
    const zeile = proJahr.get(jahr) ?? { beitraege: 0, buz: 0, risiko: 0, abschluss: 0, verwaltung: 0, spar: 0 };
    zeile.beitraege += m.beitrag;
    zeile.buz += m.buz;
    zeile.risiko += m.risiko;
    zeile.abschluss += m.abschluss;
    zeile.verwaltung += m.verwaltung;
    zeile.spar += m.sparanteil;
    proJahr.set(jahr, zeile);
  }
  for (let jahr = jahrVon; jahr <= jahrBis; jahr += 1) {
    const zeile = proJahr.get(jahr);
    const zins = zinsProJahr.get(jahr);
    jahrestabelle.push({
      jahr,
      beitraege: rund(zeile?.beitraege ?? 0),
      buz: rund(zeile?.buz ?? 0),
      risiko: rund(zeile?.risiko ?? 0),
      abschluss: rund(zeile?.abschluss ?? 0),
      verwaltung: rund(zeile?.verwaltung ?? 0),
      sparanteil: rund(zeile?.spar ?? 0),
      zinssatzProzent: zins?.satzProzent ?? 0,
      zinsherkunft: zins?.herkunft ?? 'fallback',
      nutzungenImJahr: rund(basisNutzungenProJahr.get(jahr) ?? 0),
      kumulierterWert: rund(basisStandProJahr.get(jahr) ?? 0),
    });
  }

  const result: CalcResultAlt = {
    regime: 'alt-policenmodell',
    szenarien,
    jahrestabelle,
    annahmen: [...s.annahmen.values()],
    warnungen: [...s.warnungen.values()],
    meta,
  };
  return result;
}
