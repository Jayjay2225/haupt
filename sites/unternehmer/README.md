# sites/unternehmer – Geschäftsführer-Bereich (geparkt)

**Entscheidung 21.09.2026:** `renten-rettung.de` wird die Privatkunden-Seite (`apps/web`). Der bisherige Geschäftsführer-Bereich (Pensionszusage, Rückdeckungsversicherung, Verkauf statt Kündigung) geht **vorerst nicht** wieder online; für dieses Modell wird später eine andere Website gefunden. Ein Umzug auf eine eigene B2B-Domain findet deshalb nicht statt (`b2bDomain` in `apps/web/config/brand.ts` ist leer, die Brückenseite `/unternehmer` und die Links „Für Unternehmer“ sind damit aus).

## Archiv

`archiv/index-b2b-2026-09.html` ist die am 21.09.2026 gelieferte Original-Startseite von renten-rettung.de – **unverändert, nur als Sicherung**. Sie wird nicht ausgeliefert und nicht in die Privatkunden-Seite übernommen: Sie enthält Aussagen (Mehrerlös „bis zu +200 %“, Praxiswerte, Kundenstimmen, Partnernennungen, Anbieterkennzeichnung einer anderen Gesellschaft), die den Kommunikationsregeln des Privatkundenangebots (docs/PROMPTS.md, Prompt 8) widersprechen. Nicht mitgeliefert: `auxinum-Logo-W.png` (im HTML referenziert).

Das dortige Kontaktformular sendet an formsubmit.co mit abgeschaltetem Captcha (`_captcha=false`) – eine wahrscheinliche Quelle des aktuellen Spam-Aufkommens. Mit der Umstellung der Domain auf die neue Seite ist dieses Formular abgeschaltet.

## Falls die B2B-Seite später wieder online geht

`ANPASSUNGEN.md` beschreibt, was beim Umzug auf eine eigene Domain zu ändern wäre (Titel, Canonical, Links, Kontakt, Formularziel). Inhaltlich wäre die Seite vorher gegen die Verbotsliste (docs/PROMPTS.md, Prompt 8, Aufgabe 1 und 3) zu prüfen.
