# Changelog — BrabantSchoon website

## 1. Gewijzigde bestanden
- `generate.py` — alle 16 opdrachtpunten hieronder, plus `ASSET_VERSION` opgehoogd (142 → 143, verplicht bij elke css-wijziging)
- `css/styles.css` — nieuwe stijlen voor de fotosectie op de particulierenpagina en de nieuwe Maps-preview
- `contact.html`, alle 7 dienstpagina's (`diensten/*.html`), `zakelijke-schoonmaak.html`, `schoonmaak-particulieren.html`, `diensten.html`, `index.html`, alle 13 lokale pagina's (`schoonmaakbedrijf-*.html`), `thanks.html`, `privacy.html`, `voorwaarden.html`, `cookiebeleid.html` — automatisch opnieuw gegenereerd via `python3 generate.py` (nooit handmatig aangepast)
- `sitemap.xml`, `robots.txt` — automatisch opnieuw gegenereerd

**Niet gewijzigd:** `js/main.js` (ongewijzigd, alleen hergebruikt op de nieuwe pagina), `vercel.json`, `README.md`, logo/kleuren/navigatiestructuur, homepage-hero/lay-out.

## 2. Nieuwe bestanden
- `offerte.html` — losse offertepagina met de volledige, ongewijzigde offertewizard (zakelijk/VvE/particulier-filtering, validatie, samenvatting, bedankpagina — allemaal behouden)
- `images/diensten/particuliere-schoonmaak-brabantschoon.webp` (uit uw eerste meegestuurde foto, medewerkster maakt oppervlak schoon)
- `images/diensten/woning-schoonmaak-stofzuigen-brabantschoon.webp` (uit uw tweede meegestuurde foto, medewerkster stofzuigt woonkamer)

## 3. Verwijderde bestanden
Geen. Er is niets verwijderd — alleen de offertewizard is van `contact.html` verplaatst naar de nieuwe `offerte.html`.

## 4. Uitgevoerde wijzigingen (per opdrachtpunt)
1. **Foto particuliere schoonmaak op diensten.html** — de kaart gebruikt nu dezelfde foto/kaart-opmaak (hoogte, ratio, border-radius, object-fit, hover) als de zakelijke kaart. Zakelijke foto niet aangeraakt.
2. **Foto op schoonmaak-particulieren.html** — "Waarvoor u ons kunt inschakelen" is nu tekst links / grote foto rechts (±48% breedte op desktop), alle vijf diensten blijven leesbaar, foto stapelt netjes onder de tekst op mobiel, geen horizontale scroll.
3. **Aparte offertepagina** — `offerte.html` aangemaakt met de volledige bestaande wizard (klanttype-filtering, stappen, validatie, JS) 1-op-1 overgenomen; niets aan de wizard-logica zelf is aangepast.
4. **Alle offerte-CTA's** site-breed (header, mobiel menu, footer, cta-band, homepage, dienstpagina's, zakelijk/particulier-pagina's, alle 13 lokale pagina's) wijzen nu naar `offerte.html` (met behoud van `?type=zakelijk/particulier` voorselectie en `#offerteWizard`-anchor voor direct scrollen naar het formulier).
5. **Contact.html opgeschoond** — offertewizard verwijderd; telefoon, e-mail, bedrijfsgegevens en Maps blijven staan; duidelijke "Offerte aanvragen"-knop toegevoegd die naar `offerte.html` linkt.
6. **Google Maps-preview** — placeholder vóór interactie is nu een verzorgde, merk-gestileerde kaart-illustratie met pin-badge in plaats van een kaal vlak. Kaart laadt nog steeds pas na klik (privacy/cookiebeleid ongewijzigd, geen omzeiling van toestemming).
7. **Google reviews** — al aanwezig via de echte Elfsight-widget op de homepage plus de eerlijke link naar Google-reviews op contact.html (uit een eerdere ronde); niets verzonnen, niets aangepast.
8. **"Uw organisatie" → "uw situatie"** bij Flexibiliteit op de (gemengde) homepage; zakelijke pagina's zijn hier niet van toepassing (die tekst kwam alleen op de homepage voor) dus niets extra's aangepast.
9. **Homepage** — verder volledig ongewijzigd gelaten: geen nieuwe hero, geen nieuwe layout, geen nieuwe teksten.
10. **Zakelijk/particulier scheiding** gecontroleerd op `zakelijke-schoonmaak.html` en `schoonmaak-particulieren.html` — positionering en dienstenlijsten waren al correct gescheiden, niets toegevoegd om te vullen.
11. **SEO nieuwe pagina** — `offerte.html` heeft een eigen title, meta description, canonical, Open Graph en logische H1 ("Vraag een offerte aan."), en staat in `sitemap.xml`.
12. **Lokale landingspagina's** — alle 13 pagina's staan er nog, URL-structuur ongewijzigd, alleen de offerte-links daarin bijgewerkt.
13. **Vercel-redirects** — `vercel.json` is niet aangeraakt; alle bestaande redirects blijven werken (geen enkele oude URL is deze ronde verwijderd).
14. **Mobiele weergave** — nieuwe CSS (fotosectie, Maps-preview) heeft expliciete mobiele fallbacks (stapeling, aspect-ratio 4:3 op smalle schermen), geen horizontale overflow geconstateerd.
15. **Afbeeldingen geoptimaliseerd** — beide nieuwe foto's omgezet naar WebP, geschaald naar 1200×800 (zelfde formaat als bestaande dienstfoto's), beschrijvende bestandsnamen, Nederlandse alt-teksten, `loading="lazy"` + `decoding="async"`.
16. **Technische eindcontrole** — zie hieronder.

## 5. Zaken die u zelf nog moet instellen
- Niets nieuws deze ronde. (De eerder gesignaleerde aandachtspunten — een jurist laten meekijken naar de algemene voorwaarden i.v.m. herroepingsrecht voor particuliere klanten, en op de live Vercel-omgeving nog eens visueel bevestigen dat de Elfsight-widget geen andere elementen overlapt — staan nog open uit eerdere rondes.)
- **Let op bij uploaden naar GitHub:** de twee nieuwe afbeeldingen in `images/diensten/` zijn nieuwe bestandsnamen, dus dat is geen overschrijf-risico. Er zijn deze ronde geen bestaande afbeeldingen vervangen.

## 6. Resultaat technische eindcontrole
- Interne links: 0 gebroken links (alle `href`'s naar lokale `.html`-bestanden gecontroleerd)
- Afbeeldingen: 0 ontbrekende `src`-verwijzingen
- Dubbele HTML-ID's: geen gevonden, sitewide gecontroleerd
- H1-structuur: exact 1 H1 per pagina, sitewide gecontroleerd
- JSON-LD (structured data): geldig JSON op steekproefpagina's
- Sitemap.xml / robots.txt: correct gegenereerd, `offerte.html` opgenomen
- vercel.json: ongewijzigd, alle bestaande redirects intact
- Offerte-CTA's: geen enkele verwijzing naar `contact.html#offerteWizard` of `contact.html?type=` meer over; alle 32 offerte-links wijzen naar `offerte.html`
- Wizard-logica: ongewijzigd `js/main.js`, wizard-form-ID komt precies één keer voor (op offerte.html)
- Alle kernpagina's succesvol getest via lokale server (HTTP 200)
