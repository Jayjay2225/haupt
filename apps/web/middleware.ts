/**
 * Beta-Passwortschutz (Prompt 8, Aufgabe 5): Solange die Umgebungsvariable
 * BETA_PASSWORT gesetzt ist, verlangt jede Seite HTTP Basic Auth (Benutzername
 * beliebig). Zusammen mit robots noindex bleibt die Beta unsichtbar, bis
 * Rechtstexte und Regelwerk anwaltlich abgenommen sind. Ohne Variable
 * (lokale Entwicklung) ist der Schutz aus.
 */
import { NextResponse, type NextRequest } from 'next/server';

/** Zeitkonstanter Vergleich (Edge-Runtime ohne node:crypto): Länge und jedes Zeichen zählen. */
function gleich(a: string, b: string): boolean {
  let unterschied = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    unterschied |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return unterschied === 0;
}

export function middleware(request: NextRequest): NextResponse {
  // Der Stripe-Webhook authentifiziert sich selbst über die Signaturprüfung
  // (constructEvent); der Versand-Cron über CRON_SECRET/ADMIN_PASSWORT.
  // Basic-Auth würde beide mit 401 abweisen und bezahlte Bestellungen
  // unausgeliefert lassen.
  if (
    request.nextUrl.pathname === '/api/stripe/webhook' ||
    request.nextUrl.pathname === '/api/auslieferung/cron'
  ) {
    return NextResponse.next();
  }
  const passwort = process.env['BETA_PASSWORT'];
  if (passwort === undefined || passwort === '') {
    return NextResponse.next();
  }
  const kopf = request.headers.get('authorization') ?? '';
  if (kopf.startsWith('Basic ')) {
    try {
      // Der Browser sendet base64(utf8(...)) (charset="UTF-8" unten); atob liefert Latin-1 – deshalb erst Bytes, dann UTF-8.
      const bytes = Uint8Array.from(atob(kopf.slice(6)), (c) => c.charCodeAt(0));
      const entschluesselt = new TextDecoder('utf-8').decode(bytes);
      const trenner = entschluesselt.indexOf(':');
      const eingegeben = trenner >= 0 ? entschluesselt.slice(trenner + 1) : entschluesselt;
      if (gleich(eingegeben, passwort)) {
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
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/stripe/webhook|api/auslieferung/cron).*)'],
};
