import Link from 'next/link';
import { BRAND } from '@/config/brand';
import { activeModel } from '@/config/business';

export default function Startseite() {
  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>
            Lohnt sich die Rückabwicklung Ihrer Lebens- oder Rentenversicherung?
          </h1>
          <p className="untertitel">
            {BRAND.name} erstellt eine strukturierte Kurzprüfung: Wie hoch wäre der
            Rückabwicklungswert nach einem wirksamen Widerspruch, Rücktritt oder Widerruf –
            geschätzt in drei Szenarien und immer verglichen mit Ihrem aktuellen
            Rückkaufswert. Ergebnis ist eine Entscheidungsgrundlage für Sie und Ihren
            Rechtsanwalt, keine Rechtsberatung.
          </p>
          <p>
            <Link href="/rechner" className="knopf">
              Angaben erfassen
            </Link>
          </p>
        </div>
      </section>

      <section className="abschnitt" aria-labelledby="ablauf-titel">
        <div className="container">
          <h2 id="ablauf-titel">So funktioniert es</h2>
          <ol className="kartenreihe">
            <li className="karte nummeriert">
              <h3>Angaben erfassen</h3>
              <p>
                Sie beantworten Schritt für Schritt Fragen zu Vertrag, Beiträgen und Werten.
                Eine aktuelle Standmitteilung hilft, ist aber nicht Voraussetzung – Ihre
                Eingaben werden zwischengespeichert.
              </p>
            </li>
            <li className="karte nummeriert">
              <h3>Prüfung und Berechnung</h3>
              <p>
                Ein Eignungs-Check ordnet ein, ob Ihr Vertrag überhaupt infrage kommt. Die
                Berechnung schätzt den Rückabwicklungswert in drei Szenarien (Min / Basis /
                Max) – jede verwendete Kennzahl mit Quelle.
              </p>
            </li>
            <li className="karte nummeriert">
              <h3>Schriftliche Kurzprüfung</h3>
              <p>
                Sie erhalten das Ergebnis als nachvollziehbaren Bericht mit Jahrestabelle,
                Annahmen und dem Vergleich zum Rückkaufswert – geeignet als Grundlage für
                eine anwaltliche Prüfung.
              </p>
            </li>
          </ol>
        </div>
      </section>

      <section className="abschnitt getoent" id="methodik" aria-labelledby="methodik-titel">
        <div className="container">
          <h2 id="methodik-titel">Unsere Methodik: vorsichtig statt vollmundig</h2>
          <p>
            Viele Hochrechnungen zinsen einfach den vollen Beitrag mit hohen Renditen auf.
            Wir rechnen bewusst anders – orientiert an der Rechtsprechung des
            Bundesgerichtshofs zur Rückabwicklung von Versicherungsverträgen:
          </p>
          <ul className="punkteliste">
            <li>
              <strong>Nutzungen nur auf den Sparanteil:</strong> Vom Beitrag werden Risiko-,
              Abschluss- und Verwaltungskostenanteile abgezogen; nur der verbleibende
              Sparanteil wird verzinst.
            </li>
            <li>
              <strong>Maßstab ist die Nettoverzinsung Ihres Versicherers:</strong> also das
              tatsächliche Kapitalanlageergebnis der jeweiligen Gesellschaft im jeweiligen
              Jahr – nicht eine pauschale Wunschrendite.
            </li>
            <li>
              <strong>Drei Szenarien statt einer Schlagzeile:</strong> Min, Basis und Max
              zeigen die Bandbreite; jede Kennzahl trägt ihre Quelle mit Abrufdatum.
            </li>
            <li>
              <strong>Ehrlicher Vergleich:</strong> Erhaltene Leistungen und der aktuelle
              Rückkaufswert werden gegengerechnet. Bringt die Rückabwicklung wirtschaftlich
              voraussichtlich nichts, sagen wir das klar.
            </li>
          </ul>
          <p>
            Alle Werte sind Schätzungen unter offengelegten Annahmen. Die genauen
            Fundstellen der Rechtsprechung und die verwendeten Datenreihen werden im Bericht
            ausgewiesen.
          </p>
        </div>
      </section>

      <section className="abschnitt" aria-labelledby="einordnung-titel">
        <div className="container">
          <h2 id="einordnung-titel">Was {BRAND.name} ist – und was nicht</h2>
          <div className="kartenreihe" role="list">
            <div className="karte" role="listitem">
              <h3>Das leistet die Kurzprüfung</h3>
              <ul className="punkteliste">
                <li>Strukturierte Erfassung Ihrer Vertragsdaten</li>
                <li>Eignungs-Check mit Ampel und Begründung als Hinweis</li>
                <li>Geschätzter Rückabwicklungswert in drei Szenarien</li>
                <li>Vergleich mit Rückkaufswert und erhaltenen Leistungen</li>
              </ul>
            </div>
            <div className="karte" role="listitem">
              <h3>Das leistet sie nicht</h3>
              <ul className="punkteliste">
                <li>Keine Rechtsberatung im Einzelfall und keine Vertretung</li>
                <li>Keine Erfolgs- oder Auszahlungsversprechen</li>
                <li>Keine Empfehlung, den Vertrag zu kündigen oder zu behalten</li>
                <li>Keine steuerliche Beratung</li>
              </ul>
            </div>
          </div>
          <p className="hinweis neutral">
            Ob ein Widerspruch, Rücktritt oder Widerruf im Einzelfall wirksam ist, kann nur
            ein Rechtsanwalt beurteilen. Unsere Kurzprüfung bereitet diese Prüfung vor und
            macht sie effizienter.
          </p>
        </div>
      </section>

      <section className="abschnitt getoent" aria-labelledby="modell-titel">
        <div className="container schmal">
          <h2 id="modell-titel">Kosten und Ablauf</h2>
          <p>{activeModel.preisHinweis}</p>
          <p>
            Details regeln die <Link href="/agb">AGB</Link>; der Umgang mit Ihren Daten ist
            in der <Link href="/datenschutz">Datenschutzerklärung</Link> beschrieben.
          </p>
        </div>
      </section>

      <section className="abschnitt faq" id="faq" aria-labelledby="faq-titel">
        <div className="container schmal">
          <h2 id="faq-titel">Häufige Fragen</h2>
          <details>
            <summary>Für welche Verträge kommt eine Rückabwicklung in Betracht?</summary>
            <p>
              Im Schwerpunkt für Kapitallebens- und private Rentenversicherungen (auch
              fondsgebunden), die zwischen dem 29.07.1994 und dem 31.12.2007 im sogenannten
              Policenmodell geschlossen wurden und deren Widerspruchsbelehrung fehlerhaft
              war. Für Verträge ab 2008 gilt ein anderes Widerrufsrecht mit in der Regel
              deutlich geringeren Folgen; Verträge vor dem 29.07.1994 und reine
              Risikolebensversicherungen sind kein Fall. Der Eignungs-Check ordnet Ihren
              Vertrag ein – vereinfacht und ohne rechtliche Bewertung des Einzelfalls.
            </p>
          </details>
          <details>
            <summary>Welche Unterlagen brauche ich?</summary>
            <p>
              Hilfreich sind Police samt Verbraucherinformationen (wegen der Belehrung), die
              letzte Standmitteilung und Angaben zu Beiträgen und Rückkaufswert. Sie können
              die Erfassung auch mit Näherungswerten beginnen und Unterlagen später
              nachreichen – fehlende Werte werden im Ergebnis als Schätzung markiert.
            </p>
          </details>
          <details>
            <summary>Woher kommen die Zahlen in der Berechnung?</summary>
            <p>
              Aus öffentlich verfügbaren Quellen wie Geschäftsberichten der Versicherer und
              Aufsichts- bzw. Verbandsstatistiken. Jede Kennzahl wird mit Quelle und
              Abrufdatum ausgewiesen; fehlt ein Wert, verwenden wir den Branchendurchschnitt
              und kennzeichnen ihn als Schätzung. Werte werden nie erfunden.
            </p>
          </details>
          <details>
            <summary>Ist das Ergebnis verbindlich?</summary>
            <p>
              Nein. Das Ergebnis ist eine Schätzung mit Bandbreite unter offengelegten
              Annahmen. Es ersetzt weder die anwaltliche Prüfung noch die Auskunft des
              Versicherers und begründet keinen Anspruch in bestimmter Höhe.
            </p>
          </details>
          <details>
            <summary>Verliere ich durch die Kurzprüfung meinen Versicherungsschutz?</summary>
            <p>
              Nein. Die Kurzprüfung ist eine reine Auswertung Ihrer Angaben und verändert
              Ihren Vertrag nicht. Ob Sie anschließend etwas unternehmen – und was –,
              entscheiden Sie, sinnvollerweise gemeinsam mit einem Rechtsanwalt. Der Bericht
              weist auch darauf hin, was bei einer Rückabwicklung aufgegeben würde, etwa
              Garantiezins und Versicherungsschutz.
            </p>
          </details>
          <details>
            <summary>Was passiert mit meinen Daten?</summary>
            <p>
              Ihre Eingaben werden zunächst nur in Ihrem Browser zwischengespeichert. Eine
              Weitergabe an Dritte erfolgt ausschließlich mit Ihrer ausdrücklichen
              Einwilligung. Einzelheiten regelt die{' '}
              <Link href="/datenschutz">Datenschutzerklärung</Link>.
            </p>
          </details>
          <p>
            <Link href="/rechner" className="knopf">
              Jetzt Angaben erfassen
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
