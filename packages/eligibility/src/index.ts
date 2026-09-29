/**
 * @rueckab/eligibility – fragebogengestützter Eignungs- und Belehrungs-Check:
 * erzeugt aus data/legal-rules.json eine Ampel (grün / gelb / rot) mit
 * Begründungen und Regel-IDs. Keine Rechtsaussage im Einzelfall
 * (CLAUDE.md, Prinzip 4); „unbekannt" führt nie zu Grün.
 */
export { ELIGIBILITY_VERSION } from './version';
export { pruefeEignung } from './eligibility';
export { erfuelltBedingung, vergleichsdatum } from './bedingung';
export type * from './types';
