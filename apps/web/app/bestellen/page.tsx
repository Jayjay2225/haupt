import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BestellFormular } from '@/components/BestellFormular';
import { BERICHT_PREIS_BRUTTO_EUR, ZAHLUNG } from '@/config/business';
import { VARIANTE } from '@/config/variante';
import { erstkundenCodes } from '@/lib/erstkunden';
import { bestellungAktiv } from '@/lib/zahlung';

export const metadata: Metadata = {
  title: 'Prüfbericht bestellen',
};

// Ob bestellt werden kann, hängt von der Laufzeitumgebung ab (Stripe-Schlüssel).
export const dynamic = 'force-dynamic';

export default async function BestellenSeite({ searchParams }: { searchParams: Promise<{ abgebrochen?: string }> }) {
  if (!VARIANTE.berichtKostenpflichtig) {
    notFound();
  }
  const { abgebrochen } = await searchParams;
  const aktiv = bestellungAktiv();
  const erstkundenOffen = erstkundenCodes().size > 0;
  return (
    <div className="container schmal abschnitt">
      <h1>
        Der Prüfbericht: <span className="hervor">{BERICHT_PREIS_BRUTTO_EUR} €</span>, einmal bezahlt.
      </h1>
      <p className="untertitel">Zahlung vorab. Danach kommen Rechnung und Prüfbericht als PDF per E-Mail.</p>
      {abgebrochen !== undefined && (
        <div className="hinweis" role="status">
          <p>Die Zahlung wurde abgebrochen. Es wurde nichts berechnet. Sie können es hier noch einmal versuchen.</p>
        </div>
      )}
      <section aria-labelledby="ablauf-titel">
        <h2 id="ablauf-titel">So läuft es</h2>
        <ol className="punkteliste">
          <li>Sie prüfen Ihre Angaben und bestellen zahlungspflichtig.</li>
          <li>
            Sie zahlen über {ZAHLUNG.abwicklung}: {ZAHLUNG.wege.join(', ')}.
          </li>
          <li>{ZAHLUNG.lieferung}</li>
        </ol>
      </section>
      {!aktiv && erstkundenOffen && (
        <div className="hinweis neutral">
          <p>
            Die Bezahlung ist noch nicht freigeschaltet – mit einem Freischaltcode aus dem
            Erstkunden-Programm können Sie den Prüfbericht trotzdem kostenlos anfordern.
          </p>
        </div>
      )}
      {aktiv || erstkundenOffen ? (
        <BestellFormular />
      ) : (
        <div className="hinweis">
          <p>
            Die Bestellung schalten wir frei, sobald die Bezahlung eingerichtet ist. Ihre Ampel bleibt kostenlos –{' '}
            <Link href="/rechner">zum Rechner</Link>.
          </p>
        </div>
      )}
    </div>
  );
}
