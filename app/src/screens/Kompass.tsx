import { useEffect, useMemo, useState } from 'react';
import { ALTERNATIVEN, BEDUERFNISSE, BEREICHS_KATALOGE, BEREICH_REIHENFOLGE, IMPULSE, bereichsName } from '../daten';
import { Punktreihe } from '../komponenten/Punktreihe';
import { alleReflexionen, holeBereiche, leererBereich, speichereBereich } from '../db';
import type { BeduerfnisId, BereichId, BereichKonfig } from '../logik/typen';
import { t } from '../texte';

export function Kompass({ aktualisiert }: { aktualisiert: number }) {
  const [konfigs, setKonfigs] = useState<BereichKonfig[]>([]);
  const [istWerte, setIstWerte] = useState<Record<string, number | null>>({});
  const [offen, setOffen] = useState<BereichId | null>(null);

  async function laden() {
    setKonfigs(await holeBereiche());
    const reflexionen = await alleReflexionen();
    const letzte: Record<string, number | null> = {};
    for (const r of reflexionen) {
      for (const b of r.bereiche) {
        if (b.punkte != null) letzte[b.bereichId] = b.punkte;
      }
    }
    setIstWerte(letzte);
  }
  useEffect(() => { void laden(); }, [aktualisiert]);

  const konfigFuer = (b: BereichId) => konfigs.find((k) => k.bereichId === b);

  if (offen) {
    return (
      <BereichEditor
        bereichId={offen}
        konfig={konfigFuer(offen)}
        onZurueck={() => { setOffen(null); void laden(); }}
      />
    );
  }

  const inaktive = BEREICH_REIHENFOLGE.filter((b) => !konfigFuer(b)?.aktiv).length;

  return (
    <section className="screen-inhalt">
      <header className="screen-kopf">
        <h1 className="screen-titel">{t('kompass.titel')}</h1>
        <p className="hinweis">{t('kompass.untertitel')}</p>
      </header>
      <ul className="bereichs-liste">
        {BEREICH_REIHENFOLGE.map((b) => {
          const k = konfigFuer(b);
          const wert = istWerte[b] ?? null;
          return (
            <li key={b}>
              <button type="button" className="bereichs-zeile" onClick={() => setOffen(b)}>
                <div className="bereichs-zeile-kopf">
                  <span className="bereichs-name">{bereichsName(b)}</span>
                  <span className="bereichs-wert">{k?.aktiv && wert != null ? wert : '·'}</span>
                </div>
                {k?.aktiv ? (
                  <>
                    <Punktreihe wert={wert} />
                    {k.woranIchArbeite && (
                      <span className="bereichs-woran">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                        {t('kompass.woran')}: {k.woranIchArbeite}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="bereichs-woran">{t('kompass.nochNichtAktiv')}</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      {inaktive > 0 && <p className="hinweis mittig-text">{t('kompass.vervollstaendigen')}</p>}
    </section>
  );
}

function BereichEditor({
  bereichId,
  konfig,
  onZurueck,
}: {
  bereichId: BereichId;
  konfig?: BereichKonfig;
  onZurueck: () => void;
}) {
  const [k, setK] = useState<BereichKonfig>(() => konfig ?? { ...leererBereich(bereichId), aktiv: true });
  const [zielText, setZielText] = useState('');
  const [zielDatum, setZielDatum] = useState('');
  const [altText, setAltText] = useState('');
  const [altBeduerfnis, setAltBeduerfnis] = useState<BeduerfnisId>('pause');
  const katalog = BEREICHS_KATALOGE[bereichId];

  const gruppen = useMemo(() => {
    const map = new Map<string, typeof katalog.wunschbild>();
    for (const o of katalog.wunschbild) {
      const liste = map.get(o.gruppe) ?? [];
      liste.push(o);
      map.set(o.gruppe, liste);
    }
    return [...map.entries()];
  }, [katalog]);

  async function speichernUndZurueck() {
    await speichereBereich({ ...k, aktiv: true });
    onZurueck();
  }

  return (
    <section className="screen-inhalt">
      <header className="screen-kopf editor-kopf">
        <button type="button" className="zurueck" onClick={onZurueck} aria-label={t('allgemein.zurueck')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <h1 className="screen-titel">{bereichsName(bereichId)}</h1>
      </header>

      <div className="editor-block">
        <h2 className="etikett">{t('kompass.woran')}</h2>
        <input
          type="text"
          className="eingabe"
          value={k.woranIchArbeite}
          placeholder={t('kompass.woranPlatzhalter')}
          onChange={(e) => setK({ ...k, woranIchArbeite: e.target.value })}
        />
      </div>

      <div className="editor-block">
        <h2 className="etikett">{t('kompass.wunschbild')}</h2>
        {gruppen.map(([gruppe, optionen]) => (
          <div key={gruppe} className="chip-wolke chip-gruppe">
            {optionen.map((o) => {
              const aktiv = k.wunschbild.includes(o.id);
              return (
                <button
                  key={o.id}
                  type="button"
                  className={'chip' + (aktiv ? ' chip-aktiv' : '')}
                  onClick={() =>
                    setK({
                      ...k,
                      wunschbild: aktiv ? k.wunschbild.filter((x) => x !== o.id) : [...k.wunschbild, o.id],
                    })
                  }
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="editor-block">
        <h2 className="etikett">{t('kompass.ziele')}</h2>
        {k.ziele.map((z, i) => (
          <div key={i} className="editor-zeile">
            <span className="editor-zeile-text">{z.text}{z.zieldatum ? ` · ${z.zieldatum}` : ''}</span>
            <button
              type="button"
              className="knopf-still klein"
              onClick={() => setK({ ...k, ziele: k.ziele.filter((_, j) => j !== i) })}
            >
              {t('allgemein.entfernen')}
            </button>
          </div>
        ))}
        <div className="editor-neu">
          <input
            type="text"
            className="eingabe"
            value={zielText}
            placeholder={t('kompass.zielPlatzhalter')}
            onChange={(e) => setZielText(e.target.value)}
          />
          <input
            type="date"
            className="eingabe eingabe-datum"
            value={zielDatum}
            aria-label={t('kompass.zielDatum')}
            onChange={(e) => setZielDatum(e.target.value)}
          />
          <button
            type="button"
            className="knopf-still klein"
            onClick={() => {
              if (!zielText.trim()) return;
              setK({ ...k, ziele: [...k.ziele, { text: zielText.trim(), zieldatum: zielDatum || undefined }] });
              setZielText('');
              setZielDatum('');
            }}
          >
            {t('allgemein.hinzufuegen')}
          </button>
        </div>
      </div>

      <div className="editor-block">
        <h2 className="etikett">{t('kompass.radar')}</h2>
        <p className="hinweis">{t('kompass.radarHinweis')}</p>
        <div className="chip-wolke">
          {IMPULSE.map((imp) => {
            const aktiv = k.radarImpulse.includes(imp.id);
            return (
              <button
                key={imp.id}
                type="button"
                className={'chip' + (aktiv ? ' chip-aktiv' : '')}
                onClick={() =>
                  setK({
                    ...k,
                    radarImpulse: aktiv ? k.radarImpulse.filter((x) => x !== imp.id) : [...k.radarImpulse, imp.id],
                  })
                }
              >
                {imp.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="editor-block">
        <h2 className="etikett">{t('kompass.alternativen')}</h2>
        {k.alternativen.map((a, i) => (
          <div key={i} className="editor-zeile">
            <span className="editor-zeile-text">
              {BEDUERFNISSE.find((b) => b.id === a.beduerfnis)?.label}: {a.text}
            </span>
            <button
              type="button"
              className="knopf-still klein"
              onClick={() => setK({ ...k, alternativen: k.alternativen.filter((_, j) => j !== i) })}
            >
              {t('allgemein.entfernen')}
            </button>
          </div>
        ))}
        <div className="editor-neu">
          <select
            className="eingabe eingabe-auswahl"
            value={altBeduerfnis}
            onChange={(e) => setAltBeduerfnis(e.target.value as BeduerfnisId)}
          >
            {BEDUERFNISSE.map((b) => (
              <option key={b.id} value={b.id}>{b.label}</option>
            ))}
          </select>
          <input
            type="text"
            className="eingabe"
            value={altText}
            placeholder={t('kompass.alternativeNeu')}
            list="alternativen-vorschlaege"
            onChange={(e) => setAltText(e.target.value)}
          />
          <datalist id="alternativen-vorschlaege">
            {ALTERNATIVEN.filter((a) => a.beduerfnis === altBeduerfnis).map((a) => (
              <option key={a.id} value={a.label} />
            ))}
          </datalist>
          <button
            type="button"
            className="knopf-still klein"
            onClick={() => {
              if (!altText.trim()) return;
              setK({ ...k, alternativen: [...k.alternativen, { beduerfnis: altBeduerfnis, text: altText.trim() }] });
              setAltText('');
            }}
          >
            {t('allgemein.hinzufuegen')}
          </button>
        </div>
      </div>

      <button type="button" className="knopf" onClick={() => void speichernUndZurueck()}>
        {t('allgemein.speichern')}
      </button>
    </section>
  );
}
