import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  alleVersicherer,
  branchenNettoReihe,
  insurersDaten,
  quellenDerUnternehmensreihe,
  unternehmensNettoReihe,
  versichererNachId,
} from '@/lib/insurers-data';

interface Params {
  versicherer: string;
}

interface Punkt {
  jahr: number;
  wert: number;
}

export function generateStaticParams(): Params[] {
  return alleVersicherer().map((v) => ({ versicherer: v.id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { versicherer } = await params;
  const eintrag = versichererNachId(versicherer);
  return { title: eintrag ? `${eintrag.kanonischerName} – Rückabwicklung prüfen` : 'Versicherer' };
}

const FARBE_UNTERNEHMEN = '#0A1F33';
const FARBE_BRANCHE = '#6B7A86';

/** „1999–2006, 2011–2024“ – zusammenhängende Jahresbereiche einer Reihe. */
function jahresbereiche(punkte: Punkt[]): string {
  return laeufe(punkte)
    .map((lauf) => (lauf.length === 1 ? String(lauf[0]!.jahr) : `${lauf[0]!.jahr}–${lauf[lauf.length - 1]!.jahr}`))
    .join(', ');
}

/** Zerlegt eine Jahresreihe in zusammenhängende Läufe (Lücken werden nicht verbunden). */
function laeufe(punkte: Punkt[]): Punkt[][] {
  const ergebnis: Punkt[][] = [];
  for (const punkt of punkte) {
    const letzter = ergebnis[ergebnis.length - 1];
    if (letzter !== undefined && letzter[letzter.length - 1]!.jahr === punkt.jahr - 1) {
      letzter.push(punkt);
    } else {
      ergebnis.push([punkt]);
    }
  }
  return ergebnis;
}

/**
 * Liniendiagramm der Nettoverzinsung: Branchendurchschnitt grau gestrichelt,
 * Unternehmenswerte (wo vorhanden) marineblau durchgezogen. Lücken bleiben Lücken.
 */
function NettoverzinsungsChart({
  branche,
  unternehmen,
  name,
  quellen,
}: {
  branche: Punkt[];
  unternehmen: Punkt[];
  name: string;
  quellen: string[];
}) {
  const alle = [...branche, ...unternehmen];
  if (alle.length === 0) {
    return null;
  }
  const breite = 640;
  const hoehe = 220;
  const links = 34;
  const unten = 24;
  const oben = 10;
  const minJahr = Math.min(...alle.map((p) => p.jahr));
  const maxJahr = Math.max(...alle.map((p) => p.jahr));
  const maxWert = Math.max(8, Math.ceil(Math.max(...alle.map((p) => p.wert)) / 2) * 2);
  const x = (jahr: number) => links + ((jahr - minJahr) / Math.max(1, maxJahr - minJahr)) * (breite - links - 8);
  const y = (wert: number) => oben + (1 - wert / maxWert) * (hoehe - oben - unten);
  const koordinaten = (lauf: Punkt[]) => lauf.map((p) => `${x(p.jahr).toFixed(1)},${y(p.wert).toFixed(1)}`).join(' ');

  const zeichneReihe = (punkte: Punkt[], farbe: string, gestrichelt: boolean) => {
    const teile = laeufe(punkte);
    const strich = gestrichelt ? ' stroke-dasharray="6 4"' : '';
    const linien = teile
      .filter((lauf) => lauf.length > 1)
      .map((lauf) => `<polyline fill="none" stroke="${farbe}" stroke-width="${gestrichelt ? 2 : 2.5}"${strich} points="${koordinaten(lauf)}" />`)
      .join('');
    const einzelne = teile
      .filter((lauf) => lauf.length === 1)
      .map((lauf) => `<circle cx="${x(lauf[0]!.jahr).toFixed(1)}" cy="${y(lauf[0]!.wert).toFixed(1)}" r="4" fill="${farbe}" />`)
      .join('');
    return linien + einzelne;
  };

  const gitterWerte: number[] = [];
  for (let w = 0; w <= maxWert; w += 2) {
    gitterWerte.push(w);
  }
  const gitter = gitterWerte
    .map(
      (wert) =>
        `<line x1="${links}" y1="${y(wert).toFixed(1)}" x2="${breite - 8}" y2="${y(wert).toFixed(1)}" stroke="#d7dfe4" stroke-width="1" />` +
        `<text x="${links - 6}" y="${(y(wert) + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="#4a5a66">${wert}</text>`,
    )
    .join('');
  const jahresmarken: string[] = [];
  for (let jahr = Math.ceil(minJahr / 5) * 5; jahr <= maxJahr; jahr += 5) {
    jahresmarken.push(
      `<text x="${x(jahr).toFixed(1)}" y="${hoehe - 6}" text-anchor="middle" font-size="11" fill="#4a5a66">${jahr}</text>`,
    );
  }
  const endReihe = unternehmen.length > 0 ? unternehmen : branche;
  const letzter = endReihe[endReihe.length - 1]!;
  const endLabel = `<text x="${(x(letzter.jahr) - 4).toFixed(1)}" y="${(y(letzter.wert) - 8).toFixed(1)}" text-anchor="end" font-size="12" font-weight="600" fill="#16232e">${letzter.wert.toLocaleString('de-DE')} % (${letzter.jahr})</text>`;

  const beschreibung =
    unternehmen.length > 0
      ? `Nettoverzinsung der Kapitalanlagen von ${name} (durchgezogen, ${unternehmen[0]!.jahr} bis ${unternehmen[unternehmen.length - 1]!.jahr}) und Branchendurchschnitt (gestrichelt, ${branche[0]?.jahr ?? minJahr} bis ${branche[branche.length - 1]?.jahr ?? maxJahr}), in Prozent`
      : `Nettoverzinsung der Kapitalanlagen deutscher Lebensversicherer (Branchendurchschnitt) von ${minJahr} bis ${maxJahr}, in Prozent`;

  return (
    <figure style={{ margin: '1.5rem 0' }}>
      <svg
        viewBox={`0 0 ${breite} ${hoehe}`}
        width="100%"
        role="img"
        aria-label={beschreibung}
        dangerouslySetInnerHTML={{
          __html: gitter + zeichneReihe(branche, FARBE_BRANCHE, true) + zeichneReihe(unternehmen, FARBE_UNTERNEHMEN, false) + jahresmarken.join('') + endLabel,
        }}
      />
      <figcaption className="erklaerung">
        <span style={{ display: 'inline-block', width: '1.6rem', borderTop: `3px dashed ${FARBE_BRANCHE}`, verticalAlign: 'middle', marginRight: '0.4rem' }} />
        Branchendurchschnitt (Quelle: GDV, „Die deutsche Lebensversicherung in Zahlen 2025“, S. 28; Lücken 1996–1998 nicht
        verbunden)
        {unternehmen.length > 0 && (
          <>
            <br />
            <span style={{ display: 'inline-block', width: '1.6rem', borderTop: `3px solid ${FARBE_UNTERNEHMEN}`, verticalAlign: 'middle', marginRight: '0.4rem' }} />
            {name} – eigene Werte ({quellen.length === 1 ? 'Quelle' : `${quellen.length} Quellen`}, siehe Hinweis und Tabelle)
          </>
        )}
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
  const branche = branchenNettoReihe();
  const unternehmen = unternehmensNettoReihe(eintrag.id);
  const quellen = quellenDerUnternehmensreihe(eintrag.id);
  const hatEigeneWerte = unternehmen.length > 0;
  const unternehmenNachJahr = new Map(unternehmen.map((p) => [p.jahr, p.wert]));
  const alleJahre = [...new Set([...branche.map((p) => p.jahr), ...unternehmen.map((p) => p.jahr)])].sort((a, b) => a - b);
  const brancheNachJahr = new Map(branche.map((p) => [p.jahr, p.wert]));
  const branchenjahre = alleJahre.filter((j) => !unternehmenNachJahr.has(j));

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
      {hatEigeneWerte ? (
        <div className="hinweis neutral">
          <p>
            Für die Jahre <strong>{jahresbereiche(unternehmen)}</strong> rechnen wir mit den eigenen Werten dieser
            Gesellschaft (Quellen: {quellen.join('; ')}). Für die übrigen Jahre (Branchenjahre, in der Tabelle
            markiert) gilt der <strong>Branchendurchschnitt</strong> – das steht so auch im Ergebnis.
          </p>
        </div>
      ) : (
        <div className="hinweis neutral">
          <p>
            Die eigenen Zahlen dieser Gesellschaft (Nettoverzinsung, Kosten je Jahr) holen wir gerade aus
            Geschäftsberichten und der Aufsichtsstatistik. Bis dahin rechnen wir mit dem{' '}
            <strong>Branchendurchschnitt</strong> und schreiben das ins Ergebnis.
          </p>
        </div>
      )}
      <NettoverzinsungsChart branche={branche} unternehmen={unternehmen} name={eintrag.kanonischerName} quellen={quellen} />
      <details>
        <summary>Werte als Tabelle</summary>
        <table className="zusammenfassung" style={{ maxWidth: hatEigeneWerte ? '32rem' : '24rem' }}>
          <caption className="sr-nur">Nettoverzinsung je Jahr: {hatEigeneWerte ? 'Unternehmen und Branche' : 'Branchendurchschnitt'}</caption>
          <thead>
            <tr>
              <th scope="col">Jahr</th>
              {hatEigeneWerte && <th scope="col">{eintrag.kanonischerName}</th>}
              <th scope="col">Branche</th>
            </tr>
          </thead>
          <tbody>
            {alleJahre.map((jahr) => {
              const u = unternehmenNachJahr.get(jahr);
              const b = brancheNachJahr.get(jahr);
              return (
                <tr key={jahr}>
                  <th scope="row">{jahr}</th>
                  {hatEigeneWerte && (
                    <td>{u !== undefined ? `${u.toLocaleString('de-DE')} %` : <span className="erklaerung">Branchenjahr</span>}</td>
                  )}
                  <td>{b !== undefined ? `${b.toLocaleString('de-DE')} %` : <span className="erklaerung">–</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {hatEigeneWerte && branchenjahre.length > 0 && (
          <p className="erklaerung">
            Branchenjahre für diese Gesellschaft: {branchenjahre.length} von {alleJahre.length} Jahren. Fehlende
            Unternehmenswerte werden aus Geschäftsberichten und Aufsichtsstatistik nachgetragen (Stand in{' '}
            <code>data/COVERAGE.md</code>).
          </p>
        )}
      </details>
      <p className="erklaerung">
        Datenstand: insurers-Datenbank {insurersDaten.data.version} ({insurersDaten.data.stand}); jede Zahl
        mit Quelle und Abrufdatum in <code>data/insurers.json</code>.
      </p>

      <h2>Police von dieser Gesellschaft?</h2>
      <p>
        Vertrag zwischen 1994 und 2007? Dann lohnt der Blick. Fünf Minuten, eine klare Ampel –
        kostenlos. Rot heißt Finger weg, das sagen wir Ihnen auch.
      </p>
      <p>
        <Link href="/rechner" className="knopf haupt">
          Jetzt rechnen – kostenlos
        </Link>
      </p>
    </div>
  );
}
