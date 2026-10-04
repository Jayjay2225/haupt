import type { Metadata } from 'next';
import Link from 'next/link';
import { KontaktAdresse } from '@/components/KontaktAdresse';
import { BRAND } from '@/config/brand';
import { POST_WERKTAGE_TEXT } from '@/config/business';
import { bestellungAktiv, stripeClient } from '@/lib/zahlung';

export const metadata: Metadata = {
  title: 'Danke für Ihre Bestellung',
};

export const dynamic = 'force-dynamic';

interface Stand {
  bestellnummer: string;
  email: string;
  bezahlt: boolean;
  post: boolean;
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
      post: sitzung.metadata?.['post'] === '1',
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
          Danke. <span className="hervor">Ihr Erstkunden-Gutachten</span> ist unterwegs.
        </h1>
        <p className="untertitel">
          Kostenlos, wie versprochen. Vertragsbestätigung und Gutachten (PDF) kommen per E-Mail –
          bitte auch den Spam-Ordner prüfen.
        </p>
        <p>
          Unsere Bitte im Gegenzug: Antworten Sie kurz auf die E-Mail – war das Gutachten
          verständlich, hat es geholfen? Ein Zitat zeigen wir nur mit Ihrer dokumentierten
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
      <h1>Danke. Ihr Gutachten kommt.</h1>
      {stand !== undefined ? (
        <>
          <p className="untertitel">
            {stand.bezahlt
              ? 'Ihre Zahlung ist eingegangen.'
              : 'Ihre Zahlung wird noch bestätigt – bei Klarna, PayPal oder SEPA kann das dauern.'}{' '}
            Bestellnummer <strong className="tabellenziffern">{stand.bestellnummer}</strong>.
          </p>
          <p>
            Ihr Gutachten kommt innerhalb von 12 Stunden per E-Mail an <strong>{stand.email}</strong>;
            es wird vor dem Versand plausibilisiert.
            {stand.post ? ` Die gedruckte Fassung ist in ${POST_WERKTAGE_TEXT} bei Ihnen.` : ''} Die
            Rechnung kommt gesondert. Bitte auch den Spam-Ordner prüfen.
          </p>
        </>
      ) : (
        <p className="untertitel">
          Ihr Gutachten kommt innerhalb von 12 Stunden per E-Mail; es wird vor dem Versand
          plausibilisiert. Haben Sie den Postversand gewählt, ist die gedruckte Fassung in{' '}
          {POST_WERKTAGE_TEXT} bei Ihnen. Die Rechnung kommt gesondert.
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
