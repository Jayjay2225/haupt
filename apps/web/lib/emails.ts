/**
 * E-Mail-Vorlagen (Prompt 12, Abschnitt 3.4; Prompt 14: Produktname
 * „Gutachten“, Postversand als Zusatzoption, Videocall-Zeile, Rückfrage bei
 * unbekannter Vertragsart). Reine Textbausteine; der Versand läuft über
 * lib/versand.ts. Alle Texte laufen durch den Wording-Test
 * (test/wording.test.ts).
 */
import { BRAND } from '@/config/brand';
import { BERICHT_PREIS_BRUTTO_EUR, BERICHT_PREIS_HINWEIS, FORTSETZEN_TAGE, POST_WERKTAGE_TEXT } from '@/config/business';
import { videocallText } from './videocall';

export interface EmailVorlage {
  betreff: string;
  text: string;
}

/** Anrede-Name aus Nutzereingabe: eine Zeile, begrenzt, keine Links oder Adressen (kein Missbrauch als Mail-Relay). */
function gruss(name: string): string {
  const n = name.replace(/\s+/g, ' ').trim().slice(0, 80);
  if (n === '' || /https?:\/\/|www\.|@/i.test(n)) {
    return 'Guten Tag,';
  }
  return `Guten Tag ${n},`;
}

function abschluss(): string {
  return `Freundliche Grüße\nIhr Team von ${BRAND.name}\n${BRAND.kontaktEmail}\n\nAnbieter: ${BRAND.anbieter}. Diese E-Mail ist keine Rechtsberatung. Alle Werte sind Schätzungen mit Bandbreite.`;
}

/** „Später weitermachen“ (Deck 3.4) – im Funnel ab Schritt 3 (Prompt 14). */
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

/**
 * Versand des Gutachtens (Prompt 13, 2.3 + Prompt 14, 0.6/0.3/1.8): Betreff
 * „Ihr Gutachten ist da“, Hinweis auf die gedruckte Fassung, wenn gewählt,
 * Videocall-Satz als letzte Zeile.
 */
export function berichtVersand(
  name: string,
  aktenzeichen: string,
  rechnungLink?: string,
  erstkunde: boolean = false,
  durchsetzungLink?: string,
  postversand: boolean = false,
): EmailVorlage {
  const rechnung = erstkunde
    ? 'Als Erstkunde zahlen Sie nichts. Im Gegenzug bitten wir Sie: Antworten Sie kurz auf diese E-Mail – war das Gutachten verständlich, hat es Ihnen weitergeholfen? Wenn Sie mögen, geben Sie uns ein Zitat mit Vorname, Alter und Vertragsart frei; erst mit Ihrer dokumentierten Einwilligung zeigen wir es.'
    : rechnungLink === undefined
      ? `Das Gutachten kostet ${BERICHT_PREIS_BRUTTO_EUR} € ${BERICHT_PREIS_HINWEIS}; die Rechnung liegt bei bzw. folgt in einer eigenen E-Mail.`
      : `Das Gutachten kostet ${BERICHT_PREIS_BRUTTO_EUR} € ${BERICHT_PREIS_HINWEIS}. Ihre Rechnung zum Herunterladen:\n${rechnungLink}`;
  const post = postversand
    ? `\n\nSie haben zusätzlich die gedruckte Fassung gewählt: Sie ist in ${POST_WERKTAGE_TEXT} bei Ihnen – kostenlos.`
    : '';
  return {
    betreff: 'Ihr Gutachten ist da',
    text: `${gruss(name)}

Ihre Zahl steht im Anhang (Bestellnummer ${aktenzeichen}): Jahr für Jahr aufgeschlüsselt, jede Rendite mit Quelle – und die Gegenposition des Versicherers.${post}

Nächster Schritt: Wir übernehmen. Spezialisierte Anwälte setzen sich für Sie mit dem Versicherer auseinander – Sie müssen nichts selbst verhandeln. Antworten Sie auf diese E-Mail oder klicken Sie hier:

Durchsetzung beauftragen:
${durchsetzungLink ?? '/durchsetzung'}

${rechnung}

${abschluss()}

${videocallText()}`,
  };
}

