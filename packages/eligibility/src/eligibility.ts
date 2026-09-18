/**
 * Eignungs- und Belehrungs-Check (Prompt 4): erzeugt aus den Fragebogen-
 * Antworten und data/legal-rules.json eine Ampel mit Begründungen.
 *
 * Wording-Regel (CLAUDE.md, Prinzip 4): Es wird keine Rechtsaussage im
 * Einzelfall getroffen. Alle Begründungstexte stammen aus dem Regelwerk
 * und ordnen nur ein; jede Begründung nennt ihre Regel-IDs. „Unbekannt"
 * führt nie zu Grün, sondern zu Gelb mit Angabe des benötigten Dokuments.
 */
import { ELIGIBILITY_VERSION } from './version';
import { erfuelltBedingung } from './bedingung';
import type {
  Ampel,
  Begruendung,
  EligibilityInput,
  EligibilityResult,
  Regel,
  RegimeErgebnis,
  Regelwerk,
} from './types';

const DOKUMENT_ZUSTANDEKOMMEN =
  'Versicherungsantrag und Policenbegleitschreiben (zur Klärung Policen- oder Antragsmodell)';

function regelGiltFuerRegime(regel: Regel, regime: RegimeErgebnis): boolean {
  if (regel.regime === 'alle') {
    return true;
  }
  if (regel.regime === 'alt') {
    return regime.startsWith('alt');
  }
  return regel.regime === regime;
}

