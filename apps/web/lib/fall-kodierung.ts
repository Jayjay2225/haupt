/**
 * Kodiert den Formular-Entwurf (CaseDraft) so, dass er ohne eigene Datenbank
 * durch die Zahlungsabwicklung getragen werden kann: komprimiert (deflate),
 * base64url, in Stücke von höchstens 450 Zeichen zerlegt – Stripe erlaubt je
 * Metadaten-Wert 500 Zeichen. Nach der Zahlung wird der Fall daraus
 * wiederhergestellt und der Bericht gerechnet.
 *
 * Nur serverseitig verwenden (node:zlib).
 */
import { deflateRawSync, inflateRawSync } from 'node:zlib';
import type { CaseDraft } from './draft';
import { uebernehmeBekannteFelder } from './draft';

export const TEIL_LAENGE = 450;
export const METADATEN_SCHLUESSEL = 'fall_';

export function kodiereFall(draft: CaseDraft): string[] {
  // Leerwerte weglassen – uebernehmeBekannteFelder setzt sie beim Lesen wieder.
  const kompakt: Record<string, unknown> = {};
  for (const [schluessel, wert] of Object.entries(draft)) {
    if (wert !== '' && wert !== false && wert !== undefined && wert !== null) {
      kompakt[schluessel] = wert;
    }
  }
  const kodiert = deflateRawSync(Buffer.from(JSON.stringify(kompakt), 'utf8')).toString('base64url');
  const teile: string[] = [];
  for (let i = 0; i < kodiert.length; i += TEIL_LAENGE) {
    teile.push(kodiert.slice(i, i + TEIL_LAENGE));
  }
  return teile;
}

export function dekodiereFall(teile: string[]): CaseDraft {
  const json = inflateRawSync(Buffer.from(teile.join(''), 'base64url')).toString('utf8');
  const roh: unknown = JSON.parse(json);
  if (typeof roh !== 'object' || roh === null) {
    throw new Error('Fall-Kodierung ungültig.');
  }
  return uebernehmeBekannteFelder(roh as Record<string, unknown>);
}

/** Metadaten-Felder für Stripe: fall_teile = Anzahl, fall_1 … fall_n = Inhalt. */
export function fallAlsMetadaten(draft: CaseDraft): Record<string, string> {
  const teile = kodiereFall(draft);
  const meta: Record<string, string> = { [`${METADATEN_SCHLUESSEL}teile`]: String(teile.length) };
  teile.forEach((teil, i) => {
    meta[`${METADATEN_SCHLUESSEL}${i + 1}`] = teil;
  });
  return meta;
}

export function fallAusMetadaten(meta: Record<string, string> | null | undefined): CaseDraft | undefined {
  const anzahl = Number(meta?.[`${METADATEN_SCHLUESSEL}teile`] ?? 0);
  if (!meta || !Number.isInteger(anzahl) || anzahl < 1) {
    return undefined;
  }
  const teile: string[] = [];
  for (let i = 1; i <= anzahl; i += 1) {
    const teil = meta[`${METADATEN_SCHLUESSEL}${i}`];
    if (teil === undefined) {
      return undefined;
    }
    teile.push(teil);
  }
  return dekodiereFall(teile);
}
