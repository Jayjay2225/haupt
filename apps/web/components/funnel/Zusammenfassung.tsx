'use client';

/**
 * „Ihre Angaben im Überblick“ (Schritt 11 der Bestellung, Kanzlei-Ergebnis):
 * liest den Entwurf und zeigt ihn als Tabelle – nur Anzeige, keine Logik.
 */
import type { CaseDraft } from '@/lib/draft';
import { formatDatumDe, formatEuro, monatNameDe, parseDecimalDe } from '@/lib/format';
import { ANREDE_LABEL, JNU_LABEL, STATUS_LABEL, VERTRAGSART_LABEL, ZAHLWEISE_LABEL, labelOderLeer } from '@/lib/labels';

interface Zeile {
  begriff: string;
  wert: string;
}

function betragAnzeige(eingabe: string, waehrung: 'EUR' | 'DM' = 'EUR'): string {
  if (eingabe.trim() === '') {
    return '–';
  }
  const wert = parseDecimalDe(eingabe);
  if (wert === null) {
    return eingabe;
  }
  return waehrung === 'DM'
    ? `${wert.toLocaleString('de-DE', { minimumFractionDigits: 2 })} DM`
    : formatEuro(wert);
}

function monatAnzeige(iso: string): string {
  const name = monatNameDe(iso);
  return name === '' ? '–' : name;
}

function Tabelle({ titel, zeilen }: { titel: string; zeilen: Zeile[] }) {
  return (
    <table className="zusammenfassung">
      <caption>{titel}</caption>
      <tbody>
        {zeilen.map((zeile) => (
          <tr key={zeile.begriff}>
            <th scope="row">{zeile.begriff}</th>
            <td>{zeile.wert}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function ZusammenfassungAnsicht({ draft, mitPerson = true }: { draft: CaseDraft; mitPerson?: boolean }) {
  const vertrag: Zeile[] = [
    { begriff: 'Vertragsart', wert: labelOderLeer(draft.vertragsart, VERTRAGSART_LABEL) },
    { begriff: 'Status', wert: labelOderLeer(draft.status, STATUS_LABEL) },
    { begriff: 'Versicherer', wert: draft.versicherer.trim() === '' ? '–' : draft.versicherer },
    {
      begriff: 'Beginn',
      wert: draft.beginnUngefaehr && draft.beginn !== '' ? `ungefähr ${draft.beginn.slice(0, 4)}` : monatAnzeige(draft.beginn),
    },
  ];
  if (draft.statusDatum !== '') {
    vertrag.push({
      begriff: draft.status === 'beitragsfrei' ? 'Beitragsfrei seit' : 'Beendet seit',
      wert: monatAnzeige(draft.statusDatum),
    });
  }

  const werte: Zeile[] = [
    {
      begriff: draft.beitragArt === 'heutiger' ? 'Heutiger Monatsbeitrag' : 'Erster Monatsbeitrag',
      wert: draft.erstbeitragUnbekannt ? 'Weiß ich nicht (aus Beitragssumme abgeleitet)' : betragAnzeige(draft.erstbeitrag, draft.erstbeitragWaehrung),
    },
    { begriff: 'Zahlweise', wert: labelOderLeer(draft.zahlweise, ZAHLWEISE_LABEL) },
    {
      begriff: 'Dynamik',
      wert:
        draft.dynamik === 'ja'
          ? `Ja${draft.dynamikSatz.trim() !== '' ? `, ${draft.dynamikSatz} % pro Jahr` : ''}`
          : labelOderLeer(draft.dynamik, JNU_LABEL),
    },
    { begriff: 'Eingezahlte Beiträge laut Standmitteilung', wert: betragAnzeige(draft.gesamtsummeLautMitteilung) },
    { begriff: 'Rückkaufswert', wert: betragAnzeige(draft.rueckkaufswert) },
  ];
  if (draft.auszahlungenErhalten === 'ja' && draft.auszahlungenListe.length > 0) {
    draft.auszahlungenListe.forEach((eintrag, index) => {
      werte.push({
        begriff: `Auszahlung ${index + 1}`,
        wert: `${monatAnzeige(eintrag.monat)}: ${betragAnzeige(eintrag.betrag)}`,
      });
    });
  } else {
    werte.push({ begriff: 'Auszahlungen', wert: labelOderLeer(draft.auszahlungenErhalten, JNU_LABEL) });
  }

  const person: Zeile[] = [
    {
      begriff: 'Name',
      wert: `${draft.anrede !== '' && draft.anrede !== 'keine' ? `${ANREDE_LABEL[draft.anrede]} ` : ''}${draft.vorname} ${draft.nachname}`.trim() || '–',
    },
    { begriff: 'Geburtsdatum', wert: draft.geburtsdatum === '' ? '–' : formatDatumDe(draft.geburtsdatum) },
    {
      begriff: 'Adresse',
      wert: [draft.strasse, `${draft.plz} ${draft.ort}`.trim()].filter((t) => t.trim() !== '').join(', ') || '–',
    },
    { begriff: 'E-Mail', wert: draft.email.trim() === '' ? '–' : draft.email },
    { begriff: 'Telefon', wert: draft.telefon.trim() === '' ? '–' : draft.telefon },
  ];

  return (
    <>
      <Tabelle titel="Vertrag" zeilen={vertrag} />
      <Tabelle titel="Beiträge und Werte" zeilen={werte} />
      {mitPerson && <Tabelle titel="Über Sie" zeilen={person} />}
    </>
  );
}
