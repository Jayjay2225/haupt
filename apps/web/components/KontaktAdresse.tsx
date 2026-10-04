'use client';

/**
 * E-Mail-Adresse erst im Browser zusammensetzen: Im ausgelieferten HTML steht
 * keine abgreifbare Adresse (Spam-Schutz gegen Adress-Sammler). Ohne
 * JavaScript bleibt die lesbare Form „nutzer [at] domain“ stehen.
 */
import { useEffect, useState } from 'react';

interface Props {
  adresse: string;
  betreff?: string | undefined;
}

export function emailTeile(adresse: string): { nutzer: string; domain: string } {
  const [nutzer = '', domain = ''] = adresse.split('@');
  return { nutzer, domain };
}

export function KontaktAdresse({ adresse, betreff }: Props) {
  const [sichtbar, setSichtbar] = useState<string | null>(null);
  useEffect(() => {
    setSichtbar(adresse);
  }, [adresse]);
  if (sichtbar === null) {
    const { nutzer, domain } = emailTeile(adresse);
    return (
      <span className="tabellenziffern" aria-label="E-Mail-Adresse">
        {nutzer} [at] {domain}
      </span>
    );
  }
  const href = `mailto:${sichtbar}${betreff !== undefined ? `?subject=${encodeURIComponent(betreff)}` : ''}`;
  return <a href={href}>{sichtbar}</a>;
}
