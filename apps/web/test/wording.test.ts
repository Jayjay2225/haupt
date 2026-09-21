/**
 * Verbotslisten-Test (Prompt 8, Aufgabe 1 und 3): Alle Oberflächentexte der
 * Website und die E-Mail-Vorlagen dürfen keine Versprechen, keine
 * Verknappung, keine Aufsichts-/Erlaubnisangaben, keinen Aufkäufer-Bezug mit
 * Prozent-Mehrerlöse, keine Emojis und keine Prozentangaben auf der Ankaufsseite
 * enthalten. Der Test liest die Quelltexte direkt.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ampelFertig, berichtVersand, bestaetigungAdresse, erinnerung, spaeterWeitermachen } from '../lib/emails';

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
  join(WEB, 'lib', 'ampel.ts'),
  join(WEB, 'lib', 'emails.ts'),
  join(WEB, 'lib', 'draft.ts'),
  join(WEB, 'lib', 'labels.ts'),
  join(WEB, 'config', 'brand.ts'),
  join(WEB, 'config', 'business.ts'),
];

const VERBOTEN: { muster: RegExp; grund: string }[] = [
  { muster: /bis zu\s*\d/i, grund: '„bis zu … %“-Versprechen' },
  { muster: /garantier/i, grund: '„garantiert“' },
  { muster: /sichern Sie sich/i, grund: 'Verkaufsdruck „sichern Sie sich“' },
  { muster: /steht Ihnen zu/i, grund: 'Anspruchszusage „steht Ihnen zu“' },
  { muster: /nur heute|nur noch heute|nur für kurze Zeit|letzte Chance/i, grund: 'Zeitdruck/Verknappung' },
  { muster: /vorher.{0,20}nachher/i, grund: 'Vorher-Nachher-Versprechen' },
  { muster: /BaFin|Bundesanstalt für Finanzdienstleistungsaufsicht/i, grund: 'Aufsichtsbezug im Ankauf-Kontext' },
  { muster: /\bErlaubnis\b|\bZulassung\b|\bzugelassen\b/i, grund: 'Erlaubnis-/Zulassungsangabe' },
  { muster: /Wirtschaftsprüfer/i, grund: 'Abwicklungspartner sind Organisationspartner' },
  // „Mehrerlös“ ist seit 21.09.2026 auf Wunsch des Auftraggebers erlaubt („Jeglicher
  // Mehrerlös bleibt bei Ihnen“); verboten bleiben Prozentangaben dazu und die
  // Nennung des Aufkäufers (eigener Test für die Ankaufsseite unten).
  { muster: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, grund: 'Emoji als Symbol' },
];

/** Quelltext ohne Kommentare – geprüft wird nur, was Nutzer sehen können. */
function textInhalt(datei: string): string {
  return readFileSync(datei, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

describe('Verbotsliste (Website und E-Mails)', () => {
  it('kein verbotener Ausdruck in Oberflächentexten', () => {
    const treffer: string[] = [];
    for (const datei of OBERFLAECHE) {
      const inhalt = textInhalt(datei);
      for (const { muster, grund } of VERBOTEN) {
        const m = muster.exec(inhalt);
        if (m !== null) {
          treffer.push(`${datei.replace(WEB, 'apps/web')}: ${grund} („${m[0]}“)`);
        }
      }
    }
    expect(treffer).toEqual([]);
  });

  // „Anspruch errechnen“ / „Ansprüche durchsetzen“ sind seit 21.09.2026 auf Wunsch des
  // Auftraggebers erlaubt (anwaltlich zu prüfen, LEGAL-OPEN-QUESTIONS Nr. 18). Verboten
  // bleibt die bezifferte Zusage: „Anspruch von/in Höhe von … €“ und „steht Ihnen zu“.
  it('kein bezifferter Anspruch („Anspruch in Höhe von … €“)', () => {
    const treffer: string[] = [];
    for (const datei of OBERFLAECHE) {
      const inhalt = textInhalt(datei);
      const muster = /Anspruch\w*\s+(von|in Höhe von)\s*[\d.]+/gi;
      let m: RegExpExecArray | null;
      while ((m = muster.exec(inhalt)) !== null) {
        treffer.push(`${datei.replace(WEB, 'apps/web')}: „${m[0]}“`);
      }
    }
    expect(treffer).toEqual([]);
  });

  it('Ankaufsseite ohne Prozentangaben und ohne Namen eines Aufkäufers', () => {
    const inhalt = textInhalt(join(WEB, 'app', 'verkaufen', 'page.tsx'));
    expect(inhalt).not.toMatch(/%|Prozent/);
    // Rechtsformkürzel nur groß geschrieben prüfen (sonst trifft „Vertrag“), Namen unabhängig von der Schreibung.
    expect(inhalt).not.toMatch(/\bGmbH\b|\bAG\b|\bSE\b/);
    expect(inhalt).not.toMatch(/Policen Direkt|Partner in Life|cash\.life/i);
  });

  it('statische Überschriften haben höchstens acht Wörter', () => {
    const treffer: string[] = [];
    for (const datei of dateien(join(WEB, 'app'), ['.tsx'])) {
      const inhalt = textInhalt(datei);
      const muster = /<h1[^>]*>([\s\S]*?)<\/h1>/g;
      let m: RegExpExecArray | null;
      while ((m = muster.exec(inhalt)) !== null) {
        const roh = m[1] ?? '';
        if (roh.includes('{')) {
          continue; // dynamische Überschrift (z. B. Versicherername)
        }
        const text = roh.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        const woerter = text.split(' ').filter((w) => /[A-Za-zÄÖÜäöüß]/.test(w));
        if (woerter.length > 8) {
          treffer.push(`${datei.replace(WEB, 'apps/web')}: „${text}“ (${woerter.length} Wörter)`);
        }
      }
    }
    expect(treffer).toEqual([]);
  });

  it('E-Mail-Vorlagen bestehen die Verbotsliste', () => {
    const vorlagen = [
      bestaetigungAdresse('Erika Beispiel', 'https://renten-rettung.de/bestaetigen/abc'),
      ampelFertig('Erika Beispiel', 'Grün: Da ist mehr drin.', 'https://renten-rettung.de/rechner/ergebnis'),
      berichtVersand('Erika Beispiel', 'RR-2026-0001'),
      erinnerung('', 'https://renten-rettung.de/rechner'),
      spaeterWeitermachen('Erika Beispiel', 'https://renten-rettung.de/rechner?fortsetzen=abc'),
    ];
    for (const vorlage of vorlagen) {
      const gesamt = `${vorlage.betreff}\n${vorlage.text}`;
      for (const { muster, grund } of VERBOTEN) {
        expect(gesamt, `${vorlage.betreff}: ${grund}`).not.toMatch(muster);
      }
      expect(gesamt).not.toMatch(/\[MARKE\]/);
    }
  });

  it('kein „[MARKE]“ mehr in der Oberfläche', () => {
    for (const datei of OBERFLAECHE) {
      expect(textInhalt(datei), datei).not.toContain('[MARKE]');
    }
  });
});
