'use client';

/**
 * Wiederverwendbare, barrierearme Formularfelder: Label ist immer verbunden,
 * Fehlertexte hängen per aria-describedby am Feld, Radiogruppen nutzen
 * fieldset/legend.
 */
import type { ReactNode } from 'react';

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
  inputMode?: 'decimal' | 'email' | 'tel' | undefined;
  platzhalter?: string | undefined;
  liste?: string | undefined;
  /** Rückmeldung unter dem Feld, z. B. der erkannte Betrag. */
  echo?: string | undefined;
  autoComplete?: string | undefined;
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
