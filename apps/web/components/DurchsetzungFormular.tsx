'use client';

/**
 * Auftragsformular Durchsetzung (Prompt 13, 2.3): Kontakt, Bestellnummer,
 * Rechtsschutz-Frage, Unterlagen-Upload (als E-Mail-Anhang weitergereicht,
 * keine Speicherung auf dem Server), eigene, nicht vorangekreuzte
 * Einwilligungen. Honigtopf gegen Bots.
 */
import { useState } from 'react';
import Link from 'next/link';
import { BRAND } from '@/config/brand';
import { KONDITIONEN_PLATZHALTER } from '@/config/durchsetzung';
import { Kontrollkaestchen, RadioGruppe, TextFeld } from './funnel/fields';

const MAX_DATEIEN = 5;
const MAX_GROESSE = 8 * 1024 * 1024; // je Datei; die API begrenzt zusätzlich die Summe.

export function DurchsetzungFormular() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [telefon, setTelefon] = useState('');
  const [bestellnummer, setBestellnummer] = useState('');
  const [rechtsschutz, setRechtsschutz] = useState('');
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
    const neu = [...liste].filter((d) => d.size <= MAX_GROESSE).slice(0, MAX_DATEIEN);
    setDateien(neu);
    if ([...liste].some((d) => d.size > MAX_GROESSE)) {
      setFehler('Einzelne Dateien sind größer als 8 MB und wurden weggelassen.');
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
      daten.set('rechtsschutz', rechtsschutz);
      daten.set('nachricht', nachricht);
      daten.set('firma_webseite', honigtopf);
      daten.set('einwilligungBeauftragung', einwilligungBeauftragung ? '1' : '');
      daten.set('einwilligungWeitergabe', einwilligungWeitergabe ? '1' : '');
      for (const datei of dateien) {
        daten.append('unterlagen', datei);
      }
      const antwort = await fetch('/api/durchsetzung', { method: 'POST', body: daten });
      const json = (await antwort.json()) as { ok?: boolean; fehler?: string };
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
        label="Bestellnummer des Prüfberichts (falls vorhanden)"
        erklaerung="Steht in der E-Mail mit Ihrem Bericht, z. B. RR-2026-ABCDEF."
        autoComplete="off"
        wert={bestellnummer}
        onChange={setBestellnummer}
      />
      <RadioGruppe
        id="du-rechtsschutz"
        label="Haben Sie eine Rechtsschutzversicherung?"
        erklaerung="Sie hilft, ist aber keine Voraussetzung."
        nebeneinander
        optionen={[
          { wert: 'ja', label: 'Ja' },
          { wert: 'nein', label: 'Nein' },
          { wert: 'unbekannt', label: 'Weiß ich nicht' },
        ]}
        wert={rechtsschutz}
        onChange={setRechtsschutz}
      />
      <div className="feld">
        <label htmlFor="du-unterlagen">Unterlagen (Police, letzte Standmitteilung – PDF oder Foto)</label>
        <p className="erklaerung">Bis zu {MAX_DATEIEN} Dateien, je höchstens 8 MB. Fehlendes reichen Sie einfach nach.</p>
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
