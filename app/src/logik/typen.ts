/** Datenmodell nach Konzept Kapitel 10 — UI-frei, testbar. */

export type BereichId =
  | 'koerper' | 'psyche' | 'spiritualitaet' | 'beziehung' | 'freundschaft'
  | 'familie' | 'verwirklichung' | 'hilfe' | 'finanzen' | 'genuss';

export type GefuehlId =
  | 'muede' | 'gestresst' | 'gelangweilt' | 'einsam' | 'unruhig'
  | 'traurig' | 'genervt' | 'gut' | 'weiss-nicht';

export type BeduerfnisId =
  | 'energie' | 'pause' | 'trost' | 'belohnung' | 'ablenkung'
  | 'naehe' | 'reiz' | 'hunger' | 'genuss';

export type Intensitaet = 'leicht' | 'mittel' | 'stark';
export type Eingabeart = 'sprache' | 'text' | 'kachel' | 'button';
export type Entscheidung = 'alternative' | 'warten' | 'bewusst-ja' | 'abbruch';

/** Sync-Vorbereitung: gilt für jede Entität (ULID, Last-Write-Wins, Soft-Delete). */
export interface Basis {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  deviceId: string;
}

export interface Profil extends Basis {
  vision: string[];
  werte: string[];
  erinnerungen: { zeit: string; aktiv: boolean }[];
  appSperre: { aktiv: boolean; art: 'pin'; pinHash?: string };
  theme: 'hell' | 'dunkel' | 'system';
  sprache: 'de';
  onboardingFertig: boolean;
  einsichtenAktiv: boolean;
}

export interface Ziel {
  text: string;
  messwert?: string;
  zieldatum?: string;
}

export interface BereichKonfig extends Basis {
  bereichId: BereichId;
  aktiv: boolean;
  wunschbild: string[];
  wunschbildFrei: string[];
  ziele: Ziel[];
  istZustand: { woche: string; wert: number }[];
  woranIchArbeite: string;
  radarImpulse: string[];
  alternativen: { beduerfnis: BeduerfnisId; text: string }[];
}

export interface Moment extends Basis {
  zeitpunkt: string;
  eingabeart: Eingabeart;
  impulsId?: string;
  freitext?: string;
  gefuehl?: GefuehlId;
  intensitaet?: Intensitaet;
  beduerfnis?: BeduerfnisId;
  kompassSpiegelTyp?: 'ziel' | 'wunschbild' | 'vision' | 'neutral';
  entscheidung?: Entscheidung;
  gewaehlteAlternative?: string;
  wartenErgebnis?: 'vorbei' | 'bewusst-ja';
  bereiche: BereichId[];
  punkte: { achtsamkeit: 0 | 1; kompass: 0 | 1 };
  dauerSekunden: number;
  nachgetragen?: boolean;
  demo?: boolean;
}

export interface Wochenreflexion extends Basis {
  woche: string; // ISO-Woche, z. B. "2026-W35"
  bereiche: {
    bereichId: BereichId;
    punkte: number | null; // 0–10 wie in der Excel; null = übersprungen
    notiz: string;
    naechsteWoche: string;
  }[];
  streakRelevant: boolean;
  demo?: boolean;
}

export interface Einsicht extends Basis {
  typ: 'zeitmuster' | 'gefuehlsmuster' | 'beduerfnis-verteilung' | 'alternative-wirkt' | 'folgetag';
  aussage: string;
  status: 'neu' | 'gezeigt' | 'bestaetigt' | 'verworfen';
  folgetagAntwort?: 'geholfen' | 'teils' | 'nicht' | 'keine-antwort';
  bezugMomentId?: string;
  demo?: boolean;
}

export interface KatalogVersion extends Basis {
  katalog: string;
  version: number;
}

/** Ergebnis der regelbasierten Interpretation einer freien Eingabe. */
export interface Interpretation {
  impulsId?: string;
  freitext?: string;
  bereiche: BereichId[];
  beduerfnisse: BeduerfnisId[];
  konfidenz: 'hoch' | 'niedrig';
  krise: boolean;
}
