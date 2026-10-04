'use client';

/**
 * Die Karte der Startseite (Prompt 14, Abschnitte 1.1–1.3): „Vier Angaben.
 * Dann sehen Sie Ihre Ampel.“ – Versicherer, Beginn, Monatsbeitrag,
 * Rückkaufswert, jedes Feld mit Info-Symbol. Darunter die Ampel (hochkant,
 * groß), darunter der grüne Kaufknopf. Die Ampel springt an, sobald alle vier
 * Felder gültig sind (400 ms nach der letzten Eingabe, /api/vorschau,
 * zustandslos). Der Kaufknopf ist nur bei Grün und Gelb aktiv; bei Rot
 * ersetzt ihn die Verkaufen-Karte, bei Grau der Hinweis unter der Ampel.
 * Es gibt keine zweite Ampel: Der Knopf führt direkt in den Funnel, der in
 * der Bestellung endet.
 */
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RANGE_TEXT } from '@/config/brand';
import { BERICHT_PREIS_BRUTTO_EUR } from '@/config/business';
import { ANKAUF_MIN_RUECKKAUFSWERT } from '@/config/durchsetzung';
import { VARIANTE } from '@/config/variante';
import { Ampel, type AmpelZustand } from './Ampel';
import { InfoKnopf } from './Hilfe';
import { VerkaufenKarte } from './VerkaufenKarte';
import { MonatsFeld, RadioGruppe, TextFeld } from './funnel/fields';
import { ampelKartenText, type UebernahmeAmpel } from '@/lib/ampel';
import { BEGINN_MAX, BEGINN_MIN, ladeDraft, speichereDraft, type Waehrung } from '@/lib/draft';
import { formatEuro, parseDecimalDe } from '@/lib/format';

export const KAUFKNOPF_TEXT = `Detailliertes Gutachten bestellen · ${BERICHT_PREIS_BRUTTO_EUR} €`;
export const KAUFKNOPF_UNTERZEILE = 'Innerhalb von 12 Stunden per E-Mail. Auf Wunsch zusätzlich per Post, kostenlos.';

/** Verzögerung nach der letzten Eingabe, bevor gerechnet wird (Prompt 14, 1.2). */
const VERZOEGERUNG_MS = 400;

function betragEcho(eingabe: string, waehrung: Waehrung = 'EUR'): string | undefined {
  if (eingabe.trim() === '') {
    return undefined;
  }
  const wert = parseDecimalDe(eingabe);
  if (wert === null) {
    return undefined;
  }
  return waehrung === 'DM'
    ? `Gelesen als ${wert.toLocaleString('de-DE', { minimumFractionDigits: 2 })} DM`
    : `Gelesen als ${formatEuro(wert)}`;
}

interface VorschauAntwort {
  variante?: string;
  ampel?: UebernahmeAmpel;
  kaufbar?: boolean;
  fehler?: string;
}

