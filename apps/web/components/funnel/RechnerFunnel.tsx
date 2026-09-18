'use client';

/**
 * Mehrstufiges Rechner-Formular (Prompt 6): mobil-first, Zwischenspeicherung
 * im Browser (localStorage), Validierung je Schritt. Abgesendet wird in der
 * Vorabversion nur lokal – Persistenz, E-Mail-Versand und Auswertung folgen
 * (siehe docs/STATUS.md).
 */
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  SCHRITTE,
  SCHRITT_TITEL,
  ladeDraft,
  leererDraft,
  speichereDraft,
  validiereSchritt,
  type CaseDraft,
  type Fehlerliste,
  type Schritt,
} from '@/lib/draft';
import {
  SchrittBeitraege,
  SchrittEignung,
  SchrittKontakt,
  SchrittVertrag,
  SchrittWerte,
  SchrittZusammenfassung,
  type SchrittProps,
} from './steps';

const SCHRITT_KOMPONENTEN: Record<Schritt, (props: SchrittProps) => React.JSX.Element> = {
  kontakt: SchrittKontakt,
  vertrag: SchrittVertrag,
  beitraege: SchrittBeitraege,
  werte: SchrittWerte,
  eignung: SchrittEignung,
  zusammenfassung: SchrittZusammenfassung,
};

export function RechnerFunnel() {
  const router = useRouter();
  const [draft, setDraft] = useState<CaseDraft>(leererDraft);
  const [schrittIndex, setSchrittIndex] = useState(0);
  const [fehler, setFehler] = useState<Fehlerliste>({});
  const [geladen, setGeladen] = useState(false);

  useEffect(() => {
    setDraft(ladeDraft());
    setGeladen(true);
  }, []);

  useEffect(() => {
    if (geladen) {
      speichereDraft(draft);
    }
  }, [draft, geladen]);

  const aendere = useCallback(
    <K extends keyof CaseDraft>(feld: K, wert: CaseDraft[K]) => {
      setDraft((bisher) => ({ ...bisher, [feld]: wert }));
      setFehler((bisher) => {
        if (bisher[feld] === undefined) {
          return bisher;
        }
        const kopie = { ...bisher };
        delete kopie[feld];
        return kopie;
      });
    },
    [],
  );

  if (!geladen) {
    return <p>Das Formular wird geladen …</p>;
  }

  const schritt = SCHRITTE[schrittIndex] ?? 'kontakt';
  const istLetzter = schrittIndex === SCHRITTE.length - 1;
  const AktuellerSchritt = SCHRITT_KOMPONENTEN[schritt];

  function zeigeFehler(neueFehler: Fehlerliste): boolean {
    setFehler(neueFehler);
    if (Object.keys(neueFehler).length === 0) {
      return false;
    }
    return true;
  }

  function weiter() {
    if (zeigeFehler(validiereSchritt(schritt, draft))) {
      return;
    }
    setSchrittIndex((index) => Math.min(index + 1, SCHRITTE.length - 1));
    window.scrollTo({ top: 0 });
  }

  function zurueck() {
    setFehler({});
    setSchrittIndex((index) => Math.max(index - 1, 0));
    window.scrollTo({ top: 0 });
  }

  function absenden() {
    // Alle Schritte prüfen; bei Fehlern zum ersten betroffenen Schritt springen.
    for (let index = 0; index < SCHRITTE.length; index += 1) {
      const zuPruefen = SCHRITTE[index] as Schritt;
      const schrittFehler = validiereSchritt(zuPruefen, draft);
      if (Object.keys(schrittFehler).length > 0) {
        setSchrittIndex(index);
        setFehler(schrittFehler);
        window.scrollTo({ top: 0 });
        return;
      }
    }
    const abgesendet: CaseDraft = { ...draft, eingereichtAm: new Date().toISOString() };
    setDraft(abgesendet);
    speichereDraft(abgesendet);
    router.push('/rechner/ergebnis');
  }

  const hatFehler = Object.keys(fehler).length > 0;

  return (
    <div>
      <ol className="formular-schritte" aria-label="Schritte des Formulars">
        {SCHRITTE.map((name, index) => (
          <li
            key={name}
            aria-current={index === schrittIndex ? 'step' : undefined}
            className={index < schrittIndex ? 'erledigt' : undefined}
          >
            {index + 1}. {SCHRITT_TITEL[name]}
          </li>
        ))}
      </ol>

      <form
        noValidate
        onSubmit={(ereignis) => {
          ereignis.preventDefault();
          if (istLetzter) {
            absenden();
          } else {
            weiter();
          }
        }}
      >
        <h2>{SCHRITT_TITEL[schritt]}</h2>
        {hatFehler && (
          <p className="feld-fehler" role="alert">
            Bitte prüfen Sie die markierten Felder.
          </p>
        )}
        <AktuellerSchritt draft={draft} fehler={fehler} aendere={aendere} />
        <div className="formular-aktionen">
          {schrittIndex > 0 && (
            <button type="button" className="knopf zweitrangig" onClick={zurueck}>
              Zurück
            </button>
          )}
          <button type="submit" className="knopf">
            {istLetzter ? 'Angaben absenden' : 'Weiter'}
          </button>
        </div>
      </form>

      <p className="erklaerung" style={{ marginTop: '1.5rem' }}>
        Ihre Eingaben werden automatisch in Ihrem Browser zwischengespeichert. Sie können
        die Seite schließen und später fortfahren.
      </p>
    </div>
  );
}
