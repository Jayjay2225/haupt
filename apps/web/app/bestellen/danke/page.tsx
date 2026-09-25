import type { Metadata } from 'next';
import Link from 'next/link';
import { KontaktAdresse } from '@/components/KontaktAdresse';
import { BRAND } from '@/config/brand';
import { bestellungAktiv, stripeClient } from '@/lib/zahlung';

export const metadata: Metadata = {
  title: 'Danke für Ihre Bestellung',
};

export const dynamic = 'force-dynamic';

interface Stand {
  bestellnummer: string;
  email: string;
  bezahlt: boolean;
}

/** Liest den Stand der Zahlung aus der Checkout-Sitzung; ohne Sitzung nur der allgemeine Text. */
async function ladeStand(sitzungId: string | undefined): Promise<Stand | undefined> {
  if (sitzungId === undefined || sitzungId === '' || !bestellungAktiv()) {
    return undefined;
  }
  try {
    const sitzung = await stripeClient().checkout.sessions.retrieve(sitzungId);
    return {
      bestellnummer: sitzung.metadata?.['bestellnummer'] ?? '–',
      email: sitzung.customer_details?.email ?? sitzung.customer_email ?? '',
      bezahlt: sitzung.payment_status === 'paid',
    };
  } catch {
    return undefined;
  }
}

export default async function DankeSeite({ searchParams }: { searchParams: Promise<{ sitzung?: string; ek?: string }> }) {
  const { sitzung, ek } = await searchParams;
  const stand = await ladeStand(sitzung);
  if (ek === '1') {
    return (
      <div className="container schmal abschnitt">
        <h1>
          Danke. <span className="hervor">Ihr Erstkunden-Prüfbericht</span> ist unterwegs.
        </h1>
        <p className="untertitel">
          Kostenlos, wie versprochen. Vertragsbestätigung und Prüfbericht (PDF) kommen per E-Mail –
          bitte auch den Spam-Ordner prüfen.
        </p>
        <p>
          Unsere Bitte im Gegenzug: Antworten Sie kurz auf die E-Mail – war der Prüfbericht
          verständlich, hat er geholfen? Ein Zitat zeigen wir nur mit Ihrer dokumentierten
          Einwilligung.
        </p>
        <p>
          <Link href="/" className="knopf">
            Zur Startseite
          </Link>
        </p>
      </div>
    );
  }
  return (
    <div className="container schmal abschnitt">
      <h1>Danke. Ihr Prüfbericht kommt.</h1>
      {stand !== undefined ? (
        <>
          <p className="untertitel">
            {stand.bezahlt
              ? 'Ihre Zahlung ist eingegangen.'
              : 'Ihre Zahlung wird noch bestätigt – bei Klarna, PayPal oder SEPA kann das dauern.'}{' '}
            Bestellnummer <strong className="tabellenziffern">{stand.bestellnummer}</strong>.
          </p>
          <p>
            Ihr Prüfbericht kommt innerhalb von 12 Stunden per E-Mail an <strong>{stand.email}</strong>;
            er wird vor dem Versand plausibilisiert. Die Rechnung kommt gesondert. Bitte auch den
            Spam-Ordner prüfen.
          </p>
        </>
      ) : (
        <p className="untertitel">
          Ihr Prüfbericht kommt innerhalb von 12 Stunden per E-Mail; er wird vor dem Versand
          plausibilisiert. Die Rechnung kommt gesondert.
        </p>
      )}
      <p>
        Nichts angekommen? Schreiben Sie an <KontaktAdresse adresse={BRAND.kontaktEmail} />
        {stand !== undefined ? ` und nennen Sie die Bestellnummer ${stand.bestellnummer}` : ''}.
      </p>
      <p>
        <Link href="/" className="knopf">
          Zur Startseite
        </Link>
      </p>
    </div>
  );
}
