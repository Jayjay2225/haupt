'use client';

/**
 * Bestellformular für den schriftlichen Bericht: zeigt die Police aus dem
 * Rechner-Entwurf, nimmt Name und E-Mail für Rechnung und Versand, holt die
 * nötigen Bestätigungen ein (nicht vorangekreuzt) und leitet zur Zahlungsseite
 * (Stripe Checkout) weiter. Button-Lösung: „Zahlungspflichtig bestellen“.
 */
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { BERICHT_PREIS_BRUTTO_EUR, BERICHT_PREIS_HINWEIS, BERICHT_PREIS_REGULAER_EUR, ZAHLUNG } from '@/config/business';
import { FEHLER_FALL_UNVOLLSTAENDIG, bestellformularAusDraft, pruefeBestellformular } from '@/lib/bestellung';
import type { BestellFehler, Bestellformular as Formular } from '@/lib/bestellung';
import { ladeDraft, leererDraft, validiereBis } from '@/lib/draft';
import type { CaseDraft } from '@/lib/draft';
import { VERTRAGSART_LABEL, ZAHLWEISE_LABEL } from '@/lib/labels';
import { Kontrollkaestchen, TextFeld } from './funnel/fields';

function monat(iso: string): string {
  const [jahr, monatsteil] = iso.split('-');
  return jahr !== undefined && monatsteil !== undefined ? `${monatsteil}/${jahr}` : iso;
}

