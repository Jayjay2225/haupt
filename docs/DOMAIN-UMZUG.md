# Umzugs-Checkliste renten-rettung.de (Prompt 8, Aufgabe 5)

Stand: 18.09.2026. **Diese Liste wird von Hand abgearbeitet – nichts davon ist automatisiert oder bereits ausgeführt.** Ausgangslage: Die Domain `renten-rettung.de` liegt bei united-domains im Konto eines Kollegen. Auf demselben Webspace liegt im Ordner `/einkehr` eine andere Webseite. Das Postfach `info@renten-rettung.de` muss durchgehend funktionieren.

## 0. Grundregeln (gelten für jeden Schritt)

- [ ] **`/einkehr` nie anfassen.** Kein Löschen, kein Umbenennen, keine Rechteänderung.
- [ ] **Webspace nicht kündigen, nicht leeren.** Er bleibt bestehen (Mail, `/einkehr`, Sicherung).
- [ ] **MX-, SPF-, DKIM-, DMARC- und alle sonstigen Mail-Einträge unverändert lassen.** Umgestellt werden ausschließlich die Web-Einträge (A/AAAA/CNAME) für `renten-rettung.de` und `www.renten-rettung.de`.
- [ ] **Vor jeder Änderung Sicherung ziehen** (DNS-Zone als Screenshot und Textexport; Webspace-Inhalt als Download mit Datum im Dateinamen).
- [ ] Vier-Augen-Prinzip: Jede DNS-Änderung wird vor dem Speichern von einer zweiten Person gegengelesen.

## 1. Vorbereitung

- [ ] Zugang zum united-domains-Konto klären (Kollege führt die Änderung selbst aus oder ist beim Termin dabei; keine Zugangsdaten per E-Mail/Chat weitergeben).
- [ ] Aktuelle DNS-Zone exportieren und in `docs/umzug/dns-vorher-<datum>.txt` ablegen (nicht ins öffentliche Repo, falls es öffentlich wird).
- [ ] Alle heutigen Web-Einträge notieren: A/AAAA für `@` und `www`, CNAMEs, TTL-Werte.
- [ ] Alle Mail-Einträge notieren (MX, TXT für SPF/DKIM/DMARC, ggf. `autoconfig`/`autodiscover`) – nur zur Kontrolle, dass sie nachher unverändert sind.
- [ ] Heutige Startseite (`index.html` und alle Assets) herunterladen: Sicherung `docs/umzug/alte-startseite-<datum>.zip` **und** Quelle für `sites/unternehmer/`.
- [ ] Prüfen, ob `/einkehr` über einen eigenen Hostnamen erreichbar ist oder über `renten-rettung.de/einkehr` (falls Letzteres: Betreiber informieren, dass der Pfad nach der Umstellung nicht mehr über `renten-rettung.de` erreichbar ist, und Alternative klären – z. B. eigene Subdomain, die weiter auf den alten Webspace zeigt).

## 2. Reihenfolge des Umzugs

1. **B2B-Seite zuerst.**
   - [ ] `[[B2B-DOMAIN]]` registrieren (Jack).
   - [ ] `sites/unternehmer/` mit der Original-`index.html` befüllen und nach `sites/unternehmer/ANPASSUNGEN.md` anpassen.
   - [ ] Auf das Hosting der B2B-Domain hochladen; TLS-Zertifikat aktiv; alle Links und das Formular geprüft.
   - [ ] Erst wenn die B2B-Seite live und geprüft ist, weiter mit Schritt 2.
2. **Beta von Renten-Rettung auf dem neuen Hosting bereitstellen** (noch unter einer Vorschau-Adresse des Hosters).
   - [ ] `BETA_PASSWORT` gesetzt (Passwortschutz aktiv), `robots` bleibt `noindex`.
   - [ ] Umgebungsvariablen geprüft (`NEXT_PUBLIC_PRODUKT_VARIANTE` nicht gesetzt → Privatkunden-Variante).
   - [ ] Smoke-Test: Startseite, Rechner, Ergebnis, `/verkaufen`, `/so-verdienen-wir`, `/unternehmer`, Rechtsseiten, `/api/vorschau`.
