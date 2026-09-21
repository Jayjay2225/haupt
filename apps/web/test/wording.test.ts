/**
 * Wording-Test (Prompt 10, Abschnitt 1 und 8): Für Website, Funnel, E-Mails
 * und Anzeigen gelten die fünf harten Linien plus Wortwahl-Regeln; die alte,
 * breitere Liste gilt nur noch für den PDF-Bericht
 * (apps/report/test/wording-bericht.test.ts). Der Test liest die Quelltexte.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { GOOGLE_BESCHREIBUNGEN, GOOGLE_UEBERSCHRIFTEN, META_HAUPTTEXT } from '../content/anzeigen';
import { nurVerifizierte } from '../components/Testimonials';
import { TESTIMONIALS } from '../content/testimonials';
import { ampelFertig, berichtVersand, bestaetigungAdresse, erinnerung, spaeterWeitermachen, vertragsbestaetigung } from '../lib/emails';

const WEB = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function dateien(verzeichnis: string, endungen: string[]): string[] {
  const ergebnis: string[] = [];
  for (const eintrag of readdirSync(verzeichnis)) {
    const pfad = join(verzeichnis, eintrag);
    if (statSync(pfad).isDirectory()) {
      ergebnis.push(...dateien(pfad, endungen));
    } else if (endungen.some((e) => pfad.endsWith(e))) {
      ergebnis.push(pfad);
    }
  }
  return ergebnis;
}

const OBERFLAECHE = [
  ...dateien(join(WEB, 'app'), ['.tsx']),
  ...dateien(join(WEB, 'components'), ['.tsx']),
  ...dateien(join(WEB, 'content'), ['.ts']),
  join(WEB, 'lib', 'ampel.ts'),
  join(WEB, 'lib', 'emails.ts'),
  join(WEB, 'lib', 'draft.ts'),
  join(WEB, 'lib', 'labels.ts'),
  join(WEB, 'lib', 'bestellung.ts'),
  join(WEB, 'lib', 'erstkunden.ts'),
  join(WEB, 'config', 'brand.ts'),
  join(WEB, 'config', 'business.ts'),
  join(WEB, 'config', 'marketing.ts'),
];

/**
 * Fünf harte Linien (Prompt 10, Abschnitt 1) plus Wortwahl. Linie 1 (keine
 * erfundenen Kunden) sichert der Testimonials-Test unten ab.
 */
const VERBOTEN: { muster: RegExp; grund: string }[] = [
  // Linie 2: keine Betrugs-Vorwürfe gegen Versicherer, auch nicht als Frage oder Zitat.
  { muster: /betrug|betrogen|abgezockt|abzocke|täuschung|getäuscht/i, grund: 'Betrugs-Vorwurf (Linie 2)' },
  // Linie 3: kein Ergebnisversprechen.
  { muster: /garantier/i, grund: '„garantiert“ (Linie 3)' },
  { muster: /steht Ihnen zu/i, grund: '„steht Ihnen zu“ (Linie 3)' },
  { muster: /Ihr Anspruch beträgt/i, grund: '„Ihr Anspruch beträgt“ (Linie 3)' },
  { muster: /(Sie (bekommen|erhalten)|erhalten Sie|bekommen Sie)\s+(garantiert|sicher|mindestens|auf jeden Fall|bis zu)/i, grund: 'Ergebnisversprechen (Linie 3)' },
  { muster: /Anspruch\w*\s+(von|in Höhe von)\s*[\d.]+/i, grund: 'bezifferter Anspruch (Linie 3)' },
  // Linie 4: keine Prozent-Versprechen außerhalb des gekennzeichneten Musterfalls.
  { muster: /bis zu\s*\d/i, grund: '„bis zu …“-Versprechen (Linie 4)' },
  { muster: /\d+\s*%\s*(mehr|Rendite)/i, grund: 'Prozent-Versprechen (Linie 4)' },
  { muster: /\d+\s*%[^.\n]{0,40}Mehrerlös|Mehrerlös[^.\n]{0,40}\d+\s*%/i, grund: 'Prozent-Mehrerlös (Linie 4)' },
  // Linie 5: keine künstliche Verknappung.
  { muster: /countdown|nur heute|nur noch heute|nur für kurze Zeit|letzte Chance|Warteliste/i, grund: 'Verknappung (Linie 5)' },
  // Wortwahl und Ankauf-Regeln (Prompt 8, weiter gültig).
  { muster: /Gutachten/i, grund: '„Gutachten“ ist Sachverständigenbegriff – „Prüfbericht“/„Auswertung“' },
  { muster: /BaFin|Bundesanstalt für Finanzdienstleistungsaufsicht/i, grund: 'Aufsichtsbezug im Ankauf-Kontext' },
  { muster: /\bErlaubnis\b|\bZulassung\b|\bzugelassen\b/i, grund: 'Erlaubnis-/Zulassungsangabe' },
  { muster: /Wirtschaftsprüfer/i, grund: 'Abwicklungspartner sind Organisationspartner' },
  { muster: /\[MARKE\]/, grund: 'Platzhalter „[MARKE]“' },
  { muster: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, grund: 'Emoji als Symbol' },
];

