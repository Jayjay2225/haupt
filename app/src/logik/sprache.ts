/**
 * Web Speech API mit Text-Fallback (Konzept Kapitel 10):
 * Text ist nie ein Notnagel, sondern ein gleichwertiger Eingabeweg.
 */

interface ErkennungsErgebnis { transcript: string }
interface ErkennungsEvent { results: ArrayLike<ArrayLike<ErkennungsErgebnis>> }
interface Erkennung {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: ErkennungsEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type ErkennungsKonstruktor = new () => Erkennung;

function konstruktor(): ErkennungsKonstruktor | undefined {
  const w = window as unknown as {
    SpeechRecognition?: ErkennungsKonstruktor;
    webkitSpeechRecognition?: ErkennungsKonstruktor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export function spracheVerfuegbar(): boolean {
  return typeof window !== 'undefined' && konstruktor() !== undefined;
}

export function hoereZu(
  beiText: (text: string) => void,
  beiEnde: () => void,
): { stopp: () => void } | undefined {
  const K = konstruktor();
  if (!K) return undefined;
  const erkennung = new K();
  erkennung.lang = 'de-DE';
  erkennung.interimResults = false;
  erkennung.maxAlternatives = 1;
  erkennung.onresult = (e) => {
    const text = e.results[0]?.[0]?.transcript ?? '';
    if (text) beiText(text);
  };
  erkennung.onerror = () => beiEnde();
  erkennung.onend = () => beiEnde();
  try {
    erkennung.start();
  } catch {
    beiEnde();
    return undefined;
  }
  return { stopp: () => erkennung.abort() };
}