3. **DNS für `renten-rettung.de` umstellen** – nur Web-Einträge.
   - [ ] TTL der betroffenen Web-Einträge 24 h vorher auf 300 s senken (Rollback beschleunigt).
   - [ ] A/AAAA (oder CNAME für `www`) auf das neue Hosting setzen; Mail-Einträge unberührt (Kontrolle gegen die Notizen aus Abschnitt 1).
   - [ ] Änderung protokollieren (wer, wann, was).
4. **TLS prüfen.**
   - [ ] Zertifikat für `renten-rettung.de` und `www.renten-rettung.de` gültig (Aussteller, Ablauf, Kette).
   - [ ] HTTP → HTTPS-Weiterleitung aktiv; `www` → Hauptdomain (oder umgekehrt) konsistent.
5. **Alte Startseite als Sicherung aufbewahren.**
   - [ ] Zip aus Abschnitt 1 bleibt; zusätzlich Kopie unter `sites/unternehmer/original/` (Quelle der B2B-Seite).
   - [ ] Alter Webspace bleibt bestehen (Mail, `/einkehr`).

## 3. Nach der Umstellung

- [ ] `info@renten-rettung.de`: Test-Mail senden **und** empfangen (extern → Postfach, Postfach → extern).
- [ ] `/einkehr` weiterhin erreichbar (über den in Abschnitt 1 geklärten Weg).
- [ ] Alte URLs, die es nicht mehr gibt (z. B. `/pensionszusage`), auf `/unternehmer` oder direkt auf `[[B2B-DOMAIN]]` weiterleiten (301) – Liste der alten URLs aus der alten Startseite ableiten.
- [ ] TTL nach 48 h stabilem Betrieb wieder auf den Normalwert anheben.
- [ ] Rollback-Plan festgehalten: alte A/AAAA-Werte aus der Sicherung zurückspielen (Dauer: TTL).

## 4. Go-live-Kriterien für die Beta (Passwort weg, noindex weg)

Die Beta bleibt **passwortgeschützt und noindex**, bis alle Punkte abgehakt sind:

- [ ] Rechtstexte (Impressum, Datenschutz, AGB, Widerrufsbelehrung) anwaltlich erstellt bzw. abgenommen; Anbieter `[[ANBIETER]]` ersetzt.
- [ ] `data/legal-rules.json` und alle Ergebnis-/Berichtstexte anwaltlich abgenommen (docs/LEGAL-OPEN-QUESTIONS.md Nr. 1–12).
- [ ] Verbotslisten-Test grün (`pnpm test`), Wording-Review durch Jack.
- [ ] Ankaufs-Konditionen (`[[ANKAUF-PRIVAT …]]`) eingetragen und rechtlich geprüft; Einwilligungstext für die Weitergabe abgenommen.
- [ ] Zahlung für den Bericht eingerichtet (`BESTELLUNG_AKTIV`), Rechnungsstellung und Widerrufsbelehrung für den Fernabsatz passend.
- [ ] Auftragsverarbeiter-/Empfängerliste vollständig (Hosting, E-Mail-Dienst z. B. Resend, Zahlungsabwicklung Stripe inkl. Rechnungsstellung, ggf. formsubmit.co der B2B-Seite).
- [ ] Für den E-Mail-Versand nötige SPF-/DKIM-Einträge nur **ergänzen**; bestehende MX-/SPF-Einträge bleiben, `info@renten-rettung.de` läuft weiter.
- [ ] Datenschutz: Speicherdauern, Löschkonzept, Double-Opt-in getestet.
- [ ] Barrierefreiheit: Kontraste nach docs/DESIGN.md geprüft, Tastaturbedienung des Funnels getestet, `prefers-reduced-motion` geprüft.
- [ ] Ladezeit unter 2 s auf mobilem Netz (Messung dokumentiert).
- [ ] Unternehmensindividuelle Kennzahlen für die häufigsten Versicherer eingepflegt oder der Branchendurchschnitt-Hinweis im Ergebnis bewusst freigegeben.
- [ ] Sicherung der Beta-Konfiguration, Monitoring/Fehler-Logging ohne Personenbezug aktiv.
- [ ] Freigabe durch Jack dokumentiert (Datum, Version aus `docs/STATUS.md`).
