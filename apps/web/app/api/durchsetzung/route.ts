/**
 * Beauftragung der Durchsetzung (Prompt 13, 2.3): nimmt das Formular samt
 * Unterlagen entgegen und reicht alles als E-Mail an den Anbieter weiter –
 * die Dateien als Anhang, ohne Speicherung auf dem Server. Der Kunde erhält
 * eine Eingangsbestätigung. Spam-Schutz: Honigtopf + Ratenbremse.
 */
import { resolve } from 'node:path';
import { NextResponse } from 'next/server';
import { BRAND } from '@/config/brand';
import { auslieferungsVerzeichnis } from '@/lib/erfuellung';
import { uebernahmeAngefragt } from '@/lib/emails';
import { begrenzt, clientSchluessel } from '@/lib/ratenlimit';
import { sendeMail, type MailAnhang } from '@/lib/versand';

export const runtime = 'nodejs';
export const maxDuration = 60;

const EMAIL_MUSTER = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_DATEIEN = 5;
const MAX_GESAMT = 20 * 1024 * 1024;
const ERLAUBTE_TYPEN = new Set(['application/pdf', 'image/jpeg', 'image/png']);

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
  const rechtsschutz = feld(daten, 'rechtsschutz', 20);
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

  const anhaenge: MailAnhang[] = [];
  let gesamt = 0;
  const dateien = daten.getAll('unterlagen').filter((d): d is File => d instanceof File);
  for (const datei of dateien.slice(0, MAX_DATEIEN)) {
    if (!ERLAUBTE_TYPEN.has(datei.type)) {
      continue;
    }
    gesamt += datei.size;
    if (gesamt > MAX_GESAMT) {
      return NextResponse.json(
        { fehler: 'Die Unterlagen sind zusammen größer als 20 MB. Bitte weniger Dateien senden – Fehlendes können Sie nachreichen.' },
        { status: 422 },
      );
    }
    anhaenge.push({
      dateiname: datei.name.replace(/[^\w.\- ]/g, '_').slice(0, 120),
      inhalt: Buffer.from(await datei.arrayBuffer()),
      typ: datei.type,
    });
  }

  const text = [
    'Beauftragungsanfrage Durchsetzung (Formular /durchsetzung)',
    '',
    `Name: ${name}`,
    `E-Mail: ${email}`,
    `Telefon: ${telefon || '–'}`,
    `Bestellnummer: ${bestellnummer || '–'}`,
    `Rechtsschutzversicherung: ${rechtsschutz || '–'}`,
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
