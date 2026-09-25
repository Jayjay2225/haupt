/**
 * Eingang für Scans aus der Bibliothek (Prompt 9, Teil B): Statistik-Bände
 * der früheren Versicherungsaufsicht (BAV-Geschäftsbericht Teil B, ab 1994)
 * und BaFin-Statistiken 2002/2003.
 *
 * Ablage: data/raw/scans/<jahr>/<name>.jpg|png (Foto der Tabellenseite) plus
 * ZWEI unabhängige Transkriptionen <name>.lesung1.json und <name>.lesung2.json
 * (Vorlage: data/raw/scans/VORLAGE.lesung.json). Automatische Texterkennung
 * ist optional: Ist `tesseract` installiert, wird je Bild <name>.ocr.txt als
 * Lesehilfe erzeugt; maßgeblich bleiben die beiden Lesungen.
 *
 * Aufrufe:
 *   pnpm data:scans            → check: Lesungen vergleichen, Plausibilität
 *                                 prüfen, data/raw/scans/REVIEW.md schreiben
 *   node --experimental-strip-types scripts/data-scans.ts import
 *                              → übereinstimmende Werte nach data/insurers.json
 *                                 (Mapping Kurzname → id: data/raw/scans/mapping.json)
 *
 * Plausibilität: 0 % ≤ Wert ≤ 15 %; Sprung zum Vorjahr > 3 Prozentpunkte →
 * Review-Liste. Lieber eine Lücke als ein geratener Wert.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCANS = resolve(REPO, 'data/raw/scans');
const DATEN_PFAD = resolve(REPO, 'data/insurers.json');
const MAPPING_PFAD = resolve(SCANS, 'mapping.json');
const REVIEW_PFAD = resolve(SCANS, 'REVIEW.md');

interface Lesung {
  band: string; // z. B. "BAV-Geschäftsbericht 1997, Teil B"
  seite: number;
  tabelle: string; // z. B. "Tabelle 13: Kennzahlen der Lebensversicherungsunternehmen"
  jahr: number; // Berichtsjahr der Werte
  leser: string; // Kürzel der Person / Sitzung
  werte: { kurzname: string; nettoverzinsung?: number | null; laufendeDurchschnittsverzinsung?: number | null }[];
}

type Feld = 'nettoverzinsung' | 'laufendeDurchschnittsverzinsung';
const FELDER: Feld[] = ['nettoverzinsung', 'laufendeDurchschnittsverzinsung'];

interface Bestaetigt {
  jahr: number;
  kurzname: string;
  feld: Feld;
  wert: number;
  band: string;
  seite: number;
  tabelle: string;
  bild: string;
}

interface ReviewEintrag {
  jahr: number;
  kurzname: string;
  feld: Feld;
  grund: string;
  bild: string;
}

function tesseractVerfuegbar(): boolean {
  try {
    execFileSync('tesseract', ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function bilder(verzeichnis: string): string[] {
  return readdirSync(verzeichnis).filter((f) => /\.(jpe?g|png|tiff?)$/i.test(f));
}

function liesLesung(pfad: string): Lesung | undefined {
  if (!existsSync(pfad)) {
    return undefined;
  }
  return JSON.parse(readFileSync(pfad, 'utf8')) as Lesung;
}

function sammle(): { bestaetigt: Bestaetigt[]; review: ReviewEintrag[]; ohneLesung: string[] } {
  const bestaetigt: Bestaetigt[] = [];
  const review: ReviewEintrag[] = [];
  const ohneLesung: string[] = [];
  const ocr = tesseractVerfuegbar();

  if (!existsSync(SCANS)) {
    mkdirSync(SCANS, { recursive: true });
  }
  const jahre = readdirSync(SCANS).filter((f) => /^\d{4}$/.test(f) && statSync(join(SCANS, f)).isDirectory());
  for (const jahrOrdner of jahre) {
    const ordner = join(SCANS, jahrOrdner);
    for (const bild of bilder(ordner)) {
      const basis = bild.replace(/\.(jpe?g|png|tiff?)$/i, '');
      if (ocr && !existsSync(join(ordner, `${basis}.ocr.txt`))) {
        try {
          execFileSync('tesseract', [join(ordner, bild), join(ordner, `${basis}.ocr`), '-l', 'deu', '--psm', '6'], { stdio: 'ignore' });
        } catch {
          // Lesehilfe optional
        }
      }
      const l1 = liesLesung(join(ordner, `${basis}.lesung1.json`));
      const l2 = liesLesung(join(ordner, `${basis}.lesung2.json`));
      if (l1 === undefined || l2 === undefined) {
        ohneLesung.push(`${jahrOrdner}/${bild}`);
        continue;
      }
      const w2 = new Map(l2.werte.map((w) => [w.kurzname.trim().toUpperCase(), w]));
      for (const eintrag of l1.werte) {
        const gegen = w2.get(eintrag.kurzname.trim().toUpperCase());
        for (const feld of FELDER) {
          const a = eintrag[feld];
          const b = gegen?.[feld];
          if (a === undefined || a === null) {
            continue;
          }
          const bildPfad = `${jahrOrdner}/${bild}`;
          if (gegen === undefined || b === undefined || b === null) {
            review.push({ jahr: l1.jahr, kurzname: eintrag.kurzname, feld, grund: 'nur in einer Lesung vorhanden', bild: bildPfad });
            continue;
          }
          if (Math.abs(a - b) > 0.0001) {
            review.push({ jahr: l1.jahr, kurzname: eintrag.kurzname, feld, grund: `Lesungen weichen ab (${a} vs. ${b})`, bild: bildPfad });
            continue;
          }
          if (a < 0 || a > 15) {
            review.push({ jahr: l1.jahr, kurzname: eintrag.kurzname, feld, grund: `außerhalb 0–15 % (${a})`, bild: bildPfad });
            continue;
          }
          bestaetigt.push({ jahr: l1.jahr, kurzname: eintrag.kurzname, feld, wert: a, band: l1.band, seite: l1.seite, tabelle: l1.tabelle, bild: bildPfad });
        }
      }
    }
  }

  // Sprungprüfung zum Vorjahr (innerhalb der bestätigten Werte und gegen insurers.json).
  const daten = JSON.parse(readFileSync(DATEN_PFAD, 'utf8')) as {
    insurers: { id: string; kennzahlen: Record<string, Record<string, { wert: number }>> }[];
  };
  const mapping = existsSync(MAPPING_PFAD) ? (JSON.parse(readFileSync(MAPPING_PFAD, 'utf8')) as Record<string, string>) : {};
  const geprueft: Bestaetigt[] = [];
  for (const b of bestaetigt) {
    const vorjahr = bestaetigt.find((x) => x.kurzname === b.kurzname && x.feld === b.feld && x.jahr === b.jahr - 1);
    let vorjahrWert = vorjahr?.wert;
    if (vorjahrWert === undefined) {
      const id = mapping[b.kurzname];
      const v = daten.insurers.find((x) => x.id === id);
      vorjahrWert = v?.kennzahlen[String(b.jahr - 1)]?.[b.feld]?.wert;
    }
    if (vorjahrWert !== undefined && Math.abs(b.wert - vorjahrWert) > 3) {
      review.push({ jahr: b.jahr, kurzname: b.kurzname, feld: b.feld, grund: `Sprung zum Vorjahr > 3 Pp (${vorjahrWert} → ${b.wert})`, bild: b.bild });
      continue;
    }
    geprueft.push(b);
  }
  return { bestaetigt: geprueft, review, ohneLesung };
}

function schreibeReview(review: ReviewEintrag[], ohneLesung: string[], bestaetigt: number): void {
  const zeilen = ['# Review-Liste Scans', '', `Stand: ${new Date().toISOString().slice(0, 10)} · bestätigte Werte: ${bestaetigt} · offene Punkte: ${review.length}`, ''];
  if (ohneLesung.length > 0) {
    zeilen.push('## Bilder ohne zwei Lesungen', '', ...ohneLesung.map((b) => `- ${b}`), '');
  }
  zeilen.push('## Zu prüfen', '', '| Jahr | Kurzname | Feld | Grund | Bild |', '|---|---|---|---|---|');
  for (const r of review) {
    zeilen.push(`| ${r.jahr} | ${r.kurzname} | ${r.feld} | ${r.grund} | ${r.bild} |`);
  }
  writeFileSync(REVIEW_PFAD, `${zeilen.join('\n')}\n`);
}

const [, , befehl = 'check'] = process.argv;
const { bestaetigt, review, ohneLesung } = sammle();
schreibeReview(review, ohneLesung, bestaetigt.length);

if (befehl === 'check') {
  console.log(`Scans: ${bestaetigt.length} bestätigte Werte, ${review.length} Review-Punkte, ${ohneLesung.length} Bilder ohne zwei Lesungen → data/raw/scans/REVIEW.md`);
} else if (befehl === 'import') {
  if (!existsSync(MAPPING_PFAD)) {
    console.error('data/raw/scans/mapping.json fehlt (Kurzname → insurerId).');
    process.exit(1);
  }
  const mapping = JSON.parse(readFileSync(MAPPING_PFAD, 'utf8')) as Record<string, string>;
  const daten = JSON.parse(readFileSync(DATEN_PFAD, 'utf8')) as {
    data: { version: string; stand: string; changelog: { version: string; datum: string; aenderung: string }[] };
    insurers: { id: string; kennzahlen: Record<string, Record<string, unknown>> }[];
  };
  const heute = new Date().toISOString().slice(0, 10);
  let geschrieben = 0;
  const unbekannt = new Set<string>();
  for (const b of bestaetigt) {
    const id = mapping[b.kurzname];
    const v = daten.insurers.find((x) => x.id === id);
    if (v === undefined) {
      unbekannt.add(b.kurzname);
      continue;
    }
    const jahr = String(b.jahr);
    const eintrag = v.kennzahlen[jahr] ?? {};
    eintrag[b.feld] = {
      wert: b.wert,
      einheit: '%',
      quelle: {
        typ: 'primary',
        titel: `${b.band}, ${b.tabelle}`,
        dokument: `data/raw/scans/${b.bild}`,
        fundstelle: `S. ${b.seite}, Zeile „${b.kurzname}“ (zwei übereinstimmende Lesungen)`,
        abrufdatum: heute,
      },
      confidence: 'high',
    };
    v.kennzahlen[jahr] = eintrag;
    geschrieben += 1;
  }
  const [major = 0, minor = 0] = daten.data.version.split('.').map(Number);
  daten.data.version = `${major}.${minor + 1}.0`;
  daten.data.stand = heute;
  daten.data.changelog.push({ version: daten.data.version, datum: heute, aenderung: `${geschrieben} Werte aus Bibliotheks-Scans importiert (scripts/data-scans.ts).` });
  writeFileSync(DATEN_PFAD, `${JSON.stringify(daten, null, 2)}\n`);
  console.log(`importiert: ${geschrieben} Werte → data.version ${daten.data.version}${unbekannt.size > 0 ? `; ohne Mapping: ${[...unbekannt].join(', ')}` : ''}`);
} else {
  console.error('Aufruf: … <check|import>');
  process.exit(1);
}
