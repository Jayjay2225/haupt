import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { berechneRueckabwicklung } from '@rueckab/calc';
import type { CalcResultAlt, ContractInput, InsurersDaten, RiskDefaults } from '@rueckab/calc';
import { pruefeEignung } from '@rueckab/eligibility';
import type { Regelwerk } from '@rueckab/eligibility';
import { renderBerichtHtml, type BerichtInput } from '../src/template';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const daten = JSON.parse(readFileSync(resolve(REPO, 'data/insurers.json'), 'utf8')) as InsurersDaten;
const defaults = JSON.parse(readFileSync(resolve(REPO, 'data/risk-defaults.json'), 'utf8')) as RiskDefaults;
const regelwerk = JSON.parse(readFileSync(resolve(REPO, 'data/legal-rules.json'), 'utf8')) as Regelwerk;

function beispielBericht(kundenname = 'Erika Beispiel'): BerichtInput {
  const contract: ContractInput = {
    versichererId: 'unbekannt',
    vertragsart: 'private-rv',
    beginn: '2004-12',
    zahlweise: 'jaehrlich',
    erstbeitrag: { betrag: 1200, waehrung: 'EUR' },
    dynamik: { aktiv: false },
    gesamtsummeLautMitteilung: 25600,
    status: 'laufend',
    rueckkaufswert: { betrag: 39857 },
    eintrittsalter: 40,
    stichtag: '2026-09',
  };
  const calc = berechneRueckabwicklung(contract, daten, defaults) as CalcResultAlt;
  const eligibility = pruefeEignung(
    {
      vertragsschluss: '2004-12',
      vertragsart: 'private-rv',
      zustandekommen: 'policenmodell',
      belehrungVorhanden: 'unbekannt',
      belehrungFrist: 'unbekannt',
      belehrungForm: 'unbekannt',
      hervorhebung: 'unbekannt',
      status: 'laufend',
      abgetretenOderBeliehen: 'nein',
      auszahlungenErhalten: 'nein',
    },
    regelwerk,
  );
  return {
    marke: '[MARKE]',
    aktenzeichen: 'TEST-1',
    kundenname,
    erstelltAm: '2026-09-18',
    versichererAnzeigename: 'nicht benannt',
    contract,
    calc,
    eligibility,
  };
}

describe('Berichts-Template', () => {
  const html = renderBerichtHtml(beispielBericht());

  it('enthält genau sieben Seiten-Abschnitte', () => {
    expect(html.match(/class="seite"/g)).toHaveLength(7);
  });

  it('zeigt Hauptzahl, Spanne, Rückkaufswert-Vergleich und Kein-Vorteil-Aussage', () => {
    expect(html).toContain('Geschätzter Rückabwicklungswert (Basis-Szenario)');
    expect(html).toContain('Spanne der Szenarien Min–Max');
    expect(html).toContain('aktueller Rückkaufswert');
    expect(html).toContain('wirtschaftlich kein Vorteil erkennbar');
  });

  it('weist Versionen und Datenstand aus', () => {
    expect(html).toContain(daten.data.version);
    expect(html).toContain('Rechenkern');
    expect(html).toContain('Regelwerk');
  });

  it('nennt Aktenzeichen der Rechtsprechung samt Quellen-Vorbehalt', () => {
    expect(html).toContain('IV ZR 76/11');
    expect(html).toContain('C-209/12');
    expect(html).toContain('Volltext-Spiegeln');
  });

  it('verwendet vorsichtiges Wording ohne Anspruchszusagen', () => {
    expect(html).not.toMatch(/steht Ihnen zu|garantiert|sicherer Anspruch/i);
    expect(html).toContain('keine Rechtsberatung');
    expect(html).toContain('Schätzung');
  });

  it('formatiert Beträge nach de-DE', () => {
    expect(html).toContain('39.857,00');
  });

  it('escapet Nutzereingaben', () => {
    const boese = renderBerichtHtml(beispielBericht('<script>alert(1)</script>'));
    expect(boese).not.toContain('<script>alert(1)</script>');
    expect(boese).toContain('&lt;script&gt;');
  });

  it('lehnt Verträge außerhalb des Alt-Regimes ab', () => {
    const b = beispielBericht();
    const neu = { ...b, calc: { ...b.calc, regime: 'neu-2008' } as unknown as CalcResultAlt };
    expect(() => renderBerichtHtml(neu)).toThrow(/Altverträge/);
  });
});
