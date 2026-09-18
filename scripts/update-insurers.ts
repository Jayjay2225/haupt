/**
 * Pflege-Skript für data/insurers.json (Prompt 2).
 *
 * Aufrufe (Node >= 22, TypeScript direkt via Strip-Types):
 *   node --experimental-strip-types scripts/update-insurers.ts check
 *     → validiert Schema und Quellenpflicht, prüft Plausibilität
 *       (Nettoverzinsung außerhalb −2 % … 9 % → Warnung) und schreibt
 *       data/COVERAGE.md neu (Vollständigkeitsreport).
 *   node --experimental-strip-types scripts/update-insurers.ts bump patch "Beschreibung"
 *     → erhöht data.version (patch|minor|major) und ergänzt die Änderungshistorie.
 *
 * Grundregel (CLAUDE.md, Prinzip 1): Jede Zahl trägt Quelle (URL/Dokument,
 * Fundstelle, Abrufdatum), source_type (primary|secondary|estimate) und
 * confidence. Das Skript verweigert das OK für Werte ohne Quelle.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DATEN_PFAD = resolve(REPO_ROOT, 'data/insurers.json');
const COVERAGE_PFAD = resolve(REPO_ROOT, 'data/COVERAGE.md');

/** Jahre, die der Datensatz je Gesellschaft abdecken soll. */
const SOLL_JAHRE_VON = 1994;
const SOLL_JAHRE_BIS = 2025;

/** Plausibilitätsgrenzen für die Nettoverzinsung in Prozent. */
const NETTOVERZINSUNG_MIN = -2;
const NETTOVERZINSUNG_MAX = 9;

export interface Quelle {
  typ: 'primary' | 'secondary' | 'estimate';
  titel: string;
  url?: string;
  dokument?: string;
  fundstelle?: string;
  abrufdatum?: string; // ISO YYYY-MM-DD
  hinweis?: string;
}

export interface Kennzahl {
  wert: number;
  einheit: '%';
  quelle: Quelle;
  confidence: 'high' | 'medium' | 'low';
}

export interface JahresKennzahlen {
  nettoverzinsung?: Kennzahl;
  laufendeDurchschnittsverzinsung?: Kennzahl;
  abschlusskostenquote?: Kennzahl;
  verwaltungskostenquote?: Kennzahl;
  deklarationGesamtverzinsung?: Kennzahl;
}

export interface Rechtsnachfolge {
  beschreibung: string;
  datum?: string;
  quelle?: Quelle;
  confidence: 'high' | 'medium' | 'low';
}

export interface Versicherer {
  id: string;
  kanonischerName: string;
  altnamen: string[];
  rechtsnachfolge: Rechtsnachfolge[];
  /** Verweis auf die Gesellschaft, deren Kennzahlen ab `abJahr` gelten. */
  kennzahlenVon?: { insurerId: string; abJahr: number; begruendung: string };
  hinweise?: string;
  kennzahlen: Record<string, JahresKennzahlen>;
}

export interface ZinsEintrag {
  gueltigAb: string; // ISO-Datum
  wert: number;
  quelle: Quelle;
}

export interface InsurersDaten {
  data: {
    version: string;
    stand: string;
    beschreibung: string;
    changelog: { version: string; datum: string; aenderung: string }[];
  };
  branchendurchschnitt: {
    beschreibung: string;
    nettoverzinsung: Record<string, Kennzahl>;
  };
  referenzzinsen: {
    basiszinsBGB247: { beschreibung: string; werte: ZinsEintrag[] };
    einlagenzins: { beschreibung: string; werte: ZinsEintrag[] };
  };
  rechnungsgrundlagen: {
    hoechstzillmersatz: { beschreibung: string; werte: ZinsEintrag[] };
    hoechstrechnungszins: { beschreibung: string; werte: ZinsEintrag[] };
  };
  insurers: Versicherer[];
}

function lese(): InsurersDaten {
  return JSON.parse(readFileSync(DATEN_PFAD, 'utf8')) as InsurersDaten;
}

function pruefeQuelle(kontext: string, quelle: Quelle | undefined, fehler: string[]): void {
  if (!quelle) {
    fehler.push(`${kontext}: Quelle fehlt.`);
    return;
  }
  if (!quelle.titel) {
    fehler.push(`${kontext}: Quelle ohne Titel.`);
  }
  if (!quelle.url && !quelle.dokument) {
    fehler.push(`${kontext}: Quelle ohne URL und ohne Dokumentangabe.`);
  }
  if (quelle.typ !== 'estimate' && !quelle.abrufdatum) {
    fehler.push(`${kontext}: Quelle ohne Abrufdatum.`);
  }
}

