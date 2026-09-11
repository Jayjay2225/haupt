/**
 * @rueckab/eligibility – fragebogengestützter Eignungs- und Belehrungs-Check:
 * erzeugt aus data/legal-rules.json eine Ampel (grün / gelb / rot) mit
 * Begründung und Regel-IDs.
 *
 * Die fachliche Implementierung erfolgt mit Prompt 4 (docs/PROMPTS.md) und
 * setzt data/legal-rules.json aus Prompt 1 voraus. Wording-Regel: keine
 * Rechtsaussage im Einzelfall, nur Einordnung (siehe CLAUDE.md, Prinzip 4).
 */

/** Version des Eignungs-Checks. */
export const ELIGIBILITY_VERSION = '0.1.0';
