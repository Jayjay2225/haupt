/**
 * Kostenloser Videocall (Prompt 14, Abschnitt 1.8): ein Satz, dezent – im
 * FAQ, auf /durchsetzung und (als Text, lib/videocall.ts) in der
 * Gutachten-E-Mail. Der Link zeigt auf das Buchungstool aus der Konfiguration;
 * solange keine Adresse hinterlegt ist, bleibt der Platzhalter sichtbar.
 */
import { VIDEOCALL } from '@/config/business';

export { videocallText } from '@/lib/videocall';

export function VideocallSatz() {
  return (
    <span className="videocall-satz">
      {VIDEOCALL.satz}{' '}
      {VIDEOCALL.url !== '' ? (
        <a href={VIDEOCALL.url} rel="noopener">
          {VIDEOCALL.linkText}
        </a>
      ) : (
        <span>
          {VIDEOCALL.linkText}: {VIDEOCALL.platzhalter}
        </span>
      )}
    </span>
  );
}
