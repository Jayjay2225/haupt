import type { Metadata } from 'next';
import { adminAutorisiert } from '@/lib/admin';
import { ladeBestellungen, type BestellZeile } from '@/lib/admin-liste';
import { LEAD_STATUS, POST_STAND_LABEL } from '@/lib/erfuellung';
import { bestellungAktiv, stripeClient } from '@/lib/zahlung';

export const metadata: Metadata = { title: 'Freigaben (intern)', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

function zeit(iso: string | undefined): string {
  return iso === undefined ? '' : iso.slice(0, 16).replace('T', ' ');
}

/**
 * Interne Freigabe-Liste (Prompt 13, Abschnitt 3): bezahlte Bestellungen mit
 * Plausibilisierungs-Kennzeichen; Freigabe mit einem Klick, Lead-Status
 * (2.3), Spalte „Post“ (Prompt 14, 3: gewünscht → gedruckt → versendet, mit
 * Datum, Druckvorlage zum Herunterladen) und CSV-Export. Zugang:
 * ?schluessel=ADMIN_PASSWORT (zusätzlich zur Beta-Basic-Auth).
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
  const postOffen = zeilen.filter((z) => z.postversand && z.post !== 'versendet');
  const q = encodeURIComponent(schluessel);

  return (
    <div className="container abschnitt">
      <h1>Freigaben.</h1>
      <p className="erklaerung">
        Bezahlte Bestellungen der letzten 30 Tage. Versand: Freigabe-Klick oder automatisch nach 10
        Stunden (Cron). Protokoll = Marker in den Stripe-Metadaten.{' '}
        <a href={`/api/admin/leads.csv?schluessel=${q}`}>CSV-Export</a>
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
        <strong>{offen.length}</strong> wartend · <strong>{postOffen.length}</strong> Post offen · {zeilen.length} gesamt
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
              <th>Post</th>
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
                <td>{zeit(z.bezahltAm)}</td>
                <td>{z.kennzeichen.length > 0 ? z.kennzeichen.join('; ') : 'unauffällig'}</td>
                <td>
                  {z.entscheidung === 'erledigt'
                    ? `versendet ${zeit(z.marker.ausgeliefert)}`
                    : z.entscheidung === 'warten'
                      ? `wartet (erzeugt ${z.marker.erzeugt?.slice(11, 16) ?? ''})`
                      : z.entscheidung === 'unbereit'
                        ? 'noch nicht erzeugt'
                        : 'sendebereit'}
                </td>
                <td>
                  {z.postversand ? (
                    <div style={{ display: 'grid', gap: '0.25rem' }}>
                      <span>
                        {POST_STAND_LABEL[z.post ?? 'gewuenscht']}
                        {z.postAm !== undefined ? ` ${zeit(z.postAm)}` : ''}
                      </span>
                      <a href={`/api/admin/druck?schluessel=${q}&sitzung=${encodeURIComponent(z.sitzung)}`}>
                        Druckvorlage (PDF)
                      </a>
                      {z.post !== 'versendet' && (
                        <form method="post" action="/api/admin/post" style={{ display: 'flex', gap: '0.25rem' }}>
                          <input type="hidden" name="schluessel" value={schluessel} />
                          <input type="hidden" name="sitzung" value={z.sitzung} />
                          {z.post !== 'gedruckt' && (
                            <button type="submit" name="stand" value="gedruckt" className="knopf zweitrangig klein">
                              gedruckt
                            </button>
                          )}
                          <button type="submit" name="stand" value="versendet" className="knopf zweitrangig klein">
                            versendet
                          </button>
                        </form>
                      )}
                    </div>
                  ) : (
                    '–'
                  )}
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
