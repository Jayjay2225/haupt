import type { Metadata } from 'next';
import { RechnerFunnel } from '@/components/funnel/RechnerFunnel';
import { alleVersichererNamen } from '@/lib/insurers-data';

export const metadata: Metadata = {
  title: 'Rechner – eine Frage nach der anderen',
};

/** Assistent (Prompt 12, 3.2): eine Frage je Bildschirm; die Frage ist die Überschrift. */
export default function RechnerSeite() {
  return (
    <div className="container schmal abschnitt">
      <RechnerFunnel versichererNamen={alleVersichererNamen()} />
    </div>
  );
}
