/**
 * Kostenlose Vorschau: rechnet den übermittelten Formular-Entwurf
 * serverseitig durch. Zustandslos – nichts wird gespeichert, nichts mit
 * Personenbezug geloggt.
 *
 * Produktvarianten (config/variante.ts):
 * - privat:  NUR die Übernahme-Ampel (Prompt 13, 0.4) – keine Beträge,
 *            keine Wortbänder, keine Spanne; „Warum“ rein qualitativ.
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
import { bestimmeUebernahmeAmpel, berichtKaufbar, type UebernahmeAmpel } from '@/lib/ampel';
import { draftZuEingaben } from '@/lib/berechnung';
import { uebernehmeBekannteFelder } from '@/lib/draft';
import { findeVersichererId, insurersDaten } from '@/lib/insurers-data';
import { begrenzt, clientSchluessel } from '@/lib/ratenlimit';

const riskDefaults = riskJson as unknown as RiskDefaults;
const regelwerk = rulesJson as unknown as Regelwerk;

function ohneEuro(texte: string[]): string[] {
  return texte.filter((t) => !t.includes('€'));
}

/** „Warum {Ampelwort}?“ – rein qualitativ, ohne Beträge (Prompt 13, 2.2). */
function warumZeilen(ampel: UebernahmeAmpel, calc: CalcResult): string[] {
  const zeilen: string[] = [];
  switch (ampel.grund) {
    case 'uebernahme':
      zeilen.push(
        'Ihr Vertrag erfüllt unsere Kriterien: er läuft oder ist beitragsfrei, der Rückkaufswert liegt über unserer Mindestgrenze, die Rechnung liegt über dem Rückkaufswert.',
      );
      break;
    case 'knapp':
      zeilen.push(
        'Ihr Vertrag erfüllt unsere Kriterien: er läuft oder ist beitragsfrei, der Rückkaufswert liegt über unserer Mindestgrenze. Die Rechnung liegt über dem Rückkaufswert – aber knapp; ob es reicht, entscheidet der Prüfbericht.',
      );
      break;
    case 'kein-vorteil':
      zeilen.push('Die Rechnung liegt nicht über dem Rückkaufswert – rechnerisch ist hier nichts zu holen.');
      break;
    case 'status':
      zeilen.push('Ihr Vertrag ist gekündigt oder ausgezahlt – solche Verträge übernehmen wir nicht.');
      break;
    case 'zu-klein':
      zeilen.push('Die Rechnung liegt über dem Rückkaufswert, aber der Rückkaufswert liegt unter unserer Mindestgrenze.');
      break;
    case 'kein-rueckkaufswert':
      zeilen.push('Ohne den Rückkaufswert aus der Standmitteilung können wir die Kriterien nicht prüfen.');
      break;
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

    const ampel = bestimmeUebernahmeAmpel(
      calc,
      abbildung.contract.status,
      abbildung.contract.rueckkaufswert?.betrag,
    );
    return NextResponse.json({
      variante: 'privat',
      ampel,
      kaufbar: berichtKaufbar(ampel),
      // Rechtsweg-Satz nur bei Grün und Gelb (Prompt 13, 2.2).
      rechtswegSatz: ampel.grund === 'uebernahme' || ampel.grund === 'knapp' ? RECHTSWEG_SATZ : null,
      warum: warumZeilen(ampel, calc),
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
