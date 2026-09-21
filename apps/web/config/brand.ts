/**
 * Marken-Konfiguration (Prompt 8, Entscheidung 1, 4, 5).
 *
 * Renten-Rettung ist die Privatkunden-Marke mit dem Policen-Check als Kern.
 * Anbieter ist die Kaufmannsladen Gebhard GmbH (Entscheidung 20.09.2026);
 * die Registerdaten stammen aus dem Handelsregister (Abruf 20.09.2026 über
 * online-handelsregister.de, Spiegel des Registerportals – vor Go-live gegen
 * handelsregister.de zu verifizieren). Umsatzsteuer-ID und Telefon hat der
 * Anbieter am 21.09.2026 geliefert.
 * Der Geschäftsführer-Bereich (B2B) ist geparkt: renten-rettung.de wird die
 * Privatkunden-Seite; eine B2B-Domain gibt es vorerst nicht (b2bDomain leer).
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
  produktname: string;
  claim: string;
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

export const FARBEN = {
  marine: '#0A1F33',
  weiss: '#FFFFFF',
  blaugrau: '#F1F4F8',
  orange: '#F2541B',
  orangeDunkel: '#B34011',
  sekundaer: '#4A5A66',
  linie: '#D7DFE4',
  ampelGruen: '#1E8E4E',
  ampelGelb: '#F2B705',
  ampelRot: '#C62828',
} as const;

export const SCHRIFTEN = {
  titel: 'Archivo',
  text: 'Source Sans 3',
} as const;

const RENTEN_RETTUNG: Marke = {
  name: 'Renten-Rettung',
  domain: 'renten-rettung.de',
  produktname: 'Policen-Check',
  claim: 'Alte Lebensversicherung? Erst rechnen. Dann kündigen.',
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
  produktname: 'Policen-Check',
  claim: 'Rückabwicklung von Lebens- und Rentenversicherungen – Kurzprüfung',
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
