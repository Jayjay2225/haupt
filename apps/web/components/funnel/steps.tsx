'use client';

/**
 * Die Bildschirme des Rechner-Assistenten (Prompt 12, Abschnitt 3.2):
 * eine Frage je Bildschirm. Die Frage selbst rendert RechnerFunnel
 * (SCHRITT_FRAGE); hier stehen nur Eingabefeld und Hilfetext.
 */
import { useEffect } from 'react';
import { BRAND } from '@/config/brand';
import type { CaseDraft } from '@/lib/draft';
import type { Fehlerliste } from '@/lib/draft';
import { formatEuro, parseDecimalDe } from '@/lib/format';
import {
  BELEHRUNG_FORM_LABEL,
  BELEHRUNG_FRIST_LABEL,
  JNU_LABEL,
  ZUSTANDEKOMMEN_LABEL,
} from '@/lib/labels';
import {
  Kontrollkaestchen,
  MonatsFeld,
  RadioGruppe,
  TextFeld,
  type Option,
} from './fields';

export interface SchrittProps {
  draft: CaseDraft;
  fehler: Fehlerliste;
  aendere: <K extends keyof CaseDraft>(feld: K, wert: CaseDraft[K]) => void;
  versichererNamen: string[];
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
    <RadioGruppe
      id="vertragsart"
      label=""
      erklaerung="Steht oben auf der Police."
      optionen={TYP_OPTIONEN}
      wert={draft.vertragsart}
      onChange={(wert) => aendere('vertragsart', wert as CaseDraft['vertragsart'])}
      fehler={fehler['vertragsart']}
    />
  );
}

const STATUS_OPTIONEN: Option[] = [
  { wert: 'laufend', label: 'Ja' },
  { wert: 'gekuendigt', label: 'Gekündigt' },
  { wert: 'beitragsfrei', label: 'Beitragsfrei' },
  { wert: 'abgelaufen', label: 'Ausgezahlt' },
];

export function SchrittStatus({ draft, fehler, aendere }: SchrittProps) {
  const beendet = draft.status === 'gekuendigt' || draft.status === 'abgelaufen';
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
      {beendet && (
        <MonatsFeld
          id="statusDatum"
          label="Wann war das? (Monat/Jahr, hilft der Genauigkeit)"
          erklaerung="Steht auf der Abrechnung. Sie können das Feld auch leer lassen."
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
        erklaerung="Steht auf jeder Standmitteilung."
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
  return (
    <MonatsFeld
      id="beginn"
      label=""
      erklaerung={`Versicherungsbeginn, nicht Antragsdatum. ${BRAND.range.from} bis ${BRAND.range.to}.`}
      startJahr={2000}
      wert={draft.beginn}
      onChange={(wert) => aendere('beginn', wert)}
      fehler={fehler['beginn']}
    />
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
  // Vor 2002 stand der Beitrag in DM – Vorauswahl DM, umschaltbar.
  useEffect(() => {
    if (vorEuro && draft.erstbeitrag === '' && draft.erstbeitragWaehrung === 'EUR') {
      aendere('erstbeitragWaehrung', 'DM');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vorEuro]);
  return (
    <>
      <TextFeld
        id="erstbeitrag"
        label=""
        erklaerung="Der Beitrag aus dem ersten Vertragsjahr – er steht in der Police."
        inputMode="decimal"
        platzhalter={draft.erstbeitragWaehrung === 'DM' ? 'zum Beispiel 150' : 'zum Beispiel 100'}
        wert={draft.erstbeitrag}
        onChange={(wert) => aendere('erstbeitrag', wert)}
        fehler={fehler['erstbeitrag']}
        echo={betragEcho(draft.erstbeitrag, draft.erstbeitragWaehrung)}
      />
      {vorEuro && (
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
  );
}

export function SchrittDynamik({ draft, fehler, aendere }: SchrittProps) {
  return (
    <>
      <RadioGruppe
        id="dynamik"
        label=""
        erklaerung="Dynamik heißt: Der Beitrag stieg jedes Jahr automatisch."
        nebeneinander
        optionen={[
          { wert: 'nein', label: 'Nein' },
          { wert: 'ja', label: 'Ja' },
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
    </>
  );
}

export function SchrittBeitragssumme({ draft, fehler, aendere }: SchrittProps) {
  return (
    <TextFeld
      id="gesamtsummeLautMitteilung"
      label=""
      erklaerung="Falls die Standmitteilung eine Summe der eingezahlten Beiträge nennt. Sie können diesen Schritt überspringen."
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
  const beendet = draft.status === 'gekuendigt' || draft.status === 'abgelaufen';
  return (
    <TextFeld
      id="rueckkaufswert"
      label=""
      erklaerung={
        beendet
          ? 'Die wichtigste Zahl. Bei beendeten Verträgen: der ausgezahlte Betrag laut Abrechnung.'
          : 'Die wichtigste Zahl. Steht in der letzten Standmitteilung.'
      }
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
        erklaerung="Gemeint sind Teilauszahlungen oder Gewinnentnahmen während der Laufzeit – nicht der Rückkaufswert selbst."
        nebeneinander
        optionen={[
          { wert: 'nein', label: 'Nein' },
          { wert: 'ja', label: 'Ja' },
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

export function SchrittKontakt({ draft, fehler, aendere }: SchrittProps) {
  return (
    <>
      <TextFeld
        id="email"
        label="E-Mail-Adresse"
        erklaerung="Dorthin schicken wir den Link zu Ihrem Ergebnis. Der Link ist 30 Tage gültig."
        typ="email"
        inputMode="email"
        autoComplete="email"
        platzhalter="name@beispiel.de"
        wert={draft.email}
        onChange={(wert) => aendere('email', wert)}
        fehler={fehler['email']}
      />
      <RadioGruppe
        id="kontaktWunsch"
        label="Wie möchten Sie kontaktiert werden?"
        nebeneinander
        optionen={[
          { wert: 'email', label: 'E-Mail' },
          { wert: 'telefon', label: 'Telefon' },
        ]}
        wert={draft.kontaktWunsch}
        onChange={(wert) => aendere('kontaktWunsch', wert as CaseDraft['kontaktWunsch'])}
        fehler={fehler['kontaktWunsch']}
      />
      <TextFeld
        id="telefon"
        label={draft.kontaktWunsch === 'telefon' ? 'Telefon' : 'Telefon (freiwillig)'}
        typ="tel"
        inputMode="tel"
        autoComplete="tel"
        wert={draft.telefon}
        onChange={(wert) => aendere('telefon', wert)}
        fehler={fehler['telefon']}
      />
      <Kontrollkaestchen
        id="einwilligungDatenschutz"
        label={
          <>
            Ich habe die <a href="/datenschutz">Datenschutzerklärung</a> gelesen und bin einverstanden,
            dass meine Angaben für die Berechnung verarbeitet werden.
          </>
        }
        angehakt={draft.einwilligungDatenschutz}
        onChange={(angehakt) => aendere('einwilligungDatenschutz', angehakt)}
        fehler={fehler['einwilligungDatenschutz']}
      />
      <Kontrollkaestchen
        id="rechtsschutz"
        label="Ich habe eine Rechtsschutzversicherung. (freiwillig – Ihr Bericht enthält dann die passenden Hinweise)"
        angehakt={draft.rechtsschutz}
        onChange={(angehakt) => aendere('rechtsschutz', angehakt)}
      />
    </>
  );
}
