'use client';

/**
 * Ergebnis-Seite (Prompt 12, Abschnitt 3.3). Verbraucherprodukt: die eine
 * wirtschaftliche Ampel, über dem Knopf höchstens 40 Wörter, keine
 * Euro-Beträge; darunter vier aufklappbare Zeilen, Verkaufen-Karte mit
 * eigener Einwilligung und die Karte „Lieber persönlich?“.
 * Kanzlei-Variante: Eignungs-Check mit Regel-IDs und Szenario-Beträge.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { CalcResult } from '@rueckab/calc';
import type { EligibilityResult } from '@rueckab/eligibility';
import { BERICHT_PREIS_BRUTTO_EUR } from '@/config/business';
import { BRAND } from '@/config/brand';
import { VARIANTE } from '@/config/variante';
import { Ampel } from '@/components/Ampel';
import type { WirtschaftlicheAmpel } from '@/lib/ampel';
import { ladeDraft, leererDraft, loescheDraft, speichereDraft, type CaseDraft } from '@/lib/draft';
import { formatEuro } from '@/lib/format';
import { UNTERLAGEN_LISTE } from '@/lib/labels';
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
  rechtswegSatz: string;
  warum: string[];
  annahmen: string[];
  warnungen: string[];
  meta: { calcVersion: string; dataVersion: string };
}

interface VorschauAnfrage {
  variante: 'anfrage';
  grund: string;
  text: string;
}

type Vorschau = VorschauKanzlei | VorschauPrivat | VorschauAnfrage;

/** Typische Einwände des Versicherers – vollständig, eingeklappt. */
const GEGENPOSITION =
  'Der Versicherer wird sagen: Zinsen nur aus den eigenen Zahlen, nicht aus dem Branchenschnitt; die Nettoverzinsung enthalte Einmaleffekte; Schutz- und Kostenanteile seien höher. Genau deshalb rechnen wir mit einer Spanne statt mit einer einzigen Zahl – und legen im Bericht jede Quelle offen.';

const AMPEL_WORT: Record<WirtschaftlicheAmpel['ampel'], string> = {
  gruen: 'Grün',
  gelb: 'Gelb',
  rot: 'Rot',
};

const AMPEL_KANZLEI: Record<EligibilityResult['ampel'], string> = {
  gruen: 'Grün – Merkmale sprechen für eine vertiefte Prüfung',
  gelb: 'Gelb – offene Punkte, Unterlagen erforderlich',
  rot: 'Rot – kein geeigneter Fall erkennbar',
};

function VerkaufenKarte({
  einwilligung,
  onEinwilligung,
}: {
  einwilligung: boolean;
  onEinwilligung: (angehakt: boolean) => void;
}) {
  return (
    <section aria-labelledby="verkaufen-titel" className="karte">
      <h2 id="verkaufen-titel">Nicht streiten? Verkaufen prüfen.</h2>
      <p>Der dritte Weg neben Kündigen und Rückabwicklung.</p>
      <div className="feld">
        <div className="optionen">
          <label>
            <input
              type="checkbox"
              checked={einwilligung}
              onChange={(ereignis) => onEinwilligung(ereignis.target.checked)}
            />
            <span>
              Ja, {BRAND.name} darf mich zu einem Ankaufsangebot kontaktieren und dafür meine
              Vertragsangaben nutzen. (freiwillig, jederzeit widerrufbar)
            </span>
          </label>
        </div>
      </div>
      <p style={{ marginBottom: 0 }}>
        <Link
          href="/verkaufen"
          className="knopf zweitrangig"
          aria-disabled={!einwilligung}
          onClick={(ereignis) => {
            if (!einwilligung) {
              ereignis.preventDefault();
            }
          }}
        >
          Unverbindliches Ankaufsangebot anfordern
        </Link>
      </p>
      {!einwilligung && (
        <p className="erklaerung" style={{ marginTop: '0.5rem', marginBottom: 0 }}>
          Erst mit Ihrem Häkchen geht es weiter – ohne Ja geben wir nichts weiter.
        </p>
      )}
    </section>
  );
}

