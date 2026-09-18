'use client';

/**
 * Die sechs Schritte des Rechner-Formulars (Prompt 6: Kontakt → Vertrag →
 * Beiträge → Werte → Eignungs-Check → Zusammenfassung). Hier wird nur
 * erfasst und erklärt – bewertet wird nichts (Eignungs-Check-Logik folgt mit
 * Prompt 4, Berechnung mit Prompt 3).
 */
import Link from 'next/link';
import type { CaseDraft, Fehlerliste } from '@/lib/draft';
import { formatEuro, parseDecimalDe } from '@/lib/format';
import {
  BELEHRUNG_FORM_LABEL,
  BELEHRUNG_FRIST_LABEL,
  JNU_LABEL,
  STATUS_LABEL,
  VERTRAGSART_LABEL,
  ZAHLWEISE_LABEL,
  ZUSTANDEKOMMEN_LABEL,
} from '@/lib/labels';
import { AuswahlFeld, Kontrollkaestchen, RadioGruppe, TextFeld, type Option } from './fields';
import { ZusammenfassungAnsicht } from './Zusammenfassung';

export interface SchrittProps {
  draft: CaseDraft;
  fehler: Fehlerliste;
  aendere: <K extends keyof CaseDraft>(feld: K, wert: CaseDraft[K]) => void;
  /** Namensliste (inkl. Altnamen) aus data/insurers.json für das Autocomplete. */
  versichererNamen: string[];
}

function optionen<T extends string>(labels: Record<T, string>): Option[] {
  return (Object.keys(labels) as T[]).map((wert) => ({ wert, label: labels[wert] }));
}

const JNU_OPTIONEN = optionen(JNU_LABEL);

const dmFormat = new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function betragEcho(eingabe: string, waehrung: 'EUR' | 'DM' = 'EUR'): string | undefined {
  if (eingabe.trim() === '') {
    return undefined;
  }
  const wert = parseDecimalDe(eingabe);
  if (wert === null) {
    return undefined;
  }
  return waehrung === 'EUR'
    ? `Erkannt: ${formatEuro(wert)}`
    : `Erkannt: ${dmFormat.format(wert)} DM`;
}

export function SchrittKontakt({ draft, fehler, aendere }: SchrittProps) {
  return (
    <>
      <p>
        Ihre Kontaktdaten verwenden wir für Rückfragen und die Zustellung des Ergebnisses.
        Einzelheiten regelt die <Link href="/datenschutz">Datenschutzerklärung</Link>.
      </p>
      <TextFeld
        id="name"
        label="Vor- und Nachname"
        wert={draft.name}
        onChange={(wert) => aendere('name', wert)}
        fehler={fehler['name']}
        autoComplete="name"
      />
      <TextFeld
        id="email"
        label="E-Mail-Adresse"
        typ="email"
        inputMode="email"
        wert={draft.email}
        onChange={(wert) => aendere('email', wert)}
        fehler={fehler['email']}
        autoComplete="email"
      />
      <TextFeld
        id="telefon"
        label="Telefon (optional)"
        typ="tel"
        inputMode="tel"
        wert={draft.telefon}
        onChange={(wert) => aendere('telefon', wert)}
        fehler={fehler['telefon']}
        autoComplete="tel"
      />
    </>
  );
}

