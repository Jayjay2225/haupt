'use client';

/**
 * Ergebnis-Seite – seit Prompt 14 NUR noch für die Kanzlei-Variante
 * (Modell C: Eignungs-Check mit Regel-IDs, Szenario-Beträge). Das
 * Verbraucherprodukt hat keine Ergebnis-Seite mehr: Die Ampel lebt auf der
 * Startseite, der Funnel endet in der Bestellung (Prompt 14, 0.1).
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { CalcResult } from '@rueckab/calc';
import type { EligibilityResult } from '@rueckab/eligibility';
import { Ampel } from '@/components/Ampel';
import { ladeDraft, leererDraft, loescheDraft, type CaseDraft } from '@/lib/draft';
import { formatEuro } from '@/lib/format';
import { ZusammenfassungAnsicht } from './Zusammenfassung';

interface VorschauKanzlei {
  variante: 'kanzlei';
  eligibility: EligibilityResult;
  calc: CalcResult;
  zusatzAnnahmen: string[];
}

interface VorschauAnfrage {
  variante: 'anfrage';
  grund: string;
  text: string;
}

type Vorschau = VorschauKanzlei | VorschauAnfrage | { variante: 'privat' };

/** Typische Einwände des Versicherers – vollständig, eingeklappt (unverändert). */
const GEGENPOSITION =
  'Der Versicherer wird sagen: Zinsen nur aus den eigenen Zahlen, nicht aus dem Branchenschnitt; die Nettoverzinsung enthalte Einmaleffekte; Schutz- und Kostenanteile seien höher. Genau deshalb rechnen wir mit einer Spanne statt mit einer einzigen Zahl – und legen im Gutachten jede Quelle offen.';

const AMPEL_KANZLEI: Record<EligibilityResult['ampel'], string> = {
  gruen: 'Grün – Merkmale sprechen für eine vertiefte Prüfung',
  gelb: 'Gelb – offene Punkte, Unterlagen erforderlich',
  rot: 'Rot – kein geeigneter Fall erkennbar',
};

