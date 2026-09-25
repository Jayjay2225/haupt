/**
 * Erzeugt das Berichtsvorschau-Bild der Startseite (Prompt 12, Abschnitt 3.1):
 * Seite 1 des ECHTEN Musterfall-Prüfberichts (BSP-2026-B) als PNG.
 * Voraussetzung: `pnpm --filter @rueckab/report beispiele` ist gelaufen.
 *
 * Aufruf: pnpm vorschau:bild
 */
import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';

const REPO = resolve(import.meta.dirname, '../../..');
const beispiele = resolve(REPO, 'examples');
const html = readdirSync(beispiele)
  .filter((d) => d.startsWith('Pruefbericht_BSP-2026-B') && d.endsWith('.html'))
  .sort()
  .pop();
if (html === undefined) {
  throw new Error('Kein Musterfall-HTML gefunden – erst `pnpm --filter @rueckab/report beispiele` laufen lassen.');
}

function findeChromium(): string {
  const kandidaten = [
    process.env['CHROMIUM_PFAD'] ?? '',
    '/opt/pw-browsers/chromium',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter((k) => k !== '');
  for (const k of kandidaten) {
    if (existsSync(k)) {
      return k;
    }
  }
  throw new Error('Chromium nicht gefunden (CHROMIUM_PFAD setzen).');
}

const browser = await chromium.launch({
  executablePath: findeChromium(),
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'],
});
try {
  const page = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 2 });
  await page.goto(`file://${resolve(beispiele, html)}`, { waitUntil: 'load' });
  // Nur Seite 1 (Deckblatt) – mit weißem Grund und A4-nahen Rändern.
  await page.addStyleTag({
    content: 'body{background:#fff;padding:14mm;} .seite{page-break-after:auto;} .seite:not(:first-of-type){display:none;}',
  });
  const ziel = resolve(REPO, 'apps/web/public/bericht-vorschau.png');
  await page.screenshot({ path: ziel, clip: { x: 0, y: 0, width: 794, height: 1123 } });
  console.log(`geschrieben: ${ziel} (aus examples/${html})`);
} finally {
  await browser.close();
}
