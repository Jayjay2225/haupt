/**
 * Kostenloser Videocall (Prompt 14, Abschnitt 1.8) als Reintext – für die
 * Gutachten-E-Mail (letzte Zeile). Die Website-Fassung mit Link steht in
 * components/VideocallSatz.tsx; beide lesen dieselbe Konfiguration.
 */
import { VIDEOCALL } from '@/config/business';

export function videocallText(): string {
  const ziel = VIDEOCALL.url !== '' ? VIDEOCALL.url : VIDEOCALL.platzhalter;
  return `${VIDEOCALL.satz} ${VIDEOCALL.linkText}: ${ziel}`;
}
