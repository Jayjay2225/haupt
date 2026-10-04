/**
 * Anfragen (Prompt 12): individuelle Prüfung (/anfrage, auch Fonds) und
 * Ankaufsangebot (/verkaufen). Die Anfrage geht als E-Mail an den Anbieter;
 * gespeichert wird serverseitig nichts. Spam-Schutz: Honigtopf + Ratenbremse.
 */
import { resolve } from 'node:path';
import { NextResponse } from 'next/server';
import { BRAND } from '@/config/brand';
import { anfrageEingegangen } from '@/lib/emails';
import { auslieferungsVerzeichnis } from '@/lib/erfuellung';
import { begrenzt, clientSchluessel } from '@/lib/ratenlimit';
import { sendeMail } from '@/lib/versand';

export const runtime = 'nodejs';

const EMAIL_MUSTER = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function feld(eingabe: Record<string, unknown>, name: string, max = 300): string {
  const wert = eingabe[name];
  return typeof wert === 'string' ? wert.trim().slice(0, max) : '';
}

export async function POST(request: Request): Promise<NextResponse> {
  let roh: unknown;
  try {
    roh = await request.json();
  } catch {
    return NextResponse.json({ fehler: 'Ungültige Anfrage.' }, { status: 400 });
  }
  const eingabe = (roh ?? {}) as Record<string, unknown>;
  // Honigtopf: nur Bots füllen das unsichtbare Feld.
  if (feld(eingabe, 'firma_webseite') !== '') {
    return NextResponse.json({ fehler: 'Ungültige Anfrage.' }, { status: 400 });
  }
  if (begrenzt(`anfrage:${clientSchluessel(request)}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ fehler: 'Zu viele Anfragen. Bitte später erneut versuchen.' }, { status: 429 });
  }

  const art = feld(eingabe, 'art') === 'ankauf' ? 'ankauf' : 'pruefung';
  const name = feld(eingabe, 'name', 120);
  const email = feld(eingabe, 'email', 200);
  const telefon = feld(eingabe, 'telefon', 60);
  const versicherer = feld(eingabe, 'versicherer', 160);
  const beginn = feld(eingabe, 'beginn', 20);
  const rueckkaufswert = feld(eingabe, 'rueckkaufswert', 40);
  const nachricht = feld(eingabe, 'nachricht', 2000);
  const einwilligung = eingabe['einwilligung'] === true;

  if (!EMAIL_MUSTER.test(email)) {
    return NextResponse.json({ fehler: 'Bitte eine vollständige E-Mail-Adresse angeben.' }, { status: 422 });
  }
  if (!einwilligung) {
    return NextResponse.json({ fehler: 'Ohne Ihr Einverständnis dürfen wir die Anfrage nicht bearbeiten.' }, { status: 422 });
  }

  const betreff =
    art === 'ankauf' ? '[Anfrage] Ankaufsangebot' : '[Anfrage] Individuelle Prüfung';
  const text = [
    `Art: ${art === 'ankauf' ? 'Ankaufsangebot (Verkaufen)' : 'Individuelle Prüfung'}`,
    `Name: ${name || '–'}`,
    `E-Mail: ${email}`,
    `Telefon: ${telefon || '–'}`,
    `Versicherer: ${versicherer || '–'}`,
    `Beginn: ${beginn || '–'}`,
    `Rückkaufswert (ungefähr): ${rueckkaufswert || '–'}`,
    '',
    nachricht === '' ? '' : `Nachricht:\n${nachricht}`,
    '',
    'Einwilligung zur Kontaktaufnahme: ja (Formular, Zeitpunkt = Eingang dieser Mail).',
  ].join('\n');

  try {
    const protokoll = resolve(auslieferungsVerzeichnis(), 'anfragen');
    await sendeMail({ an: BRAND.kontaktEmail, betreff, text }, protokoll);
    const bestaetigung = anfrageEingegangen(name);
    await sendeMail({ an: email, betreff: bestaetigung.betreff, text: bestaetigung.text }, protokoll);
    return NextResponse.json({ ok: true });
  } catch (fehler) {
    console.error('anfrage-versand fehlgeschlagen:', (fehler as Error).message);
    return NextResponse.json(
      { fehler: 'Die Anfrage ließ sich gerade nicht senden. Bitte später erneut versuchen.' },
      { status: 502 },
    );
  }
}
