/**
 * Bestellung anlegen: Formular und Fall prüfen, Stripe-Checkout-Sitzung
 * erzeugen und die Weiterleitungsadresse zurückgeben. Gespeichert wird hier
 * nichts; der Fall reist kodiert in den Sitzungs-Metadaten mit.
 */
import { NextResponse } from 'next/server';
import { berechneRueckabwicklung } from '@rueckab/calc';
import type { RiskDefaults } from '@rueckab/calc';
import riskJson from '../../../../../data/risk-defaults.json';
import { draftZuEingaben } from '@/lib/berechnung';
import { pruefeBestellformular } from '@/lib/bestellung';
import type { Bestellformular } from '@/lib/bestellung';
import { uebernehmeBekannteFelder } from '@/lib/draft';
import { findeVersichererId, insurersDaten } from '@/lib/insurers-data';
import { bestellungAktiv, erstelleCheckoutSitzung } from '@/lib/zahlung';

export const runtime = 'nodejs';

const riskDefaults = riskJson as unknown as RiskDefaults;

export async function POST(request: Request): Promise<NextResponse> {
  if (!bestellungAktiv()) {
    return NextResponse.json({ fehler: { fall: 'Die Bestellung ist noch nicht freigeschaltet.' } }, { status: 503 });
  }
  let roh: unknown;
  try {
    roh = await request.json();
  } catch {
    return NextResponse.json({ fehler: { fall: 'Ungültige Anfrage.' } }, { status: 400 });
  }
  if (typeof roh !== 'object' || roh === null) {
    return NextResponse.json({ fehler: { fall: 'Ungültige Anfrage.' } }, { status: 400 });
  }
  const eingabe = roh as Record<string, unknown>;
  const draft = uebernehmeBekannteFelder(
    typeof eingabe['draft'] === 'object' && eingabe['draft'] !== null ? (eingabe['draft'] as Record<string, unknown>) : {},
  );
  const formular: Bestellformular = {
    name: typeof eingabe['name'] === 'string' ? eingabe['name'] : '',
    email: typeof eingabe['email'] === 'string' ? eingabe['email'] : '',
    agbGelesen: eingabe['agbGelesen'] === true,
    ausfuehrungZugestimmt: eingabe['ausfuehrungZugestimmt'] === true,
  };
  const fehler = pruefeBestellformular(formular, draft);
  if (Object.keys(fehler).length > 0) {
    return NextResponse.json({ fehler }, { status: 422 });
  }

  // Gibt es für diesen Vertrag schon eine Berichtsvorlage? Sonst nichts verkaufen.
  const abbildung = draftZuEingaben(draft, findeVersichererId, new Date().toISOString().slice(0, 7));
  if (abbildung.fehler.length > 0) {
    return NextResponse.json({ fehler: { fall: abbildung.fehler.join(' ') } }, { status: 422 });
  }
  const calc = berechneRueckabwicklung(abbildung.contract, insurersDaten, riskDefaults);
  if (calc.regime !== 'alt-policenmodell') {
    return NextResponse.json(
      {
        fehler: {
          fall: 'Für diesen Vertrag gibt es den schriftlichen Bericht noch nicht. Ihre kostenlose Ampel bleibt gültig; wir berechnen nichts.',
        },
      },
      { status: 422 },
    );
  }

  try {
    const ergebnis = await erstelleCheckoutSitzung({ draft, name: formular.name, email: formular.email });
    return NextResponse.json(ergebnis);
  } catch (grund) {
    console.error('Checkout-Sitzung fehlgeschlagen:', grund instanceof Error ? grund.message : 'unbekannter Fehler');
    return NextResponse.json(
      { fehler: { fall: 'Die Zahlungsseite lässt sich gerade nicht öffnen. Bitte in ein paar Minuten noch einmal versuchen.' } },
      { status: 502 },
    );
  }
}
