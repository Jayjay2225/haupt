import Link from 'next/link';
import { BRAND, RANGE_TEXT } from '@/config/brand';
import { MIN_RUECKKAUFSWERT_TEXT } from '@/config/ampel';
import { BERICHT_PREIS_BRUTTO_EUR, POST_WERKTAGE_TEXT } from '@/config/business';
import { GEPRUEFTE_POLICEN, KANZLEI_NAME } from '@/config/durchsetzung';
import { VARIANTE } from '@/config/variante';
import { AmpelKarte } from '@/components/AmpelKarte';
import { Geschichten } from '@/components/Geschichten';
import { Bildplatzhalter, VideoPlatzhalter } from '@/components/Platzhalter';
import { Preisblock } from '@/components/Preisblock';
import { Testimonials } from '@/components/Testimonials';
import { VideocallSatz } from '@/components/VideocallSatz';
import { alleVersichererNamen } from '@/lib/insurers-data';

/**
 * Startseite (Prompt 14, Abschnitt 1): Hero mit Erklärvideo-Platzhalter links
 * und der Ampel-Karte rechts (vier Angaben → Ampel hochkant → grüner
 * Kaufknopf). Danach: Vertrauenszeile, vier Schritte, „Wir übernehmen“ (mit
 * Stimmungsbild), „Das steckt in Ihrem Gutachten“, Preisblock ohne
 * Streichpreis, Verkaufen (mit Stimmungsbild), Kundenstimmen, Geschichten,
 * FAQ. Bilder stehen nie neben Kundenstimmen, Geschichten oder Beträgen.
 */
