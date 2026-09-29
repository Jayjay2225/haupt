'use client';

/**
 * Rechner-Assistent (Prompt 12, 3.2 – umgebaut nach Prompt 14, Abschnitt 2):
 * elf Schritte, eine Frage je Bildschirm, Fortschrittsbalken „Schritt x von
 * 11“, großer Weiter-Knopf unten fest. Einstieg nur über den grünen Knopf
 * der Startseiten-Ampel (Grün/Gelb) – die vier Werte werden übernommen. Es
 * gibt keine zweite Ampel und keine Ergebnis-Seite: Der letzte Schritt ist
 * die Bestellung, danach Stripe Checkout. Gekündigte/ausgezahlte Verträge
 * enden in Schritt 2 mit dem Rot-Text. „Später weitermachen – Link per
 * E-Mail“ ab Schritt 3. Zwischenspeicherung im Browser.
 *
 * Kanzlei-Variante (Modell C): Eignungs-Check statt Bestellung, Ende auf der
 * Ergebnis-Seite (/rechner/ergebnis) – unverändert.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BERICHT_PREIS_BRUTTO_EUR, FORTSETZEN_TAGE } from '@/config/business';
import { VARIANTE } from '@/config/variante';
import { ROT_STATUS } from '@/lib/ampel';
import type { BestellFehler } from '@/lib/bestellung';
import {
  SCHRITTE,
  SCHRITT_FRAGE,
  SCHRITT_HILFEFELD,
  SCHRITT_HILFESATZ,
  ladeDraft,
  leererDraft,
  loescheDraft,
  speichereDraft,
  validiereSchritt,
  vertragBeendet,
  type CaseDraft,
  type Fehlerliste,
  type Schritt,
} from '@/lib/draft';
import { WoFindeIchDas } from '../Hilfe';
import { FRAGE_ID, Kontrollkaestchen, TextFeld } from './fields';
import {
  SchrittAuszahlungen,
  SchrittBeginn,
  SchrittBeitrag,
  SchrittBeitragssumme,
  SchrittBestellung,
  SchrittDynamik,
  SchrittEignung,
  SchrittPerson,
  SchrittRueckkaufswert,
  SchrittStatus,
  SchrittTyp,
  SchrittVersicherer,
  type SchrittProps,
} from './steps';

const SCHRITT_KOMPONENTEN: Record<Schritt, (props: SchrittProps) => React.JSX.Element> = {
  typ: SchrittTyp,
  status: SchrittStatus,
  versicherer: SchrittVersicherer,
  beginn: SchrittBeginn,
  beitrag: SchrittBeitrag,
  dynamik: SchrittDynamik,
  beitragssumme: SchrittBeitragssumme,
  rueckkaufswert: SchrittRueckkaufswert,
  auszahlungen: SchrittAuszahlungen,
  eignung: SchrittEignung,
  person: SchrittPerson,
  bestellung: SchrittBestellung,
};

/** Schritte ohne Pflichtangabe: „Überspringen“ statt erzwungener Eingabe. */
const UEBERSPRINGBAR: ReadonlySet<Schritt> = new Set<Schritt>(['beitragssumme']);

/** Ab diesem Schritt (Index 2 = Schritt 3) gibt es „Später weitermachen“. */
const WEITERMACHEN_AB_INDEX = 2;

const EMAIL_MUSTER = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const BESTELLKNOPF_TEXT = `Zahlungspflichtig bestellen · ${BERICHT_PREIS_BRUTTO_EUR} €`;

interface RechnerFunnelProps {
  versichererNamen: string[];
  /** /bestellen: direkt zum letzten Schritt (sofern die vorherigen vollständig sind). */
  startSchritt?: Schritt | undefined;
  /** Zurück von der Zahlungsseite ohne Zahlung. */
  abgebrochen?: boolean | undefined;
  /** FONDS_MODE === 'anfrage' (serverseitig ermittelt): fondsgebundene Verträge laufen über /anfrage. */
  fondsAnfrage?: boolean | undefined;
}