export function SchrittVertrag({ draft, fehler, aendere, versichererNamen }: SchrittProps) {
  const statusDatumLabel =
    draft.status === 'gekuendigt'
      ? 'Gekündigt zum (Monat/Jahr)'
      : draft.status === 'abgelaufen'
        ? 'Abgelaufen zum (Monat/Jahr)'
        : 'Beitragsfrei seit (Monat/Jahr)';

  return (
    <>
      <TextFeld
        id="versicherer"
        label="Versicherer"
        erklaerung="Tippen Sie den Namen, der auf Ihrer Police steht – auch frühere Gesellschaftsnamen sind richtig, wir ordnen sie zu."
        wert={draft.versicherer}
        onChange={(wert) => aendere('versicherer', wert)}
        fehler={fehler['versicherer']}
        liste="versicherer-liste"
      />
      <datalist id="versicherer-liste">
        {versichererNamen.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      <AuswahlFeld
        id="vertragsart"
        label="Vertragsart"
        erklaerung="Steht meist oben auf der Police oder der Standmitteilung."
        wert={draft.vertragsart}
        onChange={(wert) => aendere('vertragsart', wert as CaseDraft['vertragsart'])}
        optionen={optionen(VERTRAGSART_LABEL)}
        fehler={fehler['vertragsart']}
      />
      <TextFeld
        id="beginn"
        label="Vertragsbeginn (Monat/Jahr)"
        typ="month"
        wert={draft.beginn}
        onChange={(wert) => aendere('beginn', wert)}
        fehler={fehler['beginn']}
      />
      <TextFeld
        id="ende"
        label="Geplantes Vertragsende (Monat/Jahr, optional)"
        typ="month"
        wert={draft.ende}
        onChange={(wert) => aendere('ende', wert)}
        fehler={fehler['ende']}
      />
      <AuswahlFeld
        id="status"
        label="Wie ist der Stand des Vertrags heute?"
        wert={draft.status}
        onChange={(wert) => aendere('status', wert as CaseDraft['status'])}
        optionen={optionen(STATUS_LABEL)}
        fehler={fehler['status']}
      />
      {draft.status !== '' && draft.status !== 'laufend' && (
        <TextFeld
          id="statusDatum"
          label={statusDatumLabel}
          typ="month"
          wert={draft.statusDatum}
          onChange={(wert) => aendere('statusDatum', wert)}
          fehler={fehler['statusDatum']}
        />
      )}
    </>
  );
}

export function SchrittBeitraege({ draft, fehler, aendere }: SchrittProps) {
  return (
    <>
      <p>
        Es genügt, was Sie zur Hand haben: Erstbeitrag <em>oder</em> aktueller Beitrag.
        Fehlende Angaben werden später aus Ihren Unterlagen ergänzt.
      </p>
      <AuswahlFeld
        id="zahlweise"
        label="Zahlweise"
        wert={draft.zahlweise}
        onChange={(wert) => aendere('zahlweise', wert as CaseDraft['zahlweise'])}
        optionen={optionen(ZAHLWEISE_LABEL)}
        fehler={fehler['zahlweise']}
      />
      <TextFeld
        id="erstbeitrag"
        label="Erstbeitrag (je Zahlungsperiode)"
        erklaerung="Der Beitrag zu Vertragsbeginn. Bei Verträgen vor 2002 gern in DM – wir rechnen mit dem amtlichen Kurs 1,95583 um."
        inputMode="decimal"
        platzhalter="z. B. 1.200,00"
        wert={draft.erstbeitrag}
        onChange={(wert) => aendere('erstbeitrag', wert)}
        fehler={fehler['erstbeitrag']}
        echo={betragEcho(draft.erstbeitrag, draft.erstbeitragWaehrung)}
      />
      <RadioGruppe
        id="erstbeitragWaehrung"
        label="Währung des Erstbeitrags"
        wert={draft.erstbeitragWaehrung}
        onChange={(wert) => aendere('erstbeitragWaehrung', wert as CaseDraft['erstbeitragWaehrung'])}
        optionen={[
          { wert: 'EUR', label: 'Euro' },
          { wert: 'DM', label: 'DM' },
        ]}
        nebeneinander
      />
      <TextFeld
        id="aktuellerBeitrag"
        label="Aktueller Beitrag (je Zahlungsperiode, optional)"
        inputMode="decimal"
        wert={draft.aktuellerBeitrag}
        onChange={(wert) => aendere('aktuellerBeitrag', wert)}
        fehler={fehler['aktuellerBeitrag']}
        echo={betragEcho(draft.aktuellerBeitrag)}
      />
      <RadioGruppe
        id="dynamik"
        label="Hat der Vertrag eine Beitragsdynamik?"
        erklaerung="Bei einer Dynamik steigt der Beitrag regelmäßig, meist jährlich um einen festen Prozentsatz."
        wert={draft.dynamik}
        onChange={(wert) => aendere('dynamik', wert as CaseDraft['dynamik'])}
        optionen={JNU_OPTIONEN}
        nebeneinander
        fehler={fehler['dynamik']}
      />
      <TextFeld
        id="gesamtsummeLautMitteilung"
        label="Eingezahlte Gesamtsumme laut Standmitteilung (optional)"
        erklaerung="Falls Ihre Standmitteilung die Summe aller gezahlten Beiträge nennt, tragen Sie sie hier ein – das macht die Schätzung genauer."
        inputMode="decimal"
        wert={draft.gesamtsummeLautMitteilung}
        onChange={(wert) => aendere('gesamtsummeLautMitteilung', wert)}
        fehler={fehler['gesamtsummeLautMitteilung']}
        echo={betragEcho(draft.gesamtsummeLautMitteilung)}
      />
      <TextFeld
        id="beitragszahlungBis"
        label="Beiträge gezahlt bis (Monat/Jahr, optional)"
        erklaerung="Nur nötig, wenn die Beitragszahlung vor dem Vertragsende endet oder endete."
        typ="month"
        wert={draft.beitragszahlungBis}
        onChange={(wert) => aendere('beitragszahlungBis', wert)}
        fehler={fehler['beitragszahlungBis']}
      />
    </>
  );
}

export function SchrittWerte({ draft, fehler, aendere }: SchrittProps) {
  return (
    <>
      <TextFeld
        id="rueckkaufswert"
        label="Aktueller Rückkaufswert (optional)"
        erklaerung="Steht in der aktuellen Standmitteilung oder – bei gekündigten Verträgen – in der Abrechnung des Versicherers."
        inputMode="decimal"
        wert={draft.rueckkaufswert}
        onChange={(wert) => aendere('rueckkaufswert', wert)}
        fehler={fehler['rueckkaufswert']}
        echo={betragEcho(draft.rueckkaufswert)}
      />
      <RadioGruppe
        id="auszahlungenErhalten"
        label="Haben Sie aus dem Vertrag bereits Auszahlungen erhalten?"
        erklaerung="Zum Beispiel Teilauszahlungen, Gewinnentnahmen oder den Rückkaufswert nach einer Kündigung."
        wert={draft.auszahlungenErhalten}
        onChange={(wert) => aendere('auszahlungenErhalten', wert as CaseDraft['auszahlungenErhalten'])}
        optionen={JNU_OPTIONEN}
        nebeneinander
        fehler={fehler['auszahlungenErhalten']}
      />
      {draft.auszahlungenErhalten === 'ja' && (
        <TextFeld
          id="auszahlungenSumme"
          label="Summe der erhaltenen Auszahlungen"
          erklaerung="Eine Schätzung genügt für den Anfang; Datum und Einzelbeträge werden für den Bericht nacherfasst."
          inputMode="decimal"
          wert={draft.auszahlungenSumme}
          onChange={(wert) => aendere('auszahlungenSumme', wert)}
          fehler={fehler['auszahlungenSumme']}
          echo={betragEcho(draft.auszahlungenSumme)}
        />
      )}
      <RadioGruppe
        id="policendarlehen"
        label="Besteht oder bestand ein Policendarlehen?"
        erklaerung="Ein Darlehen des Versicherers, das mit dem Vertragsguthaben besichert ist."
        wert={draft.policendarlehen}
        onChange={(wert) => aendere('policendarlehen', wert as CaseDraft['policendarlehen'])}
        optionen={JNU_OPTIONEN}
        nebeneinander
        fehler={fehler['policendarlehen']}
      />
      <RadioGruppe
        id="buzEnthalten"
        label="Ist eine Berufsunfähigkeits-Zusatzversicherung (BUZ) enthalten?"
        erklaerung="Der BUZ-Beitrag ist reiner Risikobeitrag und wird in der Berechnung gesondert behandelt."
        wert={draft.buzEnthalten}
        onChange={(wert) => aendere('buzEnthalten', wert as CaseDraft['buzEnthalten'])}
        optionen={JNU_OPTIONEN}
        nebeneinander
        fehler={fehler['buzEnthalten']}
      />
    </>
  );
}

export function SchrittEignung({ draft, fehler, aendere }: SchrittProps) {
  return (
    <>
      <div className="hinweis neutral">
        <p>
          Diese Fragen helfen einzuordnen, ob Ihr Vertrag für eine Rückabwicklung überhaupt
          infrage kommt. <strong>„Weiß ich nicht“ ist eine völlig normale Antwort</strong> –
          das Ergebnis nennt dann das Dokument, mit dem sich die Frage klären lässt. Eine
          rechtliche Bewertung Ihres Einzelfalls findet hier nicht statt.
        </p>
      </div>
      <RadioGruppe
        id="zustandekommen"
        label="Wie kam der Vertrag damals zustande?"
        erklaerung="Entscheidend ist, wann Sie Police, Versicherungsbedingungen und Verbraucherinformationen erhalten haben."
        wert={draft.zustandekommen}
        onChange={(wert) => aendere('zustandekommen', wert as CaseDraft['zustandekommen'])}
        optionen={optionen(ZUSTANDEKOMMEN_LABEL)}
        fehler={fehler['zustandekommen']}
      />
      <RadioGruppe
        id="belehrungVorhanden"
        label="Finden Sie in Ihren Unterlagen eine Belehrung über ein Widerspruchs-, Rücktritts- oder Widerrufsrecht?"
        erklaerung="Typische Fundstellen: die Police selbst, das Begleitschreiben zur Police oder die Verbraucherinformationen."
        wert={draft.belehrungVorhanden}
        onChange={(wert) => aendere('belehrungVorhanden', wert as CaseDraft['belehrungVorhanden'])}
        optionen={JNU_OPTIONEN}
        nebeneinander
        fehler={fehler['belehrungVorhanden']}
      />
      {draft.belehrungVorhanden === 'ja' && (
        <>
          <RadioGruppe
            id="belehrungFrist"
            label="Welche Frist nennt die Belehrung?"
            wert={draft.belehrungFrist}
            onChange={(wert) => aendere('belehrungFrist', wert as CaseDraft['belehrungFrist'])}
            optionen={optionen(BELEHRUNG_FRIST_LABEL)}
            fehler={fehler['belehrungFrist']}
          />
          <RadioGruppe
            id="belehrungForm"
            label="Welche Form verlangt die Belehrung für den Widerspruch bzw. Widerruf?"
            wert={draft.belehrungForm}
            onChange={(wert) => aendere('belehrungForm', wert as CaseDraft['belehrungForm'])}
            optionen={optionen(BELEHRUNG_FORM_LABEL)}
            fehler={fehler['belehrungForm']}
          />
          <RadioGruppe
            id="hervorhebung"
            label="Ist die Belehrung drucktechnisch hervorgehoben?"
            erklaerung="Zum Beispiel durch Fettdruck, eine Umrahmung oder deutliche Absetzung vom übrigen Text."
            wert={draft.hervorhebung}
            onChange={(wert) => aendere('hervorhebung', wert as CaseDraft['hervorhebung'])}
            optionen={JNU_OPTIONEN}
            nebeneinander
            fehler={fehler['hervorhebung']}
          />
        </>
      )}
      <RadioGruppe
        id="abgetretenOderBeliehen"
        label="Wurde der Vertrag abgetreten oder beliehen?"
        erklaerung="Zum Beispiel als Sicherheit für einen Kredit an eine Bank abgetreten."
        wert={draft.abgetretenOderBeliehen}
        onChange={(wert) => aendere('abgetretenOderBeliehen', wert as CaseDraft['abgetretenOderBeliehen'])}
        optionen={JNU_OPTIONEN}
        nebeneinander
        fehler={fehler['abgetretenOderBeliehen']}
      />
      <p className="erklaerung">
        Ein Upload von Police oder Standmitteilung mit automatischer Vorbefüllung ist in
        Vorbereitung und derzeit noch nicht verfügbar.
      </p>
    </>
  );
}

export function SchrittZusammenfassung({ draft, fehler, aendere }: SchrittProps) {
  return (
    <>
      <p>
        Bitte prüfen Sie Ihre Angaben. Über „Zurück“ können Sie jeden Schritt korrigieren.
      </p>
      <ZusammenfassungAnsicht draft={draft} />
      <div className="hinweis">
        <p>
          <strong>Hinweis zur Vorabversion:</strong> Ihre Angaben werden derzeit
          ausschließlich lokal in Ihrem Browser gespeichert und noch nicht an uns
          übertragen. Die automatische Auswertung wird derzeit aufgebaut; sobald sie
          verfügbar ist, informieren wir auf dieser Website darüber.
        </p>
      </div>
      <Kontrollkaestchen
        id="einwilligungDatenschutz"
        label={
          <>
            Ich willige ein, dass meine Angaben zur Erstellung der Ersteinschätzung
            verarbeitet werden. Einzelheiten und Widerrufsmöglichkeit:{' '}
            <Link href="/datenschutz">Datenschutzerklärung</Link>. (erforderlich)
          </>
        }
        angehakt={draft.einwilligungDatenschutz}
        onChange={(angehakt) => aendere('einwilligungDatenschutz', angehakt)}
        fehler={fehler['einwilligungDatenschutz']}
      />
      <Kontrollkaestchen
        id="einwilligungKontakt"
        label="Ich möchte per E-Mail über Rückfragen und das Ergebnis informiert werden. (optional)"
        angehakt={draft.einwilligungKontakt}
        onChange={(angehakt) => aendere('einwilligungKontakt', angehakt)}
      />
    </>
  );
}
