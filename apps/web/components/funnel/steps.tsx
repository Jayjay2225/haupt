'use client';

/**
 * Die Bildschirme des Rechner-Assistenten (Prompt 12, 3.2 – umgebaut nach
 * Prompt 14, Abschnitt 2): eine Frage je Bildschirm, „Weiß ich nicht“ überall
 * außer beim Rückkaufswert. Frage, Hilfesatz und „Wo finde ich das?“ rendert
 * RechnerFunnel; hier stehen nur Eingabefelder und feldnahe Hinweise.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BRAND } from '@/config/brand';
import { POST_WERKTAGE_TEXT, ZAHLUNG } from '@/config/business';
import type { CaseDraft, Fehlerliste, Schritt } from '@/lib/draft';
import { UNGEFAEHR_MONAT } from '@/lib/draft';
import { formatDatumDe, formatEuro, parseDatumDe, parseDecimalDe } from '@/lib/format';
import {
  ANREDE_LABEL,
  BELEHRUNG_FORM_LABEL,
  BELEHRUNG_FRIST_LABEL,
  JNU_LABEL,
  ZUSTANDEKOMMEN_LABEL,
} from '@/lib/labels';
import { Preisblock } from '../Preisblock';
import { ZusammenfassungAnsicht } from './Zusammenfassung';
import {
  Kontrollkaestchen,
  MonatsFeld,
  RadioGruppe,
  TextFeld,
  type Option,
} from './fields';

export interface BestellZustand {
  freischaltcode: string;
  setFreischaltcode: (wert: string) => void;
  honig: string;
  setHonig: (wert: string) => void;
  /** Fehler aus der Bestell-API, der keinem Feld zuzuordnen ist. */
  fallFehler?: string | undefined;
}

export interface SchrittProps {
  draft: CaseDraft;
  fehler: Fehlerliste;
  aendere: <K extends keyof CaseDraft>(feld: K, wert: CaseDraft[K]) => void;
  versichererNamen: string[];
  /** Schritt 11: „Angaben ändern“ springt zum jeweiligen Schritt. */
  springeZu?: ((schritt: Schritt) => void) | undefined;
  /** Schritt 11: Freischaltcode, Honigtopf, API-Fehler. */
  bestellung?: BestellZustand | undefined;
}

