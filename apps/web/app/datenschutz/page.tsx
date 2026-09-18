import type { Metadata } from 'next';
import { EntwurfHinweis } from '@/components/EntwurfHinweis';

export const metadata: Metadata = {
  title: 'Datenschutzerklärung',
};

export default function DatenschutzSeite() {
  return (
    <div className="container schmal abschnitt">
      <h1>Datenschutzerklärung</h1>
      <EntwurfHinweis />
      <h2>Verantwortlicher</h2>
      <p>[FIRMA UND ANSCHRIFT – folgt nach der Gesellschaftsentscheidung]</p>
      <h2>Grundsätze</h2>
      <ul className="punkteliste">
        <li>
          Datenminimierung: Es werden nur die Angaben erhoben, die für die Kurzprüfung
          erforderlich sind. Bankdaten und Rechtsschutzdaten werden nicht im Rechner
          abgefragt.
        </li>
        <li>Hosting in der EU; keine Tracking-Cookies ohne Einwilligung.</li>
        <li>
          Weitergabe an Dritte (z.&nbsp;B. eine Partnerkanzlei) nur mit ausdrücklicher,
          gesonderter Einwilligung.
        </li>
      </ul>
      <h2>Verarbeitung in der aktuellen Vorabversion</h2>
      <p>
        Die Eingaben im Rechner werden derzeit ausschließlich lokal in Ihrem Browser
        gespeichert (localStorage) und nicht an einen Server übertragen. Sie können diese
        Daten jederzeit auf der Ergebnis-Seite oder über die Browsereinstellungen löschen.
      </p>
      <h2>Noch zu ergänzen (vor Go-live)</h2>
      <ul className="punkteliste">
        <li>Zwecke und Rechtsgrundlagen je Verarbeitung (Art. 6 DSGVO)</li>
        <li>Speicherdauern und Löschkonzept</li>
        <li>Liste der Auftragsverarbeiter</li>
        <li>Umgang mit Dokumenten-Uploads und automatischer Texterkennung (OCR)</li>
        <li>Betroffenenrechte und Beschwerderecht bei der Aufsichtsbehörde</li>
      </ul>
    </div>
  );
}
