'use client';

/**
 * „Ihre Angaben im Überblick“ auf der Ergebnis-Seite: liest den Entwurf und
 * zeigt ihn als Tabelle – nur Anzeige, keine Logik.
 */
import type { CaseDraft } from '@/lib/draft';
import { formatEuro, monatNameDe, parseDecimalDe } from '@/lib/format';
import { JNU_LABEL, STATUS_LABEL, VERTRAGSART_LABEL, ZAHLWEISE_LABEL, labelOderLeer } from '@/lib/labels';

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

export function ZusammenfassungAnsicht({ draft }: { draft: CaseDraft }) {
  const vertrag: Zeile[] = [
    { begriff: 'Vertragsart', wert: labelOderLeer(draft.vertragsart, VERTRAGSART_LABEL) },
    { begriff: 'Status', wert: labelOderLeer(draft.status, STATUS_LABEL) },
    { begriff: 'Versicherer', wert: draft.versicherer.trim() === '' ? '–' : draft.versicherer },
    { begriff: 'Beginn', wert: monatAnzeige(draft.beginn) },
  ];
  if (draft.statusDatum !== '') {
    vertrag.push({ begriff: 'Beendet seit', wert: monatAnzeige(draft.statusDatum) });
  }

  const werte: Zeile[] = [
    {
      begriff: 'Erster Monatsbeitrag',
      wert: betragAnzeige(draft.erstbeitrag, draft.erstbeitragWaehrung),
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

  const kontakt: Zeile[] = [
    { begriff: 'E-Mail', wert: draft.email.trim() === '' ? '–' : draft.email },
    { begriff: 'Telefon', wert: draft.telefon.trim() === '' ? '–' : draft.telefon },
    { begriff: 'Rechtsschutzversicherung', wert: draft.rechtsschutz ? 'Ja' : 'Keine Angabe' },
  ];

  return (
    <>
      <Tabelle titel="Vertrag" zeilen={vertrag} />
      <Tabelle titel="Beiträge und Werte" zeilen={werte} />
      <Tabelle titel="Kontakt" zeilen={kontakt} />
    </>
  );
}
