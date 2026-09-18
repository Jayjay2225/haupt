import type { Metadata } from 'next';
import { RechnerFunnel } from '@/components/funnel/RechnerFunnel';
import { alleVersichererNamen } from '@/lib/insurers-data';

export const metadata: Metadata = {
  title: 'Rechner – Ihre Police in sechs Schritten',
};

export default function RechnerSeite() {
  return (
    <div className="container schmal abschnitt">
      <h1>Ihre Police. Sechs kurze Schritte.</h1>
      <p>
        Nichts muss perfekt sein. Ungefähre Werte reichen für den Anfang – was fehlt, kennzeichnen
        wir im Ergebnis als Schätzung.
      </p>
      <RechnerFunnel versichererNamen={alleVersichererNamen()} />
    </div>
  );
}