function betragEcho(eingabe: string, waehrung: 'EUR' | 'DM' = 'EUR'): string | undefined {
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

const TYP_OPTIONEN: Option[] = [
  { wert: 'kapital-lv', label: 'Kapitallebensversicherung' },
  { wert: 'private-rv', label: 'Private Rentenversicherung' },
  { wert: 'fonds-lv', label: 'Fondsgebunden' },
  { wert: 'unbekannt', label: 'Weiß ich nicht' },
];

export function SchrittTyp({ draft, fehler, aendere }: SchrittProps) {
  return (
    <>
      <RadioGruppe
        id="vertragsart"
        label=""
        optionen={TYP_OPTIONEN}
        wert={draft.vertragsart}
        onChange={(wert) => aendere('vertragsart', wert as CaseDraft['vertragsart'])}
        fehler={fehler['vertragsart']}
      />
      {draft.vertragsart === 'unbekannt' && (
        <p className="erklaerung">
          In Ordnung – wir rechnen wie für eine Kapitallebensversicherung (im Gutachten als Annahme
          gekennzeichnet) und fragen per E-Mail nach.
        </p>
      )}
    </>
  );
}

const STATUS_OPTIONEN: Option[] = [
  { wert: 'laufend', label: 'Läuft' },
  { wert: 'beitragsfrei', label: 'Beitragsfrei seit …' },
  { wert: 'gekuendigt', label: 'Gekündigt' },
  { wert: 'abgelaufen', label: 'Ausgezahlt' },
];

export function SchrittStatus({ draft, fehler, aendere }: SchrittProps) {
  return (
    <>
      <RadioGruppe
        id="status"
        label=""
        optionen={STATUS_OPTIONEN}
        wert={draft.status}
        onChange={(wert) => aendere('status', wert as CaseDraft['status'])}
        fehler={fehler['status']}
      />
      {draft.status === 'beitragsfrei' && (
        <MonatsFeld
          id="statusDatum"
          label="Beitragsfrei seit (Monat/Jahr)"
          erklaerung="Steht im Schreiben zur Beitragsfreistellung. Sie können das Feld auch leer lassen."
          startJahr={2015}
          wert={draft.statusDatum}
          onChange={(wert) => aendere('statusDatum', wert)}
          fehler={fehler['statusDatum']}
        />
      )}
    </>
  );
}

export function SchrittVersicherer({ draft, fehler, aendere, versichererNamen }: SchrittProps) {
  return (
    <>
      <TextFeld
        id="versicherer"
        label=""
        platzhalter="Name auf der Police"
        wert={draft.versicherer}
        onChange={(wert) => aendere('versicherer', wert)}
        fehler={fehler['versicherer']}
        liste="versicherer-liste"
        autoComplete="off"
      />
      <datalist id="versicherer-liste">
        {versichererNamen.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
    </>
  );
}

export function SchrittBeginn({ draft, fehler, aendere }: SchrittProps) {
  const [jahrText, setJahrText] = useState(() => (draft.beginnUngefaehr ? draft.beginn.slice(0, 4) : ''));
  return (
    <>
      {!draft.beginnUngefaehr ? (
        <MonatsFeld
          id="beginn"
          label=""
          erklaerung={`Versicherungsbeginn, nicht Antragsdatum. ${BRAND.range.from} bis ${BRAND.range.to}.`}
          startJahr={2000}
          wert={draft.beginn}
          onChange={(wert) => aendere('beginn', wert)}
          fehler={fehler['beginn']}
        />
      ) : (
        <TextFeld
          id="beginnJahr"
          label="Jahr des Vertragsbeginns"
          erklaerung="Nur das Jahr – im Gutachten steht dann „ungefähr“ (gerechnet wird mit der Jahresmitte)."
          inputMode="numeric"
          platzhalter="zum Beispiel 1998"
          wert={jahrText}
          onChange={(wert) => {
            const ziffern = wert.replace(/\D/g, '').slice(0, 4);
            setJahrText(ziffern);
            aendere('beginn', ziffern.length === 4 ? `${ziffern}-${UNGEFAEHR_MONAT}` : '');
          }}
          fehler={fehler['beginn']}
        />
      )}
      <Kontrollkaestchen
        id="beginnUngefaehr"
        label="Weiß nicht genau – ich kenne nur das Jahr."
        angehakt={draft.beginnUngefaehr}
        onChange={(angehakt) => {
          aendere('beginnUngefaehr', angehakt);
          if (angehakt) {
            const jahr = draft.beginn.slice(0, 4);
            setJahrText(jahr);
            aendere('beginn', /^\d{4}$/.test(jahr) ? `${jahr}-${UNGEFAEHR_MONAT}` : '');
          }
        }}
      />
    </>
  );
}

const ZAHLWEISE_OPTIONEN: Option[] = [
  { wert: 'monatlich', label: 'monatlich' },
  { wert: 'vierteljaehrlich', label: 'vierteljährlich' },
  { wert: 'halbjaehrlich', label: 'halbjährlich' },
  { wert: 'jaehrlich', label: 'jährlich' },
  { wert: 'einmalbeitrag', label: 'Einmalbeitrag' },
];

export function SchrittBeitrag({ draft, fehler, aendere }: SchrittProps) {
  const vorEuro = draft.beginn !== '' && draft.beginn < '2002-01';
  const heutiger = draft.beitragArt === 'heutiger';
  // Vor 2002 stand der erste Beitrag in DM – Vorauswahl DM, umschaltbar; der heutige Beitrag ist in Euro.
  useEffect(() => {
    if (vorEuro && !heutiger && draft.erstbeitrag === '' && draft.erstbeitragWaehrung === 'EUR') {
      aendere('erstbeitragWaehrung', 'DM');
    }
    if (heutiger && draft.erstbeitragWaehrung === 'DM') {
      aendere('erstbeitragWaehrung', 'EUR');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vorEuro, heutiger]);
  return (
    <>
      {!draft.erstbeitragUnbekannt && (
        <>
          <TextFeld
            id="erstbeitrag"
            label=""
            inputMode="decimal"
            platzhalter={draft.erstbeitragWaehrung === 'DM' ? 'zum Beispiel 150' : 'zum Beispiel 100'}
            wert={draft.erstbeitrag}
            onChange={(wert) => aendere('erstbeitrag', wert)}
            fehler={fehler['erstbeitrag']}
            echo={betragEcho(draft.erstbeitrag, draft.erstbeitragWaehrung)}
          />
          <RadioGruppe
            id="beitragArt"
            label="Das ist mein …"
            nebeneinander
            optionen={[
              { wert: 'erster', label: 'erster Beitrag' },
              { wert: 'heutiger', label: 'heutiger Beitrag' },
            ]}
            wert={draft.beitragArt}
            onChange={(wert) => aendere('beitragArt', wert as CaseDraft['beitragArt'])}
          />
          {vorEuro && !heutiger && (
            <RadioGruppe
              id="erstbeitragWaehrung"
              label="Währung"
              erklaerung="Vor 2002 stand der Beitrag meist in DM."
              nebeneinander
              optionen={[
                { wert: 'DM', label: 'DM' },
                { wert: 'EUR', label: 'Euro' },
              ]}
              wert={draft.erstbeitragWaehrung}
              onChange={(wert) => aendere('erstbeitragWaehrung', wert as CaseDraft['erstbeitragWaehrung'])}
            />
          )}
          <RadioGruppe
            id="zahlweise"
            label="Gezahlt wurde …"
            nebeneinander
            optionen={ZAHLWEISE_OPTIONEN}
            wert={draft.zahlweise}
            onChange={(wert) => aendere('zahlweise', wert as CaseDraft['zahlweise'])}
          />
        </>
      )}
      <Kontrollkaestchen
        id="erstbeitragUnbekannt"
        label="Weiß ich nicht."
        angehakt={draft.erstbeitragUnbekannt}
        onChange={(angehakt) => aendere('erstbeitragUnbekannt', angehakt)}
      />
      {draft.erstbeitragUnbekannt && (
        <p className="erklaerung">
          Dann brauchen wir in Schritt 7 die Summe der gezahlten Beiträge aus der Standmitteilung –
          sonst bitte in der Police nachsehen.
        </p>
      )}
    </>
  );
}

export function SchrittDynamik({ draft, fehler, aendere }: SchrittProps) {
  return (
    <>
      <RadioGruppe
        id="dynamik"
        label=""
        nebeneinander
        optionen={[
          { wert: 'nein', label: 'Nein' },
          { wert: 'ja', label: 'Ja' },
          { wert: 'unbekannt', label: 'Weiß ich nicht' },
        ]}
        wert={draft.dynamik}
        onChange={(wert) => aendere('dynamik', wert as CaseDraft['dynamik'])}
        fehler={fehler['dynamik']}
      />
      {draft.dynamik === 'ja' && (
        <TextFeld
          id="dynamikSatz"
          label="… % pro Jahr"
          erklaerung="Meist 3, 5 oder 10 %."
          inputMode="decimal"
          platzhalter="zum Beispiel 5"
          wert={draft.dynamikSatz}
          onChange={(wert) => aendere('dynamikSatz', wert)}
          fehler={fehler['dynamikSatz']}
        />
      )}
      {draft.dynamik === 'unbekannt' && (
        <p className="erklaerung">Wir rechnen ohne Dynamik und weisen das im Gutachten als Annahme aus.</p>
      )}
    </>
  );
}

export function SchrittBeitragssumme({ draft, fehler, aendere }: SchrittProps) {
  return (
    <TextFeld
      id="gesamtsummeLautMitteilung"
      label=""
      erklaerung={
        draft.erstbeitragUnbekannt
          ? 'Ohne ersten Beitrag ist diese Summe die Grundlage der Rechnung.'
          : 'Falls die Standmitteilung eine Summe der eingezahlten Beiträge nennt. Sie können diesen Schritt überspringen.'
      }
      inputMode="decimal"
      platzhalter="zum Beispiel 24.000"
      wert={draft.gesamtsummeLautMitteilung}
      onChange={(wert) => aendere('gesamtsummeLautMitteilung', wert)}
      fehler={fehler['gesamtsummeLautMitteilung']}
      echo={betragEcho(draft.gesamtsummeLautMitteilung)}
    />
  );
}

export function SchrittRueckkaufswert({ draft, fehler, aendere }: SchrittProps) {
  return (
    <TextFeld
      id="rueckkaufswert"
      label=""
      erklaerung="Pflichtangabe – ohne sie können wir nicht prüfen, ob wir übernehmen."
      inputMode="decimal"
      platzhalter="zum Beispiel 25.000"
      wert={draft.rueckkaufswert}
      onChange={(wert) => aendere('rueckkaufswert', wert)}
      fehler={fehler['rueckkaufswert']}
      echo={betragEcho(draft.rueckkaufswert)}
    />
  );
}

export function SchrittAuszahlungen({ draft, fehler, aendere }: SchrittProps) {
  function aendereEintrag(index: number, feld: 'monat' | 'betrag', wert: string) {
    const liste = draft.auszahlungenListe.map((e, i) => (i === index ? { ...e, [feld]: wert } : e));
    aendere('auszahlungenListe', liste);
  }
  function entferneEintrag(index: number) {
    aendere(
      'auszahlungenListe',
      draft.auszahlungenListe.filter((_, i) => i !== index),
    );
  }
  return (
    <>
      <RadioGruppe
        id="auszahlungenErhalten"
        label=""
        erklaerung="Gemeint sind Teilauszahlungen, Vorschüsse oder ein Policendarlehen – nicht der Rückkaufswert selbst."
        nebeneinander
        optionen={[
          { wert: 'nein', label: 'Nein' },
          { wert: 'ja', label: 'Ja' },
          { wert: 'unbekannt', label: 'Weiß ich nicht' },
        ]}
        wert={draft.auszahlungenErhalten}
        onChange={(wert) => {
          aendere('auszahlungenErhalten', wert as CaseDraft['auszahlungenErhalten']);
          if (wert === 'ja' && draft.auszahlungenListe.length === 0) {
            aendere('auszahlungenListe', [{ monat: '', betrag: '' }]);
          }
        }}
        fehler={fehler['auszahlungenErhalten']}
      />
      {draft.auszahlungenErhalten === 'unbekannt' && (
        <p className="erklaerung">Wir rechnen ohne Auszahlungen und weisen das im Gutachten als Annahme aus.</p>
      )}
      {draft.auszahlungenErhalten === 'ja' && (
        <>
          {fehler['auszahlungenListe'] !== undefined && (
            <p className="feld-fehler">{fehler['auszahlungenListe']}</p>
          )}
          {draft.auszahlungenListe.map((eintrag, index) => (
            <div className="auszahlung-zeile" key={index}>
              <MonatsFeld
                id={`auszahlung-${index}-monat`}
                label={`Auszahlung ${index + 1}: Monat/Jahr`}
                startJahr={2015}
                wert={eintrag.monat}
                onChange={(wert) => aendereEintrag(index, 'monat', wert)}
                fehler={fehler[`auszahlung-${index}-monat`]}
              />
              <TextFeld
                id={`auszahlung-${index}-betrag`}
                label="Betrag"
                inputMode="decimal"
                platzhalter="zum Beispiel 5.000"
                wert={eintrag.betrag}
                onChange={(wert) => aendereEintrag(index, 'betrag', wert)}
                fehler={fehler[`auszahlung-${index}-betrag`]}
                echo={betragEcho(eintrag.betrag)}
              />
              {draft.auszahlungenListe.length > 1 && (
                <button type="button" className="knopf zweitrangig klein" onClick={() => entferneEintrag(index)}>
                  Entfernen
                </button>
              )}
            </div>
          ))}
          {draft.auszahlungenListe.length < 20 && (
            <p>
              <button
                type="button"
                className="knopf zweitrangig klein"
                onClick={() => aendere('auszahlungenListe', [...draft.auszahlungenListe, { monat: '', betrag: '' }])}
              >
                Weitere Auszahlung hinzufügen
              </button>
            </p>
          )}
        </>
      )}
    </>
  );
}

/** Eignungs-Check (nur Kanzlei-Variante, Modell C). */
export function SchrittEignung({ draft, fehler, aendere }: SchrittProps) {
  const jnuOptionen: Option[] = Object.entries(JNU_LABEL).map(([wert, label]) => ({ wert, label }));
  return (
    <>
      <RadioGruppe
        id="zustandekommen"
        label="Wie kam der Vertrag zustande?"
        optionen={Object.entries(ZUSTANDEKOMMEN_LABEL).map(([wert, label]) => ({ wert, label }))}
        wert={draft.zustandekommen}
        onChange={(wert) => aendere('zustandekommen', wert as CaseDraft['zustandekommen'])}
        fehler={fehler['zustandekommen']}
      />
      <RadioGruppe
        id="belehrungVorhanden"
        label="Gab es eine Belehrung über Widerspruch/Widerruf/Rücktritt?"
        optionen={jnuOptionen}
        wert={draft.belehrungVorhanden}
        onChange={(wert) => aendere('belehrungVorhanden', wert as CaseDraft['belehrungVorhanden'])}
        fehler={fehler['belehrungVorhanden']}
      />
      {draft.belehrungVorhanden === 'ja' && (
        <>
          <RadioGruppe
            id="belehrungFrist"
            label="Welche Frist nennt die Belehrung?"
            optionen={Object.entries(BELEHRUNG_FRIST_LABEL).map(([wert, label]) => ({ wert, label }))}
            wert={draft.belehrungFrist}
            onChange={(wert) => aendere('belehrungFrist', wert as CaseDraft['belehrungFrist'])}
            fehler={fehler['belehrungFrist']}
          />
          <RadioGruppe
            id="belehrungForm"
            label="Welche Form verlangt die Belehrung?"
            optionen={Object.entries(BELEHRUNG_FORM_LABEL).map(([wert, label]) => ({ wert, label }))}
            wert={draft.belehrungForm}
            onChange={(wert) => aendere('belehrungForm', wert as CaseDraft['belehrungForm'])}
            fehler={fehler['belehrungForm']}
          />
          <RadioGruppe
            id="hervorhebung"
            label="Ist die Belehrung drucktechnisch hervorgehoben?"
            optionen={jnuOptionen}
            wert={draft.hervorhebung}
            onChange={(wert) => aendere('hervorhebung', wert as CaseDraft['hervorhebung'])}
            fehler={fehler['hervorhebung']}
          />
        </>
      )}
      <RadioGruppe
        id="abgetretenOderBeliehen"
        label="Wurde der Vertrag abgetreten oder beliehen?"
        optionen={jnuOptionen}
        wert={draft.abgetretenOderBeliehen}
        onChange={(wert) => aendere('abgetretenOderBeliehen', wert as CaseDraft['abgetretenOderBeliehen'])}
        fehler={fehler['abgetretenOderBeliehen']}
      />
    </>
  );
}

/** Schritt 10 „Über Sie“ (Prompt 14, 2): Rechnung, Postversand, Risikoanteil. */
export function SchrittPerson({ draft, fehler, aendere }: SchrittProps) {
  const [geburtsText, setGeburtsText] = useState(() => formatDatumDe(draft.geburtsdatum));
  const erkannt = parseDatumDe(geburtsText);
  return (
    <>
      <RadioGruppe
        id="anrede"
        label="Anrede"
        nebeneinander
        optionen={Object.entries(ANREDE_LABEL).map(([wert, label]) => ({ wert, label }))}
        wert={draft.anrede}
        onChange={(wert) => aendere('anrede', wert as CaseDraft['anrede'])}
        fehler={fehler['anrede']}
      />
      <TextFeld id="vorname" label="Vorname" autoComplete="given-name" wert={draft.vorname} onChange={(w) => aendere('vorname', w)} fehler={fehler['vorname']} />
      <TextFeld id="nachname" label="Nachname" autoComplete="family-name" wert={draft.nachname} onChange={(w) => aendere('nachname', w)} fehler={fehler['nachname']} />
      <TextFeld
        id="geburtsdatum"
        label="Geburtsdatum"
        inputMode="numeric"
        platzhalter="TT.MM.JJJJ"
        autoComplete="bday"
        wert={geburtsText}
        onChange={(wert) => {
          setGeburtsText(wert);
          aendere('geburtsdatum', parseDatumDe(wert) ?? '');
        }}
        echo={erkannt !== null ? `Gelesen als ${formatDatumDe(erkannt)}` : undefined}
        fehler={fehler['geburtsdatum']}
      />
      <TextFeld id="strasse" label="Straße und Hausnummer" autoComplete="street-address" wert={draft.strasse} onChange={(w) => aendere('strasse', w)} fehler={fehler['strasse']} />
      <TextFeld id="plz" label="PLZ" inputMode="numeric" autoComplete="postal-code" wert={draft.plz} onChange={(w) => aendere('plz', w)} fehler={fehler['plz']} />
      <TextFeld id="ort" label="Ort" autoComplete="address-level2" wert={draft.ort} onChange={(w) => aendere('ort', w)} fehler={fehler['ort']} />
      <TextFeld
        id="email"
        label="E-Mail-Adresse"
        erklaerung="Dorthin schicken wir Rechnung und Gutachten."
        typ="email"
        inputMode="email"
        autoComplete="email"
        platzhalter="name@beispiel.de"
        wert={draft.email}
        onChange={(wert) => aendere('email', wert)}
        fehler={fehler['email']}
      />
      <TextFeld id="telefon" label="Telefon (optional)" typ="tel" inputMode="tel" autoComplete="tel" wert={draft.telefon} onChange={(w) => aendere('telefon', w)} fehler={fehler['telefon']} />
    </>
  );
}

const SCHRITT_FUER_FELD: Record<string, Schritt> = {
  Vertrag: 'typ',
  'Beiträge und Werte': 'beitrag',
  'Über Sie': 'person',
};

/** Schritt 11 „Ihre Bestellung“ (Prompt 14, 2): Zusammenfassung, Preisblock, Post, Einwilligungen. */
export function SchrittBestellung({ draft, fehler, aendere, springeZu, bestellung }: SchrittProps) {
  return (
    <>
      <ZusammenfassungAnsicht draft={draft} />
      {springeZu !== undefined && (
        <p className="erklaerung">
          Stimmt etwas nicht?{' '}
          {Object.entries(SCHRITT_FUER_FELD).map(([titel, schritt], index) => (
            <span key={schritt}>
              {index > 0 ? ' · ' : ''}
              <button type="button" className="link-knopf" onClick={() => springeZu(schritt)}>
                {titel} ändern
              </button>
            </span>
          ))}
        </p>
      )}

      <h2>Preis</h2>
      <Preisblock kompakt />
      <p className="erklaerung">
        Zahlung vorab: {ZAHLUNG.wege.join(', ')} – abgewickelt über {ZAHLUNG.abwicklung}. {ZAHLUNG.lieferung}
      </p>

      <Kontrollkaestchen
        id="postversand"
        label={`Gutachten zusätzlich per Post (kostenlos, ${POST_WERKTAGE_TEXT})`}
        angehakt={draft.postversand}
        onChange={(angehakt) => aendere('postversand', angehakt)}
      />

      {bestellung !== undefined && (
        <TextFeld
          id="freischaltcode"
          label="Freischaltcode (Erstkunden-Programm, freiwillig)"
          wert={bestellung.freischaltcode}
          onChange={bestellung.setFreischaltcode}
          autoComplete="off"
          erklaerung="Mit gültigem Code ist das Gutachten kostenlos; im Gegenzug bitten wir um Ihr Feedback."
        />
      )}

      <h2>Einwilligungen</h2>
      <Kontrollkaestchen
        id="einwilligungDatenschutz"
        label={
          <>
            Ich habe die <Link href="/datenschutz">Datenschutzerklärung</Link> gelesen und bin einverstanden,
            dass meine Angaben für Berechnung, Rechnung und Versand verarbeitet werden.
          </>
        }
        angehakt={draft.einwilligungDatenschutz}
        onChange={(angehakt) => aendere('einwilligungDatenschutz', angehakt)}
        fehler={fehler['einwilligungDatenschutz']}
      />
      <Kontrollkaestchen
        id="agbGelesen"
        label={
          <>
            Ich habe die <Link href="/agb">AGB</Link> und die <Link href="/widerrufsbelehrung">Widerrufsbelehrung</Link>{' '}
            gelesen.
          </>
        }
        angehakt={draft.agbGelesen}
        onChange={(angehakt) => aendere('agbGelesen', angehakt)}
        fehler={fehler['agbGelesen']}
      />
      <Kontrollkaestchen
        id="ausfuehrungZugestimmt"
        label="Ich möchte, dass das Gutachten (digitaler Inhalt) sofort erstellt wird. Mir ist bekannt: Mit Beginn der Erstellung erlischt mein Widerrufsrecht."
        angehakt={draft.ausfuehrungZugestimmt}
        onChange={(angehakt) => aendere('ausfuehrungZugestimmt', angehakt)}
        fehler={fehler['ausfuehrungZugestimmt']}
      />
      {bestellung !== undefined && (
        <div className="honigtopf" aria-hidden="true">
          <label htmlFor="firma_webseite">Firmen-Webseite (bitte leer lassen)</label>
          <input
            id="firma_webseite"
            name="firma_webseite"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={bestellung.honig}
            onChange={(e) => bestellung.setHonig(e.target.value)}
          />
        </div>
      )}
      {bestellung?.fallFehler !== undefined && (
        <div className="hinweis" role="alert">
          <p style={{ margin: 0 }}>{bestellung.fallFehler}</p>
        </div>
      )}
      <p className="erklaerung">
        Ihre Rechnungsadresse fragt die Zahlungsseite noch einmal ab. Zur Abwicklung übermitteln wir Name und
        E-Mail-Adresse an {ZAHLUNG.abwicklung}; mehr dazu in der <Link href="/datenschutz">Datenschutzerklärung</Link>.
      </p>
    </>
  );
}
