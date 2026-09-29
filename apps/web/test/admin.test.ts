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

  it('Cookie-Wert ist eine Ableitung, nicht das Passwort', () => {
    expect(adminToken()).not.toContain('sehr-geheim');
    expect(adminToken()).toMatch(/^[0-9a-f]{64}$/);
    expect(adminCookieGueltig(adminToken())).toBe(true);
    expect(adminCookieGueltig('sehr-geheim')).toBe(false);
    expect(adminCookieGueltig(null)).toBe(false);
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
