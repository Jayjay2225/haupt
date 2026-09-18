#!/usr/bin/env node
/**
 * Copy-Lint: prüft alle UI-Texte gegen die Verbotsliste (Konzept, Kapitel 7).
 * Läuft als Build-Schritt; in Phase 3 prüft dieselbe Logik jede KI-Antwort.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const hier = dirname(fileURLToPath(import.meta.url));
const texteDatei = join(hier, '..', 'src', 'texte', 'de.json');

// Wortstämme, klein geschrieben; Umlaute werden vor dem Vergleich normalisiert.
const VERBOTEN = [
  'rückfall', 'rueckfall',
  'versag',
  'gescheitert', 'scheiter',
  'sünde', 'suende', 'sündig',
  'cheat',
  'schlecht',
  'schwach',
  'schuld',
  'scham', 'schäm', 'schaem',
];
// Muster mit derselben Wirkung ohne die Reizwörter (Kapitel 7.4).
const MUSTER = [
  'eigentlich solltest du',
  'schon wieder',
  'nur noch',
  'reiß dich zusammen',
  'sei stark',
  'durchhalten',
  'verkneifen',
];

const roh = readFileSync(texteDatei, 'utf8');
const texte = JSON.parse(roh);

const funde = [];
function pruefe(pfad, wert) {
  if (typeof wert === 'string') {
    const klein = wert.toLowerCase();
    for (const w of [...VERBOTEN, ...MUSTER]) {
      if (klein.includes(w)) funde.push(`${pfad}: "${wert}" enthält "${w}"`);
    }
    if (wert.includes('!')) funde.push(`${pfad}: "${wert}" enthält ein Ausrufezeichen`);
  } else if (wert && typeof wert === 'object') {
    for (const [k, v] of Object.entries(wert)) pruefe(`${pfad}.${k}`, v);
  }
}
pruefe('de', texte);

if (funde.length > 0) {
  console.error('Copy-Lint: Verstöße gegen die Wortliste (Kapitel 7):');
  for (const f of funde) console.error('  - ' + f);
  process.exit(1);
}
console.log('Copy-Lint: alle UI-Texte sauber.');
