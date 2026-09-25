/**
 * HTML → PDF über Playwright (Chromium). Kopfzeile: Aktenzeichen, Name,
 * Datum; Fußzeile: Marke und „Seite x von y".
 *
 * Hinweis PDF/A-2b: Chromium erzeugt kein PDF/A; die Konvertierung ist als
 * offener Punkt dokumentiert (docs/STATUS.md, docs/ASSUMPTIONS.md).
 */
import { existsSync, readdirSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { esc } from './format';

interface Start {
  executablePath: string;
  args: string[];
}

/**
 * Chromium-Start ermitteln: lokal ein installiertes Chromium (CHROMIUM_PATH,
 * Playwright-Verzeichnis); in Serverless-Umgebungen (Vercel/AWS Lambda,
 * erkennbar an VERCEL bzw. AWS_LAMBDA_FUNCTION_NAME) das gepackte Chromium
 * aus @sparticuz/chromium, das dort erst zur Laufzeit nach /tmp entpackt wird.
 */
async function chromiumStart(): Promise<Start> {
  const serverless = process.env['VERCEL'] !== undefined || process.env['AWS_LAMBDA_FUNCTION_NAME'] !== undefined;
  if (serverless && process.env['CHROMIUM_PATH'] === undefined) {
    const paket = await import('@sparticuz/chromium');
    return { executablePath: await paket.default.executablePath(), args: [...paket.default.args, '--font-render-hinting=none'] };
  }
  return { executablePath: findeChromium(), args: ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'] };
}

function findeChromium(): string {
  const kandidaten: string[] = [];
  if (process.env['CHROMIUM_PATH'] !== undefined) {
    kandidaten.push(process.env['CHROMIUM_PATH']);
  }
  kandidaten.push('/opt/pw-browsers/chromium');
  try {
    for (const eintrag of readdirSync('/opt/pw-browsers')) {
      if (eintrag.startsWith('chromium-')) {
        kandidaten.push(`/opt/pw-browsers/${eintrag}/chrome-linux/chrome`);
      }
    }
  } catch {
    // Verzeichnis existiert nicht – unten klarer Fehler.
  }
  for (const kandidat of kandidaten) {
    if (existsSync(kandidat)) {
      return kandidat;
    }
  }
  throw new Error(
    `Kein Chromium gefunden (geprüft: ${kandidaten.join(', ')}). CHROMIUM_PATH setzen oder Playwright-Browser installieren.`,
  );
}

export interface KopfzeilenDaten {
  marke: string;
  aktenzeichen: string;
  kundenname: string;
  datum: string; // bereits formatiert (TT.MM.JJJJ)
}

export async function htmlZuPdf(html: string, pfad: string, kopf: KopfzeilenDaten): Promise<void> {
  const start = await chromiumStart();
  const browser = await chromium.launch({ executablePath: start.executablePath, args: start.args });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    // Design B (Prompt 12, 4.5): Kopf- und Fußzeile in gedeckten Token-Farben.
    // Chromium rendert Header/Footer in eigenem Kontext ohne die eingebetteten
    // Schriften; deshalb Systemschrift, Marke fett.
    const stil = 'font-size:8px;color:#5B6772;width:100%;padding:0 14mm;font-family:system-ui,Arial,sans-serif;';
    await page.pdf({
      path: pfad,
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `<div style="${stil}display:flex;justify-content:space-between;border-bottom:1px solid #DDE4E6;padding-bottom:2px;">
          <span style="color:#14365D;font-weight:700;">${esc(kopf.marke)}</span>
          <span>${esc(kopf.aktenzeichen)} · ${esc(kopf.kundenname)} · ${esc(kopf.datum)}</span>
        </div>`,
      footerTemplate: `<div style="${stil}display:flex;justify-content:space-between;">
          <span>${esc(kopf.marke)} – Prüfbericht (Schätzung mit Bandbreite, keine Rechtsberatung)</span>
          <span>Seite <span class="pageNumber"></span> von <span class="totalPages"></span></span>
        </div>`,
      margin: { top: '18mm', bottom: '16mm', left: '14mm', right: '14mm' },
    });
  } finally {
    await browser.close();
  }
}