export function ErgebnisAnsicht() {
  const [draft, setDraft] = useState<CaseDraft>(leererDraft);
  const [geladen, setGeladen] = useState(false);
  const [vorschau, setVorschau] = useState<Vorschau | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);

  useEffect(() => {
    const d = ladeDraft();
    setDraft(d);
    setGeladen(true);
    if (d.eingereichtAm !== '') {
      setLaedt(true);
      fetch('/api/vorschau', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(d),
      })
        .then(async (antwort) => {
          const daten = (await antwort.json()) as Vorschau & { fehler?: string };
          if (!antwort.ok || daten.fehler !== undefined) {
            setFehler(daten.fehler ?? 'Wir konnten gerade nicht rechnen.');
          } else {
            setVorschau(daten);
          }
        })
        .catch(() =>
          setFehler('Der Server ist gerade nicht erreichbar. Ihre Angaben bleiben auf diesem Gerät – bitte später noch einmal versuchen.'),
        )
        .finally(() => setLaedt(false));
    }
  }, []);

  if (!geladen) {
    return <p>Die Seite lädt …</p>;
  }

  if (draft.eingereichtAm === '') {
    return (
      <>
        <h1>Noch nichts gerechnet.</h1>
        <p>Auf diesem Gerät liegen keine abgeschickten Angaben.</p>
        <p>
          <Link href="/rechner" className="knopf haupt">
            Zum Rechner
          </Link>
        </p>
      </>
    );
  }

  function allesLoeschen() {
    loescheDraft();
    setDraft(leererDraft());
    setVorschau(null);
  }

  return (
    <>
      {laedt && <p>Wir rechnen …</p>}
      {fehler !== null && (
        <div className="hinweis">
          <p>{fehler}</p>
        </div>
      )}

      {vorschau?.variante === 'anfrage' && (
        <>
          <h1>Diesen Vertrag prüfen wir persönlich.</h1>
          <p style={{ fontSize: '1.15rem' }}>{vorschau.text}</p>
          <p>
            <Link href="/anfrage" className="knopf haupt">
              Anfrage senden
            </Link>
          </p>
        </>
      )}

      {vorschau?.variante === 'kanzlei' && (
        <>
          <Ampel zustand={vorschau.eligibility.ampel} gross beschriftung={AMPEL_KANZLEI[vorschau.eligibility.ampel]} />
          <ul className="punkteliste" style={{ marginTop: '1rem' }}>
            {vorschau.eligibility.begruendungen.map((b) => (
              <li key={b.text}>
                {b.text} <span className="erklaerung">[{b.regelIds.join(', ')}]</span>
              </li>
            ))}
          </ul>
          {vorschau.eligibility.benoetigteDokumente.length > 0 && (
            <div className="hinweis neutral">
              <p>
                <strong>Für eine belastbarere Einordnung benötigt:</strong>{' '}
                {vorschau.eligibility.benoetigteDokumente.join('; ')}
              </p>
            </div>
          )}

          <section aria-labelledby="werte-titel">
            <h2 id="werte-titel">Geschätzter Rückabwicklungswert</h2>
            <div className="karte">
              <p className="erklaerung" style={{ margin: 0 }}>
                Basis-Szenario (geschätzt)
              </p>
              <p className="wert-zahl">{formatEuro(vorschau.calc.szenarien.basis.rueckabwicklungswert)}</p>
              <p className="erklaerung">
                Spanne Min–Max: {formatEuro(vorschau.calc.szenarien.min.rueckabwicklungswert)} bis{' '}
                {formatEuro(vorschau.calc.szenarien.max.rueckabwicklungswert)}
              </p>
              {vorschau.calc.szenarien.basis.mehrwertGegenKuendigung !== undefined && (
                <p>
                  {vorschau.calc.szenarien.basis.wirtschaftlichKeinVorteil === true ? (
                    <strong>
                      Gegenüber dem angegebenen Rückkaufswert ist nach dieser Schätzung wirtschaftlich kein
                      Vorteil erkennbar ({formatEuro(vorschau.calc.szenarien.basis.mehrwertGegenKuendigung)}).
                    </strong>
                  ) : (
                    <>
                      Geschätzter Mehrwert gegenüber dem angegebenen Rückkaufswert (Basis-Szenario):{' '}
                      <strong>{formatEuro(vorschau.calc.szenarien.basis.mehrwertGegenKuendigung)}</strong> – unter
                      den unten genannten Annahmen.
                    </>
                  )}
                </p>
              )}
            </div>
            <div className="hinweis neutral">
              <p>
                <strong>Gegenposition des Versicherers (typische Einwände):</strong> {GEGENPOSITION}
              </p>
            </div>
            <details>
              <summary>Annahmen und Datenherkunft dieser Schätzung</summary>
              <ul className="punkteliste" style={{ marginTop: '0.75rem' }}>
                {[...vorschau.zusatzAnnahmen, ...vorschau.calc.annahmen.map((a) => a.text)].map((text) => (
                  <li key={text}>{text}</li>
                ))}
                {vorschau.calc.warnungen.map((w) => (
                  <li key={w.text}>
                    <strong>Warnung:</strong> {w.text}
                  </li>
                ))}
              </ul>
              <p className="erklaerung">
                Datenstand: Rechenkern {vorschau.calc.meta.calcVersion}, Datenbank {vorschau.calc.meta.dataVersion},
                Regelwerk {vorschau.eligibility.meta.rulesVersion}.
              </p>
            </details>
          </section>

          {vorschau.eligibility.hinweise.length > 0 && (
            <details>
              <summary>Weitere Hinweise</summary>
              <ul className="punkteliste" style={{ marginTop: '0.75rem' }}>
                {vorschau.eligibility.hinweise.map((h) => (
                  <li key={h.text}>{h.text}</li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}

      <h2>Ihre Angaben im Überblick</h2>
      <ZusammenfassungAnsicht draft={draft} mitPerson={false} />

      <div className="formular-aktionen">
        <Link href="/rechner" className="knopf zweitrangig">
          Angaben ändern
        </Link>
        <button type="button" className="knopf zweitrangig" onClick={allesLoeschen}>
          Alle Angaben auf diesem Gerät löschen
        </button>
      </div>
    </>
  );
}
