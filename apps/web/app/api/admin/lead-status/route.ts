/**
 * Lead-Status im Admin (Prompt 13, 2.3): „Bericht gekauft“ → „Übernahme
 * angefragt“ → „Mandat“ → „Vergleich/Urteil“, gespeichert als Marker in den
 * Stripe-Metadaten.
 */
import { NextResponse } from 'next/server';
import { adminAutorisiert } from '@/lib/admin';
import { LEAD_STATUS, sitzungsDaten, standardAbhaengigkeiten } from '@/lib/erfuellung';
import { bestellungAktiv, stripeClient } from '@/lib/zahlung';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<NextResponse> {
  const form = await request.formData();
  const schluessel = typeof form.get('schluessel') === 'string' ? (form.get('schluessel') as string) : '';
  const sitzungId = typeof form.get('sitzung') === 'string' ? (form.get('sitzung') as string) : '';
  const status = typeof form.get('status') === 'string' ? (form.get('status') as string) : '';
  if (!adminAutorisiert(schluessel)) {
    return NextResponse.json({ fehler: 'Nicht autorisiert.' }, { status: 401 });
  }
  if (!bestellungAktiv() || sitzungId === '' || !(LEAD_STATUS as readonly string[]).includes(status)) {
    return NextResponse.json({ fehler: 'Ungültige Anfrage.' }, { status: 400 });
  }
  const stripe = stripeClient();
  const deps = standardAbhaengigkeiten(stripe);
  try {
    const sitzung = await stripe.checkout.sessions.retrieve(sitzungId);
    const daten = sitzungsDaten(sitzung);
    await deps.setzeMarker(daten, { leadStatus: status });
    return NextResponse.redirect(
      new URL(
        `/admin?schluessel=${encodeURIComponent(schluessel)}&meldung=${encodeURIComponent(`${daten.bestellnummer}: Lead-Status „${status}“.`)}`,
        request.url,
      ),
      303,
    );
  } catch (fehler) {
    return NextResponse.json({ fehler: (fehler as Error).message }, { status: 502 });
  }
}
