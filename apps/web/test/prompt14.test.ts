/**
 * Abnahme Prompt 14 (Abschnitt 6): Ampel hochkant auf der Startseite mit
 * grünem Kaufknopf nur bei Grün/Gelb, Info-Fenster an allen Feldern, Funnel
 * mit elf Schritten ohne zweite Ampel und ohne Ergebnis-Seite, keine
 * Erwähnung einer Versicherung für Rechtskosten im Repo (außer Quellentitel
 * in data/ und dem Prompt-Archiv), kein Streichpreis, Post-Option mit
 * Admin-Spalte, Video- und Videocall-Platzhalter, Geschichten nur mit Freigabe.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AMPEL_GRAU_ETIKETT } from '../components/Ampel';
import { KAUFKNOPF_TEXT, KAUFKNOPF_UNTERZEILE } from '../components/AmpelKarte';
import { BILDER } from '../components/Platzhalter';
import { Skizze } from '../components/Skizze';
import { BERICHT_PREIS_BRUTTO_EUR, POST_VERSAND, POST_WERKTAGE_TEXT, VIDEOCALL } from '../config/business';
import { HILFETEXTE, HILFE_ZEILE } from '../content/hilfetexte';
import { GESCHICHTEN, initialen, nurFreigegebene, wortzahl } from '../content/stories';
import { AMPEL_TEXT_AUS, ROT_STATUS, ampelKartenText } from '../lib/ampel';
import { SCHRITTE } from '../lib/draft';
import { berichtVersand } from '../lib/emails';
import { LEAD_STATUS, POST_STAENDE } from '../lib/erfuellung';
import { preisblockText, preisblockZeilen } from '../lib/preisblock';
import { videocallText } from '../lib/videocall';
import { textInhalt } from './wording.test';

const WEB = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = resolve(WEB, '../..');

function quelle(...teile: string[]): string {
  return textInhalt(join(WEB, ...teile));
}

describe('Startseite: Ampel und Kaufknopf (Prompt 14, 1.1–1.3)', () => {
  const karte = quelle('components', 'AmpelKarte.tsx');
  const ampel = quelle('components', 'Ampel.tsx');
  const css = readFileSync(join(WEB, 'app', 'globals.css'), 'utf8');

  it('die Ampel ist eine hochkante Verkehrsampel als Inline-SVG mit drei Leuchten, 120×300 bzw. 96×240', () => {
    expect(karte).toContain('variante="verkehr"');
    expect(ampel).toContain('viewBox="0 0 120 300"');
    expect(ampel).toContain('className={`ampel-leuchte ampel-leuchte--${farbe}`}');
    for (const farbe of ['rot', 'gelb', 'gruen']) {
      expect(ampel).toContain(`farbe: '${farbe}'`);
    }
    expect(ampel).toContain("data-an={zustand === farbe ? 'ja' : 'nein'}");
    expect(ampel).toContain('ampel-blende');
    expect(ampel).toContain('ampel-mast');
    expect(AMPEL_GRAU_ETIKETT).toBe('zu klein für unser Verfahren');
    expect(css).toMatch(/\.ampel-verkehr \{[^}]*width: 6rem;[^}]*height: 15rem;/);
    expect(css).toMatch(/\.ampel-verkehr \{[^}]*width: 7\.5rem;[^}]*height: 18\.75rem;/);
    expect(css).toContain('--ampel-gehaeuse: #1e2a33');
    expect(css).toContain('--ampel-matt: #3a4a55');
    expect(css).toMatch(/\[data-an='ja'\] \.ampel-glow \{\s*opacity: 0\.45;/);
    expect(css).toContain('prefers-reduced-motion: reduce');
  });

  it('springt an, sobald vier Felder gültig sind (400 ms, /api/vorschau) – ohne Absenden', () => {
    expect(karte).toContain('const VERZOEGERUNG_MS = 400');
    expect(karte).toContain("fetch('/api/vorschau'");
    expect(karte).toContain('Vier Angaben. Dann sehen Sie Ihre Ampel.');
    for (const feld of ['versicherer', 'beginn', 'beitrag', 'rueckkaufswert']) {
      expect(karte).toContain(`<InfoKnopf feld="${feld}" />`);
    }
  });

  it('Kaufknopf grün, Text und Unterzeile wörtlich, nur bei Grün/Gelb aktiv, führt direkt in den Funnel', () => {
    expect(KAUFKNOPF_TEXT).toBe(`Detailliertes Gutachten bestellen · ${BERICHT_PREIS_BRUTTO_EUR} €`);
    expect(BERICHT_PREIS_BRUTTO_EUR).toBe(89);
    expect(KAUFKNOPF_UNTERZEILE).toBe('Innerhalb von 12 Stunden per E-Mail. Auf Wunsch zusätzlich per Post, kostenlos.');
    expect(karte).toContain('className="knopf kauf"');
    expect(karte).toContain('disabled={!kaufbar}');
    expect(karte).toContain("router.push('/rechner')");
    expect(karte).not.toContain('/rechner/ergebnis');
    expect(css).toContain('--cta-kauf: #1b7d45');
    expect(css).toContain('--cta-kauf-hover: #155f35');
    expect(css).toMatch(/\.knopf\.kauf \{[^}]*background: var\(--cta-kauf\);[^}]*color: #ffffff;[^}]*font-size: 1\.1875rem;[^}]*font-weight: 700;/);
  });

  it('Texte unter der Ampel je Zustand (1.2)', () => {
    expect(AMPEL_TEXT_AUS).toBe('Füllen Sie die vier Felder aus – die Ampel springt an.');
    expect(ampelKartenText(null)).toBe(AMPEL_TEXT_AUS);
    expect(ampelKartenText({ ampel: 'gruen', grund: 'uebernahme', titel: 'x', zeile: 'y' })).toBe('Grün: Ihr Vertrag kommt für unser Verfahren in Frage.');
    expect(ampelKartenText({ ampel: 'gelb', grund: 'knapp', titel: 'x', zeile: 'y' })).toBe('Gelb: knapp. Das Gutachten entscheidet.');
    expect(ampelKartenText(ROT_STATUS)).toBe('Rot. Gekündigte oder ausgezahlte Verträge übernehmen wir nicht. Lassen Sie sich dazu anwaltlich beraten.');
    expect(ampelKartenText({ ampel: 'grau', grund: 'zu-klein', titel: 'Ihr Vertrag ist für unser Verfahren zu klein.', zeile: 'Z.' })).toContain('zu klein');
  });
});

describe('„Wo finde ich das?“ (Prompt 14, 1.4)', () => {
  it('zehn Hilfetexte mit Titel, Text und passender Skizzen-Markierung; Info-Symbol 44 px', () => {
    expect(Object.keys(HILFETEXTE).sort()).toEqual(
      ['versicherer', 'beginn', 'beitrag', 'rueckkaufswert', 'dynamik', 'beitragssumme', 'vertragsart', 'status', 'auszahlungen', 'geburtsdatum'].sort(),
    );
    expect(HILFE_ZEILE).toBe('Wo finde ich das?');
    for (const [feld, hilfe] of Object.entries(HILFETEXTE)) {
      expect(hilfe.titel.trim(), feld).not.toBe('');
      expect(hilfe.text.trim(), feld).not.toBe('');
      // Die Skizze markiert die im Hilfetext benannte Zeile (oder den Kopf mit dem Versicherer-Namen).
      const svg = renderToStaticMarkup(createElement(Skizze, { art: hilfe.skizze, markierung: hilfe.markierung }));
      expect(svg, feld).toContain('class="skizze-markierung"');
      expect(svg, feld).not.toMatch(/\d{2,}[.,]\d{2,}/); // keine echten Zahlen
    }
    expect(HILFETEXTE.versicherer.text).toContain('Hamburg-Mannheimer → ERGO');
    expect(HILFETEXTE.rueckkaufswert.text).toContain('Mustertext zum Kopieren');
    expect(HILFETEXTE.geburtsdatum.text).toContain('Sparanteil');
    const css = readFileSync(join(WEB, 'app', 'globals.css'), 'utf8');
    expect(css).toMatch(/\.info-knopf \{[^}]*width: 2\.75rem;[^}]*height: 2\.75rem;/);
    const hilfe = quelle('components', 'Hilfe.tsx');
    expect(hilfe).toContain('<dialog');
    expect(hilfe).toContain('<Skizze');
    expect(hilfe).toContain('<details className="wo-finde">');
  });

  it('im Funnel steht die aufklappbare Zeile unter jedem Sachfeld', () => {
    const funnel = quelle('components', 'funnel', 'RechnerFunnel.tsx');
    expect(funnel).toContain('<WoFindeIchDas feld={hilfeFeld} />');
    expect(funnel).toContain('SCHRITT_HILFEFELD');
  });
});

describe('Funnel: elf Schritte, Ende in der Bestellung (Prompt 14, 2)', () => {
  const funnel = quelle('components', 'funnel', 'RechnerFunnel.tsx');
  const steps = quelle('components', 'funnel', 'steps.tsx');

  it('elf Schritte, „Schritt x von 11“, Einstieg nur über den grünen Knopf (startAmpel), vier Werte übernommen', () => {
    expect(SCHRITTE).toHaveLength(11);
    expect(funnel).toContain('Schritt {schrittIndex + 1} von {SCHRITTE.length}');
    expect(funnel).toContain("draft.startAmpel === ''");
    const karte = quelle('components', 'AmpelKarte.tsx');
    for (const feld of ['versicherer,', 'beginn,', 'erstbeitrag: monatsbeitrag,', 'rueckkaufswert,']) {
      expect(karte).toContain(feld);
    }
    expect(karte).toMatch(/startAmpel: ampel\.ampel === 'gruen' \? 'gruen' : 'gelb'/);
  });

  it('keine zweite Ampel und keine Ergebnis-Seite in der Privatkunden-Variante', () => {
    expect(funnel).not.toMatch(/<Ampel\b/);
    expect(funnel).not.toContain("from '../Ampel'");
    expect(funnel).toContain("router.push('/rechner/ergebnis')"); // nur Kanzlei-Variante (Eignungs-Check)
    expect(funnel).toContain('VARIANTE.berichtKostenpflichtig'); // Gate und Bestell-Schritt nur in der Privatkunden-Variante
    expect(funnel).toContain("schritt === 'bestellung'");
    const ergebnis = readFileSync(join(WEB, 'app', 'rechner', 'ergebnis', 'page.tsx'), 'utf8');
    expect(ergebnis).toContain('notFound()');
    const bestellen = readFileSync(join(WEB, 'app', 'bestellen', 'page.tsx'), 'utf8');
    expect(bestellen).toContain('startSchritt="bestellung"');
    expect(existsSync(join(WEB, 'components', 'BestellFormular.tsx'))).toBe(false);
    expect(existsSync(join(WEB, 'components', 'Schnellcheck.tsx'))).toBe(false);
  });

  it('Schritt 2 endet bei gekündigt/ausgezahlt mit dem Rot-Text – kein Kauf', () => {
    expect(funnel).toContain('data-ende="rot"');
    expect(funnel).toContain('ROT_STATUS.titel');
    expect(funnel).toContain('vertragBeendet');
  });

  it('Schritt 11: Zusammenfassung änderbar, Preisblock, Post-Häkchen, Einwilligungen, grüner Bestellknopf → Stripe Checkout', () => {
    expect(steps).toContain('<ZusammenfassungAnsicht draft={draft} />');
    expect(steps).toContain('ändern');
    expect(steps).toContain('<Preisblock kompakt />');
    expect(steps).toContain('Gutachten zusätzlich per Post (kostenlos, ${POST_WERKTAGE_TEXT})');
    expect(steps).toContain('id="einwilligungDatenschutz"');
    expect(steps).toContain('erlischt mein Widerrufsrecht');
    expect(funnel).toContain('Zahlungspflichtig bestellen · ${BERICHT_PREIS_BRUTTO_EUR} €');
    expect(funnel).toContain("'knopf kauf fix-unten'");
    expect(funnel).toContain("fetch('/api/bestellung'");
    expect(funnel).toContain('window.location.assign(daten.url)');
    const route = readFileSync(join(WEB, 'app', 'api', 'bestellung', 'route.ts'), 'utf8');
    expect(route).toContain('erstelleCheckoutSitzung({ draft, name, email, postversand: draft.postversand })');
    expect(route).toContain('pruefeBestellung(draft)');
  });

  it('Danke-Text nennt E-Mail-Adresse und, wenn gewählt, die gedruckte Fassung', () => {
    const danke = readFileSync(join(WEB, 'app', 'bestellen', 'danke', 'page.tsx'), 'utf8');
    expect(danke).toContain('Ihr Gutachten kommt innerhalb von 12 Stunden per E-Mail an');
    expect(danke).toContain('Die gedruckte Fassung ist in ${POST_WERKTAGE_TEXT} bei Ihnen.');
  });

  it('„Später weitermachen – Link per E-Mail“ ab Schritt 3', () => {
    expect(funnel).toContain('Später weitermachen – Link per E-Mail');
    expect(funnel).toMatch(/WEITERMACHEN_AB_INDEX = 2/);
  });
});

describe('Versicherung für Rechtskosten und Streichpreis (Prompt 14, 0.2 und 0.5)', () => {
  // Der gesuchte Begriff steht bewusst nirgends wörtlich im Repo – auch nicht in diesem Test.
  const RSV = new RegExp('Rechts' + 'schutz', 'i');
  const TEXT_ENDUNGEN = ['.ts', '.tsx', '.md', '.json', '.css', '.html', '.txt', '.mjs', '.js', '.yml', '.yaml', '.example'];
  const AUSGESCHLOSSEN = new Set(['node_modules', '.git', '.next', 'dist', 'out', 'coverage', 'var', 'test-results', 'playwright-report']);
  /** Erlaubt: Quellentitel in data/ (Firmenname eines Versicherers) und das Prompt-Archiv (enthält die Vorgabe selbst). */
  const ERLAUBT = [/^data\//, /^docs\/PROMPTS\.md$/];

  function alleDateien(verzeichnis: string): string[] {
    const ergebnis: string[] = [];
    for (const eintrag of readdirSync(verzeichnis)) {
      if (AUSGESCHLOSSEN.has(eintrag)) {
        continue;
      }
      const pfad = join(verzeichnis, eintrag);
      if (statSync(pfad).isDirectory()) {
        ergebnis.push(...alleDateien(pfad));
      } else if (TEXT_ENDUNGEN.some((e) => pfad.endsWith(e))) {
        ergebnis.push(pfad);
      }
    }
    return ergebnis;
  }

  it('kein Vorkommen im Repo außer Quellentiteln in data/ und dem Prompt-Archiv', () => {
    const treffer = alleDateien(REPO)
      .map((pfad) => relative(REPO, pfad))
      .filter((rel) => !ERLAUBT.some((m) => m.test(rel)))
      .filter((rel) => RSV.test(readFileSync(join(REPO, rel), 'utf8')));
    expect(treffer).toEqual([]);
  });

  it('kein Streichpreis in den Preisbausteinen (§ 11 PAngV)', () => {
    const bausteine = [
      join(WEB, 'lib', 'preisblock.ts'),
      join(WEB, 'components', 'Preisblock.tsx'),
      join(WEB, 'components', 'AmpelKarte.tsx'),
      join(WEB, 'components', 'funnel', 'steps.tsx'),
      join(WEB, 'app', 'page.tsx'),
      join(WEB, 'app', 'gutachten', 'page.tsx'),
      join(WEB, 'config', 'business.ts'),
    ];
    for (const datei of bausteine) {
      // Ohne Kommentare: geprüft wird, was gerendert werden kann.
      expect(textInhalt(datei), datei).not.toMatch(/\b119\b|<s>|<del>|line-through|Streichpreis|statt\s*\d+\s*€/i);
    }
    expect(preisblockText()).not.toMatch(/119|statt/);
    const zeilen = preisblockZeilen();
    expect(zeilen[0]).toEqual({ fett: '89 € einmalig.', rest: 'Ihr Gutachten mit Ihrer Zahl, Jahr für Jahr, mit allen Quellen.' });
    // Anrechnung nur mit PREIS_ANRECHNUNG, Vergleichssatz nur mit Quelle – beides in der Testumgebung aus.
    expect(zeilen.map((z) => z.fett + z.rest).join(' ')).not.toMatch(/angerechnet|Versicherungsmathematikern/);
  });
});

