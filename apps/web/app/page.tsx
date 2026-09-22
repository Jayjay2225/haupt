import Link from 'next/link';
import { BRAND } from '@/config/brand';
import { BERICHT_PREIS_BRUTTO_EUR, BERICHT_PREIS_HINWEIS, BERICHT_PREIS_REGULAER_EUR } from '@/config/business';
import { HERO_VARIANTE } from '@/config/marketing';
import { VARIANTE } from '@/config/variante';
import { Ampel } from '@/components/Ampel';
import { Schnellcheck } from '@/components/Schnellcheck';
import { Testimonials } from '@/components/Testimonials';
import { TransparenzKasten } from '@/components/TransparenzKasten';
import { alleVersichererNamen } from '@/lib/insurers-data';
import { musterfaelle } from '@/lib/musterfall';

const euroGerundet = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

/** Hero-Varianten für A/B-Tests (Prompt 10, Copy-Deck Abschnitt 3). */
const HERO = {
  a: {
    h1: ['30 Jahre eingezahlt.', 'Und dann diese Zahl?'],
    unterzeile:
      'Wer zwischen 1994 und 2007 eine Lebens- oder Rentenversicherung abgeschlossen hat, kann oft deutlich mehr zurückholen als den Rückkaufswert. Wir rechnen es in 5 Minuten aus.',
    knopf: 'Zeig mir meine Ampel',
  },
  b: {
    h1: ['Kündigen Sie nicht.', 'Rechnen Sie erst.'],
    unterzeile:
      'Der Rückkaufswert ist das, was der Versicherer zahlen will. Der BGH hat vielen Kunden einen zweiten Weg geöffnet. Prüfen Sie, ob er sich für Sie lohnt.',
    knopf: 'Jetzt rechnen',
  },
  c: {
    h1: ['Der Rückkaufswert ist', 'nicht das letzte Wort.'],
    unterzeile: 'Mit den echten Kapitalerträgen Ihres Versicherers. Ergebnis sofort, nicht in zwei Tagen.',
    knopf: 'Was ist in meinem Vertrag drin?',
  },
} as const;

