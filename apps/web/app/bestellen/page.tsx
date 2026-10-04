import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { RechnerFunnel } from '@/components/funnel/RechnerFunnel';
import { FONDS_MODE } from '@/config/ampel';
import { VARIANTE } from '@/config/variante';
import { erstkundenCodes } from '@/lib/erstkunden';
import { alleVersichererNamen } from '@/lib/insurers-data';
import { bestellungAktiv } from '@/lib/zahlung';

export const metadata: Metadata = {
  title: 'Gutachten bestellen',
};

// Ob bestellt werden kann, hängt von der Laufzeitumgebung ab (Stripe-Schlüssel).
export const dynamic = 'force-dynamic';

/**
 * /bestellen = Schritt 11 des Assistenten (Prompt 14, 2). Rückkehr von der
 * Zahlungsseite ohne Zahlung landet hier (?abgebrochen=1); fehlen frühere
 * Angaben, springt der Assistent zum ersten unvollständigen Schritt (bei
 * beendetem Vertrag zum Rot-Ende in Schritt 2).
 */
export default async function BestellenSeite({ searchParams }: { searchParams: Promise<{ abgebrochen?: string }> }) {
  if (!VARIANTE.berichtKostenpflichtig) {
    notFound();
  }
  const { abgebrochen } = await searchParams;
  const aktiv = bestellungAktiv();
  const erstkundenOffen = erstkundenCodes().size > 0;
  return (
    <div className="container schmal abschnitt">
      {aktiv || erstkundenOffen ? (
        <RechnerFunnel
          versichererNamen={alleVersichererNamen()}
          startSchritt="bestellung"
          abgebrochen={abgebrochen !== undefined}
          fondsAnfrage={FONDS_MODE === 'anfrage'}
        />
      ) : (
        <>
          <h1>Die Bestellung ist noch nicht freigeschaltet.</h1>
          <div className="hinweis">
            <p>
              Die Bezahlung wird gerade eingerichtet. Ihre Ampel bleibt kostenlos –{' '}
              <Link href="/#ampel">zur Ampel</Link>.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
