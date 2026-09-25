/**
 * E-Mail-Versand mit austauschbarem Weg:
 * - RESEND_API_KEY gesetzt → Versand über die Resend-HTTP-API (Anhänge als Base64).
 * - sonst → Protokoll-Modus: die Nachricht wird als Textdatei im
 *   Auslieferungsordner abgelegt (Entwicklung/Beta), nichts geht nach außen.
 *
 * Personenbezogene Daten werden nicht geloggt; im Protokoll steht nur die
 * Bestellnummer und der Dateipfad.
 */
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
  return process.env['MAIL_ABSENDER'] ?? `${BRAND.name} <${BRAND.kontaktEmail}>`;
}

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
  const kennung = `mail-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  const anhaenge = (nachricht.anhaenge ?? []).map((a) => `${a.dateiname} (${a.typ}, ${a.inhalt.length} Bytes)`).join(', ');
  writeFileSync(
    resolve(verzeichnis, `${kennung}.txt`),
    `Von: ${absender()}\nAn: ${nachricht.an}\nBetreff: ${nachricht.betreff}\nAnhänge: ${anhaenge || '–'}\n\n${nachricht.text}\n`,
  );
  return { weg: 'protokoll', kennung };
}

/** Versendet die Nachricht; `protokollVerzeichnis` nimmt sie im Protokoll-Modus auf. */
export async function sendeMail(nachricht: MailNachricht, protokollVerzeichnis: string): Promise<VersandErgebnis> {
  const apiKey = process.env['RESEND_API_KEY'];
  if (apiKey !== undefined && apiKey !== '') {
    return ueberResend(nachricht, apiKey);
  }
  return insProtokoll(nachricht, protokollVerzeichnis);
}
