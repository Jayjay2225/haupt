'use client';

/**
 * Ergebnis-Seite der Vorabversion: bestätigt die Erfassung und zeigt die
 * Angaben. Es werden bewusst KEINE Werte oder Ampeln angezeigt, solange
 * Regelwerk (Prompt 1), Versichererdaten (Prompt 2), Rechenkern (Prompt 3)
 * und Eignungs-Check (Prompt 4) nicht vorliegen – keine Zahl ohne Quelle
 * (CLAUDE.md, Prinzip 1).
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ladeDraft, leererDraft, loescheDraft, type CaseDraft } from '@/lib/draft';
import { ZusammenfassungAnsicht } from './Zusammenfassung';

export function ErgebnisAnsicht() {
  const [draft, setDraft] = useState<CaseDraft>(leererDraft);
  const [geladen, setGeladen] = useState(false);

  useEffect(() => {
    setDraft(ladeDraft());
    setGeladen(true);
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

  const eingereichtAnzeige = new Date(draft.eingereichtAm).toLocaleString('de-DE', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  function allesLoeschen() {
    loescheDraft();
    setDraft(leererDraft());
  }

  return (
    <>
      <h1>Ihre Angaben sind erfasst</h1>
      <p>Abgesendet am {eingereichtAnzeige}.</p>

      <div className="hinweis">
        <h2 style={{ fontSize: '1.1rem' }}>Warum hier noch kein Ergebnis steht</h2>
        <p>
          Die automatische Auswertung ist in dieser Vorabversion noch nicht freigeschaltet:
          Das Rechtsprechungs-Regelwerk, die Versicherer-Kennzahlen (jede Zahl mit Quelle
          und Abrufdatum) und der Rechenkern werden derzeit aufgebaut. Wir zeigen keine
          Schätzwerte an, solange sie nicht belastbar belegt sind.
        </p>
        <p>Sobald die Auswertung verfügbar ist, erscheint an dieser Stelle:</p>
        <ul className="punkteliste">
          <li>die Ampel des Eignungs-Checks mit Begründung,</li>
          <li>
            der geschätzte Rückabwicklungswert in drei Szenarien (Min / Basis / Max) samt
            Annahmen und Quellen,
          </li>
          <li>der Vergleich mit Ihrem aktuellen Rückkaufswert – auch dann, wenn sich die
            Rückabwicklung voraussichtlich nicht lohnt.</li>
        </ul>
      </div>

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
