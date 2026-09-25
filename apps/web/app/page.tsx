import Link from 'next/link';
import { BRAND, RANGE_TEXT } from '@/config/brand';
import { BERICHT_PREIS_BRUTTO_EUR } from '@/config/business';
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
              Ampel kostenlos · Bericht {BERICHT_PREIS_BRUTTO_EUR} € · Ergebnis sofort
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
            <p>Gestützt auf BGH-Rechtsprechung</p>
          </div>
          <div className="vertrauen-karte">
            <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3" strokeLinecap="round"/></svg>
            <p>Ampel in 5 Minuten, Bericht sofort</p>
          </div>
          <div className="vertrauen-karte">
            <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 21h16M6 21V8l6-4 6 4v13M10 21v-5h4v5" strokeLinejoin="round"/></svg>
            <p>Versicherungsanalyse aus {BRAND.stadt}</p>
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
          <ol className="schrittliste">
            <li>
              <h3>Vier Angaben eingeben</h3>
              <p>Versicherer, Beginn, Beitrag, Rückkaufswert. Alles steht in Ihrer Standmitteilung.</p>
            </li>
            <li>
              <h3>Ampel sehen – kostenlos</h3>
              <p>Grün, Gelb oder Rot. Rot heißt: lohnt nicht. Das sagen wir Ihnen auch.</p>
            </li>
            <li>
              <h3>Bericht holen – {BERICHT_PREIS_BRUTTO_EUR} €</h3>
              <p>Die genaue Zahl, Jahr für Jahr, mit Quellen. Zum Mitnehmen zum Anwalt.</p>
            </li>
          </ol>
        </div>
      </section>

      <section className="abschnitt getoent" aria-labelledby="bericht-titel">
        <div className="container hero-raster">
          <div>
            <h2 id="bericht-titel">Das steht im Bericht</h2>
            <ul className="punkteliste" style={{ fontSize: '1.1rem' }}>
              <li>Ihre Zahl, Jahr für Jahr aufgeschlüsselt</li>
              <li>Jede Rendite mit Quelle</li>
              <li>Fertig für Anwalt und Rechtsschutzversicherung</li>
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

      <section className="abschnitt" aria-labelledby="preis-titel">
        <div className="container">
          <h2 id="preis-titel">Was kostet es?</h2>
          <div className="preis-raster">
            <article className="karte">
              <h3>Kostenlos</h3>
              <p>Ampel und Größenordnung. Sofort am Bildschirm.</p>
            </article>
            <article className="karte">
              <h3>{BERICHT_PREIS_BRUTTO_EUR} € einmalig</h3>
              <p>
                Prüfbericht mit genauer Zahl, Jahr für Jahr, mit allen Quellen. Oft weniger als ein
                Monatsbeitrag.
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

      {VARIANTE.transparenzKasten && (
        <section className="abschnitt" aria-labelledby="transparenz-titel">
          <div className="container schmal">
            <div className="transparenz">
              <h2 id="transparenz-titel" style={{ fontSize: '1.4rem' }}>
                So verdienen wir:
              </h2>
              <p style={{ marginBottom: 0 }}>
                am Prüfbericht und wenn Sie über uns verkaufen. Nicht daran, ob Sie klagen. Deshalb
                sagen wir Ihnen auch, wenn es sich nicht lohnt.
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="abschnitt getoent faq" id="fragen" aria-labelledby="fragen-titel">
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
            <summary>Ich habe schon gekündigt. Zu spät?</summary>
            <p>Nicht unbedingt. Auch gekündigte und ausgezahlte Verträge rechnen wir. Wir fragen das im Check ab.</p>
          </details>
          <details>
            <summary>Mein Vertrag ist von 1985. Lohnt sich das?</summary>
            <p>
              Die Ampel zeigt, ob rechnerisch mehr drin ist als der Rückkaufswert. Welcher Weg für
              Ihren Vertrag passt, prüft Ihr Anwalt mit dem Bericht in der Hand.
            </p>
          </details>
          <details>
            <summary>Brauche ich eine Rechtsschutzversicherung?</summary>
            <p>
              Nicht für den Check. Für ein Verfahren hilft sie sehr. Wir fragen danach, damit Ihr
              Bericht die passenden Hinweise enthält.
            </p>
          </details>
          <details>
            <summary>Wie schnell geht das?</summary>
            <p>Ampel in 5 Minuten. Bericht direkt nach der Bestellung. Kein Rückruf, kein Warten.</p>
          </details>
          <details>
            <summary>Ist das Rechtsberatung?</summary>
            <p>
              Nein. Wir rechnen mit veröffentlichten Zahlen und legen jede Quelle offen. Die
              rechtliche Prüfung macht Ihr Anwalt – mit unserem Bericht als Grundlage.
            </p>
          </details>
        </div>
      </section>
    </>
  );
}
