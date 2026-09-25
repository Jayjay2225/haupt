import type { Metadata } from 'next';
import Link from 'next/link';
import { BERICHT_PREIS_BRUTTO_EUR, BERICHT_PREIS_HINWEIS, ZAHLUNG } from '@/config/business';
import { VARIANTE } from '@/config/variante';
import { bestellungAktiv } from '@/lib/zahlung';

export const metadata: Metadata = {
  title: 'Der Prüfbericht',
};

// Der Bestellknopf hängt von der Laufzeitumgebung ab (Stripe-Schlüssel).
export const dynamic = 'force-dynamic';

export default function BerichtSeite() {
  const aktiv = bestellungAktiv();
  return (
    <div className="container schmal abschnitt">
      <h1>Das steht im Bericht.</h1>
      <p className="untertitel">
        Die Ampel sagt, ob sich Rechnen lohnt. Der Prüfbericht sagt, wie viel – zum Mitnehmen zum
        Anwalt.
      </p>

      <h2>Was drinsteht</h2>
      <ul className="punkteliste">
        <li>Ihre Zahl, Jahr für Jahr aufgeschlüsselt – Basis-Szenario und die Spanne von konservativ bis maximal.</li>
        <li>Der Vergleich mit Ihrem Rückkaufswert, auch wenn er schlecht ausfällt.</li>
        <li>Die Rechnung Jahr für Jahr: Beiträge, Schutzanteil, Kosten, Sparanteil, Zinsen.</li>
        <li>Jede Rendite mit Quelle und Datum; Branchenwerte sind als Schätzung gekennzeichnet.</li>
        <li>Die Gegenposition des Versicherers – die Einwände, die Sie kennen sollten.</li>
        <li>Fertig für Anwalt und Rechtsschutzversicherung: Unterlagenliste und nächste Schritte.</li>
      </ul>

      <h2>Was nicht drinsteht</h2>
      <ul className="punkteliste">
        <li>Keine Rechtsberatung und keine Aussage, auf welchem Weg sich der Wert durchsetzen lässt – das prüft Ihr Anwalt.</li>
        <li>Keine Zusage eines Betrags. Alles ist Schätzung mit Bandbreite.</li>
        <li>Keine Empfehlung, zu kündigen, zu behalten oder zu verkaufen.</li>
      </ul>

      {VARIANTE.berichtKostenpflichtig && (
        <>
          <h2>Preis und Zahlung</h2>
          <p>
            <strong className="betrag">{BERICHT_PREIS_BRUTTO_EUR} € einmalig</strong>{' '}
            {BERICHT_PREIS_HINWEIS}. Kein Abo, keine Folgekosten. Oft weniger als ein Monatsbeitrag –
            und der Preis ist derselbe, egal was die Ampel zeigt.
          </p>
          <ol className="punkteliste">
            <li>Sie bestellen den Prüfbericht und zahlen vorab – {ZAHLUNG.wege.join(', ')} – abgewickelt über {ZAHLUNG.abwicklung}.</li>
            <li>Nach Zahlungseingang rechnen wir den Prüfbericht aus Ihren Angaben im Rechner.</li>
            <li>{ZAHLUNG.lieferung}</li>
          </ol>
          {aktiv ? (
            <p>
              <Link href="/bestellen" className="knopf haupt">
                Prüfbericht bestellen
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
