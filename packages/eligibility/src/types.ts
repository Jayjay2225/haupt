/**
 * Typen des Eignungs- und Belehrungs-Checks (Prompt 4).
 * Eingabe = Fragebogen-Antworten; Regelbasis = data/legal-rules.json.
 */

export type JaNeinUnbekannt = 'ja' | 'nein' | 'unbekannt';

export interface EligibilityInput {
  /** ISO-Datum (YYYY-MM-DD) oder ISO-Monat (YYYY-MM), falls der Tag unbekannt ist. */
  vertragsschluss: string;
  vertragsart: 'kapital-lv' | 'private-rv' | 'fonds-lv' | 'fonds-rv' | 'rueckdeckung' | 'risiko-lv' | 'unbekannt';
  zustandekommen: 'policenmodell' | 'antragsmodell' | 'unbekannt';
  belehrungVorhanden: JaNeinUnbekannt;
  belehrungFrist: '14-tage' | '30-tage' | 'andere' | 'unbekannt';
  belehrungForm: 'schriftform' | 'textform' | 'andere' | 'unbekannt';
  hervorhebung: JaNeinUnbekannt;
  status: 'laufend' | 'beitragsfrei' | 'gekuendigt' | 'abgelaufen';
  abgetretenOderBeliehen: JaNeinUnbekannt;
  auszahlungenErhalten: JaNeinUnbekannt;
  /** Optional (wird im Fragebogen nicht immer erhoben). */
  unterlagenVollstaendig?: JaNeinUnbekannt;
  fortgefuehrtNachKenntnis?: JaNeinUnbekannt;
}

export type Ampel = 'gruen' | 'gelb' | 'rot';

export type RegimeErgebnis =
  | 'alt-policenmodell'
  | 'alt-antragsmodell'
  | 'alt-unbekannt'
  | 'neu-2008'
  | 'keins';

export interface Begruendung {
  text: string;
  regelIds: string[];
}

export interface EligibilityResult {
  ampel: Ampel;
  regime: RegimeErgebnis;
  /** Kernbegründungen der Ampel, jede mit den Regel-IDs aus legal-rules.json. */
  begruendungen: Begruendung[];
  /** Ergänzende Hinweise (Methodik, Verjährung, Steuern, Fonds …). */
  hinweise: Begruendung[];
  /** Dokumente, die für eine belastbarere Einordnung fehlen. */
  benoetigteDokumente: string[];
  /** IDs aller angewendeten Regeln (nachvollziehbar für den Bericht). */
  angewendeteRegeln: string[];
  meta: {
    eligibilityVersion: string;
    rulesVersion: string;
    rulesStand: string;
  };
}

// --- Regelwerk-Typen (Struktur von data/legal-rules.json) -------------------

export interface RegelQuelle {
  typ: 'primary' | 'secondary' | 'estimate';
  titel: string;
  url?: string;
  dokument?: string;
  abrufdatum?: string;
  hinweis?: string;
}

export type BedingungsBlatt =
  | { feld: string; ist: string }
  | { feld: string; in: string[] }
  | { feld: string; vor: string }
  | { feld: string; ab: string }
  | { feld: string; zwischen: [string, string] };

export type Bedingung = { alle: BedingungsKnoten[] } | { eine: BedingungsKnoten[] };
export type BedingungsKnoten = Bedingung | BedingungsBlatt;

export interface RegelFolge {
  typ:
    | 'regime'
    | 'ausschluss'
    | 'fehler'
    | 'ordnungsgemaess'
    | 'verwirkungsindikator'
    | 'kein-verwirkungsindikator'
    | 'hinweis'
    | 'methodik';
  text: string;
  wert?: string;
  staerke?: string;
  benoetigtesDokument?: string;
}

export interface Regel {
  id: string;
  regime: string;
  bedingung: Bedingung;
  folge: RegelFolge;
  gewicht: 'wesentlich' | 'geringfuegig' | 'unbekannt' | null;
  confidence: 'high' | 'medium' | 'low';
  quelle: RegelQuelle[];
}

export interface Regelwerk {
  version: string;
  stand: string;
  beschreibung: string;
  regeln: Regel[];
}
