/**
 * „Weitermachen, wo Sie aufgehört haben“: Der Link aus der E-Mail trägt den
 * Zwischenstand selbst (lib/fortsetzen.ts). Serverseitig wird er gelesen und
 * geprüft (FORTSETZEN_TAGE), clientseitig in localStorage übernommen.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { FORTSETZEN_TAGE } from '@/config/business';
import { VARIANTE } from '@/config/variante';
import { FORTSETZEN_PARAMETER, leseFortsetzenToken } from '@/lib/fortsetzen';
import { FortsetzenClient } from './FortsetzenClient';

export const metadata: Metadata = { title: 'Weitermachen' };

export default async function FortsetzenSeite({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const tokenRoh = params[FORTSETZEN_PARAMETER];
  const token = typeof tokenRoh === 'string' ? tokenRoh : '';
  const ergebnis = token === '' ? ({ stand: 'ungueltig' } as const) : leseFortsetzenToken(token);

  if (ergebnis.stand !== 'ok') {
    return (
      <div className="container schmal abschnitt">
        <h1>{ergebnis.stand === 'abgelaufen' ? 'Der Link ist abgelaufen.' : 'Der Link ist nicht gültig.'}</h1>
        <p>
          {ergebnis.stand === 'abgelaufen'
            ? `Ergebnis-Links gelten ${FORTSETZEN_TAGE} Tage. Ihre Angaben sind in 5 Minuten neu eingegeben.`
            : 'Bitte den Link vollständig aus der E-Mail kopieren – oder einfach neu rechnen.'}
        </p>
        <p>
          <Link href={VARIANTE.berichtKostenpflichtig ? '/#ampel' : '/rechner'} className="knopf haupt">
            Jetzt prüfen
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="container schmal abschnitt">
      <FortsetzenClient draft={ergebnis.draft} />
    </div>
  );
}
