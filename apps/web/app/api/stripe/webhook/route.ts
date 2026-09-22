/**
 * Stripe-Webhook: prüft die Signatur und liefert bei Zahlungseingang aus
 * (lib/erfuellung.ts). Antwortet immer schnell mit 2xx, sobald das Ereignis
 * verarbeitet wurde; Fehler stehen im Auslieferungsstatus.
 */
import { NextResponse } from 'next/server';
import { standardAbhaengigkeiten, verarbeiteStripeEreignis } from '@/lib/erfuellung';
import { bestellungAktiv, stripeClient } from '@/lib/zahlung';

export const runtime = 'nodejs';
// PDF-Erzeugung mit Chromium braucht ein paar Sekunden (Kaltstart eingerechnet).
export const maxDuration = 60;

export async function POST(request: Request): Promise<NextResponse> {
  const geheimnis = process.env['STRIPE_WEBHOOK_SECRET'];
  if (!bestellungAktiv() || geheimnis === undefined || geheimnis === '') {
    return NextResponse.json({ fehler: 'Webhook nicht konfiguriert.' }, { status: 503 });
  }
  const signatur = request.headers.get('stripe-signature');
  if (signatur === null) {
    return NextResponse.json({ fehler: 'Signatur fehlt.' }, { status: 400 });
  }
  const roh = await request.text();
  const stripe = stripeClient();
  let ereignis;
  try {
    ereignis = stripe.webhooks.constructEvent(roh, signatur, geheimnis);
  } catch {
    return NextResponse.json({ fehler: 'Signatur ungültig.' }, { status: 400 });
  }
  try {
    const ergebnis = await verarbeiteStripeEreignis(ereignis, standardAbhaengigkeiten(stripe));
    // Bei fehlgeschlagener Auslieferung mit 500 antworten: Stripe stellt dann
    // automatisch erneut zu; erledigte Schritte werden über die Marker übersprungen.
    return NextResponse.json({ empfangen: true, ergebnis }, { status: ergebnis === 'fehler' ? 500 : 200 });
  } catch (grund) {
    // Strukturell unverarbeitbar (z. B. Sitzung ohne Bestellnummer): 200, sonst
    // wiederholt Stripe ein Ereignis endlos, das nie verarbeitbar wird.
    console.error('Webhook unverarbeitbar:', grund instanceof Error ? grund.message : 'unbekannt');
    return NextResponse.json({ empfangen: true, ergebnis: 'unverarbeitbar' });
  }
}
