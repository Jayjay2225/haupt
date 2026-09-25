/**
 * Wording-Test (Prompt 12, Abschnitt 3 – die fünf harten Linien aus
 * Prompt 10 gelten weiter): Für Website, Funnel, E-Mails und Anzeigen.
 * Neu seit Prompt 12: keine Nennung von „§ 5a VVG“ oder „1994 bis 2007“
 * auf den Web-Flächen; der Zeitraum heißt einheitlich 1980 bis 2020.
 * Die alte, breitere Liste gilt für den PDF-Bericht
 * (apps/report/test/wording-bericht.test.ts). Der Test liest die Quelltexte.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { GOOGLE_BESCHREIBUNGEN, GOOGLE_UEBERSCHRIFTEN, META_HAUPTTEXT } from '../content/anzeigen';
import { BRAND, RANGE_TEXT } from '../config/brand';
import { nurVerifizierte } from '../components/Testimonials';
import { TESTIMONIALS } from '../content/testimonials';
import {
  anfrageEingegangen,
  berichtVerzoegert,
  berichtVersand,
  ergebnisLink,
  spaeterWeitermachen,
  vertragsbestaetigung,
} from '../lib/emails';

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
  join(WEB, 'config', 'ampel.ts'),
  join(WEB, 'config', 'brand.ts'),
  join(WEB, 'config', 'business.ts'),
];

/** Rechtstexte: Fachbegriffe wie „Widerspruch“ (DSGVO) bleiben dort zulässig. */
const RECHTSSEITEN = [sep + 'impressum' + sep, sep + 'datenschutz' + sep, sep + 'agb' + sep, sep + 'widerrufsbelehrung' + sep];

/**
 * Fünf harte Linien (Prompt 10, Abschnitt 1) plus Wortwahl. Linie 1 (keine
 * erfundenen Kunden) sichert der Testimonials-Test unten ab.
 */
const VERBOTEN: { muster: RegExp; grund: string; nurWerbeflaechen?: boolean }[] = [
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
  // Wortwahl und Ankauf-Regeln (Prompt 10/12, weiter gültig).
  { muster: /Gutachten/i, grund: '„Gutachten“ ist Sachverständigenbegriff – „Prüfbericht“/„Auswertung“' },
  { muster: /BaFin|Bundesanstalt für Finanzdienstleistungsaufsicht/i, grund: 'Keine Behördennennung' },
  { muster: /\bErlaubnis\b|\bZulassung\b|\bzugelassen\b/i, grund: 'Erlaubnis-/Zulassungsangabe' },
  { muster: /Wirtschaftsprüfer/i, grund: 'Abwicklungspartner sind Organisationspartner' },
  { muster: /\[MARKE\]/, grund: 'Platzhalter „[MARKE]“' },
  { muster: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, grund: 'Emoji als Symbol' },
  // Prompt 12, Abschnitt 0: Rechtsgrundlage ist auf der Website kein Thema mehr.
  { muster: /§ ?5a|5a VVG/i, grund: '§ 5a auf Web-Flächen (Prompt 12: entfällt)', nurWerbeflaechen: true },
  { muster: /1994\s*(bis|–|-|und)\s*2007/i, grund: '„1994 bis 2007“ (Prompt 12: Zeitraum ist 1980–2020)', nurWerbeflaechen: true },
  { muster: /Widerspruchsweg nicht eröffnet/i, grund: 'alter Zonen-Hinweis (Prompt 12: entfällt)' },
  // Prompt 13, Abschnitt 5: erweiterte Verbotsliste.
  { muster: /\bnur wir\b/i, grund: 'Alleinstellungs-Behauptung „nur wir“ (Prompt 13)' },
  { muster: /\b(als|die|der) einzige\w*/i, grund: 'Alleinstellungs-Behauptung „einzige“ (Prompt 13)' },
  { muster: /garantiert durchsetzen/i, grund: '„garantiert durchsetzen“ (Prompt 13)' },
  { muster: /\d[\d.]*\s*(geprüfte|Policen|Fälle|Mandate|Erfolge|Kundinnen|Kunden gewonnen)/i, grund: 'Zahl zu Erfolgen/Policen ohne Beleg-Referenz (Prompt 13)' },
  // Prompt 13, 2.1 „Gestrichen überall“:
  { muster: /Zum Mitnehmen zum Anwalt|mit dem Bericht in der Hand|Fertig für Anwalt/i, grund: 'gestrichene Anwalts-Selbsthilfe-Phrase (Prompt 13)' },
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
      const istRechtsseite = RECHTSSEITEN.some((r) => datei.includes(r));
      const inhalt = textInhalt(datei);
      for (const regel of VERBOTEN) {
        if (regel.nurWerbeflaechen === true && istRechtsseite) {
          continue;
        }
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
      ergebnisLink('https://x.example/e'),
      spaeterWeitermachen('Muster', 'https://x.example/f'),
      berichtVersand('Muster', 'RR-2026-ABCDEF', 'https://x.example/r'),
      berichtVersand('Muster', 'EK-CODE1', undefined, true),
      vertragsbestaetigung('Muster', 'RR-2026-ABCDEF', { agb: 'https://x.example/agb', widerruf: 'https://x.example/w' }),
      berichtVerzoegert('Muster', 'RR-2026-ABCDEF'),
      anfrageEingegangen('Muster'),
    ]
      .map((v) => `${v.betreff}\n${v.text}`)
      .join('\n---\n');
    for (const regel of VERBOTEN) {
      expect(regel.muster.test(texte), regel.grund).toBe(false);
    }
  });

  it('die Deck-Betreffzeilen stimmen (Prompt 12, 3.4)', () => {
    expect(ergebnisLink('x').betreff).toBe('Ihre Ampel steht');
    expect(berichtVersand('M', 'A-1').betreff).toBe('Ihr Prüfbericht ist da');
    expect(spaeterWeitermachen('M', 'x').betreff).toBe('Weitermachen, wo Sie aufgehört haben');
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
    expect(inhalt).not.toMatch(/Aufsicht/);
  });

  it('Startseite enthält keine fest verdrahteten Beträge (außer der Übernahme-Grenze 30.000 €)', () => {
    const roh = readFileSync(join(WEB, 'app', 'page.tsx'), 'utf8').replace(/30\.000\s*€/g, '');
    expect(roh).not.toMatch(/\d{1,3}\.\d{3}\s*€/);
  });

  it('„So verdienen wir“ existiert nirgends mehr – weder Text noch Route (Prompt 13, 7)', () => {
    for (const datei of OBERFLAECHE) {
      expect(textInhalt(datei), datei).not.toMatch(/So verdienen wir/);
    }
    expect(existsSync(join(WEB, 'app', 'so-verdienen-wir'))).toBe(false);
    // Offenlegung stattdessen in Impressum, Datenschutz und Einwilligung:
    expect(textInhalt(join(WEB, 'app', 'impressum', 'page.tsx'))).toContain('Offenlegung');
    expect(textInhalt(join(WEB, 'app', 'datenschutz', 'page.tsx'))).toContain('Vergütung');
    expect(textInhalt(join(WEB, 'components', 'funnel', 'ErgebnisAnsicht.tsx'))).toContain('Vergütung');
  });

  it('erwünschte Übernahme-Formulierungen sind da (Prompt 13, 5)', () => {
    const startseite = textInhalt(join(WEB, 'app', 'page.tsx'));
    expect(startseite).toContain('Wir übernehmen');
    expect(startseite.replace(/\s+/g, ' ')).toContain('müssen nichts selbst verhandeln');
    expect(textInhalt(join(WEB, 'app', 'durchsetzung', 'page.tsx'))).toContain('Wir übernehmen.');
  });

  it('Zeitraum: einheitlich 1980 bis 2020 aus config/brand.ts (Prompt 12, 0.1)', () => {
    expect(BRAND.range).toEqual({ from: 1980, to: 2020 });
    expect(RANGE_TEXT).toBe('1980 bis 2020');
    const startseite = readFileSync(join(WEB, 'app', 'page.tsx'), 'utf8');
    expect(startseite).toContain('RANGE_TEXT');
  });
});