function pruefeKennzahl(kontext: string, kz: Kennzahl | undefined, fehler: string[], warnungen: string[]): void {
  if (!kz) {
    return;
  }
  if (typeof kz.wert !== 'number' || !Number.isFinite(kz.wert)) {
    fehler.push(`${kontext}: Wert ist keine Zahl.`);
  }
  pruefeQuelle(kontext, kz.quelle, fehler);
  if (kontext.includes('nettoverzinsung') && (kz.wert < NETTOVERZINSUNG_MIN || kz.wert > NETTOVERZINSUNG_MAX)) {
    warnungen.push(
      `${kontext}: Nettoverzinsung ${kz.wert} % außerhalb ${NETTOVERZINSUNG_MIN}…${NETTOVERZINSUNG_MAX} % – manuell prüfen.`,
    );
  }
}

interface Pruefergebnis {
  fehler: string[];
  warnungen: string[];
  daten: InsurersDaten;
}

export function pruefe(): Pruefergebnis {
  const daten = lese();
  const fehler: string[] = [];
  const warnungen: string[] = [];

  if (!/^\d+\.\d+\.\d+$/.test(daten.data.version)) {
    fehler.push('data.version ist keine semantische Version.');
  }

  for (const [jahr, kz] of Object.entries(daten.branchendurchschnitt.nettoverzinsung)) {
    pruefeKennzahl(`branchendurchschnitt.nettoverzinsung.${jahr}`, kz, fehler, warnungen);
  }
  for (const eintrag of daten.referenzzinsen.basiszinsBGB247.werte) {
    pruefeQuelle(`referenzzinsen.basiszinsBGB247 (${eintrag.gueltigAb})`, eintrag.quelle, fehler);
  }
  for (const eintrag of daten.referenzzinsen.einlagenzins.werte) {
    pruefeQuelle(`referenzzinsen.einlagenzins (${eintrag.gueltigAb})`, eintrag.quelle, fehler);
  }
  for (const eintrag of daten.rechnungsgrundlagen.hoechstzillmersatz.werte) {
    pruefeQuelle(`rechnungsgrundlagen.hoechstzillmersatz (${eintrag.gueltigAb})`, eintrag.quelle, fehler);
  }
  for (const eintrag of daten.rechnungsgrundlagen.hoechstrechnungszins.werte) {
    pruefeQuelle(`rechnungsgrundlagen.hoechstrechnungszins (${eintrag.gueltigAb})`, eintrag.quelle, fehler);
  }

  const ids = new Set<string>();
  for (const v of daten.insurers) {
    if (ids.has(v.id)) {
      fehler.push(`insurers: doppelte id "${v.id}".`);
    }
    ids.add(v.id);
    for (const [jahr, jahreswerte] of Object.entries(v.kennzahlen)) {
      for (const [name, kz] of Object.entries(jahreswerte)) {
        pruefeKennzahl(`${v.id}.${jahr}.${name}`, kz as Kennzahl, fehler, warnungen);
      }
    }
    if (v.kennzahlenVon && !daten.insurers.some((k) => k.id === v.kennzahlenVon?.insurerId)) {
      fehler.push(`${v.id}: kennzahlenVon verweist auf unbekannte id "${v.kennzahlenVon.insurerId}".`);
    }
  }

  return { fehler, warnungen, daten };
}