describe('Postversand (Prompt 14, 0.3 und 3)', () => {
  it('kostenlose Zusatzoption, 2–7 Werktage, Kosten je Sendung ohne geschätzten Wert, Druckdienst als Platzhalter', () => {
    expect(POST_VERSAND.aktiv).toBe(true);
    expect(POST_VERSAND.kostenlosFuerKunden).toBe(true);
    expect(POST_WERKTAGE_TEXT).toBe('2–7 Werktage');
    expect(POST_VERSAND.postKosten.jeSendungEur).toBeNull();
    expect(POST_VERSAND.druckdienst.startsWith('[[DRUCKDIENST')).toBe(true);
  });

  it('Admin-Prüfliste hat die Spalte „Post“ (gedruckt/versendet + Datum) und die Druckvorlage zum Abruf', () => {
    const admin = readFileSync(join(WEB, 'app', 'admin', 'page.tsx'), 'utf8');
    expect(admin).toContain('<th>Post</th>');
    expect(admin).toContain('action="/api/admin/post"');
    expect(admin).toContain('/api/admin/druck?');
    expect(admin).toContain('value="gedruckt"');
    expect(admin).toContain('value="versendet"');
    expect(existsSync(join(WEB, 'app', 'api', 'admin', 'post', 'route.ts'))).toBe(true);
    expect(existsSync(join(WEB, 'app', 'api', 'admin', 'druck', 'route.ts'))).toBe(true);
    expect(POST_STAENDE).toEqual(['gewuenscht', 'gedruckt', 'versendet']);
    expect(LEAD_STATUS[0]).toBe('Gutachten gekauft');
    const liste = readFileSync(join(WEB, 'lib', 'admin-liste.ts'), 'utf8');
    expect(liste).toContain("'post',");
    expect(liste).toContain("'post_am',");
  });

  it('FAQ: „Bekomme ich das Gutachten auch auf Papier?“ – Ja, kostenlos, 2–7 Werktage', () => {
    const startseite = readFileSync(join(WEB, 'app', 'page.tsx'), 'utf8');
    expect(startseite).toContain('Bekomme ich das Gutachten auch auf Papier?');
    expect(startseite).toContain('Ja, kostenlos, {POST_WERKTAGE_TEXT}. Wählen Sie das bei der Bestellung.');
  });
});

