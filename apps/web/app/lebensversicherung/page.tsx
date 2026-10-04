import type { Metadata } from 'next';
import Link from 'next/link';
import { alleVersicherer } from '@/lib/insurers-data';

export const metadata: Metadata = {
  title: 'Lebensversicherer im Überblick',
};

export default function VersichererIndex() {
  const versicherer = alleVersicherer();
  return (
    <div className="container abschnitt">
      <h1>Lebensversicherer im Überblick</h1>
      <p className="schmal">
        Auf alten Policen steht oft ein Name, den es so nicht mehr gibt. Wir ordnen ihn der
        Gesellschaft zu, die heute die Zahlen liefert – denn gerechnet wird mit dem, was der
        Versicherer wirklich verdient hat. Die Zahlen bleiben streng: jede mit Quelle.
      </p>
      <ul className="kartenreihe">
        {versicherer.map((v) => (
          <li key={v.id} className="karte">
            <h2 style={{ fontSize: '1.05rem', border: 'none', margin: 0, padding: 0 }}>
              <Link href={`/lebensversicherung/${v.id}`}>{v.kanonischerName}</Link>
            </h2>
            {v.altnamen.length > 0 && (
              <p className="erklaerung" style={{ marginTop: '0.4rem' }}>
                früher u. a.: {v.altnamen.join(', ')}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