/** Quelltext ohne Kommentare – geprüft wird nur, was Nutzer sehen können. */
function textInhalt(datei: string): string {
  return readFileSync(datei, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

describe('Fünf harte Linien (Website, Funnel, E-Mails, Anzeigen)', () => {
  it('kein verbotenes Muster in den Oberflächentexten', () => {
    const treffer: string[] = [];
    for (const datei of OBERFLAECHE) {
      const inhalt = textInhalt(datei);
      for (const regel of VERBOTEN) {
        const m = regel.muster.exec(inhalt);
        if (m !== null) {
          treffer.push(`${datei.replace(WEB, 'apps/web')}: ${regel.grund} („${m[0]}“)`);
        }
      }
    }
    expect(treffer).toEqual([]);
  });

  it('E-Mail-Vorlagen halten die Linien ein', () => {
    const texte = [
      bestaetigungAdresse('Muster', 'https://x.example/b'),
      ampelFertig('Muster', 'Grün. Rechnerisch ist deutlich mehr drin.', 'https://x.example/e'),
      berichtVersand('Muster', 'RR-2026-ABCDEF', 'https://x.example/r'),
      berichtVersand('Muster', 'EK-CODE1', undefined, true),
      vertragsbestaetigung('Muster', 'RR-2026-ABCDEF', { agb: 'https://x.example/agb', widerruf: 'https://x.example/w' }),
      erinnerung('Muster', 'https://x.example/re'),
      spaeterWeitermachen('Muster', 'https://x.example/f'),
    ]
      .map((v) => `${v.betreff}\n${v.text}`)
      .join('\n---\n');
    for (const regel of VERBOTEN) {
      expect(regel.muster.test(texte), regel.grund).toBe(false);
    }
  });

  it('statische Überschriften bleiben kurz (höchstens acht Wörter)', () => {
    for (const datei of OBERFLAECHE.filter((d) => d.endsWith('.tsx'))) {
      const inhalt = textInhalt(datei);
      const muster = /<h1[^>]*>([^<{]+)</g;
      let m: RegExpExecArray | null;
      while ((m = muster.exec(inhalt)) !== null) {
        const text = m[1]!.trim();
        if (text !== '') {
          expect(text.split(/\s+/).length, `${datei}: „${text}“`).toBeLessThanOrEqual(8);
        }
      }
    }
  });

  it('Ankaufsseite ohne Prozentangaben und ohne Namen eines Aufkäufers', () => {
    const inhalt = textInhalt(join(WEB, 'app', 'verkaufen', 'page.tsx'));
    expect(inhalt).not.toMatch(/%|Prozent/);
    expect(inhalt).not.toMatch(/\bGmbH\b|\bAG\b|\bSE\b/);
    expect(inhalt).not.toMatch(/Policen Direkt|Partner in Life|cash\.life/i);
  });

  it('Startseite enthält keine fest verdrahteten Musterfall-Beträge', () => {
    // Alle Euro-Beträge der Beweis- und Musterfall-Kacheln kommen aus dem Rechenkern.
    const roh = readFileSync(join(WEB, 'app', 'page.tsx'), 'utf8');
    expect(roh).not.toMatch(/\d{1,3}\.\d{3}\s*€/);
  });
});

describe('Anzeigentexte (Prompt 10, Abschnitt 7)', () => {
  it('halten die Google-Längen ein (Überschrift ≤ 30, Beschreibung ≤ 90 Zeichen)', () => {
    for (const u of GOOGLE_UEBERSCHRIFTEN) {
      expect(u.length, u).toBeLessThanOrEqual(30);
    }
    for (const b of GOOGLE_BESCHREIBUNGEN) {
      expect(b.length, b).toBeLessThanOrEqual(90);
    }
    expect(META_HAUPTTEXT.length).toBeGreaterThan(0);
  });
});

describe('Kundenstimmen (Prompt 10, Abschnitt 5)', () => {
  it('rendert nichts ohne Prüfvermerk und Einwilligungs-Kennung', () => {
    expect(
      nurVerifizierte([
        { consent_id: '', verified: true, zitat: 'x', vorname: 'A', alter: 60, bundesland: 'BE' },
        { consent_id: 'c-1', verified: false, zitat: 'x', vorname: 'B', alter: 61, bundesland: 'BY' },
      ]),
    ).toEqual([]);
    // Solange es keine dokumentierten Stimmen gibt, bleibt die Liste leer.
    expect(nurVerifizierte(TESTIMONIALS)).toEqual([]);
  });
});
