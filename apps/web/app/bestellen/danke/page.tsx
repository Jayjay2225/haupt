import type { Metadata } from 'next';
import Link from 'next/link';
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

export default async function DankeSeite({ searchParams }: { searchParams: Promise<{ sitzung?: string }> }) {
  const { sitzung } = await searchParams;
  const stand = await ladeStand(sitzung);
  return (
    <div className="container schmal abschnitt">
      <h1>
        Danke. <span className="hervor">Ihr Bericht</span> wird erstellt.
      </h1>
      {stand !== undefined ? (
        <>
          <p className="untertitel">
            {stand.bezahlt
              ? 'Ihre Zahlung ist eingegangen.'
              : 'Ihre Zahlung wird noch bestätigt – bei Klarna oder PayPal kann das ein paar Minuten dauern.'}{' '}
            Bestellnummer <strong className="tabellenziffern">{stand.bestellnummer}</strong>.
          </p>
          <p>
            Rechnung und Bericht (PDF) schicken wir an <strong>{stand.email}</strong> – in der Regel innerhalb weniger
            Minuten. Bitte auch den Spam-Ordner prüfen.
          </p>
        </>
      ) : (
        <p className="untertitel">Rechnung und Bericht (PDF) kommen per E-Mail – in der Regel innerhalb weniger Minuten.</p>
      )}
      <p>
        Nichts angekommen? Schreiben Sie an <a href={`mailto:${BRAND.kontaktEmail}`}>{BRAND.kontaktEmail}</a>
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
