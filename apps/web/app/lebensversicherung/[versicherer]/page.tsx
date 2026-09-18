import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  alleVersicherer,
  branchenNettoReihe,
  insurersDaten,
  versichererNachId,
} from '@/lib/insurers-data';

interface Params {
  versicherer: string;
}

export function generateStaticParams(): Params[] {
  return alleVersicherer().map((v) => ({ versicherer: v.id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { versicherer } = await params;
  const eintrag = versichererNachId(versicherer);
  return { title: eintrag ? `${eintrag.kanonischerName} – Rückabwicklung prüfen` : 'Versicherer' };
}

/** Liniendiagramm der Branchen-Nettoverzinsung; Lücken werden nicht überbrückt. */
function NettoverzinsungsChart() {
  const punkte = branchenNettoReihe();
  if (punkte.length === 0) {
    return null;
  }
  const breite = 640;
  const hoehe = 220;
  const links = 34;
  const unten = 24;
  const oben = 10;
  const maxWert = 8;
  const minJahr = punkte[0]!.jahr;
  const maxJahr = punkte[punkte.length - 1]!.jahr;
  const x = (jahr: number) => links + ((jahr - minJahr) / (maxJahr - minJahr)) * (breite - links - 8);
  const y = (wert: number) => oben + (1 - wert / maxWert) * (hoehe - oben - unten);

  // Zusammenhängende Jahres-Läufe (Lücken 1996–1998 nicht verbinden).
  const laeufe: { jahr: number; wert: number }[][] = [];
  for (const punkt of punkte) {
    const letzter = laeufe[laeufe.length - 1];
    if (letzter !== undefined && letzter[letzter.length - 1]!.jahr === punkt.jahr - 1) {
      letzter.push(punkt);
    } else {
      laeufe.push([punkt]);
    }
  }
  const pfade = laeufe
    .filter((lauf) => lauf.length > 1)
    .map(
      (lauf) =>
        `<polyline fill="none" stroke="#2a78d6" stroke-width="2" points="${lauf
          .map((p) => `${x(p.jahr).toFixed(1)},${y(p.wert).toFixed(1)}`)
          .join(' ')}" />`,
    )
    .join('');
  const einzelpunkte = laeufe
    .filter((lauf) => lauf.length === 1)
    .map((lauf) => `<circle cx="${x(lauf[0]!.jahr).toFixed(1)}" cy="${y(lauf[0]!.wert).toFixed(1)}" r="4" fill="#2a78d6" />`)
    .join('');
  const gitter = [0, 2, 4, 6, 8]
    .map(
      (wert) =>
        `<line x1="${links}" y1="${y(wert).toFixed(1)}" x2="${breite - 8}" y2="${y(wert).toFixed(1)}" stroke="#d7dfe4" stroke-width="1" />` +
        `<text x="${links - 6}" y="${(y(wert) + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="#4a5a66">${wert}</text>`,
    )
    .join('');
  const jahresmarken = punkte
    .filter((p) => p.jahr % 5 === 0)
    .map((p) => `<text x="${x(p.jahr).toFixed(1)}" y="${hoehe - 6}" text-anchor="middle" font-size="11" fill="#4a5a66">${p.jahr}</text>`)
    .join('');
  const letzter = punkte[punkte.length - 1]!;
  const endLabel = `<text x="${(x(letzter.jahr) - 4).toFixed(1)}" y="${(y(letzter.wert) - 8).toFixed(1)}" text-anchor="end" font-size="12" font-weight="600" fill="#16232e">${letzter.wert.toLocaleString('de-DE')} % (${letzter.jahr})</text>`;

  return (
    <figure style={{ margin: '1.5rem 0' }}>
      <svg
        viewBox={`0 0 ${breite} ${hoehe}`}
        width="100%"
        role="img"
        aria-label={`Nettoverzinsung der Kapitalanlagen deutscher Lebensversicherer (Branchendurchschnitt) von ${minJahr} bis ${maxJahr}, in Prozent`}
        dangerouslySetInnerHTML={{ __html: gitter + pfade + einzelpunkte + jahresmarken + endLabel }}
      />
      <figcaption className="erklaerung">
        Nettoverzinsung der Kapitalanlagen, Branchendurchschnitt in % (Quelle: GDV, „Die deutsche
        Lebensversicherung in Zahlen 2025“, S. 28; Lücken 1996–1998 sind nicht verbunden).
      </figcaption>
    </figure>
  );
}

export default async function VersichererSeite({ params }: { params: Promise<Params> }) {
  const { versicherer } = await params;
  const eintrag = versichererNachId(versicherer);
  if (eintrag === undefined) {
    notFound();
  }
  const reihe = branchenNettoReihe();
  const hatEigeneWerte = Object.keys(eintrag.kennzahlen).length > 0;

  return (
    <div className="container schmal abschnitt">
      <h1>{eintrag.kanonischerName}</h1>
      {eintrag.altnamen.length > 0 && (
        <p>
          Frühere bzw. auf alten Policen übliche Namen: <strong>{eintrag.altnamen.join(', ')}</strong>. Für die
          Berechnung wird der Vertrag der Gesellschaft zugeordnet, deren Kapitalanlageergebnis im jeweiligen
          Jahr maßgeblich ist.
        </p>
      )}
      {(eintrag.rechtsnachfolge ?? []).length > 0 && (
        <>
          <h2>Namens- und Bestandshistorie</h2>
          <ul className="punkteliste">
            {(eintrag.rechtsnachfolge ?? []).map((r) => (
              <li key={r.beschreibung}>
                {r.beschreibung}{' '}
                <span className="erklaerung">(Angabe wird registerfest verifiziert)</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <h2>Kennzahlen für die Berechnung</h2>
      {!hatEigeneWerte && (
        <div className="hinweis neutral">
          <p>
            Die unternehmensindividuellen Kennzahlen (Nettoverzinsung, Kostenquoten je Jahr) werden derzeit
            aus Geschäftsberichten und der BaFin-Statistik beschafft. Bis dahin rechnet unsere Schätzung mit
            dem <strong>Branchendurchschnitt</strong> und kennzeichnet das im Ergebnis als Annahme.
          </p>
        </div>
      )}
      <NettoverzinsungsChart />
      <details>
        <summary>Werte als Tabelle</summary>
        <table className="zusammenfassung" style={{ maxWidth: '24rem' }}>
          <caption className="sr-nur">Branchendurchschnitt Nettoverzinsung je Jahr</caption>
          <thead>
            <tr>
              <th scope="col">Jahr</th>
              <th scope="col">Nettoverzinsung</th>
            </tr>
          </thead>
          <tbody>
            {reihe.map((p) => (
              <tr key={p.jahr}>
                <th scope="row">{p.jahr}</th>
                <td>{p.wert.toLocaleString('de-DE')} %</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
      <p className="erklaerung">
        Datenstand: insurers-Datenbank {insurersDaten.data.version} ({insurersDaten.data.stand}); jede Zahl
        mit Quelle und Abrufdatum in <code>data/insurers.json</code>.
      </p>

      <h2>Vertrag bei dieser Gesellschaft?</h2>
      <p>
        Wenn Ihr Vertrag zwischen dem 29.07.1994 und dem 31.12.2007 geschlossen wurde, prüfen Sie in wenigen
        Schritten, ob eine Rückabwicklung für Sie interessant sein könnte – kostenlos und unverbindlich.
      </p>
      <p>
        <Link href="/rechner" className="knopf">
          Jetzt kostenlos prüfen
        </Link>
      </p>
    </div>
  );
}
