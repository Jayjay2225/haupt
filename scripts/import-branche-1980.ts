/**
 * Prompt 12, Abschnitt 1.5: Branchendaten zurück bis 1980.
 *
 * Trägt in data/insurers.json ein (nur fehlende Jahre, vorhandene Werte
 * bleiben unangetastet):
 * 1. Branchendurchschnitt Nettoverzinsung 1980/1985/1990–1998 aus den
 *    GDV-Primärpublikationen „Geschäftsentwicklung … – Die deutsche
 *    Lebensversicherung in Zahlen“ (DNB-Archiv-PDFs, kreuzgeprüft über
 *    mehrere Ausgaben; Recherche 25.09.2026).
 *    1981–1984 und 1986–1989 sind in keiner zugänglichen GDV-/BAV-Quelle
 *    jahrgenau ausgewiesen (5-Jahres-Raster) → bewusste Lücke, der
 *    Rechenkern überbrückt sie gekennzeichnet (estimated_branch).
 * 2. Referenz-Einlagenzins 1980–2002: Bundesbank-Habenzinsen „Spareinlagen
 *    mit dreimonatiger Kündigungsfrist“ (Spareckzins, SU0022; heutiger
 *    SDMX-Schlüssel BBIB1.M.DE.B.H.DNB.SPM.K3M.A.N1.11A), Jahresmittel aus
 *    Monatswerten (Rohdaten: data/raw/bundesbank/su0022_bbib1.csv).
 *
 * Aufruf: pnpm data:branche1980
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ABRUF = '2026-09-25';

const GDV_DNB = {
  a2001: 'http://d-nb.info/1213842107/34',
  a2002: 'http://d-nb.info/1213842034/34',
};

interface Quelle {
  typ: 'primary' | 'secondary' | 'estimate';
  titel: string;
  url?: string;
  dokument?: string;
  fundstelle?: string;
  abrufdatum?: string;
  hinweis?: string;
}

interface Kennzahl {
  wert: number;
  einheit: '%';
  quelle: Quelle;
  confidence: 'high' | 'medium' | 'low';
}

function gdvQuelle(jahr: number, wert: string, extra?: string): Quelle {
  return {
    typ: 'primary',
    titel: 'GDV, Geschäftsentwicklung 2000 – Die deutsche Lebensversicherung in Zahlen (Ausgabe 2001)',
    url: GDV_DNB.a2001,
    dokument: 'DNB-Archivexemplar (PDF)',
    fundstelle: `Tabelle „Nettoverzinsung der Kapitalanlagen 1980 bis 2000“, Druckseite 25 (PDF-S. 20), Zeile „${jahr} | ${wert}“; kreuzgeprüft mit den Ausgaben 2002–2004 (${GDV_DNB.a2002} u. a.) und „LV in Zahlen 2021“ (gdv.de), identische Werte.${extra ?? ''}`,
    abrufdatum: ABRUF,
  };
}

/** Nettoverzinsung Branche (GDV), nur Jahre, die in insurers.json fehlen. */
const NETTOVERZINSUNG_NEU: Record<string, Kennzahl> = {
  '1980': { wert: 6.71, einheit: '%', quelle: gdvQuelle(1980, '6,71'), confidence: 'high' },
  '1985': { wert: 8.12, einheit: '%', quelle: gdvQuelle(1985, '8,12'), confidence: 'high' },
  '1990': { wert: 6.78, einheit: '%', quelle: gdvQuelle(1990, '6,78'), confidence: 'high' },
  '1991': { wert: 7.44, einheit: '%', quelle: gdvQuelle(1991, '7,44'), confidence: 'high' },
  '1992': { wert: 7.39, einheit: '%', quelle: gdvQuelle(1992, '7,39'), confidence: 'high' },
  '1993': { wert: 7.59, einheit: '%', quelle: gdvQuelle(1993, '7,59'), confidence: 'high' },
  '1994': { wert: 7.15, einheit: '%', quelle: gdvQuelle(1994, '7,15'), confidence: 'high' },
  '1996': { wert: 7.37, einheit: '%', quelle: gdvQuelle(1996, '7,37'), confidence: 'high' },
  '1997': {
    wert: 7.46,
    einheit: '%',
    quelle: gdvQuelle(1997, '7,46', ' Fußnote 1 im Original: Bestandsübertragung zum 01.01.1998, 1997er Vergleichswerte angepasst.'),
    confidence: 'high',
  },
  '1998': {
    wert: 7.57,
    einheit: '%',
    quelle: gdvQuelle(1998, '7,57', ' Fußnote 1 im Original: Bestandsübertragung zum 01.01.1998.'),
    confidence: 'high',
  },
};

