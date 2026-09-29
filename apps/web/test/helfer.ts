/**
 * Gemeinsame Test-Helfer (keine Testdatei – wird von Vitest nicht als Suite
 * gesammelt, damit importierende Suiten die Tests nicht doppelt ausführen).
 */
import { readFileSync } from 'node:fs';
import { leererDraft } from '../lib/draft';
import type { CaseDraft } from '../lib/draft';

/**
 * Entwurf, der bis zum Schritt „Auszahlungen“ vollständig ist (Golden b als
 * Vorlage), dazu „Über Sie“ (Prompt 14, Schritt 10) und die Bestätigungen
 * des Schritts „Ihre Bestellung“.
 */
export function vollstaendigerDraft(): CaseDraft {
  return {
    ...leererDraft(),
    versicherer: 'Allianz Lebensversicherungs-AG',
    vertragsart: 'kapital-lv',
    beginn: '1995-10',
    status: 'laufend',
    zahlweise: 'monatlich',
    erstbeitrag: '1.000',
    erstbeitragWaehrung: 'DM',
    aktuellerBeitrag: '1.200',
    dynamik: 'ja',
    dynamikSatz: '5',
    gesamtsummeLautMitteilung: '439.455',
    rueckkaufswert: '310.658',
    auszahlungenErhalten: 'nein',
    policendarlehen: 'nein',
    buzEnthalten: 'nein',
    anrede: 'frau',
    vorname: 'Muster',
    nachname: 'Person',
    geburtsdatum: '1960-03-14',
    strasse: 'Musterstraße 1',
    plz: '12345',
    ort: 'Musterstadt',
    email: 'muster@example.org',
    einwilligungDatenschutz: true,
    agbGelesen: true,
    ausfuehrungZugestimmt: true,
  };
}

/** Quelltext ohne Kommentare – geprüft wird nur, was Nutzer sehen können. */
export function textInhalt(datei: string): string {
  return readFileSync(datei, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}
