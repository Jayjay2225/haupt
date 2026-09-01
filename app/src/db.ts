/**
 * Persistenz — Dexie/IndexedDB, local-first (Konzept Kapitel 10/11).
 * Eine Tabelle je Entität; Export und vollständiges (physisches) Löschen hier gekapselt.
 */
import Dexie, { type Table } from 'dexie';
import type {
  BereichId, BereichKonfig, Einsicht, KatalogVersion, Moment, Profil, Wochenreflexion,
} from './logik/typen';
import { geraeteId, ulid } from './logik/ulid';

const GERAET_SCHLUESSEL = 'jetztgut-geraet';

export function meinGeraet(): string {
  try {
    const vorhanden = localStorage.getItem(GERAET_SCHLUESSEL) ?? undefined;
    const id = geraeteId(vorhanden);
    if (!vorhanden) localStorage.setItem(GERAET_SCHLUESSEL, id);
    return id;
  } catch {
    return geraeteId();
  }
}

export class JetztgutDb extends Dexie {
  profil!: Table<Profil, string>;
  bereiche!: Table<BereichKonfig, string>;
  momente!: Table<Moment, string>;
  reflexionen!: Table<Wochenreflexion, string>;
  einsichten!: Table<Einsicht, string>;
  katalogVersionen!: Table<KatalogVersion, string>;

  constructor() {
    super('jetztgut');
    this.version(1).stores({
      profil: 'id',
      bereiche: 'id, bereichId',
      momente: 'id, zeitpunkt',
      reflexionen: 'id, woche',
      einsichten: 'id, status',
      katalogVersionen: 'id, katalog',
    });
  }
}

export let db = new JetztgutDb();

function stempel(): Pick<Profil, 'createdAt' | 'updatedAt' | 'deviceId'> {
  const jetzt = new Date().toISOString();
  return { createdAt: jetzt, updatedAt: jetzt, deviceId: meinGeraet() };
}

export function neuId(): string {
  return ulid();
}

export async function holeProfil(): Promise<Profil> {
  const alle = await db.profil.toArray();
  if (alle.length > 0) return alle[0];
  const neu: Profil = {
    id: ulid(),
    ...stempel(),
    vision: [],
    werte: [],
    erinnerungen: [],
    appSperre: { aktiv: false, art: 'pin' },
    theme: 'system',
    sprache: 'de',
    onboardingFertig: false,
    einsichtenAktiv: true,
  };
  await db.profil.add(neu);
  return neu;
}

export async function speichereProfil(p: Profil): Promise<void> {
  await db.profil.put({ ...p, updatedAt: new Date().toISOString() });
}

export async function holeBereiche(): Promise<BereichKonfig[]> {
  return (await db.bereiche.toArray()).filter((b) => !b.deletedAt);
}

export async function bereichFuer(bereichId: BereichId): Promise<BereichKonfig | undefined> {
  return (await db.bereiche.where('bereichId').equals(bereichId).toArray()).find((b) => !b.deletedAt);
}

export function leererBereich(bereichId: BereichId): BereichKonfig {
  return {
    id: ulid(),
    ...stempel(),
    bereichId,
    aktiv: false,
    wunschbild: [],
    wunschbildFrei: [],
    ziele: [],
    istZustand: [],
    woranIchArbeite: '',
    radarImpulse: [],
    alternativen: [],
  };
}

export async function speichereBereich(b: BereichKonfig): Promise<void> {
  await db.bereiche.put({ ...b, updatedAt: new Date().toISOString() });
}

export async function speichereMoment(m: Moment): Promise<void> {
  await db.momente.put({ ...m, updatedAt: new Date().toISOString() });
}

export async function momenteZwischen(von: Date, bis: Date): Promise<Moment[]> {
  return (
    await db.momente
      .where('zeitpunkt')
      .between(von.toISOString(), bis.toISOString(), true, false)
      .toArray()
  ).filter((m) => !m.deletedAt);
}

export async function alleMomente(): Promise<Moment[]> {
  return (await db.momente.orderBy('zeitpunkt').toArray()).filter((m) => !m.deletedAt);
}

export async function reflexionFuer(woche: string): Promise<Wochenreflexion | undefined> {
  return (await db.reflexionen.where('woche').equals(woche).toArray()).find((r) => !r.deletedAt);
}

