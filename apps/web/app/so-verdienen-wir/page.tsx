import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BRAND } from '@/config/brand';
import { BERICHT_PREIS_BRUTTO_EUR, BERICHT_PREIS_HINWEIS } from '@/config/business';
import { VARIANTE } from '@/config/variante';

export const metadata: Metadata = {
  title: 'So verdienen wir',
};

export default function SoVerdienenWirSeite() {
  if (!VARIANTE.transparenzKasten) {
    notFound();
  }
  return (
    <div className="container schmal abschnitt">
      <h1>
        So verdienen wir<span className="hervor">.</span> In Klartext.
      </h1>
      <p className="untertitel">
        Rechner und Ankauf laufen unter einer Marke. Damit Sie wissen, woran wir Interesse haben –
        und woran nicht.
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

      <h2>Wir verdienen nichts daran, ob Sie klagen.</h2>
      <p>
        Wir bekommen kein Geld von Kanzleien, keine Erfolgsbeteiligung, keine Provision für
        vermittelte Mandate. Ob Sie einen Widerspruch prüfen lassen, ist allein Ihre Sache. Die
        Ampel zeigt Rot, wenn Rot dran ist.
      </p>

      <h2>Was wir nicht tun</h2>
      <ul className="punkteliste">
        <li>Wir empfehlen nicht, zu kündigen, zu verkaufen oder zu behalten. Wir legen die Wege nebeneinander.</li>
        <li>Wir beraten nicht rechtlich und nicht steuerlich.</li>
        <li>Wir geben Ihre Daten nicht weiter, ohne dass Sie es ausdrücklich wollen.</li>
        <li>Wir erfinden keine Zahlen. Jede Zahl im Bericht hat eine Quelle.</li>
      </ul>

      <p className="erklaerung">
        Anbieter: {BRAND.anbieter}. Fragen dazu: <a href={`mailto:${BRAND.kontaktEmail}`}>{BRAND.kontaktEmail}</a>
      </p>
      <p>
        <Link href="/rechner" className="knopf haupt">
          Jetzt rechnen – kostenlos
        </Link>
      </p>
    </div>
  );
}
