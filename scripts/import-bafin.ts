/**
 * Import der BaFin-„Statistik der Erstversicherungsunternehmen“, Tabelle 160
 * (Lebensversicherer, Kennzahlen je Unternehmen) aus den Excel-Dateien in
 * data/raw/bafin/ nach data/insurers.json (Prompt 9, Voraussetzung).
 *
 * Aufrufe (Node >= 22):
 *   node --experimental-strip-types scripts/import-bafin.ts namen
 *     → listet alle BaFin-Kurznamen je Jahr (für data/raw/bafin/mapping.json)
 *   node --experimental-strip-types scripts/import-bafin.ts import
 *     → schreibt Kennzahlen der gemappten Gesellschaften und die Branchenzeile
 *       nach data/insurers.json (jede Zahl mit Quelle, Fundstelle, Abrufdatum)
 *
 * Ohne Fremdpakete: Die .xlsx/.xlsm werden als ZIP gelesen (zlib inflateRaw),
 * die Blatt-XML per regulären Ausdrücken ausgewertet.
 *
 * Kennzahlen-Zuordnung (Fußnoten der BaFin-Tabellen, siehe data/raw/bafin/README.md):
 *   „Reinverzinsung“ → nettoverzinsung (Kapitalanlageerträge ./. -aufwendungen
 *     in % des mittleren Kapitalanlagenbestands = Nettoverzinsung der Kapitalanlagen)
 *   „lfd. Verzinsung“ → laufendeDurchschnittsverzinsung
 *   „Verwaltungsaufwendungen in % der verdienten Brutto-Beiträge“ → verwaltungskostenquote
 *   „Abschlussaufwendungen in % der verdienten Brutto-Beiträge“ →
 *     abschlussaufwendungenProzentBeitraege (nachrichtlich; NICHT die
 *     Zillmer-Quote auf die Beitragssumme)
 */
import { inflateRawSync } from 'node:zlib';
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ROH = resolve(REPO, 'data/raw/bafin');
const DATEN_PFAD = resolve(REPO, 'data/insurers.json');
const MAPPING_PFAD = resolve(ROH, 'mapping.json');
const ABRUF = '2026-09-18';

// --- Minimaler ZIP-Leser ----------------------------------------------------

function zipEintraege(puffer: Buffer): Map<string, Buffer> {
  const eintraege = new Map<string, Buffer>();
  let eocd = -1;
  for (let i = puffer.length - 22; i >= 0; i -= 1) {
    if (puffer.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) {
    throw new Error('Kein ZIP-Verzeichnis gefunden.');
  }
  const anzahl = puffer.readUInt16LE(eocd + 10);
  let pos = puffer.readUInt32LE(eocd + 16);
  for (let n = 0; n < anzahl; n += 1) {
    if (puffer.readUInt32LE(pos) !== 0x02014b50) {
      throw new Error('Ungültiger Zentralverzeichnis-Eintrag.');
    }
    const methode = puffer.readUInt16LE(pos + 10);
    const komprimiert = puffer.readUInt32LE(pos + 20);
    const nameLaenge = puffer.readUInt16LE(pos + 28);
    const extraLaenge = puffer.readUInt16LE(pos + 30);
    const kommentarLaenge = puffer.readUInt16LE(pos + 32);
    const lokalOffset = puffer.readUInt32LE(pos + 42);
    const name = puffer.subarray(pos + 46, pos + 46 + nameLaenge).toString('utf8');
    const lokalNameLaenge = puffer.readUInt16LE(lokalOffset + 26);
    const lokalExtraLaenge = puffer.readUInt16LE(lokalOffset + 28);
    const datenStart = lokalOffset + 30 + lokalNameLaenge + lokalExtraLaenge;
    const daten = puffer.subarray(datenStart, datenStart + komprimiert);
    eintraege.set(name, methode === 8 ? inflateRawSync(daten) : Buffer.from(daten));
    pos += 46 + nameLaenge + extraLaenge + kommentarLaenge;
  }
  return eintraege;
}

// --- XML-Hilfen ---------------------------------------------------------------

function entkodiere(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, '&');
}

