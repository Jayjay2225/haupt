/**
 * Einfache Ratenbegrenzung je Schlüssel (in der Regel die Client-IP) im
 * Prozessspeicher. Bremst Skripte und Bots auf den API-Routen; bei mehreren
 * Server-Instanzen gilt das Limit je Instanz (für eine harte Grenze später
 * ein gemeinsamer Speicher, z. B. die Datenbank).
 */
const zeitstempel = new Map<string, number[]>();
const MAX_SCHLUESSEL = 10_000;

/** true, wenn der Schlüssel im Fenster schon `maxAnfragen` Anfragen hatte. */
export function begrenzt(schluessel: string, maxAnfragen: number, fensterMs: number, jetzt: number = Date.now()): boolean {
  const aktuell = (zeitstempel.get(schluessel) ?? []).filter((t) => jetzt - t < fensterMs);
  if (aktuell.length >= maxAnfragen) {
    zeitstempel.set(schluessel, aktuell);
    return true;
  }
  aktuell.push(jetzt);
  zeitstempel.set(schluessel, aktuell);
  if (zeitstempel.size > MAX_SCHLUESSEL) {
    for (const [k, liste] of zeitstempel) {
      if (liste.every((t) => jetzt - t >= fensterMs)) {
        zeitstempel.delete(k);
      }
    }
  }
  return false;
}

/** Client-Kennung aus den üblichen Proxy-Kopfzeilen; ohne Kopfzeile ein Sammelschlüssel. */
export function clientSchluessel(request: Request): string {
  const weitergeleitet = request.headers.get('x-forwarded-for');
  const erste = weitergeleitet?.split(',')[0]?.trim();
  if (erste !== undefined && erste !== '') {
    return erste;
  }
  return request.headers.get('x-real-ip') ?? 'unbekannt';
}

/** Nur für Tests: Speicher leeren. */
export function ratenlimitZuruecksetzen(): void {
  zeitstempel.clear();
}
