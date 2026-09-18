'use client';

import { VARIANTE } from '@/config/variante';
import type { CaseDraft } from '@/lib/draft';
import { formatEuro, formatMonatDe, parseDecimalDe } from '@/lib/format';
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
  labelOderLeer,
} from '@/lib/labels';

function betragAnzeige(eingabe: string): string {
  if (eingabe.trim() === '') {
    return '–';
  }
  const wert = parseDecimalDe(eingabe);
  return wert === null ? eingabe : formatEuro(wert);
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
    { begriff: 'Telefon (freiwillig)', wert: draft.telefon || '–' },
  ];

  const vertrag: Zeile[] = [
    { begriff: 'Versicherer (laut Police)', wert: draft.versicherer || '–' },
    { begriff: 'Vertragsart', wert: labelOderLeer(draft.vertragsart, VERTRAGSART_LABEL) },
    { begriff: 'Beginn', wert: monatAnzeige(draft.beginn) },
    { begriff: 'Geplantes Ende', wert: monatAnzeige(draft.ende) },
    { begriff: 'Stand heute', wert: labelOderLeer(draft.status, STATUS_LABEL) },
  ];
  if (draft.status !== '' && draft.status !== 'laufend') {
    vertrag.push({ begriff: 'Seit / zum', wert: monatAnzeige(draft.statusDatum) });
  }

  const beitraege: Zeile[] = [
    { begriff: 'Zahlweise', wert: labelOderLeer(draft.zahlweise, ZAHLWEISE_LABEL) },
    {
      begriff: 'Erster Beitrag',
      wert:
        draft.erstbeitragWaehrung === 'DM' && draft.erstbeitrag.trim() !== ''
          ? `${draft.erstbeitrag} DM (wird umgerechnet)`
          : betragAnzeige(draft.erstbeitrag),
    },
    { begriff: 'Heutiger Beitrag', wert: betragAnzeige(draft.aktuellerBeitrag) },
    { begriff: 'Beitrag steigt jährlich', wert: labelOderLeer(draft.dynamik, JNU_LABEL) },
    { begriff: 'Eingezahlt laut Standmitteilung', wert: betragAnzeige(draft.gesamtsummeLautMitteilung) },
    { begriff: 'Beiträge gezahlt bis', wert: monatAnzeige(draft.beitragszahlungBis) },
  ];

  const werte: Zeile[] = [
    { begriff: 'Rückkaufswert heute', wert: betragAnzeige(draft.rueckkaufswert) },
    { begriff: 'Schon Geld bekommen', wert: labelOderLeer(draft.auszahlungenErhalten, JNU_LABEL) },
  ];
  if (draft.auszahlungenErhalten === 'ja') {
    werte.push({ begriff: 'Summe der Auszahlungen', wert: betragAnzeige(draft.auszahlungenSumme) });
  }
  werte.push(
    { begriff: 'Policendarlehen', wert: labelOderLeer(draft.policendarlehen, JNU_LABEL) },
    { begriff: 'Berufsunfähigkeitsschutz dabei', wert: labelOderLeer(draft.buzEnthalten, JNU_LABEL) },
  );

  const eignung: Zeile[] = [
    { begriff: 'Zustandekommen des Vertrags', wert: labelOderLeer(draft.zustandekommen, ZUSTANDEKOMMEN_LABEL) },
    { begriff: 'Belehrung gefunden', wert: labelOderLeer(draft.belehrungVorhanden, JNU_LABEL) },
  ];
  if (draft.belehrungVorhanden === 'ja') {
    eignung.push(
      { begriff: 'Frist laut Belehrung', wert: labelOderLeer(draft.belehrungFrist, BELEHRUNG_FRIST_LABEL) },
      { begriff: 'Form laut Belehrung', wert: labelOderLeer(draft.belehrungForm, BELEHRUNG_FORM_LABEL) },
      { begriff: 'Drucktechnisch hervorgehoben', wert: labelOderLeer(draft.hervorhebung, JNU_LABEL) },
    );
  }
  eignung.push({ begriff: 'Abgetreten oder beliehen', wert: labelOderLeer(draft.abgetretenOderBeliehen, JNU_LABEL) });

  const unterlagen: Zeile[] = UNTERLAGEN_FELDER.map((feld) => ({
    begriff: UNTERLAGEN_LABEL[feld],
    wert: draft[feld] ? 'vorhanden' : 'fehlt noch',
  }));

  return (
    <div>
      <Tabelle titel="Kontakt" zeilen={kontakt} />
      <Tabelle titel="Police" zeilen={vertrag} />
      <Tabelle titel="Beiträge" zeilen={beitraege} />
      <Tabelle titel="Werte" zeilen={werte} />
      {VARIANTE.belehrungsCheck ? (
        <Tabelle titel="Eignungs-Check" zeilen={eignung} />
      ) : (
        <Tabelle titel="Unterlagen" zeilen={unterlagen} />
      )}
    </div>
  );
}
