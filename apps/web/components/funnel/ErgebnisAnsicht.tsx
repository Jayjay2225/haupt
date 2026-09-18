'use client';

/**
 * Ergebnis-Seite (Geschäftsmodell B, kostenlose Vorschau): zeigt Ampel des
 * Eignungs-Checks und die Szenario-Spanne aus der serverseitigen Berechnung
 * (/api/vorschau). Alle Werte sind als Schätzung gekennzeichnet; Zahlen
 * erscheinen nur mit Herkunft aus data/insurers.json (Prinzip 1).
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { CalcResult } from '@rueckab/calc';
import type { EligibilityResult } from '@rueckab/eligibility';
import { ladeDraft, leererDraft, loescheDraft, type CaseDraft } from '@/lib/draft';
import { formatEuro } from '@/lib/format';
import { ZusammenfassungAnsicht } from './Zusammenfassung';

interface Vorschau {
  eligibility: EligibilityResult;
  calc: CalcResult;
  zusatzAnnahmen: string[];
}

const AMPEL_ANZEIGE: Record<EligibilityResult['ampel'], { label: string; klasse: string }> = {
  gruen: { label: 'Grün – Merkmale sprechen für eine vertiefte Prüfung', klasse: 'ampel-gruen' },
  gelb: { label: 'Gelb – offene Punkte, Unterlagen erforderlich', klasse: 'ampel-gelb' },
  rot: { label: 'Rot – kein geeigneter Fall erkennbar', klasse: 'ampel-rot' },
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
            setFehler(daten.fehler ?? 'Die Vorschau konnte nicht berechnet werden.');
          } else {
            setVorschau(daten);
          }
        })
        .catch(() => setFehler('Der Server ist gerade nicht erreichbar. Ihre Angaben bleiben lokal gespeichert – versuchen Sie es später erneut.'))
        .finally(() => setLaedt(false));
    }
  }, []);

  if (!geladen) {
    return <p>Die Seite wird geladen …</p>;
  }

  if (draft.eingereichtAm === '') {
    return (
      <>
        <h1>Noch keine Angaben abgesendet</h1>
        <p>
          Auf diesem Gerät liegen keine abgesendeten Angaben vor. Starten Sie mit der
          Erfassung – Ihre Eingaben werden dabei automatisch zwischengespeichert.
        </p>
        <p>
          <Link href="/rechner" className="knopf">
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
      <h1>Ihre kostenlose Ersteinschätzung</h1>

      {laedt && <p>Die Vorschau wird berechnet …</p>}
      {fehler !== null && <div className="hinweis"><p>{fehler}</p></div>}

      {vorschau !== null && (
        <>
          <p className={`ampel-chip ${AMPEL_ANZEIGE[vorschau.eligibility.ampel].klasse}`}>
            Eignungs-Check: {AMPEL_ANZEIGE[vorschau.eligibility.ampel].label}
          </p>
          <ul className="punkteliste">
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

          {vorschau.calc.regime === 'alt-policenmodell' && (
            <section aria-labelledby="werte-titel">
              <h2 id="werte-titel">Geschätzter Rückabwicklungswert</h2>
              <div className="wert-karte">
                <p className="erklaerung" style={{ margin: 0 }}>Basis-Szenario (geschätzt)</p>
                <p className="wert-zahl">{formatEuro(vorschau.calc.szenarien.basis.rueckabwicklungswert)}</p>
                <p className="erklaerung">
                  Spanne Min–Max: {formatEuro(vorschau.calc.szenarien.min.rueckabwicklungswert)} bis{' '}
                  {formatEuro(vorschau.calc.szenarien.max.rueckabwicklungswert)}
                </p>
                {vorschau.calc.szenarien.basis.mehrwertGegenKuendigung !== undefined && (
                  <p>
                    {vorschau.calc.szenarien.basis.wirtschaftlichKeinVorteil === true ? (
                      <strong>
                        Gegenüber dem angegebenen Rückkaufswert ist nach dieser Schätzung wirtschaftlich
                        kein Vorteil erkennbar ({formatEuro(vorschau.calc.szenarien.basis.mehrwertGegenKuendigung)}).
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
          )}

          {vorschau.calc.regime === 'neu-2008' && (
            <div className="hinweis">
              <p>{vorschau.calc.hinweis}</p>
              {vorschau.calc.vergleich.rueckkaufswert !== undefined && (
                <p>
                  Zum Vergleich – angegebener Rückkaufswert: {formatEuro(vorschau.calc.vergleich.rueckkaufswert)};
                  Prämien des ersten Jahres: {formatEuro(vorschau.calc.vergleich.praemienErstesJahr)}.
                </p>
              )}
            </div>
          )}

          {vorschau.calc.regime === 'vor-1994' && (
            <div className="hinweis">
              <p>{vorschau.calc.hinweis}</p>
            </div>
          )}

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

          <div className="hinweis">
            <p>
              <strong>Einordnung:</strong> Diese Ersteinschätzung ist eine Schätzung unter offengelegten
              Annahmen und keine Rechtsberatung im Einzelfall. Nächster Schritt ist die anwaltliche Prüfung
              Ihrer Originalunterlagen; der ausführliche schriftliche Bericht mit Jahrestabelle und Quellen
              je Kennzahl ist in Vorbereitung.
            </p>
          </div>
        </>
      )}

      <h2>Ihre Angaben im Überblick</h2>
      <ZusammenfassungAnsicht draft={draft} />

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
