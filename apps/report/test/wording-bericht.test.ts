/**
 * Wording-Test für den PDF-Prüfbericht (Prompt 10, Abschnitt 8): Der Bericht
 * bleibt sachlich – hier gilt weiterhin die alte, strengere Liste.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '../src');
const DATEIEN = ['template.ts', 'zitate.ts'].map((d) => join(SRC, d));

const VERBOTEN: { muster: RegExp; grund: string }[] = [
  { muster: /garantier/i, grund: '„garantiert“' },
  { muster: /steht Ihnen zu/i, grund: 'Anspruchszusage' },
  { muster: /bis zu\s*\d/i, grund: '„bis zu …“-Versprechen' },
  { muster: /Mehrerlös/i, grund: 'Mehrerlös-Werbung' },
  { muster: /sichern Sie sich/i, grund: 'Verkaufsdruck' },
  { muster: /betrug|betrogen|abgezockt|abzocke/i, grund: 'Betrugs-Vorwurf' },
  { muster: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, grund: 'Emoji' },
];

function textInhalt(datei: string): string {
  return readFileSync(datei, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

describe('PDF-Prüfbericht: strenge Liste', () => {
  it('kein verbotenes Muster in Vorlage und Zitaten', () => {
    for (const datei of DATEIEN) {
      const inhalt = textInhalt(datei);
      for (const regel of VERBOTEN) {
        expect(regel.muster.test(inhalt), `${datei}: ${regel.grund}`).toBe(false);
      }
    }
  });

  it('„Anspruch“ nur verneint („kein … Anspruch“)', () => {
    for (const datei of DATEIEN) {
      const inhalt = textInhalt(datei);
      // „Nettoanspruch“ ist der Fachbegriff des Rechenkerns (geschätzter Saldo) – erlaubt.
      const muster = /(?<!Netto)Anspruch/g;
      let m: RegExpExecArray | null;
      while ((m = muster.exec(inhalt)) !== null) {
        const davor = inhalt.slice(Math.max(0, m.index - 40), m.index);
        expect(/kein/i.test(davor), `${datei}: „…${davor.slice(-25)}Anspruch“`).toBe(true);
      }
    }
  });
});
