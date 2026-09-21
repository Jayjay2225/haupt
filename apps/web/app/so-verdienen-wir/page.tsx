import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { KontaktAdresse } from '@/components/KontaktAdresse';
import { BRAND } from '@/config/brand';
import { BERICHT_PREIS_BRUTTO_EUR, BERICHT_PREIS_HINWEIS } from '@/config/business';
import { VARIANTE } from '@/config/variante';

export const metadata: Metadata = {
  title: 'So verdienen wir alle',
};

export default function SoVerdienenWirSeite() {
  if (!VARIANTE.transparenzKasten) {
    notFound();
  }
  return (
    <div className="container schmal abschnitt">
      <h1>
        So verdienen wir <span className="hervor">alle</span>. In Klartext.
      </h1>
      <p className="untertitel">
        Rechner, Bericht und Verkauf laufen unter einer Marke. Damit Sie wissen, was Sie bekommen –
        und woran wir verdienen.
      </p>

      <h2>Ihr Weg zum Geld – in drei Schritten</h2>
      <ol className="punkteliste">
        <li>
          <strong>Verkauf:</strong> Sie erhalten innerhalb von 18 Werktagen den vereinbarten
          anteiligen Rückkaufswert, ausgezahlt über unseren Abwicklungspartner.
        </li>
        <li>
          <strong>Steuer:</strong> Je nach Vertrag können Sie zusätzlich eine Steuererstattung
          beantragen – das prüft Ihre Steuerberatung.
        </li>
        <li>
          <strong>Durchsetzung:</strong> Unsere Partnerkanzleien setzen die Rückabwicklung durch.
          Was dabei zusätzlich herauskommt, gehört allein Ihnen.
        </li>
      </ol>
      <p className="erklaerung">
        Die genauen Konditionen des Ankaufs veröffentlichen wir, sobald sie feststehen. Bis dahin
        geben wir nichts weiter – vor jeder Weitergabe fragen wir Sie ausdrücklich.
      </p>

      <h2>Wir verdienen am Bericht.</h2>
      <p>
        Die Ampel ist kostenlos. Der schriftliche Bericht kostet {BERICHT_PREIS_BRUTTO_EUR} €{' '}
        {BERICHT_PREIS_HINWEIS}. Das ist unser Preis, kein Lockangebot. Er ändert sich nicht, wenn
        die Ampel Grün zeigt.
      </p>

      <h2>Wir verdienen, wenn Sie über uns verkaufen.</h2>
      <p>
        Wenn Sie Ihre Police über unseren Kontakt verkaufen, bekommen wir vom Organisationspartner
        eine Vergütung. Deshalb steht der Hinweis auf den Verkauf immer getrennt, mit eigenem
        Häkchen. Und deshalb sagen wir es hier.
      </p>

      <h2>Ihr Erlös gehört Ihnen.</h2>
      <p>
        Von dem, was die Durchsetzung zusätzlich bringt, bekommen wir nichts – keine
        Erfolgsbeteiligung, keine Provision aus Ihrem Erlös. Und die Ampel zeigt Rot, wenn Rot dran
        ist. Auch das gehört zur Rechnung.
      </p>

      <h2>Was wir nicht tun</h2>
      <ul className="punkteliste">
        <li>Wir empfehlen nicht, zu kündigen, zu verkaufen oder zu behalten. Wir legen die Wege nebeneinander.</li>
        <li>Wir beraten nicht rechtlich und nicht steuerlich.</li>
        <li>Wir geben Ihre Daten nicht weiter, ohne dass Sie es ausdrücklich wollen.</li>
        <li>Wir erfinden keine Zahlen. Jede Zahl im Bericht hat eine Quelle.</li>
      </ul>

      <p className="erklaerung">
        Anbieter: {BRAND.anbieter}. Fragen dazu: <KontaktAdresse adresse={BRAND.kontaktEmail} />
      </p>
      <p>
        <Link href="/rechner" className="knopf haupt">
          Jetzt rechnen – kostenlos
        </Link>
      </p>
    </div>
  );
}
