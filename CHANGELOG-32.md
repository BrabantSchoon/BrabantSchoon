# Changelog — BrabantSchoon website (bevestiging: js/main.js daadwerkelijk bijgewerkt en in de ZIP)

## Wat ik heb gecontroleerd
Op uw verzoek heb ik uitsluitend `js/main.js` gecontroleerd, met een striktere methode dan voorheen: niet alleen "staat de code er functioneel in", maar een letterlijke **byte-vergelijking** tussen het bronbestand en het bestand binnen de daadwerkelijk opgeleverde ZIP.

### 1. Alle 8 gevraagde wizardfixes gecontroleerd \u2014 aanwezig in het huidige `js/main.js`
| Fix | Aanwezig? |
|---|---|
| Type/dienst/pakket via URL preselecteren | \u2713 (`requestedType`, `requestedDienstSlug`, `requestedPakketId`) |
| Pakketkeuze overslaan als pakket al bekend is | \u2713 (`anker`-logica die de pakketstap overslaat) |
| Woning \u2192 Extra's \u2192 Gegevens \u2192 Controleren | \u2713 (`STEP_PHASE`, `PHASE_ORDER`, `PHASE_LABELS`) |
| Mobiele "Hierna: ..."-weergave | \u2713 |
| "Uw keuze" toont dienst + pakket | \u2713 (`preselectText.textContent`) |
| "Keuze wijzigen" gericht naar pakketstap | \u2713 (`currentPakketId() ? 3 : 2`) |
| Live prijsindicatie bij extra's | \u2713 (`prijsBlokExtra`) |
| Bestaande stepper-/inbegrepen-minimumlogica | \u2713 (`minimum = parseInt(card.dataset.prevIncluded...)`) |

### 2. `js/main.js` daadwerkelijk (opnieuw) opgeslagen
Bronbestand: 48.307 bytes, md5 `35dc06d26d3429724bfa47645a22a505`.

### 3. ZIP-inhoud letterlijk byte-voor-byte geverifieerd
- md5 van `js/main.js` **binnen de zojuist gebouwde ZIP**: `35dc06d26d3429724bfa47645a22a505` \u2014 identiek aan het bronbestand.
- Vervolgens de ZIP volledig opnieuw uitgepakt naar een verse, lege map (dus niet de map waarin ik werkte) en daar **nogmaals** de md5 gecontroleerd: opnieuw identiek.
- Alle 8 fixes hierboven nogmaals \u00e9\u00e9n voor \u00e9\u00e9n teruggevonden in dat verse, uitgepakte bestand \u2014 niet alleen in mijn werkmap.
- `offerte.html` in die verse map verwijst naar `js/main.js?v=172`, de bijbehorende cacheversie.
- Tot slot nogmaals de md5 gecontroleerd van het bestand zoals het uiteindelijk in de map staat die u nu ontvangt: opnieuw exact `35dc06d26d3429724bfa47645a22a505`.

**`js/main.js` in de bijgevoegde ZIP is dus aantoonbaar niet verouderd \u2014 het is letterlijk hetzelfde bestand, op elk controlepunt, van bronbestand tot uitgepakte ZIP.**

### 4. Verder niets gewijzigd
Zoals gevraagd: geen andere prijzen, HTML, CSS, SEO of flows aangeraakt. Expliciet opnieuw gecontroleerd: 38 pagina's, 0 dubbele HTML-id's, alle prijzen (bijv. Compleet 61\u201390m\u00b2 = \u20ac475, periodiek t/m 60m\u00b2 wekelijks = \u20ac90) ongewijzigd, wizard nog steeds 11 stappen met numeriek oplopende volgorde.

## Als het probleem hierna nog steeds optreedt
Dan zit het verschil aantoonbaar niet in het bestand dat ik u lever \u2014 elke laag van mijn eigen proces (bronbestand \u2192 zip-inhoud \u2192 vers uitgepakte zip \u2192 het definitieve outputbestand) geeft dezelfde hash. Het meest waarschijnlijke resterende verschil zit dan tussen "wat ik oplever" en "wat er daadwerkelijk op GitHub/Vercel staat": controleer in dat geval rechtstreeks in GitHub's "Raw"-weergave van `js/main.js` of de tekst `STEP_PHASE` en `v=172` er letterlijk in staan, en of Vercel's laatste deployment "Ready" is vanaf die exacte commit.