/**
 * Bewusste Lücken (Prinzip 1: lieber Lücke als geratener Wert):
 * 1981–1984 und 1986–1989 – in allen zugänglichen GDV-/BAV-Publikationen nur
 * im 5-Jahres-Raster; offene Spuren in data/DATA_REPORT.md.
 */
export const NETTOVERZINSUNG_LUECKEN = [1981, 1982, 1983, 1984, 1986, 1987, 1988, 1989];

/** Spareckzins (SU0022) – Jahresmittel aus Monatswerten, selbst aggregiert. */
const SPARECKZINS: Record<number, number> = {
  1980: 4.64, 1981: 4.92, 1982: 4.85, 1983: 3.26, 1984: 3.01, 1985: 2.88, 1986: 2.5,
  1987: 2.11, 1988: 2.01, 1989: 2.43, 1990: 2.81, 1991: 2.82, 1992: 2.81, 1993: 2.54,
  1994: 2.1, 1995: 2.04, 1996: 1.99, 1997: 1.71, 1998: 1.56, 1999: 1.31, 2000: 1.25,
  2001: 1.19, 2002: 1.02,
};

const SPARECKZINS_QUELLE: Quelle = {
  typ: 'primary',
  titel:
    'Deutsche Bundesbank, Habenzinsen Banken: Spareinlagen mit dreimonatiger Kündigungsfrist, Durchschnittssatz („Spareckzins“, SU0022; bis 06/1993 Spareinlagen mit gesetzlicher Kündigungsfrist)',
  url: 'https://api.statistiken.bundesbank.de/rest/download/BBIB1/M.DE.B.H.DNB.SPM.K3M.A.N1.11A?format=csv&lang=de',
  dokument: 'Zeitreihe BBIB1.M.DE.B.H.DNB.SPM.K3M.A.N1.11A (Rohdaten: data/raw/bundesbank/su0022_bbib1.csv)',
  fundstelle:
    'Jahresmittel = ungewichtetes arithmetisches Mittel der 12 Monatswerte je Kalenderjahr, selbst aggregiert; Stichproben (1981, 1987, 1988) gegen die Bundesbank-Tabelle „Zinssätze für Spareinlagen mit dreimonatiger Kündigungsfrist“ (bundesbank.de, Blob 615016, Stand 02.09.2026) nachgerechnet',
  abrufdatum: ABRUF,
  hinweis:
    'Konservative Habenzins-Reihe (nur Mindest-/Grundverzinsung); Verkettung: alte Zinsstatistik bis 06/2003, MFI-Statistik ab 01/2003 (vorhandene Einträge ab 2003 unverändert).',
};

function main(): void {
  const pfad = resolve(import.meta.dirname, '../data/insurers.json');
  const daten = JSON.parse(readFileSync(pfad, 'utf8'));

  let neueNetto = 0;
  for (const [jahr, kennzahl] of Object.entries(NETTOVERZINSUNG_NEU)) {
    if (daten.branchendurchschnitt.nettoverzinsung[jahr] === undefined) {
      daten.branchendurchschnitt.nettoverzinsung[jahr] = kennzahl;
      neueNetto += 1;
    }
  }

  const vorhandeneJahre = new Set(
    (daten.referenzzinsen.einlagenzins.werte as { gueltigAb: string }[]).map((e) => e.gueltigAb.slice(0, 4)),
  );
  let neueEinlagen = 0;
  const neueEintraege = Object.entries(SPARECKZINS)
    .filter(([jahr]) => !vorhandeneJahre.has(jahr))
    .map(([jahr, wert]) => ({ gueltigAb: `${jahr}-01-01`, wert, quelle: SPARECKZINS_QUELLE }));
  neueEinlagen = neueEintraege.length;
  daten.referenzzinsen.einlagenzins.werte = [...neueEintraege, ...daten.referenzzinsen.einlagenzins.werte].sort(
    (a: { gueltigAb: string }, b: { gueltigAb: string }) => a.gueltigAb.localeCompare(b.gueltigAb),
  );

  if (neueNetto > 0 || neueEinlagen > 0) {
    daten.data.version = '0.5.0';
    daten.data.stand = ABRUF;
  }
  writeFileSync(pfad, `${JSON.stringify(daten, null, 2)}\n`);
  console.log(
    `Nettoverzinsung: ${neueNetto} Jahre ergänzt (Lücken bewusst offen: ${NETTOVERZINSUNG_LUECKEN.join(', ')}).`,
  );
  console.log(`Einlagenzins: ${neueEinlagen} Jahresmittel 1980–2002 ergänzt. data.version ${daten.data.version}.`);
}

main();
