/**
 * HTML → PDF über Playwright (Chromium). Kopfzeile: Aktenzeichen, Name,
 * Datum; Fußzeile: Marke und „Seite x von y".
 *
 * Hinweis PDF/A-2b: Chromium erzeugt kein PDF/A; die Konvertierung ist als
 * offener Punkt dokumentiert (docs/STATUS.md, docs/ASSUMPTIONS.md).
 */
import { existsSync, readdirSync } from 'node:fs';
import { chromium } from 'playwright-core';

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
  const browser = await chromium.launch({
    executablePath: findeChromium(),
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'],
  });
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
