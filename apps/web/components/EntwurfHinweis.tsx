import { BRAND } from '@/config/brand';

/**
 * Kennzeichnung für Rechtsseiten, die noch Platzhalter sind. Wird entfernt,
 * sobald der jeweilige Text anwaltlich erstellt bzw. geprüft wurde. Die Marke
 * steht (Renten-Rettung); der Anbieter (welche GmbH) ist noch offen.
 */
export function EntwurfHinweis() {
  return (
    <div className="entwurf-kennung" role="note">
      <p>
        <strong>Entwurf – Platzhalter.</strong> Diese Seite ist noch nicht rechtsverbindlich
        formuliert. Anbieter ({BRAND.anbieter}), Anschrift und Vertretungsberechtigte stehen erst
        nach der Gesellschaftsentscheidung fest; der endgültige Text wird vor Veröffentlichung
        anwaltlich erstellt bzw. geprüft. Die Seite läuft bis dahin als Beta mit Passwort und ohne
        Suchmaschinen-Indexierung.
      </p>
    </div>
  );
}