describe('Video, Videocall, Bilder (Prompt 14, 1.7–1.9)', () => {
  it('Erklärvideo-Platzhalter 16:9 mit Play-Symbol; Drehbuch ohne Beträge, Prozente oder Versprechen', () => {
    const platzhalter = quelle('components', 'Platzhalter.tsx');
    expect(platzhalter).toContain('Erklärvideo (90 Sekunden)');
    expect(platzhalter).toContain('type="video/mp4"');
    const startseite = readFileSync(join(WEB, 'app', 'page.tsx'), 'utf8');
    expect(startseite).toContain('<VideoPlatzhalter />');
    const css = readFileSync(join(WEB, 'app', 'globals.css'), 'utf8');
    expect(css).toMatch(/\.video-rahmen \{[^}]*aspect-ratio: 16 \/ 9;/);
    const drehbuch = readFileSync(join(REPO, 'docs', 'VIDEO.md'), 'utf8');
    expect(drehbuch).toContain('85');
    expect(drehbuch).toContain('Der Brief kommt');
    expect(drehbuch).toContain('Der Rückkaufswert ist nicht das letzte Wort');
    expect(drehbuch).toContain('Jetzt prüfen');
    expect(drehbuch).not.toMatch(/€|%|garantier|steht Ihnen zu/i);
  });

  it('Videocall-Satz wörtlich mit Konfigurations-Link: FAQ, /durchsetzung, letzte Zeile der Gutachten-E-Mail', () => {
    expect(VIDEOCALL.satz).toBe('Fragen? 15 Minuten am Bildschirm, kostenlos.');
    expect(VIDEOCALL.linkText).toBe('Termin wählen');
    expect(VIDEOCALL.platzhalter).toContain('[[VIDEOCALL-URL');
    expect(readFileSync(join(WEB, 'app', 'page.tsx'), 'utf8')).toContain('<VideocallSatz />');
    expect(readFileSync(join(WEB, 'app', 'durchsetzung', 'page.tsx'), 'utf8')).toContain('<VideocallSatz />');
    const mail = berichtVersand('M', 'RR-2026-ABCDEF', 'https://x.example/r');
    expect(mail.text.trim().split('\n').at(-1)).toBe(videocallText());
    expect(videocallText()).toContain('Fragen? 15 Minuten am Bildschirm, kostenlos. Termin wählen:');
  });

  it('Bilder: zwei neutrale Motive als Platzhalter, nie neben Kundenstimmen, Geschichten oder Beträgen', () => {
    expect(BILDER.ruhestand.beschreibung).toBe('Paar im Ruhestand am Küchentisch');
    expect(BILDER.enkel.beschreibung).toBe('Paar mit Enkelkindern im Garten');
    for (const bild of Object.values(BILDER)) {
      expect(bild.beschreibung).not.toMatch(/Kund/i);
    }
    const startseite = readFileSync(join(WEB, 'app', 'page.tsx'), 'utf8');
    expect(startseite).toContain('<Bildplatzhalter motiv="ruhestand" />');
    expect(startseite).toContain('<Bildplatzhalter motiv="enkel" />');
    expect(startseite).toContain('Verkaufen statt kündigen – und der Familie etwas Gutes tun.');
    for (const komponente of ['Testimonials.tsx', 'Geschichten.tsx', 'Preisblock.tsx']) {
      expect(quelle('components', komponente), komponente).not.toMatch(/Bildplatzhalter|<img/);
    }
    // Der Bild-Abschnitt „Wir übernehmen“ nennt keine Beträge.
    const abschnitt = startseite.slice(startseite.indexOf('id="warum-titel"'), startseite.indexOf('motiv="ruhestand"'));
    expect(abschnitt).not.toMatch(/\d+\s*€/);
    expect(existsSync(join(REPO, 'docs', 'LIZENZEN.md'))).toBe(true);
  });
});

