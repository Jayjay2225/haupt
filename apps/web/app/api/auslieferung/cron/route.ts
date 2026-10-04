/**
 * Versand-Cron (Prompt 13, Abschnitt 3): von Vercel aufgerufen (vercel.json →
 * crons; auf dem Hobby-Plan täglich, live stündlich). Sucht bezahlte
 * Bestellungen der letzten 30 Tage bei Stripe (gleiches Fenster wie die
 * Admin-Liste – SEPA-Zahlungen werden erst Tage nach der Sitzung bestätigt),
 * bearbeitet die ältesten zuerst, entscheidet je Bestellung (Freigabe erteilt
 * ODER älter als die Auto-Frist) und versendet den Bericht. Zustand
 * ausschließlich in den Stripe-Metadaten – kein eigener Speicher nötig.
 *
 * Auth: Vercel-Cron sendet `Authorization: Bearer ${CRON_SECRET}`; ein
 * manueller Anstoß geht aus dem angemeldeten Admin-Browser (Cookie).
 */
import type Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { cronAutorisiert } from '@/lib/admin';
import { BERICHT_VERSAND } from '@/config/business';
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
  // `created` ist die Erstellung der Sitzung, nicht der Zahlungseingang: 30 Tage wie die Admin-Liste.
  const seit = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
  const ergebnis = { geprueft: 0, versendet: 0, wartet: 0, fehler: [] as string[] };
  let versendet = 0;

  // Erst sammeln, dann älteste zuerst: Stripe liefert neueste zuerst, und bei mehr als
  // MAX_JE_LAUF sendebereiten Bestellungen müssen die fristkritischen zuerst raus.
  const kandidaten: Stripe.Checkout.Session[] = [];
  for await (const sitzung of stripe.checkout.sessions.list({
    created: { gte: seit },
    limit: 100,
    expand: ['data.payment_intent'],
  })) {
    if (sitzung.payment_status === 'paid' && (sitzung.metadata?.['bestellnummer'] ?? '') !== '') {
      kandidaten.push(sitzung);
    }
  }
  kandidaten.sort((a, b) => a.created - b.created);

  for (const sitzung of kandidaten) {
    ergebnis.geprueft += 1;
    try {
      const daten = sitzungsDaten(sitzung);
      const marker = await deps.holeMarker(daten);
      const jetzt = deps.jetzt();
      const entscheidung = entscheideVersand(marker, jetzt);
      // 'unbereit' = Phase A (noch) nicht abgeschlossen: der Webhook läuft gerade oder Stripe
      // stellt erneut zu. Erst nachholen, wenn die Auto-Frist seit dem Zahlungseingang (Marker
      // `bestaetigt`) abgelaufen ist. Fehlt der Marker, ist die Sitzungserstellung kein Anker
      // (SEPA wird Tage später bestätigt): dann merkt sich der Cron den ersten Sichtkontakt
      // (`gesehen_am`) und holt frühestens eine Auto-Frist später nach – Freigabefenster und
      // Stripe-Retry bleiben erhalten.
      let anker = marker.bestaetigt !== undefined ? Date.parse(marker.bestaetigt) : marker.gesehen !== undefined ? Date.parse(marker.gesehen) : Number.NaN;
      if (entscheidung === 'unbereit' && Number.isNaN(anker)) {
        await deps.setzeMarker(daten, { gesehen: jetzt.toISOString() });
        anker = jetzt.getTime();
      }
      const fristAbgelaufen = !Number.isNaN(anker) && jetzt.getTime() - anker >= BERICHT_VERSAND.autoVersandNachStunden * 60 * 60 * 1000;
      if (entscheidung === 'senden' || (entscheidung === 'unbereit' && fristAbgelaufen)) {
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
      } else if (entscheidung === 'warten' || entscheidung === 'unbereit') {
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
