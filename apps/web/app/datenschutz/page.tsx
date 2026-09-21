import type { Metadata } from 'next';
import { EntwurfHinweis } from '@/components/EntwurfHinweis';
import { KontaktAdresse } from '@/components/KontaktAdresse';
import { BRAND } from '@/config/brand';
import { VARIANTE } from '@/config/variante';

export const metadata: Metadata = {
  title: 'Datenschutzerklärung',
};

/**
 * Entwurf: beschreibt die tatsächlichen Verarbeitungen der Website, damit die
 * anwaltlich abgenommene Fassung darauf aufsetzen kann. Offene Festlegungen
 * stehen als [[…]]-Platzhalter.
 */
export default function DatenschutzSeite() {
  const a = BRAND.anbieterAnschrift;
  return (
    <div className="container schmal abschnitt">
      <h1>Datenschutzerklärung</h1>
      <EntwurfHinweis />
      <h2>Verantwortlicher</h2>
      <p>
        {BRAND.anbieter}, {a.strasse}, {a.plz} {a.ort}
        <br />
        E-Mail: <KontaktAdresse adresse={BRAND.kontaktEmail} />
        {BRAND.anbieterTelefon !== '' ? ` · Telefon: ${BRAND.anbieterTelefon}` : ''}
      </p>

      <h2>Was wir verarbeiten – und wofür</h2>
      <h3>Aufruf der Website</h3>
      <p>
        Beim Aufruf verarbeitet unser Hosting-Anbieter [[Hosting-Anbieter, Sitz]] die technisch nötigen Daten
        (IP-Adresse, Zeitpunkt, aufgerufene Seite, Browser) in Server-Protokollen, um die Seite auszuliefern und
        abzusichern (Art. 6 Abs. 1 lit. f DSGVO). Wir setzen keine Tracking-Cookies und keine Analyse-Dienste ein;
        Schriften liefern wir von der eigenen Domain.
      </p>
      <h3>Rechner und kostenlose Ampel</h3>
      <p>
        Ihre Eingaben im Rechner bleiben in Ihrem Browser (localStorage), bis Sie sie löschen. Für die Ampel schickt Ihr
        Browser die Angaben zur Police einmalig an unseren Server; der rechnet und antwortet, ohne etwas zu speichern
        (Art. 6 Abs. 1 lit. b DSGVO, vorvertragliche Anfrage). Zum Schutz vor Missbrauch merkt sich der Server Ihre
        IP-Adresse für kurze Zeit im Arbeitsspeicher (Ratenbegrenzung, Art. 6 Abs. 1 lit. f DSGVO).
      </p>
      {VARIANTE.berichtKostenpflichtig && (
        <>
          <h3>Bestellung des Berichts</h3>
          <p>
            Bei einer Bestellung übermitteln wir Ihren Namen, Ihre E-Mail-Adresse und die Angaben zu Ihrer Police an
            unseren Zahlungsdienstleister Stripe (Stripe Payments Europe, Ltd., Dublin, Irland). Stripe wickelt die
            Zahlung ab, erhebt dafür Ihre Rechnungsadresse und Zahlungsdaten und erstellt die Rechnung (Art. 6 Abs. 1
            lit. b DSGVO). Für die Zahlungsabwicklung ist Stripe eigener Verantwortlicher; Einzelheiten stehen in der
            Datenschutzerklärung von Stripe. Zahlen Sie über PayPal oder Klarna, gelten zusätzlich deren
            Datenschutzhinweise. Nach Zahlungseingang erstellen wir den Bericht und bewahren ihn samt Bestellstatus
            [[Speicherdauer – festlegen]] auf, um ihn erneut zusenden zu können und gesetzliche Aufbewahrungspflichten
            zu erfüllen (Rechnungen: zehn Jahre, Art. 6 Abs. 1 lit. c DSGVO).
          </p>
          <h3>E-Mails</h3>
          <p>
            Vertragsbestätigung, Bericht und Rechnung schicken wir per E-Mail über [[E-Mail-Dienst, Sitz – festlegen]]
            als Auftragsverarbeiter (Art. 28 DSGVO).
          </p>
        </>
      )}
      {VARIANTE.ankaufHinweis && (
        <>
          <h3>Kontakt zum Ankauf</h3>
          <p>
            Nur wenn Sie es auf der Ergebnis-Seite ausdrücklich ankreuzen, geben wir Ihre Kontaktdaten und die Eckdaten
            Ihrer Police an unseren Organisationspartner für den Ankauf [[Partner, Sitz]] weiter (Art. 6 Abs. 1 lit. a
            DSGVO). Diese Einwilligung können Sie jederzeit mit Wirkung für die Zukunft widerrufen.
          </p>
        </>
      )}
      <h3>Kontakt per E-Mail</h3>
      <p>
        Schreiben Sie uns, verarbeiten wir Ihre Angaben, um Ihre Anfrage zu beantworten (Art. 6 Abs. 1 lit. b oder
        lit. f DSGVO).
      </p>

      <h2>Ihre Rechte</h2>
      <p>
        Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung,
        Datenübertragbarkeit und Widerspruch (Art. 15 bis 21 DSGVO) sowie auf Widerruf erteilter Einwilligungen.
        Beschwerden nimmt die Aufsichtsbehörde entgegen, für uns die Berliner Beauftragte für Datenschutz und
        Informationsfreiheit.
      </p>

      <h2>Noch festzulegen</h2>
      <ul className="punkteliste">
        <li>Hosting-Anbieter und E-Mail-Dienst mit Sitz (Auftragsverarbeiter-Verträge)</li>
        <li>Speicherdauer für Berichte, Bestellstatus und Server-Protokolle; Löschkonzept</li>
        <li>Organisationspartner für den Ankauf (Name, Sitz, Vertrag)</li>
      </ul>
    </div>
  );
}
