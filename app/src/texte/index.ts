/** i18n vorbereitet: alle UI-Texte aus einer Ressourcen-Datei, Deutsch zuerst. */
import de from './de.json';

type Woerterbuch = { [k: string]: string | Woerterbuch };

const sprachen: Record<string, Woerterbuch> = { de: de as Woerterbuch };
const aktiv = 'de';

/** t('moment.gefuehlFrage') · t('abschluss.kompass', { bereich: 'Körperliche Gesundheit' }) */
export function t(pfad: string, params?: Record<string, string | number>): string {
  const teile = pfad.split('.');
  let knoten: string | Woerterbuch | undefined = sprachen[aktiv];
  for (const teil of teile) {
    if (typeof knoten !== 'object' || knoten == null) break;
    knoten = knoten[teil];
  }
  if (typeof knoten !== 'string') return pfad;
  if (!params) return knoten;
  return knoten.replace(/\{(\w+)\}/g, (_, name: string) =>
    params[name] != null ? String(params[name]) : `{${name}}`,
  );
}
