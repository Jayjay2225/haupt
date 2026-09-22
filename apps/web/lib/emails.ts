/**
 * E-Mail-Vorlagen (Prompt 8, Aufgabe 1 – Tonalität) für Bestätigung, Bericht,
 * Erinnerung und „Später weitermachen“. Reine Textbausteine; der Versand
 * (Double-Opt-in, Anbieter) ist noch nicht angebunden. Alle Texte laufen
 * durch den Verbotslisten-Test (test/wording.test.ts).
 */
import { BRAND } from '@/config/brand';
import { BERICHT_PREIS_BRUTTO_EUR, BERICHT_PREIS_HINWEIS } from '@/config/business';

export interface EmailVorlage {
  betreff: string;
  text: string;
}

function gruss(name: string): string {
  return name.trim() === '' ? 'Guten Tag,' : `Guten Tag ${name.trim()},`;
}

function abschluss(): string {
  return `Freundliche Grüße\nIhr Team von ${BRAND.name}\n${BRAND.kontaktEmail}\n\nAnbieter: ${BRAND.anbieter}. Diese E-Mail ist keine Rechtsberatung. Alle Werte sind Schätzungen mit Bandbreite.`;
}

/** Double-Opt-in: Bestätigung der E-Mail-Adresse. */
export function bestaetigungAdresse(name: string, bestaetigungsLink: string): EmailVorlage {
  return {
    betreff: 'Bitte einmal bestätigen – dann kommt Ihre Ampel',
    text: `${gruss(name)}

Sie haben bei ${BRAND.name} eine Police eingegeben. Damit wir Ihnen schreiben dürfen, bestätigen Sie bitte Ihre Adresse:

${bestaetigungsLink}

Kein Klick, keine weitere E-Mail. So einfach.

${abschluss()}`,
  };
}

/** Ergebnis: Ampel ist da. */
export function ampelFertig(name: string, ampelTitel: string, ergebnisLink: string): EmailVorlage {
  return {
    betreff: `Ihre Ampel steht: ${ampelTitel}`,
    text: `${gruss(name)}

wir haben Ihre Police durchgerechnet. Das Ergebnis: ${ampelTitel}

Was das heißt und was Sie jetzt tun können, lesen Sie hier:
${ergebnisLink}

Rot heißt Finger weg – das sagen wir Ihnen auch. Grün heißt: rechnen lohnt, versprechen können wir nichts.

${abschluss()}`,
  };
}

/** Versand des kostenpflichtigen Berichts. */
export function berichtVersand(name: string, aktenzeichen: string, rechnungLink?: string, erstkunde: boolean = false): EmailVorlage {
  const rechnung = erstkunde
    ? 'Als Erstkunde zahlen Sie nichts. Im Gegenzug bitten wir Sie: Antworten Sie kurz auf diese E-Mail – war der Prüfbericht verständlich, hat er Ihnen weitergeholfen? Wenn Sie mögen, geben Sie uns ein Zitat mit Vorname, Alter und Bundesland frei; erst mit Ihrer dokumentierten Einwilligung zeigen wir es.'
    : rechnungLink === undefined
      ? `Der Prüfbericht kostet ${BERICHT_PREIS_BRUTTO_EUR} € ${BERICHT_PREIS_HINWEIS}; die Rechnung liegt bei bzw. folgt in einer eigenen E-Mail.`
      : `Der Prüfbericht kostet ${BERICHT_PREIS_BRUTTO_EUR} € ${BERICHT_PREIS_HINWEIS}. Ihre Rechnung zum Herunterladen:\n${rechnungLink}`;
  return {
    betreff: `Ihr Prüfbericht ${aktenzeichen} ist fertig`,
    text: `${gruss(name)}

anbei Ihr Prüfbericht zum Policen-Check (Bestellnummer ${aktenzeichen}) als PDF.

Darin: die Spanne in Euro, die Rechnung Jahr für Jahr, jede Zahl mit Quelle – und die Gegenposition des Versicherers. Drucken Sie ihn aus und nehmen Sie ihn mit zum Anwalt oder zu Ihrer Rechtsschutzversicherung. Oder antworten Sie einfach auf diese E-Mail – unsere Partner übernehmen den Rest. Ob Sie das wollen, entscheiden Sie.

${rechnung}

${abschluss()}`,
  };
}

/**
 * Vertragsbestätigung auf dauerhaftem Datenträger (§ 312f BGB) – geht vor Beginn
 * der Ausführung raus: Inhalt, Preis, Anbieter, die abgegebene Zustimmung zur
 * sofortigen Ausführung und die Belehrungen.
 */
