/**
 * HTML → PDF über Playwright (Chromium). Kopfzeile: Aktenzeichen, Name,
 * Datum; Fußzeile: Marke und „Seite x von y".
 *
 * Hinweis PDF/A-2b: Chromium erzeugt kein PDF/A; die Konvertierung ist als
 * offener Punkt dokumentiert (docs/STATUS.md, docs/ASSUMPTIONS.md).
 */
import { existsSync, readdirSync } from 'node:fs';
import { chromium } from 'playwright-core';

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
    const stil = 'font-size:8px;color:#4a5a66;width:100%;padding:0 14mm;font-family:system-ui,Arial,sans-serif;';
    await page.pdf({
      path: pfad,
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `<div style="${stil}display:flex;justify-content:space-between;">
          <span>${kopf.aktenzeichen} · ${kopf.kundenname}</span><span>${kopf.datum}</span>
        </div>`,
      footerTemplate: `<div style="${stil}display:flex;justify-content:space-between;">
          <span>${kopf.marke} – Kurzprüfung (Schätzung, keine Rechtsberatung)</span>
          <span>Seite <span class="pageNumber"></span> von <span class="totalPages"></span></span>
        </div>`,
      margin: { top: '18mm', bottom: '16mm', left: '14mm', right: '14mm' },
    });
  } finally {
    await browser.close();
  }
}
