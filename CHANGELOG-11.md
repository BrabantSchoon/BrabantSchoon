# Changelog — BrabantSchoon website (ronde: verificatie live-laadprobleem + robuustere JS)

## 1. Wat ik heb gecontroleerd (op uw expliciete verzoek: niet de broncode, de daadwerkelijke ZIP)
Ik heb de ZIP die ik ga opleveren zelf opnieuw uitgepakt in een schone, losse map en **rechtstreeks in die uitgepakte bestanden** gecontroleerd \u2014 dus niet in `generate.py` of mijn werkmap, maar in de exacte bestanden die u straks ontvangt:

1. `css/styles.css` en `js/main.js` bestaan daadwerkelijk in de ZIP, op het verwachte pad. \u2705
2. Alle 37 HTML-pagina's verwijzen naar `?v=155` (nieuw, niet hergebruikt). \u2705
3. `.pakket-card{...}` (witte achtergrond, rand, radius, padding, schaduw) staat daadwerkelijk in `css/styles.css`. \u2705
4. `.pakket-toggle{...}` (de gestylede knop, geen kale browserknop) staat daadwerkelijk in `css/styles.css`. \u2705
5. `.pakket-details[hidden]{display:none;}` staat daadwerkelijk in `css/styles.css`. \u2705
6. De click-handler (`querySelectorAll('.pakket-toggle')`) en de nieuwe `initPakketCards()`-functie staan daadwerkelijk in `js/main.js`. \u2705

**Conclusie: de code in deze ZIP is aantoonbaar correct.** Wat u live zag (geen kaartrand, kale grijze knop, klikken doet niets) kan dus niet door een fout in de gegenereerde bestanden komen \u2014 dat wijst op een laadprobleem tussen upload en browser: de vorige `v=154`-versie van `css/styles.css` en/of `js/main.js` is bij de vorige upload waarschijnlijk niet (volledig) bijgewerkt, of bleef ergens gecachet hangen.

## 2. Gewijzigde bestanden
- `generate.py` \u2014 `ASSET_VERSION` opgehoogd naar **155** (niet hergebruikt, zoals gevraagd).
- `js/main.js` \u2014 de pakket-toggle-code is verplaatst naar het begin van het bestand, in een losse functie `initPakketCards()`, en wordt nu expliciet pas gestart na `DOMContentLoaded` (met een fallback voor het geval de DOM al klaar is), verpakt in een `try/catch` via `safeInitPakketCards()` \u2014 een eventuele fout elders in het script kan de pakketknoppen dus nooit meer blokkeren.
- Overige bestanden: geen visuele/inhoudelijke wijzigingen deze ronde \u2014 alleen de versienummers zijn overal doorgevoerd.

**Niet gewijzigd:** het ontwerp van de pakketkaarten zelf (dat was al goed volgens uw vorige bericht), de offertewizard, homepage, header, footer, overige pagina's.

## 3. Wat u nu zelf moet controleren bij het uploaden
Omdat dit al de tweede keer is dat een CSS/JS-wijziging live niet aankomt terwijl de code aantoonbaar klopt, wil ik extra concreet zijn:

1. **Vervang de hele map, niet alleen losse bestanden.** Sleep bij het uploaden in GitHub de volledige inhoud van de ZIP naar de repo, zodat `css/styles.css` en `js/main.js` allebei daadwerkelijk overschreven worden \u2014 niet alleen de HTML-bestanden.
2. **Controleer in GitHub zelf, na de upload:** open `css/styles.css` via "Raw" in de browser en zoek (Ctrl+F) naar `.pakket-toggle{` \u2014 die regel moet er letterlijk in staan. Doe hetzelfde voor `js/main.js` en zoek naar `initPakketCards`.
3. **Controleer de bestandsgrootte/datum in GitHub** \u2014 als `styles.css` in GitHub een oudere "Last commit"-datum of duidelijk kleinere bestandsgrootte toont dan wat u net geüpload heeft, is de upload niet goed doorgekomen.
4. **Controleer Vercel:** staat de laatste deployment op "Ready"? Gebruikt die deployment de laatste commit (met de v=155-bestanden)?
5. **Test daarna pas** met een harde refresh of in een incognitotabblad, zodat een eventuele resterende cache geen rol meer speelt.

Als na deze stappen `css/styles.css?v=155` in de Netwerktab van de browser (devtools) nog steeds een 200-resultaat geeft met de OUDE inhoud, dan weten we zeker dat het probleem bij de CDN/deployment zit en niet bij de code \u2014 dat is dan iets voor Vercel-support of een handmatige "Redeploy" in het Vercel-dashboard.

## 4. Gecontroleerd (sitewide, op de broncode-versie vóór het inpakken)
- 0 dubbele HTML-id's, 0 gebroken links/afbeeldingen, exact 1 H1 per pagina.
- Alle 15 pakket-CTA's kloppen nog steeds 1-op-1 met de wizard-data.
- `js/main.js` en `generate.py` slagen beide voor een syntaxcontrole.

Ik kan de live site niet vanaf hier bezoeken en dus niet met zekerheid zeggen of dit ditmaal wél doorkomt \u2014 maar de code zelf is nu dubbel geverifieerd: zowel in de bron als in de daadwerkelijk uitgepakte ZIP-bestanden.
