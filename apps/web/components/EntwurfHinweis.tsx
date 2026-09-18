/**
 * Kennzeichnung für Rechtsseiten, die noch Platzhalter sind. Wird entfernt,
 * sobald der jeweilige Text anwaltlich erstellt bzw. geprüft wurde
 * (offener Punkt in docs/STATUS.md; Anbieterdaten folgen mit der
 * Marken-/Gesellschaftsentscheidung).
 */
export function EntwurfHinweis() {
  return (
    <div className="entwurf-kennung" role="note">
      <p>
        <strong>Entwurf – Platzhalter.</strong> Diese Seite ist noch nicht rechtsverbindlich
        formuliert. Anbieter, Anschrift und Vertretungsberechtigte stehen erst nach der
        Marken- und Gesellschaftsentscheidung fest; der endgültige Text wird vor
        Veröffentlichung anwaltlich erstellt bzw. geprüft. Die Website ist bis dahin eine
        nicht indexierte Vorabversion.
      </p>
    </div>
  );
}
