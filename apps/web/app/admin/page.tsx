import type { Metadata } from 'next';
import { adminAutorisiert } from '@/lib/admin';
import { ladeBestellungen, type BestellZeile } from '@/lib/admin-liste';
import { LEAD_STATUS } from '@/lib/erfuellung';
import { bestellungAktiv, stripeClient } from '@/lib/zahlung';

export const metadata: Metadata = { title: 'Freigaben (intern)', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

/**
 * Interne Freigabe-Liste (Prompt 13, Abschnitt 3): bezahlte Bestellungen mit
 * Plausibilisierungs-Kennzeichen; Freigabe mit einem Klick, Lead-Status
 * (2.3) und CSV-Export. Zugang: ?schluessel=ADMIN_PASSWORT (zusätzlich zur
 * Beta-Basic-Auth).
 */
export default async function AdminSeite({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const schluessel = typeof params['schluessel'] === 'string' ? params['schluessel'] : '';
  const meldung = typeof params['meldung'] === 'string' ? params['meldung'] : '';
  if (!adminAutorisiert(schluessel)) {
    return (
      <div className="container schmal abschnitt">
        <h1>Interner Bereich.</h1>
        <p>Zugang nur mit Schlüssel: /admin?schluessel=… (ADMIN_PASSWORT).</p>
      </div>
    );
  }
  if (!bestellungAktiv()) {
    return (
      <div className="container schmal abschnitt">
        <h1>Freigaben.</h1>
        <p>Stripe ist nicht konfiguriert – ohne Zahlungsanbieter gibt es keine Bestell-Liste.</p>
      </div>
    );
  }

  let zeilen: BestellZeile[] = [];
  let fehler: string | null = null;
  try {
    zeilen = await ladeBestellungen(stripeClient(), 30);
  } catch (grund) {
    fehler = (grund as Error).message;
  }
  const offen = zeilen.filter((z) => z.entscheidung === 'warten' || z.entscheidung === 'unbereit');

  return (
    <div className="container abschnitt">
      <h1>Freigaben.</h1>
      <p className="erklaerung">
        Bezahlte Bestellungen der letzten 30 Tage. Versand: Freigabe-Klick oder automatisch nach 10
        Stunden (Cron, stündlich). Protokoll = Marker in den Stripe-Metadaten.{' '}
        <a href={`/api/admin/leads.csv?schluessel=${encodeURIComponent(schluessel)}`}>CSV-Export</a>
      </p>
      {meldung !== '' && (
        <div className="hinweis">
          <p style={{ margin: 0 }}>{meldung}</p>
        </div>
      )}
      {fehler !== null && (
        <div className="hinweis">
          <p style={{ margin: 0 }}>Stripe-Fehler: {fehler}</p>
        </div>
      )}
      <p>
        <strong>{offen.length}</strong> wartend · {zeilen.length} gesamt
      </p>
      <div className="tabellen-scroll">
        <table className="zusammenfassung">
          <thead>
            <tr>
              <th>Bestellnummer</th>
              <th>Kundin/Kunde</th>
              <th>Bezahlt</th>
              <th>Kennzeichen</th>
              <th>Stand</th>
              <th>Lead-Status</th>
              <th>Aktion</th>
            </tr>
          </thead>
          <tbody>
            {zeilen.map((z) => (
              <tr key={z.sitzung}>
                <td>{z.bestellnummer}</td>
                <td>
                  {z.kundenname}
                  <br />
                  <span className="erklaerung">{z.email}</span>
                </td>
                <td>{z.bezahltAm.slice(0, 16).replace('T', ' ')}</td>
                <td>{z.kennzeichen.length > 0 ? z.kennzeichen.join('; ') : 'unauffällig'}</td>
                <td>
                  {z.entscheidung === 'erledigt'
                    ? `versendet ${z.marker.ausgeliefert?.slice(0, 16).replace('T', ' ') ?? ''}`
                    : z.entscheidung === 'warten'
                      ? `wartet (erzeugt ${z.marker.erzeugt?.slice(11, 16) ?? ''})`
                      : z.entscheidung === 'unbereit'
                        ? 'noch nicht erzeugt'
                        : 'sendebereit'}
                </td>
                <td>
                  <form method="post" action="/api/admin/lead-status" style={{ display: 'flex', gap: '0.25rem' }}>
                    <input type="hidden" name="schluessel" value={schluessel} />
                    <input type="hidden" name="sitzung" value={z.sitzung} />
                    <select name="status" defaultValue={z.leadStatus} style={{ minHeight: '2.25rem' }}>
                      {LEAD_STATUS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="knopf zweitrangig klein">
                      OK
                    </button>
                  </form>
                </td>
                <td>
                  {z.entscheidung !== 'erledigt' && (
                    <form method="post" action="/api/admin/freigabe">
                      <input type="hidden" name="schluessel" value={schluessel} />
                      <input type="hidden" name="sitzung" value={z.sitzung} />
                      <button type="submit" className="knopf haupt klein">
                        Freigeben und senden
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