export function vertragsbestaetigung(name: string, bestellnummer: string, links: { agb: string; widerruf: string }, preisText?: string): EmailVorlage {
  const a = BRAND.anbieterAnschrift;
  return {
    betreff: `Ihre Bestellung ${bestellnummer}: Bestätigung`,
    text: `${gruss(name)}

vielen Dank für Ihre Bestellung bei ${BRAND.name}. Das ist Ihre Vertragsbestätigung – bitte aufbewahren.

Bestellnummer: ${bestellnummer}
Leistung: ${BRAND.produktname} – Prüfbericht (PDF) zur Rückabwicklung Ihrer Lebens- oder Rentenversicherung, gerechnet aus Ihren Angaben im Rechner. Schätzung mit Bandbreite, keine Rechtsberatung.
Preis: ${preisText ?? `${BERICHT_PREIS_BRUTTO_EUR} € ${BERICHT_PREIS_HINWEIS}, vorab bezahlt. Die Rechnung kommt gesondert.`}
Anbieter: ${BRAND.anbieter}, ${a.strasse}, ${a.plz} ${a.ort}

Ihre Erklärung bei der Bestellung: Sie haben ausdrücklich verlangt, dass wir den Bericht sofort erstellen, und bestätigt, dass Sie Ihr Widerrufsrecht verlieren, sobald der Bericht vollständig geliefert ist.

Widerrufsbelehrung: ${links.widerruf}
AGB: ${links.agb}

Der Prüfbericht folgt in einer eigenen E-Mail, in der Regel innerhalb weniger Minuten.

${abschluss()}`,
  };
}

/** Zahlung ist da, der Bericht konnte aber noch nicht erzeugt werden – Kundin/Kunde informieren. */
export function berichtVerzoegert(name: string, bestellnummer: string): EmailVorlage {
  return {
    betreff: `Ihre Zahlung ist eingegangen – Bericht ${bestellnummer} folgt`,
    text: `${gruss(name)}

Ihre Zahlung für den Policen-Check (Bestellnummer ${bestellnummer}) ist eingegangen. Beim Erstellen des Berichts hakt es gerade technisch. Wir kümmern uns darum und schicken Ihnen den Bericht so schnell wie möglich – spätestens am nächsten Werktag.

Sie müssen nichts tun. Fragen? Antworten Sie einfach auf diese E-Mail.

${abschluss()}`,
  };
}

/** Interner Hinweis an den Anbieter, wenn eine bezahlte Bestellung nicht ausgeliefert werden konnte. */
export function internerFehlerHinweis(bestellnummer: string, fehler: string): EmailVorlage {
  return {
    betreff: `[${BRAND.name}] Auslieferung fehlgeschlagen: ${bestellnummer}`,
    text: `Bestellnummer ${bestellnummer}: Zahlung eingegangen, Bericht nicht ausgeliefert.

Fehler: ${fehler}

Rettungsweg: Stripe stellt das Webhook-Ereignis wegen der 500-Antwort automatisch erneut zu; zusätzlich kann es im Stripe-Dashboard (Entwickler → Webhooks → Ereignis → „Erneut senden“) von Hand ausgelöst werden. Bereits erledigte Schritte werden übersprungen. Danach prüfen, ob die Kundin bzw. der Kunde den Prüfbericht erhalten hat.`,
  };
}

/** Erinnerung, wenn der Rechner nicht abgeschlossen wurde. */
export function erinnerung(name: string, rechnerLink: string): EmailVorlage {
  return {
    betreff: 'Ihre Police wartet – fünf Minuten fehlen noch',
    text: `${gruss(name)}

Sie haben angefangen, Ihre Police einzugeben, und nicht zu Ende gerechnet. Kein Problem – Ihre Angaben sind noch da:

${rechnerLink}

Fünf Minuten, dann steht die Ampel. Wenn Sie nicht mehr wollen, tun Sie nichts. Wir schreiben dazu nicht noch einmal.

${abschluss()}`,
  };
}

/** Link zum Weitermachen (erst mit Persistenz aktiv). */
export function spaeterWeitermachen(name: string, fortsetzenLink: string): EmailVorlage {
  return {
    betreff: 'Ihr Link zum Weitermachen',
    text: `${gruss(name)}

hier ist Ihr Link. Er stellt Ihre Eingaben wieder her, auch auf einem anderen Gerät:

${fortsetzenLink}

Der Link gilt 30 Tage. Danach löschen wir den Zwischenstand.

${abschluss()}`,
  };
}
