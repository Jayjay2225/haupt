import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { KontaktAdresse } from '@/components/KontaktAdresse';
import { BRAND } from '@/config/brand';

export const metadata: Metadata = {
  title: 'Für Unternehmer',
};

/**
 * Brückenseite (Prompt 8, Aufgabe 2): Der Geschäftsführer-Bereich
 * (Pensionszusage, Rückdeckungsversicherung) zieht auf eine eigene Domain.
 * Bis die Domain registriert ist, steht hier der Platzhalter.
 */
export default function UnternehmerSeite() {
  if (BRAND.b2bDomain === '') {
    notFound();
  }
  const domainSteht = !BRAND.b2bDomain.startsWith('[[');
  return (
    <div className="container schmal abschnitt">
      <h1>Für Unternehmer: Pensionszusage prüfen.</h1>
      <p className="untertitel">
        Pensionszusage, Rückdeckungsversicherung, Bilanz – das ist ein anderes Thema als die
        private Police. Dafür gibt es eine eigene Seite.
      </p>
      {domainSteht ? (
        <p>
          <a className="knopf haupt" href={`https://${BRAND.b2bDomain}`}>
            Zur Unternehmerseite
          </a>
        </p>
      ) : (
        <div className="hinweis">
          <p>
            Die Unternehmerseite zieht gerade auf ihre eigene Adresse um: <strong>{BRAND.b2bDomain}</strong>.
            Sobald die Domain steht, führt dieser Knopf dorthin. Bis dahin erreichen Sie uns unter{' '}
            <KontaktAdresse adresse={BRAND.kontaktEmail} />.
          </p>
        </div>
      )}
      <p className="erklaerung">
        {BRAND.name} bleibt die Seite für Privatkunden mit dem {BRAND.produktname}.
      </p>
    </div>
  );
}
