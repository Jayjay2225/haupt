import type { Metadata } from 'next';
import { EntwurfHinweis } from '@/components/EntwurfHinweis';

export const metadata: Metadata = {
  title: 'Allgemeine Geschäftsbedingungen',
};

export default function AgbSeite() {
  return (
    <div className="container schmal abschnitt">
      <h1>Allgemeine Geschäftsbedingungen</h1>
      <EntwurfHinweis />
      <p>
        Die AGB werden mit der Entscheidung über das Geschäftsmodell (Festpreis-Kurzprüfung,
        kostenlose Vorschau mit optionaler Weitergabe an eine Partnerkanzlei oder
        B2B-Zugang) anwaltlich erstellt. Feststehen wird insbesondere:
      </p>
      <ul className="punkteliste">
        <li>Leistungsbeschreibung: Berechnung und strukturierte Hinweise, keine Rechtsberatung im Einzelfall</li>
        <li>Zustandekommen des Vertrags, Preise und Zahlungsweise (sofern kostenpflichtig)</li>
        <li>Mitwirkungspflichten: Richtigkeit der Angaben, Charakter der Ergebnisse als Schätzung</li>
        <li>Haftung, Verfügbarkeit, Vertragslaufzeit und Kündigung</li>
      </ul>
    </div>
  );
}
