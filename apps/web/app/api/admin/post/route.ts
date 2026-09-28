/**
 * Postversand-Stand im Admin (Prompt 14, Abschnitt 3): „gedruckt“ oder
 * „versendet“ mit Zeitpunkt, gespeichert als Marker `post_status`/`post_am`
 * in den Stripe-Metadaten. Protokoll = Marker.
 */
import { NextResponse } from 'next/server';
import { adminAutorisiert } from '@/lib/admin';
import { POST_STAENDE, POST_STAND_LABEL, sitzungsDaten, standardAbhaengigkeiten, type PostStand } from '@/lib/erfuellung';
import { bestellungAktiv, stripeClient } from '@/lib/zahlung';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<NextResponse> {
  const form = await request.formData();
  const schluessel = typeof form.get('schluessel') === 'string' ? (form.get('schluessel') as string) : '';
  const sitzungId = typeof form.get('sitzung') === 'string' ? (form.get('sitzung') as string) : '';
  const stand = typeof form.get('stand') === 'string' ? (form.get('stand') as string) : '';
  if (!adminAutorisiert(schluessel)) {
    return NextResponse.json({ fehler: 'Nicht autorisiert.' }, { status: 401 });
  }
  if (!bestellungAktiv() || sitzungId === '' || !(POST_STAENDE as readonly string[]).includes(stand)) {
    return NextResponse.json({ fehler: 'Ungültige Anfrage.' }, { status: 400 });
  }
  const stripe = stripeClient();
  const deps = standardAbhaengigkeiten(stripe);
  try {
    const sitzung = await stripe.checkout.sessions.retrieve(sitzungId);
    const daten = sitzungsDaten(sitzung);
    const post = stand as PostStand;
    await deps.setzeMarker(daten, { post, postAm: deps.jetzt().toISOString() });
    return NextResponse.redirect(
      new URL(
        `/admin?schluessel=${encodeURIComponent(schluessel)}&meldung=${encodeURIComponent(`${daten.bestellnummer}: Post „${POST_STAND_LABEL[post]}“.`)}`,
        request.url,
      ),
      303,
    );
  } catch (fehler) {
    return NextResponse.json({ fehler: (fehler as Error).message }, { status: 502 });
  }
}
