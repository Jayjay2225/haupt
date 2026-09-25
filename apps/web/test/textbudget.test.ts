/**
 * Textbudgets (Prompt 12, Abschnitt 3, Regeln wie Prompt 11):
 * Hero H1 höchstens 8 Wörter + Unterzeile 25, FAQ-Antwort 40,
 * Ergebnis-Seite über dem Knopf 40 Wörter (Zeile + Rechtsweg-Satz;
 * die H1 zählt als Überschrift nicht mit – dokumentiert in
 * docs/ASSUMPTIONS.md).
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { CalcResult, SzenarioErgebnis } from '@rueckab/calc';
import { RECHTSWEG_SATZ } from '../config/ampel';
import { bestimmeWirtschaftlicheAmpel } from '../lib/ampel';

const WEB = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function woerter(text: string): number {
  const bereinigt = text.replace(/[–—·]/g, ' ').trim();
  return bereinigt === '' ? 0 : bereinigt.split(/\s+/).length;
}

function szenario(mehrwert: number | undefined, nettoanspruch = 0): SzenarioErgebnis {
  return {
    name: 'basis',
    summeBeitraege: 10000,
    summeBuz: 0,
    summeRisiko: 500,
    summeAbschluss: 400,
    summeVerwaltung: 300,
    summeSparanteil: 8800,
    erstattungsfaehigeBeitraege: 9500,
    nutzungen: 3000,
    rueckabwicklungswert: 12500,
    erhalteneLeistungenAufgezinst: 0,
    nettoanspruch,
    ...(mehrwert !== undefined ? { mehrwertGegenKuendigung: mehrwert, wirtschaftlichKeinVorteil: mehrwert <= 0 } : {}),
    nutzungenProzentDerBeitraege: 30,
    nutzungenNachHerkunft: { insurer: 0, branche: 3000, fallback: 0, override: 0 },
    anteilUnternehmenswerteProzent: 0,
    zinsreihe: [],
  };
}

function calcMit(mehrwert: number | undefined, nettoanspruch = 0): CalcResult {
  const s = szenario(mehrwert, nettoanspruch);
  return {
    szenarien: { min: s, basis: s, max: s },
    jahrestabelle: [],
    annahmen: [],
    warnungen: [],
    meta: { calcVersion: 'test', dataVersion: 'test', stichtag: '2026-09' },
  };
}

describe('Textbudgets (Prompt 12, Abschnitt 3)', () => {
  const startseite = readFileSync(join(WEB, 'app', 'page.tsx'), 'utf8');

  it('Hero: H1 höchstens 8 Wörter, Unterzeile höchstens 25', () => {
    const h1 = /<h1>([^<]+)<\/h1>/.exec(startseite);
    expect(h1).not.toBeNull();
    expect(woerter(h1![1]!)).toBeLessThanOrEqual(8);
    const unterzeile = /className="untertitel">\s*([^<]+?)\s*<\/p>/.exec(startseite);
    expect(unterzeile).not.toBeNull();
    expect(woerter(unterzeile![1]!)).toBeLessThanOrEqual(25);
  });

  it('FAQ-Antworten: höchstens 40 Wörter', () => {
    const antworten = [...startseite.matchAll(/<details>\s*<summary>[^<]+<\/summary>\s*<p>([\s\S]*?)<\/p>/g)];
    expect(antworten.length).toBe(6); // sechs Fragen laut Deck 3.1
    for (const [, antwort] of antworten) {
      // JSX-Ausdrücke wie {BERICHT_PREIS_BRUTTO_EUR} zählen als ein Wort.
      const text = antwort!.replace(/\{[^}]+\}/g, 'X').replace(/\s+/g, ' ');
      expect(woerter(text), text).toBeLessThanOrEqual(40);
    }
  });

  it('Ergebnis-Seite: über dem Knopf höchstens 40 Wörter (Zeile + Rechtsweg-Satz), keine Euro-Beträge', () => {
    const faelle = [
      bestimmeWirtschaftlicheAmpel(calcMit(2500), 'laufend'), // grün
      bestimmeWirtschaftlicheAmpel(calcMit(80000), 'laufend'), // grün, langes Wortband
      bestimmeWirtschaftlicheAmpel(calcMit(1500), 'laufend'), // gelb
      bestimmeWirtschaftlicheAmpel(calcMit(0), 'laufend'), // rot
      bestimmeWirtschaftlicheAmpel(calcMit(undefined), 'laufend'), // kein RKW
      bestimmeWirtschaftlicheAmpel(calcMit(undefined, 2500), 'gekuendigt'), // beendet grün
    ];
    for (const ampel of faelle) {
      const ueberDemKnopf = `${ampel.zeile} ${RECHTSWEG_SATZ}`;
      expect(woerter(ueberDemKnopf), ueberDemKnopf).toBeLessThanOrEqual(40);
      expect(ampel.zeile).not.toContain('€');
      expect(ampel.titel).not.toContain('€');
    }
  });

  it('Preis-Mikrozeile der Startseite entspricht dem Deck', () => {
    expect(startseite).toContain('Ampel kostenlos');
    expect(startseite).toContain('Ergebnis sofort');
  });
});
