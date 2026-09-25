/**
 * Zugriffsschutz für Admin- und Cron-Endpunkte (Prompt 13, Abschnitt 3).
 * Beta-weit liegt zusätzlich die Basic-Auth-Middleware davor (BETA_PASSWORT).
 */

/** Admin-Zugang: ?schluessel= bzw. Formularfeld muss ADMIN_PASSWORT treffen. */
export function adminAutorisiert(schluessel: string | null | undefined): boolean {
  const admin = process.env['ADMIN_PASSWORT'] ?? '';
  if (admin === '') {
    // Ohne konfiguriertes Passwort nur lokal (Entwicklung) erlaubt.
    return process.env['VERCEL'] === undefined;
  }
  return schluessel === admin;
}

/**
 * Cron-Zugang: Vercel-Cron sendet `Authorization: Bearer ${CRON_SECRET}`;
 * alternativ zählt der Admin-Schlüssel (manueller Anstoß).
 */
export function cronAutorisiert(request: Request): boolean {
  const cronSecret = process.env['CRON_SECRET'] ?? '';
  const auth = request.headers.get('authorization') ?? '';
  if (cronSecret !== '' && auth === `Bearer ${cronSecret}`) {
    return true;
  }
  const schluessel = new URL(request.url).searchParams.get('schluessel');
  return adminAutorisiert(schluessel);
}
