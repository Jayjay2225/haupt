'use client';

/**
 * Einstiegskarte der Startseite (Prompt 12, Abschnitt 3.1):
 * „Vier Angaben. Ergebnis sofort.“ – Versicherer, Beginn, Monatsbeitrag,
 * Rückkaufswert. Sind alle vier Felder brauchbar gefüllt, springt der
 * Ampel-Punkt an (Farbe aus dem Rechenergebnis, /api/vorschau); der Knopf
 * übernimmt die Angaben in den Rechner-Assistenten.
 */
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ampel, type AmpelZustand } from './Ampel';
import { MonatsFeld, TextFeld } from './funnel/fields';
import { BEGINN_MAX, BEGINN_MIN, ladeDraft, speichereDraft } from '@/lib/draft';
import type { UebernahmeAmpel } from '@/lib/ampel';
import { formatEuro, parseDecimalDe } from '@/lib/format';

function betragEcho(eingabe: string): string | undefined {
  if (eingabe.trim() === '') {
    return undefined;
  }
  const wert = parseDecimalDe(eingabe);
  return wert === null ? undefined : `Gelesen als ${formatEuro(wert)}`;
}

interface VorschauAntwort {
  variante?: string;
  ampel?: UebernahmeAmpel;
  fehler?: string;
}

export function Schnellcheck({ versichererNamen }: { versichererNamen: string[] }) {
  const router = useRouter();
  const [versicherer, setVersicherer] = useState('');
  const [beginn, setBeginn] = useState('');
  const [monatsbeitrag, setMonatsbeitrag] = useState('');
  const [rueckkaufswert, setRueckkaufswert] = useState('');
  const [ergebnis, setErgebnis] = useState<UebernahmeAmpel | null>(null);
  const [rechnet, setRechnet] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const beginnImZeitraum = beginn >= BEGINN_MIN && beginn <= BEGINN_MAX;
  const vollstaendig =
    versicherer.trim() !== '' &&
    beginnImZeitraum &&
    (parseDecimalDe(monatsbeitrag) ?? 0) > 0 &&
    (parseDecimalDe(rueckkaufswert) ?? 0) > 0;
  const fortschritt = [
    versicherer.trim() !== '',
    beginn !== '',
    monatsbeitrag.trim() !== '',
    rueckkaufswert.trim() !== '',
  ].filter(Boolean).length;

  // Sobald alle vier Felder brauchbar sind: Ampel anspringen lassen (verzögert,
  // damit nicht jeder Tastendruck eine Anfrage auslöst).
  useEffect(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
    }
    if (!vollstaendig) {
      setErgebnis(null);
      return undefined;
    }
    timer.current = setTimeout(() => {
      setRechnet(true);
      const waehrung = beginn < '2002-01' ? 'DM' : 'EUR';
      fetch('/api/vorschau', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          version: 2,
          versicherer,
          beginn,
          erstbeitrag: monatsbeitrag,
          erstbeitragWaehrung: waehrung,
          zahlweise: 'monatlich',
          rueckkaufswert,
          status: 'laufend',
          dynamik: 'nein',
          auszahlungenErhalten: 'nein',
        }),
      })
        .then(async (antwort) => {
          const daten = (await antwort.json()) as VorschauAntwort;
          setErgebnis(antwort.ok && daten.ampel !== undefined ? daten.ampel : null);
        })
        .catch(() => setErgebnis(null))
        .finally(() => setRechnet(false));
    }, 700);
    return () => {
      if (timer.current !== null) {
        clearTimeout(timer.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versicherer, beginn, monatsbeitrag, rueckkaufswert, vollstaendig]);

  const zustand: AmpelZustand = ergebnis !== null ? ergebnis.ampel : 'aus';

  function weiterZumRechner(ereignis: React.FormEvent) {
    ereignis.preventDefault();
    const draft = ladeDraft();
    speichereDraft({
      ...draft,
      versicherer: versicherer.trim() !== '' ? versicherer : draft.versicherer,
      beginn: beginn !== '' ? beginn : draft.beginn,
      zahlweise: monatsbeitrag.trim() !== '' ? 'monatlich' : draft.zahlweise,
      erstbeitrag: monatsbeitrag.trim() !== '' ? monatsbeitrag : draft.erstbeitrag,
      erstbeitragWaehrung: beginn !== '' && beginn < '2002-01' ? 'DM' : draft.erstbeitragWaehrung,
      rueckkaufswert: rueckkaufswert.trim() !== '' ? rueckkaufswert : draft.rueckkaufswert,
      eingereichtAm: '',
    });
    router.push('/rechner');
  }

  return (
    <form className="schnellcheck karte einstieg" onSubmit={weiterZumRechner} noValidate aria-labelledby="schnellcheck-titel">
      <h2 id="schnellcheck-titel">Vier Angaben. Ergebnis sofort.</h2>
      <div className="schnellcheck-kopf">
        <Ampel zustand={zustand} fortschritt={fortschritt} />
        <p className="erklaerung" aria-live="polite" style={{ margin: 0 }}>
          {rechnet ? 'Wir rechnen …' : ergebnis !== null ? ergebnis.titel : 'Die Ampel springt an, sobald alles ausgefüllt ist.'}
        </p>
      </div>
      <div className="felder">
        <TextFeld
          id="sc-versicherer"
          label="Versicherer"
          wert={versicherer}
          onChange={setVersicherer}
          liste="sc-versicherer-liste"
          platzhalter="Name auf der Police"
        />
        <datalist id="sc-versicherer-liste">
          {versichererNamen.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <MonatsFeld id="sc-beginn" label="Beginn" platzhalter="MM/JJJJ" startJahr={2000} wert={beginn} onChange={setBeginn} />
        <TextFeld
          id="sc-monatsbeitrag"
          label="Monatsbeitrag"
          inputMode="decimal"
          platzhalter="z. B. 100 €"
          wert={monatsbeitrag}
          onChange={setMonatsbeitrag}
          echo={betragEcho(monatsbeitrag)}
        />
        <TextFeld
          id="sc-rueckkaufswert"
          label="Rückkaufswert laut Standmitteilung"
          inputMode="decimal"
          platzhalter="z. B. 25.000 €"
          wert={rueckkaufswert}
          onChange={setRueckkaufswert}
          echo={betragEcho(rueckkaufswert)}
        />
      </div>
      <p style={{ margin: '1rem 0 0.5rem' }}>
        <button type="submit" className="knopf haupt" style={{ width: '100%' }}>
          Ampel anzeigen – kostenlos
        </button>
      </p>
      <p className="erklaerung" style={{ textAlign: 'center', margin: 0 }}>
        Keine Anmeldung. Ihre Angaben bleiben bei Ihnen, bis Sie den Bericht bestellen.
      </p>
    </form>
  );
}
