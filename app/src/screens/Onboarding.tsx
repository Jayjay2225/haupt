import { useState } from 'react';
import { BEREICHS_KATALOGE, BEREICH_REIHENFOLGE, WERTE, bereichsName } from '../daten';
import { holeProfil, leererBereich, speichereBereich, speichereProfil } from '../db';
import type { BereichId } from '../logik/typen';
import { t } from '../texte';

type Schritt = 'willkommen' | 'vision' | 'werte' | 'bereiche' | 'wunschbild' | 'fertig';

/** Progressives Onboarding „Mein Kompass“: Basis in unter 5 Minuten, alles überspringbar. */
export function Onboarding({ onFertig }: { onFertig: () => void }) {
  const [schritt, setSchritt] = useState<Schritt>('willkommen');
  const [vision, setVision] = useState(['', '', '']);
  const [werte, setWerte] = useState<string[]>([]);
  const [bereiche, setBereiche] = useState<BereichId[]>([]);
  const [wunschbildIndex, setWunschbildIndex] = useState(0);
  const [wunschbild, setWunschbild] = useState<Record<string, string[]>>({});

  async function abschliessen() {
    const profil = await holeProfil();
    await speichereProfil({
      ...profil,
      vision: vision.map((v) => v.trim()).filter(Boolean),
      werte,
      onboardingFertig: true,
    });
    for (const b of bereiche) {
      const konfig = leererBereich(b);
      konfig.aktiv = true;
      konfig.wunschbild = wunschbild[b] ?? [];
      konfig.radarImpulse = BEREICHS_KATALOGE[b].radar_impulse;
      await speichereBereich(konfig);
    }
    onFertig();
  }

  function weiterNachWunschbild() {
    if (wunschbildIndex < bereiche.length - 1) setWunschbildIndex(wunschbildIndex + 1);
    else setSchritt('fertig');
  }

  const aktuellerBereich = bereiche[wunschbildIndex];

  return (
    <div className="screen-inhalt onboarding">
      {schritt === 'willkommen' && (
        <section className="ob-schritt">
          <p className="wortmarke">{t('app.name')}</p>
          <h1 className="frage">{t('onboarding.willkommenTitel')}</h1>
          <p className="fliess">{t('onboarding.willkommenText')}</p>
          <div className="einordnung">
            <p>{t('onboarding.einordnung')}</p>
          </div>
          <button type="button" className="knopf" onClick={() => setSchritt('vision')}>
            {t('onboarding.los')}
          </button>
        </section>
      )}

      {schritt === 'vision' && (
        <section className="ob-schritt">
          <h1 className="frage">{t('onboarding.visionTitel')}</h1>
          <p className="hinweis">{t('onboarding.visionHinweis')}</p>
          <div className="feld-stapel">
            {vision.map((satz, i) => (
              <input
                key={i}
                type="text"
                className="eingabe"
                value={satz}
                placeholder={t('onboarding.visionPlatzhalter', { n: i + 1 })}
                onChange={(e) => setVision(vision.map((v, j) => (j === i ? e.target.value : v)))}
              />
            ))}
          </div>
          <button type="button" className="knopf" onClick={() => setSchritt('werte')}>
            {t('allgemein.weiter')}
          </button>
          <button type="button" className="skip" onClick={() => setSchritt('werte')}>
            {t('allgemein.ueberspringen')}
          </button>
        </section>
      )}

      {schritt === 'werte' && (
        <section className="ob-schritt">
          <h1 className="frage">{t('onboarding.werteTitel')}</h1>
          <p className="hinweis">{t('onboarding.werteHinweis')}</p>
          <div className="chip-wolke">
            {WERTE.map((w) => {
              const aktiv = werte.includes(w.id);
              return (
                <button
                  key={w.id}
                  type="button"
                  className={'chip' + (aktiv ? ' chip-aktiv' : '')}
                  title={w.beschreibung}
                  onClick={() =>
                    setWerte(aktiv ? werte.filter((x) => x !== w.id) : werte.length < 5 ? [...werte, w.id] : werte)
                  }
                >
                  {w.label}
                </button>
              );
            })}
          </div>
          <button type="button" className="knopf" onClick={() => setSchritt('bereiche')}>
            {t('allgemein.weiter')}
          </button>
          <button type="button" className="skip" onClick={() => setSchritt('bereiche')}>
            {t('allgemein.ueberspringen')}
          </button>
        </section>
      )}

      {schritt === 'bereiche' && (
        <section className="ob-schritt">
          <h1 className="frage">{t('onboarding.bereicheTitel')}</h1>
          <p className="hinweis">{t('onboarding.bereicheHinweis')}</p>
          <div className="chip-wolke">
            {BEREICH_REIHENFOLGE.map((b) => {
              const aktiv = bereiche.includes(b);
              return (
                <button
                  key={b}
                  type="button"
                  className={'chip' + (aktiv ? ' chip-aktiv' : '')}
                  onClick={() =>
                    setBereiche(aktiv ? bereiche.filter((x) => x !== b) : bereiche.length < 3 ? [...bereiche, b] : bereiche)
                  }
                >
                  {bereichsName(b)}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="knopf"
            disabled={bereiche.length === 0}
            onClick={() => { setWunschbildIndex(0); setSchritt(bereiche.length > 0 ? 'wunschbild' : 'fertig'); }}
          >
            {t('allgemein.weiter')}
          </button>
          <button type="button" className="skip" onClick={() => setSchritt('fertig')}>
            {t('allgemein.ueberspringen')}
          </button>
        </section>
      )}

      {schritt === 'wunschbild' && aktuellerBereich && (
        <section className="ob-schritt">
          <p className="etikett">{bereichsName(aktuellerBereich)}</p>
          <h1 className="frage">{t('onboarding.wunschbildTitel')}</h1>
          <p className="hinweis">{t('onboarding.wunschbildHinweis')}</p>
          <div className="chip-wolke chip-wolke-scroll">
            {BEREICHS_KATALOGE[aktuellerBereich].wunschbild.map((o) => {
              const liste = wunschbild[aktuellerBereich] ?? [];
              const aktiv = liste.includes(o.id);
              return (
                <button
                  key={o.id}
                  type="button"
                  className={'chip' + (aktiv ? ' chip-aktiv' : '')}
                  onClick={() =>
                    setWunschbild({
                      ...wunschbild,
                      [aktuellerBereich]: aktiv ? liste.filter((x) => x !== o.id) : [...liste, o.id],
                    })
                  }
                >
                  {o.label}
                </button>
              );
            })}
          </div>
          <button type="button" className="knopf" onClick={weiterNachWunschbild}>
            {t('allgemein.weiter')}
          </button>
          <button type="button" className="skip" onClick={weiterNachWunschbild}>
            {t('allgemein.ueberspringen')}
          </button>
        </section>
      )}

      {schritt === 'fertig' && (
        <section className="ob-schritt mittig">
          <h1 className="momentsatz">{t('onboarding.fertigTitel')}</h1>
          <p className="fliess">{t('onboarding.fertigText')}</p>
          <button type="button" className="knopf" onClick={() => void abschliessen()}>
            {t('allgemein.fertig')}
          </button>
        </section>
      )}
    </div>
  );
}
