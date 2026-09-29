import type { Metadata } from 'next';
import Link from 'next/link';
import { POST_WERKTAGE_TEXT, ZAHLUNG } from '@/config/business';
import { VARIANTE } from '@/config/variante';
import { Preisblock } from '@/components/Preisblock';

export const metadata: Metadata = {
  title: 'Das Gutachten',
};

/** Informationsseite zum Gutachten (Prompt 14, 0.6): Produktname „Gutachten“. */
export default function GutachtenSeite() {
  return (
    <div className="container schmal abschnitt">
      <h1>Das steckt in Ihrem Gutachten.</h1>
      <p className="untertitel">
        Die Ampel sagt, ob Ihr Vertrag für unser Verfahren in Frage kommt. Das Gutachten nennt
        Ihre Zahl – die Grundlage für unser Verfahren.
      </p>
      <p className="erklaerung">
        Das Gutachten ist eine automatisierte versicherungsmathematische Auswertung auf Basis Ihrer
        Angaben und veröffentlichter Versichererkennzahlen – kein Sachverständigengutachten.
      </p>

      <h2>Was drinsteht</h2>
      <ul className="punkteliste">
        <li>Ihre Zahl, Jahr für Jahr aufgeschlüsselt – Basis-Szenario und die Spanne von konservativ bis maximal.</li>
        <li>Der Vergleich mit Ihrem Rückkaufswert, auch wenn er schlecht ausfällt.</li>
        <li>Die Rechnung Jahr für Jahr: Beiträge, Schutzanteil, Kosten, Sparanteil, Zinsen.</li>
        <li>Jede Rendite mit Quelle und Datum; Branchenwerte sind als Schätzung gekennzeichnet.</li>
        <li>Ihre Angaben und unsere Annahmen – jedes „Weiß ich nicht“ steht dort ausgewiesen.</li>
        <li>Die Gegenposition des Versicherers – die Einwände, die Sie kennen sollten.</li>
        <li>Der nächste Schritt: Wir übernehmen – mit den Konditionen der Durchsetzung.</li>
      </ul>

      <h2>Was nicht drinsteht</h2>
      <ul className="punkteliste">
        <li>Keine Rechtsberatung und keine Aussage, auf welchem Weg sich der Wert durchsetzen lässt – das prüfen die Anwälte, mit denen wir arbeiten.</li>
        <li>Keine Zusage eines Betrags. Alles ist Schätzung mit Bandbreite.</li>
        <li>Keine Empfehlung, zu kündigen, zu behalten oder zu verkaufen.</li>
      </ul>

      {VARIANTE.berichtKostenpflichtig && (
        <>
          <h2>Preis und Zahlung</h2>
          <Preisblock />
          <ol className="punkteliste" style={{ marginTop: '1rem' }}>
            <li>Vier Angaben auf der Startseite – die Ampel zeigt, ob Ihr Vertrag in Frage kommt.</li>
            <li>Sie bestellen das Gutachten und zahlen vorab – {ZAHLUNG.wege.join(', ')} – abgewickelt über {ZAHLUNG.abwicklung}.</li>
            <li>Nach Zahlungseingang rechnen wir das Gutachten aus Ihren Angaben; vor dem Versand wird es plausibilisiert.</li>
            <li>Innerhalb von 12 Stunden per E-Mail – auf Wunsch zusätzlich gedruckt per Post, kostenlos ({POST_WERKTAGE_TEXT}).</li>
          </ol>
          <p>
            <Link href="/#ampel" className="knopf haupt">
              Jetzt prüfen
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
