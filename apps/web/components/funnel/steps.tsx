'use client';

/**
 * Die sechs Schritte des Rechner-Formulars in der Tonalität von Prompt 8:
 * kurze Sätze, Alltagswörter, Fachbegriffe im Fließtext erklärt. Schritt 5
 * ist im Verbraucherprodukt die Unterlagen-Checkliste (keine Bewertung), in
 * der Kanzlei-Variante der Eignungs-Check.
 */
import Link from 'next/link';
import { VARIANTE } from '@/config/variante';
import type { CaseDraft, Fehlerliste } from '@/lib/draft';
import { formatEuro, parseDecimalDe } from '@/lib/format';
import {
  BELEHRUNG_FORM_LABEL,
  BELEHRUNG_FRIST_LABEL,
  JNU_LABEL,
  STATUS_LABEL,
  UNTERLAGEN_FELDER,
  UNTERLAGEN_LABEL,
  VERTRAGSART_LABEL,
  ZAHLWEISE_LABEL,
  ZUSTANDEKOMMEN_LABEL,
} from '@/lib/labels';
import { AuswahlFeld, Kontrollkaestchen, RadioGruppe, MonatsFeld, TextFeld, type Option } from './fields';
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
  return waehrung === 'EUR' ? `Gelesen als ${formatEuro(wert)}` : `Gelesen als ${dmFormat.format(wert)} DM`;
}

