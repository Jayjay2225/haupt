/**
 * Wording-Test für das PDF-Gutachten (Prompt 10, Abschnitt 8; Prompt 14, 0.6):
 * Das Gutachten bleibt sachlich – hier gilt weiterhin die alte, strengere
 * Liste. Seit Prompt 14 heißt das Produkt „Gutachten“; verboten bleiben
 * „Sachverständigengutachten“ (außer verneint), „öffentlich bestellt“,
 * „vereidigt“, „staatlich anerkannt“, der alte Name „Prüfbericht“ und jede
 * Erwähnung einer Versicherung für Rechtskosten (Begriff nur zusammengesetzt,
 * damit er nirgends im Repo steht).
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '../src');
const DATEIEN = ['template.ts', 'zitate.ts', 'pdf.ts', 'erzeuge-beispiele.ts'].map((d) => join(SRC, d));

const VERBOTEN: { muster: RegExp; grund: string }[] = [
  { muster: /garantier/i, grund: '„garantiert“' },
  { muster: /steht Ihnen zu/i, grund: 'Anspruchszusage' },
  { muster: /bis zu\s*\d/i, grund: '„bis zu …“-Versprechen' },
  { muster: /Mehrerlös/i, grund: 'Mehrerlös-Werbung' },
  { muster: /sichern Sie sich/i, grund: 'Verkaufsdruck' },
  { muster: /betrug|betrogen|abgezockt|abzocke/i, grund: 'Betrugs-Vorwurf' },
  { muster: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, grund: 'Emoji' },
  {
    muster: /(?<!kein |keine |keinem |keinen )Sachverständigengutachten|öffentlich bestellt|vereidigt|staatlich anerkannt/i,
    grund: 'Sachverständigen-Anklang (Prompt 14, 0.6)',
  },
  { muster: /Prüfbericht/i, grund: 'alter Produktname „Prüfbericht“ (Prompt 14, 0.6)' },
  { muster: new RegExp('Rechts' + 'schutz', 'i'), grund: 'Versicherung für Rechtskosten entfällt (Prompt 14, 0.2)' },
];

function textInhalt(datei: string): string {
  return readFileSync(datei, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

describe('PDF-Gutachten: strenge Liste', () => {
  it('kein verbotenes Muster in Vorlage, Zitaten, Fußzeile und Beispielskript', () => {
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
