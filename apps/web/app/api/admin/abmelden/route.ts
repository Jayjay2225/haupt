/**
 * Admin-Abmeldung: löscht das Sitzungs-Cookie (die Sitzung endet sonst erst
 * mit dem im Cookie-Wert hinterlegten Ablauf).
 */
import { NextResponse } from 'next/server';
import { ADMIN_COOKIE } from '@/lib/admin';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<NextResponse> {
  const antwort = NextResponse.redirect(new URL(`/admin?meldung=${encodeURIComponent('Abgemeldet.')}`, request.url), 303);
  antwort.cookies.set(ADMIN_COOKIE, '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env['VERCEL'] !== undefined,
    path: '/',
    maxAge: 0,
  });
  return antwort;
}
