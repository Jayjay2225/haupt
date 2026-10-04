# Umstellungs-Checkliste renten-rettung.de (Prompt 8, Aufgabe 5)

Stand: 21.09.2026. **Diese Liste wird von Hand abgearbeitet – nichts davon ist automatisiert oder bereits ausgeführt.** Ausgangslage: Die Domain `renten-rettung.de` liegt bei united-domains im Konto eines Kollegen. Auf demselben Webspace liegt im Ordner `/einkehr` eine andere Webseite. Das Postfach `info@renten-rettung.de` muss durchgehend funktionieren.

**Planänderung 21.09.2026:** Die heutige Startseite (Geschäftsführer-Bereich) wird **nicht** auf eine B2B-Domain umgezogen, sondern geparkt (`sites/unternehmer/archiv/`). `renten-rettung.de` zeigt nach der Umstellung direkt auf die neue Privatkunden-Seite (`apps/web`). Damit entfällt der Schritt „B2B-Seite zuerst“.

## 0. Grundregeln (gelten für jeden Schritt)

- [ ] **`/einkehr` nie anfassen.** Kein Löschen, kein Umbenennen, keine Rechteänderung.
- [ ] **Webspace nicht kündigen, nicht leeren.** Er bleibt bestehen (Mail, `/einkehr`, Sicherung).
- [ ] **MX-, SPF-, DKIM-, DMARC- und alle sonstigen Mail-Einträge unverändert lassen.** Umgestellt werden ausschließlich die Web-Einträge (A/AAAA/CNAME) für `renten-rettung.de` und `www.renten-rettung.de`. Für den E-Mail-Versand der neuen Seite nötige Einträge (SPF-Include, DKIM des E-Mail-Dienstes) werden nur **ergänzt**, nie ersetzt.
- [ ] **Vor jeder Änderung Sicherung ziehen** (DNS-Zone als Screenshot und Textexport; Webspace-Inhalt als Download mit Datum im Dateinamen).
- [ ] Vier-Augen-Prinzip: Jede DNS-Änderung wird vor dem Speichern von einer zweiten Person gegengelesen.

## 1. Vorbereitung

- [ ] Zugang zum united-domains-Konto klären (Kollege führt die Änderung selbst aus oder ist beim Termin dabei; keine Zugangsdaten per E-Mail/Chat weitergeben).
- [ ] Aktuelle DNS-Zone exportieren und in `docs/umzug/dns-vorher-<datum>.txt` ablegen (nicht ins öffentliche Repo, falls es öffentlich wird).
- [ ] Alle heutigen Web-Einträge notieren: A/AAAA für `@` und `www`, CNAMEs, TTL-Werte.
- [ ] Alle Mail-Einträge notieren (MX, TXT für SPF/DKIM/DMARC, ggf. `autoconfig`/`autodiscover`) – nur zur Kontrolle, dass sie nachher unverändert sind.
- [x] Heutige Startseite gesichert: `sites/unternehmer/archiv/index-b2b-2026-09.html` (geliefert 21.09.2026; das referenzierte `auxinum-Logo-W.png` fehlt noch – ebenfalls vom Webspace sichern).
- [ ] Prüfen, ob `/einkehr` über einen eigenen Hostnamen erreichbar ist oder über `renten-rettung.de/einkehr`. Falls Letzteres: Betreiber informieren, dass der Pfad nach der Umstellung nicht mehr über `renten-rettung.de` erreichbar ist, und Alternative klären (z. B. Subdomain `einkehr.renten-rettung.de`, die weiter auf den alten Webspace zeigt – ein zusätzlicher A/CNAME-Eintrag, keine Änderung an bestehenden Einträgen).

## 2. Reihenfolge der Umstellung

1. **Neue Seite auf dem neuen Hosting bereitstellen** (zunächst unter einer Vorschau-Adresse des Hosters).
   - [ ] Umgebung nach `apps/web/.env.example`: `BETA_PASSWORT` gesetzt, `NEXT_PUBLIC_INDEXIERUNG` nicht gesetzt (noindex), `NEXT_PUBLIC_BASIS_URL=https://renten-rettung.de`, Stripe-Schlüssel, E-Mail-Dienst, `CHROMIUM_PATH`/Chromium vorhanden, `AUSLIEFERUNG_VERZEICHNIS` auf dauerhaften Speicher.
   - [ ] Stripe-Webhook auf `https://renten-rettung.de/api/stripe/webhook` eingerichtet (Ereignisse siehe docs/STATUS.md).
   - [ ] Smoke-Test: Startseite, Rechner, Ergebnis, `/bericht`, `/bestellen` (Testzahlung mit Stripe-Testkarte, PayPal-/Klarna-Test), `/bestellen/danke`, `/verkaufen`, `/so-verdienen-wir`, Rechtsseiten, `/api/vorschau`; Vertragsbestätigung, Bericht und Rechnung kommen per E-Mail an.
