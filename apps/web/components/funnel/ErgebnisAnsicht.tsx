'use client';

/**
 * Ergebnis-Seite. Verbraucherprodukt (privat): wirtschaftliche Ampel in
 * Worten ohne Euro-Beträge, Bericht-Angebot, Weg-zum-Geld-Block mit eigener
 * Einwilligung, Unterlagen-Checkliste; Annahmen/Gegenposition eingeklappt.
 * Kanzlei-Variante: Eignungs-Check mit Regel-IDs und Szenario-Beträge.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { CalcResult } from '@rueckab/calc';
import type { EligibilityResult } from '@rueckab/eligibility';
import { BERICHT_PREIS_BRUTTO_EUR, BERICHT_PREIS_HINWEIS, BERICHT_PREIS_REGULAER_EUR } from '@/config/business';
import { VARIANTE } from '@/config/variante';
import { Ampel } from '@/components/Ampel';
import type { WirtschaftlicheAmpel } from '@/lib/ampel';
import { ladeDraft, leererDraft, loescheDraft, speichereDraft, type CaseDraft } from '@/lib/draft';
import { formatEuro } from '@/lib/format';
import { UNTERLAGEN_FELDER, UNTERLAGEN_LABEL } from '@/lib/labels';
import { ZusammenfassungAnsicht } from './Zusammenfassung';

interface VorschauKanzlei {
  variante: 'kanzlei';
  eligibility: EligibilityResult;
  calc: CalcResult;
  zusatzAnnahmen: string[];
}

interface VorschauPrivat {
  variante: 'privat';
  ampel: WirtschaftlicheAmpel;
  regime: CalcResult['regime'];
  hinweise: string[];
  annahmen: string[];
  warnungen: string[];
  meta: { calcVersion: string; dataVersion: string; rulesVersion: string };
}

type Vorschau = VorschauKanzlei | VorschauPrivat;

/** Typische Einwände des Versicherers – in der Kanzlei-Variante sichtbar, im Verbraucherprodukt im Bericht. */
const GEGENPOSITION =
  'Der Versicherer wird sagen: Zinsen nur aus den eigenen Zahlen, nicht aus dem Branchenschnitt; die Nettoverzinsung enthalte Einmaleffekte; Schutz- und Kostenanteile seien höher. Genau deshalb rechnen wir mit einer Spanne statt mit einer einzigen Zahl.';

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
        <p>Auf diesem Gerät liegen keine abgeschickten Angaben. Fünf Minuten, dann steht die Ampel.</p>
        <p>
          <Link href="/rechner" className="knopf haupt">
            Jetzt rechnen – kostenlos
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

  function ankaufEinwilligung(angehakt: boolean) {
    const neu = { ...draft, einwilligungAnkaufKontakt: angehakt };
    setDraft(neu);
    speichereDraft(neu);
  }

  const fehlendeUnterlagen = UNTERLAGEN_FELDER.filter((feld) => !draft[feld]);

  return (
    <>
      <h1>{vorschau?.variante === 'privat' ? 'Ihre Ampel.' : 'Ihre Ersteinschätzung.'}</h1>

      {laedt && <p>Wir rechnen …</p>}
      {fehler !== null && (
        <div className="hinweis">
          <p>{fehler}</p>
        </div>
      )}

      {vorschau?.variante === 'privat' && (
        <>
          <Ampel zustand={vorschau.ampel.ampel} gross beschriftung={vorschau.ampel.titel} />
          <p style={{ marginTop: '1rem', fontSize: '1.25rem' }}>{vorschau.ampel.text}</p>
          {VARIANTE.berichtKostenpflichtig && vorschau.regime === 'alt-policenmodell' && vorschau.ampel.ampel !== 'rot' && (
            <section aria-labelledby="bericht-titel" className="wert-karte">
              <h2 id="bericht-titel" style={{ fontSize: '1.4rem' }}>
                Wollen Sie wissen, was für Sie drin ist?
              </h2>
              <p>
                Der Bericht nennt die Zahlen, Jahr für Jahr, jede mit Quelle. Einführungspreis:{' '}
                <strong>
                  nur {BERICHT_PREIS_BRUTTO_EUR} € statt <s>{BERICHT_PREIS_REGULAER_EUR} €</s>
                </strong>{' '}
                {BERICHT_PREIS_HINWEIS}, einmalig.{' '}
                {vorschau.ampel.ampel === 'gruen'
                  ? 'Es lohnt sich – unsere Partner übernehmen den Rest.'
                  : 'Und wenn es sich lohnt, übernehmen unsere Partner den Rest.'}
              </p>
              <p style={{ margin: 0, display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                <Link href="/bestellen" className="knopf haupt">
                  Bericht bestellen
                </Link>
                <Link href="/bericht" className="knopf">
                  Was im Bericht steht
                </Link>
              </p>
            </section>
          )}
          {VARIANTE.berichtKostenpflichtig && vorschau.regime === 'alt-policenmodell' && vorschau.ampel.ampel === 'rot' && (
            <p className="erklaerung">
              Bei Rot brauchen Sie den Bericht in der Regel nicht. Wer ihn trotzdem will, findet ihn{' '}
              <Link href="/bericht">hier</Link>.
            </p>
          )}

          {VARIANTE.berichtKostenpflichtig && vorschau.regime !== 'alt-policenmodell' && vorschau.ampel.ampel === 'gelb' && (
            <div className="hinweis neutral">
              <p>
                Für diesen Jahrgang rechnet unser Bericht noch nicht – die Prüfung läuft hier über
                die Belehrung und die Abrechnung Ihres Vertrags. Genau das übernehmen unsere Partner:
                siehe unten.
              </p>
            </div>
          )}

          <section aria-labelledby="checkliste-titel">
            <h2 id="checkliste-titel">Ihre Unterlagen</h2>
            <ul className="checkliste">
              {UNTERLAGEN_FELDER.map((feld) => (
                <li key={feld}>
                  <span className="status">{draft[feld] ? 'vorhanden' : 'fehlt noch'}</span>
                  <span>{UNTERLAGEN_LABEL[feld]}</span>
                </li>
              ))}
            </ul>
            {fehlendeUnterlagen.length > 0 && (
              <div className="hinweis neutral">
                <p>
                  <strong>So besorgen Sie Fehlendes:</strong> Schreiben Sie dem Versicherer kurz: „Bitte
                  schicken Sie mir eine Zweitschrift von Police, Begleitschreiben und
                  Versicherungsbedingungen zu Vertrag Nummer …“. Das muss er liefern. Bewahren Sie die
                  Antwort mit Datum auf.
                </p>
              </div>
            )}
          </section>

          {VARIANTE.ankaufHinweis && (
            <section aria-labelledby="ankauf-titel" className="hinweis">
              <h2 id="ankauf-titel" style={{ fontSize: '1.4rem' }}>
                Und danach? Das Rund-um-Sorglos-Paket.
              </h2>
              <ol className="punkteliste">
                <li>
                  Sie verkaufen Ihre Police und erhalten innerhalb von 18 Werktagen den vereinbarten
                  anteiligen Rückkaufswert – ausgezahlt über unseren Abwicklungspartner.
                </li>
                <li>
                  Je nach Vertrag können Sie zusätzlich eine Steuererstattung beantragen – auch dabei
                  unterstützen Sie unsere Partner.
                </li>
                <li>
                  Unsere Partnerkanzleien setzen die Rückabwicklung durch. Jeglicher Mehrerlös bleibt
                  bei Ihnen – ohne Abzüge.
                </li>
              </ol>
              <p>
                Wir verdienen am Bericht und erhalten vom Abwicklungspartner eine Vergütung – nicht
                von Ihrem Erlös. Wir geben nichts weiter, ohne Ihr Ja hier.{' '}
                <Link href="/verkaufen">Die Wege im Vergleich – und was Sie jeweils aufgeben</Link>
              </p>
              <div className="feld">
                <div className="optionen">
                  <label>
                    <input
                      type="checkbox"
                      checked={draft.einwilligungAnkaufKontakt}
                      onChange={(ereignis) => ankaufEinwilligung(ereignis.target.checked)}
                    />
                    <span>
                      Ja, ich möchte ein Angebot für den Verkauf meiner Police. Dafür dürfen meine
                      Vertragsangaben an den Organisationspartner gehen. (freiwillig, jederzeit
                      widerrufbar)
                    </span>
                  </label>
                </div>
              </div>
              {draft.einwilligungAnkaufKontakt && (
                <p className="erklaerung" style={{ margin: 0 }}>
                  Vermerkt. Die Weitergabe schalten wir frei, sobald die Konditionen des Ankaufs
                  feststehen – bis dahin bleibt Ihr Ja auf diesem Gerät.
                </p>
              )}
            </section>
          )}

          <details>
            <summary>Wie wir rechnen: Annahmen, Datenherkunft, Gegenposition*</summary>
            <p className="erklaerung" style={{ marginTop: '0.75rem' }}>
              * Alle Annahmen, die vollständige Datenherkunft und die Gegenposition des Versicherers
              stehen im Bericht. Die Grundlagen unserer Rechnung finden Sie in den{' '}
              <Link href="/agb#rechenweg">AGB („So rechnen wir“)</Link>, den Umgang mit Ihren Daten in
              der <Link href="/datenschutz">Datenschutzerklärung</Link>.
            </p>
            <p className="erklaerung">
              Rechenkern {vorschau.meta.calcVersion}, Datenbank {vorschau.meta.dataVersion}, Regelwerk{' '}
              {vorschau.meta.rulesVersion}.
            </p>
          </details>

          <div className="hinweis neutral">
            <p>
              Diese Ampel ist eine Schätzung unter offengelegten Annahmen, keine Rechtsberatung. Ob ein
              Widerspruch wirksam ist, prüft am Ende eine Anwältin oder ein Anwalt mit Ihren
              Originalunterlagen – auf Wunsch organisieren unsere Partner das für Sie.
            </p>
          </div>
        </>
      )}

      {vorschau?.variante === 'kanzlei' && (
        <>
          <Ampel zustand={vorschau.eligibility.ampel} gross beschriftung={`Eignungs-Check: ${AMPEL_KANZLEI[vorschau.eligibility.ampel]}`} />
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

          {vorschau.calc.regime === 'alt-policenmodell' && (
            <section aria-labelledby="werte-titel">
              <h2 id="werte-titel">Geschätzter Rückabwicklungswert</h2>
              <div className="wert-karte">
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
          )}

          {vorschau.calc.regime === 'neu-2008' && (
            <div className="hinweis">
              <p>{vorschau.calc.hinweis}</p>
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