/**
 * Vertragsart „Weiß ich nicht“ (Prompt 14, Schritt 1): Das Gutachten wird wie
 * für eine Kapitallebensversicherung gerechnet (Annahme im Gutachten); per
 * E-Mail fragen wir nach der Angabe auf der Police.
 */
export function rueckfrageVertragsart(name: string, bestellnummer: string): EmailVorlage {
  return {
    betreff: `Kurze Rückfrage zu Ihrer Bestellung ${bestellnummer}`,
    text: `${gruss(name)}

Sie haben bei der Vertragsart „Weiß ich nicht“ gewählt. Wir rechnen Ihr Gutachten zunächst wie für eine Kapitallebensversicherung und weisen das darin als Annahme aus.

Damit die Zahl genauer wird, antworten Sie bitte kurz auf diese E-Mail: Was steht oben auf Ihrer Police – Kapitallebensversicherung, Rentenversicherung oder fondsgebunden? Ein Foto der ersten Seite reicht. Wir passen das Gutachten dann an.

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
 * sofortigen Ausführung (digitaler Inhalt, Erlöschen des Widerrufsrechts mit
 * Beginn der Erstellung – derselbe Wortlaut wie das Häkchen in Schritt 11) und
 * die Belehrungen. Mit Postversand wird die gedruckte Fassung als kostenlose
 * Zusatzleistung genannt. `sofort`: Gutachten wird im selben Durchlauf erzeugt
 * und versendet (Erstkunden, Nachholung durch den Cron) – dann verspricht der
 * Text keine Plausibilisierungsphase, die nicht stattfindet.
 */
export function vertragsbestaetigung(
  name: string,
  bestellnummer: string,
  links: { agb: string; widerruf: string },
  preisText?: string,
  postversand: boolean = false,
  sofort: boolean = false,
): EmailVorlage {
  const a = BRAND.anbieterAnschrift;
  const post = postversand ? `Zusätzlich gewählt: gedruckte Fassung per Post, kostenlos (${POST_WERKTAGE_TEXT}).\n` : '';
  const lieferung = sofort
    ? 'Das Gutachten folgt in einer eigenen E-Mail – in wenigen Minuten.'
    : 'Das Gutachten folgt in einer eigenen E-Mail – innerhalb von 12 Stunden; es wird vor dem Versand plausibilisiert.';
  return {
    betreff: `Ihre Bestellung ${bestellnummer}: Bestätigung`,
    text: `${gruss(name)}

vielen Dank für Ihre Bestellung bei ${BRAND.name}. Das ist Ihre Vertragsbestätigung – bitte aufbewahren.

Bestellnummer: ${bestellnummer}
Leistung: ${BRAND.produktname} (PDF) zu Ihrer Lebens- oder Rentenversicherung – eine automatisierte versicherungsmathematische Auswertung auf Basis Ihrer Angaben im Rechner und veröffentlichter Versichererkennzahlen. Schätzung mit Bandbreite, keine Rechtsberatung, kein Sachverständigengutachten.
${post}Preis: ${preisText ?? `${BERICHT_PREIS_BRUTTO_EUR} € ${BERICHT_PREIS_HINWEIS}, vorab bezahlt. Die Rechnung kommt gesondert.`}
Anbieter: ${BRAND.anbieter}, ${a.strasse}, ${a.plz} ${a.ort}

Ihre Erklärung bei der Bestellung: Sie haben ausdrücklich verlangt, dass wir das Gutachten (digitaler Inhalt) sofort erstellen, und bestätigt, dass Ihr Widerrufsrecht mit Beginn der Erstellung erlischt.

Widerrufsbelehrung: ${links.widerruf}
AGB: ${links.agb}

${lieferung}

${abschluss()}`,
  };
}

/**
 * Das Gutachten konnte noch nicht erzeugt werden – Kundin/Kunde informieren.
 * Erstkunden haben nichts bezahlt und keinen automatischen Wiederholungsweg;
 * ihr Text nennt weder eine Zahlung noch eine feste Frist.
 */
export function berichtVerzoegert(name: string, bestellnummer: string, erstkunde: boolean = false): EmailVorlage {
  if (erstkunde) {
    return {
      betreff: `Ihre Bestellung ${bestellnummer}: Gutachten folgt`,
      text: `${gruss(name)}

Ihre Bestellung im Erstkunden-Programm (Bestellnummer ${bestellnummer}) ist angekommen. Beim Erstellen des Gutachtens hakt es gerade technisch. Wir kümmern uns darum und melden uns per E-Mail; Ihr Freischaltcode bleibt gültig.

Fragen? Antworten Sie einfach auf diese E-Mail.

${abschluss()}`,
    };
  }
  return {
    betreff: `Ihre Zahlung ist eingegangen – Gutachten ${bestellnummer} folgt`,
    text: `${gruss(name)}

Ihre Zahlung für das Gutachten (Bestellnummer ${bestellnummer}) ist eingegangen. Beim Erstellen hakt es gerade technisch. Wir kümmern uns darum und schicken Ihnen das Gutachten so schnell wie möglich – spätestens am nächsten Werktag.

Sie müssen nichts tun. Fragen? Antworten Sie einfach auf diese E-Mail.

${abschluss()}`,
  };
}

/** Rettungsweg je Auslöser: Phase A (Webhook, 500 → Stripe-Retry), Phase B (Cron/Freigabe) oder Erstkunden-Weg ohne Stripe. */
export type FehlerWeg = 'webhook' | 'versand' | 'erstkunde';

const RETTUNGSWEG: Record<FehlerWeg, string> = {
  webhook:
    'Stripe stellt das Webhook-Ereignis wegen der 500-Antwort automatisch erneut zu; zusätzlich kann es im Stripe-Dashboard (Entwickler → Webhooks → Ereignis → „Erneut senden“) von Hand ausgelöst werden.',
  versand:
    'Kein Stripe-Retry (Phase B). Nächster automatischer Versuch: der nächste Lauf von /api/auslieferung/cron (laut apps/web/vercel.json derzeit einmal täglich); sofort nachholen über „Freigeben und senden“ unter /admin.',
  erstkunde:
    'Kein automatischer Versuch: Erstkunden-Bestellungen laufen ohne Stripe und werden vom Cron nicht gefunden. Der Freischaltcode ist wieder freigegeben – Kundin bzw. Kunde erneut einlösen lassen oder das Gutachten von Hand erzeugen und senden.',
};

/** Interner Hinweis an den Anbieter, wenn eine Bestellung nicht ausgeliefert werden konnte – mit dem Rettungsweg des jeweiligen Pfads. */
export function internerFehlerHinweis(bestellnummer: string, fehler: string, weg: FehlerWeg): EmailVorlage {
  const kopf = weg === 'erstkunde' ? 'Erstkunden-Code eingelöst (kostenlos)' : 'Zahlung eingegangen';
  return {
    betreff: `[${BRAND.name}] Auslieferung fehlgeschlagen: ${bestellnummer}`,
    text: `Bestellnummer ${bestellnummer}: ${kopf}, Gutachten nicht ausgeliefert.

Fehler: ${fehler}

Rettungsweg: ${RETTUNGSWEG[weg]} Bereits erledigte Schritte werden übersprungen. Danach prüfen, ob die Kundin bzw. der Kunde das Gutachten erhalten hat.`,
  };
}

/**
 * Interner Druckauftrag (Prompt 14, 0.3/3): Postversand gewählt – die
 * Druckvorlage (Deckblatt, Gutachten, Beileger) geht als Anhang an den
 * Anbieter bzw. später an den Druckdienstleister; Stand in der Admin-Spalte „Post“.
 */
export function druckauftrag(bestellnummer: string, name: string, adresse: string): EmailVorlage {
  return {
    betreff: `[Post] Druckvorlage ${bestellnummer}`,
    text: `Postversand gewünscht (kostenlose Zusatzoption, ${POST_WERKTAGE_TEXT}).

Bestellnummer: ${bestellnummer}
Empfänger: ${name}
Anschrift: ${adresse}

Anhang: Druckvorlage A4, beidseitig (Deckblatt mit Anschrift, Gutachten, Beileger). Nach Druck und Versand im Admin die Spalte „Post“ auf „gedruckt“ bzw. „versendet“ setzen.`,
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
