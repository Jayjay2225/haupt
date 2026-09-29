/**
 * Aufteilung jedes Beitrags in BUZ-, Risiko-, Abschluss-, Verwaltungs- und
 * Sparanteil (CALC-SPEC Abschnitt 3).
 */
import type { BeitragsMonat } from './beitragsreihe';
import { VERTRAGSART_TEXT, zahlDe } from './format';
import { jahrVonIndex, indexZuIso } from './monat';
import { stufenwertFuerMonat } from './zinsreihe';
import type {
  Annahme,
  ContractInput,
  InsurersDaten,
  RiskDefaults,
  SzenarioName,
  Warnung,
} from './types';

export interface MonatsAufteilung {
  index: number;
  beitrag: number;
  buz: number;
  risiko: number;
  abschluss: number;
  verwaltung: number;
  sparanteil: number;
}

export interface AufteilungsErgebnis {
  monate: MonatsAufteilung[];
  risikoanteilProzent: number;
  annahmen: Annahme[];
  warnungen: Warnung[];
}

function risikoanteilAusDefaults(
  defaults: RiskDefaults,
  input: ContractInput,
  szenario: SzenarioName,
): { prozent: number; annahme: Annahme } {
  const alter = input.eintrittsalter ?? defaults.risikoanteilProzent.defaultEintrittsalter;
  const baender = defaults.risikoanteilProzent.vertragsarten[input.vertragsart].baender;
  let band = baender[baender.length - 1];
  for (const kandidat of baender) {
    if (kandidat.bisEintrittsalter === null || alter <= kandidat.bisEintrittsalter) {
      band = kandidat;
      break;
    }
  }
  if (band === undefined) {
    throw new Error(`Keine Risiko-Defaults für Vertragsart ${input.vertragsart}.`);
  }
  const prozent = szenario === 'min' ? band.high : szenario === 'max' ? band.low : band.mid;
  const alterText = input.eintrittsalter !== undefined ? `Eintrittsalter ${alter}` : `angenommenem Eintrittsalter ${alter}`;
  return {
    prozent,
    annahme: {
      code: 'RISIKOANTEIL_PAUSCHAL',
      text: `Risikoanteil pauschal ${zahlDe(prozent, 0, 2)} % des Beitrags (${VERTRAGSART_TEXT[input.vertragsart]}, ${alterText}, Szenarioband ${szenario}); Modellannahme aus data/risk-defaults.json, durch Vertragswerte ersetzbar.`,
    },
  };
}

/** Verwaltungskostenquote (Prozent) für ein Kalenderjahr. */
function verwaltungsquote(
  daten: InsurersDaten,
  defaults: RiskDefaults,
  versichererId: string,
  jahr: number,
  szenario: SzenarioName,
  override?: number,
): { prozent: number; fallback: boolean } {
  if (override !== undefined) {
    return { prozent: override, fallback: false };
  }
  const versicherer = daten.insurers.find((v) => v.id === versichererId);
  const quote = versicherer?.kennzahlen[String(jahr)]?.verwaltungskostenquote;
  if (quote !== undefined) {
    return { prozent: quote.wert, fallback: false };
  }
  const f = defaults.verwaltungskostenFallbackProzent;
  // Min-Szenario: niedrige Verwaltungskosten ⇒ mehr Sparanteil? Nein – für den
  // ANSPRUCH ist der Sparanteil die Nutzungsbasis: hohe Kosten ⇒ kleiner
  // Sparanteil ⇒ geringere Nutzungen. Konservativ (Min) ist also die HOHE
  // Kostenquote, offensiv (Max) die niedrige.
  const prozent = szenario === 'min' ? f.high : szenario === 'max' ? f.low : f.mid;
  return { prozent, fallback: true };
}

