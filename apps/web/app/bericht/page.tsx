import type { Metadata } from 'next';
import Link from 'next/link';
import { BERICHT_PREIS_BRUTTO_EUR, BERICHT_PREIS_HINWEIS, ZAHLUNG } from '@/config/business';
import { VARIANTE } from '@/config/variante';
import { bestellungAktiv } from '@/lib/zahlung';

export const metadata: Metadata = {
  title: 'Der Bericht',
};

// Der Bestellknopf hängt von der Laufzeitumgebung ab (Stripe-Schlüssel).
export const dynamic = 'force-dynamic';

export default function BerichtSeite() {
  const aktiv = bestellungAktiv();
  return (
    <div className="container schmal abschnitt">
      <h1>
        Der Bericht: <span className="hervor">alle Zahlen</span>, jede mit Quelle.
      </h1>
      <p className="untertitel">
        Die Ampel sagt, ob sich Rechnen lohnt. Der Bericht sagt, wie viel – und dann: der Weg über
        uns zu Ihrem Geld.
      </p>

      <h2>Was drinsteht</h2>
      <ul className="punkteliste">
        <li>Der geschätzte Rückabwicklungswert im mittleren Szenario – und die Spanne von vorsichtig bis oben.</li>
        <li>Der Vergleich mit Ihrem Rückkaufswert, auch wenn er schlecht ausfällt.</li>
        <li>Die Rechnung Jahr für Jahr: Beiträge, Schutzanteil, Kosten, Sparanteil, Zinsen.</li>
        <li>Jede Kennzahl mit Quelle und Datum; Branchenwerte sind als Schätzung gekennzeichnet.</li>
        <li>Die Gegenposition des Versicherers – die Einwände, die Sie kennen sollten.</li>
        <li>Eine Checkliste der Unterlagen und die nächsten Schritte.</li>
      </ul>

      <h2>Was nicht drinsteht</h2>
      <ul className="punkteliste">
        <li>Keine Rechtsberatung und keine Aussage, ob Ihr Widerspruch wirksam ist.</li>
        <li>Keine Zusage eines Betrags. Alles ist Schätzung mit Bandbreite.</li>
        <li>Keine Empfehlung, zu kündigen, zu behalten oder zu verkaufen.</li>
      </ul>

      {VARIANTE.berichtKostenpflichtig && (
        <>
          <h2>Preis und Zahlung</h2>
          <p>
            <strong className="betrag">
              {BERICHT_PREIS_BRUTTO_EUR} € {BERICHT_PREIS_HINWEIS}
            </strong>
            , einmalig. Kein Abo, keine Folgekosten. Der Preis ist derselbe, egal was die Ampel zeigt.
          </p>
          <ol className="punkteliste">
            <li>Sie bestellen und zahlen vorab – {ZAHLUNG.wege.join(', ')} – abgewickelt über {ZAHLUNG.abwicklung}.</li>
            <li>Nach Zahlungseingang rechnen wir den Bericht aus Ihren Angaben im Rechner.</li>
            <li>{ZAHLUNG.lieferung}</li>
          </ol>
          {aktiv ? (
            <p>
              <Link href="/bestellen" className="knopf haupt">
                Bericht bestellen
              </Link>
            </p>
          ) : (
            <div className="hinweis">
              <p>
                Die Bestellung schalten wir frei, sobald die Bezahlung eingerichtet ist. Ihre Ampel
                bleibt kostenlos – <Link href="/rechner">jetzt rechnen</Link>.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
