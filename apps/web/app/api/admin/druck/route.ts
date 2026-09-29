/**
 * Druckvorlage zum Herunterladen (Prompt 14, Abschnitt 3): erzeugt die
 * A4-Druckvorlage (Deckblatt mit Anschrift, Gutachten, Beileger) aus den
 * Sitzungs-Metadaten neu – zustandslos, für Anbieter bzw. Druckdienstleister.
 */
import { readFileSync } from 'node:fs';
import { NextResponse } from 'next/server';
import { adminAnfrageAutorisiert } from '@/lib/admin';
import { erzeugeDruckvorlage, sitzungsDaten } from '@/lib/erfuellung';
import { bestellungAktiv, stripeClient } from '@/lib/zahlung';

export const runtime = 'nodejs';
// PDF-Erzeugung mit Chromium (Kaltstart eingerechnet).
export const maxDuration = 60;

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const sitzungId = url.searchParams.get('sitzung') ?? '';
  if (!adminAnfrageAutorisiert(request)) {
    return NextResponse.json({ fehler: 'Nicht autorisiert.' }, { status: 401 });
  }
  if (!bestellungAktiv() || sitzungId === '') {
    return NextResponse.json({ fehler: 'Ungültige Anfrage.' }, { status: 400 });
  }
  try {
    const sitzung = await stripeClient().checkout.sessions.retrieve(sitzungId);
    const daten = sitzungsDaten(sitzung);
    const datei = await erzeugeDruckvorlage(daten, new Date());
    return new NextResponse(readFileSync(datei.pfad), {
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': `attachment; filename="${datei.dateiname}"`,
        'cache-control': 'no-store',
      },
    });
  } catch (fehler) {
    return NextResponse.json({ fehler: (fehler as Error).message.slice(0, 200) }, { status: 502 });
  }
}
