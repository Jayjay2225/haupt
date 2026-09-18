/**
 * Kostenlose Vorschau: rechnet den übermittelten Formular-Entwurf
 * serverseitig durch. Zustandslos – nichts wird gespeichert, nichts mit
 * Personenbezug geloggt.
 *
 * Produktvarianten (config/variante.ts):
 * - privat:  wirtschaftliche Ampel in Worten, KEINE Euro-Beträge in der
 *            Antwort (die Spanne gibt es im Bericht), keine Belehrungsbewertung.
 * - kanzlei: vollständige Ergebnisse (Eignungs-Check, Szenarien).
 */
import { NextResponse } from 'next/server';
import { berechneRueckabwicklung } from '@rueckab/calc';
import type { RiskDefaults } from '@rueckab/calc';
import { pruefeEignung } from '@rueckab/eligibility';
import type { Regelwerk } from '@rueckab/eligibility';
import riskJson from '../../../../../data/risk-defaults.json';
import rulesJson from '../../../../../data/legal-rules.json';
import { VARIANTE } from '@/config/variante';
import { bestimmeWirtschaftlicheAmpel } from '@/lib/ampel';
import { draftZuEingaben } from '@/lib/berechnung';
import { uebernehmeBekannteFelder } from '@/lib/draft';
import { findeVersichererId, insurersDaten } from '@/lib/insurers-data';

const riskDefaults = riskJson as unknown as RiskDefaults;
const regelwerk = rulesJson as unknown as Regelwerk;

function ohneEuro(texte: string[]): string[] {
  return texte.filter((t) => !t.includes('€'));
}

export async function POST(request: Request): Promise<NextResponse> {
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
  const abbildung = draftZuEingaben(draft, findeVersichererId, stichtag);
  if (abbildung.fehler.length > 0) {
    return NextResponse.json({ fehler: abbildung.fehler.join(' ') }, { status: 422 });
  }

  try {
    const eligibility = pruefeEignung(abbildung.eligibility, regelwerk);
    const calc = berechneRueckabwicklung(abbildung.contract, insurersDaten, riskDefaults);

    if (VARIANTE.belehrungsCheck) {
      return NextResponse.json({
        variante: 'kanzlei',
        eligibility,
        calc,
        zusatzAnnahmen: abbildung.zusatzAnnahmen,
        versichererId: abbildung.contract.versichererId,
      });
    }

    const ampel = bestimmeWirtschaftlicheAmpel(calc, eligibility);
    return NextResponse.json({
      variante: 'privat',
      ampel,
      regime: calc.regime,
      hinweise: eligibility.hinweise.map((h) => h.text),
      annahmen: ohneEuro([...abbildung.zusatzAnnahmen, ...calc.annahmen.map((a) => a.text)]),
      warnungen: ohneEuro(calc.warnungen.map((w) => w.text)),
      versichererId: abbildung.contract.versichererId,
      meta: {
        calcVersion: calc.meta.calcVersion,
        dataVersion: calc.meta.dataVersion,
        rulesVersion: eligibility.meta.rulesVersion,
      },
    });
  } catch (fehler) {
    console.error('vorschau-berechnung fehlgeschlagen:', (fehler as Error).message);
    return NextResponse.json(
      { fehler: 'Wir konnten nicht rechnen. Bitte prüfen Sie Beginn, Zahlweise und Beiträge.' },
      { status: 422 },
    );
  }
}
