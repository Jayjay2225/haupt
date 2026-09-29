# Bereitstellung bei Vercel (Stand 29.09.2026)

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
   | `RESEND_API_KEY` | vom E-Mail-Dienst – auf Vercel Pflicht (Production und Preview): ohne Schlüssel scheitert jeder Versand mit einer Fehlermeldung; der Protokoll-Modus (Datei statt Versand) gilt nur lokal |
   | `MAIL_ABSENDER` | `Renten-Rettung <info@renten-rettung.de>` |
   | `ADMIN_PASSWORT` | frei gewähltes, langes Passwort – Anmeldung an der Freigabeliste `/admin` (Formular, HttpOnly-Sitzungs-Cookie für 12 Stunden); der angemeldete Browser darf auch den Cron von Hand anstoßen (Abschnitt 4). Das Passwort steht nie in einer URL |
   | `CRON_SECRET` | zufälliger Wert (z. B. `openssl rand -hex 24`); Vercel sendet ihn bei Cron-Aufrufen automatisch als `Authorization: Bearer …` mit |
   | `NEXT_PUBLIC_PARTNERKANZLEI` | Name und Ort der Partnerkanzlei – erst setzen, wenn entschieden; sonst zeigt „Warum über uns“ den Platzhalter |
   | `NEXT_PUBLIC_GEPRUEFTE_POLICEN` | Zahl geprüfter Policen – **nur mit Beleg** setzen, sonst leer lassen |
   | `NEXT_PUBLIC_PREIS_ANRECHNUNG` | `1` = Preisblock-Zeile „Bei Beauftragung angerechnet: dann 0 €.“ anzeigen (Entscheidung des Auftraggebers) |
   | `NEXT_PUBLIC_VIDEOCALL_URL` | Buchungsadresse für den kostenlosen 15-Minuten-Videocall (Prompt 14); leer = sichtbarer Platzhalter `[[VIDEOCALL-URL]]` |
   | `NEXT_PUBLIC_VIDEO_URL` / `NEXT_PUBLIC_VIDEO_POSTER` | selbst gehostetes Erklärvideo (MP4) und Posterbild; leer = Platzhalterrahmen (Drehbuch `docs/VIDEO.md`) |
   | `NEXT_PUBLIC_BILD_RUHESTAND` / `NEXT_PUBLIC_BILD_ENKEL` | Pfade der beiden Stimmungsbilder unter `public/bilder/` – **nur nach Lizenznachweis** in `docs/LIZENZEN.md`; leer = Platzhalterrahmen |
   | `NEXT_PUBLIC_PREISVERGLEICH_QUELLE` | Kennung des Belegs in `docs/QUELLEN.md` (z. B. `Q-01`) für den Vergleichssatz im Preisblock; leer = Satz entfällt |

   Nicht setzen oder leer lassen (leer zählt wie nicht gesetzt): `CHROMIUM_PATH`, `AUSLIEFERUNG_VERZEICHNIS` (auf Vercel automatisch: gepacktes Chromium, `/tmp`).
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
| `Serverless Functions in multiple regions …Pro` | Regionsangabe im Hobby-Tarif | erledigt – `"regions": ["fra1"]` ist aus `apps/web/vercel.json` entfernt; Region stattdessen unter Settings → Functions wählen |
| `Cron Jobs … Hobby plan` / Bereitstellung scheitert nach Hinzufügen des `crons`-Blocks | Cron-Zeitplan häufiger als einmal täglich im Hobby-Tarif | erledigt – `apps/web/vercel.json` steht auf `"0 6 * * *"` (einmal täglich); für Live siehe Abschnitt 4 |
| `A Serverless Function has exceeded the unzipped maximum size of 250 MB` | Chromium-Paket zu groß | tritt bei diesem Projekt nicht auf (81 MB); sonst PDF-Erzeugung in einen eigenen Dienst auslagern |

**Nur ein Projekt behalten:** Wird dasselbe Repository in zwei Vercel-Projekten importiert, baut jeder Push doppelt und beide melden denselben Fehler. Überflüssiges Projekt entfernen: Projekt öffnen → Settings → ganz unten **Delete Project**.

**Neu bereitstellen nach einer Einstellungsänderung:** Deployments → beim obersten Eintrag auf **⋯ → Redeploy** (Haken bei „Use existing Build Cache“ entfernen).

Der Build ist am 21.09.2026 aus einem frischen Klon mit `pnpm install --frozen-lockfile` und `next build` in `apps/web` erfolgreich durchgelaufen – schlägt die Bereitstellung fehl, liegt es an den Projekteinstellungen, nicht am Code.

