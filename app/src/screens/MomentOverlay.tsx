import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Atemkreis } from '../komponenten/Atemkreis';
import { Kacheln } from '../komponenten/Kacheln';
import {
  ALTERNATIVEN, BEDUERFNISSE, BEREICHS_KATALOGE, GEFUEHLE, bereichsName, impulsLabel,
} from '../daten';
import { berechnePunkte } from '../logik/scoring';
import { holeBereiche, holeProfil, neueEntitaet, speichereMoment } from '../db';
import type {
  BeduerfnisId, BereichId, BereichKonfig, Eingabeart, Entscheidung, GefuehlId, Intensitaet, Moment,
} from '../logik/typen';
import { t } from '../texte';

export interface MomentStart {
  eingabeart: Eingabeart;
  impulsId?: string;
  freitext?: string;
  bereiche: BereichId[];
  beduerfnisVorschlaege?: BeduerfnisId[];
  krise?: boolean;
}

type Schritt =
  | 'ankommen' | 'gefuehl' | 'beduerfnis' | 'entscheidung'
  | 'timer' | 'nochda' | 'abschluss' | 'krise';

const SCHRITTFOLGE: Schritt[] = ['ankommen', 'gefuehl', 'beduerfnis', 'entscheidung', 'abschluss'];

export function MomentOverlay({
  start,
  onSchliessen,
}: {
  start: MomentStart;
  onSchliessen: (gespeichert: boolean) => void;
}) {
  const [schritt, setSchritt] = useState<Schritt>(start.krise ? 'krise' : 'ankommen');
  const [gefuehl, setGefuehl] = useState<GefuehlId | undefined>();
  const [intensitaet, setIntensitaet] = useState<Intensitaet | undefined>();
  const [beduerfnis, setBeduerfnis] = useState<BeduerfnisId | undefined>();
  const [konfigs, setKonfigs] = useState<BereichKonfig[]>([]);
  const [vision, setVision] = useState<string>('');
  const [timerRest, setTimerRest] = useState(600);
  const [timerTempo, setTimerTempo] = useState(1);
  const [ausgang, setAusgang] = useState<{
    entscheidung: Entscheidung;
    wartenErgebnis?: 'vorbei' | 'bewusst-ja';
    alternative?: string;
  } | null>(null);

  const startZeit = useRef(Date.now());
  const timerSekunden = useRef(0);
  const gefuehlAbgeschlossen = useRef(false);
  const gespeichert = useRef(false);

  useEffect(() => {
    void holeBereiche().then(setKonfigs);
    void holeProfil().then((p) => setVision(p.vision[0] ?? ''));
  }, []);

  /* Ankommen: nach ~7 s automatisch weiter */
  useEffect(() => {
    if (schritt !== 'ankommen') return;
    const timeout = window.setTimeout(() => setSchritt('gefuehl'), 7000);
    return () => window.clearTimeout(timeout);
  }, [schritt]);

  /* Timer: 10 Minuten, Demo-Raffer ×60 */
  useEffect(() => {
    if (schritt !== 'timer') return;
    const takt = window.setInterval(() => {
      timerSekunden.current += 1;
      setTimerRest((r) => {
        const neu = r - timerTempo;
        if (neu <= 0) {
          window.clearInterval(takt);
          setSchritt('nochda');
          return 0;
        }
        return neu;
      });
    }, 1000);
    return () => window.clearInterval(takt);
  }, [schritt, timerTempo]);

  /* Kompass-Spiegel: Ziel → Wunschbild → Vision → neutral (Stufenkette, Kapitel 4) */
  const spiegel = useMemo(() => {
    const betroffene = konfigs.filter((k) => k.aktiv && start.bereiche.includes(k.bereichId));
    for (const k of betroffene) {
      if (k.ziele.length > 0) {
        return { typ: 'ziel' as const, text: t('moment.kompassZiel', { ziel: k.ziele[0].text }), woran: k.woranIchArbeite };
      }
    }
    for (const k of betroffene) {
      const labels = wunschbildLabels(k).slice(0, 2);
      if (labels.length > 0) {
        return { typ: 'wunschbild' as const, text: t('moment.kompassWunschbild', { satz: labels.join(' · ') }), woran: k.woranIchArbeite };
      }
    }
    if (vision) return { typ: 'vision' as const, text: t('moment.kompassVision', { satz: vision }), woran: '' };
    return { typ: 'neutral' as const, text: '', woran: '' };
  }, [konfigs, start.bereiche, vision]);

  const speichern = useCallback(
    (e: { entscheidung: Entscheidung; wartenErgebnis?: 'vorbei' | 'bewusst-ja'; alternative?: string }) => {
      if (gespeichert.current) return;
      gespeichert.current = true;
      const punkte = berechnePunkte({
        gefuehlAbgeschlossen: gefuehlAbgeschlossen.current,
        entscheidung: e.entscheidung,
        wartenErgebnis: e.wartenErgebnis,
        bereicheZugeordnet: start.bereiche.length > 0,
      });
      const dauer = Math.max(1, Math.round((Date.now() - startZeit.current) / 1000) - timerSekunden.current);
      const moment: Moment = neueEntitaet({
        zeitpunkt: new Date().toISOString(),
        eingabeart: start.eingabeart,
        impulsId: start.impulsId,
        freitext: start.freitext,
        gefuehl,
        intensitaet,
        beduerfnis,
        kompassSpiegelTyp: spiegel.typ,
        entscheidung: e.entscheidung,
        gewaehlteAlternative: e.alternative,
        wartenErgebnis: e.wartenErgebnis,
        bereiche: start.bereiche,
        punkte,
        dauerSekunden: dauer,
      });
      void speichereMoment(moment);
      return punkte;
    },
    [gefuehl, intensitaet, beduerfnis, start, spiegel],
  );

  /* Schließen: nach dem Gefühl-Schritt zählt der Moment (Abbruch, still) — davor nicht. */
  const schliessen = useCallback(() => {
    if (schritt === 'abschluss' || schritt === 'krise') {
      onSchliessen(schritt === 'abschluss');
      return;
    }
    if (gefuehlAbgeschlossen.current && !gespeichert.current) {
      speichern({ entscheidung: 'abbruch' });
      onSchliessen(true);
      return;
    }
    onSchliessen(false);
  }, [schritt, onSchliessen, speichern]);

  useEffect(() => {
    const beiTaste = (e: KeyboardEvent) => {
      if (e.key === 'Escape') schliessen();
    };
    window.addEventListener('keydown', beiTaste);
    return () => window.removeEventListener('keydown', beiTaste);
  }, [schliessen]);

  const impulsText = impulsLabel(start.impulsId, start.freitext) || t('moment.spiegelOhneImpuls');
  const spiegelSatz = start.impulsId || start.freitext
    ? t('moment.spiegelMitImpuls', { impuls: impulsLabel(start.impulsId, start.freitext) })
    : t('moment.spiegelOhneImpuls');

  /* Alternativen passend zum Bedürfnis: eigene zuerst, dann Standardvorschläge */
  const alternativen = useMemo(() => {
    const b = beduerfnis ?? 'pause';
    const eigene = konfigs
      .filter((k) => k.aktiv && start.bereiche.includes(k.bereichId))
      .flatMap((k) => k.alternativen.filter((a) => a.beduerfnis === b).map((a) => a.text));
    const standard = ALTERNATIVEN.filter((a) => a.beduerfnis === b).map((a) => a.label);
    return [...new Set([...eigene, ...standard])].slice(0, 3);
  }, [beduerfnis, konfigs, start.bereiche]);

  const beduerfnisVorschlaege = useMemo(() => {
    const ausGefuehl = GEFUEHLE.find((g) => g.id === gefuehl)?.beduerfnis_hinweise ?? [];
    return new Set([...(start.beduerfnisVorschlaege ?? []), ...ausGefuehl].slice(0, 3));
  }, [gefuehl, start.beduerfnisVorschlaege]);

  const fortschritt = SCHRITTFOLGE.indexOf(
    schritt === 'timer' || schritt === 'nochda' ? 'entscheidung' : schritt === 'krise' ? 'ankommen' : schritt,
  );

  function weiterNachGefuehl() {
    gefuehlAbgeschlossen.current = true;
    setSchritt('beduerfnis');
  }

  function abschliessen(e: { entscheidung: Entscheidung; wartenErgebnis?: 'vorbei' | 'bewusst-ja'; alternative?: string }) {
    setAusgang(e);
    speichern(e);
    setSchritt('abschluss');
  }

  const punkteAnzeige = useMemo(() => {
    if (!ausgang) return null;
    return berechnePunkte({
      gefuehlAbgeschlossen: gefuehlAbgeschlossen.current,
      entscheidung: ausgang.entscheidung,
      wartenErgebnis: ausgang.wartenErgebnis,
      bereicheZugeordnet: start.bereiche.length > 0,
    });
  }, [ausgang, start.bereiche]);

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={t('app.name')}>
      <header className="overlay-kopf">
        <div className="fortschritt" aria-hidden="true">
          {SCHRITTFOLGE.map((s, i) => (
            <span key={s} className={'fortschritt-punkt' + (i <= fortschritt ? ' aktiv' : '')} />
          ))}
        </div>
        <button type="button" className="schliessen" aria-label={t('allgemein.schliessen')} onClick={schliessen}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
        </button>
      </header>

      {schritt === 'ankommen' && (
        <section className="schrittflaeche mittig">
          <h1 className="momentsatz">{spiegelSatz}</h1>
          <Atemkreis />
          <button type="button" className="knopf-still" onClick={() => setSchritt('gefuehl')}>
            {t('allgemein.weiter')}
          </button>
        </section>
      )}

      {schritt === 'gefuehl' && (
        <section className="schrittflaeche">
          <h1 className="frage">{t('moment.gefuehlFrage')}</h1>
          <p className="hinweis">{t('moment.gefuehlHinweis')}</p>
          <Kacheln
            eintraege={GEFUEHLE.map((g) => ({ id: g.id, label: g.label }))}
            gewaehlt={gefuehl}
            onWahl={(id) => {
              if (gefuehl === id) { weiterNachGefuehl(); return; }
              setGefuehl(id as GefuehlId);
            }}
          />
          {gefuehl && (
            <div className="intensitaet">
              <span className="hinweis">{t('moment.intensitaetFrage')}</span>
              {(['leicht', 'mittel', 'stark'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={'chip' + (intensitaet === s ? ' chip-aktiv' : '')}
                  onClick={() => { setIntensitaet(s); weiterNachGefuehl(); }}
                >
                  {t(`moment.intensitaet.${s}`)}
                </button>
              ))}
              <button type="button" className="knopf-still" onClick={weiterNachGefuehl}>
                {t('allgemein.weiter')}
              </button>
            </div>
          )}
          <button type="button" className="skip" onClick={weiterNachGefuehl}>
            {t('allgemein.ueberspringen')}
          </button>
        </section>
      )}

      {schritt === 'beduerfnis' && (
        <section className="schrittflaeche">
          <h1 className="frage">
            {start.impulsId || start.freitext
              ? t('moment.beduerfnisFrage', { impuls: impulsText })
              : t('moment.beduerfnisFrageOhne')}
          </h1>
          <Kacheln
            eintraege={BEDUERFNISSE.map((b) => ({
              id: b.id,
              label: b.label,
              hinweis: beduerfnisVorschlaege.has(b.id) ? t('moment.vielleichtDas') : undefined,
            }))}
            gewaehlt={beduerfnis}
            onWahl={(id) => { setBeduerfnis(id as BeduerfnisId); setSchritt('entscheidung'); }}
          />
          <button type="button" className="skip" onClick={() => setSchritt('entscheidung')}>
            {t('allgemein.ueberspringen')}
          </button>
        </section>
      )}

      {schritt === 'entscheidung' && (
        <section className="schrittflaeche">
          {spiegel.text && (
            <div className="kompass-spiegel">
              <p className="ks-satz">{spiegel.text}</p>
              <p className="ks-frage">{t('moment.kompassFrage')}</p>
            </div>
          )}
          {!spiegel.text && <h1 className="frage">{t('moment.kompassFrage')}</h1>}
          {spiegel.woran && <p className="hinweis">{t('moment.woranHinweis', { text: spiegel.woran })}</p>}
          {gefuehl && gefuehl !== 'gut' && gefuehl !== 'weiss-nicht' && (
            <p className="gefuehl-spiegel">
              {t('moment.gefuehlSpiegel', { gefuehl: GEFUEHLE.find((g) => g.id === gefuehl)?.label ?? '' })}
            </p>
          )}
          <div className="optionen">
            <div className="option">
              <h2>{t('optionen.alternative')}</h2>
              <div className="alt-liste">
                {alternativen.map((a) => (
                  <button key={a} type="button" className="alt-zeile" onClick={() => abschliessen({ entscheidung: 'alternative', alternative: a })}>
                    <span aria-hidden="true">—</span> {a}
                  </button>
                ))}
              </div>
            </div>
            <button type="button" className="option option-knopf" onClick={() => { setTimerRest(600); setTimerTempo(1); setSchritt('timer'); }}>
              <h2>{t('optionen.warten')}</h2>
              <p>{t('optionen.wartenText')}</p>
            </button>
            <button type="button" className="option option-knopf" onClick={() => abschliessen({ entscheidung: 'bewusst-ja' })}>
              <h2>{t('optionen.bewusstJa')}</h2>
              <p>{t('optionen.bewusstJaText')}</p>
            </button>
          </div>
          <button type="button" className="skip" onClick={schliessen}>
            {t('allgemein.ueberspringen')}
          </button>
        </section>
      )}

      {schritt === 'timer' && (
        <section className="schrittflaeche mittig">
          <div className="timer-ring" role="timer" aria-live="off">
            <span className="timer-zeit">
              {Math.floor(timerRest / 60)}:{String(timerRest % 60).padStart(2, '0')}
            </span>
          </div>
          <p className="hinweis">{t('timer.laeuft')}</p>
          {timerTempo === 1 && (
            <button type="button" className="chip chip-demo" onClick={() => setTimerTempo(60)}>
              Demo: ×60
            </button>
          )}
        </section>
      )}

      {schritt === 'nochda' && (
        <section className="schrittflaeche mittig">
          <h1 className="frage">{t('timer.nochDa')}</h1>
          <div className="optionen">
            <button type="button" className="option option-knopf" onClick={() => abschliessen({ entscheidung: 'warten', wartenErgebnis: 'vorbei' })}>
              <h2>{t('timer.gelegt')}</h2>
            </button>
            <button type="button" className="option option-knopf" onClick={() => setSchritt('entscheidung')}>
              <h2>{t('timer.nochWill')}</h2>
            </button>
          </div>
        </section>
      )}

      {schritt === 'abschluss' && (
        <section className="schrittflaeche mittig">
          <h1 className="momentsatz">{t('abschluss.titel')}</h1>
          <div className="punkte">
            <span className="punkt-chip">{t('abschluss.achtsamkeit')}</span>
            {punkteAnzeige?.kompass === 1 && start.bereiche[0] && (
              <span className="punkt-chip">{t('abschluss.kompass', { bereich: bereichsName(start.bereiche[0]) })}</span>
            )}
          </div>
          {start.bereiche.length > 0 && (
            <p className="hinweis">
              {t('abschluss.zaehltFuer', { bereiche: start.bereiche.map(bereichsName).join(', ') })}
            </p>
          )}
          <button type="button" className="knopf" onClick={() => onSchliessen(true)}>
            {t('allgemein.fertig')}
          </button>
        </section>
      )}

      {schritt === 'krise' && (
        <section className="schrittflaeche">
          <h1 className="momentsatz">{t('krise.titel')}</h1>
          <p className="fliess">{t('krise.text')}</p>
          <div className="krise-nummern">
            <a className="krise-nummer" href="tel:08001110111">
              <span className="krise-label">{t('krise.telefonseelsorge')}</span>
              <span className="krise-zahl">0800 111 0 111</span>
            </a>
            <a className="krise-nummer" href="tel:116123">
              <span className="krise-label">{t('krise.telefonseelsorge')}</span>
              <span className="krise-zahl">116 123</span>
            </a>
          </div>
          <p className="hinweis">{t('krise.akut')}</p>
          <button type="button" className="knopf-still" onClick={() => onSchliessen(false)}>
            {t('krise.danebengegriffen')}
          </button>
        </section>
      )}
    </div>
  );
}

function wunschbildLabels(k: BereichKonfig): string[] {
  const katalog = BEREICHS_KATALOGE[k.bereichId];
  const ausKatalog = k.wunschbild
    .map((id) => katalog.wunschbild.find((o) => o.id === id)?.label)
    .filter((l): l is string => Boolean(l) && l !== 'Weiß ich noch nicht');
  return [...ausKatalog, ...k.wunschbildFrei];
}