export function BestellFormular() {
  const [draft, setDraft] = useState<CaseDraft>(leererDraft());
  const [geladen, setGeladen] = useState(false);
  const [formular, setFormular] = useState<Formular>(bestellformularAusDraft(leererDraft()));
  const [fehler, setFehler] = useState<BestellFehler>({});
  const [laeuft, setLaeuft] = useState(false);
  const [freischaltcode, setFreischaltcode] = useState('');
  // Spam-Schutz: unsichtbares Feld (nur Bots füllen es aus).
  const [honig, setHonig] = useState('');

  useEffect(() => {
    const gespeichert = ladeDraft();
    setDraft(gespeichert);
    setFormular(bestellformularAusDraft(gespeichert));
    setGeladen(true);
  }, []);

  const fallUnvollstaendig = geladen && Object.keys(validiereBis('werte', draft)).length > 0;

  async function absenden(ereignis: FormEvent<HTMLFormElement>): Promise<void> {
    ereignis.preventDefault();
    const lokal = pruefeBestellformular(formular, draft);
    setFehler(lokal);
    if (Object.keys(lokal).length > 0) {
      return;
    }
    setLaeuft(true);
    try {
      const antwort = await fetch('/api/bestellung', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft, ...formular, freischaltcode: freischaltcode.trim(), firma_webseite: honig }),
      });
      const daten = (await antwort.json()) as { url?: string; erstkunde?: boolean; fehler?: BestellFehler };
      if (antwort.ok && daten.erstkunde === true) {
        window.location.assign('/bestellen/danke?ek=1');
        return;
      }
      if (antwort.ok && daten.url !== undefined) {
        window.location.assign(daten.url);
        return;
      }
      setFehler(daten.fehler ?? { fall: 'Das hat nicht geklappt. Bitte noch einmal versuchen.' });
    } catch {
      setFehler({ fall: 'Keine Verbindung. Bitte noch einmal versuchen.' });
    } finally {
      setLaeuft(false);
    }
  }

  if (!geladen) {
    return <p className="erklaerung">Ihre Angaben werden geladen …</p>;
  }
  if (fallUnvollstaendig) {
    return (
      <div className="hinweis" role="status">
        <p>
          {FEHLER_FALL_UNVOLLSTAENDIG} <Link href="/rechner">Zum Rechner</Link>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={absenden} noValidate>
      <div style={{ position: 'absolute', left: '-10000px', width: '1px', height: '1px', overflow: 'hidden' }} aria-hidden="true">
        <label htmlFor="firma_webseite">Firmen-Webseite (bitte leer lassen)</label>
        <input id="firma_webseite" name="firma_webseite" type="text" tabIndex={-1} autoComplete="off" value={honig} onChange={(e) => setHonig(e.target.value)} />
      </div>
      <h2>Ihre Police</h2>
      <table className="zusammenfassung">
        <caption className="sr-nur">Angaben, aus denen der Bericht gerechnet wird</caption>
        <tbody>
          <tr>
            <th scope="row">Versicherer</th>
            <td>{draft.versicherer !== '' ? draft.versicherer : 'nicht benannt (Branchendurchschnitt)'}</td>
          </tr>
          <tr>
            <th scope="row">Vertragsart</th>
            <td>{draft.vertragsart !== '' ? VERTRAGSART_LABEL[draft.vertragsart] : '–'}</td>
          </tr>
          <tr>
            <th scope="row">Beginn</th>
            <td>{monat(draft.beginn)}</td>
          </tr>
          <tr>
            <th scope="row">Beitrag</th>
            <td>
              {draft.erstbeitrag !== '' ? draft.erstbeitrag : draft.aktuellerBeitrag} {draft.erstbeitragWaehrung}
              {draft.zahlweise !== '' ? `, ${ZAHLWEISE_LABEL[draft.zahlweise]}` : ''}
            </td>
          </tr>
        </tbody>
      </table>
      <p className="erklaerung">
        Stimmt etwas nicht? <Link href="/rechner">Angaben ändern</Link> – der Bericht wird aus genau diesen Werten
        gerechnet.
      </p>

      <h2>Rechnung und Versand</h2>
      <TextFeld
        id="bestellName"
        label="Name für Rechnung und Prüfbericht"
        wert={formular.name}
        onChange={(wert) => setFormular({ ...formular, name: wert })}
        autoComplete="name"
        fehler={fehler.name}
      />
      <TextFeld
        id="bestellEmail"
        label="E-Mail-Adresse"
        typ="email"
        inputMode="email"
        wert={formular.email}
        onChange={(wert) => setFormular({ ...formular, email: wert })}
        autoComplete="email"
        erklaerung="Dorthin schicken wir Rechnung und Prüfbericht."
        fehler={fehler.email}
      />
      <p className="erklaerung">
        Ihre Rechnungsadresse fragt die Zahlungsseite ab. Zur Abwicklung übermitteln wir Name und E-Mail-Adresse an{' '}
        {ZAHLUNG.abwicklung}; mehr dazu in der <Link href="/datenschutz">Datenschutzerklärung</Link>.
      </p>

      <TextFeld
        id="freischaltcode"
        label="Freischaltcode (Erstkunden-Programm, freiwillig)"
        wert={freischaltcode}
        onChange={setFreischaltcode}
        autoComplete="off"
        erklaerung="Mit gültigem Code ist der Prüfbericht kostenlos; im Gegenzug bitten wir um Ihr Feedback."
      />

      <h2>Bestellen</h2>
      <p>
        <strong className="betrag">
          Einführungspreis: {BERICHT_PREIS_BRUTTO_EUR} € statt <s>{BERICHT_PREIS_REGULAER_EUR} €</s>
        </strong>{' '}
        {BERICHT_PREIS_HINWEIS}, einmalig. Zahlung vorab: {ZAHLUNG.wege.join(', ')}. {ZAHLUNG.lieferung}
      </p>
      <Kontrollkaestchen
        id="agbGelesen"
        label={
          <>
            Ich habe die <Link href="/agb">AGB</Link> und die <Link href="/widerrufsbelehrung">Widerrufsbelehrung</Link>{' '}
            gelesen.
          </>
        }
        angehakt={formular.agbGelesen}
        onChange={(angehakt) => setFormular({ ...formular, agbGelesen: angehakt })}
        fehler={fehler.agbGelesen}
      />
      <Kontrollkaestchen
        id="ausfuehrungZugestimmt"
        label="Ich möchte, dass der Bericht sofort erstellt wird. Mir ist bekannt: Sobald er vollständig geliefert ist, kann ich den Kauf nicht mehr widerrufen."
        angehakt={formular.ausfuehrungZugestimmt}
        onChange={(angehakt) => setFormular({ ...formular, ausfuehrungZugestimmt: angehakt })}
        fehler={fehler.ausfuehrungZugestimmt}
      />
      {fehler.fall !== undefined && (
        <div className="hinweis" role="alert">
          <p>{fehler.fall}</p>
        </div>
      )}
      <div className="formular-aktionen">
        <button type="submit" className="knopf haupt" disabled={laeuft}>
          {laeuft
            ? 'Wird gesendet …'
            : freischaltcode.trim() !== ''
              ? 'Kostenlos anfordern (Erstkunde)'
              : `Zahlungspflichtig bestellen – ${BERICHT_PREIS_BRUTTO_EUR} €`}
        </button>
      </div>
    </form>
  );
}
