/**
 * Versand-Cron (Prompt 13, Abschnitt 3): stündlich von Vercel aufgerufen
 * (vercel.json → crons). Sucht bezahlte Bestellungen der letzten 3 Tage bei
 * Stripe, entscheidet je Bestellung (Freigabe erteilt ODER älter als die
 * Auto-Frist) und versendet den Bericht. Zustand ausschließlich in den
 * Stripe-Metadaten – kein eigener Speicher nötig.
 *
 * Auth: Vercel-Cron sendet `Authorization: Bearer ${CRON_SECRET}`;
 * alternativ manueller Aufruf mit ?schluessel=ADMIN_PASSWORT.
 */
import { NextResponse } from 'next/server';
import { cronAutorisiert } from '@/lib/admin';
import {
  entscheideVersand,
  sitzungsDaten,
  standardAbhaengigkeiten,
  versendeBericht,
} from '@/lib/erfuellung';
import { bestellungAktiv, stripeClient } from '@/lib/zahlung';

export const runtime = 'nodejs';
export const maxDuration = 300;

/** Höchstens so viele Berichte je Lauf (PDF-Erzeugung braucht Zeit). */
const MAX_JE_LAUF = 5;

export async function GET(request: Request): Promise<NextResponse> {
  if (!cronAutorisiert(request)) {
    return NextResponse.json({ fehler: 'Nicht autorisiert.' }, { status: 401 });
  }
  if (!bestellungAktiv()) {
    return NextResponse.json({ fehler: 'Stripe ist nicht konfiguriert.' }, { status: 503 });
  }
  const stripe = stripeClient();
  const deps = standardAbhaengigkeiten(stripe);
  const seit = Math.floor(Date.now() / 1000) - 3 * 24 * 60 * 60;
  const ergebnis = { geprueft: 0, versendet: 0, wartet: 0, fehler: [] as string[] };
  let versendet = 0;

  for await (const sitzung of stripe.checkout.sessions.list({
    created: { gte: seit },
    limit: 100,
    expand: ['data.payment_intent'],
  })) {
    if (sitzung.payment_status !== 'paid' || (sitzung.metadata?.['bestellnummer'] ?? '') === '') {
      continue;
    }
    ergebnis.geprueft += 1;
    try {
      const daten = sitzungsDaten(sitzung);
      const marker = await deps.holeMarker(daten);
      const entscheidung = entscheideVersand(marker, deps.jetzt());
      if (entscheidung === 'senden' || entscheidung === 'unbereit') {
        // 'unbereit' (Phase A verpasst, z. B. Webhook-Ausfall): nachholen und
        // direkt versenden – die Auto-Frist ist dann ohnehin überschritten.
        if (versendet >= MAX_JE_LAUF) {
          ergebnis.wartet += 1;
          continue;
        }
        const status = await versendeBericht(daten, deps);
        if (status.mailVersendetAm !== undefined) {
          ergebnis.versendet += 1;
          versendet += 1;
        } else {
          ergebnis.fehler.push(daten.bestellnummer);
        }
      } else if (entscheidung === 'warten') {
        ergebnis.wartet += 1;
      }
    } catch (fehler) {
      ergebnis.fehler.push((fehler as Error).message.slice(0, 120));
    }
  }
  console.log(
    `auslieferung-cron: geprueft=${ergebnis.geprueft} versendet=${ergebnis.versendet} wartet=${ergebnis.wartet} fehler=${ergebnis.fehler.length}`,
  );
  return NextResponse.json(ergebnis);
}