## 2. Was auf Vercel anders läuft (bereits im Code berücksichtigt)

- **Chromium:** kein installierter Browser; `@sparticuz/chromium` wird beim ersten Aufruf nach `/tmp` entpackt (Kaltstart einige Sekunden). Der Webhook hat dafür `maxDuration = 60`. Keine feste Regionsvorgabe mehr in `apps/web/vercel.json` (Hobby-Tarif erlaubt das nicht) – Region bei Bedarf unter Settings → Functions wählen.
- **Dateisystem:** nur `/tmp`, nur für die Dauer eines Aufrufs. Der Bestellstatus liegt deshalb vollständig in den Metadaten der Stripe-Zahlung (Markierungen `erzeugt_am`, `freigegeben_am`, `ausgeliefert_am`, dazu Auffälligkeits-Kennzeichen, Lead-Status und seit Prompt 14 der Post-Stand `post_status`/`post_am`); wiederholte Webhook-Zustellungen oder Cron-Läufe erzeugen so keinen zweiten Versand. Gutachten werden nicht dauerhaft abgelegt – bei Bedarf werden sie aus den Falldaten der Zahlungssitzung neu gerechnet (deterministisch, gleiche Versionen); die Druckvorlage für den Postversand lässt sich jederzeit aus dem angemeldeten Admin unter `/api/admin/druck?sitzung=…` neu erzeugen.
- **Ratenbegrenzung** gilt je Funktionsinstanz (weich). Für eine harte Grenze später ein gemeinsamer Speicher.
- **Basic-Auth-Middleware** läuft am Vercel-Edge (Passwörter mit Umlauten werden als UTF-8 gelesen, Vergleich zeitkonstant).
- **Upload `/durchsetzung`:** höchstens 5 Dateien, zusammen 4 MB (Body-Limit der Functions 4,5 MB); der Dateityp wird am Inhalt geprüft, abgelehnte Dateien werden benannt.
- **Cron-Fenster:** Checkout-Sitzungen der letzten 30 Tage (SEPA-Zahlungen kommen Tage später), älteste zuerst, höchstens 5 Versände je Lauf; Bestellungen ohne Phase A (`unbereit`) werden erst nach Ablauf der Auto-Frist versendet.

## 3. Stripe-Webhook einrichten

Im Stripe-Dashboard → Entwickler → Webhooks → Endpunkt hinzufügen:
- URL: `https://renten-rettung.de/api/stripe/webhook` (zum Testen zunächst die `vercel.app`-Adresse).
- Ereignisse: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`.
- Den angezeigten Signaturschlüssel (`whsec_…`) als `STRIPE_WEBHOOK_SECRET` bei Vercel eintragen und neu bereitstellen.
- Außerdem im Dashboard: PayPal und Klarna als Zahlungsmethoden aktivieren; Steuersatz 19 % inklusiv anlegen; Rechnungsangaben (Firma, Anschrift, USt-IdNr. DE815896163) hinterlegen.

Testlauf: Bestellung mit Stripe-Testkarte `4242 4242 4242 4242` – die Vertragsbestätigung muss sofort ankommen; das Gutachten mit Rechnungslink folgt nach Freigabe unter `/admin` oder automatisch über den Cron (Abschnitt 4). Mit angekreuztem Postversand geht zusätzlich der Druckauftrag mit der Druckvorlage an `info@` (Abschnitt 4a).

## 4. Zwölf-Stunden-Versand (Prompt 13): Cron und Freigabeliste

Seit Prompt 13 wird der Bericht **nicht mehr sofort** versendet. Der Webhook prüft die Zahlung, erzeugt den Bericht probeweise (Plausibilisierung) und setzt die Markierung `erzeugt_am` samt Auffälligkeits-Kennzeichen; versendet wird in einem zweiten Schritt – **spätestens 12 Stunden nach Zahlungseingang** (Zusage auf Website, Danke-Seite und in der Bestätigungs-Mail):

- **Freigabe von Hand:** `/admin` (Anmeldung mit `ADMIN_PASSWORT`, Sitzungs-Cookie) zeigt die bezahlten Bestellungen der letzten 30 Tage mit Kennzeichen (z. B. Fondsvertrag, Beginn vor 1994, hoher Branchenwert-Anteil). „Freigeben & senden“ verschickt den Bericht sofort. Dort auch: Lead-Status je Bestellung und CSV-Export.
- **Automatisch:** ohne Freigabe versendet `GET /api/auslieferung/cron` jede Bestellung, deren Erzeugung mindestens 10 Stunden zurückliegt (2 Stunden Puffer zur 12-Stunden-Zusage). Akzeptiert zwei Berechtigungen: `Authorization: Bearer <CRON_SECRET>` (sendet Vercel bei eigenen Cron-Aufrufen automatisch mit, sobald die Variable gesetzt ist) oder das Sitzungs-Cookie der Admin-Anmeldung für manuelle Aufrufe.

**Vercel-Hobby-Tarif (aktueller Stand des Repos):** Cron-Jobs dürfen dort nur **einmal täglich** laufen, sonst schlägt die gesamte Bereitstellung fehl (nicht nur der Cron). `apps/web/vercel.json` ist deshalb bewusst auf **einmal täglich, 06:00 UTC** gestellt (`"schedule": "0 6 * * *"`), dazu wurde die Pro-Funktion `"regions": ["fra1"]` entfernt – beides ausschließlich, damit die Bereitstellung auf Hobby zum Testen durchläuft. Das reicht für die 12-Stunden-Zusage **nicht** (im schlechtesten Fall fast 24 Stunden Verzug) und ist als Testkonfiguration gedacht. Zwei Auswege für den Live-Betrieb:

1. **Pro-Tarif**: stündliche Crons sind erlaubt – `"schedule"` zurück auf `"0 * * * *"` stellen.
2. **Externer Zeitplaner** (z. B. cron-job.org oder ein beliebiger Uptime-Dienst): stündlich `GET https://renten-rettung.de/api/auslieferung/cron` mit dem Header `Authorization: Bearer <CRON_SECRET>` aufrufen (ohne Header antwortet die Route mit 401; ein URL-Parameter wird nicht akzeptiert). Dann den `crons`-Block aus `apps/web/vercel.json` entfernen oder den täglichen Vercel-Lauf als zusätzliche Absicherung stehen lassen.

