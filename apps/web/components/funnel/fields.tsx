'use client';

/**
 * Wiederverwendbare, barrierearme Formularfelder: Label ist immer verbunden,
 * Fehlertexte hängen per aria-describedby am Feld, Radiogruppen nutzen
 * fieldset/legend.
 */
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { formatMonatDe, monatNameDe, parseMonatDe } from '@/lib/format';

interface BasisProps {
  id: string;
  label: string;
  erklaerung?: string | undefined;
  fehler?: string | undefined;
}

function beschreibungIds(id: string, erklaerung?: string, fehler?: string): string | undefined {
  const ids: string[] = [];
  if (erklaerung !== undefined) {
    ids.push(`${id}-erklaerung`);
  }
  if (fehler !== undefined) {
    ids.push(`${id}-fehler`);
  }
  return ids.length > 0 ? ids.join(' ') : undefined;
}

interface TextFeldProps extends BasisProps {
  wert: string;
  onChange: (wert: string) => void;
  typ?: 'text' | 'email' | 'tel' | 'month' | undefined;
  inputMode?: 'decimal' | 'email' | 'tel' | 'numeric' | undefined;
  platzhalter?: string | undefined;
  liste?: string | undefined;
  /** Rückmeldung unter dem Feld, z. B. der erkannte Betrag. */
  echo?: string | undefined;
  autoComplete?: string | undefined;
  onFocus?: (() => void) | undefined;
}

export function TextFeld(props: TextFeldProps) {
  const { id, label, erklaerung, fehler, wert, onChange } = props;
  return (
    <div className={fehler === undefined ? 'feld' : 'feld hat-fehler'}>
      <label htmlFor={id}>{label}</label>
      {erklaerung !== undefined && (
        <p className="erklaerung" id={`${id}-erklaerung`}>
          {erklaerung}
        </p>
      )}
      <input
        id={id}
        name={id}
        type={props.typ ?? 'text'}
        value={wert}
        onChange={(ereignis) => onChange(ereignis.target.value)}
        aria-invalid={fehler !== undefined || undefined}
        aria-describedby={beschreibungIds(id, erklaerung, fehler)}
        inputMode={props.inputMode}
        placeholder={props.platzhalter}
        list={props.liste}
        autoComplete={props.autoComplete}
        onFocus={props.onFocus}
      />
      {props.echo !== undefined && <p className="feld-echo">{props.echo}</p>}
      {fehler !== undefined && (
        <p className="feld-fehler" id={`${id}-fehler`}>
          {fehler}
        </p>
      )}
    </div>
  );
}

interface MonatsFeldProps extends BasisProps {
  /** ISO-Monat (YYYY-MM) oder Leerstring. */
  wert: string;
  onChange: (isoMonat: string) => void;
  /** Jahr, mit dem die Monatsauswahl startet, solange nichts eingegeben ist. */
  startJahr?: number | undefined;
}

const MONATSNAMEN_KURZ = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
const JAHR_MIN = 1960;
const JAHR_MAX = 2035;

/**
 * Monatsangabe: tippen UND auswählen in einem Feld. Getippt wird deutsch
 * („03/2000“), gespeichert wird ISO; beim Fokus öffnet sich darunter eine
 * Monatsauswahl (Jahr blättern, Monat anklicken). Das frühere
 * `input type="month"` zeigte in Browsern ohne Monatsauswahl ein leeres
 * Textfeld, das stillschweigend nur „2000-03“ akzeptierte.
 */