export function AmpelKarte({ versichererNamen }: { versichererNamen: string[] }) {
  const router = useRouter();
  const [versicherer, setVersicherer] = useState('');
  const [beginn, setBeginn] = useState('');
  const [monatsbeitrag, setMonatsbeitrag] = useState('');
  const [rueckkaufswert, setRueckkaufswert] = useState('');
  const [ergebnis, setErgebnis] = useState<VorschauAntwort | null>(null);
  const [rechnet, setRechnet] = useState(false);
  const [einwilligungAnkauf, setEinwilligungAnkauf] = useState(false);
  // Vor 2002 stand der erste Beitrag laut Police meist in DM (docs/ASSUMPTIONS.md Nr. 58):
  // Vorauswahl DM, auf der Karte umschaltbar; Echo, Platzhalter, Vorschau-Anfrage und
  // Funnel-Entwurf nutzen dieselbe Währung.
  const [waehrungWahl, setWaehrungWahl] = useState<Waehrung>('DM');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const laufend = useRef<AbortController | null>(null);

  const beginnGesetzt = /^\d{4}-\d{2}$/.test(beginn);
  const beginnImZeitraum = beginn >= BEGINN_MIN && beginn <= BEGINN_MAX;
  const beginnAusserhalb = beginnGesetzt && !beginnImZeitraum;
  const vorEuro = beginnGesetzt && beginn < '2002-01';
  const waehrung: Waehrung = vorEuro ? waehrungWahl : 'EUR';
  const vollstaendig =
    versicherer.trim() !== '' &&
    beginnImZeitraum &&
    (parseDecimalDe(monatsbeitrag) ?? 0) > 0 &&
    (parseDecimalDe(rueckkaufswert) ?? 0) > 0;

  // Sobald alle vier Felder brauchbar sind: Ampel anspringen lassen (verzögert,
  // damit nicht jeder Tastendruck eine Anfrage auslöst). Kein Absenden nötig.
  // Eine noch laufende Anfrage gehört zu alten Eingaben und wird verworfen.
  useEffect(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
    }
    laufend.current?.abort();
    laufend.current = null;
    setRechnet(false);
    if (!vollstaendig) {
      setErgebnis(null);
      return undefined;
    }
    timer.current = setTimeout(() => {
      const steuerung = new AbortController();
      laufend.current = steuerung;
      setRechnet(true);
      fetch('/api/vorschau', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        signal: steuerung.signal,
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
          if (steuerung.signal.aborted) {
            return;
          }
          setErgebnis(antwort.ok && daten.ampel !== undefined ? daten : null);
        })
        .catch(() => {
          if (!steuerung.signal.aborted) {
            setErgebnis(null);
          }
        })
        .finally(() => {
          if (laufend.current === steuerung) {
            laufend.current = null;
            setRechnet(false);
          }
        });
    }, VERZOEGERUNG_MS);
    return () => {
      if (timer.current !== null) {
        clearTimeout(timer.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versicherer, beginn, monatsbeitrag, rueckkaufswert, waehrung, vollstaendig]);

  const ampel = ergebnis?.ampel ?? null;
  const zustand: AmpelZustand = ampel !== null ? ampel.ampel : 'aus';
  const kaufbar = ergebnis?.kaufbar === true && (ampel?.ampel === 'gruen' || ampel?.ampel === 'gelb');
  const rkw = parseDecimalDe(rueckkaufswert) ?? 0;
  const ankaufErreicht = ANKAUF_MIN_RUECKKAUFSWERT !== null && rkw >= ANKAUF_MIN_RUECKKAUFSWERT;
  const verkaufenKarte =
    VARIANTE.ankaufHinweis &&
    ampel !== null &&
    (ampel.grund === 'kein-vorteil' || (ampel.grund === 'zu-klein' && ankaufErreicht));

  function zumFunnel() {
    if (!kaufbar || ampel === null) {
      return;
    }
    const draft = ladeDraft();
    speichereDraft({
      ...draft,
      versicherer,
      beginn,
      beginnUngefaehr: false,
      zahlweise: 'monatlich',
      erstbeitrag: monatsbeitrag,
      erstbeitragWaehrung: waehrung,
      beitragArt: 'erster',
      erstbeitragUnbekannt: false,
      rueckkaufswert,
      status: draft.status === '' ? 'laufend' : draft.status,
      startAmpel: ampel.ampel === 'gruen' ? 'gruen' : 'gelb',
      eingereichtAm: '',
    });
    router.push('/rechner');
  }

  return (
    <form
      id="ampel"
      className="ampel-karte karte einstieg"
      onSubmit={(ereignis) => {
        ereignis.preventDefault();
        zumFunnel();
      }}
      noValidate
      aria-labelledby="ampel-karte-titel"
    >
      <h2 id="ampel-karte-titel">Vier Angaben. Dann sehen Sie Ihre Ampel.</h2>
      <div className="felder">
        <TextFeld
          id="ak-versicherer"
          label="Versicherer"
          hilfe={<InfoKnopf feld="versicherer" />}
          wert={versicherer}
          onChange={setVersicherer}
          liste="ak-versicherer-liste"
          platzhalter="Name auf der Police"
          autoComplete="off"
        />
        <datalist id="ak-versicherer-liste">
          {versichererNamen.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <MonatsFeld
          id="ak-beginn"
          label="Vertragsbeginn"
          hilfe={<InfoKnopf feld="beginn" />}
          platzhalter="MM/JJJJ"
          startJahr={2000}
          wert={beginn}
          onChange={setBeginn}
        />
        <TextFeld
          id="ak-monatsbeitrag"
          label="Monatsbeitrag"
          hilfe={<InfoKnopf feld="beitrag" />}
          inputMode="decimal"
          platzhalter={waehrung === 'DM' ? 'erster Beitrag, z. B. 150 DM' : 'z. B. 100 €'}
          wert={monatsbeitrag}
          onChange={setMonatsbeitrag}
          echo={betragEcho(monatsbeitrag, waehrung)}
        />
        {vorEuro && (
          <RadioGruppe
            id="ak-waehrung"
            label="Währung des Beitrags"
            erklaerung="Vor 2002 stand der Beitrag meist in DM."
            nebeneinander
            optionen={[
              { wert: 'DM', label: 'DM' },
              { wert: 'EUR', label: 'Euro' },
            ]}
            wert={waehrungWahl}
            onChange={(wert) => setWaehrungWahl(wert as Waehrung)}
          />
        )}
        <TextFeld
          id="ak-rueckkaufswert"
          label="Rückkaufswert laut Standmitteilung"
          hilfe={<InfoKnopf feld="rueckkaufswert" />}
          inputMode="decimal"
          platzhalter="z. B. 25.000 €"
          wert={rueckkaufswert}
          onChange={setRueckkaufswert}
          echo={betragEcho(rueckkaufswert)}
        />
      </div>

      <div className="ampel-bereich">
        <Ampel zustand={zustand} variante="verkehr" />
        <p className="ampel-kartentext" aria-live="polite">
          {rechnet ? (
            'Wir rechnen …'
          ) : beginnAusserhalb ? (
            <>
              Wir rechnen Verträge mit Beginn {RANGE_TEXT}. Für andere Jahrgänge:{' '}
              <Link href="/anfrage">individuelle Prüfung anfragen</Link>.
            </>
          ) : (
            ampelKartenText(ampel)
          )}
        </p>
      </div>

      {verkaufenKarte ? (
        <VerkaufenKarte einwilligung={einwilligungAnkauf} onEinwilligung={setEinwilligungAnkauf} />
      ) : (
        zustand !== 'grau' &&
        VARIANTE.berichtKostenpflichtig && (
          <div className="kauf-bereich">
            <button type="submit" className="knopf kauf" disabled={!kaufbar} aria-disabled={!kaufbar}>
              {KAUFKNOPF_TEXT}
            </button>
            <p className="erklaerung kauf-unterzeile">{KAUFKNOPF_UNTERZEILE}</p>
          </div>
        )
      )}
      {zustand === 'grau' && !verkaufenKarte && (
        <p className="erklaerung" style={{ margin: 0 }}>
          Lieber persönlich fragen? <Link href="/anfrage">Individuelle Prüfung anfragen</Link>.
        </p>
      )}
      <p className="erklaerung" style={{ textAlign: 'center', margin: '0.75rem 0 0' }}>
        Keine Anmeldung. Für die Ampel rechnet unser Server Ihre vier Angaben durch, ohne sie zu speichern –
        persönliche Daten geben Sie erst mit der Bestellung an.
      </p>
    </form>
  );
}