function sharedStrings(xml: string): string[] {
  const ergebnis: string[] = [];
  for (const si of xml.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
    const texte = [...(si[1] ?? '').matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((m) => entkodiere(m[1] ?? ''));
    ergebnis.push(texte.join(''));
  }
  return ergebnis;
}

function spaltenIndex(buchstaben: string): number {
  let n = 0;
  for (const ch of buchstaben) {
    n = n * 26 + (ch.charCodeAt(0) - 64);
  }
  return n;
}

type Zeile = Map<number, string>;

function blattZeilen(xml: string, strings: string[]): Map<number, Zeile> {
  const zeilen = new Map<number, Zeile>();
  for (const c of xml.matchAll(/<c r="([A-Z]+)(\d+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
    const spalte = spaltenIndex(c[1] ?? 'A');
    const zeileNr = Number(c[2]);
    const attribute = c[3] ?? '';
    const inhalt = c[4] ?? '';
    let wert: string | undefined;
    const t = /\bt="([^"]+)"/.exec(attribute)?.[1];
    const v = /<v>([\s\S]*?)<\/v>/.exec(inhalt)?.[1];
    if (t === 's' && v !== undefined) {
      wert = strings[Number(v)];
    } else if (t === 'inlineStr') {
      wert = [...inhalt.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((m) => entkodiere(m[1] ?? '')).join('');
    } else if (v !== undefined) {
      wert = entkodiere(v);
    }
    if (wert !== undefined && wert !== '') {
      const zeile = zeilen.get(zeileNr) ?? new Map<number, string>();
      zeile.set(spalte, wert);
      zeilen.set(zeileNr, zeile);
    }
  }
  return zeilen;
}

function blatt160(datei: string): { zeilen: Map<number, Zeile>; blattname: string } {
  const eintraege = zipEintraege(readFileSync(datei));
  const workbook = eintraege.get('xl/workbook.xml')?.toString('utf8') ?? '';
  const rels = eintraege.get('xl/_rels/workbook.xml.rels')?.toString('utf8') ?? '';
  const strings = sharedStrings(eintraege.get('xl/sharedStrings.xml')?.toString('utf8') ?? '');
  const relZiel = new Map<string, string>();
  for (const r of rels.matchAll(/<Relationship [^>]*?Id="([^"]+)"[^>]*?Target="([^"]+)"/g)) {
    relZiel.set(r[1] ?? '', r[2] ?? '');
  }
  for (const s of workbook.matchAll(/<sheet [^>]*?name="([^"]+)"[^>]*?r:id="([^"]+)"/g)) {
    const name = entkodiere(s[1] ?? '');
    if (name.trim().replace(/_+$/, '') === '160') {
      let ziel = relZiel.get(s[2] ?? '') ?? '';
      ziel = ziel.startsWith('/') ? ziel.slice(1) : ziel.startsWith('xl/') ? ziel : `xl/${ziel}`;
      const xml = eintraege.get(ziel)?.toString('utf8');
      if (xml === undefined) {
        throw new Error(`${datei}: Blatt ${ziel} nicht im Archiv.`);
      }
      return { zeilen: blattZeilen(xml, strings), blattname: name };
    }
  }
  throw new Error(`${datei}: kein Blatt „160“ gefunden.`);
}

// --- Tabelle 160 interpretieren ----------------------------------------------

interface Unternehmenszeile {
  rang: number;
  kurzname: string;
  zeileNr: number;
  werte: Map<number, string>; // logische Spalte → Wert
}

interface Tabelle {
  jahr: number;
  datei: string;
  layout: 'A' | 'B';
  spalten: Record<'lfd' | 'rein' | 'abschlussProzent' | 'verwaltungProzent', number>;
  branche: Map<number, string>;
  unternehmen: Unternehmenszeile[];
}

function istGanzzahl(wert: string | undefined): boolean {
  return wert !== undefined && /^\d+$/.test(wert.trim());
}

function leseTabelle(jahr: number, datei: string): Tabelle {
  const { zeilen } = blatt160(datei);
  const nummern = [...zeilen.keys()].sort((a, b) => a - b);
  let kopfZeile = -1;
  for (const nr of nummern) {
    const z = zeilen.get(nr)!;
    if (z.get(1) === '1') {
      const weitere = [...z.entries()].filter(([spalte]) => spalte > 1).sort((a, b) => a[0] - b[0]);
      if (weitere[0]?.[1] === '2') {
        kopfZeile = nr;
        break;
      }
    }
  }
  if (kopfZeile < 0) {
    throw new Error(`${datei}: Spaltennummern-Zeile nicht gefunden.`);
  }
  // logische Nummer → physische Spalte
  const physisch = new Map<number, number>();
  for (const [spalte, wert] of zeilen.get(kopfZeile)!) {
    if (istGanzzahl(wert)) {
      physisch.set(Number(wert), spalte);
    }
  }
  const anzahl = physisch.size;
  const layout: 'A' | 'B' = anzahl >= 15 ? 'A' : 'B';
  const spalten =
    layout === 'A'
      ? { lfd: 9, rein: 10, abschlussProzent: 12, verwaltungProzent: 13 }
      : { lfd: 8, rein: 9, abschlussProzent: 10, verwaltungProzent: 11 };

  const logisch = (z: Zeile): Map<number, string> => {
    const m = new Map<number, string>();
    for (const [nr, sp] of physisch) {
      const w = z.get(sp);
      if (w !== undefined) {
        m.set(nr, w);
      }
    }
    return m;
  };

  const brancheZeile = zeilen.get(kopfZeile + 1);
  const brancheWerte = brancheZeile ? logisch(brancheZeile) : new Map<number, string>();
  const brancheName = [...(brancheZeile?.values() ?? [])].find((w) => /branche/i.test(w));
  if (brancheName === undefined) {
    throw new Error(`${datei}: Branchenzeile unter der Kopfzeile nicht gefunden.`);
  }

  const unternehmen: Unternehmenszeile[] = [];
  for (const nr of nummern) {
    if (nr <= kopfZeile + 1) {
      continue;
    }
    const z = zeilen.get(nr)!;
    const rangRoh = z.get(1);
    if (!istGanzzahl(rangRoh)) {
      break; // Fußnoten
    }
    const l = logisch(z);
    unternehmen.push({ rang: Number(rangRoh), kurzname: (l.get(2) ?? '').trim(), zeileNr: nr, werte: l });
  }
  return { jahr, datei, layout, spalten, branche: brancheWerte, unternehmen };
}

function zahl(wert: string | undefined): number | null {
  if (wert === undefined) {
    return null;
  }
  const w = wert.trim();
  if (w === '' || w === '-' || w === '***') {
    return null;
  }
  const n = Number(w.replace(',', '.'));
  if (!Number.isFinite(n)) {
    return null;
  }
  return Math.round(n * 10) / 10;
}

function dateien(): { jahr: number; pfad: string; name: string }[] {
  return readdirSync(ROH)
    .filter((f) => /^dl_st_\d{2}_erstvu_lv_va(_xls)?\.xls[xm]$/.test(f))
    .map((f) => ({ jahr: 2000 + Number(f.slice(6, 8)), pfad: resolve(ROH, f), name: f }))
    .sort((a, b) => a.jahr - b.jahr);
}

function quelle(t: Tabelle, zeileNr: number, spalte: number, titel: string) {
  const bafinName = t.datei.split('/').pop() ?? '';
  return {
    typ: 'primary' as const,
    titel: `BaFin, Statistik der Erstversicherungsunternehmen ${t.jahr}, Lebensversicherer, Tabelle 160 – ${titel}`,
    url: `https://www.bafin.de/SharedDocs/Downloads/DE/Statistik/Erstversicherer/${bafinName}?__blob=publicationFile&v=1`,
    dokument: `data/raw/bafin/${bafinName}`,
    fundstelle: `Blatt „160“, Zeile ${zeileNr}, logische Spalte ${spalte}`,
    abrufdatum: ABRUF,
  };
}

// --- Befehle -------------------------------------------------------------------

const [, , befehl] = process.argv;
const tabellen = dateien().map((d) => leseTabelle(d.jahr, d.pfad));

if (befehl === 'namen') {
  const proName = new Map<string, number[]>();
  for (const t of tabellen) {
    for (const u of t.unternehmen) {
      const liste = proName.get(u.kurzname) ?? [];
      liste.push(t.jahr);
      proName.set(u.kurzname, liste);
    }
  }
  const zeilen = ['# BaFin-Kurznamen in Tabelle 160 (2011–2024)', '', '| Kurzname | Jahre |', '|---|---|'];
  for (const [name, jahre] of [...proName.entries()].sort((a, b) => a[0].localeCompare(b[0], 'de'))) {
    zeilen.push(`| ${name} | ${jahre.join(', ')} |`);
  }
  writeFileSync(resolve(ROH, 'KURZNAMEN.md'), `${zeilen.join('\n')}\n`);
  console.log(`${proName.size} Kurznamen in ${tabellen.length} Tabellen; Liste in data/raw/bafin/KURZNAMEN.md`);
  for (const t of tabellen) {
    console.log(`${t.jahr}: Layout ${t.layout}, ${t.unternehmen.length} Unternehmen, Branche Rein=${t.branche.get(t.spalten.rein)} lfd=${t.branche.get(t.spalten.lfd)}`);
  }
} else if (befehl === 'import') {
  if (!existsSync(MAPPING_PFAD)) {
    console.error('data/raw/bafin/mapping.json fehlt (Kurzname → insurerId).');
    process.exit(1);
  }
  // Mapping: Kurzname → insurerId oder Liste jahresabhängiger Zuordnungen
  // (Kurznamen wandern bei Umfirmierungen/Bestandsübertragungen zwischen Rechtsträgern).
  type Zuordnung = string | { id: string; abJahr?: number; bisJahr?: number }[];
  const mapping = JSON.parse(readFileSync(MAPPING_PFAD, 'utf8')) as Record<string, Zuordnung>;
  const idFuer = (kurzname: string, jahr: number): string | undefined => {
    const z = mapping[kurzname];
    if (z === undefined) {
      return undefined;
    }
    if (typeof z === 'string') {
      return z;
    }
    return z.find((e) => (e.abJahr === undefined || jahr >= e.abJahr) && (e.bisJahr === undefined || jahr <= e.bisJahr))?.id;
  };
  const daten = JSON.parse(readFileSync(DATEN_PFAD, 'utf8')) as {
    data: { version: string; stand: string; changelog: { version: string; datum: string; aenderung: string }[] };
    branchendurchschnitt: {
      nettoverzinsung: Record<string, unknown>;
      laufendeDurchschnittsverzinsung?: Record<string, unknown>;
      beschreibung: string;
    };
    insurers: { id: string; kanonischerName: string; kennzahlen: Record<string, Record<string, unknown>> }[];
  };
  const proId = new Map(daten.insurers.map((v) => [v.id, v]));
  let werte = 0;
  let branchenWerte = 0;
  const nichtGemappt = new Set<string>();

  daten.branchendurchschnitt.laufendeDurchschnittsverzinsung ??= {};

  for (const t of tabellen) {
    // Branchenzeile: laufende Durchschnittsverzinsung (Min-Szenario-Fallback).
    const brancheLfd = zahl(t.branche.get(t.spalten.lfd));
    if (brancheLfd !== null) {
      daten.branchendurchschnitt.laufendeDurchschnittsverzinsung[String(t.jahr)] = {
        wert: brancheLfd,
        einheit: '%',
        quelle: quelle(t, -1, t.spalten.lfd, 'Zeile „Branche“, lfd. Verzinsung'),
        confidence: 'high',
      };
      branchenWerte += 1;
    }
    for (const u of t.unternehmen) {
      const id = idFuer(u.kurzname, t.jahr);
      if (id === undefined) {
        nichtGemappt.add(u.kurzname);
        continue;
      }
      const versicherer = proId.get(id);
      if (versicherer === undefined) {
        throw new Error(`mapping.json: unbekannte insurerId „${id}“ für „${u.kurzname}“.`);
      }
      const jahr = String(t.jahr);
      const eintrag = versicherer.kennzahlen[jahr] ?? {};
      const setze = (feld: string, spalte: number, titel: string) => {
        const w = zahl(u.werte.get(spalte));
        if (w === null) {
          return;
        }
        eintrag[feld] = {
          wert: w,
          einheit: '%',
          quelle: quelle(t, u.zeileNr, spalte, `Zeile „${u.kurzname}“, ${titel}`),
          confidence: 'high',
        };
        werte += 1;
      };
      setze('nettoverzinsung', t.spalten.rein, 'Reinverzinsung (= Nettoverzinsung der Kapitalanlagen)');
      setze('laufendeDurchschnittsverzinsung', t.spalten.lfd, 'lfd. Verzinsung');
      setze('verwaltungskostenquote', t.spalten.verwaltungProzent, 'Verwaltungsaufwendungen in % der verdienten Brutto-Beiträge');
      setze('abschlussaufwendungenProzentBeitraege', t.spalten.abschlussProzent, 'Abschlussaufwendungen in % der verdienten Brutto-Beiträge');
      if (Object.keys(eintrag).length > 0) {
        versicherer.kennzahlen[jahr] = eintrag;
      }
    }
  }

  const heute = new Date().toISOString().slice(0, 10);
  const [major = 0, minor = 0] = daten.data.version.split('.').map(Number);
  daten.data.version = `${major}.${minor + 1}.0`;
  daten.data.stand = heute;
  daten.data.changelog.push({
    version: daten.data.version,
    datum: heute,
    aenderung: `BaFin Tabelle 160 (2011–2024) importiert: ${werte} Unternehmenswerte für ${Object.keys(mapping).length} Kurznamen, Branchen-lfd.-Verzinsung ${branchenWerte} Jahre (scripts/import-bafin.ts).`,
  });
  writeFileSync(DATEN_PFAD, `${JSON.stringify(daten, null, 2)}\n`);
  console.log(`importiert: ${werte} Werte, Branchen-lfd.-Verzinsung ${branchenWerte} Jahre → data.version ${daten.data.version}`);
  if (nichtGemappt.size > 0) {
    console.log(`nicht gemappt (${nichtGemappt.size} Kurznamen, siehe KURZNAMEN.md): ${[...nichtGemappt].slice(0, 12).join(' | ')} …`);
  }
} else {
  console.error('Aufruf: … <namen|import>');
  process.exit(1);
}
