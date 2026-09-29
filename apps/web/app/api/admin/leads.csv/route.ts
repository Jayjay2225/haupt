/** CSV-Export der Bestell-/Lead-Liste (Prompt 13, 2.3). */
import { NextResponse } from 'next/server';
import { adminAnfrageAutorisiert } from '@/lib/admin';
import { bestellungenAlsCsv, ladeBestellungen } from '@/lib/admin-liste';
import { bestellungAktiv, stripeClient } from '@/lib/zahlung';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: Request): Promise<NextResponse> {
  if (!adminAnfrageAutorisiert(request)) {
    return NextResponse.json({ fehler: 'Nicht autorisiert.' }, { status: 401 });
  }
  if (!bestellungAktiv()) {
    return NextResponse.json({ fehler: 'Stripe ist nicht konfiguriert.' }, { status: 503 });
  }
  const zeilen = await ladeBestellungen(stripeClient(), 90);
  return new NextResponse(bestellungenAlsCsv(zeilen), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="leads.csv"',
    },
  });
}
