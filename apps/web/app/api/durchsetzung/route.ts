/**
 * Beauftragung der Durchsetzung (Prompt 13, 2.3): nimmt das Formular samt
 * Unterlagen entgegen und reicht alles als E-Mail an den Anbieter weiter –
 * die Dateien als Anhang, ohne Speicherung auf dem Server. Der Kunde erhält
 * eine Eingangsbestätigung. Spam-Schutz: Honigtopf + Ratenbremse.
 */
import { resolve } from 'node:path';
import { NextResponse } from 'next/server';
import { BRAND } from '@/config/brand';
import { UNTERLAGEN_MAX_DATEIEN, UNTERLAGEN_MAX_GESAMT, UNTERLAGEN_MAX_GESAMT_TEXT } from '@/config/durchsetzung';
import { auslieferungsVerzeichnis } from '@/lib/erfuellung';
import { uebernahmeAngefragt } from '@/lib/emails';
import { begrenzt, clientSchluessel } from '@/lib/ratenlimit';
import { sendeMail, type MailAnhang } from '@/lib/versand';

export const runtime = 'nodejs';
export const maxDuration = 60;

const EMAIL_MUSTER = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PNG_KOPF = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/**
 * Dateityp aus Endung UND Dateikopf – der Content-Type des Clients ist frei
 * wählbar. PDF-Signatur innerhalb der ersten 1024 Byte (Scans mit Vorspann).
 */
function erkenneTyp(inhalt: Buffer, name: string): 'application/pdf' | 'image/jpeg' | 'image/png' | undefined {
  const endung = name.toLowerCase().match(/\.(pdf|jpe?g|png)$/)?.[1];
  if (endung === 'pdf' && inhalt.subarray(0, 1024).includes('%PDF-')) {
    return 'application/pdf';
  }
  if ((endung === 'jpg' || endung === 'jpeg') && inhalt[0] === 0xff && inhalt[1] === 0xd8 && inhalt[2] === 0xff) {
    return 'image/jpeg';
  }
  if (endung === 'png' && inhalt.subarray(0, 8).equals(PNG_KOPF)) {
    return 'image/png';
  }
  return undefined;
}

function feld(daten: FormData, name: string, max = 300): string {
  const wert = daten.get(name);
  return typeof wert === 'string' ? wert.trim().slice(0, max) : '';
}

export async function POST(request: Request): Promise<NextResponse> {
  if (begrenzt(`durchsetzung:${clientSchluessel(request)}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ fehler: 'Zu viele Anfragen. Bitte später erneut versuchen.' }, { status: 429 });
  }
  let daten: FormData;
  try {
    daten = await request.formData();
  } catch {
    return NextResponse.json({ fehler: 'Ungültige Anfrage.' }, { status: 400 });
  }
  if (feld(daten, 'firma_webseite') !== '') {
    return NextResponse.json({ fehler: 'Ungültige Anfrage.' }, { status: 400 });
  }

  const name = feld(daten, 'name', 120);
  const email = feld(daten, 'email', 200);
  const telefon = feld(daten, 'telefon', 60);
  const bestellnummer = feld(daten, 'bestellnummer', 60);
  const nachricht = feld(daten, 'nachricht', 2000);
  const einwilligungBeauftragung = feld(daten, 'einwilligungBeauftragung') === '1';
  const einwilligungWeitergabe = feld(daten, 'einwilligungWeitergabe') === '1';

  if (name === '' || !EMAIL_MUSTER.test(email)) {
    return NextResponse.json({ fehler: 'Bitte Name und vollständige E-Mail-Adresse angeben.' }, { status: 422 });
  }
  if (!einwilligungBeauftragung || !einwilligungWeitergabe) {
    return NextResponse.json(
      { fehler: 'Ohne beide Einwilligungen dürfen wir die Beauftragung nicht bearbeiten.' },
      { status: 422 },
    );
  }

  const dateien = daten.getAll('unterlagen').filter((d): d is File => d instanceof File);
  if (dateien.length > UNTERLAGEN_MAX_DATEIEN) {
    return NextResponse.json(
      { fehler: `Bitte höchstens ${UNTERLAGEN_MAX_DATEIEN} Dateien senden – Fehlendes können Sie nachreichen.` },
      { status: 422 },
    );
  }
  const anhaenge: MailAnhang[] = [];
  const abgelehnt: string[] = [];
  let gesamt = 0;
  for (const datei of dateien) {
    gesamt += datei.size;
    if (gesamt > UNTERLAGEN_MAX_GESAMT) {
      return NextResponse.json(
        {
          fehler: `Die Unterlagen sind zusammen größer als ${UNTERLAGEN_MAX_GESAMT_TEXT}. Bitte weniger Dateien senden – Fehlendes können Sie nachreichen.`,
        },
        { status: 422 },
      );
    }
    const dateiname = datei.name.replace(/[^\w.\- ]/g, '_').slice(0, 120);
    const inhalt = Buffer.from(await datei.arrayBuffer());
    const typ = erkenneTyp(inhalt, datei.name);
    if (typ === undefined) {
      abgelehnt.push(dateiname);
      continue;
    }
    // Typ aus der Erkennung, nicht vom Client.
    anhaenge.push({ dateiname, inhalt, typ });
  }
  if (abgelehnt.length > 0) {
    // Nichts stillschweigend weglassen: die Kundin bzw. der Kunde soll wissen, was nicht ankam.
    return NextResponse.json(
      {
        fehler: `Bitte nur PDF, JPG oder PNG. Nicht übernommen: ${abgelehnt.join(', ')}. Fotos ggf. als JPG speichern – oder einfach nachreichen.`,
      },
      { status: 422 },
    );
  }

  const text = [
    'Beauftragungsanfrage Durchsetzung (Formular /durchsetzung)',
    '',
    `Name: ${name}`,
    `E-Mail: ${email}`,
    `Telefon: ${telefon || '–'}`,
    `Bestellnummer: ${bestellnummer || '–'}`,
    `Unterlagen: ${anhaenge.length} Datei(en) im Anhang`,
    '',
    nachricht === '' ? '' : `Anmerkungen:\n${nachricht}`,
    '',
    'Einwilligungen: Beauftragung JA, Weitergabe an Partnerkanzlei JA (Zeitpunkt = Eingang dieser Mail).',
    'Lead-Status im Admin auf „Übernahme angefragt“ setzen.',
  ].join('\n');

  try {
    const protokoll = resolve(auslieferungsVerzeichnis(), 'durchsetzung');
    await sendeMail({ an: BRAND.kontaktEmail, betreff: `[Durchsetzung] Beauftragung ${bestellnummer || name}`, text, anhaenge }, protokoll);
    const bestaetigung = uebernahmeAngefragt(name);
    await sendeMail({ an: email, betreff: bestaetigung.betreff, text: bestaetigung.text }, protokoll);
    return NextResponse.json({ ok: true });
  } catch (fehler) {
    console.error('durchsetzung-versand fehlgeschlagen:', (fehler as Error).message);
    return NextResponse.json(
      { fehler: 'Die Anfrage ließ sich gerade nicht senden. Bitte später erneut versuchen.' },
      { status: 502 },
    );
  }
}
