'use client';

import type { CaseDraft } from '@/lib/draft';
import { formatEuro, formatMonatDe, parseDecimalDe } from '@/lib/format';
import {
  BELEHRUNG_FORM_LABEL,
  BELEHRUNG_FRIST_LABEL,
  JNU_LABEL,
  STATUS_LABEL,
  VERTRAGSART_LABEL,
  ZAHLWEISE_LABEL,
  ZUSTANDEKOMMEN_LABEL,
  labelOderLeer,
} from '@/lib/labels';

function betragAnzeige(eingabe: string, zusatz = ''): string {
  if (eingabe.trim() === '') {
    return '–';
  }
  const wert = parseDecimalDe(eingabe);
  if (wert === null) {
    return eingabe;
  }
  return zusatz === '' ? formatEuro(wert) : `${formatEuro(wert)} ${zusatz}`;
}

function monatAnzeige(isoMonat: string): string {
  return isoMonat === '' ? '–' : formatMonatDe(isoMonat);
}

interface Zeile {
  begriff: string;
  wert: string;
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
  const kontakt: Zeile[] = [
    { begriff: 'Name', wert: draft.name || '–' },
    { begriff: 'E-Mail', wert: draft.email || '–' },
    { begriff: 'Telefon (optional)', wert: draft.telefon || '–' },
  ];

  const vertrag: Zeile[] = [
    { begriff: 'Versicherer (laut Police)', wert: draft.versicherer || '–' },
    { begriff: 'Vertragsart', wert: labelOderLeer(draft.vertragsart, VERTRAGSART_LABEL) },
    { begriff: 'Vertragsbeginn', wert: monatAnzeige(draft.beginn) },
    { begriff: 'Vertragsende (geplant)', wert: monatAnzeige(draft.ende) },
    { begriff: 'Stand des Vertrags', wert: labelOderLeer(draft.status, STATUS_LABEL) },
  ];
  if (draft.status !== '' && draft.status !== 'laufend') {
    vertrag.push({ begriff: 'Seit / zum', wert: monatAnzeige(draft.statusDatum) });
  }

  const dmZusatz = draft.erstbeitragWaehrung === 'DM' ? '(Angabe in DM)' : '';
  const beitraege: Zeile[] = [
    { begriff: 'Zahlweise', wert: labelOderLeer(draft.zahlweise, ZAHLWEISE_LABEL) },
    {
      begriff: 'Erstbeitrag',
      wert:
        draft.erstbeitragWaehrung === 'DM' && draft.erstbeitrag.trim() !== ''
          ? `${draft.erstbeitrag} DM ${dmZusatz}`
          : betragAnzeige(draft.erstbeitrag),
    },
    { begriff: 'Aktueller Beitrag', wert: betragAnzeige(draft.aktuellerBeitrag) },
    { begriff: 'Beitragsdynamik', wert: labelOderLeer(draft.dynamik, JNU_LABEL) },
    {
      begriff: 'Gesamtsumme laut Standmitteilung',
      wert: betragAnzeige(draft.gesamtsummeLautMitteilung),
    },
    { begriff: 'Beitragszahlung bis', wert: monatAnzeige(draft.beitragszahlungBis) },
  ];

  const werte: Zeile[] = [
    { begriff: 'Aktueller Rückkaufswert', wert: betragAnzeige(draft.rueckkaufswert) },
    {
      begriff: 'Bereits Auszahlungen erhalten',
      wert: labelOderLeer(draft.auszahlungenErhalten, JNU_LABEL),
    },
  ];
  if (draft.auszahlungenErhalten === 'ja') {
    werte.push({ begriff: 'Summe der Auszahlungen', wert: betragAnzeige(draft.auszahlungenSumme) });
  }
  werte.push(
    { begriff: 'Policendarlehen', wert: labelOderLeer(draft.policendarlehen, JNU_LABEL) },
    {
      begriff: 'Berufsunfähigkeits-Zusatzversicherung',
      wert: labelOderLeer(draft.buzEnthalten, JNU_LABEL),
    },
  );

  const eignung: Zeile[] = [
    {
      begriff: 'Zustandekommen des Vertrags',
      wert: labelOderLeer(draft.zustandekommen, ZUSTANDEKOMMEN_LABEL),
    },
    {
      begriff: 'Belehrung in den Unterlagen gefunden',
      wert: labelOderLeer(draft.belehrungVorhanden, JNU_LABEL),
    },
  ];
  if (draft.belehrungVorhanden === 'ja') {
    eignung.push(
      { begriff: 'Frist laut Belehrung', wert: labelOderLeer(draft.belehrungFrist, BELEHRUNG_FRIST_LABEL) },
      { begriff: 'Form laut Belehrung', wert: labelOderLeer(draft.belehrungForm, BELEHRUNG_FORM_LABEL) },
      { begriff: 'Drucktechnisch hervorgehoben', wert: labelOderLeer(draft.hervorhebung, JNU_LABEL) },
    );
  }
  eignung.push({
    begriff: 'Vertrag abgetreten oder beliehen',
    wert: labelOderLeer(draft.abgetretenOderBeliehen, JNU_LABEL),
  });

  return (
    <div>
      <Tabelle titel="Kontakt" zeilen={kontakt} />
      <Tabelle titel="Vertrag" zeilen={vertrag} />
      <Tabelle titel="Beiträge" zeilen={beitraege} />
      <Tabelle titel="Werte und Leistungen" zeilen={werte} />
      <Tabelle titel="Eignungs-Check" zeilen={eignung} />
    </div>
  );
}
