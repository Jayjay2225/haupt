import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { VARIANTE } from '@/config/variante';
import { TransparenzKasten } from '@/components/TransparenzKasten';

export const metadata: Metadata = {
  title: 'Verkaufen statt kündigen',
};

/**
 * Ankaufsangebot für Privatkunden (Prompt 8, Aufgabe 2 und 3).
 * Kommunikationsregeln: keine Aufsichts- oder Erlaubnisangaben, kein Name des
 * Aufkäufers, keine Prozentangaben, keine Empfehlung – die Wege stehen
 * nebeneinander, jeweils mit dem, was man aufgibt.
 */
export default function VerkaufenSeite() {
  if (!VARIANTE.ankaufHinweis) {
    notFound();
  }
  return (
    <div className="container schmal abschnitt">
      <h1>
        Verkaufen statt kündigen<span className="hervor">.</span>
      </h1>
      <p className="untertitel">
        Manche Policen sind für Käufer mehr wert als der Rückkaufswert. Ob Ihre dazugehört, zeigt
        ein Angebot – ohne Druck, ohne Verpflichtung.
      </p>

      <div className="hinweis">
        <p>
          <strong>[[ANKAUF-PRIVAT: Vertragsarten, Mindest-Rückkaufswert, Ablauf]]</strong>
          <br />
          Die Konditionen (welche Vertragsarten, ab welchem Rückkaufswert, wie der Ablauf aussieht)
          folgen, sobald sie feststehen. Bis dahin bleibt dieser Platzhalter sichtbar.
        </p>
      </div>

      <h2>Wie es läuft</h2>
      <ol className="schrittliste">
        <li>
          <h3>Sie sagen Ja zur Kontaktaufnahme</h3>
          <p>Nur auf der Ergebnis-Seite, mit eigenem Häkchen. Vorher geben wir nichts weiter.</p>
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

      <h2>Fünf Wege – und was Sie dabei aufgeben</h2>
      <p>Wir empfehlen keinen. Wir legen sie nebeneinander.</p>
      <div className="tabellen-scroll">
        <table className="wege">
          <thead>
            <tr>
              <th scope="col">Weg</th>
              <th scope="col">Was Sie bekommen</th>
              <th scope="col">Was Sie aufgeben</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Behalten</th>
              <td>Garantiezins und Überschüsse bis zum Ablauf, Todesfallschutz, Ablaufleistung.</td>
              <td>Das Geld bleibt gebunden; weitere Beiträge sind fällig.</td>
            </tr>
            <tr>
              <th scope="row">Beitragsfrei stellen</th>
              <td>Keine Beiträge mehr, Vertrag und Garantie laufen kleiner weiter.</td>
              <td>Niedrigere Ablaufleistung; der Schutz sinkt.</td>
            </tr>
            <tr>
              <th scope="row">Kündigen</th>
              <td>Den Rückkaufswert, meist innerhalb weniger Wochen.</td>
              <td>Schutz, Garantiezins und alles, was ein Widerspruch oder Verkauf mehr gebracht hätte.</td>
            </tr>
            <tr>
              <th scope="row">Widerspruch anwaltlich prüfen lassen</th>
              <td>Bei Erfolg die Rückabwicklung: Beiträge minus Schutz plus gezogene Zinsen.</td>
              <td>Zeit, Anwaltskosten, Prozessrisiko; der Vertrag endet. Ohne Belehrungsfehler geht nichts.</td>
            </tr>
            <tr>
              <th scope="row">Verkaufen</th>
              <td>Einen Kaufpreis für die Police; der Käufer führt den Vertrag weiter.</td>
              <td>Schutz und Ablaufleistung gehen an den Käufer; ein Widerspruch ist danach nicht mehr Ihre Sache.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="erklaerung">
        Steuern können bei jedem Weg eine Rolle spielen. Dazu beraten wir nicht – fragen Sie Ihre
        Steuerberatung.
      </p>

      <TransparenzKasten kompakt />

      <p>
        <Link href="/rechner" className="knopf haupt">
          Erst rechnen – kostenlos
        </Link>
      </p>
    </div>
  );
}