2. **DNS für `renten-rettung.de` umstellen** – nur Web-Einträge.
   - [ ] TTL der betroffenen Web-Einträge 24 h vorher auf 300 s senken (Rollback beschleunigt).
   - [ ] A/AAAA (oder CNAME für `www`) auf das neue Hosting setzen; Mail-Einträge unberührt (Kontrolle gegen die Notizen aus Abschnitt 1).
   - [ ] Änderung protokollieren (wer, wann, was).
3. **TLS prüfen.**
   - [ ] Zertifikat für `renten-rettung.de` und `www.renten-rettung.de` gültig (Aussteller, Ablauf, Kette).
   - [ ] HTTP → HTTPS-Weiterleitung aktiv; `www` → Hauptdomain (oder umgekehrt) konsistent.
4. **Alte Startseite bleibt Sicherung.**
   - [ ] Zip aus Abschnitt 1 und `sites/unternehmer/archiv/` bleiben; alter Webspace bleibt bestehen (Mail, `/einkehr`). Das alte Kontaktformular (formsubmit.co) ist damit abgeschaltet.

## 3. Nach der Umstellung

- [ ] `info@renten-rettung.de`: Test-Mail senden **und** empfangen (extern → Postfach, Postfach → extern).
- [ ] `/einkehr` weiterhin erreichbar (über den in Abschnitt 1 geklärten Weg).
- [ ] Alte Anker-URLs der bisherigen Startseite (`/#problem`, `/#loesung`, `/#prozess`, `/#partner`, `/#faq`, `/#kontakt`) laufen auf die neue Startseite; keine weiteren alten Unterseiten bekannt – Serverprotokoll der ersten Woche auf 404 prüfen.
- [ ] Spam-Aufkommen im Postfach nach zwei Wochen prüfen (Wegfall des Captcha-losen formsubmit-Formulars); falls weiter hoch: Spamfilter des Mail-Anbieters schärfen, DMARC-Richtlinie (`p=quarantine`) erwägen – Mail-Einträge nur ergänzen.
- [ ] TTL nach 48 h stabilem Betrieb wieder auf den Normalwert anheben.
- [ ] Rollback-Plan festgehalten: alte A/AAAA-Werte aus der Sicherung zurückspielen (Dauer: TTL).

## 4. Go-live-Kriterien (Passwort weg, `NEXT_PUBLIC_INDEXIERUNG=1`)

Die Seite bleibt **passwortgeschützt und noindex**, bis alle Punkte abgehakt sind:

- [x] Anbieterkennzeichnung vollständig (Firma, Anschrift, Vertretung, Register, USt-IdNr., Telefon, E-Mail) – 21.09.2026.
- [ ] Anwaltlich abgenommene Rechtstexte (Datenschutz, AGB, Widerrufsbelehrung) **im Repo eingepflegt** – die Abnahme ist laut Auftraggeber erfolgt (21.09.2026), die Seiten enthalten aber noch Platzhalter; abgenommene Fassungen werden eingebaut, `EntwurfHinweis` entfällt.
- [ ] `data/legal-rules.json` und alle Ergebnis-/Berichtstexte anwaltlich abgenommen (docs/LEGAL-OPEN-QUESTIONS.md Nr. 1–12; Warnhinweise laut Auftraggeber abgenommen).
- [ ] Verbotslisten-Test grün (`pnpm test`), Wording-Review durch Jack.
- [ ] Ankaufs-Konditionen (`[[ANKAUF-PRIVAT …]]`) eingetragen und rechtlich geprüft; Einwilligungstext für die Weitergabe abgenommen – oder `/verkaufen` bis dahin ausblenden.
- [ ] Zahlung für den Bericht produktiv (Stripe-Schlüssel, PayPal/Klarna aktiv, Steuersatz, Rechnungsdaten), Testbestellung durchgelaufen.
- [ ] Auftragsverarbeiter-/Empfängerliste vollständig (Hosting, E-Mail-Dienst z. B. Resend, Zahlungsabwicklung Stripe inkl. Rechnungsstellung) und in der Datenschutzerklärung benannt.
- [ ] Datenschutz: Speicherdauern (Berichte, Bestellstatus, Protokolle), Löschkonzept festgelegt.
- [ ] Barrierefreiheit: Kontraste nach docs/DESIGN.md geprüft, Tastaturbedienung des Funnels getestet, `prefers-reduced-motion` geprüft.
- [ ] Ladezeit unter 2 s auf mobilem Netz (Messung dokumentiert).
- [ ] Sicherung der Konfiguration, Monitoring/Fehler-Logging ohne Personenbezug aktiv.
- [ ] Freigabe durch Jack dokumentiert (Datum, Version aus `docs/STATUS.md`).
