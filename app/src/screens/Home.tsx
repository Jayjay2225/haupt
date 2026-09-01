import { useEffect, useRef, useState } from 'react';
import { IMPULSE, KRISE_KATEGORIEN } from '../daten';
import { interpretiere } from '../logik/interpretation';
import { hoereZu, spracheVerfuegbar } from '../logik/sprache';
import { wochenbilanz } from '../logik/scoring';
import { momenteZwischen } from '../db';
import { wochenstart } from '../logik/wochen';
import type { MomentStart } from './MomentOverlay';
import { t } from '../texte';

const SCHNELL_IMPULSE = [
  'suesses', 'alkohol', 'scrollen', 'shopping', 'serien', 'arbeiten-statt-pause', 'nachricht-impulsiv',
];

export function Home({
  onMoment,
  aktualisiert,
}: {
  onMoment: (start: MomentStart) => void;
  aktualisiert: number;
}) {
  const [text, setText] = useState('');
  const [hoert, setHoert] = useState(false);
  const [satz, setSatz] = useState<string>('');
  const lauscher = useRef<{ stopp: () => void } | undefined>(undefined);

  useEffect(() => {
    const von = wochenstart(new Date());
    const bis = new Date(von.getTime() + 7 * 86400000);
    void momenteZwischen(von, bis).then((momente) => {
      const b = wochenbilanz(momente);
      setSatz(
        b.momente === 0
          ? ''
          : t('rueckblick.wochenSatz', { momente: b.momente, richtung: b.inDeineRichtung, ja: b.bewussteJa }),
      );
    });
  }, [aktualisiert]);

  useEffect(() => () => lauscher.current?.stopp(), []);

  function starteMitText(eingabe: string, art: 'text' | 'sprache') {
    const geputzt = eingabe.trim();
    if (!geputzt) return;
    const e = interpretiere(geputzt, IMPULSE, KRISE_KATEGORIEN);
    setText('');
    onMoment({
      eingabeart: art,
      impulsId: e.impulsId,
      freitext: e.impulsId ? undefined : geputzt,
      bereiche: e.bereiche,
      beduerfnisVorschlaege: e.beduerfnisse,
      krise: e.krise,
    });
  }

  function starteSprache() {
    if (hoert) { lauscher.current?.stopp(); setHoert(false); return; }
    setHoert(true);
    lauscher.current = hoereZu(
      (gehoert) => starteMitText(gehoert, 'sprache'),
      () => setHoert(false),
    );
    if (!lauscher.current) setHoert(false);
  }

  return (
    <section className="screen-inhalt">
      <header className="home-kopf">
        <p className="wortmarke">{t('app.name')}</p>
        <h1 className="home-frage">{t('home.gruss')}</h1>
      </header>

      <button
        type="button"
        className="innehalten"
        onClick={() => onMoment({ eingabeart: 'button', bereiche: [] })}
      >
        <span className="innehalten-ring" aria-hidden="true" />
        {t('home.innehalten')}
      </button>

      <form
        className="eingabe-zeile"
        onSubmit={(e) => { e.preventDefault(); starteMitText(text, 'text'); }}
      >
        <input
          type="text"
          className="eingabe"
          value={text}
          placeholder={hoert ? t('home.sprachLaeuft') : t('home.textPlatzhalter')}
          onChange={(e) => setText(e.target.value)}
          aria-label={t('home.textPlatzhalter')}
        />
        {spracheVerfuegbar() ? (
          <button
            type="button"
            className={'mikro' + (hoert ? ' mikro-aktiv' : '')}
            aria-label={t('home.sprachStart')}
            onClick={starteSprache}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></svg>
          </button>
        ) : (
          <span className="hinweis mikro-fallback">{t('home.sprachFehlt')}</span>
        )}
      </form>

      <div className="impuls-block">
        <p className="etikett">{t('home.impulseTitel')}</p>
        <div className="impuls-kacheln">
          {SCHNELL_IMPULSE.map((id) => {
            const imp = IMPULSE.find((i) => i.id === id);
            if (!imp) return null;
            return (
              <button
                key={id}
                type="button"
                className="impuls-kachel"
                onClick={() =>
                  onMoment({
                    eingabeart: 'kachel',
                    impulsId: id,
                    bereiche: imp.bereiche,
                    beduerfnisVorschlaege: imp.beduerfnisse,
                  })
                }
              >
                {imp.label}
              </button>
            );
          })}
        </div>
      </div>

      <p className="home-bilanz">{satz || t('home.heuteLeer')}</p>
    </section>
  );
}
