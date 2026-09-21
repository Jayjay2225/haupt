/**
 * Erstkunden-Programm (Prompt 10, Abschnitt 5): 100 Freischaltcodes, Bericht
 * kostenlos gegen Feedback und optionale Zitat-Freigabe (docs/ERSTKUNDEN.md).
 *
 * Codes stehen in der Umgebungsvariable ERSTKUNDEN_CODES (kommagetrennt).
 * Verwendete Codes werden im Auslieferungsordner vermerkt; auf Serverless-
 * Hosting ist dieser Ordner NICHT dauerhaft – für die Beta ausreichend,
 * dokumentierte Einschränkung.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { auslieferungsVerzeichnis } from './erfuellung';

export function erstkundenCodes(): Set<string> {
  const roh = process.env['ERSTKUNDEN_CODES'] ?? '';
  return new Set(
    roh
      .split(',')
      .map((c) => c.trim().toUpperCase())
      .filter((c) => c !== ''),
  );
}

function verwendetPfad(): string {
  return resolve(auslieferungsVerzeichnis(), 'erstkunden-verwendet.json');
}

export function istCodeVerwendet(code: string): boolean {
  const pfad = verwendetPfad();
  if (!existsSync(pfad)) {
    return false;
  }
  const liste = JSON.parse(readFileSync(pfad, 'utf8')) as string[];
  return liste.includes(code.toUpperCase());
}

export function markiereCodeVerwendet(code: string): void {
  const pfad = verwendetPfad();
  mkdirSync(auslieferungsVerzeichnis(), { recursive: true });
  const liste = existsSync(pfad) ? (JSON.parse(readFileSync(pfad, 'utf8')) as string[]) : [];
  if (!liste.includes(code.toUpperCase())) {
    liste.push(code.toUpperCase());
    writeFileSync(pfad, `${JSON.stringify(liste, null, 2)}\n`);
  }
}

/** Gültig = konfiguriert und noch nicht verwendet. */
export function pruefeFreischaltcode(code: string): 'gueltig' | 'unbekannt' | 'verbraucht' {
  const normiert = code.trim().toUpperCase();
  if (!erstkundenCodes().has(normiert)) {
    return 'unbekannt';
  }
  return istCodeVerwendet(normiert) ? 'verbraucht' : 'gueltig';
}
