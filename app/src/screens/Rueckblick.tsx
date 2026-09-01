import { useEffect, useMemo, useState } from 'react';
import { Liniendiagramm, type LinienPunkt } from '../komponenten/Liniendiagramm';
import { Punktreihe } from '../komponenten/Punktreihe';
import { bereichsName } from '../daten';
import {
  alleMomente, alleReflexionen, holeBereiche, holeProfil, momenteZwischen,
  neueEntitaet, reflexionFuer, speichereBereich, speichereEinsicht, speichereReflexion,
  offeneEinsichten,
} from '../db';
import { findeMuster, folgetagKandidat } from '../logik/einsichten';
import { reflexionsStreak, wochenbilanz } from '../logik/scoring';
import { isoWoche, wocheDavor, wochenstart } from '../logik/wochen';
import type { BereichKonfig, Einsicht, Moment, Wochenreflexion } from '../logik/typen';
import { t } from '../texte';

type Segment = 'reflexion' | 'trends' | 'einsichten';

export function Rueckblick({ aktualisiert, onGeaendert }: { aktualisiert: number; onGeaendert: () => void }) {
  const [segment, setSegment] = useState<Segment>('reflexion');
  return (
    <section className="screen-inhalt">
      <div className="segmente" role="tablist">
        {(['reflexion', 'trends', 'einsichten'] as Segment[]).map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={segment === s}
            className={'segment' + (segment === s ? ' segment-aktiv' : '')}
            onClick={() => setSegment(s)}
          >
            {t(`rueckblick.${s}`)}
          </button>
        ))}
      </div>
      {segment === 'reflexion' && <Reflexion aktualisiert={aktualisiert} onGeaendert={onGeaendert} />}
      {segment === 'trends' && <Trends aktualisiert={aktualisiert} />}
      {segment === 'einsichten' && <Einsichten aktualisiert={aktualisiert} />}
    </section>
  );
}

/* ---------------- Reflexion: geführte Sequenz, ein Bereich pro Schritt ---------------- */

