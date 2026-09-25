/**
 * E-Mail-Vorlagen (Prompt 12, Abschnitt 3.4). Reine Textbausteine; der
 * Versand läuft über lib/versand.ts. Alle Texte laufen durch den
 * Wording-Test (test/wording.test.ts).
 */
import { BRAND } from '@/config/brand';
import { BERICHT_PREIS_BRUTTO_EUR, BERICHT_PREIS_HINWEIS, FORTSETZEN_TAGE } from '@/config/business';

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

/** Ergebnis-Link nach dem Rechner (Deck 3.4). */
export function ergebnisLink(link: string): EmailVorlage {
  return {
    betreff: 'Ihre Ampel steht',
    text: `Guten Tag,

Ihr Ergebnis wartet. Der Link ist ${FORTSETZEN_TAGE} Tage gültig.

Ergebnis öffnen:
${link}

${abschluss()}`,
  };
}

/** „Später weitermachen“ (Deck 3.4). */
export function spaeterWeitermachen(name: string, link: string): EmailVorlage {
  return {
    betreff: 'Weitermachen, wo Sie aufgehört haben',
    text: `${gruss(name)}

Ihre Angaben sind noch da. Der Link stellt sie wieder her, auch auf einem anderen Gerät:

Fortsetzen:
${link}

Der Link gilt ${FORTSETZEN_TAGE} Tage.

${abschluss()}`,
  };
}

/** Versand des kostenpflichtigen Berichts (Prompt 13, 2.3: „Ihr Prüfbericht ist da“ + Übernahme). */
export function berichtVersand(
  name: string,
  aktenzeichen: string,
  rechnungLink?: string,
  erstkunde: boolean = false,
  durchsetzungLink?: string,
): EmailVorlage {
  const rechnung = erstkunde
    ? 'Als Erstkunde zahlen Sie nichts. Im Gegenzug bitten wir Sie: Antworten Sie kurz auf diese E-Mail – war der Prüfbericht verständlich, hat er Ihnen weitergeholfen? Wenn Sie mögen, geben Sie uns ein Zitat mit Vorname, Alter und Vertragsart frei; erst mit Ihrer dokumentierten Einwilligung zeigen wir es.'
    : rechnungLink === undefined
      ? `Der Prüfbericht kostet ${BERICHT_PREIS_BRUTTO_EUR} € ${BERICHT_PREIS_HINWEIS}; die Rechnung liegt bei bzw. folgt in einer eigenen E-Mail.`
      : `Der Prüfbericht kostet ${BERICHT_PREIS_BRUTTO_EUR} € ${BERICHT_PREIS_HINWEIS}. Ihre Rechnung zum Herunterladen:\n${rechnungLink}`;
  return {
    betreff: 'Ihr Prüfbericht ist da',
    text: `${gruss(name)}

Ihre Zahl steht im Anhang (Bestellnummer ${aktenzeichen}): Jahr für Jahr aufgeschlüsselt, jede Rendite mit Quelle – und die Gegenposition des Versicherers.

Nächster Schritt: Wir übernehmen. Spezialisierte Anwälte setzen sich für Sie mit dem Versicherer auseinander – Sie müssen nichts selbst verhandeln. Antworten Sie auf diese E-Mail oder klicken Sie hier:

Durchsetzung beauftragen:
${durchsetzungLink ?? '/durchsetzung'}

${rechnung}

${abschluss()}`,
  };
}

/** Eingangsbestätigung nach dem Auftragsformular /durchsetzung. */
export function uebernahmeAngefragt(name: string): EmailVorlage {
  return {
    betreff: 'Ihre Beauftragung ist da – wir übernehmen',
    text: `${gruss(name)}

Ihre Beauftragungsanfrage ist angekommen. Die spezialisierten Anwälte, mit denen wir arbeiten, sichten Ihren Fall und melden sich mit dem weiteren Vorgehen – Sie haben einen Ansprechpartner und müssen nichts selbst verhandeln.

Fehlende Unterlagen können Sie einfach als Antwort auf diese E-Mail nachreichen.

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
Leistung: ${BRAND.produktname} (PDF) zu Ihrer Lebens- oder Rentenversicherung, gerechnet aus Ihren Angaben im Rechner. Schätzung mit Bandbreite, keine Rechtsberatung.
Preis: ${preisText ?? `${BERICHT_PREIS_BRUTTO_EUR} € ${BERICHT_PREIS_HINWEIS}, vorab bezahlt. Die Rechnung kommt gesondert.`}
Anbieter: ${BRAND.anbieter}, ${a.strasse}, ${a.plz} ${a.ort}

Ihre Erklärung bei der Bestellung: Sie haben ausdrücklich verlangt, dass wir den Bericht sofort erstellen, und bestätigt, dass Sie Ihr Widerrufsrecht verlieren, sobald der Bericht vollständig geliefert ist.

Widerrufsbelehrung: ${links.widerruf}
AGB: ${links.agb}

Der Prüfbericht folgt in einer eigenen E-Mail – innerhalb von 12 Stunden; er wird vor dem Versand plausibilisiert.

${abschluss()}`,
  };
}

/** Zahlung ist da, der Bericht konnte aber noch nicht erzeugt werden – Kundin/Kunde informieren. */
export function berichtVerzoegert(name: string, bestellnummer: string): EmailVorlage {
  return {
    betreff: `Ihre Zahlung ist eingegangen – Bericht ${bestellnummer} folgt`,
    text: `${gruss(name)}

Ihre Zahlung für den Prüfbericht (Bestellnummer ${bestellnummer}) ist eingegangen. Beim Erstellen hakt es gerade technisch. Wir kümmern uns darum und schicken Ihnen den Bericht so schnell wie möglich – spätestens am nächsten Werktag.

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

/** Anfrage zur individuellen Prüfung (Fonds, andere Jahrgänge, „Lieber persönlich?“). */
export function anfrageEingegangen(name: string): EmailVorlage {
  return {
    betreff: 'Ihre Anfrage ist da',
    text: `${gruss(name)}

Ihre Anfrage zur individuellen Prüfung ist angekommen. Wir sehen uns Ihren Vertrag an und melden uns per E-Mail – in der Regel innerhalb von zwei Werktagen.

${abschluss()}`,
  };
}
