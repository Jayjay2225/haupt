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
      {kompakt === true ? <h3 id="transparenz-titel">So verdienen wir</h3> : <h2 id="transparenz-titel">So verdienen wir</h2>}
      <ul>
        <li>Am Prüfbericht.</li>
        <li>Und wenn Sie über uns verkaufen.</li>
        <li>Nicht daran, ob Sie klagen. Deshalb sagen wir Ihnen auch, wenn es sich nicht lohnt.</li>
      </ul>
      <p style={{ margin: '0.75rem 0 0' }}>
        <Link href="/so-verdienen-wir">Alles dazu in Klartext</Link>
      </p>
    </aside>
  );
}
