import type { Metadata } from 'next';
import { EntwurfHinweis } from '@/components/EntwurfHinweis';

export const metadata: Metadata = {
  title: 'Impressum',
};

export default function ImpressumSeite() {
  return (
    <div className="container schmal abschnitt">
      <h1>Impressum</h1>
      <EntwurfHinweis />
      <h2>Anbieterkennzeichnung</h2>
      <p>
        [FIRMA / GESELLSCHAFT – folgt]
        <br />
        [STRASSE UND HAUSNUMMER – folgt]
        <br />
        [PLZ UND ORT – folgt]
      </p>
      <p>
        Vertreten durch: [VERTRETUNGSBERECHTIGTE – folgt]
        <br />
        Kontakt: [E-MAIL – folgt] · [TELEFON – folgt]
        <br />
        Registereintrag: [REGISTERGERICHT UND NUMMER – folgt]
        <br />
        Umsatzsteuer-ID: [USt-IdNr. – folgt]
      </p>
      <h2>Inhaltlich verantwortlich</h2>
      <p>[VERANTWORTLICHE PERSON – folgt]</p>
      <h2>Hinweis</h2>
      <p>
        Dieses Angebot erstellt strukturierte Berechnungen und Hinweise zur Vorbereitung
        einer anwaltlichen Prüfung. Es erbringt keine Rechtsdienstleistungen im Sinne des
        Rechtsdienstleistungsgesetzes (RDG) und keine Versicherungsberatung.
      </p>
    </div>
  );
}
