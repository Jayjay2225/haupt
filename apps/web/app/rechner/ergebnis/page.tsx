import type { Metadata } from 'next';
import { ErgebnisAnsicht } from '@/components/funnel/ErgebnisAnsicht';

export const metadata: Metadata = {
  title: 'Ergebnis',
};

export default function ErgebnisSeite() {
  return (
    <div className="container schmal abschnitt">
      <ErgebnisAnsicht />
    </div>
  );
}
