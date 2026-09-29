/**
 * Zahlungsabwicklung über Stripe Checkout (nur serverseitig).
 *
 * - Zahlung vorab; eine Sitzung enthält Preis, Zahlungsarten (Karte, PayPal,
 *   Klarna – im Stripe-Konto zu aktivieren), Rechnungserstellung und den
 *   kodierten Fall in den Metadaten (lib/fall-kodierung.ts).
 * - Prompt 14: Metadatum `post` = '1', wenn die kostenlose gedruckte Fassung
 *   gewählt wurde; der PaymentIntent trägt dann von Anfang an den Marker
 *   `post_status = gewuenscht` (Admin-Spalte „Post“).
 * - Ohne STRIPE_SECRET_KEY ist die Bestellung aus (`bestellungAktiv()`).
 * - Es wird nichts mit Personenbezug geloggt.
 */
import { randomBytes } from 'node:crypto';
import Stripe from 'stripe';
import { BRAND } from '@/config/brand';
import { BERICHT_PREIS_BRUTTO_EUR } from '@/config/business';
import type { CaseDraft } from './draft';
import { fallAlsMetadaten } from './fall-kodierung';

export function stripeSchluessel(): string | undefined {
  const schluessel = process.env['STRIPE_SECRET_KEY'];
  return schluessel !== undefined && schluessel !== '' ? schluessel : undefined;
}

/** Bestellung freigeschaltet? Nur wenn der Zahlungsanbieter konfiguriert ist. */
export function bestellungAktiv(): boolean {
  return stripeSchluessel() !== undefined;
}

export function stripeClient(): Stripe {
  const schluessel = stripeSchluessel();
  if (schluessel === undefined) {
    throw new Error('STRIPE_SECRET_KEY fehlt – Bestellung nicht freigeschaltet.');
  }
  return new Stripe(schluessel);
}

export function basisUrl(): string {
  const konfiguriert = process.env['NEXT_PUBLIC_BASIS_URL'];
  if (konfiguriert !== undefined && konfiguriert !== '') {
    return konfiguriert.replace(/\/+$/, '');
  }
  // Vercel ohne gesetzte Variable: in Production die Produktionsdomain, in Preview die
  // Adresse der jeweiligen Bereitstellung (nie die Produktion) – sonst landet die Kundin
  // nach der Zahlung auf localhost.
  const vercel =
    process.env['VERCEL_ENV'] === 'production'
      ? (process.env['VERCEL_PROJECT_PRODUCTION_URL'] ?? process.env['VERCEL_URL'])
      : process.env['VERCEL_URL'];
  if (vercel !== undefined && vercel !== '') {
    return `https://${vercel}`;
  }
  return 'http://localhost:3000';
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Bestellnummer RR-<Jahr>-<6 Zeichen>; die Rechnungsnummer vergibt Stripe fortlaufend. */
export function neueBestellnummer(jetzt: Date = new Date()): string {
  const bytes = randomBytes(6);
  let kennung = '';
  for (const b of bytes) {
    kennung += ALPHABET[b % ALPHABET.length];
  }
  return `RR-${jetzt.getFullYear()}-${kennung}`;
}

/**
 * Stripe-Kennungen der Zahlungsarten (Prompt 12, Abschnitt 2: Karte, SEPA,
 * PayPal, Klarna – soweit im Stripe-Dashboard aktiviert). SEPA ist eine
 * asynchrone Zahlungsart; die Auslieferung läuft über die bereits
 * abonnierten Ereignisse checkout.session.async_payment_succeeded/failed.
 */
export function zahlungsarten(): Stripe.Checkout.SessionCreateParams.PaymentMethodType[] {
  const roh = process.env['STRIPE_ZAHLUNGSARTEN'] ?? 'card,sepa_debit,paypal,klarna';
  return roh
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s !== '') as Stripe.Checkout.SessionCreateParams.PaymentMethodType[];
}

export interface CheckoutAnfrage {
  draft: CaseDraft;
  name: string;
  email: string;
  /** Gedruckte Fassung per Post (kostenlos, Prompt 14, 0.3). */
  postversand?: boolean;
}

export interface CheckoutErgebnis {
  url: string;
  bestellnummer: string;
}

/** Produktbeschreibung für Kasse und Rechnung – ohne Sachverständigen-Anklang (Prompt 14, 0.6). */
export const PRODUKT_BESCHREIBUNG =
  'Automatisierte versicherungsmathematische Auswertung zu einer Lebens- oder Rentenversicherung (PDF, Schätzung mit Bandbreite)';

export async function erstelleCheckoutSitzung(anfrage: CheckoutAnfrage, stripe: Stripe = stripeClient()): Promise<CheckoutErgebnis> {
  const bestellnummer = neueBestellnummer();
  const steuersatz = process.env['STRIPE_STEUERSATZ_ID'];
  const post = anfrage.postversand === true;
  const metadata: Record<string, string> = {
    bestellnummer,
    kundenname: anfrage.name.trim().slice(0, 200),
    produkt: BRAND.produktname,
    post: post ? '1' : '0',
    ...fallAlsMetadaten(anfrage.draft),
  };
  const sitzung = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: zahlungsarten(),
    locale: 'de',
    customer_email: anfrage.email.trim(),
    customer_creation: 'always',
    billing_address_collection: 'required',
    line_items: [
      {
        quantity: 1,
        ...(steuersatz !== undefined && steuersatz !== '' ? { tax_rates: [steuersatz] } : {}),
        price_data: {
          currency: 'eur',
          unit_amount: Math.round(BERICHT_PREIS_BRUTTO_EUR * 100),
          tax_behavior: 'inclusive',
          product_data: {
            name: BRAND.produktname,
            description: `${PRODUKT_BESCHREIBUNG}${post ? ', zusätzlich gedruckt per Post (kostenlos)' : ''}`,
          },
        },
      },
    ],
    invoice_creation: {
      enabled: true,
      invoice_data: {
        description: `${BRAND.produktname}, Bestellnummer ${bestellnummer} – Lieferung per E-Mail${post ? ' und per Post' : ''}`,
        footer: `${BRAND.anbieter}${BRAND.anbieterRegister !== '' ? `, ${BRAND.anbieterRegister}` : ''}. Leistungsdatum entspricht dem Rechnungsdatum.`,
        metadata: { bestellnummer },
        rendering_options: { amount_tax_display: 'include_inclusive_tax' },
      },
    },
    payment_intent_data: {
      description: `${BRAND.produktname} ${bestellnummer}`,
      metadata: { bestellnummer, ...(post ? { post_status: 'gewuenscht' } : {}) },
    },
    metadata,
    success_url: `${basisUrl()}/bestellen/danke?sitzung={CHECKOUT_SESSION_ID}`,
    cancel_url: `${basisUrl()}/bestellen?abgebrochen=1`,
  });
  if (sitzung.url === null || sitzung.url === undefined) {
    throw new Error('Stripe lieferte keine Weiterleitungsadresse.');
  }
  return { url: sitzung.url, bestellnummer };
}