export function SchrittKontakt({ draft, fehler, aendere }: SchrittProps) {
  return (
    <>
      <p>
        Wohin dürfen wir das Ergebnis schicken? Kein Anruf ohne Ihr Ja. Was wir mit Daten tun,
        steht in der <Link href="/datenschutz">Datenschutzerklärung</Link>.
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
        label="Telefon (freiwillig)"
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
        label="Wer steht auf der Police?"
        erklaerung="Der Name von damals reicht – auch wenn die Gesellschaft heute anders heißt."
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
        label="Was für ein Vertrag ist es?"
        erklaerung="Steht oben auf der Police oder der Standmitteilung."
        wert={draft.vertragsart}
        onChange={(wert) => aendere('vertragsart', wert as CaseDraft['vertragsart'])}
        optionen={optionen(VERTRAGSART_LABEL)}
        fehler={fehler['vertragsart']}
      />
      <MonatsFeld
        id="beginn"
        label="Seit wann läuft er? (Monat/Jahr)"
        erklaerung="Zum Beispiel 03/2000 für März 2000 – der Monat steht auf der Police."
        startJahr={2000}
        wert={draft.beginn}
        onChange={(wert) => aendere('beginn', wert)}
        fehler={fehler['beginn']}
      />
      <MonatsFeld
        id="ende"
        label="Geplantes Ende (Monat/Jahr, freiwillig)"
        startJahr={2030}
        wert={draft.ende}
        onChange={(wert) => aendere('ende', wert)}
        fehler={fehler['ende']}
      />
      <AuswahlFeld
        id="status"
        label="Wie steht es heute um den Vertrag?"
        wert={draft.status}
        onChange={(wert) => aendere('status', wert as CaseDraft['status'])}
        optionen={optionen(STATUS_LABEL)}
        fehler={fehler['status']}
      />
      {draft.status !== '' && draft.status !== 'laufend' && (
        <MonatsFeld
          id="statusDatum"
          label={statusDatumLabel}
          startJahr={2012}
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
        Was zahlen Sie – oder haben Sie gezahlt? Der erste Beitrag <em>oder</em> der heutige
        reicht für den Anfang.
      </p>
      <AuswahlFeld
        id="zahlweise"
        label="Wie oft zahlen Sie?"
        wert={draft.zahlweise}
        onChange={(wert) => aendere('zahlweise', wert as CaseDraft['zahlweise'])}
        optionen={optionen(ZAHLWEISE_LABEL)}
        fehler={fehler['zahlweise']}
      />
      <TextFeld
        id="erstbeitrag"
        label="Erster Beitrag (je Zahlung)"
        erklaerung="Der Beitrag ganz am Anfang. Bei alten Verträgen gern in D-Mark – wir rechnen um."
        inputMode="decimal"
        platzhalter="zum Beispiel 150,00"
        wert={draft.erstbeitrag}
        onChange={(wert) => aendere('erstbeitrag', wert)}
        fehler={fehler['erstbeitrag']}
        echo={betragEcho(draft.erstbeitrag, draft.erstbeitragWaehrung)}
      />
      <RadioGruppe
        id="erstbeitragWaehrung"
        label="Währung des ersten Beitrags"
        wert={draft.erstbeitragWaehrung}
        onChange={(wert) => aendere('erstbeitragWaehrung', wert as CaseDraft['erstbeitragWaehrung'])}
        optionen={[
          { wert: 'EUR', label: 'Euro' },
          { wert: 'DM', label: 'D-Mark' },
        ]}
        nebeneinander
      />
      <TextFeld
        id="aktuellerBeitrag"
        label="Heutiger Beitrag (je Zahlung, freiwillig)"
        inputMode="decimal"
        wert={draft.aktuellerBeitrag}
        onChange={(wert) => aendere('aktuellerBeitrag', wert)}
        fehler={fehler['aktuellerBeitrag']}
        echo={betragEcho(draft.aktuellerBeitrag)}
      />
      <RadioGruppe
        id="dynamik"
        label="Steigt der Beitrag jedes Jahr?"
        erklaerung="Versicherer nennen das „Dynamik“: Der Beitrag wächst jährlich um einen festen Satz."
        wert={draft.dynamik}
        onChange={(wert) => aendere('dynamik', wert as CaseDraft['dynamik'])}
        optionen={JNU_OPTIONEN}
        nebeneinander
        fehler={fehler['dynamik']}
      />
      <TextFeld
        id="gesamtsummeLautMitteilung"
        label="Bisher eingezahlt laut Standmitteilung (freiwillig)"
        erklaerung="Steht die Summe aller Beiträge in Ihrer Mitteilung? Dann wird die Schätzung genauer."
        inputMode="decimal"
        wert={draft.gesamtsummeLautMitteilung}
        onChange={(wert) => aendere('gesamtsummeLautMitteilung', wert)}
        fehler={fehler['gesamtsummeLautMitteilung']}
        echo={betragEcho(draft.gesamtsummeLautMitteilung)}
      />
      <MonatsFeld
        id="beitragszahlungBis"
        label="Beiträge gezahlt bis (Monat/Jahr, freiwillig)"
        erklaerung="Nur nötig, wenn Sie früher aufgehört haben zu zahlen als der Vertrag läuft."
        startJahr={2012}
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
        label="Rückkaufswert heute (freiwillig, aber wichtig)"
        erklaerung="Das ist das Geld, das der Versicherer bei Kündigung zahlt. Es steht in der letzten Standmitteilung. Ohne diesen Wert bleibt die Ampel gelb."
        inputMode="decimal"
        wert={draft.rueckkaufswert}
        onChange={(wert) => aendere('rueckkaufswert', wert)}
        fehler={fehler['rueckkaufswert']}
        echo={betragEcho(draft.rueckkaufswert)}
      />
      <RadioGruppe
        id="auszahlungenErhalten"
        label="Haben Sie aus dem Vertrag schon Geld bekommen?"
        erklaerung="Zum Beispiel Teilauszahlungen oder den Rückkaufswert nach einer Kündigung."
        wert={draft.auszahlungenErhalten}
        onChange={(wert) => aendere('auszahlungenErhalten', wert as CaseDraft['auszahlungenErhalten'])}
        optionen={JNU_OPTIONEN}
        nebeneinander
        fehler={fehler['auszahlungenErhalten']}
      />
      {draft.auszahlungenErhalten === 'ja' && (
        <TextFeld
          id="auszahlungenSumme"
          label="Wie viel insgesamt?"
          erklaerung="Geschätzt reicht. Genaue Daten kommen später in den Bericht."
          inputMode="decimal"
          wert={draft.auszahlungenSumme}
          onChange={(wert) => aendere('auszahlungenSumme', wert)}
          fehler={fehler['auszahlungenSumme']}
          echo={betragEcho(draft.auszahlungenSumme)}
        />
      )}
      <RadioGruppe
        id="policendarlehen"
        label="Gab oder gibt es ein Policendarlehen?"
        erklaerung="Ein Kredit vom Versicherer, für den die Police als Sicherheit dient."
        wert={draft.policendarlehen}
        onChange={(wert) => aendere('policendarlehen', wert as CaseDraft['policendarlehen'])}
        optionen={JNU_OPTIONEN}
        nebeneinander
        fehler={fehler['policendarlehen']}
      />
      <RadioGruppe
        id="buzEnthalten"
        label="Ist ein Berufsunfähigkeitsschutz dabei?"
        erklaerung="Dieser Teil des Beitrags ist reiner Schutz und zählt beim Rückrechnen nicht mit."
        wert={draft.buzEnthalten}
        onChange={(wert) => aendere('buzEnthalten', wert as CaseDraft['buzEnthalten'])}
        optionen={JNU_OPTIONEN}
        nebeneinander
        fehler={fehler['buzEnthalten']}
      />
    </>
  );
}

function SchrittUnterlagen({ draft, aendere }: SchrittProps) {
  return (
    <>
      <p>
        Welche Unterlagen haben Sie zur Hand? Das ändert nichts an der Ampel. Es zeigt Ihnen,
        was für die Durchsetzung noch fehlt.
      </p>
      <div className="feld">
        <div className="optionen">
          {UNTERLAGEN_FELDER.map((feld) => (
            <label key={feld}>
              <input
                type="checkbox"
                name={feld}
                checked={draft[feld]}
                onChange={(ereignis) => aendere(feld, ereignis.target.checked)}
              />
              <span>{UNTERLAGEN_LABEL[feld]}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="hinweis neutral">
        <p>
          Alles weg? Kein Problem. Der Versicherer muss Ihnen Zweitschriften geben. Wie Sie
          das anfordern, steht im Ergebnis.
        </p>
      </div>
    </>
  );
}

function SchrittEignungKanzlei({ draft, fehler, aendere }: SchrittProps) {
  return (
    <>
      <div className="hinweis neutral">
        <p>
          Diese Fragen helfen einzuordnen, ob der Vertrag für eine Rückabwicklung infrage kommt.{' '}
          <strong>„Weiß ich nicht“ ist eine normale Antwort</strong> – das Ergebnis nennt dann das
          Dokument, das die Frage klärt. Eine rechtliche Bewertung des Einzelfalls findet hier nicht statt.
        </p>
      </div>
      <RadioGruppe
        id="zustandekommen"
        label="Wie kam der Vertrag damals zustande?"
        erklaerung="Entscheidend ist, wann Police, Bedingungen und Verbraucherinformation bei Ihnen ankamen."
        wert={draft.zustandekommen}
        onChange={(wert) => aendere('zustandekommen', wert as CaseDraft['zustandekommen'])}
        optionen={optionen(ZUSTANDEKOMMEN_LABEL)}
        fehler={fehler['zustandekommen']}
      />
      <RadioGruppe
        id="belehrungVorhanden"
        label="Finden Sie in den Unterlagen eine Belehrung über ein Widerspruchs-, Rücktritts- oder Widerrufsrecht?"
        erklaerung="Typische Fundstellen: die Police selbst, das Begleitschreiben oder die Verbraucherinformation."
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
            label="Welche Form verlangt die Belehrung?"
            wert={draft.belehrungForm}
            onChange={(wert) => aendere('belehrungForm', wert as CaseDraft['belehrungForm'])}
            optionen={optionen(BELEHRUNG_FORM_LABEL)}
            fehler={fehler['belehrungForm']}
          />
          <RadioGruppe
            id="hervorhebung"
            label="Ist die Belehrung drucktechnisch hervorgehoben?"
            erklaerung="Zum Beispiel fett, umrahmt oder deutlich vom übrigen Text abgesetzt."
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
        erklaerung="Zum Beispiel als Sicherheit für einen Kredit an eine Bank."
        wert={draft.abgetretenOderBeliehen}
        onChange={(wert) => aendere('abgetretenOderBeliehen', wert as CaseDraft['abgetretenOderBeliehen'])}
        optionen={JNU_OPTIONEN}
        nebeneinander
        fehler={fehler['abgetretenOderBeliehen']}
      />
    </>
  );
}

export function SchrittEignung(props: SchrittProps) {
  return VARIANTE.belehrungsCheck ? <SchrittEignungKanzlei {...props} /> : <SchrittUnterlagen {...props} />;
}

export function SchrittZusammenfassung({ draft, fehler, aendere }: SchrittProps) {
  return (
    <>
      <p>Stimmt alles? Mit „Zurück“ ändern Sie jeden Schritt.</p>
      <ZusammenfassungAnsicht draft={draft} />
      <div className="hinweis neutral">
        <p>
          Ihre Angaben bleiben auf diesem Gerät. Wenn Sie auf „Ampel anzeigen“ drücken, rechnen
          wir einmal durch – und speichern dabei nichts.
        </p>
      </div>
      <Kontrollkaestchen
        id="einwilligungDatenschutz"
        label={
          <>
            Ja, rechnet mit meinen Angaben. Was damit passiert, steht in der{' '}
            <Link href="/datenschutz">Datenschutzerklärung</Link>. (nötig)
          </>
        }
        angehakt={draft.einwilligungDatenschutz}
        onChange={(angehakt) => aendere('einwilligungDatenschutz', angehakt)}
        fehler={fehler['einwilligungDatenschutz']}
      />
      <Kontrollkaestchen
        id="einwilligungKontakt"
        label="Ja, ihr dürft mir zu meiner Anfrage per E-Mail schreiben. (freiwillig)"
        angehakt={draft.einwilligungKontakt}
        onChange={(angehakt) => aendere('einwilligungKontakt', angehakt)}
      />
    </>
  );
}
