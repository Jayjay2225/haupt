import type { Metadata } from 'next';
import { EntwurfHinweis } from '@/components/EntwurfHinweis';

export const metadata: Metadata = {
  title: 'Widerrufsbelehrung',
};

export default function WiderrufsbelehrungSeite() {
  return (
    <div className="container schmal abschnitt">
      <h1>Widerrufsbelehrung</h1>
      <EntwurfHinweis />
      <p>
        Diese Belehrung betrifft den Widerruf eines kostenpflichtigen Auftrags an uns
        (Fernabsatz) – nicht den Widerspruch oder Widerruf Ihres Versicherungsvertrags, um
        den es in der Kurzprüfung geht.
      </p>
      <p>
        Der endgültige Text (Widerrufsrecht, Frist, Folgen, Muster-Widerrufsformular,
        Erlöschen bei vollständiger Leistung mit Zustimmung) wird zusammen mit den AGB
        anwaltlich erstellt, sobald das Geschäftsmodell entschieden ist. Solange kein
        kostenpflichtiges Angebot aktiv ist, kommt über diese Website kein
        widerrufsfähiger Vertrag zustande.
      </p>
    </div>
  );
}
