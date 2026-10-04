/**
 * Bestellung anlegen (Prompt 14, Schritt 11): Entwurf samt Person und
 * Bestätigungen prüfen, Stripe-Checkout-Sitzung erzeugen und die
 * Weiterleitungsadresse zurückgeben. Gespeichert wird hier nichts; der Fall
 * (inklusive Postwunsch und Anschrift) reist kodiert in den
 * Sitzungs-Metadaten mit.
 */
import { NextResponse } from 'next/server';
import { berechneRueckabwicklung } from '@rueckab/calc';
import type { RiskDefaults } from '@rueckab/calc';
import riskJson from '../../../../../data/risk-defaults.json';
import { BRAND } from '@/config/brand';
import { berichtKaufbar, bestimmeUebernahmeAmpel } from '@/lib/ampel';
import { draftZuEingaben } from '@/lib/berechnung';
import { pruefeBestellung } from '@/lib/bestellung';
import { BEGINN_MAX, BEGINN_MIN, kundenname, uebernehmeBekannteFelder } from '@/lib/draft';
import { heuteBerlin } from '@/lib/format';
import { findeVersichererId, insurersDaten } from '@/lib/insurers-data';
import { begrenzt, clientSchluessel } from '@/lib/ratenlimit';
import { erfuelleBestellung, erzeugeBericht } from '@/lib/erfuellung';
import { codeInfo, entferneCodeVerwendet, markiereCodeVerwendet, pruefeFreischaltcode } from '@/lib/erstkunden';
import { fallAlsMetadaten } from '@/lib/fall-kodierung';
import { sendeMail } from '@/lib/versand';
import { bestellungAktiv, erstelleCheckoutSitzung } from '@/lib/zahlung';

export const runtime = 'nodejs';
// Erstkunden-Pfad erzeugt das PDF synchron (Chromium-Kaltstart eingerechnet).
export const maxDuration = 60;

const riskDefaults = riskJson as unknown as RiskDefaults;

