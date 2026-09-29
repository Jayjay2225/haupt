import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { berechneRueckabwicklung } from '@rueckab/calc';
import type { ContractInput, InsurersDaten, RiskDefaults } from '@rueckab/calc';
import { pruefeEignung } from '@rueckab/eligibility';
import type { Regelwerk } from '@rueckab/eligibility';
import { GUTACHTEN_UNTERZEILE, VERKAUFEN_TITEL, renderBerichtHtml, renderDruckvorlageHtml, type BerichtInput } from '../src/template';

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

function beispielBericht(
  kundenname = 'Erika Beispiel',
  beginn = '2004-12',
  vertrag: Partial<ContractInput> = {},
  ohneRueckkaufswert = false,
): BerichtInput {
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
    ...vertrag,
  };
  if (ohneRueckkaufswert) {
    delete contract.rueckkaufswert;
  }
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

  it('Tabelle „Ihre Angaben“ zeigt deutsche Begriffe statt interner Codes', () => {
    expect(html).toContain('<td>Private Rentenversicherung</td>');
    expect(html).toContain('<td>jährlich</td>');
    expect(html).toContain('<td>laufend</td>');
    expect(html).not.toMatch(/<td>(private-rv|kapital-lv|jaehrlich|gekuendigt|einmalbeitrag)/);
    const gekuendigt = renderBerichtHtml(
      beispielBericht('Erika Beispiel', '2004-12', { status: 'gekuendigt', statusDatum: '2025-06', zahlweise: 'vierteljaehrlich' }),
    );
    expect(gekuendigt).toContain('<td>gekündigt (seit/zum 06/2025)</td>');
    expect(gekuendigt).toContain('<td>vierteljährlich</td>');
  });

  it('beendeter Vertrag mit Rückkaufswert: kein Satz „mangels Angabe“', () => {
    const gekuendigt = renderBerichtHtml(beispielBericht('Erika Beispiel', '2004-12', { status: 'gekuendigt', statusDatum: '2025-06' }));
    expect(gekuendigt).not.toContain('mangels Angabe');
    expect(gekuendigt).toContain('Bei einem beendeten Vertrag entfällt der Vergleich mit dem Rückkaufswert');
    const ohneRkw = renderBerichtHtml(beispielBericht('Erika Beispiel', '2004-12', {}, true));
    expect(ohneRkw).toContain('mangels Angabe nicht möglich');
  });

  it('Szenario-Diagramm: Balken zeigen den Netto-Wert, Basis − Rückkaufswert = Mehrwert-Balken', () => {
    const b = beispielBericht('Erika Beispiel', '2004-12', {
      rueckkaufswert: { betrag: 20000 },
      auszahlungen: [{ monat: '2020-01', betrag: 5000 }],
    });
    const basis = b.calc.szenarien.basis;
    expect(basis.erhalteneLeistungenAufgezinst).toBeGreaterThan(0);
    expect(basis.nettoanspruch).toBeLessThan(basis.rueckabwicklungswert);
    const svg = renderBerichtHtml(b);
    const wert = (label: string): number => {
      const m = new RegExp(`${label}</text>\\s*<rect[^>]*/>\\s*<text[^>]*class="svg-wert">([^<]+)</text>`).exec(svg);
      expect(m, label).not.toBeNull();
      return Number((m as RegExpExecArray)[1]!.replace(/\s*€/, '').replace(/\./g, '').replace(',', '.'));
    };
    const basisBalken = wert('Szenario Basis \\(Netto-Wert\\)');
    const rkwBalken = wert('Aktueller Rückkaufswert');
    const mehrwertBalken = wert('Mehrwert ggü. Rückkaufswert \\(Basis\\)');
    expect(basisBalken).toBeCloseTo(basis.nettoanspruch, 2);
    expect(basisBalken - rkwBalken).toBeCloseTo(basis.mehrwertGegenKuendigung as number, 1);
    expect(mehrwertBalken).toBeCloseTo(basis.mehrwertGegenKuendigung as number, 2);
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

describe('Gutachten (Prompt 14, Abschnitte 0.6 und 3)', () => {
  const html = renderBerichtHtml(beispielBericht());

  it('heißt „Gutachten“ und trägt auf Seite 1 die Unterzeile wörtlich – nie „Prüfbericht“', () => {
    expect(html).toContain('<h1>Gutachten zu Ihrer Rentenversicherung</h1>');
    expect(GUTACHTEN_UNTERZEILE).toBe(
      'Automatisierte versicherungsmathematische Auswertung auf Basis Ihrer Angaben und veröffentlichter Versichererkennzahlen – kein Sachverständigengutachten.',
    );
    expect(html).toContain(GUTACHTEN_UNTERZEILE);
    expect(html).not.toMatch(/Prüfbericht/i);
    expect(html).not.toMatch(new RegExp('Rechts' + 'schutz', 'i'));
    expect(html).not.toMatch(/öffentlich bestellt|vereidigt|staatlich anerkannt/i);
  });

  it('Kasten „Ihre Angaben und unsere Annahmen“ nach den Vertragsdaten – mit und ohne „Weiß ich nicht“-Annahmen', () => {
    expect(html).toContain('Ihre Angaben und unsere Annahmen');
    expect(html).toContain('ergänzende Annahmen aus „Weiß ich nicht“-Antworten waren nicht nötig');
    const mit = renderBerichtHtml({
      ...beispielBericht(),
      annahmenKunde: ['Annahme: Ob eine Dynamik vereinbart war, ist nicht bekannt; gerechnet wurde ohne Dynamik.'],
    });
    expect(mit).toContain('Annahme: Ob eine Dynamik vereinbart war, ist nicht bekannt; gerechnet wurde ohne Dynamik.');
    expect(mit).toContain('Jede dieser Annahmen ist im Gutachten so gekennzeichnet.');
    // Der Kasten steht auf der Seite „Ihre Angaben“ (nach den Vertragsdaten, vor dem Rechenweg).
    const kasten = mit.indexOf('Ihre Angaben und unsere Annahmen');
    expect(kasten).toBeGreaterThan(mit.indexOf('<h2>2. Ihre Angaben</h2>'));
    expect(kasten).toBeLessThan(mit.indexOf('<h2>3. Rechenweg und Annahmen</h2>'));
  });

  it('letzte Seite (Grün): „Nächster Schritt: Wir übernehmen.“ oben, darunter „Verkaufen statt kämpfen“ mit renten-rettung.de/verkaufen', () => {
    // Rückkaufswert 30.000 € → Mehrwert über der Schwelle → Grün; die Standard-Fixture (39.857 €) ist Rot.
    const gruen = renderBerichtHtml(beispielBericht('Erika Beispiel', '2004-12', { rueckkaufswert: { betrag: 30000 } }));
    expect(gruen).toContain('Grün – der Vertrag kommt für unser Verfahren in Frage');
    const letzteSeite = gruen.slice(gruen.lastIndexOf('<section class="seite">'));
    expect(letzteSeite).toContain('Nächster Schritt: Wir übernehmen.');
    expect(letzteSeite).toContain('Die Durchsetzung über uns beauftragen');
    expect(letzteSeite).toContain(VERKAUFEN_TITEL);
    expect(letzteSeite).toContain('renten-rettung.de/verkaufen');
    expect(letzteSeite.indexOf('Nächster Schritt: Wir übernehmen.')).toBeLessThan(letzteSeite.indexOf(VERKAUFEN_TITEL));
    expect(letzteSeite).toContain('Wir empfehlen keinen der Wege');
    // Kanzlei-Variante: kein Ankauf-Block.
    expect(renderBerichtHtml({ ...beispielBericht(), ankaufHinweis: false })).not.toContain(VERKAUFEN_TITEL);
  });

  it('letzte Seite (Rot/kein Vorteil): kein Übernahme-Angebot, stattdessen anwaltliche Beratung', () => {
    expect(html).toContain('Rot – rechnerisch nicht mehr drin als der Rückkaufswert');
    expect(html).not.toContain('Nächster Schritt: Wir übernehmen.');
    expect(html).not.toContain('Die Durchsetzung über uns beauftragen');
    expect(html).toContain('Nächster Schritt: anwaltliche Beratung.');
    expect(html).toContain('für unser Verfahren kommt der Vertrag nach dieser Schätzung nicht in Frage');
    // Gekündigter Vertrag: ebenfalls kein Übernahme-Angebot (Rot laut Ampel).
    const gekuendigt = renderBerichtHtml(beispielBericht('Erika Beispiel', '2004-12', { status: 'gekuendigt', statusDatum: '2025-06' }));
    expect(gekuendigt).not.toContain('Nächster Schritt: Wir übernehmen.');
    expect(gekuendigt).toContain('Nächster Schritt: anwaltliche Beratung.');
    // Der Kasten behält die Klasse, damit er die letzte Seite beginnt.
    expect(html).toContain('<div class="uebernahme">');
  });

  it('Seitenumbruch: der Übernahme-Kasten beginnt die letzte Seite, Kästen werden nie über einen Umbruch geteilt', () => {
    expect(html).toMatch(/\.uebernahme \{ break-before: page;/);
    expect(html).toMatch(/\.uebernahme, \.verkaufen, \.disclaimer, \.hinweisbox\.annahmen \{ break-inside: avoid;/);
    // Verweise auf die letzte Seite statt auf eine feste Seitennummer (die Tabellen verschieben die Seitenzahl).
    expect(html).toContain('anhand Ihrer Unterlagen (letzte Seite)');
    expect(html).not.toContain('(Seite 7)');
    // Keine festen Seitenzahlen im sichtbaren Text – Deckblatt und umbrechende Tabellen verschieben sie.
    const ohneKommentare = (s: string): string => s.replace(/<!--[\s\S]*?-->/g, '');
    expect(ohneKommentare(html)).not.toMatch(/Seite \d/);
    expect(html).toContain('(Abschnitt 2 und 3)');
    const druck = renderDruckvorlageHtml(beispielBericht(), { name: 'Erika Beispiel', strasse: 'Musterstraße 1', plz: '12345', ort: 'Musterstadt' });
    expect(ohneKommentare(druck)).not.toMatch(/Seite \d/);
    expect(druck).toContain('Abschnitt 2 und 3 des Gutachtens');
  });

  it('Druckvorlage: Deckblatt mit Name und Anschrift, alle Seiten, einseitiger Beileger zum Ankauf', () => {
    const druck = renderDruckvorlageHtml(beispielBericht(), {
      name: 'Erika Beispiel',
      strasse: 'Musterstraße 1',
      plz: '12345',
      ort: 'Musterstadt',
    });
    expect(druck.match(/<section class="seite/g)).toHaveLength(9); // Deckblatt + 7 Seiten + Beileger
    expect(druck).toContain('class="seite deckblatt"');
    expect(druck).toContain('Erika Beispiel\nMusterstraße 1\n12345 Musterstadt');
    expect(druck).toContain('Ihr Gutachten, Bestellnummer TEST-1');
    expect(druck).toContain(GUTACHTEN_UNTERZEILE);
    expect(druck).toContain('class="seite beileger"');
    expect(druck).toContain('Beileger · Verkaufen statt kämpfen');
    expect(druck).toContain('Offenlegung');
    expect(druck.indexOf('class="seite deckblatt"')).toBeLessThan(druck.indexOf('<h1>Gutachten zu Ihrer'));
    expect(druck.indexOf('<h1>Gutachten zu Ihrer')).toBeLessThan(druck.indexOf('class="seite beileger"'));
    // Beileger ohne Beträge, Prozente oder Aufkäufer-Namen (Ankauf-Regeln).
    const beileger = druck.slice(druck.indexOf('class="seite beileger"'));
    expect(beileger).not.toMatch(/\d+\s*€|%|Prozent|GmbH|\bAG\b/);
    // Deckblatt: Grün-Fixture nennt den Übernahme-Schritt, die Rot-Fixture nicht.
    expect(druck).not.toContain('letzten Seite: Wir übernehmen');
    const gruen = renderDruckvorlageHtml(beispielBericht('Erika Beispiel', '2004-12', { rueckkaufswert: { betrag: 30000 } }), {
      name: 'Erika Beispiel',
      strasse: 'Musterstraße 1',
      plz: '12345',
      ort: 'Musterstadt',
    });
    expect(gruen).toContain('letzten Seite: Wir übernehmen.');
  });

  it('Druckvorlage in der Kanzlei-Variante (ankaufHinweis=false): kein Beileger, kein Beileger-Satz auf dem Deckblatt', () => {
    const druck = renderDruckvorlageHtml(
      { ...beispielBericht(), ankaufHinweis: false },
      { name: 'Erika Beispiel', strasse: 'Musterstraße 1', plz: '12345', ort: 'Musterstadt' },
    );
    expect(druck.match(/<section class="seite/g)).toHaveLength(8); // Deckblatt + 7 Seiten
    expect(druck).not.toContain('class="seite beileger"');
    expect(druck).not.toContain('liegt ein Blatt dazu bei');
    expect(druck).not.toContain(VERKAUFEN_TITEL);
  });
});
