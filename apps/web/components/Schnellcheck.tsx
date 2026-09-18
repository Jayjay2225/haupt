'use client';

/**
 * Schnellcheck auf der Startseite (Prompt 8, Aufgabe 2): vier Felder, die
 * Ampel springt beim Ausfüllen an; die Eingaben werden in den Entwurf
 * übernommen und der Funnel startet damit.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ampel, type AmpelZustand } from './Ampel';
import { TextFeld } from './funnel/fields';
import { ladeDraft, speichereDraft } from '@/lib/draft';
import { formatEuro, parseDecimalDe } from '@/lib/format';

function betragEcho(eingabe: string): string | undefined {
  if (eingabe.trim() === '') {
    return undefined;
  }
  const wert = parseDecimalDe(eingabe);
  return wert === null ? undefined : `Gelesen als ${formatEuro(wert)}`;
}

export function Schnellcheck({ versichererNamen }: { versichererNamen: string[] }) {
  const router = useRouter();
  const [versicherer, setVersicherer] = useState('');
  const [beginn, setBeginn] = useState('');
  const [monatsbeitrag, setMonatsbeitrag] = useState('');
  const [rueckkaufswert, setRueckkaufswert] = useState('');

  const fortschritt = [versicherer, beginn, monatsbeitrag, rueckkaufswert].filter((w) => w.trim() !== '').length;
  const zustand: AmpelZustand = fortschritt === 4 ? 'bereit' : 'aus';

  function weiterZumRechner(ereignis: React.FormEvent) {
    ereignis.preventDefault();
    const draft = ladeDraft();
    speichereDraft({
      ...draft,
      versicherer: versicherer.trim() !== '' ? versicherer : draft.versicherer,
      beginn: beginn !== '' ? beginn : draft.beginn,
      zahlweise: monatsbeitrag.trim() !== '' ? 'monatlich' : draft.zahlweise,
      aktuellerBeitrag: monatsbeitrag.trim() !== '' ? monatsbeitrag : draft.aktuellerBeitrag,
      rueckkaufswert: rueckkaufswert.trim() !== '' ? rueckkaufswert : draft.rueckkaufswert,
      eingereichtAm: '',
    });
    router.push('/rechner');
  }

  return (
    <form className="schnellcheck" onSubmit={weiterZumRechner} noValidate aria-labelledby="schnellcheck-titel">
      <h2 id="schnellcheck-titel" style={{ fontSize: '1.35rem' }}>
        Vier Angaben. Dann rechnen wir.
      </h2>
      <div className="schnellcheck-raster">
        <Ampel zustand={zustand} fortschritt={fortschritt} gross />
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
          <TextFeld id="sc-beginn" label="Beginn (Monat/Jahr)" typ="month" wert={beginn} onChange={setBeginn} />
          <TextFeld
            id="sc-monatsbeitrag"
            label="Monatsbeitrag"
            inputMode="decimal"
            platzhalter="zum Beispiel 100,00"
            wert={monatsbeitrag}
            onChange={setMonatsbeitrag}
            echo={betragEcho(monatsbeitrag)}
          />
          <TextFeld
            id="sc-rueckkaufswert"
            label="Rückkaufswert laut Standmitteilung"
            inputMode="decimal"
            platzhalter="zum Beispiel 25.000,00"
            wert={rueckkaufswert}
            onChange={setRueckkaufswert}
            echo={betragEcho(rueckkaufswert)}
          />
        </div>
      </div>
      <p style={{ marginTop: '1rem' }}>
        <button type="submit" className="knopf haupt fix-unten" style={{ width: '100%' }}>
          Jetzt rechnen – kostenlos
        </button>
      </p>
      <p className="erklaerung" style={{ textAlign: 'center', margin: 0 }}>
        5 Minuten. Ihre Police. Eine klare Ampel.
      </p>
    </form>
  );
}
