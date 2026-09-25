'use client';

/**
 * Rechner-Assistent (Prompt 12, Abschnitt 3.2): eine Frage je Bildschirm,
 * Fortschrittsbalken, großer Weiter-Knopf unten fest. Zwischenspeicherung im
 * Browser; abgesendet wird zustandslos an /api/vorschau (Ergebnis-Seite).
 * Nach dem letzten Schritt geht zusätzlich der Ergebnis-Link per E-Mail raus
 * (/api/ergebnis-link, bestmöglich – das Ergebnis erscheint unabhängig davon).
 */
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  SCHRITTE,
  SCHRITT_FRAGE,
  ladeDraft,
  leererDraft,
  speichereDraft,
  validiereSchritt,
  type CaseDraft,
  type Fehlerliste,
  type Schritt,
} from '@/lib/draft';
import {
  SchrittAuszahlungen,
  SchrittBeginn,
  SchrittBeitrag,
  SchrittBeitragssumme,
  SchrittDynamik,
  SchrittEignung,
  SchrittKontakt,
  SchrittRueckkaufswert,
  SchrittStatus,
  SchrittTyp,
  SchrittVersicherer,
  type SchrittProps,
} from './steps';

const SCHRITT_KOMPONENTEN: Record<Schritt, (props: SchrittProps) => React.JSX.Element> = {
  typ: SchrittTyp,
  status: SchrittStatus,
  versicherer: SchrittVersicherer,
  beginn: SchrittBeginn,
  beitrag: SchrittBeitrag,
  dynamik: SchrittDynamik,
  beitragssumme: SchrittBeitragssumme,
  rueckkaufswert: SchrittRueckkaufswert,
  auszahlungen: SchrittAuszahlungen,
  eignung: SchrittEignung,
  kontakt: SchrittKontakt,
};

/** Schritte ohne Pflichtangabe: „Überspringen“ statt erzwungener Eingabe. */
const UEBERSPRINGBAR: ReadonlySet<Schritt> = new Set<Schritt>(['beitragssumme']);

export function RechnerFunnel({ versichererNamen }: { versichererNamen: string[] }) {
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
    return <p>Der Rechner lädt …</p>;
  }

  const schritt = SCHRITTE[schrittIndex] ?? 'typ';
  const istLetzter = schrittIndex === SCHRITTE.length - 1;
  const AktuellerSchritt = SCHRITT_KOMPONENTEN[schritt];
  const fortschrittProzent = Math.round(((schrittIndex + 1) / SCHRITTE.length) * 100);

  function weiter() {
    const neueFehler = validiereSchritt(schritt, draft);
    setFehler(neueFehler);
    if (Object.keys(neueFehler).length > 0) {
      return;
    }
    if (istLetzter) {
      absenden();
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
    // Ergebnis-Link per E-Mail (bestmöglich; das Ergebnis erscheint unabhängig davon).
    void fetch('/api/ergebnis-link', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ draft: abgesendet }),
    }).catch(() => undefined);
    router.push('/rechner/ergebnis');
  }

  const hatFehler = Object.keys(fehler).length > 0;

  return (
    <div className="assistent">
      <div
        className="fortschritt"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={fortschrittProzent}
        aria-label={`Frage ${schrittIndex + 1} von ${SCHRITTE.length}`}
      >
        <span style={{ width: `${fortschrittProzent}%` }} />
      </div>
      <p className="erklaerung fortschritt-text">
        Frage {schrittIndex + 1} von {SCHRITTE.length}
      </p>

      <form
        noValidate
        onSubmit={(ereignis) => {
          ereignis.preventDefault();
          weiter();
        }}
      >
        <h1 className="assistent-frage">{SCHRITT_FRAGE[schritt]}</h1>
        {hatFehler && (
          <p className="feld-fehler" role="alert">
            Bitte die markierten Felder prüfen.
          </p>
        )}
        <AktuellerSchritt draft={draft} fehler={fehler} aendere={aendere} versichererNamen={versichererNamen} />
        <div className="formular-aktionen">
          {schrittIndex > 0 && (
            <button type="button" className="knopf zweitrangig" onClick={zurueck}>
              Zurück
            </button>
          )}
          <button type="submit" className="knopf haupt fix-unten">
            {istLetzter
              ? 'Ampel anzeigen – kostenlos'
              : UEBERSPRINGBAR.has(schritt) && draft.gesamtsummeLautMitteilung.trim() === ''
                ? 'Überspringen'
                : 'Weiter'}
          </button>
        </div>
      </form>

      <p className="erklaerung" style={{ marginTop: '1.5rem' }}>
        Ihre Eingaben bleiben auf diesem Gerät gespeichert, bis Sie sie löschen. Sie können die
        Seite schließen und später hier weitermachen.
      </p>
    </div>
  );
}
