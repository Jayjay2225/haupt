/**
 * Zugriffsschutz für Admin- und Cron-Endpunkte (Prompt 13, Abschnitt 3).
 * Beta-weit liegt zusätzlich die Basic-Auth-Middleware davor (BETA_PASSWORT).
 *
 * Der Admin-Schlüssel reist nie in einer URL: Die Anmeldung (/api/admin/anmelden)
 * setzt ein HttpOnly-Cookie mit einem aus dem Passwort abgeleiteten Wert
 * (Ablaufzeitpunkt + HMAC über Passwort und Ablauf) – so liegt das Passwort
 * selbst weder in Browser-Verlauf, Referer noch Server-Logs, und die Sitzung
 * endet serverseitig nach ADMIN_SITZUNG_SEKUNDEN bzw. per /api/admin/abmelden.
 * Alle Vergleiche sind zeitkonstant.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

/** Name des HttpOnly-Cookies der Admin-Sitzung. */
export const ADMIN_COOKIE = 'admin_sitzung';

/** Gültigkeit der Admin-Sitzung (Sekunden). */
export const ADMIN_SITZUNG_SEKUNDEN = 12 * 60 * 60;

function passwort(): string {
  return process.env['ADMIN_PASSWORT'] ?? '';
}

/** Zeitkonstanter Vergleich; ungleiche Länge → false (timingSafeEqual würde sonst werfen). */
function gleich(a: string, b: string): boolean {
  const x = Buffer.from(a, 'utf8');
  const y = Buffer.from(b, 'utf8');
  return x.length === y.length && timingSafeEqual(x, y);
}

function signatur(ablauf: number): string {
  return createHmac('sha256', passwort()).update(`admin-sitzung:${ablauf}`).digest('hex');
}

/** Cookie-Wert `<Ablauf ms>.<HMAC>`: Ableitung aus Passwort und Ablauf – das Passwort liegt nie im Cookie. */
export function adminToken(jetzt: number = Date.now()): string {
  const ablauf = jetzt + ADMIN_SITZUNG_SEKUNDEN * 1000;
  return `${ablauf}.${signatur(ablauf)}`;
}

/** Anmeldung: eingegebener Schlüssel muss ADMIN_PASSWORT treffen; ohne konfiguriertes Passwort nur lokal (Entwicklung). */
export function adminAutorisiert(schluessel: string | null | undefined): boolean {
  const admin = passwort();
  if (admin === '') {
    return process.env['VERCEL'] === undefined;
  }
  return typeof schluessel === 'string' && gleich(schluessel, admin);
}

/** Gültige Admin-Sitzung (Cookie-Wert)? Prüft Ablauf und Signatur. */
export function adminCookieGueltig(wert: string | null | undefined, jetzt: number = Date.now()): boolean {
  if (passwort() === '') {
    return process.env['VERCEL'] === undefined;
  }
  if (typeof wert !== 'string') {
    return false;
  }
  const teile = /^(\d{1,16})\.([0-9a-f]{64})$/.exec(wert);
  if (teile === null) {
    return false;
  }
  const ablauf = Number(teile[1]);
  if (!Number.isFinite(ablauf) || ablauf <= jetzt || ablauf > jetzt + ADMIN_SITZUNG_SEKUNDEN * 1000 + 60_000) {
    return false;
  }
  return gleich(teile[2] ?? '', signatur(ablauf));
}

/** Liest den Cookie-Wert aus dem Cookie-Header (eigener Parser, damit Seite und Routen identisch prüfen). */
export function adminCookieAusKopf(cookieKopf: string | null): string | null {
  if (cookieKopf === null) {
    return null;
  }
  for (const teil of cookieKopf.split(';')) {
    const [name, ...rest] = teil.trim().split('=');
    if (name === ADMIN_COOKIE) {
      try {
        return decodeURIComponent(rest.join('='));
      } catch {
        return null;
      }
    }
  }
  return null;
}

/** Admin-Routen: Sitzung aus dem Cookie der Anfrage. */
export function adminAnfrageAutorisiert(request: Request): boolean {
  return adminCookieGueltig(adminCookieAusKopf(request.headers.get('cookie')));
}

/**
 * Cron-Zugang: Vercel-Cron (oder ein externer Zeitplaner) sendet
 * `Authorization: Bearer ${CRON_SECRET}`; ein manueller Anstoß zählt nur aus
 * dem angemeldeten Admin-Browser (Cookie) – nie über einen URL-Parameter.
 */
export function cronAutorisiert(request: Request): boolean {
  const cronSecret = process.env['CRON_SECRET'] ?? '';
  const auth = request.headers.get('authorization') ?? '';
  if (cronSecret !== '' && gleich(auth, `Bearer ${cronSecret}`)) {
    return true;
  }
  return adminAnfrageAutorisiert(request);
}