describe('Anzeigentexte (Prompt 12, Abschnitt 6)', () => {
  it('halten die Google-Längen ein (Überschrift ≤ 30, Beschreibung ≤ 90 Zeichen)', () => {
    for (const u of GOOGLE_UEBERSCHRIFTEN) {
      expect(u.length, u).toBeLessThanOrEqual(30);
    }
    for (const b of GOOGLE_BESCHREIBUNGEN) {
      expect(b.length, b).toBeLessThanOrEqual(90);
    }
    expect(META_HAUPTTEXT.length).toBeGreaterThan(0);
  });

  it('nennen den Zeitraum 1980 bis 2020 und die neuen Übernahme-Zeilen (Prompt 13, 5)', () => {
    const alles = [...GOOGLE_UEBERSCHRIFTEN, ...GOOGLE_BESCHREIBUNGEN, META_HAUPTTEXT].join('\n');
    expect(alles).toContain('1980');
    expect(alles).toContain('2020');
    expect(alles).not.toMatch(/1994|2007/);
    expect(GOOGLE_UEBERSCHRIFTEN).toContain('Bericht in 12 Stunden');
    expect(GOOGLE_UEBERSCHRIFTEN).toContain('Wir übernehmen Ihren Fall');
    expect(alles).not.toMatch(/Ergebnis sofort/);
  });
});

describe('Kundenstimmen (Prompt 12, Abschnitt 5)', () => {
  it('rendert nichts ohne Prüfvermerk und dokumentierte Einwilligung', () => {
    expect(
      nurVerifizierte([
        {
          quote_display: 'x',
          quote_original: 'x',
          name_display: 'A',
          age: 60,
          contract_type: 'Kapitallebensversicherung',
          consent_text: '',
          consent_at: '',
          consent_channel: '',
          customer_ref: 'k-1',
          verified: true,
        },
        {
          quote_display: 'x',
          quote_original: 'x',
          name_display: 'B',
          age: 61,
          contract_type: 'private Rentenversicherung',
          consent_text: 'ok',
          consent_at: '2026-09-20T10:00:00Z',
          consent_channel: 'E-Mail',
          customer_ref: 'k-2',
          verified: false,
        },
      ]),
    ).toEqual([]);
    // Prompt 13, 0.7: Manfred und Ulla sind freigegeben und live.
    const live = nurVerifizierte(TESTIMONIALS);
    expect(live.map((t) => t.name_display).sort()).toEqual(['Manfred', 'Ulla']);
    for (const t of live) {
      expect(t.consent_at).not.toBe('');
      expect(t.customer_ref.startsWith('freigabe-')).toBe(true);
    }
  });

  it('gerenderte Stimmen brauchen alle Pflichtfelder', () => {
    for (const t of TESTIMONIALS) {
      expect(Object.keys(t).sort()).toEqual(
        ['age', 'consent_at', 'consent_channel', 'consent_text', 'contract_type', 'customer_ref', 'name_display', 'quote_display', 'quote_original', 'verified'].sort(),
      );
    }
  });
});
