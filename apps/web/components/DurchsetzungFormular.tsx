'use client';

/**
 * Auftragsformular Durchsetzung (Prompt 13, 2.3): Kontakt, Bestellnummer,
 * Unterlagen-Upload (als E-Mail-Anhang weitergereicht, keine Speicherung auf
 * dem Server), eigene, nicht vorangekreuzte Einwilligungen. Honigtopf gegen
 * Bots. Prompt 14: keine Frage nach Versicherungen für Anwaltskosten.
 */
import { useState } from 'react';
import Link from 'next/link';
import { BRAND } from '@/config/brand';
import {
  KONDITIONEN_PLATZHALTER,
  UNTERLAGEN_MAX_DATEIEN,
  UNTERLAGEN_MAX_GESAMT,
  UNTERLAGEN_MAX_GESAMT_TEXT,
} from '@/config/durchsetzung';
import { Kontrollkaestchen, TextFeld } from './funnel/fields';

/** Muss zur Prüfung in app/api/durchsetzung/route.ts passen (dort zusätzlich über den Dateikopf). */
const ERLAUBTE_ENDUNG = /\.(pdf|jpe?g|png)$/i;

export function DurchsetzungFormular() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [telefon, setTelefon] = useState('');
  const [bestellnummer, setBestellnummer] = useState('');
  const [nachricht, setNachricht] = useState('');
  const [dateien, setDateien] = useState<File[]>([]);
  const [einwilligungBeauftragung, setEinwilligungBeauftragung] = useState(false);
  const [einwilligungWeitergabe, setEinwilligungWeitergabe] = useState(false);
  const [honigtopf, setHonigtopf] = useState('');
  const [stand, setStand] = useState<'offen' | 'sendet' | 'gesendet'>('offen');
  const [fehler, setFehler] = useState<string | null>(null);

  function dateienWaehlen(liste: FileList | null) {
    if (liste === null) {
      return;
    }
    setFehler(null);
    const alle = [...liste];
    const neu: File[] = [];
    const falscherTyp: string[] = [];
    let summe = 0;
    for (const datei of alle) {
      if (!ERLAUBTE_ENDUNG.test(datei.name)) {
        falscherTyp.push(datei.name);
        continue;
      }
      if (neu.length >= UNTERLAGEN_MAX_DATEIEN || summe + datei.size > UNTERLAGEN_MAX_GESAMT) {
        continue;
      }
      neu.push(datei);
      summe += datei.size;
    }
    setDateien(neu);
    const hinweise: string[] = [];
    if (falscherTyp.length > 0) {
      hinweise.push(`Bitte nur PDF, JPG oder PNG – weggelassen: ${falscherTyp.join(', ')}.`);
    }
    const zuViel = alle.length - falscherTyp.length - neu.length;
    if (zuViel > 0) {
      hinweise.push(
        `Die Unterlagen dürfen zusammen höchstens ${UNTERLAGEN_MAX_GESAMT_TEXT} groß sein (bis zu ${UNTERLAGEN_MAX_DATEIEN} Dateien); ${zuViel} Datei(en) wurden weggelassen – Fehlendes reichen Sie einfach nach.`,
      );
    }
    if (hinweise.length > 0) {
      setFehler(hinweise.join(' '));
    }
  }

  async function absenden(ereignis: React.FormEvent) {
    ereignis.preventDefault();
    setFehler(null);
    if (email.trim() === '' || name.trim() === '') {
      setFehler('Bitte Name und E-Mail-Adresse eintragen.');
      return;
    }
    if (!einwilligungBeauftragung || !einwilligungWeitergabe) {
      setFehler('Bitte beide Einwilligungen bestätigen – ohne Ja dürfen wir nicht starten.');
      return;
    }
    setStand('sendet');
    try {
      const daten = new FormData();
      daten.set('name', name);
      daten.set('email', email);
      daten.set('telefon', telefon);
      daten.set('bestellnummer', bestellnummer);
      daten.set('nachricht', nachricht);
      daten.set('firma_webseite', honigtopf);
      daten.set('einwilligungBeauftragung', einwilligungBeauftragung ? '1' : '');
      daten.set('einwilligungWeitergabe', einwilligungWeitergabe ? '1' : '');
      for (const datei of dateien) {
        daten.append('unterlagen', datei);
      }
      const antwort = await fetch('/api/durchsetzung', { method: 'POST', body: daten });
      if (antwort.status === 413) {
        // Die Plattform lehnt zu große Anfragen ab, bevor unsere Route läuft (kein JSON in der Antwort).
        setFehler(
          `Die Unterlagen sind zu groß (zusammen höchstens ${UNTERLAGEN_MAX_GESAMT_TEXT}). Bitte weniger oder kleinere Dateien senden – Fehlendes reichen Sie einfach nach.`,
        );
        setStand('offen');
        return;
      }
      const istJson = antwort.headers.get('content-type')?.includes('application/json') ?? false;
      const json: { ok?: boolean; fehler?: string } = istJson ? await antwort.json() : {};
      if (!antwort.ok || json.ok !== true) {
        setFehler(json.fehler ?? 'Das hat gerade nicht geklappt. Bitte später erneut versuchen.');
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
          <strong>Ihre Beauftragungsanfrage ist da.</strong> Die Anwälte prüfen Ihren Fall und
          melden sich bei Ihnen – Sie haben einen Ansprechpartner.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={absenden} noValidate className="karte">
      <TextFeld id="du-name" label="Ihr Name" autoComplete="name" wert={name} onChange={setName} />
      <TextFeld
        id="du-email"
        label="E-Mail-Adresse"
        typ="email"
        inputMode="email"
        autoComplete="email"
        platzhalter="name@beispiel.de"
        wert={email}
        onChange={setEmail}
      />
      <TextFeld id="du-telefon" label="Telefon (freiwillig)" typ="tel" inputMode="tel" autoComplete="tel" wert={telefon} onChange={setTelefon} />
      <TextFeld
        id="du-bestellnummer"
        label="Bestellnummer des Gutachtens (falls vorhanden)"
        erklaerung="Steht in der E-Mail mit Ihrem Gutachten, z. B. RR-2026-ABCDEF."
        autoComplete="off"
        wert={bestellnummer}
        onChange={setBestellnummer}
      />
      <div className="feld">
        <label htmlFor="du-unterlagen">Unterlagen (Police, letzte Standmitteilung – PDF oder Foto)</label>
        <p className="erklaerung">
          Bis zu {UNTERLAGEN_MAX_DATEIEN} Dateien, zusammen höchstens {UNTERLAGEN_MAX_GESAMT_TEXT}. Fehlendes reichen Sie einfach nach.
        </p>
        <input
          id="du-unterlagen"
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(ereignis) => dateienWaehlen(ereignis.target.files)}
        />
        {dateien.length > 0 && (
          <p className="feld-echo">
            {dateien.length} Datei(en) ausgewählt: {dateien.map((d) => d.name).join(', ')}
          </p>
        )}
      </div>
      <div className="feld">
        <label htmlFor="du-nachricht">Anmerkungen (freiwillig)</label>
        <textarea id="du-nachricht" rows={4} value={nachricht} onChange={(e) => setNachricht(e.target.value)} />
      </div>
      {/* Honigtopf: für Menschen unsichtbar, Bots füllen es aus. */}
      <div className="honigtopf" aria-hidden="true">
        <label htmlFor="du-firma">Firmen-Webseite (bitte leer lassen)</label>
        <input id="du-firma" type="text" tabIndex={-1} autoComplete="off" value={honigtopf} onChange={(e) => setHonigtopf(e.target.value)} />
      </div>
      <div className="hinweis neutral">
        <p style={{ margin: 0 }}>
          <strong>Konditionen vor Beauftragung:</strong> {KONDITIONEN_PLATZHALTER}
        </p>
      </div>
      <Kontrollkaestchen
        id="du-einwilligung-beauftragung"
        label={
          <>
            Ja, ich möchte, dass {BRAND.name} die Durchsetzung meines Falls mit spezialisierten
            Anwälten organisiert, und bitte um Kontaktaufnahme zum weiteren Vorgehen.
          </>
        }
        angehakt={einwilligungBeauftragung}
        onChange={setEinwilligungBeauftragung}
      />
      <Kontrollkaestchen
        id="du-einwilligung-weitergabe"
        label={
          <>
            Ja, meine Angaben und Unterlagen dürfen dafür an die Partnerkanzlei weitergegeben
            werden. Einzelheiten in der <Link href="/datenschutz">Datenschutzerklärung</Link>.
            (freiwillig, jederzeit widerrufbar)
          </>
        }
        angehakt={einwilligungWeitergabe}
        onChange={setEinwilligungWeitergabe}
      />
      {fehler !== null && (
        <p className="feld-fehler" role="alert">
          {fehler}
        </p>
      )}
      <button type="submit" className="knopf haupt" disabled={stand === 'sendet'}>
        {stand === 'sendet' ? 'Wird gesendet …' : 'Durchsetzung beauftragen'}
      </button>
    </form>
  );
}