export function RechnerFunnel({ versichererNamen, startSchritt, abgebrochen, fondsAnfrage }: RechnerFunnelProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<CaseDraft>(leererDraft);
  const [schrittIndex, setSchrittIndex] = useState(0);
  const [fehler, setFehler] = useState<Fehlerliste>({});
  const [geladen, setGeladen] = useState(false);
  const [laeuft, setLaeuft] = useState(false);
  const [fallFehler, setFallFehler] = useState<string | undefined>(undefined);
  const [freischaltcode, setFreischaltcode] = useState('');
  const [honig, setHonig] = useState('');
  const [weitermachenOffen, setWeitermachenOffen] = useState(false);
  const [weitermachenEmail, setWeitermachenEmail] = useState('');
  const [weitermachenOk, setWeitermachenOk] = useState(false);
  const [weitermachenHinweis, setWeitermachenHinweis] = useState<string | null>(null);
  const frageRef = useRef<HTMLHeadingElement>(null);
  const vorigerIndex = useRef<number | null>(null);

  useEffect(() => {
    const geladener = ladeDraft();
    setDraft(geladener);
    setWeitermachenEmail(geladener.email);
    setGeladen(true);
    if (startSchritt !== undefined) {
      // Zum gewünschten Schritt springen – oder zum ersten unvollständigen davor
      // bzw. zum Rot-Ende, wenn der Vertrag beendet ist.
      let ziel = SCHRITTE.indexOf(startSchritt);
      for (let index = 0; index < ziel; index += 1) {
        const s = SCHRITTE[index] as Schritt;
        if ((s === 'status' && vertragBeendet(geladener)) || Object.keys(validiereSchritt(s, geladener)).length > 0) {
          ziel = index;
          break;
        }
      }
      setSchrittIndex(Math.max(0, ziel));
    }
  }, [startSchritt]);

  useEffect(() => {
    if (geladen) {
      speichereDraft(draft);
    }
  }, [draft, geladen]);

  // Nach einem Schrittwechsel den Fokus auf die neue Frage setzen (Screenreader, Tastatur);
  // nicht beim ersten Laden oder Direkteinstieg.
  useEffect(() => {
    if (!geladen) {
      return;
    }
    if (vorigerIndex.current !== null && vorigerIndex.current !== schrittIndex) {
      frageRef.current?.focus({ preventScroll: true });
    }
    vorigerIndex.current = schrittIndex;
  }, [schrittIndex, geladen]);

  const aendere = useCallback(
    <K extends keyof CaseDraft>(feld: K, wert: CaseDraft[K]) => {
      setDraft((bisher) => ({ ...bisher, [feld]: wert }));
      setFehler((bisher) => {
        if (bisher[feld] === undefined) {
          return bisher;
        }
        const kopie = { ...bisher };
        delete kopie[feld];
        return kopie;
      });
    },
    [],
  );

  if (!geladen) {
    return <p>Der Rechner lädt …</p>;
  }

  // Einstieg nur über die Startseiten-Ampel (Prompt 14, 2) – die Kanzlei-Variante hat keine.
  if (VARIANTE.berichtKostenpflichtig && draft.startAmpel === '') {
    return (
      <>
        <h1>Erst die Ampel, dann der Rechner.</h1>
        <p style={{ fontSize: '1.15rem' }}>
          Vier Angaben auf der Startseite genügen – zeigt die Ampel Grün oder Gelb, geht es mit dem
          grünen Knopf hier weiter. Ihre Angaben werden übernommen.
        </p>
        <p>
          <Link href="/#ampel" className="knopf haupt">
            Zur Ampel
          </Link>
        </p>
      </>
    );
  }

  const schritt = SCHRITTE[schrittIndex] ?? 'typ';
  const istLetzter = schrittIndex === SCHRITTE.length - 1;
  const AktuellerSchritt = SCHRITT_KOMPONENTEN[schritt];
  const fortschrittProzent = Math.round(((schrittIndex + 1) / SCHRITTE.length) * 100);
  const beendetEnde = schritt === 'status' && vertragBeendet(draft);
  const hilfeFeld = SCHRITT_HILFEFELD[schritt];

  function springeZu(ziel: Schritt) {
    const index = SCHRITTE.indexOf(ziel);
    if (index >= 0) {
      setFehler({});
      setSchrittIndex(index);
      window.scrollTo({ top: 0 });
    }
  }

  function weiter() {
    const neueFehler = validiereSchritt(schritt, draft);
    setFehler(neueFehler);
    if (Object.keys(neueFehler).length > 0) {
      return;
    }
    if (istLetzter) {
      if (schritt === 'bestellung') {
        void bestellen();
      } else {
        absendenKanzlei();
      }
      return;
    }
    setSchrittIndex((index) => Math.min(index + 1, SCHRITTE.length - 1));
    window.scrollTo({ top: 0 });
  }

  function zurueck() {
    setFehler({});
    setSchrittIndex((index) => Math.max(index - 1, 0));
    window.scrollTo({ top: 0 });
  }

  /** Alle Eingaben auf diesem Gerät löschen (Zusage im Fußtext und in der Datenschutzerklärung). */
  function allesLoeschen() {
    loescheDraft();
    setDraft(leererDraft());
    setFehler({});
    setFallFehler(undefined);
    setWeitermachenEmail('');
    setSchrittIndex(0);
    window.scrollTo({ top: 0 });
  }

  /** Einwilligungen gelten je Bestellung – nicht in eine spätere Sitzung auf diesem Gerät übernehmen. */
  function ohneEinwilligungen(): CaseDraft {
    const bereinigt: CaseDraft = {
      ...draft,
      einwilligungDatenschutz: false,
      agbGelesen: false,
      ausfuehrungZugestimmt: false,
    };
    setDraft(bereinigt);
    speichereDraft(bereinigt);
    return bereinigt;
  }

  /** Prüft alle Schritte; springt zum ersten fehlerhaften. Liefert true, wenn alles gültig ist. */
  function allesGueltig(): boolean {
    if (vertragBeendet(draft)) {
      springeZu('status'); // zeigt das Rot-Ende
      return false;
    }
    for (let index = 0; index < SCHRITTE.length; index += 1) {
      const zuPruefen = SCHRITTE[index] as Schritt;
      const schrittFehler = validiereSchritt(zuPruefen, draft);
      if (Object.keys(schrittFehler).length > 0) {
        setSchrittIndex(index);
        setFehler(schrittFehler);
        window.scrollTo({ top: 0 });
        return false;
      }
    }
    return true;
  }

  /** Kanzlei-Variante: Ergebnis-Seite mit Eignungs-Check. */
  function absendenKanzlei() {
    if (!allesGueltig()) {
      return;
    }
    const abgesendet: CaseDraft = { ...draft, eingereichtAm: new Date().toISOString() };
    setDraft(abgesendet);
    speichereDraft(abgesendet);
    router.push('/rechner/ergebnis');
  }

  /** Schritt 11: Bestellung anlegen → Stripe Checkout (oder Erstkunden-Weg). */
  async function bestellen() {
    if (!allesGueltig()) {
      return;
    }
    setLaeuft(true);
    setFallFehler(undefined);
    try {
      const antwort = await fetch('/api/bestellung', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft, freischaltcode: freischaltcode.trim(), firma_webseite: honig }),
      });
      const daten = (await antwort.json()) as { url?: string; erstkunde?: boolean; fehler?: BestellFehler };
      if (antwort.ok && daten.erstkunde === true) {
        ohneEinwilligungen();
        window.location.assign('/bestellen/danke?ek=1');
        return;
      }
      if (antwort.ok && daten.url !== undefined) {
        ohneEinwilligungen();
        window.location.assign(daten.url);
        return;
      }
      const serverFehler = daten.fehler ?? { fall: 'Das hat nicht geklappt. Bitte noch einmal versuchen.' };
      const { fall, ...felder } = serverFehler;
      setFallFehler(fall);
      if (Object.keys(felder).length > 0) {
        setFehler(felder);
        // Feldfehler aus „Über Sie“ → dorthin springen.
        if (Object.keys(felder).some((f) => ['anrede', 'vorname', 'nachname', 'email', 'geburtsdatum', 'strasse', 'plz', 'ort'].includes(f))) {
          springeZu('person');
        }
      }
    } catch {
      setFallFehler('Keine Verbindung. Bitte noch einmal versuchen.');
    } finally {
      setLaeuft(false);
    }
  }

  async function weitermachenSenden() {
    const email = weitermachenEmail.trim();
    if (!EMAIL_MUSTER.test(email) || !weitermachenOk) {
      setWeitermachenHinweis('Bitte E-Mail-Adresse eintragen und das Häkchen setzen.');
      return;
    }
    // Die Link-Adresse ersetzt nie eine in Schritt 10 eingetragene Gutachten-Adresse;
    // das Link-Häkchen wird als eigene Einwilligung gesendet, keine Bestell-Einwilligung
    // wird stellvertretend gesetzt.
    const mitEmail: CaseDraft = { ...draft, email: draft.email.trim() === '' ? email : draft.email };
    setDraft(mitEmail);
    setWeitermachenHinweis('Der Link wird verschickt …');
    let hinweis = 'Der Link konnte gerade nicht verschickt werden. Ihre Angaben bleiben auf diesem Gerät gespeichert.';
    try {
      const antwort = await fetch('/api/ergebnis-link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ draft: mitEmail, empfaenger: email, linkEinwilligung: true }),
      });
      const daten = (await antwort.json().catch(() => ({}))) as { ok?: boolean };
      if (antwort.ok && daten.ok === true) {
        hinweis = 'Der Link ist unterwegs an Ihre E-Mail-Adresse.';
        setWeitermachenOffen(false);
      } else if (antwort.status === 429) {
        hinweis = 'Zu viele Anfragen von diesem Anschluss – bitte in einer Stunde noch einmal versuchen.';
      }
    } catch {
      // Netzfehler → allgemeiner Hinweis
    }
    setWeitermachenHinweis(hinweis);
  }

  const hatFehler = Object.keys(fehler).length > 0;
  const knopfText = istLetzter
    ? schritt === 'bestellung'
      ? laeuft
        ? 'Wird gesendet …'
        : freischaltcode.trim() !== ''
          ? 'Kostenlos anfordern (Erstkunde)'
          : BESTELLKNOPF_TEXT
      : 'Ergebnis anzeigen'
    : UEBERSPRINGBAR.has(schritt) && draft.gesamtsummeLautMitteilung.trim() === '' && !draft.erstbeitragUnbekannt
      ? 'Überspringen'
      : 'Weiter';

  return (
    <div className="assistent">
      {abgebrochen === true && (
        <div className="hinweis" role="status">
          <p style={{ margin: 0 }}>Die Zahlung wurde abgebrochen. Es wurde nichts berechnet. Sie können es hier noch einmal versuchen.</p>
        </div>
      )}
      <div
        className="fortschritt"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={fortschrittProzent}
        aria-label={`Schritt ${schrittIndex + 1} von ${SCHRITTE.length}`}
      >
        <span style={{ width: `${fortschrittProzent}%` }} />
      </div>
      <p className="erklaerung fortschritt-text">
        Schritt {schrittIndex + 1} von {SCHRITTE.length}
      </p>

      <form
        noValidate
        onSubmit={(ereignis) => {
          ereignis.preventDefault();
          if (!beendetEnde && !laeuft) {
            weiter();
          }
        }}
      >
        <h1 id={FRAGE_ID} ref={frageRef} tabIndex={-1} className="assistent-frage">
          {SCHRITT_FRAGE[schritt]}
        </h1>
        <p className="erklaerung" style={{ fontSize: '1.0625rem' }}>
          {SCHRITT_HILFESATZ[schritt]}
        </p>
        {hatFehler && (
          <p className="feld-fehler" role="alert">
            Bitte die markierten Felder prüfen.
          </p>
        )}
        <AktuellerSchritt
          draft={draft}
          fehler={fehler}
          aendere={aendere}
          versichererNamen={versichererNamen}
          fondsAnfrage={fondsAnfrage}
          springeZu={schritt === 'bestellung' ? springeZu : undefined}
          bestellung={
            schritt === 'bestellung' ? { freischaltcode, setFreischaltcode, honig, setHonig, fallFehler } : undefined
          }
        />
        {hilfeFeld !== undefined && <WoFindeIchDas feld={hilfeFeld} />}

        {beendetEnde ? (
          // Prompt 14, Schritt 2: Gekündigt/Ausgezahlt – der Funnel endet hier mit dem Rot-Text, kein Kauf.
          <div className="hinweis" role="status" data-ende="rot">
            <p style={{ margin: 0, fontWeight: 600 }}>{ROT_STATUS.titel}</p>
            <p style={{ margin: '0.5rem 0 0' }}>{ROT_STATUS.zeile}</p>
            <p style={{ margin: '0.75rem 0 0' }}>
              <Link href="/">Zur Startseite</Link>
            </p>
          </div>
        ) : (
          <div className="formular-aktionen">
            {schrittIndex > 0 && (
              <button type="button" className="knopf zweitrangig" onClick={zurueck} disabled={laeuft}>
                Zurück
              </button>
            )}
            <button
              type="submit"
              className={schritt === 'bestellung' ? 'knopf kauf fix-unten' : 'knopf haupt fix-unten'}
              disabled={laeuft}
            >
              {knopfText}
            </button>
          </div>
        )}
        {beendetEnde && schrittIndex > 0 && (
          <div className="formular-aktionen">
            <button type="button" className="knopf zweitrangig" onClick={zurueck}>
              Zurück
            </button>
          </div>
        )}
      </form>

      {schrittIndex >= WEITERMACHEN_AB_INDEX && !beendetEnde && (
        <div className="weitermachen">
          {!weitermachenOffen ? (
            <button type="button" className="link-knopf" onClick={() => setWeitermachenOffen(true)}>
              Später weitermachen – Link per E-Mail
            </button>
          ) : (
            <div className="karte klein">
              <TextFeld
                id="weitermachen-email"
                label="E-Mail-Adresse für den Link"
                typ="email"
                inputMode="email"
                autoComplete="email"
                platzhalter="name@beispiel.de"
                wert={weitermachenEmail}
                onChange={setWeitermachenEmail}
              />
              <Kontrollkaestchen
                id="weitermachen-ok"
                label={
                  <>
                    Ja, schickt mir den Link ({FORTSETZEN_TAGE} Tage gültig). Einzelheiten in der{' '}
                    <Link href="/datenschutz">Datenschutzerklärung</Link>.
                  </>
                }
                angehakt={weitermachenOk}
                onChange={setWeitermachenOk}
              />
              <div className="formular-aktionen" style={{ marginTop: 0 }}>
                <button type="button" className="knopf zweitrangig klein" onClick={() => void weitermachenSenden()}>
                  Link senden
                </button>
                <button type="button" className="knopf zweitrangig klein" onClick={() => setWeitermachenOffen(false)}>
                  Abbrechen
                </button>
              </div>
            </div>
          )}
          {weitermachenHinweis !== null && <p className="erklaerung">{weitermachenHinweis}</p>}
        </div>
      )}

      <p className="erklaerung" style={{ marginTop: '1.5rem' }}>
        Ihre Eingaben bleiben auf diesem Gerät gespeichert, bis Sie sie löschen. Sie können die
        Seite schließen und später hier weitermachen.{' '}
        <button type="button" className="link-knopf" onClick={allesLoeschen} disabled={laeuft}>
          Angaben auf diesem Gerät löschen
        </button>
      </p>
    </div>
  );
}
