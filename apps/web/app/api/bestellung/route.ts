/**
 * Bestellung anlegen: Formular und Fall prüfen, Stripe-Checkout-Sitzung
 * erzeugen und die Weiterleitungsadresse zurückgeben. Gespeichert wird hier
 * nichts; der Fall reist kodiert in den Sitzungs-Metadaten mit.
 */
import { NextResponse } from 'next/server';
import { berechneRueckabwicklung } from '@rueckab/calc';
import type { RiskDefaults } from '@rueckab/calc';
import riskJson from '../../../../../data/risk-defaults.json';
import { draftZuEingaben } from '@/lib/berechnung';
import { pruefeBestellformular } from '@/lib/bestellung';
import type { Bestellformular } from '@/lib/bestellung';
import { uebernehmeBekannteFelder } from '@/lib/draft';
import { findeVersichererId, insurersDaten } from '@/lib/insurers-data';
import { begrenzt, clientSchluessel } from '@/lib/ratenlimit';
import { erfuelleBestellung, erzeugeBericht } from '@/lib/erfuellung';
import { markiereCodeVerwendet, pruefeFreischaltcode } from '@/lib/erstkunden';
import { fallAlsMetadaten } from '@/lib/fall-kodierung';
import { sendeMail } from '@/lib/versand';
import { bestellungAktiv, erstelleCheckoutSitzung } from '@/lib/zahlung';

export const runtime = 'nodejs';

const riskDefaults = riskJson as unknown as RiskDefaults;

/** Schneller als drei Sekunden füllt kein Mensch das Bestellformular aus. */
const MINDESTZEIT_MS = 3000;

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
  // Spam-Schutz: Honigtopf-Feld (nur Bots füllen es), Mindestzeit im Formular, Ratenbegrenzung.
  if (typeof eingabe['firma_webseite'] === 'string' && eingabe['firma_webseite'] !== '') {
    return NextResponse.json({ fehler: { fall: 'Ungültige Anfrage.' } }, { status: 400 });
  }
  const gestartet = typeof eingabe['gestartet'] === 'number' ? eingabe['gestartet'] : 0;
  if (gestartet > 0 && Date.now() - gestartet < MINDESTZEIT_MS) {
    return NextResponse.json({ fehler: { fall: 'Bitte einen Moment warten und dann erneut senden.' } }, { status: 429 });
  }
  if (begrenzt(`bestellung:${clientSchluessel(request)}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ fehler: { fall: 'Zu viele Versuche. Bitte in einer Stunde erneut versuchen.' } }, { status: 429 });
  }
  const draft = uebernehmeBekannteFelder(
    typeof eingabe['draft'] === 'object' && eingabe['draft'] !== null ? (eingabe['draft'] as Record<string, unknown>) : {},
  );
  const formular: Bestellformular = {
    name: typeof eingabe['name'] === 'string' ? eingabe['name'] : '',
    email: typeof eingabe['email'] === 'string' ? eingabe['email'] : '',
    agbGelesen: eingabe['agbGelesen'] === true,
    ausfuehrungZugestimmt: eingabe['ausfuehrungZugestimmt'] === true,
  };
  const freischaltcode = typeof eingabe['freischaltcode'] === 'string' ? eingabe['freischaltcode'].trim() : '';

  // Ohne Zahlungsanbieter ist nur der Erstkunden-Weg offen.
  if (!bestellungAktiv() && freischaltcode === '') {
    return NextResponse.json({ fehler: { fall: 'Die Bestellung ist noch nicht freigeschaltet.' } }, { status: 503 });
  }

  const fehler = pruefeBestellformular(formular, draft);
  if (Object.keys(fehler).length > 0) {
    return NextResponse.json({ fehler }, { status: 422 });
  }

  // Gibt es für diesen Vertrag schon eine Berichtsvorlage? Sonst nichts verkaufen.
  const abbildung = draftZuEingaben(draft, findeVersichererId, new Date().toISOString().slice(0, 7));
  if (abbildung.fehler.length > 0) {
    return NextResponse.json({ fehler: { fall: abbildung.fehler.join(' ') } }, { status: 422 });
  }
  const calc = berechneRueckabwicklung(abbildung.contract, insurersDaten, riskDefaults);
  if (calc.regime !== 'alt-policenmodell') {
    return NextResponse.json(
      {
        fehler: {
          fall: 'Für diesen Vertrag gibt es den schriftlichen Bericht noch nicht. Ihre kostenlose Ampel bleibt gültig; wir berechnen nichts.',
        },
      },
      { status: 422 },
    );
  }

  // Erstkunden-Programm: gültiger Code → Prüfbericht kostenlos, direkte Auslieferung.
  if (freischaltcode !== '') {
    const stand = pruefeFreischaltcode(freischaltcode);
    if (stand !== 'gueltig') {
      return NextResponse.json(
        { fehler: { fall: stand === 'verbraucht' ? 'Dieser Freischaltcode wurde bereits verwendet.' : 'Dieser Freischaltcode ist nicht gültig.' } },
        { status: 422 },
      );
    }
    const code = freischaltcode.toUpperCase();
    const bestellnummer = `EK-${code}`;
    const status = await erfuelleBestellung(
      {
        id: `ek_${code}`,
        bestellnummer,
        kundenname: formular.name.trim(),
        email: formular.email.trim(),
        metadata: { bestellnummer, kundenname: formular.name.trim(), ...fallAlsMetadaten(draft) },
      },
      {
        erzeugeBericht,
        sendeMail,
        rechnungLink: async () => undefined,
        istAusgeliefert: async () => false,
        markiereAusgeliefert: async () => markiereCodeVerwendet(code),
        jetzt: () => new Date(),
      },
    );
    if (status.mailVersendetAm !== undefined) {
      return NextResponse.json({ erstkunde: true, bestellnummer });
    }
    return NextResponse.json(
      { fehler: { fall: 'Der Prüfbericht ließ sich gerade nicht erstellen. Ihr Code bleibt gültig; wir haben eine Meldung erhalten und melden uns.' } },
      { status: 502 },
    );
  }

  try {
    const ergebnis = await erstelleCheckoutSitzung({ draft, name: formular.name, email: formular.email });
    return NextResponse.json(ergebnis);
  } catch (grund) {
    console.error('Checkout-Sitzung fehlgeschlagen:', grund instanceof Error ? grund.message : 'unbekannter Fehler');
    return NextResponse.json(
      { fehler: { fall: 'Die Zahlungsseite lässt sich gerade nicht öffnen. Bitte in ein paar Minuten noch einmal versuchen.' } },
      { status: 502 },
    );
  }
}