describe('Geschichten (Prompt 14, 5)', () => {
  it('nur freigegebene Einträge (verified + consent_at); ohne solche bleibt die Sektion leer', () => {
    const muster = {
      title: 'T',
      story_display: 'x',
      story_original: 'x',
      name_display: 'Karin M.',
      age: 66,
      context: 'Kapitallebensversicherung, verkauft 2026',
      consent_text: 'ok',
      consent_channel: 'E-Mail',
      customer_ref: 'g-1',
    };
    expect(nurFreigegebene([{ ...muster, consent_at: '', verified: true }])).toEqual([]);
    expect(nurFreigegebene([{ ...muster, consent_at: '2026-09-20T10:00:00Z', verified: false }])).toEqual([]);
    expect(nurFreigegebene([{ ...muster, consent_at: '2026-09-20T10:00:00Z', verified: true }])).toHaveLength(1);
    expect(initialen('Karin M.')).toBe('KM');
    expect(existsSync(join(REPO, 'docs', 'GESCHICHTEN-LEITFADEN.md'))).toBe(true);
    const leitfaden = readFileSync(join(REPO, 'docs', 'GESCHICHTEN-LEITFADEN.md'), 'utf8');
    for (const frage of ['Ausgangslage', 'Moment der Entscheidung', 'Wie lief es', 'Was wurde daraus', 'Was raten Sie anderen']) {
      expect(leitfaden).toContain(frage);
    }
  });

  it('hinterlegte Geschichten: höchstens 90 Wörter, keine Beträge oder Prozente, alle Pflichtfelder', () => {
    for (const g of GESCHICHTEN) {
      expect(wortzahl(g.story_display), g.customer_ref).toBeLessThanOrEqual(90);
      expect(g.story_display, g.customer_ref).not.toMatch(/€|%|Euro|Prozent/);
      expect(Object.keys(g).sort()).toEqual(
        ['age', 'consent_at', 'consent_channel', 'consent_text', 'context', 'customer_ref', 'name_display', 'story_display', 'story_original', 'title', 'verified'].sort(),
      );
    }
    const komponente = quelle('components', 'Geschichten.tsx');
    expect(komponente).toContain('nurFreigegebene(GESCHICHTEN)');
    expect(komponente).toContain('return null');
    expect(komponente).toContain('initialen(');
  });
});
