import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { berechneRueckabwicklung } from '@rueckab/calc';
import type { ContractInput, InsurersDaten, RiskDefaults } from '@rueckab/calc';
import { pruefeEignung } from '@rueckab/eligibility';
import type { Regelwerk } from '@rueckab/eligibility';
import { renderBerichtHtml, type BerichtInput } from '../src/template';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const daten = JSON.parse(readFileSync(resolve(REPO, 'data/insurers.json'), 'utf8')) as InsurersDaten;
const defaults = JSON.parse(readFileSync(resolve(REPO, 'data/risk-defaults.json'), 'utf8')) as RiskDefaults;
const regelwerk = JSON.parse(readFileSync(resolve(REPO, 'data/legal-rules.json'), 'utf8')) as Regelwerk;

function eligibilityFuer(beginn: string) {
  return pruefeEignung(
    {
      vertragsschluss: beginn,
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
}

function beispielBericht(kundenname = 'Erika Beispiel', beginn = '2004-12'): BerichtInput {
  const contract: ContractInput = {
    versichererId: 'unbekannt',
    vertragsart: 'private-rv',
    beginn,
    zahlweise: 'jaehrlich',
    erstbeitrag: { betrag: 1200, waehrung: 'EUR' },
    dynamik: { aktiv: false },
    gesamtsummeLautMitteilung: 25600,
    status: 'laufend',
    rueckkaufswert: { betrag: 39857 },
    eintrittsalter: 40,
    stichtag: '2026-09',
  };
  const calc = berechneRueckabwicklung(contract, daten, defaults);
  return {
    marke: 'Testmarke',
    aktenzeichen: 'TEST-1',
    kundenname,
    erstelltAm: '2026-09-25',
    versichererAnzeigename: 'nicht benannt',
    contract,
    calc,
    eligibility: eligibilityFuer(beginn),
  };
}

describe('Berichts-Template (Prompt 12)', () => {
  const html = renderBerichtHtml(beispielBericht());

  it('enthält genau sieben Seiten-Abschnitte', () => {
    expect(html.match(/class="seite"/g)).toHaveLength(7);
  });

  it('zeigt Hauptzahl, Spanne, Rückkaufswert-Vergleich und Kein-Vorteil-Aussage', () => {
    expect(html).toContain('Geschätzter Rückabwicklungswert (Basis-Szenario)');
    expect(html).toContain('Spanne der Szenarien konservativ–maximal');
    expect(html).toContain('aktueller Rückkaufswert');
    expect(html).toContain('rechnerisch kein Vorteil erkennbar');
  });

  it('enthält den Methodikabsatz (Prompt 12, 1.4) wörtlich', () => {
    expect(html).toContain('Die Berechnung folgt der Rückabwicklungsformel');
    expect(html).toContain('prüfen die spezialisierten Anwälte, mit denen wir arbeiten, anhand der Vertragsunterlagen');
    expect(html).toContain('Verhandlungsbasis mit Bandbreite');
  });

  it('weist Versionen und Datenstand aus', () => {
    expect(html).toContain(daten.data.version);
    expect(html).toContain('Rechenkern');
    expect(html).toContain('Regelwerk');
  });

  it('nennt die Methodik-Rechtsprechung, aber ohne Belehrungs-Bewertung (Verbraucherprodukt)', () => {
    expect(html).toContain('IV ZR 76/11');
    expect(html).toContain('IV ZR 513/14');
    expect(html).toContain('Volltext-Spiegeln');
    expect(html).not.toContain('Einordnung Ihres Vertrags (Eignungs-Check)');
    expect(html).not.toContain('C-209/12');
  });

  it('bettet die Schriften ein (kein Netzzugriff bei der Erzeugung)', () => {
    expect(html).toContain("font-family: 'Newsreader'");
    expect(html).toContain('data:font/woff2;base64,');
    expect(html).not.toMatch(/https?:\/\/fonts\./);
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

  it('rechnet einen 1986er-Vertrag durch und kennzeichnet Branchenjahre (estimated_branch)', () => {
    const b = beispielBericht('Erika Beispiel', '1986-05');
    expect(b.calc.szenarien.basis.zinsreihe.filter((j) => j.kennzeichen === 'estimated_branch').length).toBeGreaterThan(0);
    const alt = renderBerichtHtml(b);
    expect(alt).toContain('estimated_branch');
  });

  it('zeigt den Ansatzpunkte-Kasten nicht, solange config/ansatzpunkte.json leer ist', () => {
    expect(html).not.toContain('Typische Ansatzpunkte');
  });
});
