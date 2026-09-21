import type { Metadata } from 'next';
import { EntwurfHinweis } from '@/components/EntwurfHinweis';
import { KontaktAdresse } from '@/components/KontaktAdresse';
import { BRAND } from '@/config/brand';

export const metadata: Metadata = {
  title: 'Impressum',
};

/** Telefonnummer als tel:-Link (0… → +49…). */
function telefonLink(nummer: string): string {
  const ziffern = nummer.replace(/[^\d+]/g, '');
  return `tel:${ziffern.startsWith('0') ? `+49${ziffern.slice(1)}` : ziffern}`;
}

/** Leere Pflichtangabe → sichtbarer Platzhalter statt stiller Lücke. */
function oderPlatzhalter(wert: string, name: string): string {
  return wert.trim() === '' ? `[[${name} – wird nachgetragen]]` : wert;
}

export default function ImpressumSeite() {
  const a = BRAND.anbieterAnschrift;
  return (
    <div className="container schmal abschnitt">
      <h1>Impressum</h1>
      <EntwurfHinweis />
      <h2>Anbieterkennzeichnung</h2>
      <p>
        {oderPlatzhalter(BRAND.anbieter, 'Firma')}
        <br />
        {oderPlatzhalter(a.strasse, 'Straße und Hausnummer')}
        <br />
        {oderPlatzhalter(`${a.plz} ${a.ort}`.trim(), 'PLZ und Ort')}
      </p>
      <p>
        Vertreten durch: {oderPlatzhalter(BRAND.anbieterVertretung, 'Vertretungsberechtigte')}
        <br />
        E-Mail: <KontaktAdresse adresse={BRAND.kontaktEmail} />
        <br />
        Telefon:{' '}
        {BRAND.anbieterTelefon.trim() === '' ? (
          oderPlatzhalter('', 'Telefon')
        ) : (
          <a href={telefonLink(BRAND.anbieterTelefon)}>{BRAND.anbieterTelefon}</a>
        )}
        <br />
        Registereintrag: {oderPlatzhalter(BRAND.anbieterRegister, 'Registergericht und Registernummer')}
        <br />
        Umsatzsteuer-Identifikationsnummer: {oderPlatzhalter(BRAND.anbieterUstId, 'USt-IdNr.')}
      </p>
      <h2>Inhaltlich verantwortlich</h2>
      <p>
        {oderPlatzhalter(BRAND.anbieterVertretung.replace(/^Geschäftsführer(in)?\s+/, ''), 'Verantwortliche Person')},
        Anschrift wie oben.
      </p>
      <h2>Verbraucherstreitbeilegung</h2>
      <p>
        Zur Teilnahme an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle sind wir
        nicht verpflichtet und nicht bereit. Bei Fragen zu einer Bestellung schreiben Sie uns an{' '}
        <KontaktAdresse adresse={BRAND.kontaktEmail} />.
      </p>
      <h2>Hinweis</h2>
      <p>
        Dieses Angebot erstellt strukturierte Berechnungen und Hinweise zur Vorbereitung einer
        anwaltlichen Prüfung. Es erbringt keine Rechtsdienstleistungen im Sinne des
        Rechtsdienstleistungsgesetzes (RDG) und keine Versicherungsberatung.
      </p>
    </div>
  );
}
