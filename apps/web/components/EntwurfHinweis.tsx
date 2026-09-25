import { BRAND } from '@/config/brand';

/**
 * Kennzeichnung für Rechtsseiten, die noch nicht anwaltlich abgenommen sind.
 * Wird entfernt, sobald der jeweilige Text geprüft ist. Anbieter und
 * Registerdaten stehen (config/brand.ts); Umsatzsteuer-ID und Telefon trägt
 * der Anbieter nach.
 */
export function EntwurfHinweis() {
  const offen = [BRAND.anbieterUstId === '' ? 'Umsatzsteuer-ID' : '', BRAND.anbieterTelefon === '' ? 'Telefonnummer' : '']
    .filter((t) => t !== '')
    .join(' und ');
  return (
    <div className="entwurf-kennung" role="note">
      <p>
        <strong>Entwurf.</strong> Diese Seite ist noch nicht anwaltlich geprüft. Anbieter ist {BRAND.anbieter}
        {BRAND.anbieterRegister !== '' ? ` (${BRAND.anbieterRegister}, Registerabruf 20.09.2026, vor Veröffentlichung gegen das Registerportal zu prüfen)` : ''}
        .{offen !== '' ? ` ${offen} werden nachgetragen.` : ''} Der endgültige Text wird vor Veröffentlichung anwaltlich
        erstellt bzw. geprüft; bis dahin läuft die Seite als Beta mit Passwort und ohne Suchmaschinen-Indexierung.
      </p>
    </div>
  );
}