function Reflexion({ aktualisiert, onGeaendert }: { aktualisiert: number; onGeaendert: () => void }) {
  const woche = isoWoche(new Date());
  const [konfigs, setKonfigs] = useState<BereichKonfig[]>([]);
  const [bestehend, setBestehend] = useState<Wochenreflexion | undefined>();
  const [satz, setSatz] = useState('');
  const [streak, setStreak] = useState(0);
  const [laeuft, setLaeuft] = useState(false);
  const [index, setIndex] = useState(0);
  const [antworten, setAntworten] = useState<Wochenreflexion['bereiche']>([]);
  const [momenteJeBereich, setMomenteJeBereich] = useState<Record<string, number>>({});
  const [vorwoche, setVorwoche] = useState<Record<string, string>>({});

  useEffect(() => {
    void (async () => {
      const alle = await holeBereiche();
      setKonfigs(alle.filter((k) => k.aktiv));
      setBestehend(await reflexionFuer(woche));
      const von = wochenstart(new Date());
      const momente = await momenteZwischen(von, new Date(von.getTime() + 7 * 86400000));
      const b = wochenbilanz(momente);
      setSatz(
        b.momente === 0
          ? t('rueckblick.wochenSatzLeer')
          : t('rueckblick.wochenSatz', { momente: b.momente, richtung: b.inDeineRichtung, ja: b.bewussteJa }),
      );
      const zaehler: Record<string, number> = {};
      for (const m of momente) for (const bid of m.bereiche) zaehler[bid] = (zaehler[bid] ?? 0) + 1;
      setMomenteJeBereich(zaehler);
      const reflexionen = await alleReflexionen();
      const wochen = new Set(reflexionen.filter((r) => r.streakRelevant).map((r) => r.woche));
      setStreak(reflexionsStreak(wochen, woche, (w) => wocheDavor(w)));
      const vorherige = reflexionen.filter((r) => r.woche < woche).at(-1);
      const vw: Record<string, string> = {};
      for (const eintrag of vorherige?.bereiche ?? []) {
        if (eintrag.naechsteWoche) vw[eintrag.bereichId] = eintrag.naechsteWoche;
      }
      setVorwoche(vw);
    })();
  }, [woche, aktualisiert]);

  function starten() {
    setAntworten(
      konfigs.map((k) => ({
        bereichId: k.bereichId,
        punkte: null,
        notiz: '',
        naechsteWoche: vorwoche[k.bereichId] ?? k.woranIchArbeite ?? '',
      })),
    );
    setIndex(0);
    setLaeuft(true);
  }

  async function abschliessen(letzte: Wochenreflexion['bereiche']) {
    const reflexion: Wochenreflexion = neueEntitaet({
      woche,
      bereiche: letzte,
      streakRelevant: true,
    });
    await speichereReflexion(reflexion);
    // „Woran ich nächste Woche arbeite“ wird zum Bereichs-Feld „Woran ich gerade arbeite“.
    for (const eintrag of letzte) {
      const konfig = konfigs.find((k) => k.bereichId === eintrag.bereichId);
      if (konfig && eintrag.naechsteWoche.trim()) {
        await speichereBereich({ ...konfig, woranIchArbeite: eintrag.naechsteWoche.trim() });
      }
    }
    setLaeuft(false);
    setBestehend(reflexion);
    onGeaendert();
  }

  if (laeuft && antworten[index]) {
    const eintrag = antworten[index];
    const anzahl = momenteJeBereich[eintrag.bereichId] ?? 0;
    const setzen = (teil: Partial<Wochenreflexion['bereiche'][number]>) =>
      setAntworten(antworten.map((a, i) => (i === index ? { ...a, ...teil } : a)));
    const weiter = () => {
      if (index < antworten.length - 1) setIndex(index + 1);
      else void abschliessen(antworten);
    };
    return (
      <div className="reflexion-schritt">
        <p className="etikett">{index + 1} / {antworten.length}</p>
        <h2 className="frage">{t('rueckblick.punkteFrage', { bereich: bereichsName(eintrag.bereichId) })}</h2>
        {anzahl > 0 && <p className="hinweis">{t('rueckblick.momenteImBereich', { n: anzahl })}</p>}
        <Punktreihe wert={eintrag.punkte} onWahl={(w) => setzen({ punkte: w })} />
        <label className="feld">
          <span className="etikett">{t('rueckblick.notizFrage')}</span>
          <textarea
            className="eingabe eingabe-mehrzeilig"
            value={eintrag.notiz}
            onChange={(e) => setzen({ notiz: e.target.value })}
          />
        </label>
        <label className="feld">
          <span className="etikett">{t('rueckblick.naechsteWoche')}</span>
          {vorwoche[eintrag.bereichId] && (
            <span className="hinweis">{t('rueckblick.vorwoche', { text: vorwoche[eintrag.bereichId] })}</span>
          )}
          <input
            type="text"
            className="eingabe"
            value={eintrag.naechsteWoche}
            onChange={(e) => setzen({ naechsteWoche: e.target.value })}
          />
        </label>
        <button type="button" className="knopf" onClick={weiter}>
          {index < antworten.length - 1 ? t('allgemein.weiter') : t('allgemein.fertig')}
        </button>
        <button type="button" className="skip" onClick={weiter}>
          {t('allgemein.ueberspringen')}
        </button>
      </div>
    );
  }

  return (
    <div className="reflexion-start">
      <div className="wochenkarte">
        <p className="wochensatz">{satz}</p>
        {streak > 1 && <p className="wochen-unterzeile">{t('rueckblick.streak', { n: streak })}</p>}
      </div>
      {bestehend ? (
        <>
          <p className="fliess">{t('rueckblick.reflexionFertig')}</p>
          <ul className="reflexion-liste">
            {bestehend.bereiche.map((b) => (
              <li key={b.bereichId} className="reflexion-eintrag">
                <div className="bereichs-zeile-kopf">
                  <span className="bereichs-name">{bereichsName(b.bereichId)}</span>
                  <span className="bereichs-wert">{b.punkte ?? '·'}</span>
                </div>
                {b.notiz && <p className="hinweis">{b.notiz}</p>}
                {b.naechsteWoche && <p className="hinweis">{t('rueckblick.naechsteWoche')}: {b.naechsteWoche}</p>}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <button type="button" className="knopf" disabled={konfigs.length === 0} onClick={starten}>
          {t('rueckblick.reflexionStart')}
        </button>
      )}
    </div>
  );
}

/* ---------------- Trends: ab Woche 4, zwei Panels statt Doppelachse ---------------- */

function Trends({ aktualisiert }: { aktualisiert: number }) {
  const [reflexionen, setReflexionen] = useState<Wochenreflexion[]>([]);
  const [momente, setMomente] = useState<Moment[]>([]);
  const [konfigs, setKonfigs] = useState<BereichKonfig[]>([]);

  useEffect(() => {
    void alleReflexionen().then(setReflexionen);
    void alleMomente().then(setMomente);
    void holeBereiche().then((k) => setKonfigs(k.filter((x) => x.aktiv)));
  }, [aktualisiert]);

  const wochen = useMemo(
    () => [...new Set(reflexionen.map((r) => r.woche))].sort(),
    [reflexionen],
  );

  const kompassJeWoche = useMemo(() => {
    const zaehler = new Map<string, number>();
    for (const m of momente) {
      if (m.punkte.kompass !== 1) continue;
      const w = isoWoche(new Date(m.zeitpunkt));
      zaehler.set(w, (zaehler.get(w) ?? 0) + 1);
    }
    return zaehler;
  }, [momente]);

  if (wochen.length < 4) {
    return <p className="fliess mittig-text">{t('rueckblick.trendsFrueh')}</p>;
  }

  const label = (w: string) => 'W' + w.split('-W')[1];
  const punkteFuer = (bereichId: string): LinienPunkt[] =>
    wochen.map((w) => {
      const r = reflexionen.find((x) => x.woche === w);
      const wert = r?.bereiche.find((b) => b.bereichId === bereichId)?.punkte ?? null;
      return { x: label(w), wert };
    });

  const schnittJeWoche: LinienPunkt[] = wochen.map((w) => {
    const r = reflexionen.find((x) => x.woche === w);
    const werte = (r?.bereiche ?? []).map((b) => b.punkte).filter((p): p is number => p != null);
    return { x: label(w), wert: werte.length ? werte.reduce((s, p) => s + p, 0) / werte.length : null };
  });
  const richtungJeWoche: LinienPunkt[] = wochen.map((w) => ({
    x: label(w),
    wert: kompassJeWoche.get(w) ?? 0,
  }));
  const maxRichtung = Math.max(10, ...richtungJeWoche.map((p) => p.wert ?? 0));

  return (
    <div className="trend-liste">
      <h2 className="etikett">{t('rueckblick.trendOverlay')}</h2>
      <Liniendiagramm titel="Ø Wochenpunkte (0–10)" daten={schnittJeWoche} yMax={10} />
      <Liniendiagramm
        titel="Momente in deine Richtung"
        daten={richtungJeWoche}
        yMax={maxRichtung}
        hinweis={t('rueckblick.trendOverlayHinweis')}
      />
      <h2 className="etikett">{t('rueckblick.trendBereiche')}</h2>
      {konfigs.map((k) => (
        <Liniendiagramm key={k.bereichId} titel={bereichsName(k.bereichId)} daten={punkteFuer(k.bereichId)} yMax={10} />
      ))}
    </div>
  );
}

/* ---------------- Einsichten: neutral, abschaltbar, Folgetag-Nachfrage ---------------- */

function Einsichten({ aktualisiert }: { aktualisiert: number }) {
  const [momente, setMomente] = useState<Moment[]>([]);
  const [gespeicherte, setGespeicherte] = useState<Einsicht[]>([]);
  const [aktiviert, setAktiviert] = useState(true);

  useEffect(() => {
    void alleMomente().then(setMomente);
    void offeneEinsichten().then(setGespeicherte);
    void holeProfil().then((p) => setAktiviert(p.einsichtenAktiv));
  }, [aktualisiert]);

  const beobachtungen = useMemo(() => findeMuster(momente).slice(0, 3), [momente]);
  const kandidat = useMemo(() => {
    const k = folgetagKandidat(momente, new Date());
    if (!k) return undefined;
    const schonGefragt = gespeicherte.some((e) => e.typ === 'folgetag' && e.bezugMomentId === k.id);
    return schonGefragt ? undefined : k;
  }, [momente, gespeicherte]);

  if (!aktiviert) {
    return <p className="fliess mittig-text">{t('einstellungen.einsichtenSchalter')}: {t('einstellungen.themeSystem')}</p>;
  }

  async function beantworten(antwort: 'geholfen' | 'teils' | 'nicht') {
    if (!kandidat) return;
    const e: Einsicht = neueEntitaet({
      typ: 'folgetag' as const,
      aussage: t('rueckblick.folgetagFrage', { alternative: kandidat.gewaehlteAlternative ?? '' }),
      status: 'bestaetigt' as const,
      folgetagAntwort: antwort,
      bezugMomentId: kandidat.id,
    });
    await speichereEinsicht(e);
    setGespeicherte([...gespeicherte, e]);
  }

  return (
    <div className="einsichten-liste">
      {kandidat && (
        <div className="einsicht-karte einsicht-frage">
          <p className="fliess">{t('rueckblick.folgetagFrage', { alternative: kandidat.gewaehlteAlternative ?? '' })}</p>
          <div className="chip-wolke">
            <button type="button" className="chip" onClick={() => void beantworten('geholfen')}>{t('rueckblick.folgetagJa')}</button>
            <button type="button" className="chip" onClick={() => void beantworten('teils')}>{t('rueckblick.folgetagTeils')}</button>
            <button type="button" className="chip" onClick={() => void beantworten('nicht')}>{t('rueckblick.folgetagNein')}</button>
          </div>
        </div>
      )}
      {beobachtungen.length === 0 && !kandidat && (
        <p className="fliess mittig-text">{t('rueckblick.einsichtenLeer')}</p>
      )}
      {beobachtungen.map((b) => (
        <div key={b.schluessel} className="einsicht-karte">
          <p className="fliess">{b.aussage}</p>
        </div>
      ))}
    </div>
  );
}