export function pruefeEignung(input: EligibilityInput, regelwerk: Regelwerk): EligibilityResult {
  const begruendungen: Begruendung[] = [];
  const hinweise: Begruendung[] = [];
  const benoetigteDokumente = new Set<string>();
  const angewendet: string[] = [];

  const passt = (regel: Regel): boolean => erfuelltBedingung(input, regel.bedingung);
  const nutze = (regel: Regel, ziel: Begruendung[]): void => {
    angewendet.push(regel.id);
    ziel.push({ text: regel.folge.text, regelIds: [regel.id] });
    if (regel.folge.benoetigtesDokument !== undefined) {
      benoetigteDokumente.add(regel.folge.benoetigtesDokument);
    }
  };

  // Grenzmonate: Bei Monatsangabe entscheidet der genaue Tag (vor der
  // Regime-Prüfung erfasst, damit der Hinweis auch bei Ausschluss erscheint).
  const grenzmonatJuli94 = input.vertragsschluss === '1994-07';
  if (grenzmonatJuli94) {
    hinweise.push({
      text: 'Vertragsschluss im Juli 1994: Maßgeblich ist der genaue Tag (Stichtag 29.07.1994). Die Einordnung unterstellt vorsorglich einen Vertragsschluss ab dem 29.07.1994; die Ampel bleibt höchstens Gelb, bis das genaue Datum anhand der Police belegt ist.',
      regelIds: ['R-REGIME-VOR1994', 'R-REGIME-A'],
    });
    benoetigteDokumente.add('Police mit genauem Vertragsschluss- bzw. Policierungsdatum');
  }
  // Für die Regelauswertung wird der Grenzmonat vorsorglich in den
  // Anwendungsbereich gelegt (Kappung auf Gelb unten).
  if (grenzmonatJuli94) {
    input = { ...input, vertragsschluss: '1994-07-29' };
  }
  if (input.vertragsschluss === '2004-12') {
    hinweise.push({
      text: 'Vertragsschluss im Dezember 2004: Für die maßgebliche Widerspruchsfrist (14 oder 30 Tage) entscheidet der genaue Tag (Gesetzesänderung zum 08.12.2004).',
      regelIds: ['R-FEHLER-FRIST-ZU-KURZ'],
    });
  }

  // 1. Regime bestimmen (Regeln mit folge.typ regime/ausschluss auf Regime-Ebene).
  let regime: RegimeErgebnis = 'keins';
  let regimeAusschluss: Regel | undefined;
  for (const regel of regelwerk.regeln) {
    if (regel.folge.typ === 'regime' && passt(regel)) {
      regime = regel.folge.wert as RegimeErgebnis;
      angewendet.push(regel.id);
      begruendungen.push({ text: regel.folge.text, regelIds: [regel.id] });
      break;
    }
    if (regel.folge.typ === 'ausschluss' && regel.regime === 'keins' && passt(regel)) {
      regimeAusschluss = regel;
      break;
    }
  }

  const meta = {
    eligibilityVersion: ELIGIBILITY_VERSION,
    rulesVersion: regelwerk.version,
    rulesStand: regelwerk.stand,
  };

  if (regimeAusschluss !== undefined) {
    nutze(regimeAusschluss, begruendungen);
    return {
      ampel: 'rot',
      regime: 'keins',
      begruendungen,
      hinweise,
      benoetigteDokumente: [...benoetigteDokumente],
      angewendeteRegeln: angewendet,
      meta,
    };
  }

  // 2. Globale Ausschlüsse (z. B. reine Risikolebensversicherung).
  for (const regel of regelwerk.regeln) {
    if (regel.folge.typ === 'ausschluss' && regel.regime === 'alle' && passt(regel)) {
      nutze(regel, begruendungen);
      return {
        ampel: 'rot',
        regime,
        begruendungen,
        hinweise,
        benoetigteDokumente: [...benoetigteDokumente],
        angewendeteRegeln: angewendet,
        meta,
      };
    }
  }

  // 3. Hinweis- und Methodik-Regeln (regime-gefiltert) einsammeln.
  for (const regel of regelwerk.regeln) {
    if (
      (regel.folge.typ === 'hinweis' || regel.folge.typ === 'methodik' || regel.folge.typ === 'kein-verwirkungsindikator') &&
      regelGiltFuerRegime(regel, regime) &&
      passt(regel)
    ) {
      nutze(regel, hinweise);
    }
  }

  // 4. Regime C (ab 2008): keine Fehlerbewertung nach § 5a-Katalog.
  if (regime === 'neu-2008') {
    const ampel: Ampel = input.belehrungVorhanden === 'ja' ? 'rot' : 'gelb';
    begruendungen.push(
      input.belehrungVorhanden === 'ja'
        ? {
            text: 'Nach Ihren Angaben liegt eine Widerrufsbelehrung vor; die Widerrufsfrist von 30 Tagen (§ 152 VVG) ist damit regelmäßig lange abgelaufen. Zusammen mit den ohnehin begrenzten Widerrufsfolgen ist ein wirtschaftlicher Vorteil nicht erkennbar.',
            regelIds: ['R-REGIME-C', 'R-FOLGE-NEU2008'],
          }
        : {
            text: 'Ob die Widerrufsfrist mangels ordnungsgemäßer Belehrung noch offen ist und ob sich der Widerruf trotz der begrenzten Rechtsfolgen wirtschaftlich lohnt, ist anwaltlich zu prüfen (u. a. gesetzliche Höchstfristen je nach Vertragsjahrgang).',
            regelIds: ['R-REGIME-C', 'R-FOLGE-NEU2008'],
          },
    );
    if (input.belehrungVorhanden === 'unbekannt') {
      benoetigteDokumente.add('Versicherungsschein mit Widerrufsbelehrung (ggf. Zweitschrift anfordern)');
    }
    return {
      ampel,
      regime,
      begruendungen,
      hinweise,
      benoetigteDokumente: [...benoetigteDokumente],
      angewendeteRegeln: angewendet,
      meta,
    };
  }

  // 5. Regime A/B/unbekannt: Belehrungsfehler bewerten.
  let wesentlich = 0;
  let geringfuegig = 0;
  let unbekannt = 0;
  let ordnungsgemaess = false;
  for (const regel of regelwerk.regeln) {
    if (!regelGiltFuerRegime(regel, regime) || !passt(regel)) {
      continue;
    }
    if (regel.folge.typ === 'fehler') {
      nutze(regel, begruendungen);
      if (regel.gewicht === 'wesentlich') {
        wesentlich += 1;
      } else if (regel.gewicht === 'geringfuegig') {
        geringfuegig += 1;
      } else {
        unbekannt += 1;
      }
    } else if (regel.folge.typ === 'ordnungsgemaess') {
      nutze(regel, begruendungen);
      ordnungsgemaess = true;
    }
  }

  // 6. Verwirkungsindikatoren.
  let verwirkungsindikator = false;
  for (const regel of regelwerk.regeln) {
    if (regel.folge.typ === 'verwirkungsindikator' && regelGiltFuerRegime(regel, regime) && passt(regel)) {
      nutze(regel, begruendungen);
      verwirkungsindikator = true;
    }
  }

  // 7. Ampel ableiten.
  let ampel: Ampel;
  if (wesentlich > 0) {
    ampel = 'gruen';
  } else if (ordnungsgemaess) {
    ampel = 'rot';
  } else if (geringfuegig > 0 && unbekannt === 0) {
    ampel = 'rot';
  } else {
    ampel = 'gelb';
  }

  // Kappungen auf Gelb: offene Punkte verhindern Grün.
  if (ampel === 'gruen' && verwirkungsindikator) {
    ampel = 'gelb';
  }
  if (ampel === 'gruen' && regime === 'alt-unbekannt') {
    ampel = 'gelb';
    benoetigteDokumente.add(DOKUMENT_ZUSTANDEKOMMEN);
  }
  if (ampel === 'gruen' && grenzmonatJuli94) {
    ampel = 'gelb';
  }
  if (regime === 'alt-unbekannt') {
    benoetigteDokumente.add(DOKUMENT_ZUSTANDEKOMMEN);
  }

  return {
    ampel,
    regime,
    begruendungen,
    hinweise,
    benoetigteDokumente: [...benoetigteDokumente],
    angewendeteRegeln: angewendet,
    meta,
  };
}
