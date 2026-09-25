/**
 * Kostenlose Vorschau: rechnet den übermittelten Formular-Entwurf
 * serverseitig durch. Zustandslos – nichts wird gespeichert, nichts mit
 * Personenbezug geloggt.
 *
 * Produktvarianten (config/variante.ts):
 * - privat:  die eine wirtschaftliche Ampel in Worten, KEINE Euro-Beträge in
 *            der Antwort (die Zahlen gibt es im Bericht).
 * - kanzlei: vollständige Ergebnisse (Eignungs-Check, Szenarien).
 */
import { NextResponse } from 'next/server';
import { berechneRueckabwicklung } from '@rueckab/calc';
import type { CalcResult, RiskDefaults } from '@rueckab/calc';
import { pruefeEignung } from '@rueckab/eligibility';
import type { Regelwerk } from '@rueckab/eligibility';
import riskJson from '../../../../../data/risk-defaults.json';
import rulesJson from '../../../../../data/legal-rules.json';
import { RECHTSWEG_SATZ } from '@/config/ampel';
import { VARIANTE } from '@/config/variante';
import { bestimmeWirtschaftlicheAmpel } from '@/lib/ampel';
import { draftZuEingaben } from '@/lib/berechnung';
import { uebernehmeBekannteFelder } from '@/lib/draft';
import { findeVersichererId, insurersDaten } from '@/lib/insurers-data';
import { begrenzt, clientSchluessel } from '@/lib/ratenlimit';

const riskDefaults = riskJson as unknown as RiskDefaults;
const regelwerk = rulesJson as unknown as Regelwerk;

function ohneEuro(texte: string[]): string[] {
  return texte.filter((t) => !t.includes('€'));
}

/** „Warum {Ampelwort}?“ – Szenarien in Worten plus Datenkennzeichen, ohne Beträge. */
function warumZeilen(calc: CalcResult, beendet: boolean): string[] {
  const vergleichswort = beendet ? 'dem bereits Erhaltenen' : 'dem Rückkaufswert';
  const zeilen: string[] = [];
  const namen: { key: 'min' | 'basis' | 'max'; wort: string }[] = [
    { key: 'min', wort: 'Im konservativen Szenario' },
    { key: 'basis', wort: 'Im Basis-Szenario' },
    { key: 'max', wort: 'Im maximalen Szenario' },
  ];
  for (const { key, wort } of namen) {
    const s = calc.szenarien[key];
    const wert = s.mehrwertGegenKuendigung ?? s.nettoanspruch;
    zeilen.push(`${wort} liegt das Ergebnis ${wert > 0 ? 'über' : 'nicht über'} ${vergleichswort}.`);
  }
  const reihe = calc.szenarien.basis.zinsreihe;
  const geschaetzt = reihe.filter((j) => j.kennzeichen === 'estimated_branch').length;
  if (geschaetzt > 0) {
    zeilen.push(
      `Datenkennzeichen: Für ${geschaetzt} von ${reihe.length} Vertragsjahren wurde der Branchendurchschnitt als Schätzwert verwendet (estimated_branch); die übrigen Jahre beruhen auf veröffentlichten Werten Ihres Versicherers.`,
    );
  } else {
    zeilen.push('Datenkennzeichen: Alle Vertragsjahre beruhen auf veröffentlichten Werten Ihres Versicherers.');
  }
  return zeilen;
}

export async function POST(request: Request): Promise<NextResponse> {
  // Spam-/Skriptschutz: höchstens 60 Vorschauen je Client in zehn Minuten.
  if (begrenzt(`vorschau:${clientSchluessel(request)}`, 60, 10 * 60 * 1000)) {
    return NextResponse.json({ fehler: 'Zu viele Anfragen. Bitte einen Moment warten.' }, { status: 429 });
  }
  let roh: unknown;
  try {
    roh = await request.json();
  } catch {
    return NextResponse.json({ fehler: 'Ungültige Anfrage.' }, { status: 400 });
  }
  if (typeof roh !== 'object' || roh === null) {
    return NextResponse.json({ fehler: 'Ungültige Anfrage.' }, { status: 400 });
  }

  const draft = uebernehmeBekannteFelder(roh as Record<string, unknown>);
  const stichtag = new Date().toISOString().slice(0, 7);
  try {
    const abbildung = draftZuEingaben(draft, findeVersichererId, stichtag);
    if (abbildung.fehler.length > 0) {
      return NextResponse.json({ fehler: abbildung.fehler.join(' ') }, { status: 422 });
    }

    if (abbildung.fondsAnfrage) {
      return NextResponse.json({
        variante: 'anfrage',
        grund: 'fonds',
        text: 'Bei fondsgebundenen Verträgen hängt der Wert von den Fondsanteilen ab – unsere Standardformel passt dort nicht. Wir prüfen Ihren Vertrag stattdessen individuell.',
      });
    }

    const calc = berechneRueckabwicklung(abbildung.contract, insurersDaten, riskDefaults);

    if (VARIANTE.belehrungsCheck) {
      const eligibility = pruefeEignung(abbildung.eligibility, regelwerk);
      return NextResponse.json({
        variante: 'kanzlei',
        eligibility,
        calc,
        zusatzAnnahmen: abbildung.zusatzAnnahmen,
        versichererId: abbildung.contract.versichererId,
      });
    }

    const beendet = abbildung.contract.status === 'gekuendigt' || abbildung.contract.status === 'abgelaufen';
    const ampel = bestimmeWirtschaftlicheAmpel(calc, abbildung.contract.status);
    return NextResponse.json({
      variante: 'privat',
      ampel,
      rechtswegSatz: RECHTSWEG_SATZ,
      warum: warumZeilen(calc, beendet),
      annahmen: ohneEuro([...abbildung.zusatzAnnahmen, ...calc.annahmen.map((a) => a.text)]),
      warnungen: ohneEuro(calc.warnungen.map((w) => w.text)),
      versichererId: abbildung.contract.versichererId,
      meta: {
        calcVersion: calc.meta.calcVersion,
        dataVersion: calc.meta.dataVersion,
      },
    });
  } catch (fehler) {
    console.error('vorschau-berechnung fehlgeschlagen:', (fehler as Error).message);
    return NextResponse.json(
      { fehler: 'Wir konnten nicht rechnen. Bitte prüfen Sie Beginn und Beitrag.' },
      { status: 422 },
    );
  }
}