export function schreibeCoverage(daten: InsurersDaten): string {
  const zeilen: string[] = [];
  zeilen.push('# Vollständigkeitsreport `data/insurers.json`');
  zeilen.push('');
  zeilen.push(
    `Automatisch erzeugt von \`scripts/update-insurers.ts\` (Stand ${daten.data.stand}, data.version ${daten.data.version}). Nicht von Hand bearbeiten – Beschaffungswege stehen im Abschnitt „Beschaffung“ unten, der aus dem Feld \`hinweise\` der Gesellschaften und diesem Skript gespeist wird.`,
  );
  zeilen.push('');

  const branchenJahre = Object.keys(daten.branchendurchschnitt.nettoverzinsung)
    .map(Number)
    .sort((a, b) => a - b);
  const fehlendBranche: number[] = [];
  for (let jahr = SOLL_JAHRE_VON; jahr <= SOLL_JAHRE_BIS; jahr += 1) {
    if (!branchenJahre.includes(jahr)) {
      fehlendBranche.push(jahr);
    }
  }
  zeilen.push('## Branchendurchschnitt Nettoverzinsung');
  zeilen.push('');
  zeilen.push(
    branchenJahre.length > 0
      ? `Vorhanden: ${branchenJahre[0]}–${branchenJahre[branchenJahre.length - 1]} (${branchenJahre.length} Jahre).`
      : 'Noch keine Werte vorhanden.',
  );
  zeilen.push(
    fehlendBranche.length > 0
      ? `Fehlend (Soll ${SOLL_JAHRE_VON}–${SOLL_JAHRE_BIS}): ${fehlendBranche.join(', ')}.`
      : `Vollständig für ${SOLL_JAHRE_VON}–${SOLL_JAHRE_BIS}.`,
  );
  zeilen.push('');

  zeilen.push('## Gesellschaften');
  zeilen.push('');
  zeilen.push('| Gesellschaft | Jahre mit Nettoverzinsung | fehlende Jahre (Soll-Zeitraum) |');
  zeilen.push('|---|---|---|');
  for (const v of daten.insurers) {
    const jahre = Object.entries(v.kennzahlen)
      .filter(([, kz]) => kz.nettoverzinsung !== undefined)
      .map(([jahr]) => Number(jahr))
      .sort((a, b) => a - b);
    const fehlend: number[] = [];
    for (let jahr = SOLL_JAHRE_VON; jahr <= SOLL_JAHRE_BIS; jahr += 1) {
      if (!jahre.includes(jahr)) {
        fehlend.push(jahr);
      }
    }
    const jahreText = jahre.length > 0 ? `${jahre.length} (${jahre[0]}–${jahre[jahre.length - 1]})` : '0';
    const fehlendText =
      fehlend.length === 0
        ? '–'
        : fehlend.length > 8
          ? `${fehlend.length} Jahre (u. a. ${fehlend.slice(0, 5).join(', ')} …)`
          : fehlend.join(', ');
    zeilen.push(`| ${v.kanonischerName} | ${jahreText} | ${fehlendText} |`);
  }
  zeilen.push('');

  zeilen.push('## Beschaffung');
  zeilen.push('');
  zeilen.push(
    'Priorität der Quellen (Prompt 2): 1. Geschäftsberichte der Versicherer / Bundesanzeiger · 2. BaFin-Statistik der Erstversicherungsunternehmen (Einzelunternehmenstabellen; davor BAV-Jahresberichte) · 3. Kennzahlenseiten der Versicherer (Branchen-Kennzahlenkatalog) · 4. GDV-Statistiken · 5. Fachpublikationen (Map-Report/Franke & Bornberg, Assekurata, Zielke Research, Morgen & Morgen) als gekennzeichnete Sekundärquelle.',
  );
  zeilen.push(
    'Jahrgänge vor ca. 2005 sind meist nicht online: Beschaffungsweg dokumentieren (Bundesanzeiger-Archiv, Bibliothek/ZBW, schriftliche Anfrage beim Versicherer bzw. Run-off-Plattform) statt schätzen.',
  );
  zeilen.push('');
  for (const v of daten.insurers) {
    if (v.hinweise) {
      zeilen.push(`- **${v.kanonischerName}:** ${v.hinweise}`);
    }
  }
  zeilen.push('');

  const text = zeilen.join('\n');
  writeFileSync(COVERAGE_PFAD, text);
  return text;
}

function bump(art: string, beschreibung: string): void {
  const daten = lese();
  const [major = 0, minor = 0, patch = 0] = daten.data.version.split('.').map(Number);
  let neu: string;
  if (art === 'major') {
    neu = `${major + 1}.0.0`;
  } else if (art === 'minor') {
    neu = `${major}.${minor + 1}.0`;
  } else {
    neu = `${major}.${minor}.${patch + 1}`;
  }
  const heute = new Date().toISOString().slice(0, 10);
  daten.data.version = neu;
  daten.data.stand = heute;
  daten.data.changelog.push({ version: neu, datum: heute, aenderung: beschreibung });
  writeFileSync(DATEN_PFAD, `${JSON.stringify(daten, null, 2)}\n`);
  console.log(`data.version → ${neu}`);
}

const [, , befehl, ...rest] = process.argv;

if (befehl === 'check') {
  const { fehler, warnungen, daten } = pruefe();
  schreibeCoverage(daten);
  for (const w of warnungen) {
    console.warn(`WARNUNG: ${w}`);
  }
  if (fehler.length > 0) {
    for (const f of fehler) {
      console.error(`FEHLER: ${f}`);
    }
    process.exit(1);
  }
  console.log(
    `OK – ${daten.insurers.length} Gesellschaften, Branchenreihe ${Object.keys(daten.branchendurchschnitt.nettoverzinsung).length} Jahre, COVERAGE.md aktualisiert.`,
  );
} else if (befehl === 'bump') {
  const [art, beschreibung] = rest;
  if (!art || !beschreibung) {
    console.error('Aufruf: … bump <patch|minor|major> "Beschreibung"');
    process.exit(1);
  }
  bump(art, beschreibung);
} else {
  console.error('Aufruf: … <check|bump>');
  process.exit(1);
}
