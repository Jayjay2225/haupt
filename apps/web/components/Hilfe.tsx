'use client';

/**
 * „Wo finde ich das?“ (Prompt 14, Abschnitt 1.4):
 * - `InfoKnopf`: Info-Symbol mit 44-px-Tippfläche neben dem Feld; öffnet ein
 *   Info-Fenster (natives <dialog>) mit Text und schematischer Skizze.
 * - `WoFindeIchDas`: dieselben Texte als aufklappbare Zeile direkt unter dem
 *   Feld (Funnel).
 */
import { useId, useRef } from 'react';
import { HILFETEXTE, HILFE_ZEILE, type HilfeFeld } from '@/content/hilfetexte';
import { Skizze } from './Skizze';

export function InfoKnopf({ feld }: { feld: HilfeFeld }) {
  const hilfe = HILFETEXTE[feld];
  const dialog = useRef<HTMLDialogElement>(null);
  const titelId = useId();

  function oeffnen() {
    const element = dialog.current;
    if (element === null) {
      return;
    }
    if (typeof element.showModal === 'function') {
      element.showModal();
    } else {
      element.setAttribute('open', '');
    }
  }

  return (
    <>
      <button
        type="button"
        className="info-knopf"
        onClick={oeffnen}
        aria-label={`${HILFE_ZEILE} ${hilfe.titel}`}
        aria-haspopup="dialog"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="8" r="1.3" fill="currentColor" />
          <path d="M11 11h2v6h-2z" fill="currentColor" />
        </svg>
      </button>
      <dialog
        ref={dialog}
        className="info-fenster"
        aria-labelledby={titelId}
        onClick={(ereignis) => {
          // Klick auf den Hintergrund schließt.
          if (ereignis.target === dialog.current) {
            dialog.current?.close();
          }
        }}
      >
        <div className="info-fenster-inhalt">
          <h3 id={titelId}>
            {HILFE_ZEILE} {hilfe.titel}
          </h3>
          <p>{hilfe.textStartseite ?? hilfe.text}</p>
          <Skizze art={hilfe.skizze} markierung={hilfe.markierung} />
          <p className="erklaerung" style={{ marginTop: '0.5rem' }}>
            Schematische Darstellung – kein echtes Dokument.
          </p>
          <button type="button" className="knopf zweitrangig klein" onClick={() => dialog.current?.close()}>
            Schließen
          </button>
        </div>
      </dialog>
    </>
  );
}

export function WoFindeIchDas({ feld }: { feld: HilfeFeld }) {
  const hilfe = HILFETEXTE[feld];
  return (
    <details className="wo-finde">
      <summary>{HILFE_ZEILE}</summary>
      <div className="wo-finde-inhalt">
        <p>{hilfe.text}</p>
        <Skizze art={hilfe.skizze} markierung={hilfe.markierung} />
        <p className="erklaerung">Schematische Darstellung – kein echtes Dokument.</p>
      </div>
    </details>
  );
}
