import Link from 'next/link';
import { BRAND, RANGE_TEXT } from '@/config/brand';
import { BERICHT_PREIS_BRUTTO_EUR } from '@/config/business';
import { GEPRUEFTE_POLICEN, KANZLEI_NAME, PREIS_ANRECHNUNG } from '@/config/durchsetzung';
import { VARIANTE } from '@/config/variante';
import { Schnellcheck } from '@/components/Schnellcheck';
import { Testimonials } from '@/components/Testimonials';
import { alleVersichererNamen } from '@/lib/insurers-data';

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
            <p style={{ marginBottom: '0.5rem' }}>
              <Link href="/rechner" className="knopf haupt">
                Jetzt prüfen
              </Link>
            </p>
            <p className="erklaerung mikrozeile">
              Ampel kostenlos · Bericht {BERICHT_PREIS_BRUTTO_EUR} € · in 12 Stunden per E-Mail
            </p>
          </div>
          <Schnellcheck versichererNamen={namen} />
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
            <p>Ampel in 5 Minuten, Bericht in 12 Stunden</p>
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
              <h3>Prüfbericht bestellen – {BERICHT_PREIS_BRUTTO_EUR} €</h3>
              <p>Ihre Zahl, Jahr für Jahr, mit Quellen. Innerhalb von 12 Stunden per E-Mail.</p>
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
        <div className="container">
          <h2 id="warum-titel">Sie kämpfen nicht allein gegen einen Versicherer.</h2>
          <div className="preis-raster wege-karten">
            <article className="karte">
              <h3>Spezialisierte Anwälte</h3>
              <p>Kanzlei für Versicherungsrecht, {KANZLEI_NAME}.</p>
            </article>
            <article className="karte">
              <h3>Erfahrung</h3>
              <p>
                {GEPRUEFTE_POLICEN !== '' ? GEPRUEFTE_POLICEN : '[[ZAHL, belegbar]]'} geprüfte
                Policen. Wir kennen die Versicherer und ihre Argumente.
              </p>
            </article>
            <article className="karte">
              <h3>Ein Ansprechpartner</h3>
              <p>Sie schicken uns die Unterlagen. Den Rest machen wir.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="abschnitt" aria-labelledby="bericht-titel">
        <div className="container hero-raster">
          <div>
            <h2 id="bericht-titel">Das steht im Bericht</h2>
            <ul className="punkteliste" style={{ fontSize: '1.1rem' }}>
              <li>Ihre Zahl, Jahr für Jahr aufgeschlüsselt</li>
              <li>Jede Rendite mit Quelle</li>
              <li>Die Grundlage für unser Verfahren</li>
            </ul>
          </div>
          {/* Seite 1 des echten Musterfall-PDFs (scripts/bericht-vorschau.ts) */}
          <img
            className="bericht-vorschau"
            src="/bericht-vorschau.png"
            width={620}
            height={877}
            alt="Erste Seite eines Prüfberichts (Musterfall): Ampel, Spanne und Eckdaten des Vertrags"
            loading="lazy"
          />
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
              <h3>{BERICHT_PREIS_BRUTTO_EUR} € einmalig</h3>
              <p>
                Prüfbericht mit Ihrer Zahl, Jahr für Jahr, mit allen Quellen. Innerhalb von 12
                Stunden per E-Mail.{PREIS_ANRECHNUNG ? ' Wird bei Beauftragung angerechnet.' : ''}
              </p>
            </article>
          </div>
        </div>
      </section>

      <Testimonials />

      {VARIANTE.ankaufHinweis && (
        <section className="abschnitt getoent" aria-labelledby="ankauf-titel">
          <div className="container schmal">
            <h2 id="ankauf-titel">Klagen ist nicht Ihr Ding? Dann verkaufen Sie.</h2>
            <p>
              Manche wollen ihr Geld, aber keinen Streit. Wir zeigen Ihnen beide Wege nebeneinander.
            </p>
            <p>
              <Link href="/verkaufen">Zum Ankaufsangebot</Link>
            </p>
          </div>
        </section>
      )}

      <section className="abschnitt faq" id="fragen" aria-labelledby="fragen-titel">
        <div className="container schmal">
          <h2 id="fragen-titel">Fragen</h2>
          <details>
            <summary>Was kostet das?</summary>
            <p>
              Die Ampel nichts. Der Prüfbericht {BERICHT_PREIS_BRUTTO_EUR} € einmalig. Keine
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
              Die Ampel zeigt, ob Ihr Vertrag für unser Verfahren in Frage kommt. Der Bericht nennt
              Ihre Zahl.
            </p>
          </details>
          <details>
            <summary>Brauche ich eine Rechtsschutzversicherung?</summary>
            <p>
              Sie hilft, ist aber keine Voraussetzung. Wir fragen danach und besprechen mit Ihnen
              den passenden Weg.
            </p>
          </details>
          <details>
            <summary>Wie schnell geht das?</summary>
            <p>Ampel in 5 Minuten. Bericht innerhalb von 12 Stunden per E-Mail. Danach melden wir uns.</p>
          </details>
          <details>
            <summary>Was macht {BRAND.name} genau?</summary>
            <p>
              Wir rechnen Ihren Vertrag durch und organisieren die Durchsetzung mit spezialisierten
              Anwälten. Sie haben einen Ansprechpartner.
            </p>
          </details>
          <details>
            <summary>Was, wenn mein Rückkaufswert unter 30.000 € liegt?</summary>
            <p>
              Dann ist Ihr Vertrag für unser Verfahren zu klein. Lassen Sie sich von einem Anwalt
              Ihrer Wahl oder der Verbraucherzentrale beraten.
            </p>
          </details>
        </div>
      </section>
    </>
  );
}
