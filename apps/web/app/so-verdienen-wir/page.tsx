import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BRAND } from '@/config/brand';
import { BERICHT_PREIS_BRUTTO_EUR, BERICHT_PREIS_HINWEIS } from '@/config/business';
import { VARIANTE } from '@/config/variante';

export const metadata: Metadata = {
  title: 'So verdienen wir',
};

/** Drei Absätze à zwei Sätze (Prompt 12, Abschnitt 3.5). */
export default function SoVerdienenWirSeite() {
  if (!VARIANTE.transparenzKasten) {
    notFound();
  }
  return (
    <div className="container schmal abschnitt">
      <h1>So verdienen wir.</h1>

      <h2>Am Bericht</h2>
      <p>
        Der Prüfbericht kostet {BERICHT_PREIS_BRUTTO_EUR} € einmalig, {BERICHT_PREIS_HINWEIS}. Die
        Ampel davor kostet nichts – und bleibt kostenlos, auch wenn sie Rot zeigt.
      </p>

      <h2>Am Verkauf</h2>
      <p>
        Wenn Sie Ihre Police über uns verkaufen, erhalten wir vom Organisationspartner eine
        Vergütung. Weitergegeben wird nur mit Ihrem eigenen, nicht vorangekreuzten Ja.
      </p>

      <h2>Nicht an Ihrer Klage</h2>
      <p>
        Wir verdienen nichts daran, ob Sie klagen. Deshalb können wir Ihnen auch ehrlich sagen,
        wenn sich Ihr Vertrag rechnerisch nicht lohnt.
      </p>

      <p className="erklaerung">
        Anbieter: {BRAND.anbieter}. Einzelheiten in <Link href="/impressum">Impressum</Link> und{' '}
        <Link href="/datenschutz">Datenschutzerklärung</Link>.
      </p>
      <p>
        <Link href="/rechner" className="knopf haupt">
          Jetzt prüfen
        </Link>
      </p>
    </div>
  );
}
