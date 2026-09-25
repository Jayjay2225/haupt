// Erzeugt src/schriften.ts mit Base64-eingebetteten Schriften aus brand/fonts/
// (Design B, Prompt 12 Abschnitt 4.5: keine Netzabfrage bei der PDF-Erzeugung).
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const hier = dirname(fileURLToPath(import.meta.url));
const fonts = resolve(hier, '../../../brand/fonts');
const b64 = (datei) => readFileSync(resolve(fonts, datei)).toString('base64');

const inhalt = `/**
 * GENERIERT durch scripts/erzeuge-schriften.mjs – nicht von Hand ändern.
 * Quelle: brand/fonts/ (Newsreader + Manrope, OFL; siehe brand/fonts/README.md).
 * Base64-Einbettung, damit die PDF-Erzeugung ohne Netzzugriff auskommt.
 */
export const NEWSREADER_WOFF2_BASE64 =
  '${b64('newsreader-latin-var.woff2')}';

export const MANROPE_WOFF2_BASE64 =
  '${b64('manrope-latin-var.woff2')}';
`;
writeFileSync(resolve(hier, '../src/schriften.ts'), inhalt);
console.log('src/schriften.ts geschrieben.');
