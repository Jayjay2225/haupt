/**
 * Stripe-Webhook: prüft die Signatur und liefert bei Zahlungseingang aus
 * (lib/erfuellung.ts). Antwortet immer schnell mit 2xx, sobald das Ereignis
 * verarbeitet wurde; Fehler stehen im Auslieferungsstatus.
 */
import { NextResponse } from 'next/server';
import { standardAbhaengigkeiten, verarbeiteStripeEreignis } from '@/lib/erfuellung';
import { bestellungAktiv, stripeClient } from '@/lib/zahlung';

export const runtime = 'nodejs';

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
  const ergebnis = await verarbeiteStripeEreignis(ereignis, standardAbhaengigkeiten(stripe));
  return NextResponse.json({ empfangen: true, ergebnis });
}
