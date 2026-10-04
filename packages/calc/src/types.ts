/**
 * Ein- und Ausgabetypen des Rechenkerns. Spezifikation: docs/CALC-SPEC.md.
 */

export type Vertragsart = 'kapital-lv' | 'private-rv' | 'fonds-lv' | 'fonds-rv' | 'rueckdeckung';

export type Zahlweise = 'monatlich' | 'vierteljaehrlich' | 'halbjaehrlich' | 'jaehrlich' | 'einmalbeitrag';

export type Vertragsstatus = 'laufend' | 'beitragsfrei' | 'gekuendigt' | 'abgelaufen';

export type SzenarioName = 'min' | 'basis' | 'max';

export interface Geldleistung {
  /** ISO-Monat der Auszahlung. */
  monat: string;
  betrag: number;
}

export interface ContractInput {
  versichererId: string;
  vertragsart: Vertragsart;
  beginn: string;
  ende?: string;
  beitragszahlungVon?: string;
  beitragszahlungBis?: string;
  zahlweise: Zahlweise;
  erstbeitrag: { betrag: number; waehrung: 'EUR' | 'DM' };
  aktuellerBeitrag?: number;
  dynamik: { aktiv: boolean; satzProzent?: number; ausgesetzteVertragsjahre?: number[] };
  gesamtsummeLautMitteilung?: number;
  status: Vertragsstatus;
  statusDatum?: string;
  rueckkaufswert?: { betrag: number; standMonat?: string };
  auszahlungen?: Geldleistung[];
  policendarlehen?: Geldleistung[];
  buzBeitragsanteilProzent?: number;
  eintrittsalter?: number;
  stichtag: string;
  szenarioOverrides?: SzenarioOverrides;
}

/** Test-/Sensitivitäts-Overrides; jede Nutzung erscheint als Annahme. */
export interface SzenarioOverrides {
  zinssatzProzent?: number;
  risikoanteilProzent?: number;
  verwaltungskostenProzent?: number;
  abschlusskostenNull?: boolean;
}

// ---------------------------------------------------------------------------
// Datenpakete (Strukturen aus data/insurers.json und data/risk-defaults.json)
// ---------------------------------------------------------------------------

export interface Quelle {
  typ: 'primary' | 'secondary' | 'estimate';
  titel: string;
  url?: string;
  dokument?: string;
  fundstelle?: string;
  abrufdatum?: string;
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
  /** Zillmer-nahe Quote in % der Beitragssumme (Deckel für die Abschlusskosten). */
  abschlusskostenquote?: Kennzahl;
  verwaltungskostenquote?: Kennzahl;
  deklarationGesamtverzinsung?: Kennzahl;
  /** Nachrichtlich (BaFin Tabelle 160): Abschlussaufwendungen in % der verdienten Bruttobeiträge. */
  abschlussaufwendungenProzentBeitraege?: Kennzahl;
}

export interface ZinsEintrag {
  gueltigAb: string;
  wert: number;
  quelle: Quelle;
}

export interface Rechtsnachfolge {
  beschreibung: string;
  datum?: string;
  quelle?: Quelle;
  confidence: 'high' | 'medium' | 'low';
}

export interface VersichererDaten {
  id: string;
  kanonischerName: string;
  altnamen: string[];
  rechtsnachfolge?: Rechtsnachfolge[];
  kennzahlenVon?: { insurerId: string; abJahr: number; begruendung: string };
  hinweise?: string;
  kennzahlen: Record<string, JahresKennzahlen>;
}

export interface InsurersDaten {
  data: { version: string; stand: string };
  branchendurchschnitt: {
    nettoverzinsung: Record<string, Kennzahl>;
    /** Branchen-„lfd. Verzinsung“ (BaFin) für das Min-Szenario, wenn Unternehmenswerte fehlen. */
    laufendeDurchschnittsverzinsung?: Record<string, Kennzahl>;
  };
  referenzzinsen: {
    basiszinsBGB247: { werte: ZinsEintrag[] };
    einlagenzins: { werte: ZinsEintrag[] };
  };
  rechnungsgrundlagen: {
    hoechstzillmersatz: { werte: ZinsEintrag[] };
    hoechstrechnungszins: { werte: ZinsEintrag[] };
  };
  insurers: VersichererDaten[];
}

export interface RiskBand {
  bisEintrittsalter: number | null;
  low: number;
  mid: number;
  high: number;
}

export interface RiskDefaults {
  risikoanteilProzent: {
    vertragsarten: Record<Vertragsart, { baender: RiskBand[] }>;
    defaultEintrittsalter: number;
  };
  buz: { risikoanteilProzent: number };
  verwaltungskostenFallbackProzent: { low: number; mid: number; high: number };
}

// ---------------------------------------------------------------------------
// Ergebnis
// ---------------------------------------------------------------------------

export type Zinsherkunft = 'insurer' | 'branche' | 'fallback' | 'override';

export interface JahresZins {
  jahr: number;
  satzProzent: number;
  herkunft: Zinsherkunft;
  /** Datenkennzeichen: Branchen- oder Ersatzwert statt Unternehmenswert (Schätzung). */
  kennzeichen?: 'estimated_branch';
  quelle?: Quelle;
}

export interface SzenarioErgebnis {
  name: SzenarioName;
  summeBeitraege: number;
  summeBuz: number;
  summeRisiko: number;
  summeAbschluss: number;
  summeVerwaltung: number;
  summeSparanteil: number;
  erstattungsfaehigeBeitraege: number;
  nutzungen: number;
  rueckabwicklungswert: number;
  erhalteneLeistungenAufgezinst: number;
  nettoanspruch: number;
  mehrwertGegenKuendigung?: number;
  wirtschaftlichKeinVorteil?: boolean;
  nutzungenProzentDerBeitraege: number;
  /** Aufteilung der Nutzungen nach Herkunft des Zinssatzes je Jahr. */
  nutzungenNachHerkunft: Record<Zinsherkunft, number>;
  /** Anteil der Nutzungen, der auf Unternehmenswerten beruht (Prozent, eine Nachkommastelle). */
  anteilUnternehmenswerteProzent: number;
  zinsreihe: JahresZins[];
}

export interface Jahreszeile {
  jahr: number;
  beitraege: number;
  buz: number;
  risiko: number;
  abschluss: number;
  verwaltung: number;
  sparanteil: number;
  zinssatzProzent: number;
  zinsherkunft: Zinsherkunft;
  nutzungenImJahr: number;
  kumulierterWert: number;
}

export interface Annahme {
  code: string;
  text: string;
}

export interface Warnung {
  code: string;
  text: string;
}

export interface CalcMeta {
  calcVersion: string;
  dataVersion: string;
  stichtag: string;
}

/**
 * Ergebnis der Rückabwicklungsrechnung. Seit Prompt 12 gibt es keine
 * Regime-Sonderpfade mehr: Die Formel (Beitragsstrom → Sparanteil →
 * Nutzungen → drei Szenarien → Vergleich mit dem Rückkaufswert) wird für
 * alle Vertragsjahrgänge gleich angewendet. Welche rechtliche Grundlage im
 * Einzelfall trägt, prüft der Rechtsanwalt (docs/CALC-SPEC.md).
 */
export interface CalcResult {
  szenarien: Record<SzenarioName, SzenarioErgebnis>;
  jahrestabelle: Jahreszeile[];
  annahmen: Annahme[];
  warnungen: Warnung[];
  meta: CalcMeta;
}
