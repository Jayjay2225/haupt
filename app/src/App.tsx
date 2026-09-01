import { useCallback, useEffect, useState } from 'react';
import { Home } from './screens/Home';
import { Kompass } from './screens/Kompass';
import { MomentOverlay, type MomentStart } from './screens/MomentOverlay';
import { Onboarding } from './screens/Onboarding';
import { Einstellungen, pinHash } from './screens/Einstellungen';
import { Rueckblick } from './screens/Rueckblick';
import { holeProfil } from './db';
import { richteDemoEin } from './demo';
import type { Profil } from './logik/typen';
import { t } from './texte';

type Tab = 'heute' | 'kompass' | 'rueckblick' | 'einstellungen';

const TAB_ICONS: Record<Tab, JSX.Element> = {
  heute: <path d="m3 11 9-8 9 8v10a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1Z" />,
  kompass: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </>
  ),
  rueckblick: (
    <>
      <path d="M3 3v18h18" />
      <path d="m7 15 4-5 3 3 5-7" />
    </>
  ),
  einstellungen: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3m0 14v3M4.9 4.9l2.1 2.1m10 10 2.1 2.1M2 12h3m14 0h3M4.9 19.1 7 17m10-10 2.1-2.1" />
    </>
  ),
};

export default function App() {
  const [profil, setProfil] = useState<Profil | null>(null);
  const [entsperrt, setEntsperrt] = useState(false);
  const [tab, setTab] = useState<Tab>('heute');
  const [moment, setMoment] = useState<MomentStart | null>(null);
  const [aktualisiert, setAktualisiert] = useState(0);

  const neuLaden = useCallback(() => {
    void holeProfil().then(setProfil);
    setAktualisiert((n) => n + 1);
  }, []);

  useEffect(() => {
    void (async () => {
      if (new URLSearchParams(window.location.search).get('demo') === '1') {
        await richteDemoEin();
      }
      setProfil(await holeProfil());
    })();
  }, []);

  /* Theme: explizite Wahl stempelt data-theme, „System“ überlässt es dem Gerät. */
  useEffect(() => {
    const wurzel = document.documentElement;
    if (!profil || profil.theme === 'system') delete wurzel.dataset.theme;
    else wurzel.dataset.theme = profil.theme;
  }, [profil]);

  /* PWA-Shortcut „?moment=1“: vom Home-Screen direkt in den Moment. */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('moment') === '1') {
      setMoment({ eingabeart: 'button', bereiche: [] });
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  if (!profil) return null;

  if (profil.appSperre.aktiv && !entsperrt) {
    return <PinGate erwartet={profil.appSperre.pinHash} onEntsperrt={() => setEntsperrt(true)} />;
  }

  if (!profil.onboardingFertig) {
    return (
      <div className="buehne">
        <div className="app">
          <Onboarding onFertig={neuLaden} />
        </div>
      </div>
    );
  }

  return (
    <div className="buehne">
      <div className="app">
        <main className="inhalt">
          {tab === 'heute' && <Home onMoment={setMoment} aktualisiert={aktualisiert} />}
          {tab === 'kompass' && <Kompass aktualisiert={aktualisiert} />}
          {tab === 'rueckblick' && <Rueckblick aktualisiert={aktualisiert} onGeaendert={neuLaden} />}
          {tab === 'einstellungen' && <Einstellungen onGeaendert={neuLaden} />}
        </main>
        <nav className="tabbar" aria-label="Bereiche">
          {(['heute', 'kompass', 'rueckblick', 'einstellungen'] as Tab[]).map((name) => (
            <button
              key={name}
              type="button"
              className={'tab' + (tab === name ? ' tab-aktiv' : '')}
              aria-current={tab === name ? 'page' : undefined}
              onClick={() => setTab(name)}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {TAB_ICONS[name]}
              </svg>
              <span>{t(`tabs.${name}`)}</span>
            </button>
          ))}
        </nav>
        {moment && (
          <MomentOverlay
            start={moment}
            onSchliessen={(gespeichert) => {
              setMoment(null);
              if (gespeichert) setAktualisiert((n) => n + 1);
            }}
          />
        )}
      </div>
    </div>
  );
}

function PinGate({ erwartet, onEntsperrt }: { erwartet?: string; onEntsperrt: () => void }) {
  const [pin, setPin] = useState('');
  const [falsch, setFalsch] = useState(false);

  async function pruefen(eingabe: string) {
    if (eingabe.length !== 4) return;
    if (!erwartet || (await pinHash(eingabe)) === erwartet) {
      onEntsperrt();
    } else {
      setFalsch(true);
      setPin('');
    }
  }

  return (
    <div className="buehne">
      <div className="app pin-gate">
        <p className="wortmarke">{t('app.name')}</p>
        <label className="feld mittig">
          <span className="etikett">{t('einstellungen.pinEingeben')}</span>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            autoFocus
            className="eingabe eingabe-pin"
            value={pin}
            onChange={(e) => {
              const wert = e.target.value.replace(/\D/g, '');
              setPin(wert);
              setFalsch(false);
              void pruefen(wert);
            }}
          />
          {falsch && <span className="hinweis">{t('einstellungen.pinFalsch')}</span>}
        </label>
      </div>
    </div>
  );
}
