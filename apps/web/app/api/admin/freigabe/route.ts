/**
 * Freigabe mit einem Klick (Prompt 13, Abschnitt 3): setzt den Marker
 * `freigegeben` und versendet den Bericht sofort. Protokoll = Marker.
 */
import { NextResponse } from 'next/server';
import { adminAutorisiert } from '@/lib/admin';
import { sitzungsDaten, standardAbhaengigkeiten, versendeBericht } from '@/lib/erfuellung';
import { bestellungAktiv, stripeClient } from '@/lib/zahlung';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request): Promise<NextResponse> {
  const form = await request.formData();
  const schluessel = typeof form.get('schluessel') === 'string' ? (form.get('schluessel') as string) : '';
  const sitzungId = typeof form.get('sitzung') === 'string' ? (form.get('sitzung') as string) : '';
  if (!adminAutorisiert(schluessel)) {
    return NextResponse.json({ fehler: 'Nicht autorisiert.' }, { status: 401 });
  }
  if (!bestellungAktiv() || sitzungId === '') {
    return NextResponse.json({ fehler: 'Ungültige Anfrage.' }, { status: 400 });
  }
  const stripe = stripeClient();
  const deps = standardAbhaengigkeiten(stripe);
  const zurueck = (meldung: string) =>
    NextResponse.redirect(
      new URL(`/admin?schluessel=${encodeURIComponent(schluessel)}&meldung=${encodeURIComponent(meldung)}`, request.url),
      303,
    );
  try {
    const sitzung = await stripe.checkout.sessions.retrieve(sitzungId);
    const daten = sitzungsDaten(sitzung);
    await deps.setzeMarker(daten, { freigegeben: deps.jetzt().toISOString() });
    const status = await versendeBericht(daten, deps);
    return zurueck(
      status.mailVersendetAm !== undefined
        ? `${daten.bestellnummer}: freigegeben und versendet.`
        : `${daten.bestellnummer}: Freigabe gesetzt, Versand fehlgeschlagen – der Cron versucht es erneut.`,
    );
  } catch (fehler) {
    return zurueck(`Fehler: ${(fehler as Error).message.slice(0, 160)}`);
  }
}
