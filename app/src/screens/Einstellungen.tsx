import { useEffect, useState } from 'react';
import {
  db, demoVorhanden, entferneDemoDaten, exportCsv, exportJson, holeProfil,
  loescheAlles, meinGeraet, speichereProfil,
} from '../db';
import { erzeugeSeed } from '../logik/seed';
import type { Profil } from '../logik/typen';
import { t } from '../texte';

async function pinHash(pin: string): Promise<string> {
  const daten = new TextEncoder().encode('jetztgut:' + pin);
  const digest = await crypto.subtle.digest('SHA-256', daten);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function ladeHerunter(name: string, inhalt: string, typ: string) {
  const url = URL.createObjectURL(new Blob([inhalt], { type: typ }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function Einstellungen({ onGeaendert }: { onGeaendert: () => void }) {
  const [profil, setProfil] = useState<Profil | null>(null);
  const [demo, setDemo] = useState(false);
  const [loeschStufe, setLoeschStufe] = useState<0 | 1 | 2 | 3>(0);
  const [pinEingabe, setPinEingabe] = useState('');
  const [pinDialog, setPinDialog] = useState(false);

  async function laden() {
    setProfil(await holeProfil());
    setDemo(await demoVorhanden());
  }
  useEffect(() => { void laden(); }, []);

  if (!profil) return null;

  async function themeSetzen(theme: Profil['theme']) {
    if (!profil) return;
    const neu = { ...profil, theme };
    await speichereProfil(neu);
    setProfil(neu);
    onGeaendert();
  }

  async function demoUmschalten() {
    if (demo) {
      await entferneDemoDaten();
    } else {
      const seed = erzeugeSeed(meinGeraet());
      await db.momente.bulkPut(seed.momente);
      await db.reflexionen.bulkPut(seed.reflexionen);
    }
    setDemo(!demo);
    onGeaendert();
  }

  async function exportiereJson() {
    ladeHerunter('jetztgut-export.json', await exportJson(), 'application/json');
  }
  async function exportiereCsv() {
    const { momente, reflexionen } = await exportCsv();
    ladeHerunter('jetztgut-momente.csv', momente, 'text/csv');
    ladeHerunter('jetztgut-reflexionen.csv', reflexionen, 'text/csv');
  }

  async function endgueltigLoeschen() {
    await loescheAlles();
    setLoeschStufe(3);
    onGeaendert();
  }

  async function pinSpeichern() {
    if (!profil) return;
    if (!/^\d{4}$/.test(pinEingabe)) return;
    const neu: Profil = {
      ...profil,
      appSperre: { aktiv: true, art: 'pin', pinHash: await pinHash(pinEingabe) },
    };
    await speichereProfil(neu);
    setProfil(neu);
    setPinEingabe('');
    setPinDialog(false);
  }

  async function pinEntfernen() {
    if (!profil) return;
    const neu: Profil = { ...profil, appSperre: { aktiv: false, art: 'pin' } };
    await speichereProfil(neu);
    setProfil(neu);
  }

  return (
    <section className="screen-inhalt">
      <header className="screen-kopf">
        <h1 className="screen-titel">{t('einstellungen.titel')}</h1>
      </header>

      <div className="editor-block">
        <h2 className="etikett">{t('einstellungen.darstellung')}</h2>
        <div className="chip-wolke">
          {(['hell', 'dunkel', 'system'] as const).map((theme) => (
            <button
              key={theme}
              type="button"
              className={'chip' + (profil.theme === theme ? ' chip-aktiv' : '')}
              onClick={() => void themeSetzen(theme)}
            >
              {t(`einstellungen.theme${theme === 'hell' ? 'Hell' : theme === 'dunkel' ? 'Dunkel' : 'System'}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="editor-block">
        <h2 className="etikett">{t('einstellungen.daten')}</h2>
        <p className="hinweis">{t('einstellungen.datenHinweis')}</p>
        <div className="knopf-reihe">
          <button type="button" className="knopf-still" onClick={() => void exportiereJson()}>
            {t('einstellungen.exportJson')}
          </button>
          <button type="button" className="knopf-still" onClick={() => void exportiereCsv()}>
            {t('einstellungen.exportCsv')}
          </button>
        </div>
        {loeschStufe === 0 && (
          <button type="button" className="knopf-still" onClick={() => setLoeschStufe(1)}>
            {t('einstellungen.loeschen')}
          </button>
        )}
        {loeschStufe === 1 && (
          <div className="dialog-karte">
            <p className="fliess">{t('einstellungen.loeschen1')}</p>
            <div className="knopf-reihe">
              <button type="button" className="knopf-still" onClick={() => void exportiereJson()}>
                {t('einstellungen.loeschenExport')}
              </button>
              <button type="button" className="knopf-still" onClick={() => setLoeschStufe(2)}>
                {t('allgemein.weiter')}
              </button>
              <button type="button" className="knopf-still" onClick={() => setLoeschStufe(0)}>
                {t('allgemein.abbrechen')}
              </button>
            </div>
          </div>
        )}
        {loeschStufe === 2 && (
          <div className="dialog-karte">
            <p className="fliess">{t('einstellungen.loeschen2')}</p>
            <div className="knopf-reihe">
              <button type="button" className="knopf-still" onClick={() => void endgueltigLoeschen()}>
                {t('einstellungen.loeschenFinal')}
              </button>
              <button type="button" className="knopf-still" onClick={() => setLoeschStufe(0)}>
                {t('allgemein.abbrechen')}
              </button>
            </div>
          </div>
        )}
        {loeschStufe === 3 && <p className="fliess">{t('einstellungen.loeschenFertig')}</p>}
      </div>

      <div className="editor-block">
        <h2 className="etikett">{t('einstellungen.sperre')}</h2>
        <p className="hinweis">{t('einstellungen.sperreHinweis')}</p>
        {profil.appSperre.aktiv ? (
          <button type="button" className="knopf-still" onClick={() => void pinEntfernen()}>
            {t('einstellungen.sperreAus')}
          </button>
        ) : pinDialog ? (
          <div className="knopf-reihe">
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              className="eingabe eingabe-pin"
              value={pinEingabe}
              placeholder={t('einstellungen.pinNeu')}
              onChange={(e) => setPinEingabe(e.target.value.replace(/\D/g, ''))}
            />
            <button type="button" className="knopf-still" disabled={pinEingabe.length !== 4} onClick={() => void pinSpeichern()}>
              {t('allgemein.speichern')}
            </button>
          </div>
        ) : (
          <button type="button" className="knopf-still" onClick={() => setPinDialog(true)}>
            {t('einstellungen.sperreSetzen')}
          </button>
        )}
      </div>

      <div className="editor-block">
        <h2 className="etikett">{t('einstellungen.demo')}</h2>
        <p className="hinweis">{t('einstellungen.demoHinweis')}</p>
        {demo && <p className="hinweis">{t('einstellungen.demoAktiv')}</p>}
        <button type="button" className="knopf-still" onClick={() => void demoUmschalten()}>
          {demo ? t('einstellungen.demoEntfernen') : t('einstellungen.demoLaden')}
        </button>
      </div>

      <div className="editor-block">
        <h2 className="etikett">{t('einstellungen.info')}</h2>
        <details>
          <summary className="fliess">{t('einstellungen.infoTherapie')}</summary>
          <p className="fliess einordnung">{t('onboarding.einordnung')}</p>
        </details>
        <label className="schalter-zeile">
          <input
            type="checkbox"
            checked={profil.einsichtenAktiv}
            onChange={(e) => {
              const neu = { ...profil, einsichtenAktiv: e.target.checked };
              void speichereProfil(neu).then(() => { setProfil(neu); onGeaendert(); });
            }}
          />
          <span>{t('einstellungen.einsichtenSchalter')}</span>
        </label>
        <p className="hinweis">{t('einstellungen.spaeter')}</p>
      </div>
    </section>
  );
}

export { pinHash };
