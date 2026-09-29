'use client';

/**
 * Anfrage-Formular (Prompt 12, Abschnitt 3.5 und 0.3): für das
 * Ankaufsangebot (/verkaufen) und die individuelle Prüfung (/anfrage).
 * Eigene, nicht vorangekreuzte Einwilligung; Honigtopf gegen Bots.
 */
import { useState } from 'react';
import { BRAND } from '@/config/brand';
import { Kontrollkaestchen, MonatsFeld, TextFeld } from './funnel/fields';

export function AnfrageFormular({ art }: { art: 'ankauf' | 'pruefung' }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [telefon, setTelefon] = useState('');
  const [versicherer, setVersicherer] = useState('');
  const [beginn, setBeginn] = useState('');
  const [rueckkaufswert, setRueckkaufswert] = useState('');
  const [nachricht, setNachricht] = useState('');
  const [einwilligung, setEinwilligung] = useState(false);
  const [honigtopf, setHonigtopf] = useState('');
  const [stand, setStand] = useState<'offen' | 'sendet' | 'gesendet'>('offen');
  const [fehler, setFehler] = useState<string | null>(null);

  async function absenden(ereignis: React.FormEvent) {
    ereignis.preventDefault();
    setFehler(null);
    if (email.trim() === '') {
      setFehler('Bitte Ihre E-Mail-Adresse eintragen.');
      return;
    }
    if (!einwilligung) {
      setFehler('Bitte bestätigen Sie die Einwilligung – ohne Ja dürfen wir nicht antworten.');
      return;
    }
    setStand('sendet');
    try {
      const antwort = await fetch('/api/anfrage', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          art,
          name,
          email,
          telefon,
          versicherer,
          beginn,
          rueckkaufswert,
          nachricht,
          einwilligung,
          firma_webseite: honigtopf,
        }),
      });
      const daten = (await antwort.json()) as { ok?: boolean; fehler?: string };
      if (!antwort.ok || daten.ok !== true) {
        setFehler(daten.fehler ?? 'Die Anfrage ließ sich gerade nicht senden.');
        setStand('offen');
        return;
      }
      setStand('gesendet');
    } catch {
      setFehler('Der Server ist gerade nicht erreichbar. Bitte später erneut versuchen.');
      setStand('offen');
    }
  }

  if (stand === 'gesendet') {
    return (
      <div className="hinweis">
        <p style={{ margin: 0 }}>
          <strong>Ihre Anfrage ist da.</strong> Wir melden uns per E-Mail – in der Regel innerhalb
          von zwei Werktagen.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={absenden} noValidate className="karte">
      <TextFeld id="af-versicherer" label="Versicherer" platzhalter="Name auf der Police" wert={versicherer} onChange={setVersicherer} />
      <MonatsFeld id="af-beginn" label="Vertragsbeginn (Monat/Jahr)" startJahr={2000} wert={beginn} onChange={setBeginn} />
      <TextFeld
        id="af-rueckkaufswert"
        label="Ungefährer Rückkaufswert"
        inputMode="decimal"
        platzhalter="z. B. 25.000 €"
        wert={rueckkaufswert}
        onChange={setRueckkaufswert}
      />
      <TextFeld id="af-name" label="Ihr Name" autoComplete="name" wert={name} onChange={setName} />
      <TextFeld
        id="af-email"
        label="E-Mail-Adresse"
        typ="email"
        inputMode="email"
        autoComplete="email"
        platzhalter="name@beispiel.de"
        wert={email}
        onChange={setEmail}
        {...(fehler !== null && email.trim() === '' ? { fehler } : {})}
      />
      <TextFeld id="af-telefon" label="Telefon (freiwillig)" typ="tel" inputMode="tel" autoComplete="tel" wert={telefon} onChange={setTelefon} />
      <div className="feld">
        <label htmlFor="af-nachricht">Anmerkungen (freiwillig)</label>
        <textarea
          id="af-nachricht"
          rows={4}
          value={nachricht}
          onChange={(ereignis) => setNachricht(ereignis.target.value)}
        />
      </div>
      {/* Honigtopf: für Menschen unsichtbar, Bots füllen es aus. */}
      <div className="honigtopf" aria-hidden="true">
        <label htmlFor="af-firma">Firmen-Webseite (bitte leer lassen)</label>
        <input
          id="af-firma"
          name="firma_webseite"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honigtopf}
          onChange={(ereignis) => setHonigtopf(ereignis.target.value)}
        />
      </div>
      <Kontrollkaestchen
        id="af-einwilligung"
        label={
          art === 'ankauf' ? (
            <>
              Ja, {BRAND.name} darf mich zu einem Ankaufsangebot kontaktieren und dafür meine
              Vertragsangaben nutzen. (freiwillig, jederzeit widerrufbar)
            </>
          ) : (
            <>
              Ja, {BRAND.name} darf meine Angaben zur Beantwortung dieser Anfrage verarbeiten und
              mich dazu kontaktieren. (freiwillig, jederzeit widerrufbar)
            </>
          )
        }
        angehakt={einwilligung}
        onChange={setEinwilligung}
        {...(fehler !== null && !einwilligung ? { fehler } : {})}
      />
      {fehler !== null && einwilligung && email.trim() !== '' && (
        <p className="feld-fehler" role="alert">
          {fehler}
        </p>
      )}
      <button type="submit" className="knopf haupt" disabled={stand === 'sendet'}>
        {stand === 'sendet'
          ? 'Wird gesendet …'
          : art === 'ankauf'
            ? 'Unverbindliches Ankaufsangebot anfordern'
            : 'Anfrage senden'}
      </button>
    </form>
  );
}
