/**
 * Freischaltcodes (Prompt 12, Abschnitt 2): überspringen die Zahlung.
 * Je Code konfigurierbar: einmalig oder mehrfach, Ablaufdatum, Partnerkennung.
 *
 * Konfiguration über die Umgebungsvariable ERSTKUNDEN_CODES, kommagetrennt.
 * Ein Eintrag ist entweder nur der Code (= einmalig, ohne Ablauf) oder
 * `CODE|einmalig|2026-12-31|partner-x` (Felder 2–4 optional, Reihenfolge fest):
 * Art (`einmalig`/`mehrfach`), Ablaufdatum (ISO, letzter gültiger Tag),
 * Partnerkennung (erscheint in der Bestellnummer nicht, nur im Log).
 *
 * Verwendete Einmal-Codes werden im Auslieferungsordner vermerkt; auf
 * Serverless-Hosting ist dieser Ordner NICHT dauerhaft – für die Beta
 * ausreichend, dokumentierte Einschränkung (docs/ERSTKUNDEN.md).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { auslieferungsVerzeichnis } from './erfuellung';

export interface FreischaltcodeInfo {
  code: string;
  art: 'einmalig' | 'mehrfach';
  /** ISO-Datum (letzter gültiger Tag); leer = ohne Ablauf. */
  ablauf: string;
  partner: string;
}

export function erstkundenCodes(): Map<string, FreischaltcodeInfo> {
  const roh = process.env['ERSTKUNDEN_CODES'] ?? '';
  const map = new Map<string, FreischaltcodeInfo>();
  for (const eintrag of roh.split(',')) {
    const [codeRoh, artRoh, ablaufRoh, partnerRoh] = eintrag.split('|').map((t) => t.trim());
    const code = (codeRoh ?? '').toUpperCase();
    if (code === '') {
      continue;
    }
    map.set(code, {
      code,
      art: artRoh?.toLowerCase() === 'mehrfach' ? 'mehrfach' : 'einmalig',
      ablauf: /^\d{4}-\d{2}-\d{2}$/.test(ablaufRoh ?? '') ? (ablaufRoh as string) : '',
      partner: partnerRoh ?? '',
    });
  }
  return map;
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

/** Gibt einen reservierten Code wieder frei (z. B. wenn die Auslieferung scheiterte). */
export function entferneCodeVerwendet(code: string): void {
  const pfad = verwendetPfad();
  if (!existsSync(pfad)) {
    return;
  }
  const liste = (JSON.parse(readFileSync(pfad, 'utf8')) as string[]).filter((c) => c !== code.toUpperCase());
  writeFileSync(pfad, `${JSON.stringify(liste, null, 2)}\n`);
}

export function codeInfo(code: string): FreischaltcodeInfo | undefined {
  return erstkundenCodes().get(code.trim().toUpperCase());
}

/** Gültig = konfiguriert, nicht abgelaufen und (bei einmalig) noch nicht verwendet. */
export function pruefeFreischaltcode(
  code: string,
  jetzt: Date = new Date(),
): 'gueltig' | 'unbekannt' | 'verbraucht' | 'abgelaufen' {
  const info = codeInfo(code);
  if (info === undefined) {
    return 'unbekannt';
  }
  if (info.ablauf !== '' && jetzt.toISOString().slice(0, 10) > info.ablauf) {
    return 'abgelaufen';
  }
  if (info.art === 'einmalig' && istCodeVerwendet(info.code)) {
    return 'verbraucht';
  }
  return 'gueltig';
}
