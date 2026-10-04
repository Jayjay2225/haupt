/**
 * Zugriffsschutz für Admin und Cron (lib/admin.ts): Anmeldung mit dem
 * Passwort, Sitzungs-Cookie mit abgeleitetem Wert, Cron per Bearer-Header –
 * nie über einen URL-Parameter.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ADMIN_COOKIE,
  adminAnfrageAutorisiert,
  adminAutorisiert,
  adminCookieAusKopf,
  adminCookieGueltig,
  adminToken,
  cronAutorisiert,
} from '../lib/admin';

const UMGEBUNG = ['ADMIN_PASSWORT', 'CRON_SECRET', 'VERCEL'] as const;
const vorher: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const name of UMGEBUNG) {
    vorher[name] = process.env[name];
  }
  process.env['ADMIN_PASSWORT'] = 'sehr-geheim';
  process.env['CRON_SECRET'] = 'cron-geheim';
  delete process.env['VERCEL'];
});

afterEach(() => {
  for (const name of UMGEBUNG) {
    if (vorher[name] === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = vorher[name];
    }
  }
});

function anfrage(kopf: Record<string, string>): Request {
  return new Request('https://renten-rettung.de/api/auslieferung/cron', { headers: kopf });
}

describe('Admin-Anmeldung und Sitzung', () => {
  it('Anmeldung nur mit dem konfigurierten Passwort (auch bei anderer Länge kein Fehler)', () => {
    expect(adminAutorisiert('sehr-geheim')).toBe(true);
    expect(adminAutorisiert('sehr-geheim ')).toBe(false);
    expect(adminAutorisiert('x')).toBe(false);
    expect(adminAutorisiert(null)).toBe(false);
    expect(adminAutorisiert(undefined)).toBe(false);
  });

  it('Cookie-Wert ist eine Ableitung mit Ablauf, nicht das Passwort', () => {
    const JETZT = Date.parse('2026-09-29T12:00:00.000Z');
    const token = adminToken(JETZT);
    expect(token).not.toContain('sehr-geheim');
    expect(token).toMatch(/^\d+\.[0-9a-f]{64}$/);
    expect(adminCookieGueltig(token, JETZT)).toBe(true);
    expect(adminCookieGueltig(token, JETZT + 11 * 60 * 60 * 1000)).toBe(true);
    // Serverseitiger Ablauf nach ADMIN_SITZUNG_SEKUNDEN – unabhängig vom Browser-Cookie.
    expect(adminCookieGueltig(token, JETZT + 13 * 60 * 60 * 1000)).toBe(false);
    // Manipulierter Ablauf oder fremde Signatur gelten nicht.
    const [, sig] = token.split('.');
    expect(adminCookieGueltig(`${JETZT + 99 * 60 * 60 * 1000}.${sig}`, JETZT)).toBe(false);
    expect(adminCookieGueltig(`${JETZT + 60_000}.${'a'.repeat(64)}`, JETZT)).toBe(false);
    expect(adminCookieGueltig('sehr-geheim')).toBe(false);
    expect(adminCookieGueltig(null)).toBe(false);
    // Anderes Passwort → andere Signatur.
    process.env['ADMIN_PASSWORT'] = 'anderes';
    expect(adminCookieGueltig(token, JETZT)).toBe(false);
  });

  it('liest das Sitzungs-Cookie aus dem Cookie-Header (URL-kodiert, zwischen anderen Cookies)', () => {
    expect(adminCookieAusKopf(`a=1; ${ADMIN_COOKIE}=abc%3D%3D; b=2`)).toBe('abc==');
    expect(adminCookieAusKopf(`${ADMIN_COOKIE}=wert=mit=gleich`)).toBe('wert=mit=gleich');
    expect(adminCookieAusKopf('a=1; b=2')).toBeNull();
    expect(adminCookieAusKopf(null)).toBeNull();
    expect(adminCookieAusKopf(`${ADMIN_COOKIE}=%E0%A4%A`)).toBeNull();
    expect(adminAnfrageAutorisiert(anfrage({ cookie: `${ADMIN_COOKIE}=${adminToken()}` }))).toBe(true);
    expect(adminAnfrageAutorisiert(anfrage({ cookie: `${ADMIN_COOKIE}=falsch` }))).toBe(false);
    expect(adminAnfrageAutorisiert(anfrage({}))).toBe(false);
  });

  it('ohne konfiguriertes Passwort nur lokal offen, auf Vercel geschlossen', () => {
    process.env['ADMIN_PASSWORT'] = '';
    expect(adminAutorisiert('irgendwas')).toBe(true);
    expect(adminCookieGueltig('irgendwas')).toBe(true);
    process.env['VERCEL'] = '1';
    expect(adminAutorisiert('irgendwas')).toBe(false);
    expect(adminCookieGueltig(adminToken())).toBe(false);
  });
});

describe('Cron-Zugang', () => {
  it('akzeptiert den Bearer-Header mit CRON_SECRET oder die Admin-Sitzung – keinen URL-Parameter', () => {
    expect(cronAutorisiert(anfrage({ authorization: 'Bearer cron-geheim' }))).toBe(true);
    expect(cronAutorisiert(anfrage({ authorization: 'Bearer falsch' }))).toBe(false);
    expect(cronAutorisiert(anfrage({ authorization: 'cron-geheim' }))).toBe(false);
    expect(cronAutorisiert(anfrage({ cookie: `${ADMIN_COOKIE}=${adminToken()}` }))).toBe(true);
    expect(cronAutorisiert(new Request('https://renten-rettung.de/api/auslieferung/cron?schluessel=sehr-geheim'))).toBe(false);
    process.env['CRON_SECRET'] = '';
    expect(cronAutorisiert(anfrage({ authorization: 'Bearer ' }))).toBe(false);
  });
});
