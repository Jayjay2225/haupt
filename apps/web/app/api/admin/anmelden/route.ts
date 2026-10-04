/**
 * Admin-Anmeldung: Schlüssel per Formular (POST), danach HttpOnly-Cookie mit
 * abgeleitetem Wert – der Schlüssel selbst steht nie in einer URL.
 */
import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, ADMIN_SITZUNG_SEKUNDEN, adminAutorisiert, adminToken } from '@/lib/admin';
import { begrenzt, clientSchluessel } from '@/lib/ratenlimit';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<NextResponse> {
  // Ratenbremse gegen Durchprobieren des Passworts (nach der Beta ist dies die einzige Hürde).
  if (begrenzt(`admin-anmeldung:${clientSchluessel(request)}`, 10, 15 * 60 * 1000)) {
    return NextResponse.redirect(
      new URL(`/admin?meldung=${encodeURIComponent('Zu viele Versuche – bitte in 15 Minuten erneut.')}`, request.url),
      303,
    );
  }
  const form = await request.formData();
  const schluessel = typeof form.get('schluessel') === 'string' ? (form.get('schluessel') as string) : '';
  if (!adminAutorisiert(schluessel)) {
    return NextResponse.redirect(new URL(`/admin?meldung=${encodeURIComponent('Schlüssel falsch.')}`, request.url), 303);
  }
  const antwort = NextResponse.redirect(new URL('/admin', request.url), 303);
  antwort.cookies.set(ADMIN_COOKIE, adminToken(), {
    httpOnly: true,
    sameSite: 'strict',
    // Lokale Entwicklung läuft über http://localhost – dort kein Secure-Cookie.
    secure: process.env['VERCEL'] !== undefined,
    path: '/',
    maxAge: ADMIN_SITZUNG_SEKUNDEN,
  });
  return antwort;
}
