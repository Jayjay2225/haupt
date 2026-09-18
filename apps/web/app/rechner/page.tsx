import type { Metadata } from 'next';
import { RechnerFunnel } from '@/components/funnel/RechnerFunnel';

export const metadata: Metadata = {
  title: 'Rechner – Angaben erfassen',
};

export default function RechnerSeite() {
  return (
    <div className="container schmal abschnitt">
      <h1>Angaben zu Ihrem Vertrag</h1>
      <p>
        Sechs kurze Schritte. Sie brauchen nichts Perfektes – Näherungswerte genügen für den
        Anfang, fehlende Angaben werden im Ergebnis als Schätzung gekennzeichnet.
      </p>
      <RechnerFunnel />
    </div>
  );
}
