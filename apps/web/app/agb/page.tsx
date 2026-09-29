import type { Metadata } from 'next';
import { EntwurfHinweis } from '@/components/EntwurfHinweis';
import { BERICHT_PREIS_BRUTTO_EUR, BERICHT_PREIS_HINWEIS } from '@/config/business';

export const metadata: Metadata = {
  title: 'Allgemeine Geschäftsbedingungen',
};

export default function AgbSeite() {
  return (
    <div className="container schmal abschnitt">
      <h1>Allgemeine Geschäftsbedingungen</h1>
      <EntwurfHinweis />
      <p>
        Die Allgemeinen Geschäftsbedingungen für das Gutachten zum Festpreis von {BERICHT_PREIS_BRUTTO_EUR} €
        ({BERICHT_PREIS_HINWEIS}) werden anwaltlich erstellt und hier eingesetzt. Sie regeln insbesondere:
      </p>
      <ul className="punkteliste">
        <li>Leistungsbeschreibung: automatisierte versicherungsmathematische Auswertung („Gutachten“) und strukturierte Hinweise, keine Rechtsberatung im Einzelfall, kein Sachverständigengutachten</li>
        <li>Zustandekommen des Vertrags, Preis und Zahlungsweise (Zahlung vorab; mit gültigem Freischaltcode des Erstkunden-Programms entfällt der Preis); Lieferung per E-Mail, auf Wunsch zusätzlich kostenlos per Post</li>
        <li>Mitwirkungspflichten: Richtigkeit der Angaben, Charakter der Ergebnisse als Schätzung</li>
        <li>Haftung, Verfügbarkeit, Vertragslaufzeit und Kündigung</li>
      </ul>

      <h2 id="rechenweg">So rechnen wir – Annahmen und Datenherkunft</h2>
      <p>
        Diese Grundsätze gelten für Ampel und Gutachten; die Bestellseite verweist hierauf. Sie werden
        Bestandteil der endgültigen AGB.
      </p>
      <ul className="punkteliste">
        <li>
          Alle Ergebnisse sind <strong>Schätzungen mit Bandbreite</strong> (drei Szenarien:
          konservativ, Basis, maximal), keine Zusage eines Betrags und keine Rechtsberatung.
        </li>
        <li>
          Die Rückabwicklungsformel (Beiträge abzüglich Risikoanteil, zuzüglich gezogener Nutzungen)
          wird für alle Vertragsjahrgänge gleich angewendet. Welche rechtliche Grundlage im
          Einzelfall trägt, prüft der Rechtsanwalt anhand der Vertragsunterlagen; die meisten
          Verfahren enden durch Vergleich – das Ergebnis ist eine Verhandlungsbasis.
        </li>
        <li>
          Gerechnet wird nach der Methodik der BGH-Rechtsprechung: Zinsen („Nutzungen“) nur auf den
          Sparanteil der Beiträge – nach Abzug von Risiko-, Abschluss- und Verwaltungskostenanteilen –
          mit der Nettoverzinsung der Kapitalanlagen des jeweiligen Versicherers.
        </li>
        <li>
          Jede Kennzahl stammt aus Geschäftsberichten der Versicherer oder den Statistiken von Aufsicht
          und Verband und trägt im Gutachten Quelle und Abrufdatum. Fehlt ein Unternehmenswert, rechnen
          wir mit dem Branchendurchschnitt und kennzeichnen das als Schätzung.
        </li>
        <li>
          Der Versicherer wird der Rechnung entgegenhalten: eigene Zahlen statt Branchenschnitt,
          Einmaleffekte in der Nettoverzinsung, höhere Schutz- und Kostenanteile. Diese Gegenposition
          steht ausführlich im Gutachten – und ist der Grund für die Bandbreite.
        </li>
        <li>
          Rechenkern und Datenbank sind versioniert; die im Ergebnis genannten Versionsstände gehören
          zu jeder Berechnung.
        </li>
      </ul>
    </div>
  );
}
