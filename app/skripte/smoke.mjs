#!/usr/bin/env node
/**
 * Smoke-Test gegen den Produktions-Build (vite preview):
 * Demo-Modus, alle Tabs, kompletter Moment-Flow (Eis → gestresst → Trost →
 * Alternative), Warten-Timer mit Demo-Raffer, Krisen-Check, Neuladen-Test.
 * Screenshots landen in skripte/shots/.
 */
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const BASIS = process.env.BASIS ?? 'http://localhost:4173';
const SHOTS = new URL('./shots/', import.meta.url).pathname;
mkdirSync(SHOTS, { recursive: true });

const fehler = [];
let nr = 0;

const browser = await puppeteer.launch({
  executablePath: '/opt/pw-browsers/chromium',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
});
const page = await browser.newPage();
await page.setViewport({ width: 430, height: 900 });
page.on('pageerror', (e) => fehler.push('pageerror: ' + e.message));
page.on('console', (m) => {
  if (m.type() !== 'error') return;
  const url = m.location()?.url ?? '';
  const extern = url.includes('googleapis') || url.includes('gstatic');
  const ressource = m.text().startsWith('Failed to load resource');
  if (!extern && !ressource) fehler.push('console: ' + m.text());
});
page.on('requestfailed', (r) => {
  const url = r.url();
  if (!url.includes('googleapis') && !url.includes('gstatic')) {
    fehler.push('request: ' + url + ' — ' + (r.failure()?.errorText ?? ''));
  }
});

async function shot(name) {
  nr += 1;
  await page.screenshot({ path: `${SHOTS}${String(nr).padStart(2, '0')}-${name}.png` });
}
async function klickText(text, selektor = 'button') {
  await page.waitForFunction(
    (t, s) => [...document.querySelectorAll(s)].some((b) => b.textContent.trim().includes(t)),
    { timeout: 8000 },
    text, selektor,
  );
  await page.evaluate(
    (t, s) => [...document.querySelectorAll(s)].find((b) => b.textContent.trim().includes(t)).click(),
    text, selektor,
  );
}
async function erwarteText(text, timeout = 8000) {
  await page.waitForFunction(
    (t) => document.body.textContent.includes(t),
    { timeout },
    text,
  );
}

/* 1 · Demo-Modus laden */
await page.goto(`${BASIS}/?demo=1`, { waitUntil: 'networkidle2' });
await erwarteText('Innehalten');
await shot('home');

/* 2 · Kompass */
await klickText('Kompass');
await erwarteText('Körperliche Gesundheit');
await shot('kompass');

/* 3 · Rückblick: Reflexion, Trends, Einsichten */
await klickText('Rückblick');
await erwarteText('Momente');
await shot('rueckblick-reflexion');
await klickText('Trends');
await erwarteText('Wochenpunkte');
await shot('rueckblick-trends');
await klickText('Einsichten');
await shot('rueckblick-einsichten');

/* 4 · Einstellungen */
await klickText('Einstellungen');
await erwarteText('Deine Daten');
await shot('einstellungen');

/* 5 · Moment-Flow über Texteingabe: „ich will jetzt ein eis“ */
await klickText('Heute');
const flowStart = Date.now();
await page.type('.eingabe', 'ich will jetzt ein eis');
await page.keyboard.press('Enter');
await erwarteText('30 Sekunden hinschauen');
await shot('moment-ankommen');
await klickText('Weiter');
await erwarteText('Was ist gerade da?');
await shot('moment-gefuehl');
await klickText('gestresst');
await klickText('mittel');
await erwarteText('Wonach ruft');
await shot('moment-beduerfnis');
await klickText('Trost');
await erwarteText('Was ist jetzt gut für dich?');
await erwarteText('10 % Körperfett');
await shot('moment-entscheidung');
await page.evaluate(() => [...document.querySelectorAll('.alt-zeile')][0].click());
await erwarteText('Innegehalten');
const flowDauer = (Date.now() - flowStart) / 1000;
await erwarteText('+1 Achtsamkeit');
await erwarteText('+1 Kompass');
await shot('moment-abschluss');
await klickText('Fertig');

/* 6 · Warten-Timer mit Demo-Raffer */
await klickText('Süßes');
await klickText('Weiter');
await klickText('gestresst');
await klickText('mittel');
await klickText('Belohnung');
await klickText('10 Minuten warten');
await erwarteText('Der Impuls darf bleiben.');
await shot('moment-timer');
await klickText('Demo: ×60');
await erwarteText('Noch da?', 20000);
await shot('moment-nochda');
await klickText('Hat sich gelegt');
await erwarteText('Innegehalten');
await klickText('Fertig');

/* 7 · Krisen-Check */
await page.type('.eingabe', 'ich will nicht mehr leben');
await page.keyboard.press('Enter');
await erwarteText('Telefonseelsorge');
await erwarteText('0800 111 0 111');
await new Promise((r) => setTimeout(r, 400)); // Einblend-Animation ausklingen lassen
await shot('krise');
await klickText('zurück');

/* 8 · Neuladen: Daten überleben (Akzeptanzkriterium) */
await page.goto(BASIS, { waitUntil: 'networkidle2' });
await erwarteText('Momente');
await shot('nach-neuladen');

/* 9 · Dark Mode (warm): System-Präferenz dunkel */
await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
await page.reload({ waitUntil: 'networkidle2' });
await erwarteText('Innehalten');
await shot('home-dunkel');

await browser.close();

console.log(`Moment-Flow aktiv bedient in ${flowDauer.toFixed(1)} s (Budget: 90 s).`);
if (flowDauer > 90) fehler.push(`Flow zu lang: ${flowDauer}s`);
if (fehler.length) {
  console.error('SMOKE-TEST FEHLER:');
  for (const f of fehler) console.error(' - ' + f);
  process.exit(1);
}
console.log(`Smoke-Test bestanden — ${nr} Screenshots in skripte/shots/.`);
