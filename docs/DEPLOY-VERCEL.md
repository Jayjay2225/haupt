# Bereitstellung bei Vercel (Stand 21.09.2026)

Die Website (`apps/web`) ist eine Next.js-Anwendung mit Server-Funktionen (Ampel-Berechnung, Stripe-Bestellung, Webhook mit PDF-Erzeugung). Sie läuft **nicht** auf klassischem Webspace, sondern bei Vercel; `renten-rettung.de` bleibt bei united-domains und zeigt per DNS auf Vercel (Mail-Einträge unverändert – siehe `docs/DOMAIN-UMZUG.md`).

## 1. Projekt anlegen (einmalig, im Browser)

1. Bei [vercel.com](https://vercel.com) mit dem GitHub-Konto anmelden, das Zugriff auf `Jayjay2225/haupt` hat.
2. „Add New… → Project“ → Repository `haupt` importieren.
3. Einstellungen beim Import:
   - **Root Directory:** `apps/web` (wichtig – ohne diese Angabe schlägt die Bereitstellung fehl, siehe Abschnitt 1a). Vercel erkennt dann den pnpm-Workspace und installiert im Repo-Stamm; das Häkchen „Include source files outside of the Root Directory in the Build Step“ bleibt gesetzt, weil die Website `data/*.json` aus dem Repo-Stamm liest.
   - **Framework Preset:** Next.js (wird erkannt).
   - **Production Branch:** zunächst `claude/affectionate-brown-s1gjas` (bis der PR gemergt ist), danach `main`.
   - Build- und Install-Befehle: Standard lassen (`next build`, `pnpm install`).
4. **Environment Variables** eintragen (Werte aus `apps/web/.env.example`), jeweils für „Production“ und „Preview“:

   | Variable | Wert |
   |---|---|
   | `BETA_PASSWORT` | frei gewähltes Passwort (Beta-Schutz; zum Go-live löschen) |
   | `NEXT_PUBLIC_INDEXIERUNG` | leer lassen (noindex); zum Go-live `1` |
   | `NEXT_PUBLIC_BASIS_URL` | `https://renten-rettung.de` (Preview: die Vercel-Vorschauadresse) |
   | `STRIPE_SECRET_KEY` | aus dem Stripe-Dashboard (erst Testschlüssel `sk_test_…`, später `sk_live_…`) |
   | `STRIPE_WEBHOOK_SECRET` | aus Schritt 3 |
   | `STRIPE_STEUERSATZ_ID` | Steuersatz „Umsatzsteuer 19 %, inklusiv“ aus Stripe (`txr_…`) |
   | `RESEND_API_KEY` | vom E-Mail-Dienst (ohne Schlüssel: Protokoll-Modus, keine Mails) |
   | `MAIL_ABSENDER` | `Renten-Rettung <info@renten-rettung.de>` |
   | `ADMIN_PASSWORT` | frei gewähltes, langes Passwort – schützt die Freigabeliste `/admin` und dient als Schlüssel für manuelle Cron-Aufrufe (Abschnitt 4) |
   | `CRON_SECRET` | zufälliger Wert (z. B. `openssl rand -hex 24`); Vercel sendet ihn bei Cron-Aufrufen automatisch als `Authorization: Bearer …` mit |
   | `NEXT_PUBLIC_PARTNERKANZLEI` | Name und Ort der Partnerkanzlei – erst setzen, wenn entschieden; sonst zeigt „Warum über uns“ den Platzhalter |
   | `NEXT_PUBLIC_GEPRUEFTE_POLICEN` | Zahl geprüfter Policen – **nur mit Beleg** setzen, sonst leer lassen |
   | `NEXT_PUBLIC_PREIS_ANRECHNUNG` | `1` = Hinweis „89 € werden bei Übernahme angerechnet“ anzeigen (Entscheidung des Auftraggebers) |

   Nicht setzen: `CHROMIUM_PATH`, `AUSLIEFERUNG_VERZEICHNIS` (auf Vercel automatisch: gepacktes Chromium, `/tmp`).
5. „Deploy“. Nach dem Build gibt es eine Vorschauadresse `https://<projekt>.vercel.app` – damit Schritt 3 und 4 testen.

Jeder weitere Push auf den Production-Branch löst automatisch eine neue Bereitstellung aus; kein Hochladen von Hand.

## 1a. Wenn alle Bereitstellungen mit „Error“ enden

**Fehlerprotokoll lesen (immer zuerst):** Deployments → auf die fehlgeschlagene Zeile klicken → Abschnitt **„Building“** aufklappen. Die letzten roten Zeilen nennen den Grund.

Die häufigsten Ursachen und ihre Behebung:

| Meldung im Protokoll | Ursache | Behebung |
|---|---|---|
| `No Output Directory named "public" found` oder `No Next.js version detected` | **Root Directory nicht gesetzt** – Vercel baut im Repo-Stamm | Settings → Build and Deployment → **Root Directory = `apps/web`** → Save → neu bereitstellen |
| `Module not found: Can't resolve '../../../../../data/risk-defaults.json'` | Dateien außerhalb des Root Directory fehlen im Build | Settings → Build and Deployment → Häkchen **„Include source files outside of the Root Directory in the Build Step“** setzen |
| `ERR_PNPM_OUTDATED_LOCKFILE` | `pnpm-lock.yaml` passt nicht zu den `package.json` | im Repo `pnpm install` ausführen und die geänderte `pnpm-lock.yaml` committen |
| `Serverless Functions in multiple regions …Pro` | Regionsangabe im Hobby-Tarif | `"regions": ["fra1"]` aus `apps/web/vercel.json` entfernen und die Region stattdessen unter Settings → Functions wählen |
| `A Serverless Function has exceeded the unzipped maximum size of 250 MB` | Chromium-Paket zu groß | tritt bei diesem Projekt nicht auf (81 MB); sonst PDF-Erzeugung in einen eigenen Dienst auslagern |

**Nur ein Projekt behalten:** Wird dasselbe Repository in zwei Vercel-Projekten importiert, baut jeder Push doppelt und beide melden denselben Fehler. Überflüssiges Projekt entfernen: Projekt öffnen → Settings → ganz unten **Delete Project**.

**Neu bereitstellen nach einer Einstellungsänderung:** Deployments → beim obersten Eintrag auf **⋯ → Redeploy** (Haken bei „Use existing Build Cache“ entfernen).

Der Build ist am 21.09.2026 aus einem frischen Klon mit `pnpm install --frozen-lockfile` und `next build` in `apps/web` erfolgreich durchgelaufen – schlägt die Bereitstellung fehl, liegt es an den Projekteinstellungen, nicht am Code.

## 2. Was auf Vercel anders läuft (bereits im Code berücksichtigt)

- **Chromium:** kein installierter Browser; `@sparticuz/chromium` wird beim ersten Aufruf nach `/tmp` entpackt (Kaltstart einige Sekunden). Der Webhook hat dafür `maxDuration = 60`. Regionsvorgabe `fra1` (Frankfurt) in `apps/web/vercel.json`.
- **Dateisystem:** nur `/tmp`, nur für die Dauer eines Aufrufs. Der Bestellstatus liegt deshalb vollständig in den Metadaten der Stripe-Zahlung (Markierungen `erzeugt_am`, `freigegeben_am`, `ausgeliefert_am`, dazu Auffälligkeits-Kennzeichen und Lead-Status); wiederholte Webhook-Zustellungen oder Cron-Läufe erzeugen so keinen zweiten Versand. Berichte werden nicht dauerhaft abgelegt – bei Bedarf werden sie aus den Falldaten der Zahlungssitzung neu gerechnet (deterministisch, gleiche Versionen).
- **Ratenbegrenzung** gilt je Funktionsinstanz (weich). Für eine harte Grenze später ein gemeinsamer Speicher.
- **Basic-Auth-Middleware** läuft am Vercel-Edge.

## 3. Stripe-Webhook einrichten

Im Stripe-Dashboard → Entwickler → Webhooks → Endpunkt hinzufügen:
- URL: `https://renten-rettung.de/api/stripe/webhook` (zum Testen zunächst die `vercel.app`-Adresse).
- Ereignisse: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`.
- Den angezeigten Signaturschlüssel (`whsec_…`) als `STRIPE_WEBHOOK_SECRET` bei Vercel eintragen und neu bereitstellen.
- Außerdem im Dashboard: PayPal und Klarna als Zahlungsmethoden aktivieren; Steuersatz 19 % inklusiv anlegen; Rechnungsangaben (Firma, Anschrift, USt-IdNr. DE815896163) hinterlegen.

Testlauf: Bestellung mit Stripe-Testkarte `4242 4242 4242 4242` – die Vertragsbestätigung muss sofort ankommen (bzw. im Protokoll-Modus in den Vercel-Logs erscheinen); der Prüfbericht mit Rechnungslink folgt nach Freigabe unter `/admin` oder automatisch über den Cron (Abschnitt 4).

## 4. Zwölf-Stunden-Versand (Prompt 13): Cron und Freigabeliste

Seit Prompt 13 wird der Bericht **nicht mehr sofort** versendet. Der Webhook prüft die Zahlung, erzeugt den Bericht probeweise (Plausibilisierung) und setzt die Markierung `erzeugt_am` samt Auffälligkeits-Kennzeichen; versendet wird in einem zweiten Schritt – **spätestens 12 Stunden nach Zahlungseingang** (Zusage auf Website, Danke-Seite und in der Bestätigungs-Mail):

- **Freigabe von Hand:** `/admin?schluessel=<ADMIN_PASSWORT>` zeigt die bezahlten Bestellungen der letzten 30 Tage mit Kennzeichen (z. B. Fondsvertrag, Beginn vor 1994, hoher Branchenwert-Anteil). „Freigeben & senden“ verschickt den Bericht sofort. Dort auch: Lead-Status je Bestellung und CSV-Export.
- **Automatisch:** ohne Freigabe versendet `GET /api/auslieferung/cron` jede Bestellung, deren Erzeugung mindestens 10 Stunden zurückliegt (2 Stunden Puffer zur 12-Stunden-Zusage). Der Cron ist in `apps/web/vercel.json` **stündlich** eingeplant (`0 * * * *`) und akzeptiert zwei Berechtigungen: `Authorization: Bearer <CRON_SECRET>` (sendet Vercel bei eigenen Cron-Aufrufen automatisch mit, sobald die Variable gesetzt ist) oder `?schluessel=<ADMIN_PASSWORT>` für manuelle Aufrufe.

**Achtung, Vercel-Hobby-Tarif:** Cron-Jobs dürfen dort nur **einmal täglich** laufen – das reicht für die 12-Stunden-Zusage **nicht**. Zwei Auswege:

1. **Pro-Tarif**: stündliche Crons sind erlaubt, die vorhandene `vercel.json` genügt.
2. **Externer Zeitplaner** (z. B. cron-job.org oder ein beliebiger Uptime-Dienst): stündlich `https://renten-rettung.de/api/auslieferung/cron?schluessel=<ADMIN_PASSWORT>` aufrufen (GET). Dann den `crons`-Block aus `apps/web/vercel.json` entfernen oder den täglichen Vercel-Lauf als zusätzliche Absicherung stehen lassen.

Bis eine der beiden Lösungen steht, gilt: Bestellungen zeitnah unter `/admin` von Hand freigeben. Erstkunden-Codes (`EK-…`) sind vom 12-Stunden-Fenster ausgenommen und liefern weiterhin sofort aus.

## 5. Domain umstellen (bei united-domains)

Erst nach erfolgreichem Test unter der Vorschauadresse und nach `docs/DOMAIN-UMZUG.md` Abschnitt 0–1 (Sicherung, `/einkehr`, Mail-Einträge notieren):

1. Bei Vercel → Projekt → Settings → Domains: `renten-rettung.de` und `www.renten-rettung.de` hinzufügen. Vercel zeigt die nötigen DNS-Werte an.
2. Bei united-domains **nur** die Web-Einträge ändern:
   - `renten-rettung.de` (`@`): A-Eintrag auf die von Vercel angezeigte IP (derzeit dokumentiert `76.76.21.21`).
   - `www`: CNAME auf `cname.vercel-dns.com`.
   - Vorhandene A/AAAA/CNAME für `@` und `www` ersetzen; **MX, SPF/TXT, DKIM, DMARC und alle anderen Einträge unverändert lassen**.
3. Warten, bis Vercel „Valid Configuration“ meldet; TLS-Zertifikat stellt Vercel automatisch aus.
4. Prüfen: `https://renten-rettung.de` lädt die neue Seite (mit Beta-Passwort), `info@renten-rettung.de` sendet und empfängt weiterhin.

## 6. Go-live

Wenn alle Punkte aus `docs/DOMAIN-UMZUG.md` Abschnitt 4 abgehakt sind: `BETA_PASSWORT` löschen, `NEXT_PUBLIC_INDEXIERUNG=1` setzen, Stripe auf Live-Schlüssel umstellen (auch den Webhook-Endpunkt im Live-Modus anlegen), neu bereitstellen.