export async function POST(request: Request): Promise<NextResponse> {
  let roh: unknown;
  try {
    roh = await request.json();
  } catch {
    return NextResponse.json({ fehler: { fall: 'Ungültige Anfrage.' } }, { status: 400 });
  }
  if (typeof roh !== 'object' || roh === null) {
    return NextResponse.json({ fehler: { fall: 'Ungültige Anfrage.' } }, { status: 400 });
  }
  const eingabe = roh as Record<string, unknown>;
  // Spam-Schutz: Honigtopf-Feld (nur Bots füllen es) und Ratenbegrenzung.
  if (typeof eingabe['firma_webseite'] === 'string' && eingabe['firma_webseite'] !== '') {
    return NextResponse.json({ fehler: { fall: 'Ungültige Anfrage.' } }, { status: 400 });
  }
  if (begrenzt(`bestellung:${clientSchluessel(request)}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ fehler: { fall: 'Zu viele Versuche. Bitte in einer Stunde erneut versuchen.' } }, { status: 429 });
  }
  const draft = uebernehmeBekannteFelder(
    typeof eingabe['draft'] === 'object' && eingabe['draft'] !== null ? (eingabe['draft'] as Record<string, unknown>) : {},
  );
  const freischaltcode = typeof eingabe['freischaltcode'] === 'string' ? eingabe['freischaltcode'].trim() : '';

  // Ohne Zahlungsanbieter ist nur der Erstkunden-Weg offen.
  if (!bestellungAktiv() && freischaltcode === '') {
    return NextResponse.json({ fehler: { fall: 'Die Bestellung ist noch nicht freigeschaltet.' } }, { status: 503 });
  }

  const fehler = pruefeBestellung(draft);
  if (Object.keys(fehler).length > 0) {
    return NextResponse.json({ fehler }, { status: 422 });
  }
  const name = kundenname(draft);
  const email = draft.email.trim();

  // Rechnet der Fall überhaupt durch? Sonst nichts verkaufen. Fondsgebundene
  // Verträge laufen im Anfrage-Modus (config/ampel.ts) über die individuelle
  // Prüfung, nicht über das Gutachten; der Zeitraum ist auf BRAND.range begrenzt.
  try {
    const abbildung = draftZuEingaben(draft, findeVersichererId, heuteBerlin().slice(0, 7));
    if (abbildung.fehler.length > 0) {
      return NextResponse.json({ fehler: { fall: abbildung.fehler.join(' ') } }, { status: 422 });
    }
    if (abbildung.fondsAnfrage) {
      return NextResponse.json(
        {
          fehler: {
            fall: 'Fondsgebundene Verträge rechnen wir nicht mit der Standardformel. Nutzen Sie bitte die individuelle Anfrage – wir berechnen hier nichts.',
          },
        },
        { status: 422 },
      );
    }
    if (draft.beginn < BEGINN_MIN || draft.beginn > BEGINN_MAX) {
      return NextResponse.json(
        {
          fehler: {
            fall: `Das Gutachten deckt Verträge mit Beginn ${BRAND.range.from} bis ${BRAND.range.to} ab. Für andere Jahrgänge nutzen Sie bitte die individuelle Anfrage.`,
          },
        },
        { status: 422 },
      );
    }
    // Übernahme-Ampel (Prompt 13/14): Verkauft wird das Gutachten nur bei Grün/Gelb
    // (Grau nur, wenn berichtUnterSchwelle das freischaltet).
    const calc = berechneRueckabwicklung(abbildung.contract, insurersDaten, riskDefaults);
    const ampel = bestimmeUebernahmeAmpel(
      calc,
      abbildung.contract.status,
      abbildung.contract.rueckkaufswert?.betrag,
    );
    if (!berichtKaufbar(ampel)) {
      const text =
        ampel.grund === 'status'
          ? 'Gekündigte oder ausgezahlte Verträge übernehmen wir nicht – deshalb verkaufen wir Ihnen dafür auch kein Gutachten.'
          : ampel.grund === 'zu-klein'
            ? 'Ihr Vertrag liegt unter unserer Mindestgrenze – für unser Verfahren zu klein; wir berechnen hier nichts.'
            : 'Für diesen Vertrag kommt unser Verfahren rechnerisch nicht in Frage – wir verkaufen Ihnen dafür kein Gutachten.';
      return NextResponse.json({ fehler: { fall: text } }, { status: 422 });
    }
  } catch {
    return NextResponse.json(
      { fehler: { fall: 'Die Angaben zur Police lassen sich so nicht durchrechnen. Bitte prüfen Sie Beginn, Beitrag und Daten im Rechner.' } },
      { status: 422 },
    );
  }

  // Erstkunden-Programm: gültiger Code → Gutachten kostenlos, direkte Auslieferung.
  if (freischaltcode !== '') {
    // Enger als die allgemeine Bremse: Gratis-PDF + Mail sind teuer und missbrauchbar.
    if (begrenzt(`erstkunde:${clientSchluessel(request)}`, 3, 60 * 60 * 1000)) {
      return NextResponse.json({ fehler: { fall: 'Zu viele Versuche mit Freischaltcode. Bitte später erneut.' } }, { status: 429 });
    }
    const stand = pruefeFreischaltcode(freischaltcode);
    if (stand !== 'gueltig') {
      const text =
        stand === 'verbraucht'
          ? 'Dieser Freischaltcode wurde bereits verwendet.'
          : stand === 'abgelaufen'
            ? 'Dieser Freischaltcode ist abgelaufen.'
            : 'Dieser Freischaltcode ist nicht gültig.';
      return NextResponse.json({ fehler: { fall: text } }, { status: 422 });
    }
    const code = freischaltcode.toUpperCase();
    const info = codeInfo(code);
    const einmalig = info?.art !== 'mehrfach';
    // Einmal-Code SOFORT reservieren (Check-then-act-Fenster schließen); bei Fehlschlag wieder freigeben.
    if (einmalig) {
      markiereCodeVerwendet(code);
    }
    // Mehrfach-Codes brauchen eine eindeutige Bestellnummer je Einlösung.
    const bestellnummer = einmalig ? `EK-${code}` : `EK-${code}-${Date.now().toString(36).toUpperCase()}`;
    const status = await erfuelleBestellung(
      {
        id: `ek_${code}`,
        bestellnummer,
        kundenname: name,
        email,
        postversand: draft.postversand,
        metadata: { bestellnummer, kundenname: name, post: draft.postversand ? '1' : '0', ...fallAlsMetadaten(draft) },
      },
      {
        erzeugeBericht,
        sendeMail,
        rechnungLink: async () => undefined,
        holeMarker: async () => ({}),
        setzeMarker: async () => {},
        jetzt: () => new Date(),
      },
    );
    if (status.mailVersendetAm !== undefined) {
      return NextResponse.json({ erstkunde: true, bestellnummer });
    }
    if (einmalig) {
      entferneCodeVerwendet(code);
    }
    return NextResponse.json(
      { fehler: { fall: 'Das Gutachten ließ sich gerade nicht erstellen. Ihr Code bleibt gültig; wir haben eine Meldung erhalten und melden uns.' } },
      { status: 502 },
    );
  }

  try {
    const ergebnis = await erstelleCheckoutSitzung({ draft, name, email, postversand: draft.postversand });
    return NextResponse.json(ergebnis);
  } catch (grund) {
    console.error('Checkout-Sitzung fehlgeschlagen:', grund instanceof Error ? grund.message : 'unbekannter Fehler');
    return NextResponse.json(
      { fehler: { fall: 'Die Zahlungsseite lässt sich gerade nicht öffnen. Bitte in ein paar Minuten noch einmal versuchen.' } },
      { status: 502 },
    );
  }
}
