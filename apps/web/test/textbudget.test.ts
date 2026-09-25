/**
 * Textbudgets (Prompt 12, Abschnitt 3 – fortgeltend unter Prompt 13):
 * Hero H1 höchstens 8 Wörter + Unterzeile 25, FAQ-Antwort 40,
 * Ergebnis-Seite über dem Knopf 40 Wörter (Zeile + ggf. Rechtsweg-Satz;
 * die H1 zählt als Überschrift nicht mit – ASSUMPTIONS Nr. 53).
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { CalcResult, SzenarioErgebnis } from '@rueckab/calc';
import { RECHTSWEG_SATZ } from '../config/ampel';
import { bestimmeUebernahmeAmpel } from '../lib/ampel';

const WEB = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function woerter(text: string): number {
  const bereinigt = text.replace(/[–—·]/g, ' ').trim();
  return bereinigt === '' ? 0 : bereinigt.split(/\s+/).length;
}

function szenario(mehrwert: number | undefined): SzenarioErgebnis {
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
    nettoanspruch: 12500,
    ...(mehrwert !== undefined ? { mehrwertGegenKuendigung: mehrwert, wirtschaftlichKeinVorteil: mehrwert <= 0 } : {}),
    nutzungenProzentDerBeitraege: 30,
    nutzungenNachHerkunft: { insurer: 0, branche: 3000, fallback: 0, override: 0 },
    anteilUnternehmenswerteProzent: 0,
    zinsreihe: [],
  };
}

function calcMit(mehrwert: number | undefined): CalcResult {
  const s = szenario(mehrwert);
  return {
    szenarien: { min: s, basis: s, max: s },
    jahrestabelle: [],
    annahmen: [],
    warnungen: [],
    meta: { calcVersion: 'test', dataVersion: 'test', stichtag: '2026-09' },
  };
}

describe('Textbudgets (Prompt 12/13)', () => {
  const startseite = readFileSync(join(WEB, 'app', 'page.tsx'), 'utf8');

  it('Hero: H1 höchstens 8 Wörter, Unterzeile höchstens 25', () => {
    const h1 = /<h1>([^<]+)<\/h1>/.exec(startseite);
    expect(h1).not.toBeNull();
    expect(woerter(h1![1]!)).toBeLessThanOrEqual(8);
    const unterzeile = /className="untertitel">\s*([^<]+?)\s*<\/p>/.exec(startseite);
    expect(unterzeile).not.toBeNull();
    expect(woerter(unterzeile![1]!)).toBeLessThanOrEqual(25);
  });

  it('FAQ: sieben Fragen (Prompt 13), Antworten höchstens 40 Wörter', () => {
    const antworten = [...startseite.matchAll(/<details>\s*<summary>[^<]*(?:\{[^}]+\}[^<]*)?<\/summary>\s*<p>([\s\S]*?)<\/p>/g)];
    expect(antworten.length).toBe(7);
    for (const [, antwort] of antworten) {
      const text = antwort!.replace(/\{[^}]+\}/g, 'X').replace(/\s+/g, ' ');
      expect(woerter(text), text).toBeLessThanOrEqual(40);
    }
  });

  it('Ergebnis-Seite: über dem Knopf höchstens 40 Wörter, ohne Fall-Beträge', () => {
    const rkwGross = 50000;
    const faelle = [
      { ampel: bestimmeUebernahmeAmpel(calcMit(10000), 'laufend', rkwGross), rechtsweg: true }, // grün
      { ampel: bestimmeUebernahmeAmpel(calcMit(1000), 'laufend', rkwGross), rechtsweg: true }, // gelb
      { ampel: bestimmeUebernahmeAmpel(calcMit(0), 'laufend', rkwGross), rechtsweg: false }, // rot (Rechnung)
      { ampel: bestimmeUebernahmeAmpel(calcMit(10000), 'gekuendigt', rkwGross), rechtsweg: false }, // rot (Status)
      { ampel: bestimmeUebernahmeAmpel(calcMit(10000), 'laufend', 10000), rechtsweg: false }, // grau
    ];
    for (const { ampel, rechtsweg } of faelle) {
      const ueberDemKnopf = rechtsweg ? `${ampel.zeile} ${RECHTSWEG_SATZ}` : ampel.zeile;
      expect(woerter(ueberDemKnopf), ueberDemKnopf).toBeLessThanOrEqual(40);
      expect(woerter(ampel.titel)).toBeLessThanOrEqual(10);
    }
  });

  it('Mikrozeile und Tempo-Aussagen: 12 Stunden statt „sofort“', () => {
    expect(startseite).toContain('in 12 Stunden per E-Mail');
    expect(startseite).not.toMatch(/Ergebnis sofort/);
  });
});