Bis eine der beiden Lösungen steht, gilt: Bestellungen zeitnah unter `/admin` von Hand freigeben. Erstkunden-Codes (`EK-…`) sind vom 12-Stunden-Fenster ausgenommen und liefern weiterhin sofort aus.

## 4a. Postversand (Prompt 14): gedruckte Fassung als kostenlose Zusatzoption

Wer in Schritt 11 „Gutachten zusätzlich per Post (kostenlos, 2–7 Werktage)“ ankreuzt, bekommt das Gutachten unverändert per E-Mail **und** eine gedruckte Fassung. Ablauf ohne eigenen Speicher:

1. Die Checkout-Sitzung trägt `post = 1`; der PaymentIntent startet mit `post_status = gewuenscht`.
2. Beim Versand des Gutachtens (Freigabe oder Cron) erzeugt der Server die **Druckvorlage** (A4, beidseitig druckbar: Deckblatt mit Anschriftfeld für den Fensterumschlag, alle Gutachten-Seiten, einseitiger Beileger „Verkaufen statt kämpfen“) und schickt sie als **Druckauftrag** mit Anschrift an `info@renten-rettung.de` (`[Post] Druckvorlage RR-…`). Später geht diese Mail an den Druck- und Versanddienstleister mit Auftragsverarbeitungsvertrag (`[[DRUCKDIENST]]`, `config/business.ts`) – Adresse dort eintragen, sobald der Vertrag steht.
3. In der Freigabeliste `/admin` zeigt die Spalte **„Post“** den Stand (gewünscht → gedruckt → versendet) mit Zeitpunkt; die Knöpfe „gedruckt“/„versendet“ setzen `post_status`/`post_am`. „Druckvorlage (PDF)“ erzeugt die Vorlage jederzeit neu (`/api/admin/druck`).
4. Die Kosten je Sendung (`POST_VERSAND.postKosten.jeSendungEur`) bleiben `null`, bis das Angebot des Dienstleisters vorliegt – kein geschätzter Wert. Der CSV-Export enthält die Spalten `post` und `post_am`.

Zusage nach außen: „2–7 Werktage“ (`POST_WERKTAGE_TEXT`) – bis ein Dienstleister angebunden ist, muss der Druck von Hand innerhalb dieser Frist erfolgen.

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

Wenn alle Punkte aus `docs/DOMAIN-UMZUG.md` Abschnitt 4 abgehakt sind: `BETA_PASSWORT` löschen, `NEXT_PUBLIC_INDEXIERUNG=1` setzen, Stripe auf Live-Schlüssel umstellen (auch den Webhook-Endpunkt im Live-Modus anlegen), `RESEND_API_KEY` gesetzt und eine Testmail angekommen (ohne Schlüssel kein Versand auf Vercel), neu bereitstellen.
