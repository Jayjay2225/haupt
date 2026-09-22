/**
 * Beta-Passwortschutz (Prompt 8, Aufgabe 5): Solange die Umgebungsvariable
 * BETA_PASSWORT gesetzt ist, verlangt jede Seite HTTP Basic Auth (Benutzername
 * beliebig). Zusammen mit robots noindex bleibt die Beta unsichtbar, bis
 * Rechtstexte und Regelwerk anwaltlich abgenommen sind. Ohne Variable
 * (lokale Entwicklung) ist der Schutz aus.
 */
import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest): NextResponse {
  // Der Stripe-Webhook authentifiziert sich selbst über die Signaturprüfung
  // (constructEvent); Basic-Auth würde jede Zustellung mit 401 abweisen und
  // bezahlte Bestellungen unausgeliefert lassen.
  if (request.nextUrl.pathname === '/api/stripe/webhook') {
    return NextResponse.next();
  }
  const passwort = process.env['BETA_PASSWORT'];
  if (passwort === undefined || passwort === '') {
    return NextResponse.next();
  }
  const kopf = request.headers.get('authorization') ?? '';
  if (kopf.startsWith('Basic ')) {
    try {
      const entschluesselt = atob(kopf.slice(6));
      const trenner = entschluesselt.indexOf(':');
      const eingegeben = trenner >= 0 ? entschluesselt.slice(trenner + 1) : entschluesselt;
      if (eingegeben === passwort) {
        return NextResponse.next();
      }
    } catch {
      // ungültige Kodierung → unten 401
    }
  }
  return new NextResponse('Beta – Zugang nur mit Passwort.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Beta", charset="UTF-8"' },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/stripe/webhook).*)'],
};
