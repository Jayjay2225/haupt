import { useEffect, useState } from 'react';
import { t } from '../texte';

/**
 * Der Atemkreis — Signatur-Element (Konzept Kapitel 9): materieller Ring im
 * Ockerlicht, ~6-s-Zyklus; bei prefers-reduced-motion statisch mit sanftem
 * Textwechsel statt Skalierung (das regelt styles.css).
 */
export function Atemkreis({ gross = true }: { gross?: boolean }) {
  const [einatmen, setEinatmen] = useState(true);
  useEffect(() => {
    const takt = window.setInterval(() => setEinatmen((v) => !v), 3000);
    return () => window.clearInterval(takt);
  }, []);
  return (
    <div className={gross ? 'atemkreis atemkreis-gross' : 'atemkreis'} aria-hidden="true">
      {gross && (
        <span className="atem-label" key={einatmen ? 'ein' : 'aus'}>
          {einatmen ? t('moment.einatmen') : t('moment.ausatmen')}
        </span>
      )}
    </div>
  );
}
