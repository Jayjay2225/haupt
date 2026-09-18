/**
 * Starterliste von Versicherer-NAMEN – ausschließlich für die Eingabehilfe
 * (Autocomplete) im Rechner-Formular.
 *
 * Wichtig (CLAUDE.md, Prinzip 1): Diese Liste enthält bewusst KEINE
 * Kennzahlen. Nettoverzinsung, Kostenquoten, geprüfte Rechtsnachfolge und
 * Quellenangaben entstehen erst mit Prompt 2 in `data/insurers.json` und
 * ersetzen diese Datei als Datenbasis. Die Altnamen decken gängige
 * Bezeichnungen auf älteren Policen ab; Freitexteingabe ist immer möglich.
 */
export interface InsurerStarterEntry {
  /** Heutiger, gebräuchlicher Name. */
  name: string;
  /** Frühere Namen, wie sie auf alten Policen stehen können. */
  altnamen: string[];
}

export const INSURER_STARTER_LIST: InsurerStarterEntry[] = [
  { name: 'Allianz Lebensversicherung', altnamen: [] },
  { name: 'Alte Leipziger Lebensversicherung', altnamen: [] },
  { name: 'AXA Lebensversicherung', altnamen: [] },
  { name: 'Bayern-Versicherung (Versicherungskammer Bayern)', altnamen: [] },
  { name: 'Continentale Lebensversicherung', altnamen: [] },
  { name: 'Cosmos Lebensversicherung', altnamen: [] },
  { name: 'Debeka Lebensversicherung', altnamen: [] },
  { name: 'ERGO Lebensversicherung', altnamen: ['Hamburg-Mannheimer', 'Victoria Lebensversicherung'] },
  { name: 'Gothaer Lebensversicherung', altnamen: [] },
  { name: 'Hannoversche Lebensversicherung', altnamen: [] },
  { name: 'HanseMerkur Lebensversicherung', altnamen: [] },
  { name: 'HUK-COBURG Lebensversicherung', altnamen: [] },
  { name: 'LVM Lebensversicherung', altnamen: [] },
  { name: 'Nürnberger Lebensversicherung', altnamen: [] },
  { name: 'Provinzial Lebensversicherung', altnamen: ['Provinzial Rheinland Lebensversicherung'] },
  {
    name: 'Proxalto Lebensversicherung (früher Generali Deutschland)',
    altnamen: ['Generali Lebensversicherung', 'Volksfürsorge', 'AachenMünchener Lebensversicherung', 'Aachener und Münchener Lebensversicherung'],
  },
  { name: 'R+V Lebensversicherung', altnamen: [] },
  { name: 'SIGNAL IDUNA Lebensversicherung', altnamen: [] },
  { name: 'Viridium-Gruppe', altnamen: ['Heidelberger Lebensversicherung', 'Skandia Lebensversicherung'] },
  { name: 'Württembergische Lebensversicherung', altnamen: [] },
  { name: 'Zurich Deutscher Herold Lebensversicherung', altnamen: ['Deutscher Herold'] },
];

/** Alle Namen (aktuelle und frühere) für die Autocomplete-Datalist. */
export function alleVersichererNamen(): string[] {
  const namen = new Set<string>();
  for (const eintrag of INSURER_STARTER_LIST) {
    namen.add(eintrag.name);
    for (const alt of eintrag.altnamen) {
      namen.add(alt);
    }
  }
  return [...namen].sort((a, b) => a.localeCompare(b, 'de'));
}