export async function alleReflexionen(): Promise<Wochenreflexion[]> {
  return (await db.reflexionen.toArray())
    .filter((r) => !r.deletedAt)
    .sort((a, b) => (a.woche < b.woche ? -1 : 1));
}

export async function speichereReflexion(r: Wochenreflexion): Promise<void> {
  await db.reflexionen.put({ ...r, updatedAt: new Date().toISOString() });
}

export async function offeneEinsichten(): Promise<Einsicht[]> {
  return (await db.einsichten.toArray()).filter((e) => !e.deletedAt && e.status !== 'verworfen');
}

export async function speichereEinsicht(e: Einsicht): Promise<void> {
  await db.einsichten.put({ ...e, updatedAt: new Date().toISOString() });
}

export function neueEntitaet<T>(rest: T): T & { id: string; createdAt: string; updatedAt: string; deviceId: string } {
  return { id: ulid(), ...stempel(), ...rest };
}

/* ---------- Export (Kapitel 11): JSON vollständig, CSV Excel-kompatibel ---------- */

export async function exportJson(): Promise<string> {
  const [profil, bereiche, momente, reflexionen, einsichten, katalogVersionen] = await Promise.all([
    db.profil.toArray(), db.bereiche.toArray(), db.momente.toArray(),
    db.reflexionen.toArray(), db.einsichten.toArray(), db.katalogVersionen.toArray(),
  ]);
  return JSON.stringify(
    { format: 'jetztgut-export', version: 1, exportiertAm: new Date().toISOString(),
      profil, bereiche, momente, reflexionen, einsichten, katalogVersionen },
    null, 2,
  );
}

function csvZelle(wert: unknown): string {
  const s = wert == null ? '' : String(wert);
  return '"' + s.replace(/"/g, '""') + '"';
}

export async function exportCsv(): Promise<{ momente: string; reflexionen: string }> {
  const momente = await alleMomente();
  const kopfM = ['zeitpunkt', 'eingabeart', 'impuls', 'freitext', 'gefuehl', 'intensitaet',
    'beduerfnis', 'entscheidung', 'wartenErgebnis', 'bereiche', 'achtsamkeit', 'kompass', 'dauerSekunden'];
  const zeilenM = momente.map((m) => [
    m.zeitpunkt, m.eingabeart, m.impulsId ?? '', m.freitext ?? '', m.gefuehl ?? '',
    m.intensitaet ?? '', m.beduerfnis ?? '', m.entscheidung ?? '', m.wartenErgebnis ?? '',
    m.bereiche.join('|'), m.punkte.achtsamkeit, m.punkte.kompass, m.dauerSekunden,
  ].map(csvZelle).join(';'));

  const reflexionen = await alleReflexionen();
  const kopfR = ['woche', 'bereich', 'punkte', 'notiz', 'naechsteWoche'];
  const zeilenR = reflexionen.flatMap((r) =>
    r.bereiche.map((b) => [r.woche, b.bereichId, b.punkte ?? '', b.notiz, b.naechsteWoche].map(csvZelle).join(';')),
  );
  return {
    momente: [kopfM.join(';'), ...zeilenM].join('\n'),
    reflexionen: [kopfR.join(';'), ...zeilenR].join('\n'),
  };
}

/** Vollständiges Löschen: physisch, die ganze Datenbank (Kapitel 11). */
export async function loescheAlles(): Promise<void> {
  await db.delete();
  db = new JetztgutDb();
}

export async function entferneDemoDaten(): Promise<void> {
  const momente = await db.momente.toArray();
  await db.momente.bulkDelete(momente.filter((m) => m.demo).map((m) => m.id));
  const reflexionen = await db.reflexionen.toArray();
  await db.reflexionen.bulkDelete(reflexionen.filter((r) => r.demo).map((r) => r.id));
  const einsichten = await db.einsichten.toArray();
  await db.einsichten.bulkDelete(einsichten.filter((e) => e.demo).map((e) => e.id));
}

export async function demoVorhanden(): Promise<boolean> {
  const momente = await db.momente.limit(200).toArray();
  return momente.some((m) => m.demo);
}