export function ErgebnisAnsicht() {
  const [draft, setDraft] = useState<CaseDraft>(leererDraft);
  const [geladen, setGeladen] = useState(false);
  const [vorschau, setVorschau] = useState<Vorschau | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);
  const [linkHinweis, setLinkHinweis] = useState<string | null>(null);

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
            Jetzt prüfen
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

  function linkErneutSenden() {
    setLinkHinweis('Der Link ist unterwegs an Ihre E-Mail-Adresse.');
    void fetch('/api/ergebnis-link', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ draft }),
    }).catch(() => undefined);
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

      {vorschau?.variante === 'privat' && (
        <>
          <Ampel zustand={vorschau.ampel.ampel} gross beschriftung={AMPEL_WORT[vorschau.ampel.ampel]} />
          <h1 style={{ marginTop: '1rem' }}>{vorschau.ampel.titel}</h1>
          {/* Über dem Knopf: höchstens 40 Wörter (Zeile + Rechtsweg-Satz). */}
          <p style={{ fontSize: '1.2rem' }}>{vorschau.ampel.zeile}</p>
          <p>{vorschau.rechtswegSatz}</p>

          {vorschau.ampel.ampel === 'rot' ? (
            <VerkaufenKarte einwilligung={draft.einwilligungAnkaufKontakt} onEinwilligung={ankaufEinwilligung} />
          ) : (
            VARIANTE.berichtKostenpflichtig && (
              <div className="formular-aktionen" style={{ marginTop: '1rem' }}>
                <Link href="/bestellen" className="knopf haupt">
                  {vorschau.ampel.ampel === 'gruen'
                    ? `Genaue Zahl holen · ${BERICHT_PREIS_BRUTTO_EUR} €`
                    : `Genau wissen · ${BERICHT_PREIS_BRUTTO_EUR} €`}
                </Link>
                <button type="button" className="knopf zweitrangig" onClick={linkErneutSenden}>
                  Später weitermachen – Link per E-Mail
                </button>
              </div>
            )
          )}
          {linkHinweis !== null && <p className="erklaerung">{linkHinweis}</p>}

          <div className="accordion-liste" style={{ marginTop: '2rem' }}>
            <details>
              <summary>Warum {AMPEL_WORT[vorschau.ampel.ampel]}?</summary>
              <ul className="punkteliste" style={{ marginTop: '0.75rem' }}>
                {vorschau.warum.map((zeile) => (
                  <li key={zeile}>{zeile}</li>
                ))}
                {vorschau.annahmen.map((text) => (
                  <li key={text}>{text}</li>
                ))}
                {vorschau.warnungen.map((text) => (
                  <li key={text}>
                    <strong>Hinweis:</strong> {text}
                  </li>
                ))}
              </ul>
              <p className="erklaerung">
                Rechenkern {vorschau.meta.calcVersion}, Datenbank {vorschau.meta.dataVersion}. Grundlagen in den{' '}
                <Link href="/agb#rechenweg">AGB („So rechnen wir“)</Link>.
              </p>
            </details>
            <details>
              <summary>Was sagt der Versicherer dazu?</summary>
              <p style={{ marginTop: '0.75rem' }}>{GEGENPOSITION}</p>
            </details>
            <details>
              <summary>Diese Unterlagen braucht ein Anwalt</summary>
              <ul className="punkteliste" style={{ marginTop: '0.75rem' }}>
                {UNTERLAGEN_LISTE.map((eintrag) => (
                  <li key={eintrag}>{eintrag}</li>
                ))}
              </ul>
              <p className="erklaerung">
                Fehlt etwas? Schreiben Sie dem Versicherer kurz: „Bitte schicken Sie mir eine
                Zweitschrift von Police, Begleitschreiben und Versicherungsbedingungen zu Vertrag
                Nummer …“ – das muss er liefern.
              </p>
            </details>
            <details>
              <summary>So verdienen wir</summary>
              <p style={{ marginTop: '0.75rem' }}>
                Am Prüfbericht und wenn Sie über uns verkaufen. Nicht daran, ob Sie klagen. Deshalb
                sagen wir Ihnen auch, wenn es sich nicht lohnt.{' '}
                <Link href="/so-verdienen-wir">Mehr dazu</Link>
              </p>
            </details>
          </div>

          {vorschau.ampel.ampel !== 'rot' && (
            <VerkaufenKarte einwilligung={draft.einwilligungAnkaufKontakt} onEinwilligung={ankaufEinwilligung} />
          )}

          <section aria-labelledby="persoenlich-titel" className="karte klein">
            <h2 id="persoenlich-titel" style={{ fontSize: '1.2rem' }}>
              Lieber persönlich?
            </h2>
            <p>Wir prüfen Ihren Vertrag auch individuell.</p>
            <p style={{ marginBottom: 0 }}>
              <Link href="/anfrage">Anfrage senden</Link>
            </p>
          </section>

          <div className="hinweis neutral">
            <p>
              Diese Ampel ist eine Schätzung unter offengelegten Annahmen, keine Rechtsberatung –
              und keine Empfehlung, zu kündigen, zu verkaufen oder zu behalten.
            </p>
          </div>
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