export default function Startseite() {
  const namen = alleVersichererNamen();
  const faelle = musterfaelle();
  const hero = HERO[HERO_VARIANTE];
  // Beweis-Kachel 2: Zahlen ausschließlich aus dem Rechenkern (Musterfall Kapital-LV 1995).
  const beweisFall = faelle.find((f) => f.id === 'kapital-lv-1995');

  return (
    <>
      <section className="hero">
        <div className="container hero-raster">
          <div>
            <h1>
              {hero.h1[0]} <span className="hervor">{hero.h1[1]}</span>
            </h1>
            <p className="untertitel">{hero.unterzeile}</p>
            <p>
              <Link href="/rechner" className="knopf haupt">
                {hero.knopf}
              </Link>
            </p>
            <p>
              <strong>Vertrag zwischen 1990 und 2016?</strong> Dann lohnt der Blick.
            </p>
          </div>
          <Schnellcheck versichererNamen={namen} />
        </div>
      </section>

      <section className="abschnitt getoent" aria-labelledby="schmerz-titel">
        <div className="container schmal">
          <h2 id="schmerz-titel">Der Rückkaufswert-Schock</h2>
          <p style={{ fontSize: '1.15rem' }}>
            Der Brief vom Versicherer kommt. Die Zahl ist kleiner als gedacht. <strong>Viel kleiner.</strong>
          </p>
          <p>
            Sie haben Jahrzehnte gezahlt. Der Versicherer hat mit Ihrem Geld gearbeitet, jedes Jahr. Und
            bietet Ihnen jetzt den Rückkaufswert. Bei vielen Altverträgen liegt der unter dem, was
            eingezahlt wurde.
          </p>
          <p>
            <strong>Das müssen Sie nicht einfach hinnehmen.</strong> Zwischen 1994 und 2007 wurden in
            Deutschland Lebens- und Rentenversicherungen massenhaft nach demselben Muster abgeschlossen –
            viele davon mit einer fehlerhaften Belehrung. Genau darauf hat der Bundesgerichtshof 2014
            reagiert.
          </p>
        </div>
      </section>

      <section className="abschnitt" aria-labelledby="beweis-titel">
        <div className="container">
          <h2 id="beweis-titel">Das ist keine Meinung. Das ist Rechtsprechung.</h2>
          <div className="hero-raster" style={{ alignItems: 'stretch' }}>
            <article className="wert-karte">
              <h3>Der BGH sagt:</h3>
              <p>
                Kunden mit fehlerhafter Belehrung können auch Jahre später noch aus dem Vertrag – und
                bekommen dann mehr als den Rückkaufswert zurück.
              </p>
              <p className="erklaerung" style={{ marginBottom: 0 }}>
                BGH, Urteil vom 7. Mai 2014, Az. IV ZR 76/11 – sinngemäß wiedergegeben; Fundstellen im
                Prüfbericht.
              </p>
            </article>
            {beweisFall !== undefined && (
              <article className="wert-karte">
                <h3>Unsere Rechnung sagt (Musterfall):</h3>
                <p style={{ marginBottom: '0.35rem' }}>
                  Eingezahlt: <strong className="betrag">rund {euroGerundet.format(beweisFall.eingezahlt)}</strong>
                  <br />
                  Angebot des Versicherers:{' '}
                  <strong className="betrag">rund {euroGerundet.format(beweisFall.rueckkaufswert)}</strong>
                  <br />
                  Rechnerisch drin: <strong className="betrag">rund {euroGerundet.format(beweisFall.min)}</strong>
                </p>
                <p className="erklaerung" style={{ marginBottom: 0 }}>
                  Musterfall aus unserem Rechenkern, vorsichtiges Szenario, Schätzung mit Bandbreite –
                  kein Gerichtsergebnis, keine Vorhersage für Ihren Vertrag.
                </p>
              </article>
            )}
            <article className="wert-karte">
              <h3>Und wir sagen auch Rot:</h3>
              <p>
                Bei manchen Verträgen lohnt es sich nicht. Dann sagen wir das. Und verkaufen Ihnen
                nichts.
              </p>
            </article>
          </div>
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
              <p>Grün, Gelb oder Rot. So wissen Sie Bescheid.</p>
            </li>
            <li>
              <h3>Was ist für Sie drin?</h3>
              <p>
                Der Prüfbericht zeigt, was rechnerisch drin ist: Spanne, Jahrestabelle, Quellen –
                schwarz auf weiß. Und wenn ja: unsere Partner übernehmen den Rest.
              </p>
            </li>
          </ol>
          <div className="hinweis neutral" style={{ marginTop: '1.25rem' }}>
            <p>
              <strong>Kein Wartezimmer. Kein Rückruf. Kein „wir melden uns“.</strong> Andere lassen Sie
              zwei Tage auf ein Ergebnis warten. Bei uns steht Ihre Ampel nach fünf Minuten, der
              Prüfbericht kommt direkt danach. Sie können heute Abend noch wissen, woran Sie sind.
            </p>
          </div>
        </div>
      </section>

      <section className="abschnitt" aria-labelledby="musterfall-titel">
        <div className="container">
          <h2 id="musterfall-titel">Zwei Musterfälle. Einmal Grün, einmal Rot.</h2>
          <p className="schmal">
            Beide aus unserem Rechenkern mit den Branchenwerten des Gesamtverbands der Versicherer.
            Werte gerundet. Ein Musterfall ist keine Vorhersage für Ihren Vertrag.
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

      <section className="abschnitt getoent" aria-labelledby="zukunft-titel">
        <div className="container schmal">
          <h2 id="zukunft-titel">Wofür wäre es?</h2>
          <p>
            Die Reise, die seit Jahren verschoben wird. Das Konto fürs Enkelkind. Ein Ruhestand, in dem
            Sie nicht mehr rechnen müssen. Wir wissen nicht, was bei Ihnen drin ist.{' '}
            <strong>Aber wir wissen, wie man es herausfindet.</strong>
          </p>
        </div>
      </section>

      <section className="abschnitt" aria-labelledby="kosten-titel">
        <div className="container schmal">
          <h2 id="kosten-titel">Was kostet es?</h2>
          <p>
            <strong>Die Ampel: nichts.</strong> Sie sehen Grün, Gelb oder Rot und eine Einordnung in
            Worten. Ohne Konto, ohne Kleingedrucktes.
          </p>
          {VARIANTE.berichtKostenpflichtig && (
            <p>
              <strong className="betrag">
                Der Prüfbericht: {BERICHT_PREIS_BRUTTO_EUR} € statt <s>{BERICHT_PREIS_REGULAER_EUR} €</s>. Einmal.
              </strong>{' '}
              Oft weniger als ein Monatsbeitrag. Dafür bekommen Sie die Zahl, um die es wirklich geht:
              Jahr für Jahr, mit den veröffentlichten Kapitalerträgen Ihres Versicherers*, mit Quellen,
              zum Mitnehmen zum Anwalt. <Link href="/bericht">Was im Prüfbericht steht</Link>
            </p>
          )}
          <p className="erklaerung">
            * soweit vom Versicherer bzw. der Aufsicht veröffentlicht; Branchenwerte sind im Prüfbericht
            gekennzeichnet.
          </p>
        </div>
      </section>

      {VARIANTE.ankaufHinweis && (
        <section className="abschnitt getoent" aria-labelledby="ankauf-titel">
          <div className="container schmal">
            <h2 id="ankauf-titel">Klagen ist nicht Ihr Ding? Dann verkaufen Sie.</h2>
            <p>
              Manche wollen ihr Geld, aber keinen Streit. Für die gibt es einen dritten Weg: den Vertrag
              verkaufen statt kündigen. Wir zeigen Ihnen beide Wege nebeneinander. Sie entscheiden.{' '}
              <Link href="/verkaufen">Verkaufen statt kündigen – so läuft es</Link>
            </p>
          </div>
        </section>
      )}

      <section className="abschnitt" aria-labelledby="transparenz-titel">
        <div className="container schmal">
          <Testimonials />
          <TransparenzKasten />
        </div>
      </section>

      <section className="abschnitt getoent faq" id="fragen" aria-labelledby="fragen-titel">
        <div className="container schmal">
          <h2 id="fragen-titel">Fragen</h2>
          <details>
            <summary>Ich habe schon gekündigt. Zu spät?</summary>
            <p>Nicht unbedingt. Auch gekündigte Verträge können geprüft werden. Wir fragen das im Check ab.</p>
          </details>
          <details>
            <summary>Warum soll ich dafür zahlen?</summary>
            <p>
              Weil eine echte Rechnung mit Unternehmenszahlen Arbeit ist und ein Anwalt genau die
              braucht. Die Ampel davor kostet nichts.
            </p>
          </details>
          <details>
            <summary>Ist das seriös?</summary>
            <p>
              Wir zeigen Ihnen jede Zahl mit Quelle. Wir sagen Rot, wenn es Rot ist. Und wir schreiben
              auf, wie wir Geld verdienen.
            </p>
          </details>
          <details>
            <summary>Was ist ein Widerspruch – und warum bringt er oft mehr?</summary>
            <p>
              Viele Verträge von 1994 bis 2007 wurden ohne richtige Belehrung über das Widerspruchsrecht
              geschlossen. Dann kann der Vertrag Jahre später noch rückabgewickelt werden: Beiträge
              zurück, abzüglich des Schutzes, den Sie hatten, plus die Zinsen, die der Versicherer mit
              Ihrem Geld verdient hat. Das ist oft mehr als der Rückkaufswert – aber nicht immer.
              Deshalb rechnen wir erst.
            </p>
          </details>
          <details>
            <summary>Ist die Ampel eine Rechtsberatung?</summary>
            <p>
              Nein. Wir rechnen und ordnen ein. Ob ein Widerspruch in Ihrem Fall wirksam ist, prüft am
              Ende eine Anwältin oder ein Anwalt – auf Wunsch über unsere Partner. Unser Ergebnis
              begründet keinen Anspruch in bestimmter Höhe – es ist eine Schätzung mit Bandbreite.
            </p>
          </details>
          <details>
            <summary>Was passiert mit meinen Daten?</summary>
            <p>
              Ihre Eingaben bleiben auf Ihrem Gerät gespeichert, bis Sie sie auf der Ergebnis-Seite
              löschen. Zum Rechnen werden sie einmal übertragen und dabei nicht gespeichert.
              Weitergegeben wird nichts ohne Ihr ausdrückliches Ja. Einzelheiten in der{' '}
              <Link href="/datenschutz">Datenschutzerklärung</Link>.
            </p>
          </details>
        </div>
      </section>

      <p className="erklaerung" style={{ textAlign: 'center', padding: '0 1rem 2rem' }}>
        {BRAND.name} · Anbieter: {BRAND.anbieter}
      </p>
    </>
  );
}
