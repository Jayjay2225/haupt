# Bereitstellung bei Vercel (Stand 21.09.2026)

Die Website (`apps/web`) ist eine Next.js-Anwendung mit Server-Funktionen (Ampel-Berechnung, Stripe-Bestellung, Webhook mit PDF-Erzeugung). Sie läuft **nicht** auf klassischem Webspace, sondern bei Vercel; `renten-rettung.de` bleibt bei united-domains und zeigt per DNS auf Vercel (Mail-Einträge unverändert – siehe `docs/DOMAIN-UMZUG.md`).

## 1. Projekt anlegen (einmalig, im Browser)

1. Bei [vercel.com](https://vercel.com) mit dem GitHub-Konto anmelden, das Zugriff auf `Jayjay2225/haupt` hat.
2. „Add New… → Project“ → Repository `haupt` importieren.
3. Einstellungen beim Import:
   - **Root Directory:** `apps/web` (wichtig – Vercel erkennt dann den pnpm-Workspace und installiert im Repo-Stamm).
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

   Nicht setzen: `CHROMIUM_PATH`, `AUSLIEFERUNG_VERZEICHNIS` (auf Vercel automatisch: gepacktes Chromium, `/tmp`).
5. „Deploy“. Nach dem Build gibt es eine Vorschauadresse `https://<projekt>.vercel.app` – damit Schritt 3 und 4 testen.

Jeder weitere Push auf den Production-Branch löst automatisch eine neue Bereitstellung aus; kein Hochladen von Hand.

## 2. Was auf Vercel anders läuft (bereits im Code berücksichtigt)

- **Chromium:** kein installierter Browser; `@sparticuz/chromium` wird beim ersten Aufruf nach `/tmp` entpackt (Kaltstart einige Sekunden). Der Webhook hat dafür `maxDuration = 60`. Regionsvorgabe `fra1` (Frankfurt) in `apps/web/vercel.json`.
- **Dateisystem:** nur `/tmp`, nur für die Dauer eines Aufrufs. Der Bestellstatus liegt deshalb zusätzlich als Markierung `ausgeliefert_am` in den Metadaten der Stripe-Zahlung; wiederholte Webhook-Zustellungen erzeugen so keinen zweiten Bericht. Berichte werden nicht dauerhaft abgelegt – bei Bedarf werden sie aus den Falldaten der Zahlungssitzung neu gerechnet (deterministisch, gleiche Versionen).
- **Ratenbegrenzung** gilt je Funktionsinstanz (weich). Für eine harte Grenze später ein gemeinsamer Speicher.
- **Basic-Auth-Middleware** läuft am Vercel-Edge.

## 3. Stripe-Webhook einrichten

Im Stripe-Dashboard → Entwickler → Webhooks → Endpunkt hinzufügen:
- URL: `https://renten-rettung.de/api/stripe/webhook` (zum Testen zunächst die `vercel.app`-Adresse).
- Ereignisse: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`.
- Den angezeigten Signaturschlüssel (`whsec_…`) als `STRIPE_WEBHOOK_SECRET` bei Vercel eintragen und neu bereitstellen.
- Außerdem im Dashboard: PayPal und Klarna als Zahlungsmethoden aktivieren; Steuersatz 19 % inklusiv anlegen; Rechnungsangaben (Firma, Anschrift, USt-IdNr. DE815896163) hinterlegen.

Testlauf: Bestellung mit Stripe-Testkarte `4242 4242 4242 4242` – Vertragsbestätigung, Bericht (PDF) und Rechnungslink müssen per E-Mail ankommen (bzw. im Protokoll-Modus in den Vercel-Logs erscheinen).

## 4. Domain umstellen (bei united-domains)

Erst nach erfolgreichem Test unter der Vorschauadresse und nach `docs/DOMAIN-UMZUG.md` Abschnitt 0–1 (Sicherung, `/einkehr`, Mail-Einträge notieren):

1. Bei Vercel → Projekt → Settings → Domains: `renten-rettung.de` und `www.renten-rettung.de` hinzufügen. Vercel zeigt die nötigen DNS-Werte an.
2. Bei united-domains **nur** die Web-Einträge ändern:
   - `renten-rettung.de` (`@`): A-Eintrag auf die von Vercel angezeigte IP (derzeit dokumentiert `76.76.21.21`).
   - `www`: CNAME auf `cname.vercel-dns.com`.
   - Vorhandene A/AAAA/CNAME für `@` und `www` ersetzen; **MX, SPF/TXT, DKIM, DMARC und alle anderen Einträge unverändert lassen**.
3. Warten, bis Vercel „Valid Configuration“ meldet; TLS-Zertifikat stellt Vercel automatisch aus.
4. Prüfen: `https://renten-rettung.de` lädt die neue Seite (mit Beta-Passwort), `info@renten-rettung.de` sendet und empfängt weiterhin.

## 5. Go-live

Wenn alle Punkte aus `docs/DOMAIN-UMZUG.md` Abschnitt 4 abgehakt sind: `BETA_PASSWORT` löschen, `NEXT_PUBLIC_INDEXIERUNG=1` setzen, Stripe auf Live-Schlüssel umstellen (auch den Webhook-Endpunkt im Live-Modus anlegen), neu bereitstellen.
