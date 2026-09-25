/**
 * Marken-Konfiguration (Prompt 12, Abschnitt 4: Design B „Nachtblau & Salbei“).
 *
 * Renten-Rettung ist die Privatkunden-Marke; das Produkt heißt „Prüfbericht“
 * (nie „Gutachten“). Zeitraum: Verträge mit Beginn 1980 bis 2020 (BRAND.range),
 * überall aus dieser Datei referenziert.
 *
 * Anbieter ist die Kaufmannsladen Gebhard GmbH (Entscheidung 20.09.2026);
 * die Registerdaten stammen aus dem Handelsregister (Abruf 20.09.2026 über
 * online-handelsregister.de, Spiegel des Registerportals – vor Go-live gegen
 * handelsregister.de zu verifizieren). Umsatzsteuer-ID und Telefon hat der
 * Anbieter am 21.09.2026 geliefert.
 *
 * Für die markenneutrale Kanzlei-Lizenz (Modell C) liefert die Umgebung der
 * Kanzlei eine neutrale Konfiguration ohne Renten-Rettung-Optik.
 */
import { PRODUKT_VARIANTE } from './variante';

export interface Anschrift {
  strasse: string;
  plz: string;
  ort: string;
}

export interface Marke {
  name: string;
  domain: string;
  /** Produktname des kostenpflichtigen Berichts („Prüfbericht“, nie „Gutachten“). */
  produktname: string;
  claim: string;
  /** Vertragsbeginn-Zeitraum, der auf der Website genannt wird. */
  range: { from: number; to: number };
  /** Standort für die Vertrauenszeile („Versicherungsanalyse aus …“). */
  stadt: string;
  /** Firma des Anbieters (Anbieterkennzeichnung, Rechnungen, E-Mails). */
  anbieter: string;
  anbieterAnschrift: Anschrift;
  /** Vertretungsberechtigte, z. B. „Geschäftsführer Vorname Name“. */
  anbieterVertretung: string;
  /** Registergericht und Registernummer. */
  anbieterRegister: string;
  /** Umsatzsteuer-Identifikationsnummer; leer = noch nachzutragen. */
  anbieterUstId: string;
  /** Telefonnummer für die Anbieterkennzeichnung; leer = noch nachzutragen. */
  anbieterTelefon: string;
  b2bDomain: string;
  kontaktEmail: string;
  /** Optik-Schalter für CSS (data-optik am <html>). */
  optik: 'renten-rettung' | 'neutral';
}

/**
 * Design B – Farb-Token (Prompt 12, Abschnitt 4.1). Ampelfarben werden
 * ausschließlich im Ampel-Element verwendet; auf `cta` und `brand` steht
 * immer weiße Schrift, auf `ampelGelb` immer dunkle (`ink`).
 * Kontrastmessung: docs/DESIGN.md.
 */
export const COLORS = {
  bg: '#F5F8F7',
  surface: '#FFFFFF',
  ink: '#17202A',
  inkSoft: '#3A4652',
  muted: '#5B6772',
  brand: '#14365D',
  brandDeep: '#0C2440',
  sage: '#7FAF9B',
  sageLight: '#E4EFEA',
  line: '#DDE4E6',
  cta: '#C24E2B',
  ctaHover: '#A9411F',
  ampelGruen: '#1E8E4E',
  ampelGelb: '#D9A400',
  ampelRot: '#C62828',
  ampelAus: '#B9CCC3',
  focus: '#14365D',
} as const;

/** Schriften (Prompt 12, Abschnitt 4.2): Dateien unter brand/fonts/, OFL. */
export const SCHRIFTEN = {
  titel: 'Newsreader',
  text: 'Manrope',
} as const;

const RENTEN_RETTUNG: Marke = {
  name: 'Renten-Rettung',
  domain: 'renten-rettung.de',
  produktname: 'Prüfbericht',
  claim: 'Der Rückkaufswert ist nicht das letzte Wort.',
  range: { from: 1980, to: 2020 },
  stadt: 'Berlin',
  anbieter: 'Kaufmannsladen Gebhard GmbH',
  anbieterAnschrift: { strasse: 'Helmkrautstraße 35 A', plz: '13503', ort: 'Berlin' },
  anbieterVertretung: 'Geschäftsführer Jerome Gebhard',
  anbieterRegister: 'Amtsgericht Charlottenburg (Berlin), HRB 223190 B',
  anbieterUstId: 'DE815896163',
  anbieterTelefon: '01573 7634466',
  // Entscheidung 21.09.2026: renten-rettung.de wird die Privatkunden-Seite; der
  // Geschäftsführer-Bereich ist geparkt (sites/unternehmer/archiv), keine B2B-Domain.
  b2bDomain: '',
  kontaktEmail: 'info@renten-rettung.de',
  optik: 'renten-rettung',
};

/** Modell C: markenneutral; Name, Domain und Anbieterdaten kommen aus der Umgebung der Kanzlei. */
const KANZLEI_NEUTRAL: Marke = {
  name: process.env['NEXT_PUBLIC_KANZLEI_NAME'] ?? 'Policen-Check Kanzleiversion',
  domain: process.env['NEXT_PUBLIC_KANZLEI_DOMAIN'] ?? '[[KANZLEI-DOMAIN]]',
  produktname: 'Prüfbericht',
  claim: 'Rückabwicklung von Lebens- und Rentenversicherungen – Kurzprüfung',
  range: { from: 1980, to: 2020 },
  stadt: '',
  anbieter: process.env['NEXT_PUBLIC_KANZLEI_ANBIETER'] ?? '[[KANZLEI]]',
  anbieterAnschrift: {
    strasse: process.env['NEXT_PUBLIC_KANZLEI_STRASSE'] ?? '',
    plz: process.env['NEXT_PUBLIC_KANZLEI_PLZ'] ?? '',
    ort: process.env['NEXT_PUBLIC_KANZLEI_ORT'] ?? '',
  },
  anbieterVertretung: process.env['NEXT_PUBLIC_KANZLEI_VERTRETUNG'] ?? '',
  anbieterRegister: process.env['NEXT_PUBLIC_KANZLEI_REGISTER'] ?? '',
  anbieterUstId: process.env['NEXT_PUBLIC_KANZLEI_USTID'] ?? '',
  anbieterTelefon: process.env['NEXT_PUBLIC_KANZLEI_TELEFON'] ?? '',
  b2bDomain: '',
  kontaktEmail: process.env['NEXT_PUBLIC_KANZLEI_EMAIL'] ?? '[[KANZLEI-EMAIL]]',
  optik: 'neutral',
};

export const BRAND: Marke = PRODUKT_VARIANTE === 'kanzlei' ? KANZLEI_NEUTRAL : RENTEN_RETTUNG;

/** „Vertrag von 1980 bis 2020“ – ein Ort für die Formulierung. */
export const RANGE_TEXT = `${BRAND.range.from} bis ${BRAND.range.to}`;
