import type { Metadata } from 'next';
import { AnfrageFormular } from '@/components/AnfrageFormular';

export const metadata: Metadata = {
  title: 'Individuelle Prüfung',
};

/**
 * Anfrage-Formular für die individuelle Prüfung (Prompt 12, Abschnitt 0.3):
 * als Angebot für fondsgebundene Verträge, andere Jahrgänge und alle, die es
 * lieber persönlich mögen – nie erzwungen.
 */
export default function AnfrageSeite() {
  return (
    <div className="container schmal abschnitt">
      <h1>Lieber persönlich? Wir prüfen individuell.</h1>
      <p className="untertitel">
        Fondsgebundener Vertrag, anderer Jahrgang oder einfach Fragen? Schicken Sie uns die
        Eckdaten – wir sehen uns Ihren Vertrag an und melden uns per E-Mail.
      </p>
      <AnfrageFormular art="pruefung" />
    </div>
  );
}