export function teileBeitraegeAuf(
  reihe: BeitragsMonat[],
  input: ContractInput,
  daten: InsurersDaten,
  defaults: RiskDefaults,
  szenario: SzenarioName,
): AufteilungsErgebnis {
  const annahmen: Annahme[] = [];
  const warnungen: Warnung[] = [];
  const overrides = input.szenarioOverrides ?? {};

  // Risikoanteil.
  let risikoProzent: number;
  if (overrides.risikoanteilProzent !== undefined) {
    risikoProzent = overrides.risikoanteilProzent;
    annahmen.push({
      code: 'RISIKOANTEIL_OVERRIDE',
      text: `Risikoanteil per Override auf ${zahlDe(risikoProzent, 0, 2)} % gesetzt.`,
    });
  } else {
    const ergebnis = risikoanteilAusDefaults(defaults, input, szenario);
    risikoProzent = ergebnis.prozent;
    annahmen.push(ergebnis.annahme);
  }

  const buzAnteil = (input.buzBeitragsanteilProzent ?? 0) / 100;

  // Abschlusskosten-Gesamtbetrag (Zillmerung).
  const beitragssumme = reihe.reduce((acc, b) => acc + b.betrag, 0);
  let abschlussGesamt = 0;
  if (overrides.abschlusskostenNull === true) {
    annahmen.push({ code: 'ABSCHLUSS_OVERRIDE', text: 'Abschlusskosten per Override auf 0 gesetzt.' });
  } else if (reihe.length > 0) {
    const abschlussjahr = jahrVonIndex(reihe[0]!.index);
    const zillmerWerte = daten.rechnungsgrundlagen.hoechstzillmersatz.werte;
    let zillmerPromille = stufenwertFuerMonat(zillmerWerte, indexZuIso(reihe[0]!.index));
    // Lücke am Reihenanfang (Abschluss vor dem ersten hinterlegten Satz, derzeit
    // vor 1994): wie beim Zinsreihen-Fallback den nächstliegenden SPÄTEREN Wert
    // nehmen – konservativ (Abschlusskosten mindern den Sparanteil) und als
    // Näherung gekennzeichnet. Abschlusskosten mit 0 anzusetzen wäre
    // anspruchserhöhend und bleibt der leeren Werteliste vorbehalten.
    let naeherungAb: string | undefined;
    if (zillmerPromille === undefined) {
      const fruehester = [...zillmerWerte].sort((a, b) => a.gueltigAb.localeCompare(b.gueltigAb))[0];
      if (fruehester !== undefined) {
        zillmerPromille = fruehester.wert;
        naeherungAb = fruehester.gueltigAb.slice(0, 4);
      }
    }
    if (zillmerPromille === undefined) {
      warnungen.push({
        code: 'ZILLMER_UNBEKANNT',
        text: `Kein Höchstzillmersatz für das Abschlussjahr ${abschlussjahr} hinterlegt – Abschlusskosten wurden mit 0 angesetzt (anspruchserhöhend; Datenlücke in insurers.json).`,
      });
    } else {
      let satz = zillmerPromille / 1000;
      const versicherer = daten.insurers.find((v) => v.id === input.versichererId);
      const akQuote = versicherer?.kennzahlen[String(abschlussjahr)]?.abschlusskostenquote;
      if (akQuote !== undefined && akQuote.wert / 100 < satz) {
        satz = akQuote.wert / 100;
        annahmen.push({
          code: 'ABSCHLUSS_QUOTE_DECKEL',
          text: `Abschlusskosten mit der Abschlusskostenquote des Versicherers (${zahlDe(akQuote.wert, 0, 2)} % der Beitragssumme) statt des Höchstzillmersatzes angesetzt.`,
        });
      } else if (naeherungAb !== undefined) {
        warnungen.push({
          code: 'ZILLMER_NAEHERUNG',
          text: `Für das Abschlussjahr ${abschlussjahr} ist kein Höchstzillmersatz hinterlegt; ersatzweise wurde der früheste hinterlegte Satz (${zahlDe(zillmerPromille, 0, 2)} ‰ der Beitragssumme, gültig ab ${naeherungAb}) angesetzt – Näherung, anspruchsmindernd.`,
        });
      } else {
        annahmen.push({
          code: 'ABSCHLUSS_ZILLMER',
          text: `Abschlusskosten mit dem Höchstzillmersatz von ${zahlDe(zillmerPromille, 0, 2)} ‰ der Beitragssumme angesetzt (Abschlussjahr ${abschlussjahr}).`,
        });
      }
      abschlussGesamt = satz * beitragssumme;
    }
  }

  const ab2008 = reihe.length > 0 && jahrVonIndex(reihe[0]!.index) >= 2008;

  // Verteilung ab 2008: gleichmäßig über die Beiträge der ersten 60 Monate.
  let abschlussProMonatAb2008 = new Map<number, number>();
  if (ab2008 && abschlussGesamt > 0 && reihe.length > 0) {
    const startIndex = reihe[0]!.index;
    const beitraegeFruehe = reihe.filter((b) => b.index - startIndex < 60);
    const summeFruehe = beitraegeFruehe.reduce((acc, b) => acc + b.betrag, 0);
    if (summeFruehe > 0) {
      abschlussProMonatAb2008 = new Map(
        beitraegeFruehe.map((b) => [b.index, (abschlussGesamt * b.betrag) / summeFruehe]),
      );
    }
  }

  let abschlussRest = abschlussGesamt;
  const verwaltungFallbackJahre = new Set<number>();
  let gekuerzt = false;
  const monate: MonatsAufteilung[] = [];

  for (const beitrag of reihe) {
    const jahr = jahrVonIndex(beitrag.index);
    const buz = beitrag.betrag * buzAnteil;
    const haupt = beitrag.betrag - buz;
    const risiko = haupt * (risikoProzent / 100);
    let rest = haupt - risiko;

    let abschluss = 0;
    if (ab2008) {
      abschluss = Math.min(abschlussProMonatAb2008.get(beitrag.index) ?? 0, rest);
    } else if (abschlussRest > 0) {
      abschluss = Math.min(abschlussRest, rest);
      abschlussRest -= abschluss;
    }
    rest -= abschluss;

    const vq = verwaltungsquote(
      daten,
      defaults,
      input.versichererId,
      jahr,
      szenario,
      overrides.verwaltungskostenProzent,
    );
    if (vq.fallback) {
      verwaltungFallbackJahre.add(jahr);
    }
    let verwaltung = haupt * (vq.prozent / 100);
    if (verwaltung > rest) {
      verwaltung = rest;
      gekuerzt = true;
    }
    rest -= verwaltung;

    monate.push({
      index: beitrag.index,
      beitrag: beitrag.betrag,
      buz,
      risiko,
      abschluss,
      verwaltung,
      sparanteil: rest,
    });
  }

  if (verwaltungFallbackJahre.size > 0) {
    annahmen.push({
      code: 'VERWALTUNG_FALLBACK',
      text: `Für ${verwaltungFallbackJahre.size} Kalenderjahr(e) lag keine Verwaltungskostenquote des Versicherers vor; Fallback aus data/risk-defaults.json (Modellannahme).`,
    });
  }
  if (gekuerzt) {
    warnungen.push({
      code: 'SPARANTEIL_NEGATIV',
      text: 'In einzelnen Monaten überstiegen Risiko- und Kostenanteile den Beitrag; die Kostenanteile wurden gekürzt (Sparanteil 0). Typisch in der Zillmerungsphase alter Verträge.',
    });
  }

  return { monate, risikoanteilProzent: risikoProzent, annahmen, warnungen };
}
