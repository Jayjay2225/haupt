import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { VARIANTE } from '@/config/variante';
import { AnfrageFormular } from '@/components/AnfrageFormular';

export const metadata: Metadata = {
  title: 'Verkaufen statt kündigen',
};

/**
 * Ankaufsangebot (Prompt 12, Abschnitt 3.5). Kommunikationsregeln: keine
 * Aufsichtsbehörde, kein Name des Aufkäufers, keine Prozentangaben, keine
 * Empfehlung zu kündigen oder zu verkaufen – drei Wege nebeneinander.
 */
export default function VerkaufenSeite() {
  if (!VARIANTE.ankaufHinweis) {
    notFound();
  }
  return (
    <div className="container schmal abschnitt">
      <h1>Verkaufen statt kündigen.</h1>
      <p className="untertitel">
        Manche wollen ihr Geld, aber keinen Streit. Wir zeigen Ihnen die Wege nebeneinander – Sie
        entscheiden.
      </p>

      <div className="preis-raster wege-karten">
        <article className="karte">
          <h2>Kündigen</h2>
          <p>Der Rückkaufswert kommt meist innerhalb weniger Wochen.</p>
          <p className="erklaerung">
            Das geben Sie auf: Schutz, Garantien – und alles, was eine Rückabwicklung oder ein
            Verkauf mehr gebracht hätte.
          </p>
        </article>
        <article className="karte">
          <h2>Rückabwicklung prüfen</h2>
          <p>Rechnerisch ist oft mehr drin als der Rückkaufswert; der Bericht liefert die Zahl.</p>
          <p className="erklaerung">
            Das geben Sie auf: Zeit – ein Verfahren dauert, und ohne anwaltliche Prüfung geht nichts.
          </p>
        </article>
        <article className="karte">
          <h2>Verkaufen</h2>
          <p>Sie erhalten einen Kaufpreis; der Käufer führt den Vertrag weiter.</p>
          <p className="erklaerung">
            Das geben Sie auf: Schutz und Ablaufleistung gehen an den Käufer; eine Rückabwicklung
            ist danach nicht mehr Ihre Sache.
          </p>
        </article>
      </div>

      <h2>Wie es läuft</h2>
      <ol className="schrittliste">
        <li>
          <h3>Sie fragen an</h3>
          <p>Mit dem Formular unten – eigenes Häkchen, vorher geben wir nichts weiter.</p>
        </li>
        <li>
          <h3>Sie bekommen ein Angebot</h3>
          <p>Ein Organisationspartner wickelt ab und nennt Ihnen den Preis. Sie vergleichen in Ruhe.</p>
        </li>
        <li>
          <h3>Sie entscheiden</h3>
          <p>Annehmen, ablehnen, nachdenken. Alles ist erlaubt. Nichts eilt.</p>
        </li>
      </ol>

      <div className="hinweis">
        <p>
          <strong>[[ANKAUF-PRIVAT: Vertragsarten, Mindest-Rückkaufswert, Ablauf]]</strong>
          <br />
          Die Konditionen (welche Vertragsarten, ab welchem Rückkaufswert, wie der Ablauf aussieht)
          folgen, sobald sie feststehen. Bis dahin bleibt dieser Platzhalter sichtbar.
        </p>
      </div>

      <h2>Unverbindliches Ankaufsangebot anfordern</h2>
      <AnfrageFormular art="ankauf" />

      <p className="erklaerung">
        Steuern können bei jedem Weg eine Rolle spielen. Dazu beraten wir nicht – fragen Sie Ihre
        Steuerberatung. Wir empfehlen keinen der Wege; erst rechnen hilft:{' '}
        <Link href="/rechner">zur kostenlosen Ampel</Link>.
      </p>
    </div>
  );
}
