import type { Metadata } from 'next';
import { KONDITIONEN_PLATZHALTER } from '@/config/durchsetzung';
import { DurchsetzungFormular } from '@/components/DurchsetzungFormular';

export const metadata: Metadata = {
  title: 'Wir übernehmen',
};

/**
 * Durchsetzung beauftragen (Prompt 13, Abschnitt 2.3): drei Schritte,
 * Rechtsschutz-Frage, Konditionen, Formular mit Unterlagen-Upload und
 * eigenen Einwilligungen. Formulierung „Wir organisieren die Durchsetzung
 * mit spezialisierten Anwälten“ gilt in beiden Rechtsstrukturen
 * (config/durchsetzung.ts, [[DURCHSETZUNGSSTRUKTUR]]).
 */
export default function DurchsetzungSeite() {
  return (
    <div className="container schmal abschnitt">
      <h1>Wir übernehmen.</h1>
      <p className="untertitel">
        Wir organisieren die Durchsetzung mit spezialisierten Anwälten für Versicherungsrecht. Sie
        müssen nichts selbst verhandeln.
      </p>

      <ol className="schrittliste">
        <li>
          <h3>Unterlagen hochladen</h3>
          <p>Police, letzte Standmitteilung – unten im Formular. Fehlendes reichen Sie nach.</p>
        </li>
        <li>
          <h3>Anwälte prüfen und melden sich</h3>
          <p>Die Kanzlei sichtet Ihren Fall und meldet sich mit dem konkreten Vorgehen.</p>
        </li>
        <li>
          <h3>Verhandlung oder Verfahren</h3>
          <p>Sie bleiben informiert – mit einem Ansprechpartner.</p>
        </li>
      </ol>

      <div className="hinweis">
        <p style={{ margin: 0 }}>
          <strong>Konditionen:</strong> {KONDITIONEN_PLATZHALTER}
          <br />
          Die Konditionen stehen hier, in der E-Mail nach dem Bericht und im Auftragsformular,
          bevor Sie beauftragen.
        </p>
      </div>

      <h2>Durchsetzung beauftragen</h2>
      <DurchsetzungFormular />
    </div>
  );
}
