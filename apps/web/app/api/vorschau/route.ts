/**
 * Kostenlose Vorschau (Geschäftsmodell B): rechnet den übermittelten
 * Formular-Entwurf serverseitig durch und gibt Eignungs-Check und
 * Szenarien zurück. Zustandslos: Es wird nichts gespeichert und nichts
 * mit Personenbezug geloggt (CLAUDE.md-Prinzipien; Persistenz folgt mit
 * der Geschäftsmodell-Entscheidung).
 */
import { NextResponse } from 'next/server';
import { berechneRueckabwicklung } from '@rueckab/calc';
import type { RiskDefaults } from '@rueckab/calc';
import { pruefeEignung } from '@rueckab/eligibility';
import type { Regelwerk } from '@rueckab/eligibility';
import riskJson from '../../../../../data/risk-defaults.json';
import rulesJson from '../../../../../data/legal-rules.json';
import { draftZuEingaben } from '@/lib/berechnung';
import { findeVersichererId, insurersDaten } from '@/lib/insurers-data';
import { leererDraft, type CaseDraft } from '@/lib/draft';

const riskDefaults = riskJson as unknown as RiskDefaults;
const regelwerk = rulesJson as unknown as Regelwerk;

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

  // Nur bekannte Felder mit passendem Typ übernehmen (wie beim Laden aus localStorage).
  const basis = leererDraft();
  const quelle = roh as Record<string, unknown>;
  for (const schluessel of Object.keys(basis) as (keyof CaseDraft)[]) {
    const wert = quelle[schluessel];
    if (typeof wert === typeof basis[schluessel]) {
      (basis as unknown as Record<string, unknown>)[schluessel] = wert;
    }
  }

  const stichtag = new Date().toISOString().slice(0, 7);
  const abbildung = draftZuEingaben(basis, findeVersichererId, stichtag);
  if (abbildung.fehler.length > 0) {
    return NextResponse.json({ fehler: abbildung.fehler.join(' ') }, { status: 422 });
  }

  try {
    const eligibility = pruefeEignung(abbildung.eligibility, regelwerk);
    const calc = berechneRueckabwicklung(abbildung.contract, insurersDaten, riskDefaults);
    return NextResponse.json({
      eligibility,
      calc,
      zusatzAnnahmen: abbildung.zusatzAnnahmen,
      versichererId: abbildung.contract.versichererId,
    });
  } catch (fehler) {
    // Kein Personenbezug im Log: nur die Fehlermeldung des Rechenkerns.
    console.error('vorschau-berechnung fehlgeschlagen:', (fehler as Error).message);
    return NextResponse.json(
      { fehler: 'Die Vorschau konnte nicht berechnet werden. Bitte prüfen Sie die Angaben zu Beginn, Zahlweise und Beiträgen.' },
      { status: 422 },
    );
  }
}
