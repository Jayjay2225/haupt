/**
 * Import unternehmensindividueller Altjahres-Kennzahlen (Prompt 9, Teil A) aus
 * data/raw/altjahre/<insurerId>.json nach data/insurers.json.
 *
 * Regeln (Prinzip 1: jede Zahl hat eine Quelle):
 * - Jeder Wert braucht Quelle (Titel + URL oder Dokument), Fundstelle (Seite/Abschnitt) und Abrufdatum.
 * - Plausibilität 0–15 %; Sprung > 3 Prozentpunkte zum Nachbarjahr oder abweichende Zweitlesung
 *   → data/raw/altjahre/REVIEW.md, kein Import (außer der Wert ist mit `geprueft: true` markiert).
 * - Vorhandene Werte werden nur mit `ersetzen: true` überschrieben, ein Primärwert nie durch einen Sekundärwert.
 * - Confidence: primär + identische Zweitlesung = high; primär ohne Zweitlesung oder sekundär = medium;
 *   sekundär ohne Zweitlesung = low.
 *
 * Aufruf: node --experimental-strip-types scripts/import-altjahre.ts check   (nur prüfen, REVIEW.md schreiben)
 *         node --experimental-strip-types scripts/import-altjahre.ts import  (zusätzlich schreiben, data.version anheben)
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ROH = resolve(REPO, 'data/raw/altjahre');
const DATEN_PFAD = resolve(REPO, 'data/insurers.json');
const REVIEW_PFAD = resolve(ROH, 'REVIEW.md');

type Feld = 'nettoverzinsung' | 'laufendeDurchschnittsverzinsung';
const FELDER: Feld[] = ['nettoverzinsung', 'laufendeDurchschnittsverzinsung'];

interface QuelleRoh {
  typ?: 'primary' | 'secondary';
  titel?: string;
  url?: string;
  dokument?: string;
  abrufdatum?: string;
  hinweis?: string;
}

interface WertRoh {
  jahr: number;
  nettoverzinsung?: number | null;
  laufendeDurchschnittsverzinsung?: number | null;
  fundstelle?: string;
  quelle?: QuelleRoh;
  lesung2?: { nettoverzinsung?: number | null; laufendeDurchschnittsverzinsung?: number | null };
  geprueft?: boolean;
  ersetzen?: boolean;
  hinweis?: string;
}

interface DateiRoh {
  insurerId: string;
  quelle?: QuelleRoh;
  werte: WertRoh[];
}

interface Kennzahl {
  wert: number;
  einheit: '%';
  quelle: { typ: 'primary' | 'secondary' | 'estimate'; titel: string; url?: string; dokument?: string; fundstelle?: string; abrufdatum?: string; hinweis?: string };
  confidence: 'high' | 'medium' | 'low';
}

interface Daten {
  data: { version: string; stand: string; changelog: { version: string; datum: string; aenderung: string }[] };
  insurers: { id: string; kanonischerName: string; kennzahlen: Record<string, Partial<Record<Feld, Kennzahl>> & Record<string, unknown>> }[];
}

interface Problem {
  gesellschaft: string;
  jahr: number;
  feld: Feld;
  wert: number | null;
  problem: string;
  datei: string;
}

interface Kandidat {
  insurer: Daten['insurers'][number];
  jahr: number;
  feld: Feld;
  kennzahl: Kennzahl;
}

const befehl = process.argv[2] ?? 'check';
if (befehl !== 'check' && befehl !== 'import') {
  console.error('Aufruf: import-altjahre.ts check | import');
  process.exit(1);
}

const daten = JSON.parse(readFileSync(DATEN_PFAD, 'utf8')) as Daten;
const proId = new Map(daten.insurers.map((v) => [v.id, v]));
const dateien = existsSync(ROH)
  ? readdirSync(ROH)
      .filter((f) => f.endsWith('.json') && f !== 'VORLAGE.json')
      .sort()
  : [];

const probleme: Problem[] = [];
const kandidaten: Kandidat[] = [];
let uebersprungen = 0;

for (const dateiName of dateien) {
  const roh = JSON.parse(readFileSync(resolve(ROH, dateiName), 'utf8')) as DateiRoh;
  const insurer = proId.get(roh.insurerId);
  if (insurer === undefined) {
    throw new Error(`${dateiName}: unbekannte insurerId „${roh.insurerId}“ (ids siehe data/insurers.json).`);
  }
  const eigeneWerte = new Map<Feld, Map<number, number>>(FELDER.map((f) => [f, new Map()]));
  for (const w of roh.werte) {
    for (const feld of FELDER) {
      const v = w[feld];
      if (typeof v === 'number') {
        eigeneWerte.get(feld)!.set(w.jahr, v);
      }
    }
  }
  const nachbar = (feld: Feld, jahr: number): number | undefined =>
    eigeneWerte.get(feld)!.get(jahr) ?? insurer.kennzahlen[String(jahr)]?.[feld]?.wert;

  for (const w of roh.werte) {
    const quelle: QuelleRoh = { ...roh.quelle, ...w.quelle };
    const typ = quelle.typ ?? 'primary';
    for (const feld of FELDER) {
      const wert = w[feld];
      if (wert === undefined || wert === null) {
        continue;
      }
      const melde = (problem: string) => {
        probleme.push({ gesellschaft: insurer.kanonischerName, jahr: w.jahr, feld, wert, problem, datei: dateiName });
      };
      const fehlend: string[] = [];
      if (!quelle.titel) fehlend.push('quelle.titel');
      if (!quelle.url && !quelle.dokument) fehlend.push('quelle.url oder quelle.dokument');
      if (!quelle.abrufdatum) fehlend.push('quelle.abrufdatum');
      if (!w.fundstelle) fehlend.push('fundstelle');
      if (fehlend.length > 0) {
        melde(`Quellenangabe unvollständig: ${fehlend.join(', ')}`);
        continue;
      }
      if (!(wert > 0 && wert <= 15)) {
        melde('außerhalb der Plausibilitätsgrenzen 0–15 %');
        continue;
      }
      const zweit = w.lesung2?.[feld];
      if (typeof zweit === 'number' && Math.abs(zweit - wert) > 0.001) {
        melde(`Zweitlesung abweichend (${zweit} statt ${wert}) – am Dokument klären`);
        continue;
      }
      if (!w.geprueft) {
        const spruenge = [w.jahr - 1, w.jahr + 1]
          .map((j) => ({ j, n: nachbar(feld, j) }))
          .filter((x) => x.n !== undefined && Math.abs(x.n - wert) > 3);
        if (spruenge.length > 0) {
          melde(`Sprung > 3 Prozentpunkte zu ${spruenge.map((s) => `${s.j} (${s.n})`).join(', ')} – prüfen, dann geprueft: true`);
          continue;
        }
      }
      const vorhanden = insurer.kennzahlen[String(w.jahr)]?.[feld];
      if (vorhanden !== undefined) {
        if (!w.ersetzen) {
          uebersprungen += 1;
          continue;
        }
        if (vorhanden.quelle.typ === 'primary' && typ === 'secondary') {
          melde('vorhandener Primärwert darf nicht durch Sekundärwert ersetzt werden');
          continue;
        }
      }
      const confidence: Kennzahl['confidence'] =
        typ === 'primary' ? (typeof zweit === 'number' ? 'high' : 'medium') : typeof zweit === 'number' ? 'medium' : 'low';
      const kennzahl: Kennzahl = {
        wert,
        einheit: '%',
        quelle: {
          typ,
          titel: quelle.titel!,
          ...(quelle.url ? { url: quelle.url } : {}),
          ...(quelle.dokument ? { dokument: quelle.dokument } : {}),
          fundstelle: w.fundstelle!,
          abrufdatum: quelle.abrufdatum!,
          ...(quelle.hinweis || w.hinweis ? { hinweis: [quelle.hinweis, w.hinweis].filter(Boolean).join(' ') } : {}),
        },
        confidence,
      };
      kandidaten.push({ insurer, jahr: w.jahr, feld, kennzahl });
    }
  }
}

// REVIEW.md immer schreiben (auch leer), damit der Stand sichtbar ist.
const heute = new Date().toISOString().slice(0, 10);
const review = [
  '# Review Altjahres-Werte',
  '',
  `Automatisch erzeugt von \`scripts/import-altjahre.ts\` am ${heute}. Aufgeführte Werte wurden **nicht** importiert; Klärung am Dokument, dann Datei korrigieren (bzw. \`geprueft: true\`) und erneut ausführen.`,
  '',
];
if (probleme.length === 0) {
  review.push('Keine offenen Punkte.');
} else {
  review.push('| Gesellschaft | Jahr | Feld | Wert | Problem | Datei |', '|---|---|---|---|---|---|');
  for (const p of probleme) {
    review.push(`| ${p.gesellschaft} | ${p.jahr} | ${p.feld} | ${p.wert ?? '–'} | ${p.problem} | ${p.datei} |`);
  }
}
writeFileSync(REVIEW_PFAD, `${review.join('\n')}\n`);

console.log(
  `${dateien.length} Datei(en), ${kandidaten.length} importierbare Werte, ${uebersprungen} bereits vorhanden (ohne ersetzen), ${probleme.length} Punkte in data/raw/altjahre/REVIEW.md`,
);

if (befehl === 'import' && kandidaten.length > 0) {
  const gesellschaften = new Set<string>();
  for (const k of kandidaten) {
    const eintrag = k.insurer.kennzahlen[String(k.jahr)] ?? {};
    eintrag[k.feld] = k.kennzahl;
    k.insurer.kennzahlen[String(k.jahr)] = eintrag;
    gesellschaften.add(k.insurer.id);
  }
  for (const v of daten.insurers) {
    v.kennzahlen = Object.fromEntries(Object.entries(v.kennzahlen).sort(([a], [b]) => Number(a) - Number(b)));
  }
  const [major = 0, minor = 0] = daten.data.version.split('.').map(Number);
  daten.data.version = `${major}.${minor + 1}.0`;
  daten.data.stand = heute;
  daten.data.changelog.push({
    version: daten.data.version,
    datum: heute,
    aenderung: `Altjahres-Kennzahlen importiert: ${kandidaten.length} Werte für ${gesellschaften.size} Gesellschaft(en) aus data/raw/altjahre (scripts/import-altjahre.ts).`,
  });
  writeFileSync(DATEN_PFAD, `${JSON.stringify(daten, null, 2)}\n`);
  console.log(`geschrieben → data.version ${daten.data.version}; danach pnpm data:check ausführen.`);
} else if (befehl === 'import') {
  console.log('nichts zu schreiben.');
}
