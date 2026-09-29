/**
 * E-Mail-Versand mit austauschbarem Weg:
 * - RESEND_API_KEY gesetzt → Versand über die Resend-HTTP-API (Anhänge als Base64).
 * - sonst → Protokoll-Modus: die Nachricht wird als Textdatei im
 *   Auslieferungsordner abgelegt (nur lokal, Entwicklung), nichts geht nach außen.
 *   Auf Vercel ist der Schlüssel Pflicht: /tmp überlebt den Aufruf nicht, eine
 *   Bestellung würde sonst als ausgeliefert markiert, ohne dass etwas rausgeht.
 *
 * Personenbezogene Daten werden nicht geloggt; im Protokoll steht nur die
 * Bestellnummer und der Dateipfad.
 */
import { randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { BRAND } from '@/config/brand';

export interface MailAnhang {
  dateiname: string;
  inhalt: Buffer;
  typ: string;
}

export interface MailNachricht {
  an: string;
  betreff: string;
  text: string;
  anhaenge?: MailAnhang[];
}

export interface VersandErgebnis {
  weg: 'resend' | 'protokoll';
  kennung: string;
}

function absender(): string {
  const konfiguriert = process.env['MAIL_ABSENDER'];
  return konfiguriert !== undefined && konfiguriert !== '' ? konfiguriert : `${BRAND.name} <${BRAND.kontaktEmail}>`;
}

/** Laufende Nummer je Prozess – zwei Mails in derselben Millisekunde überschreiben sich sonst. */
let laufnummer = 0;

async function ueberResend(nachricht: MailNachricht, apiKey: string): Promise<VersandErgebnis> {
  const antwort = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: absender(),
      to: [nachricht.an],
      subject: nachricht.betreff,
      text: nachricht.text,
      attachments: (nachricht.anhaenge ?? []).map((a) => ({
        filename: a.dateiname,
        content: a.inhalt.toString('base64'),
        content_type: a.typ,
      })),
    }),
  });
  if (!antwort.ok) {
    throw new Error(`Mail-Versand fehlgeschlagen (HTTP ${antwort.status}).`);
  }
  const daten = (await antwort.json()) as { id?: string };
  return { weg: 'resend', kennung: daten.id ?? '' };
}

function insProtokoll(nachricht: MailNachricht, verzeichnis: string): VersandErgebnis {
  mkdirSync(verzeichnis, { recursive: true });
  laufnummer += 1;
  // Zeitstempel vorn (chronologische Sortierung), Laufnummer je Prozess, Zufallssuffix je Instanz.
  const kennung = `mail-${new Date().toISOString().replace(/[:.]/g, '-')}-${String(laufnummer).padStart(4, '0')}-${randomBytes(2).toString('hex')}`;
  const anhaenge = (nachricht.anhaenge ?? []).map((a) => `${a.dateiname} (${a.typ}, ${a.inhalt.length} Bytes)`).join(', ');
  writeFileSync(
    resolve(verzeichnis, `${kennung}.txt`),
    `Von: ${absender()}\nAn: ${nachricht.an}\nBetreff: ${nachricht.betreff}\nAnhänge: ${anhaenge || '–'}\n\n${nachricht.text}\n`,
    { flag: 'wx' },
  );
  return { weg: 'protokoll', kennung };
}

/** Versendet die Nachricht; `protokollVerzeichnis` nimmt sie im Protokoll-Modus auf. */
export async function sendeMail(nachricht: MailNachricht, protokollVerzeichnis: string): Promise<VersandErgebnis> {
  const apiKey = process.env['RESEND_API_KEY'];
  if (apiKey !== undefined && apiKey !== '') {
    return ueberResend(nachricht, apiKey);
  }
  // Serverless: /tmp überlebt den Aufruf nicht – ein Protokoll wäre wertlos, und die Bestellung
  // würde als ausgeliefert markiert, ohne dass etwas nach außen geht. Lieber laut scheitern.
  if (process.env['VERCEL'] !== undefined) {
    throw new Error('RESEND_API_KEY fehlt – der Protokoll-Modus gilt nur lokal, auf Vercel ist kein Versand möglich.');
  }
  return insProtokoll(nachricht, protokollVerzeichnis);
}
