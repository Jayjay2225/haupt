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
        den es im Gutachten geht.
      </p>
      <p>
        Mit der kostenpflichtigen Bestellung des Gutachtens kommt ein Fernabsatzvertrag
        zustande; Verbraucherinnen und Verbrauchern steht dabei das gesetzliche
        Widerrufsrecht zu. Der vollständige Belehrungstext (Widerrufsrecht, Frist, Folgen,
        Muster-Widerrufsformular) wird anwaltlich erstellt und hier eingesetzt. Wie in der
        Bestellung erklärt, erlischt das Widerrufsrecht mit Beginn der Erstellung des
        Gutachtens (digitaler Inhalt), nachdem Sie ausdrücklich zugestimmt haben, dass wir
        vor Ablauf der Widerrufsfrist beginnen, Ihre Kenntnis vom Erlöschen bestätigt und
        die Vertragsbestätigung erhalten haben.
      </p>
    </div>
  );
}
