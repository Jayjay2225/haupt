import Link from 'next/link';
import { VARIANTE } from '@/config/variante';

/**
 * Pflicht-Kasten „So verdienen wir“ (Prompt 8, Aufgabe 2): Kurzfassung auf
 * Start- und Ergebnis-Seite, weil Rechner und Ankauf unter einer Marke laufen.
 */
export function TransparenzKasten({ kompakt }: { kompakt?: boolean | undefined }) {
  if (!VARIANTE.transparenzKasten) {
    return null;
  }
  return (
    <aside className="transparenz" aria-labelledby="transparenz-titel">
      {kompakt === true ? <h3 id="transparenz-titel">So verdienen wir alle</h3> : <h2 id="transparenz-titel">So verdienen wir alle</h2>}
      <ul>
        <li>Sie: Auszahlung über unseren Abwicklungspartner, dazu alles, was die Durchsetzung zusätzlich bringt.</li>
        <li>Wir: der Bericht und eine Vergütung vom Abwicklungspartner – nichts von Ihrem Erlös.</li>
        <li>Und die Ampel zeigt Rot, wenn Rot dran ist. Auch das ist Teil des Geschäfts.</li>
      </ul>
      <p style={{ margin: '0.75rem 0 0' }}>
        <Link href="/so-verdienen-wir">Alles dazu in Klartext</Link>
      </p>
    </aside>
  );
}
