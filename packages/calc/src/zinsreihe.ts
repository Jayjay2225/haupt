/**
 * Auflösung der Zinsreihe je Kalenderjahr (CALC-SPEC Abschnitt 4):
 * Kennzahl des Versicherers unter Beachtung der Rechtsnachfolge
 * (`kennzahlenVon`), sonst Branchendurchschnitt, sonst letzter bekannter
 * Branchenwert mit Warnung.
 */
import type {
  Annahme,
  InsurersDaten,
  JahresKennzahlen,
  JahresZins,
  SzenarioName,
  VersichererDaten,
  Warnung,
  ZinsEintrag,
} from './types';

function findeVersicherer(daten: InsurersDaten, id: string): VersichererDaten | undefined {
  return daten.insurers.find((v) => v.id === id);
}

/** Kennzahlen des zuständigen Rechtsträgers für ein Jahr (Kettenauflösung). */
function kennzahlenFuerJahr(
  daten: InsurersDaten,
  startId: string,
  jahr: number,
): JahresKennzahlen | undefined {
  let aktuelleId = startId;
  const besucht = new Set<string>();
  while (!besucht.has(aktuelleId)) {
    besucht.add(aktuelleId);
    const versicherer = findeVersicherer(daten, aktuelleId);
    if (!versicherer) {
      return undefined;
    }
    const eigene = versicherer.kennzahlen[String(jahr)];
    if (eigene !== undefined) {
      return eigene;
    }
    if (versicherer.kennzahlenVon !== undefined && jahr >= versicherer.kennzahlenVon.abJahr) {
      aktuelleId = versicherer.kennzahlenVon.insurerId;
      continue;
    }
    return undefined;
  }
  return undefined;
}

export interface ZinsreihenErgebnis {
  jahre: JahresZins[];
  annahmen: Annahme[];
  warnungen: Warnung[];
}

export function loeseZinsreihe(
  daten: InsurersDaten,
  versichererId: string,
  jahrVon: number,
  jahrBis: number,
  szenario: SzenarioName,
  overrideZinsProzent?: number,
): ZinsreihenErgebnis {
  const jahre: JahresZins[] = [];
  const annahmen: Annahme[] = [];
  const warnungen: Warnung[] = [];

  if (overrideZinsProzent !== undefined) {
    for (let jahr = jahrVon; jahr <= jahrBis; jahr += 1) {
      jahre.push({ jahr, satzProzent: overrideZinsProzent, herkunft: 'override' });
    }
    annahmen.push({
      code: 'ZINS_OVERRIDE',
      text: `Fester Zinssatz von ${overrideZinsProzent} % p. a. als Override verwendet (Test/Sensitivität).`,
    });
    return { jahre, annahmen, warnungen };
  }

  const versichererBekannt = findeVersicherer(daten, versichererId) !== undefined;
  if (!versichererBekannt) {
    annahmen.push({
      code: 'VERSICHERER_UNBEKANNT',
      text: `Für die Versicherer-ID "${versichererId}" liegen keine Kennzahlen vor; es gilt durchgängig der Branchendurchschnitt (als Schätzung markiert).`,
    });
  }

  let brancheJahreGenutzt = 0;

  for (let jahr = jahrVon; jahr <= jahrBis; jahr += 1) {
    const kennzahlen = versichererBekannt ? kennzahlenFuerJahr(daten, versichererId, jahr) : undefined;
    const netto = kennzahlen?.nettoverzinsung;
    const laufend = kennzahlen?.laufendeDurchschnittsverzinsung;

    if (netto !== undefined) {
      let satz = netto.wert;
      let quelle = netto.quelle;
      if (szenario === 'min' && laufend !== undefined && laufend.wert < satz) {
        satz = laufend.wert;
        quelle = laufend.quelle;
      }
      jahre.push({ jahr, satzProzent: satz, herkunft: 'insurer', quelle });
      continue;
    }

    const branche = daten.branchendurchschnitt.nettoverzinsung[String(jahr)];
    if (branche !== undefined) {
      let satz = branche.wert;
      let quelle = branche.quelle;
      const brancheLaufend = daten.branchendurchschnitt.laufendeDurchschnittsverzinsung?.[String(jahr)];
      if (szenario === 'min' && brancheLaufend !== undefined && brancheLaufend.wert < satz) {
        satz = brancheLaufend.wert;
        quelle = brancheLaufend.quelle;
      }
      jahre.push({ jahr, satzProzent: satz, herkunft: 'branche', quelle });
      brancheJahreGenutzt += 1;
      continue;
    }

    // Lücke: den zeitlich nächstliegenden FRÜHEREN Branchenwert zu DIESEM Jahr
    // verwenden – nicht den zuletzt zufällig benutzten (der kann bei
    // Unternehmensjahren dazwischen Jahrzehnte zurückliegen).
    let fallback: { jahr: number; wert: number } | undefined;
    for (let suchJahr = jahr - 1; suchJahr >= jahrVon - 30; suchJahr -= 1) {
      const kandidat = daten.branchendurchschnitt.nettoverzinsung[String(suchJahr)];
      if (kandidat !== undefined) {
        fallback = { jahr: suchJahr, wert: kandidat.wert };
        break;
      }
    }
    if (fallback !== undefined) {
      jahre.push({ jahr, satzProzent: fallback.wert, herkunft: 'fallback' });
      warnungen.push({
        code: 'ZINSREIHE_LUECKE',
        text: `Für ${jahr} liegt weder ein Unternehmens- noch ein Branchenwert vor; ersatzweise wurde der Branchenwert ${fallback.jahr} (${fallback.wert} %) verwendet.`,
      });
    } else {
      throw new Error(
        `Keine Zinsdaten für ${jahr} verfügbar (weder Versicherer noch Branchendurchschnitt). Datenbasis unvollständig.`,
      );
    }
  }

  if (brancheJahreGenutzt > 0 && versichererBekannt) {
    annahmen.push({
      code: 'ZINS_BRANCHENDURCHSCHNITT',
      text: `Für ${brancheJahreGenutzt} Jahr(e) fehlten Unternehmenswerte; dort wurde der Branchendurchschnitt verwendet (als Schätzung markiert).`,
    });
  }

  return { jahre, annahmen, warnungen };
}

/** Satz (Prozent) eines Stufenwerts (z. B. Referenzzins) für einen Monatsindex. */
export function stufenwertFuerMonat(werte: ZinsEintrag[], monatsIso: string): number | undefined {
  let ergebnis: number | undefined;
  for (const eintrag of [...werte].sort((a, b) => a.gueltigAb.localeCompare(b.gueltigAb))) {
    if (eintrag.gueltigAb.slice(0, 7) <= monatsIso) {
      ergebnis = eintrag.wert;
    }
  }
  return ergebnis;
}
