import type { Metadata } from 'next';
import { EntwurfHinweis } from '@/components/EntwurfHinweis';
import { KontaktAdresse } from '@/components/KontaktAdresse';
import { BRAND } from '@/config/brand';
import { FORTSETZEN_TAGE } from '@/config/business';
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
        Ihre Eingaben im Rechner bleiben in Ihrem Browser (localStorage), bis Sie sie löschen; sie verlassen den Browser
        nur, wenn Sie es auslösen – für die Ampel, für den „Später weitermachen“-Link (beides unten) oder für eine
        Bestellung (Abschnitt „Bestellung des Gutachtens“). Für die Ampel schickt Ihr Browser die Angaben zur Police
        einmalig an unseren Server; der rechnet und antwortet, ohne etwas zu speichern (Art. 6 Abs. 1 lit. b DSGVO,
        vorvertragliche Anfrage). Zum Schutz vor Missbrauch merkt sich der Server Ihre IP-Adresse für kurze Zeit im
        Arbeitsspeicher (Ratenbegrenzung, Art. 6 Abs. 1 lit. f DSGVO).
      </p>
      <h3>„Später weitermachen“-Link</h3>
      <p>
        Wählen Sie im Rechner „Später weitermachen – Link per E-Mail“, schickt Ihr Browser Ihren bisherigen Entwurf und
        die angegebene E-Mail-Adresse einmalig an unseren Server. Der Server verpackt den Entwurf komprimiert in einen
        Link ({FORTSETZEN_TAGE} Tage gültig) und schickt ihn Ihnen per E-Mail über [[E-Mail-Dienst, Sitz – festlegen]]
        als Auftragsverarbeiter (Art. 28 DSGVO); bei uns wird dabei nichts gespeichert (Art. 6 Abs. 1 lit. b DSGVO,
        vorvertragliche Anfrage). Wer den Link kennt, kann die Angaben laden – geben Sie ihn nicht weiter. Zum Schutz
        vor Missbrauch gilt dieselbe Ratenbegrenzung wie bei der Ampel.
      </p>
      {VARIANTE.berichtKostenpflichtig && (
        <>
          <h3>Bestellung des Gutachtens</h3>
          <p>
            Bei einer Bestellung erheben wir Anrede, Name, Geburtsdatum, Anschrift, E-Mail-Adresse und (freiwillig)
            Telefonnummer. Das Geburtsdatum dient allein der Berechnung des Risikoanteils in Ihrem Beitrag; die
            Anschrift der Rechnung und dem Postversand. Weil wir keine eigene Datenbank führen, übermitteln wir Ihre
            Angaben aus dem Rechner – die Angaben zur Police sowie Anrede, Name, Geburtsdatum, Anschrift, E-Mail-Adresse
            und, falls angegeben, Telefonnummer – komprimiert an unseren Zahlungsdienstleister Stripe (Stripe Payments
            Europe, Ltd., Dublin, Irland); Stripe hält sie in den Metadaten Ihrer Zahlung, und wir lesen sie nach
            Zahlungseingang für das Gutachten wieder aus. Stripe wickelt die Zahlung ab, erhebt dafür Ihre Rechnungsadresse und Zahlungsdaten und erstellt die Rechnung (Art. 6 Abs. 1
            lit. b DSGVO). Für die Zahlungsabwicklung ist Stripe eigener Verantwortlicher; Einzelheiten stehen in der
            Datenschutzerklärung von Stripe. Zahlen Sie über PayPal oder Klarna, gelten zusätzlich deren
            Datenschutzhinweise. Nach Zahlungseingang erstellen wir das Gutachten und bewahren es samt Bestellstatus
            [[Speicherdauer – festlegen]] auf, um es erneut zusenden zu können und gesetzliche Aufbewahrungspflichten
            zu erfüllen (Rechnungen: zehn Jahre, Art. 6 Abs. 1 lit. c DSGVO).
          </p>
          <h3>E-Mails</h3>
          <p>
            Vertragsbestätigung, Gutachten und Rechnung schicken wir per E-Mail über [[E-Mail-Dienst, Sitz – festlegen]]
            als Auftragsverarbeiter (Art. 28 DSGVO).
          </p>
          <h3>Postversand</h3>
          <p>
            Wählen Sie bei der Bestellung den kostenlosen Postversand, geben wir Ihren Namen, Ihre Anschrift und das
            Gutachten samt Beileger an unseren Druck- und Versanddienstleister [[DRUCKDIENST, Sitz – festlegen]] als
            Auftragsverarbeiter weiter (Art. 28 DSGVO, Art. 6 Abs. 1 lit. b DSGVO). Der Dienstleister druckt, kuvertiert
            und versendet; er verwendet die Daten für nichts anderes.
          </p>
        </>
      )}
      {VARIANTE.ankaufHinweis && (
        <>
          <h3>Kontakt zum Ankauf</h3>
          <p>
            Nur wenn Sie es auf der Startseite oder der Ankaufsseite ausdrücklich ankreuzen, geben wir Ihre Kontaktdaten und die Eckdaten
            Ihrer Police an unseren Organisationspartner für den Ankauf [[Partner, Sitz]] weiter (Art. 6 Abs. 1 lit. a
            DSGVO). Diese Einwilligung können Sie jederzeit mit Wirkung für die Zukunft widerrufen. Offenlegung: Wir
            erhalten vom Organisationspartner eine Vergütung, wenn ein Ankauf zustande kommt – nicht aus Ihrem Erlös.
          </p>
        </>
      )}
      <h3>Durchsetzung mit Partnerkanzlei</h3>
      <p>
        Beauftragen Sie über /durchsetzung die Durchsetzung, geben wir Ihre Angaben und hochgeladenen Unterlagen mit
        Ihrer ausdrücklichen Einwilligung an die Partnerkanzlei [[Kanzlei, Sitz]] weiter (Art. 6 Abs. 1 lit. a und b
        DSGVO). Die Unterlagen werden bei uns nicht gespeichert, sondern als E-Mail weitergereicht. Die wirtschaftliche
        Struktur der Zusammenarbeit ([[DURCHSETZUNGSSTRUKTUR]]) legen wir vor Beauftragung offen.
      </p>
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
        <li>Speicherdauer für Gutachten, Bestellstatus und Server-Protokolle; Löschkonzept</li>
        <li>Organisationspartner für den Ankauf (Name, Sitz, Vertrag)</li>
        <li>Druck- und Versanddienstleister für den Postversand (Name, Sitz, Auftragsverarbeitungsvertrag)</li>
      </ul>
    </div>
  );
}
