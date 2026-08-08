# Changelog — BrabantSchoon website (ronde: fotokaarten + iconen-fix)

## 1. Gewijzigde bestanden
- `generate.py` — `PARTICULIER_SUBDIENSTEN`-data uitgebreid met afbeelding + alt-tekst per dienst; de sectie "Waarvoor u ons kunt inschakelen" op `schoonmaak-particulieren.html` volledig herbouwd van tekst+icoon-rijen naar 5 fotokaarten; `ASSET_VERSION` opgehoogd (143 → 144, verplicht bij css-wijziging)
- `css/styles.css` — dode `.diensten-split*`-CSS (vorige ronde, nu ongebruikt) vervangen door nieuwe `.diensten-cards-grid`/`.diensten-card`-stijlen; defensieve basisregel `svg.icon{width:24px;height:24px}` toegevoegd
- `schoonmaak-particulieren.html` — automatisch opnieuw gegenereerd (nooit handmatig aangepast)

**Niet gewijzigd:** homepage, hero, header, navigatie, logo, kleuren, fonts, footer, `offerte.html`, `contact.html`, formulieren, Google Maps, reviews, `diensten.html` (de eerder toegevoegde foto bij Particuliere schoonmaak staat er nog), zakelijke pagina's, SEO, `sitemap.xml`, `robots.txt`, `vercel.json` — gecontroleerd, geen van deze bestanden is aangeraakt.

## 2. Toegevoegde afbeeldingen
Van de 8 aangeleverde foto's zijn de 5 meest onderscheidende gekozen (de overige 3 overlapten inhoudelijk met een van deze vijf):
1. `verhuisschoonmaak-brabantschoon.webp` — medewerker met stofzuiger tussen verhuisdozen
2. `eenmalige-grote-schoonmaak-brabantschoon.webp` — medewerkster maakt salontafel schoon in woonkamer
3. `schoonmaak-na-verbouwing-brabantschoon.webp` — medewerkster verwijdert bouwstof met stofzuiger, ladder op de achtergrond
4. `periodieke-schoonmaak-brabantschoon.webp` — medewerkster maakt keukenblok schoon
5. `opleveringsschoonmaak-brabantschoon.webp` — medewerkster inspecteert lege woning met klembord

Alle vijf: geconverteerd naar WebP, geschaald naar 1200×800 (zelfde ratio als origineel, dus **geen enkel gezicht is afgesneden** — er is alleen verkleind, niet bijgesneden), Nederlandse alt-teksten, `loading="lazy"`.

## 3. Verwijderde bestanden
- `images/diensten/woning-schoonmaak-stofzuigen-brabantschoon.webp` — dit was de foto uit de vórige ronde die naast de icoon-lijst stond; die hele lay-out is nu vervangen door de 5 fotokaarten, dus deze losse foto werd overbodig en is verwijderd.

## 4. De CSS-fout: oorzaak
De site heeft een sitebrede basisregel `img,svg{max-width:100%; display:block;}`. Deze begrenst SVG's alleen naar boven toe (max. de breedte van de ouder), maar geeft ze **geen eigen breedte/hoogte**. Elk icoon op de site is daardoor volledig afhankelijk van een aparte, specifieke CSS-regel die ergens anders in het bestand zijn werkelijke formaat vastlegt (bijv. `.usp .icon-circle svg{width:22px}`). Ontbreekt zo'n specifieke regel — of is de icoon-structuur ergens net anders opgebouwd dan verwacht — dan valt de browser terug op het standaard SVG-formaat (circa 300×150px), alleen begrensd door de breedte van de omliggende kolom. In een brede flex/grid-kolom kan dat er inderdaad "gigantisch" en beeldschermvullend uitzien, precies zoals u beschreef.

## 5. Hoe dit is opgelost
- **Structureel**: de vijf diensten-items op `schoonmaak-particulieren.html` gebruiken nu foto's in plaats van SVG-iconen — het risico is voor deze sectie dus volledig weggenomen, niet alleen "gerepareerd".
- **Defensief, sitebreed**: er is één nieuwe, laag-specifieke basisregel toegevoegd (`svg.icon{width:24px;height:24px}`) die als vangnet dient. Alle bestaande, specifiekere icoon-regels elders op de site (met hogere CSS-specificiteit, deels met `!important`) blijven gewoon leidend en zijn niet aangeraakt — er is dus niets verwijderd waar andere onderdelen van afhankelijk zijn, alleen een extra vangnet toegevoegd voor het geval een icoon ooit buiten zijn verwachte context terechtkomt.
- Bij controle bleek er sitebreed nergens anders een icoon zonder eigen sizing-regel daadwerkelijk gebruikt te worden op een pagina die momenteel gegenereerd wordt (er lag wel één dode, ongebruikte CSS-regel voor een allang verwijderd onderdeel — die is met rust gelaten omdat hij nergens meer gerenderd wordt en dus onschadelijk is).

## 6. Resultaat controle
**Desktop:** 5 kaarten, verdeeld 3 boven + 2 gecentreerd eronder (flexbox met `justify-content:center`, past zich automatisch aan de beschikbare breedte aan — een professioneel alternatief voor een vast grid, zoals u toestond).
**Tablet:** 2 kaarten per rij (automatisch door dezelfde flex-wrap-opzet).
**Mobiel:** 1 kaart per rij, foto boven, titel en tekst eronder, geen horizontale overflow (kaarten hebben `max-width` en `flex-basis:100%` onder 560px).

Concreet gecontroleerd:
- 0 SVG's meer in de "Onze diensten"-sectie (was de bron van het probleem)
- Alle 5 nieuwe foto's laden correct (bestandscontrole geslaagd)
- Cards hebben identieke afmetingen/verhouding (`aspect-ratio:3/2`, `object-fit:cover`, gelijke `border-radius`)
- Bestaande teksten (titels + beschrijvingen) zijn letterlijk overgenomen, niet herschreven
- 0 gebroken interne links/afbeeldingen sitewide, 0 dubbele HTML-ID's, exact 1 H1 per pagina
- Homepage, header, footer, offerte.html, contact.html, zakelijke pagina's, lokale pagina's: bevestigd ongewijzigd (geen van de nieuwe CSS-classes komt daar voor)
- De eerder toegevoegde foto bij Particuliere schoonmaak op `diensten.html` staat nog onaangetast
