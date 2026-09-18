/**
 * Marken-Konfiguration (Prompt 8, Entscheidung 1, 4, 5).
 *
 * Renten-Rettung ist die Privatkunden-Marke mit dem Policen-Check als Kern.
 * Der Absender (welche GmbH) ist noch offen – Platzhalter „[[ANBIETER]]“.
 * Der Geschäftsführer-Bereich zieht auf eine eigene Domain, Platzhalter
 * „[[B2B-DOMAIN]]“, bis die Registrierung steht.
 *
 * Für die markenneutrale Kanzlei-Lizenz (Modell C) liefert `markeFuerVariante`
 * eine neutrale Konfiguration ohne Renten-Rettung-Optik.
 */
import { PRODUKT_VARIANTE } from './variante';

export interface Marke {
  name: string;
  domain: string;
  produktname: string;
  claim: string;
  anbieter: string;
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
  anbieter: '[[ANBIETER]]',
  b2bDomain: '[[B2B-DOMAIN]]',
  kontaktEmail: 'info@renten-rettung.de',
  optik: 'renten-rettung',
};

/** Modell C: markenneutral; Name und Domain kommen aus der Umgebung der Kanzlei. */
const KANZLEI_NEUTRAL: Marke = {
  name: process.env['NEXT_PUBLIC_KANZLEI_NAME'] ?? 'Policen-Check Kanzleiversion',
  domain: process.env['NEXT_PUBLIC_KANZLEI_DOMAIN'] ?? '[[KANZLEI-DOMAIN]]',
  produktname: 'Policen-Check',
  claim: 'Rückabwicklung von Lebens- und Rentenversicherungen – Kurzprüfung',
  anbieter: process.env['NEXT_PUBLIC_KANZLEI_ANBIETER'] ?? '[[KANZLEI]]',
  b2bDomain: '',
  kontaktEmail: process.env['NEXT_PUBLIC_KANZLEI_EMAIL'] ?? '[[KANZLEI-EMAIL]]',
  optik: 'neutral',
};

export const BRAND: Marke = PRODUKT_VARIANTE === 'kanzlei' ? KANZLEI_NEUTRAL : RENTEN_RETTUNG;
