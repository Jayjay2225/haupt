# sites/unternehmer – Geschäftsführer-Bereich (statische Seite)

Der bisherige Inhalt von renten-rettung.de (Pensionszusage, Rückdeckungsversicherung) zieht auf die eigene Domain `[[B2B-DOMAIN]]` um (Prompt 8, Aufgabe 4). Er bleibt **statisches HTML** in diesem Ordner, damit er weiter auf einfachem Webspace laufen kann.

## Status

**Wartet auf die Quelldatei.** Die heutige `index.html` (eine Datei, CSS inline, Schriften Cormorant Garamond und Manrope, Farben u. a. `#0A1F33`, `#B89968`, `#F7F3EC`) liefert Jack als Datei oder per Zugang. Sie wird **nicht** aus dem Netz nachgebaut. Bis dahin liegt hier `index.html` als neutraler Platzhalter („Seite wird eingerichtet“), damit der Ordner deploybar bleibt.

## Vorgehen, sobald die Datei da ist

1. Original als `sites/unternehmer/index.html` ablegen (Kopie des Originals zusätzlich unter `sites/unternehmer/original/index.html` als Sicherung).
2. Nur die Punkte aus `ANPASSUNGEN.md` ändern – Inhalt und Gestaltung bleiben unverändert.
3. Lokal prüfen: `python3 -m http.server 8080 --directory sites/unternehmer` und im Browser öffnen; alle Links klicken, Formular testen.
4. Auf das neue Hosting der B2B-Domain hochladen; erst danach die Domain-Umstellung nach `docs/DOMAIN-UMZUG.md`.
