# Anpassungen an der Geschäftsführer-Seite beim Umzug

Nur diese Stellen ändern; Inhalt und Gestaltung bleiben, wie sie sind.

| Stelle | Heute | Neu |
|---|---|---|
| `<title>` | Seitentitel mit renten-rettung.de-Bezug | Titel mit `[[B2B-DOMAIN]]`-Bezug, ohne „Renten-Rettung“ |
| `<link rel="canonical">` | https://renten-rettung.de/ | https://`[[B2B-DOMAIN]]`/ |
| `og:url`, `og:site_name` (falls vorhanden) | renten-rettung.de | `[[B2B-DOMAIN]]` |
| Interne Verweise / Menü | Links auf renten-rettung.de-Unterseiten | auf die neue Domain bzw. entfernen, wenn es die Unterseite nicht mehr gibt |
| Kontaktadresse | info@renten-rettung.de | Adresse der B2B-Domain (bis dahin bleibt info@renten-rettung.de erreichbar – Mail-Einträge werden beim Umzug nicht angefasst) |
| Formularziel | `action="https://formsubmit.co/…"` | eigener Endpunkt (z. B. Formular-Route auf dem neuen Hosting) **oder** formsubmit.co bewusst behalten und in die Auftragsverarbeiter-Liste der Datenschutzerklärung aufnehmen (offener Punkt) |
| Impressum/Datenschutz-Links | ggf. auf renten-rettung.de | auf die eigenen Rechtsseiten der B2B-Domain |

Nicht ändern: Texte, Bilder, Farben, Schriften, Aufbau.
