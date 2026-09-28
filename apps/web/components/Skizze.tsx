/**
 * Schematische Skizzen für „Wo finde ich das?“ (Prompt 14, Abschnitt 1.4):
 * ein stilisiertes Dokument (Standmitteilung, Police, Nachtrag oder
 * Schreiben des Versicherers) mit markierter Stelle. Inline-SVG, bewusst
 * abstrakt – keine echten Versicherer-Dokumente, keine Beträge.
 */
import type { SkizzenArt } from '@/content/hilfetexte';

interface Zeile {
  /** Beschriftung, die im Hilfetext als `markierung` referenziert wird. */
  label: string;
  /** Angedeuteter Wert (nur Striche/Platzhalter, keine echten Zahlen). */
  wert?: string;
}

interface Vorlage {
  titel: string;
  zeilen: Zeile[];
}

const VORLAGEN: Record<SkizzenArt, Vorlage> = {
  standmitteilung: {
    titel: 'Standmitteilung',
    zeilen: [
      { label: 'Vertragsnummer', wert: '••• ••• •••' },
      { label: 'Stand des Vertrags', wert: 'läuft / beitragsfrei' },
      { label: 'Stand zum', wert: '••.••.••••' },
      { label: 'Rückkaufswert', wert: '•••.••• €' },
      { label: 'Summe der gezahlten Beiträge', wert: '•••.••• €' },
      { label: 'Garantiewert', wert: '•••.••• €' },
    ],
  },
  police: {
    titel: 'Versicherungsschein',
    zeilen: [
      { label: 'Versicherungsnehmer', wert: 'Name' },
      { label: 'Geburtsdatum', wert: '••.••.••••' },
      { label: 'Vertragsart', wert: 'Kapitallebensversicherung' },
      { label: 'Versicherungsbeginn', wert: '••.••.••••' },
      { label: 'Beitrag', wert: '••• € monatlich' },
      { label: 'Dynamik', wert: '• % jährlich' },
    ],
  },
  nachtrag: {
    titel: 'Nachtrag zum Versicherungsschein',
    zeilen: [
      { label: 'Vertragsnummer', wert: '••• ••• •••' },
      { label: 'Dynamik', wert: 'planmäßige Erhöhung • %' },
      { label: 'Neuer Beitrag ab', wert: '••.••.••••' },
      { label: 'Neue Versicherungssumme', wert: '•••.••• €' },
    ],
  },
  schreiben: {
    titel: 'Schreiben des Versicherers',
    zeilen: [
      { label: 'Vertragsnummer', wert: '••• ••• •••' },
      { label: 'Auszahlung', wert: '•••.••• €' },
      { label: 'Datum der Auszahlung', wert: '••.••.••••' },
      { label: 'Verbleibender Vertragswert', wert: '•••.••• €' },
    ],
  },
};

const BREITE = 320;
const ZEILEN_START = 96;
const ZEILEN_ABSTAND = 30;

export function Skizze({ art, markierung }: { art: SkizzenArt; markierung: string }) {
  const vorlage = VORLAGEN[art];
  const hoehe = ZEILEN_START + vorlage.zeilen.length * ZEILEN_ABSTAND + 24;
  const kopfMarkiert = markierung === 'Kopf';
  return (
    <svg
      className="skizze"
      viewBox={`0 0 ${BREITE} ${hoehe}`}
      role="img"
      aria-label={`Schematische Skizze: ${vorlage.titel}, markiert ist „${kopfMarkiert ? 'Name des Versicherers' : markierung}“`}
    >
      {/* Blatt */}
      <rect x="8" y="8" width={BREITE - 16} height={hoehe - 16} rx="10" className="skizze-blatt" />
      {/* Kopf: Versicherer-Name (Logo-Fläche + Schriftzug) */}
      {kopfMarkiert && <rect x="16" y="18" width="200" height="36" rx="8" className="skizze-markierung" />}
      <rect x="24" y="26" width="22" height="20" rx="4" className="skizze-logo" />
      <text x="54" y="41" className="skizze-kopf">
        Name des Versicherers
      </text>
      <text x="24" y="76" className="skizze-titel">
        {vorlage.titel}
      </text>
      <line x1="24" y1="84" x2={BREITE - 24} y2="84" className="skizze-linie" />
      {vorlage.zeilen.map((zeile, index) => {
        const y = ZEILEN_START + index * ZEILEN_ABSTAND;
        const markiert = zeile.label === markierung;
        return (
          <g key={zeile.label}>
            {markiert && <rect x="16" y={y - 14} width={BREITE - 32} height="26" rx="8" className="skizze-markierung" />}
            <text x="24" y={y + 4} className={markiert ? 'skizze-label skizze-label--markiert' : 'skizze-label'}>
              {zeile.label}
            </text>
            <text x={BREITE - 24} y={y + 4} textAnchor="end" className="skizze-wert">
              {zeile.wert ?? ''}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
