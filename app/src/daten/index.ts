/**
 * Kataloge — importiert direkt aus /daten an der Repo-Wurzel (Anhang A des Konzepts).
 * Eine Quelle für Konzept und Code; Anpassungen dort erscheinen hier ohne Umbau.
 */
import koerper from '../../../daten/kataloge/koerper.json';
import psyche from '../../../daten/kataloge/psyche.json';
import spiritualitaet from '../../../daten/kataloge/spiritualitaet.json';
import beziehung from '../../../daten/kataloge/beziehung.json';
import freundschaft from '../../../daten/kataloge/freundschaft.json';
import familie from '../../../daten/kataloge/familie.json';
import verwirklichung from '../../../daten/kataloge/verwirklichung.json';
import hilfe from '../../../daten/kataloge/hilfe.json';
import finanzen from '../../../daten/kataloge/finanzen.json';
import genuss from '../../../daten/kataloge/genuss.json';
import impulseRoh from '../../../daten/impulse.json';
import gefuehleRoh from '../../../daten/gefuehle.json';
import beduerfnisseRoh from '../../../daten/beduerfnisse.json';
import alternativenRoh from '../../../daten/alternativen.json';
import werteRoh from '../../../daten/werte.json';
import kriseRoh from '../../../daten/krise.json';
import type { BeduerfnisId, BereichId, GefuehlId } from '../logik/typen';

export interface WunschbildOption { id: string; label: string; gruppe: string }
export interface ZielVorlage { id: string; label: string; messbar: boolean; einheit?: string }
export interface BereichKatalog {
  bereich: string;
  name: string;
  unterpunkte: { id: string; label: string }[];
  wunschbild: WunschbildOption[];
  ziel_vorlagen: ZielVorlage[];
  radar_impulse: string[];
}
export interface Impuls {
  id: string;
  label: string;
  icon: string;
  bereiche: BereichId[];
  beduerfnisse: BeduerfnisId[];
  keywords: string[];
}
export interface Gefuehl { id: GefuehlId; label: string; beduerfnis_hinweise: BeduerfnisId[] }
export interface Beduerfnis { id: BeduerfnisId; label: string; frage: string }
export interface Alternative { id: string; beduerfnis: BeduerfnisId; label: string; dauer_min: number }
export interface Wert { id: string; label: string; beschreibung: string }
export interface KriseKategorie { id: string; label: string; muster: string[] }

export const BEREICHS_KATALOGE: Record<BereichId, BereichKatalog> = {
  koerper: koerper as BereichKatalog,
  psyche: psyche as BereichKatalog,
  spiritualitaet: spiritualitaet as BereichKatalog,
  beziehung: beziehung as BereichKatalog,
  freundschaft: freundschaft as BereichKatalog,
  familie: familie as BereichKatalog,
  verwirklichung: verwirklichung as BereichKatalog,
  hilfe: hilfe as BereichKatalog,
  finanzen: finanzen as BereichKatalog,
  genuss: genuss as BereichKatalog,
};

export const BEREICH_REIHENFOLGE: BereichId[] = [
  'koerper', 'psyche', 'spiritualitaet', 'beziehung', 'freundschaft',
  'familie', 'verwirklichung', 'hilfe', 'finanzen', 'genuss',
];

export const IMPULSE = (impulseRoh as { impulse?: Impuls[] }).impulse ?? (impulseRoh as unknown as Impuls[]);
export const GEFUEHLE = (gefuehleRoh as { gefuehle?: Gefuehl[] }).gefuehle ?? (gefuehleRoh as unknown as Gefuehl[]);
export const BEDUERFNISSE = (beduerfnisseRoh as { beduerfnisse?: Beduerfnis[] }).beduerfnisse ?? (beduerfnisseRoh as unknown as Beduerfnis[]);
export const ALTERNATIVEN = (alternativenRoh as { alternativen?: Alternative[] }).alternativen ?? (alternativenRoh as unknown as Alternative[]);
export const WERTE = (werteRoh as { werte?: Wert[] }).werte ?? (werteRoh as unknown as Wert[]);
export const KRISE_KATEGORIEN: KriseKategorie[] = (kriseRoh as { kategorien: KriseKategorie[] }).kategorien;

export function bereichsName(id: BereichId): string {
  return BEREICHS_KATALOGE[id].name;
}
export function impulsLabel(id?: string, freitext?: string): string {
  if (id) {
    const imp = IMPULSE.find((i) => i.id === id);
    if (imp) return imp.label;
  }
  return freitext ?? '';
}