export function MonatsFeld(props: MonatsFeldProps) {
  const { id, label, erklaerung, fehler, wert, onChange } = props;
  const [text, setText] = useState(() => formatMonatDe(wert));
  const [offen, setOffen] = useState(false);
  const [jahr, setJahr] = useState(() => {
    const vorhanden = Number((parseMonatDe(formatMonatDe(wert)) ?? '').slice(0, 4));
    return Number.isFinite(vorhanden) && vorhanden >= JAHR_MIN ? vorhanden : (props.startJahr ?? 2005);
  });
  const behaelter = useRef<HTMLDivElement>(null);

  // Änderungen von außen übernehmen (Entwurf geladen, Schritt gewechselt),
  // ohne eine noch unvollständige Eingabe zu überschreiben.
  useEffect(() => {
    setText((bisher) => ((parseMonatDe(bisher) ?? '') === wert ? bisher : formatMonatDe(wert)));
    const j = Number(wert.slice(0, 4));
    if (j >= JAHR_MIN && j <= JAHR_MAX) {
      setJahr(j);
    }
  }, [wert]);

  const iso = parseMonatDe(text) ?? '';
  const erkannt = monatNameDe(iso);
  const gewaehlterMonat = iso.startsWith(String(jahr)) ? Number(iso.slice(5)) : 0;

  function waehleMonat(monat: number): void {
    const neu = `${String(monat).padStart(2, '0')}/${jahr}`;
    setText(neu);
    onChange(parseMonatDe(neu) ?? '');
    setOffen(false);
  }

  return (
    <div
      ref={behaelter}
      className="monat-feld"
      onBlur={(ereignis) => {
        if (!behaelter.current?.contains(ereignis.relatedTarget as Node | null)) {
          setOffen(false);
        }
      }}
      onKeyDown={(ereignis) => {
        if (ereignis.key === 'Escape') {
          setOffen(false);
        }
      }}
    >
      <TextFeld
        id={id}
        label={label}
        erklaerung={erklaerung}
        fehler={fehler}
        wert={text}
        onChange={(roh) => {
          setText(roh);
          setOffen(true);
          onChange(parseMonatDe(roh) ?? '');
        }}
        onFocus={() => setOffen(true)}
        inputMode="numeric"
        platzhalter="MM/JJJJ – tippen oder unten wählen"
        autoComplete="off"
        echo={erkannt !== '' ? erkannt : undefined}
      />
      {offen && (
        <div className="monat-panel" role="group" aria-label={`Monat und Jahr wählen für: ${label}`}>
          <div className="jahr-zeile">
            <button type="button" onClick={() => setJahr((j) => Math.max(JAHR_MIN, j - 1))} disabled={jahr <= JAHR_MIN} aria-label="Ein Jahr zurück">
              ‹
            </button>
            <span className="tabellenziffern" aria-live="polite">
              {jahr}
            </span>
            <button type="button" onClick={() => setJahr((j) => Math.min(JAHR_MAX, j + 1))} disabled={jahr >= JAHR_MAX} aria-label="Ein Jahr vor">
              ›
            </button>
          </div>
          <div className="monate">
            {MONATSNAMEN_KURZ.map((name, index) => (
              <button
                type="button"
                key={name}
                onClick={() => waehleMonat(index + 1)}
                aria-pressed={gewaehlterMonat === index + 1}
                aria-label={`${name} ${jahr}`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export interface Option {
  wert: string;
  label: string;
}

interface AuswahlFeldProps extends BasisProps {
  wert: string;
  onChange: (wert: string) => void;
  optionen: Option[];
  leerOption?: string | undefined;
}

export function AuswahlFeld(props: AuswahlFeldProps) {
  const { id, label, erklaerung, fehler, wert, onChange } = props;
  return (
    <div className={fehler === undefined ? 'feld' : 'feld hat-fehler'}>
      <label htmlFor={id}>{label}</label>
      {erklaerung !== undefined && (
        <p className="erklaerung" id={`${id}-erklaerung`}>
          {erklaerung}
        </p>
      )}
      <select
        id={id}
        name={id}
        value={wert}
        onChange={(ereignis) => onChange(ereignis.target.value)}
        aria-invalid={fehler !== undefined || undefined}
        aria-describedby={beschreibungIds(id, erklaerung, fehler)}
      >
        <option value="">{props.leerOption ?? 'Bitte auswählen …'}</option>
        {props.optionen.map((option) => (
          <option key={option.wert} value={option.wert}>
            {option.label}
          </option>
        ))}
      </select>
      {fehler !== undefined && (
        <p className="feld-fehler" id={`${id}-fehler`}>
          {fehler}
        </p>
      )}
    </div>
  );
}

interface RadioGruppeProps extends BasisProps {
  wert: string;
  onChange: (wert: string) => void;
  optionen: Option[];
  nebeneinander?: boolean | undefined;
}

export function RadioGruppe(props: RadioGruppeProps) {
  const { id, label, erklaerung, fehler, wert, onChange } = props;
  return (
    <fieldset
      className={fehler === undefined ? 'feld' : 'feld hat-fehler'}
      aria-describedby={beschreibungIds(id, erklaerung, fehler)}
    >
      <legend>{label}</legend>
      {erklaerung !== undefined && (
        <p className="erklaerung" id={`${id}-erklaerung`}>
          {erklaerung}
        </p>
      )}
      <div className={props.nebeneinander === true ? 'optionen nebeneinander' : 'optionen'}>
        {props.optionen.map((option) => (
          <label key={option.wert}>
            <input
              type="radio"
              name={id}
              value={option.wert}
              checked={wert === option.wert}
              onChange={() => onChange(option.wert)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      {fehler !== undefined && (
        <p className="feld-fehler" id={`${id}-fehler`}>
          {fehler}
        </p>
      )}
    </fieldset>
  );
}

interface KontrollkaestchenProps {
  id: string;
  label: ReactNode;
  angehakt: boolean;
  onChange: (angehakt: boolean) => void;
  fehler?: string | undefined;
}

export function Kontrollkaestchen(props: KontrollkaestchenProps) {
  const { id, fehler } = props;
  return (
    <div className={fehler === undefined ? 'feld' : 'feld hat-fehler'}>
      <div className="optionen">
        <label>
          <input
            type="checkbox"
            id={id}
            name={id}
            checked={props.angehakt}
            onChange={(ereignis) => props.onChange(ereignis.target.checked)}
            aria-invalid={fehler !== undefined || undefined}
            aria-describedby={fehler !== undefined ? `${id}-fehler` : undefined}
          />
          <span>{props.label}</span>
        </label>
      </div>
      {fehler !== undefined && (
        <p className="feld-fehler" id={`${id}-fehler`}>
          {fehler}
        </p>
      )}
    </div>
  );
}
