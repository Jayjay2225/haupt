/**
 * Bestell-Liste für Admin/Freigaben und CSV-Export (Prompt 13, 2.3 und 3;
 * Prompt 14: Spalte „Post“). Quelle ist ausschließlich Stripe
 * (Checkout-Sitzungen + Marker in den PaymentIntent-Metadaten) – kein
 * eigener Speicher.
 */
import type Stripe from 'stripe';
import {
  entscheideVersand,
  sitzungsDaten,
  standardAbhaengigkeiten,
  type AuslieferungsMarker,
  type PostStand,
  type VersandEntscheidung,
} from './erfuellung';

export interface BestellZeile {
  sitzung: string;
  bestellnummer: string;
  kundenname: string;
  email: string;
  bezahltAm: string;
  marker: AuslieferungsMarker;
  entscheidung: VersandEntscheidung;
  kennzeichen: string[];
  leadStatus: string;
  /** Gedruckte Fassung per Post gewählt (Prompt 14, 0.3). */
  postversand: boolean;
  /** Stand des Postversands; ohne Postwunsch undefined. */
  post?: PostStand;
  postAm?: string;
}

export async function ladeBestellungen(stripe: Stripe, tage = 30): Promise<BestellZeile[]> {
  const deps = standardAbhaengigkeiten(stripe);
  const seit = Math.floor(Date.now() / 1000) - tage * 24 * 60 * 60;
  const zeilen: BestellZeile[] = [];
  for await (const sitzung of stripe.checkout.sessions.list({ created: { gte: seit }, limit: 100 })) {
    if (sitzung.payment_status !== 'paid' || (sitzung.metadata?.['bestellnummer'] ?? '') === '') {
      continue;
    }
    const daten = sitzungsDaten(sitzung);
    let marker: AuslieferungsMarker = {};
    try {
      marker = await deps.holeMarker(daten);
    } catch {
      // Marker nicht lesbar → Zeile trotzdem zeigen.
    }
    const postversand = daten.postversand || marker.post !== undefined;
    zeilen.push({
      sitzung: daten.id,
      bestellnummer: daten.bestellnummer,
      kundenname: daten.kundenname,
      email: daten.email,
      bezahltAm: new Date(sitzung.created * 1000).toISOString(),
      marker,
      entscheidung: entscheideVersand(marker, deps.jetzt()),
      kennzeichen: (marker.kennzeichen ?? '').split(';').map((k) => k.trim()).filter((k) => k !== ''),
      leadStatus: marker.leadStatus ?? 'Gutachten gekauft',
      postversand,
      ...(postversand ? { post: marker.post ?? 'gewuenscht' } : {}),
      ...(marker.postAm !== undefined ? { postAm: marker.postAm } : {}),
    });
  }
  return zeilen.sort((a, b) => b.bezahltAm.localeCompare(a.bezahltAm));
}

export function bestellungenAlsCsv(zeilen: BestellZeile[]): string {
  const kopf = [
    'bestellnummer',
    'kundenname',
    'email',
    'bezahlt_am',
    'erzeugt_am',
    'freigegeben_am',
    'ausgeliefert_am',
    'post',
    'post_am',
    'lead_status',
    'kennzeichen',
  ];
  const feld = (wert: string): string => `"${wert.replace(/"/g, '""')}"`;
  const daten = zeilen.map((z) =>
    [
      z.bestellnummer,
      z.kundenname,
      z.email,
      z.bezahltAm,
      z.marker.erzeugt ?? '',
      z.marker.freigegeben ?? '',
      z.marker.ausgeliefert ?? '',
      z.postversand ? (z.post ?? 'gewuenscht') : '',
      z.postAm ?? '',
      z.leadStatus,
      z.kennzeichen.join('; '),
    ]
      .map(feld)
      .join(';'),
  );
  return [kopf.join(';'), ...daten].join('\n');
}