export default function Startseite() {
  const namen = alleVersichererNamen();

  return (
    <>
      <section className="hero">
        <div className="container hero-raster">
          <div>
            <p className="vorzeile">Für Lebens- und Rentenversicherungen von {RANGE_TEXT}</p>
            <h1>Der Rückkaufswert ist nicht das letzte Wort.</h1>
            <p className="untertitel">
              In 5 Minuten wissen Sie, ob rechnerisch mehr drin ist – gerechnet mit den echten
              Zahlen Ihres Versicherers.
            </p>
            <VideoPlatzhalter />
            <p style={{ margin: '1rem 0 0.5rem' }}>
              <a href="#ampel" className="knopf haupt">
                Jetzt prüfen
              </a>
            </p>
            <p className="erklaerung mikrozeile">
              Ampel kostenlos · Gutachten {BERICHT_PREIS_BRUTTO_EUR} € · in 12 Stunden per E-Mail
            </p>
          </div>
          <AmpelKarte versichererNamen={namen} />
        </div>
      </section>

      <section className="vertrauen" aria-label="Worauf Sie sich verlassen können">
        <div className="container vertrauen-raster">
          <div className="vertrauen-karte">
            <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 20V9m5 11V4m5 16v-8m5 8V7" strokeLinecap="round"/></svg>
            <p>Amtliche Statistik der Versicherungsaufsicht</p>
          </div>
          <div className="vertrauen-karte">
            <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3l7 4v5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V7l7-4z" strokeLinejoin="round"/></svg>
            <p>Spezialisierte Anwälte für Versicherungsrecht</p>
          </div>
          <div className="vertrauen-karte">
            <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3" strokeLinecap="round"/></svg>
            <p>Ampel in 5 Minuten, Gutachten in 12 Stunden</p>
          </div>
          <div className="vertrauen-karte">
            <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 21h16M6 21V8l6-4 6 4v13M10 21v-5h4v5" strokeLinejoin="round"/></svg>
            <p>Aus {BRAND.stadt}</p>
          </div>
        </div>
      </section>

      <section className="abschnitt" id="so-laeuft-es" aria-labelledby="ablauf-titel">
        <div className="container">
          <h2 id="ablauf-titel">So läuft es</h2>
          <p className="schmal" style={{ fontSize: '1.15rem' }}>
            Der Brief vom Versicherer kommt. Die Zahl ist kleiner als gedacht. Das müssen Sie nicht
            einfach hinnehmen.
          </p>
          <ol className="schrittliste schritte-vier">
            <li>
              <h3>Vier Angaben eingeben</h3>
              <p>Alles steht in Ihrer Standmitteilung.</p>
            </li>
            <li>
              <h3>Ampel sehen – kostenlos</h3>
              <p>Grün heißt: Ihr Vertrag kommt für unser Verfahren in Frage.</p>
            </li>
            <li>
              <h3>Gutachten bestellen – {BERICHT_PREIS_BRUTTO_EUR} €</h3>
              <p>Ihre Zahl, Jahr für Jahr, mit Quellen. Innerhalb von 12 Stunden per E-Mail, auf Wunsch auch per Post.</p>
            </li>
            <li>
              <h3>Wir übernehmen</h3>
              <p>
                Spezialisierte Anwälte setzen sich für Sie mit dem Versicherer auseinander. Sie
                müssen nichts selbst verhandeln.
              </p>
            </li>
          </ol>
        </div>
      </section>

      <section className="abschnitt getoent" aria-labelledby="warum-titel">
        <div className="container hero-raster">
          <div>
            <h2 id="warum-titel">Sie kämpfen nicht allein gegen einen Versicherer.</h2>
            <p style={{ fontSize: '1.15rem' }}>
              Wir übernehmen: Wir organisieren die Durchsetzung mit spezialisierten Anwälten. Sie haben
              einen Ansprechpartner und müssen nichts selbst verhandeln.
            </p>
            <div className="preis-raster">
              <article className="karte klein">
                <h3>Spezialisierte Anwälte</h3>
                <p>Kanzlei für Versicherungsrecht, {KANZLEI_NAME}.</p>
              </article>
              <article className="karte klein">
                <h3>Erfahrung</h3>
                <p>
                  {GEPRUEFTE_POLICEN !== '' ? GEPRUEFTE_POLICEN : '[[ZAHL, belegbar]]'} geprüfte
                  Policen. Wir kennen die Versicherer und ihre Argumente.
                </p>
              </article>
              <article className="karte klein">
                <h3>Ein Ansprechpartner</h3>
                <p>Sie schicken uns die Unterlagen. Den Rest machen wir.</p>
              </article>
            </div>
          </div>
          {/* Stimmungsbild (Prompt 14, 1.7): Paar im Ruhestand – keine Kunden, keine Bildunterschrift. */}
          <Bildplatzhalter motiv="ruhestand" />
        </div>
      </section>

      <section className="abschnitt" aria-labelledby="gutachten-titel">
        <div className="container hero-raster">
          {/* Seite 1 des echten Musterfall-PDFs (scripts/bericht-vorschau.ts) */}
          <img
            className="bericht-vorschau"
            src="/bericht-vorschau.png"
            width={620}
            height={877}
            alt="Erste Seite eines Gutachtens (Musterfall): Ampel, Spanne und Eckdaten des Vertrags"
            loading="lazy"
          />
          <div>
            <h2 id="gutachten-titel">Das steckt in Ihrem Gutachten</h2>
            <ul className="punkteliste merkmal-liste">
              <li>
                <strong>Ihre Zahl.</strong> Was Ihr Vertrag rechnerisch wert sein könnte – als Schätzung mit Bandbreite.
              </li>
              <li>
                <strong>Der Vergleich.</strong> Rückkaufswert gegen Rechnung, als Balken. Sie sehen sofort,
                was Sie beim Kündigen aufgeben würden.
              </li>
              <li>
                <strong>Jahr für Jahr.</strong> Jeder Beitrag, jede Rendite, jede Quelle. Nichts Pauschales.
              </li>
              <li>
                <strong>Die Zahlen Ihres Versicherers.</strong> Aus der amtlichen Statistik, kein
                Branchendurchschnitt, wo es Einzelwerte gibt.
              </li>
              <li>
                <strong>Drei Szenarien.</strong> Vorsichtig, realistisch, maximal. Damit Sie wissen, wo die
                Verhandlung stattfindet.
              </li>
              <li>
                <strong>Ihr nächster Schritt.</strong> Was wir für Sie tun – und wie Sie starten.
              </li>
            </ul>
            <p className="schlusszeile">Wer kündigt, ohne diese Zahl zu kennen, verschenkt sie.</p>
          </div>
        </div>
      </section>

      <section className="abschnitt getoent" aria-labelledby="preis-titel">
        <div className="container">
          <h2 id="preis-titel">Was kostet es?</h2>
          <div className="preis-raster">
            <article className="karte">
              <h3>Kostenlos</h3>
              <p>Die Ampel. Sofort am Bildschirm.</p>
            </article>
            <article className="karte">
              <h3>Das Gutachten</h3>
              <Preisblock />
              <p className="erklaerung" style={{ marginTop: '0.75rem' }}>
                Innerhalb von 12 Stunden per E-Mail. Auf Wunsch zusätzlich gedruckt per Post – kostenlos,{' '}
                {POST_WERKTAGE_TEXT}.
              </p>
            </article>
          </div>
        </div>
      </section>

      {VARIANTE.ankaufHinweis && (
        <section className="abschnitt" aria-labelledby="ankauf-titel">
          <div className="container hero-raster">
            <div>
              <h2 id="ankauf-titel">Verkaufen statt kündigen – und der Familie etwas Gutes tun.</h2>
              <p style={{ fontSize: '1.15rem' }}>
                Manche wollen ihr Geld, aber keinen Streit. Wir zeigen Ihnen beide Wege nebeneinander –
                Sie entscheiden.
              </p>
              <p>
                <Link href="/verkaufen" className="knopf zweitrangig">
                  Zum Ankaufsangebot
                </Link>
              </p>
            </div>
            {/* Stimmungsbild (Prompt 14, 1.7): Paar mit Enkelkindern – keine Kunden, keine Bildunterschrift. */}
            <Bildplatzhalter motiv="enkel" />
          </div>
        </section>
      )}

      <Testimonials />

      <Geschichten />

      <section className="abschnitt faq" id="fragen" aria-labelledby="fragen-titel">
        <div className="container schmal">
          <h2 id="fragen-titel">Fragen</h2>
          <details>
            <summary>Was kostet das?</summary>
            <p>
              Die Ampel nichts. Das Gutachten {BERICHT_PREIS_BRUTTO_EUR} € einmalig. Keine
              weiteren Kosten, kein Abo.
            </p>
          </details>
          <details>
            <summary>Ich habe schon gekündigt. Geht das noch?</summary>
            <p>Gekündigte oder ausgezahlte Verträge übernehmen wir nicht. Lassen Sie sich dazu anwaltlich beraten.</p>
          </details>
          <details>
            <summary>Mein Vertrag ist von 1985. Lohnt sich das?</summary>
            <p>
              Die Ampel zeigt, ob Ihr Vertrag für unser Verfahren in Frage kommt. Das Gutachten nennt
              Ihre Zahl.
            </p>
          </details>
          <details>
            <summary>Wie schnell geht das?</summary>
            <p>Ampel in 5 Minuten. Gutachten innerhalb von 12 Stunden per E-Mail. Danach melden wir uns.</p>
          </details>
          <details>
            <summary>Bekomme ich das Gutachten auch auf Papier?</summary>
            <p>Ja, kostenlos, {POST_WERKTAGE_TEXT}. Wählen Sie das bei der Bestellung.</p>
          </details>
          <details>
            <summary>Was macht {BRAND.name} genau?</summary>
            <p>
              Wir rechnen Ihren Vertrag durch und organisieren die Durchsetzung mit spezialisierten
              Anwälten. Sie haben einen Ansprechpartner.
            </p>
          </details>
          <details>
            <summary>Was, wenn mein Rückkaufswert unter {MIN_RUECKKAUFSWERT_TEXT} liegt?</summary>
            <p>
              Dann ist Ihr Vertrag für unser Verfahren zu klein. Lassen Sie sich von einem Anwalt
              Ihrer Wahl oder der Verbraucherzentrale beraten.
            </p>
          </details>
          <details>
            <summary>Ich habe noch Fragen.</summary>
            <p><VideocallSatz /></p>
          </details>
        </div>
      </section>
    </>
  );
}
