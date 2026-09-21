import Link from 'next/link';
import { BRAND } from '@/config/brand';
import { BERICHT_PREIS_BRUTTO_EUR, BERICHT_PREIS_HINWEIS } from '@/config/business';
import { VARIANTE } from '@/config/variante';
import { Ampel } from '@/components/Ampel';
import { Schnellcheck } from '@/components/Schnellcheck';
import { TransparenzKasten } from '@/components/TransparenzKasten';
import { alleVersichererNamen } from '@/lib/insurers-data';
import { musterfaelle } from '@/lib/musterfall';

const euroGerundet = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

export default function Startseite() {
  const namen = alleVersichererNamen();
  const faelle = musterfaelle();

  return (
    <>
      <section className="hero">
        <div className="container hero-raster">
          <div>
            <h1>
              Alte Lebensversicherung? <span className="hervor">Erst rechnen.</span> Dann kündigen.
            </h1>
            <p className="untertitel">
              Kündigen bringt den Rückkaufswert. Ein Widerspruch kann mehr bringen. Wir rechnen es
              aus – kostenlos, mit klarer Ampel.
            </p>
            <p>
              <strong>Vertrag zwischen 1994 und 2007?</strong> Dann lohnt der Blick. Rot heißt: Finger
              weg. Das sagen wir Ihnen auch.
            </p>
          </div>
          <Schnellcheck versichererNamen={namen} />
        </div>
      </section>

      <section className="abschnitt getoent" aria-labelledby="ablauf-titel">
        <div className="container">
          <h2 id="ablauf-titel">So läuft es</h2>
          <ol className="schrittliste">
            <li>
              <h3>Police eingeben</h3>
              <p>Versicherer, Beginn, Beitrag, Rückkaufswert. Die Standmitteilung hilft. Fünf Minuten.</p>
            </li>
            <li>
              <h3>Ampel lesen</h3>
              <p>
                Grün, Gelb oder Rot – mit Erklärung in Worten. Der Rückkaufswert ist immer der
                Vergleich. Kostenlos.
              </p>
            </li>
            <li>
              <h3>Bericht holen. Oder lassen.</h3>
              <p>
                Wer die Zahlen will, bestellt den Bericht: Spanne, Jahrestabelle, Quellen. Schwarz
                auf weiß – und wenn es sich lohnt, übernehmen unsere Partner den Rest.
              </p>
            </li>
          </ol>
        </div>
      </section>

      <section className="abschnitt" aria-labelledby="musterfall-titel">
        <div className="container">
          <h2 id="musterfall-titel">Zwei Musterfälle. Einmal Grün, einmal Rot.</h2>
          <p className="schmal">
            Beide aus unserem Rechenkern mit den Branchenwerten des Gesamtverbands der
            Versicherer. Werte gerundet. Ein Musterfall ist keine Vorhersage für Ihren Vertrag.
          </p>
          <div className="hero-raster">
            {faelle.map((fall) => (
              <article key={fall.id} className="wert-karte">
                <Ampel zustand={fall.ampel.ampel} beschriftung={fall.ampel.titel} />
                <h3 style={{ marginTop: '1rem' }}>{fall.titel}</h3>
                <p className="erklaerung">{fall.beschreibung}</p>
                <p style={{ margin: '0.25rem 0' }}>
                  Rückkaufswert: <strong className="betrag">rund {euroGerundet.format(fall.rueckkaufswert)}</strong>
                </p>
                <p style={{ margin: '0.25rem 0' }}>
                  Widerspruch, mittleres Szenario:{' '}
                  <strong className="betrag">rund {euroGerundet.format(fall.basis)}</strong>
                  <br />
                  <span className="erklaerung">
                    Musterfall, Schätzung mit Bandbreite: {euroGerundet.format(fall.min)} bis{' '}
                    {euroGerundet.format(fall.max)}
                  </span>
                </p>
                <p style={{ marginBottom: 0 }}>{fall.ampel.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="abschnitt getoent" aria-labelledby="kosten-titel">
        <div className="container schmal">
          <h2 id="kosten-titel">Was kostet es?</h2>
          <p>
            <strong>Die Ampel: nichts.</strong> Sie sehen Grün, Gelb oder Rot und eine Einordnung in
            Worten. Ohne Konto, ohne Kleingedrucktes.
          </p>
          {VARIANTE.berichtKostenpflichtig && (
            <p>
              <strong>
                Der Bericht: {BERICHT_PREIS_BRUTTO_EUR} € {BERICHT_PREIS_HINWEIS}.
              </strong>{' '}
              Darin: die Spanne in Euro, die Rechnung Jahr für Jahr, jede Zahl mit Quelle, die
              Gegenposition des Versicherers. Kein Abo. <Link href="/bericht">Was im Bericht steht</Link>
            </p>
          )}
          <p className="erklaerung">
            Ob Sie danach verkaufen, durchsetzen lassen oder alles behalten, entscheiden Sie.
          </p>
        </div>
      </section>

      <section className="abschnitt" aria-labelledby="transparenz-titel">
        <div className="container schmal">
          <TransparenzKasten />
        </div>
      </section>

      <section className="abschnitt getoent faq" id="fragen" aria-labelledby="fragen-titel">
        <div className="container schmal">
          <h2 id="fragen-titel">Fragen</h2>
          <details>
            <summary>Was ist ein Widerspruch – und warum bringt er oft mehr?</summary>
            <p>
              Viele Verträge von 1994 bis 2007 wurden ohne richtige Belehrung über das
              Widerspruchsrecht geschlossen. Dann kann der Vertrag Jahre später noch rückabgewickelt
              werden: Beiträge zurück, abzüglich des Schutzes, den Sie hatten, plus die Zinsen, die
              der Versicherer mit Ihrem Geld verdient hat. Das ist oft mehr als der Rückkaufswert –
              aber nicht immer. Deshalb rechnen wir erst.
            </p>
          </details>
          <details>
            <summary>Woher kommen Ihre Zahlen?</summary>
            <p>
              Aus Geschäftsberichten der Versicherer und den Statistiken von Aufsicht und Verband.
              Jede Zahl im Bericht trägt ihre Quelle mit Datum. Fehlt ein Wert, nehmen wir den
              Branchendurchschnitt und schreiben das dazu. Wir erfinden keine Zahlen.
            </p>
          </details>
          <details>
            <summary>Ist die Ampel eine Rechtsberatung?</summary>
            <p>
              Nein. Wir rechnen und ordnen ein. Ob ein Widerspruch in Ihrem Fall wirksam ist,
              prüft am Ende eine Anwältin oder ein Anwalt – auf Wunsch über unsere Partner. Unser
              Ergebnis begründet keinen Anspruch in bestimmter Höhe – es ist eine Schätzung mit
              Bandbreite.
            </p>
          </details>
          <details>
            <summary>Was, wenn die Ampel Rot zeigt?</summary>
            <p>
              Dann sagen wir es klar: Kündigen bringt hier voraussichtlich nicht weniger als der
              Widerspruch. Sie sparen sich Anwaltskosten und Ärger. Rot ist ein Ergebnis, kein
              Misserfolg.
            </p>
          </details>
          <details>
            <summary>Welche Unterlagen brauche ich?</summary>
            <p>
              Für die Ampel: die letzte Standmitteilung. Für die Durchsetzung später: Police,
              Begleitschreiben und Versicherungsbedingungen. Fehlt etwas, muss der Versicherer
              Zweitschriften liefern. Wie Sie die anfordern, steht im Ergebnis.
            </p>
          </details>
          <details>
            <summary>Was passiert mit meinen Daten?</summary>
            <p>
              Ihre Angaben bleiben auf Ihrem Gerät, bis Sie die Ampel anfordern. Dann rechnen wir
              einmal durch und speichern nichts. Weitergegeben wird nur, wenn Sie das ausdrücklich
              wollen. Alles dazu in der <Link href="/datenschutz">Datenschutzerklärung</Link>.
            </p>
          </details>
          <p style={{ marginTop: '1.5rem' }}>
            <Link href="/rechner" className="knopf haupt">
              Jetzt rechnen – kostenlos
            </Link>
          </p>
          <p className="erklaerung">
            {BRAND.name} · Anbieter: {BRAND.anbieter}
          </p>
        </div>
      </section>
    </>
  );
}
