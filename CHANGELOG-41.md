# Changelog — Brabantschoon website (ronde 41: contact-/footerformulier server-side + merknaam-audit)

Twee losse afrondingspunten vóór livegang: (1) de Web3Forms access key volledig uit
alle publieke broncode halen — ook uit het contact-/footerformulier, dat na ronde 40
nog als enige plek de key rechtstreeks in de HTML had staan; (2) een repo-brede
correctie van de merknaam naar de officiële schrijfwijze **Brabantschoon**.

## 1. Welke bestanden zijn gewijzigd?

**Punt 1 — contact-/footerformulier server-side:**
- **`api/contact-aanvraag.js`** *(nieuw)* — eigen, zelfstandige Vercel Serverless
  Function voor het compacte contactformulier/footerformulier. Bewust géén gedeelde
  module met `api/offerte-aanvraag.js` (dat endpoint is net getest en opgeleverd en
  wordt deze ronde niet aangeraakt). Leest de access key uitsluitend uit
  `process.env.WEB3FORMS_ACCESS_KEY`, valideert verplichte velden (naam/telefoon/
  e-mail), past dezelfde honeypot-/timing-botdetectie toe als de offertewizard, bouwt
  de e-mailtekst conditioneel op (geen lege bedrijfsnaam-/berichtregel) en faalt
  veilig (500/`server_misconfigured`, geen sleutel in de log, geen valse
  succesmelding) wanneer de omgevingsvariabele ontbreekt.
- **`generate.py`** — `render_footer()`: het formulier stuurt niet langer rechtstreeks
  (native form-POST) naar `https://api.web3forms.com/submit`. De hidden
  `access_key`/`subject`/`redirect`-velden zijn verwijderd; `action` is nu
  `/api/contact-aanvraag`; er is een `<noscript>`-fallback toegevoegd (zelfde patroon
  als de offertewizard) en een `form_rendered_at`-hidden-veld + statusregel voor
  succes-/foutmeldingen (hergebruikt de bestaande `.wizard-status`-stijl — geen
  CSS-wijziging nodig). `ASSET_VERSION` opgehoogd (176 → 177) omdat `js/main.js`
  wijzigde, zodat browsers de nieuwe versie niet uit cache blijven laden.
- **`js/main.js`** — nieuwe `initFooterForm()`/`safeInitFooterForm()` (zelfde patroon
  als de bestaande init-functies): onderschept de submit, bouwt een JSON-payload,
  stuurt die naar `/api/contact-aanvraag`, toont een "Bezig met verzenden…"-status,
  stuurt door naar `thanks.html` bij succes, toont een foutmelding met verwijzing naar
  het telefoonnummer bij falen. Geen wijziging aan bestaande functies.
- **7 verweesde root-level dienstpagina's verwijderd** (`gevelreiniging.html`,
  `glasbewassing.html`, `kantoorreiniging.html`, `opleveringsschoonmaak.html`,
  `periodieke-schoonmaak.html`, `specialistische-reiniging.html`,
  `vve-schoonmaak.html`) — gedateerd (11 augustus), niet meer gelinkt vanuit enige
  actuele pagina, niet in `sitemap.xml`, maar bevatten nog wél de oude hardcoded
  Web3Forms-key. Zonder verwijdering zou de oude key technisch nog "in publieke
  broncode" hebben gestaan, ook al was hij niet bereikbaar via de site — dat zou
  rechtstreeks tegen het doel van deze ronde ingaan. De actuele, juiste versies onder
  `diensten/` zijn ongemoeid gebleven.
- **`test_contact_api.js`** *(nieuw)* — 8 tests, zelfde opzet als
  `test_offerte_api.js`: e-mailopbouw (conditioneel), validatie, botdetectie, de
  garantie dat de key uitsluitend uit `process.env` komt, en drie handler-tests
  (veilig falen zonder key, normaal verzenden mét een verzonnen testwaarde en
  gemockte `fetch`, bot/ontbrekende velden/verkeerde methode). Alle 8 slagen.
- **`README.md`** — "Formulieren" en "Secrets & environment variables" bijgewerkt:
  het contact-/footerformulier wordt nu ook beschreven als server-side (de nuance uit
  ronde 40 dat de key daar nog wél zichtbaar was, is vervallen); "Lokaal testen"
  vermeldt nu ook `test_contact_api.js`. Zie punt 2 hieronder voor de
  merknaamcorrecties in dit bestand.

**Niet gewijzigd (bewust):** `api/offerte-aanvraag.js`, de zakelijke
calculatielogica/-parameters, de offertewizard-stappen, `css/styles.css` (behalve de
`ASSET_VERSION`-query-string, geen inhoudelijke CSS-wijziging), de particuliere
offerteflows.

**Punt 2 — merknaam-audit:**
- **`README.md`** — 3 voorkomens van de foutieve schrijfwijze "BrabantSchoon"
  gecorrigeerd naar "Brabantschoon" (titel, introductiezin, SEO-sectie).

Geen andere bestanden bevatten de foutieve schrijfwijze — zie punt 4 hieronder.

## 2. Hoe worden het contact-/footerformulier nu server-side verwerkt?

Precies zoals de offertewizard sinds ronde 39: de browser doet géén rechtstreekse
POST meer naar Web3Forms en de access key komt dus nooit in de browser terecht. In
plaats daarvan onderschept `initFooterForm()` (`js/main.js`) de submit, bouwt een
JSON-payload (naam, telefoon, e-mail, optioneel bedrijfsnaam/bericht, de
honeypot-/timingvelden) en stuurt die via `fetch()` naar het eigen endpoint
**`/api/contact-aanvraag`**. Die Vercel Serverless Function (`api/contact-aanvraag.js`)
valideert, controleert op bots, leest de access key uit
`process.env.WEB3FORMS_ACCESS_KEY` en stuurt de e-mail zelf, server-to-server, door
naar Web3Forms. De bestaande UX is functioneel identiek: dezelfde verplichte/optionele
velden, dezelfde HTML5-validatie (geen `novalidate`, dus de browser blokkeert net als
voorheen ongeldige invoer vóór verzending), dezelfde honeypot (`botcheck`) en een
nieuwe, vergelijkbare timing-controle (minimaal 2,5 seconde tussen laden en versturen —
identiek aan de offertewizard), en dezelfde doorverwijzing naar `thanks.html` bij
succes. Zonder JavaScript toont het formulier nu een duidelijke `<noscript>`-melding
met een verwijzing naar telefoon/e-mail (er is bewust geen non-JS-fallback, net als bij
de offertewizard sinds ronde 39 — dat is een bestaand, geaccepteerd patroon op deze
site, geen nieuwe beperking).

## 3. Komt er nog ergens een Web3Forms-sleutel voor in publieke broncode?

Nee. Een repo-brede zoekopdracht naar de oude, gecompromitteerde sleutel
(`abc98c0d-af...5299`, zelfde sleutel als in `CHANGELOG-40.md`) levert **0 resultaten**
op — ook niet meer
in de HTML van het contact-/footerformulier (dat was ná ronde 40 nog de enige
resterende plek) en ook niet meer in de 7 zojuist verwijderde verweesde
dienstpagina's. Alle resterende voorkomens van de string `access_key` in de repository
zijn legitiem: het JSON-veldnaam-gebruik in `api/offerte-aanvraag.js` en
`api/contact-aanvraag.js` (waarde komt uit `process.env`, niet hardcoded), en twee
testregels in `test_offerte_api.js`/`test_contact_api.js` die uitsluitend verzonnen
testwaarden gebruiken (nooit de echte sleutel). Zowel het contactformulier/
footerformulier als de offertewizard versturen nu uitsluitend server-side, met de
access key alleen als Vercel-omgevingsvariabele — er is geen enkel formulier meer over
dat rechtstreeks vanuit de browser naar Web3Forms post.

## 4. Hoeveel foutieve "BrabantSchoon"-vermeldingen zijn gevonden en gecorrigeerd?

Vóór correctie: **17 foutieve vermeldingen** repo-breed (16× "BrabantSchoon", 1×
"Brabant Schoon" met spatie — beide via een repo-brede, hoofdlettergevoelige
zoekopdracht over alle `.py`/`.js`/`.html`/`.md`/`.json`/`.xml`/`.txt`-bestanden,
inclusief `generate.py`, alle 38 gegenereerde pagina's, `js/main.js`, beide
API-bestanden, metadata/structured data/alt-teksten/aria-labels/paginatitels/footer/
header/offertewizard/contactformulieren/foutmeldingen/configuratiebestanden).

**Belangrijkste bevinding: alle levende/actuele sitecontent bevatte al 0 foutieve
vermeldingen** — `generate.py` (en dus alle 38 gegenereerde HTML-pagina's, metadata,
structured data, alt-teksten, aria-labels, paginatitels, footer/header, offertewizard,
contactformulieren, foutmeldingen), `js/main.js`, `api/offerte-aanvraag.js`,
`api/contact-aanvraag.js`, `sitemap.xml`, `robots.txt`, `vercel.json` en alle
testbestanden gebruikten al overal correct "Brabantschoon". Dat is vermoedelijk het
resultaat van een eerdere correctie in ronde 39 (zie `CHANGELOG-39.md`, die zelf
meldt: "Sitebreed 0 resterende BrabantSchoon/Brabant Schoon-schrijffouten").

De 17 gevonden vermeldingen zaten uitsluitend in twee categorieën:
- **`README.md`** (3×) — levende documentatie, geen historisch record. **Gecorrigeerd**
  naar "Brabantschoon" (titel, introductiezin, SEO-sectie).
- **Historische changelog-bestanden** (14×: `CHANGELOG-SEO-GSC.md` 6×,
  `CHANGELOG-39.md` 3×, `CHANGELOG.md` 1×, `CHANGELOG-11.md` 1×, `CHANGELOG-32.md` 1×,
  `CHANGELOG-2.md` 1×) — **bewust ongewijzigd gelaten**, conform uw eigen instructie
  om historische changelogs alleen aan te passen "wanneer dat veilig en logisch is".
  Deze bestanden zijn een verslag van wat er op dát moment gebeurde (bijv. "de title
  was toen 'Specialistische reiniging | BrabantSchoon'", of de titel van het
  changelog-bestand zelf) — het herschrijven van die historische tekst zou het
  logboek minder accuraat maken zonder enig praktisch voordeel, omdat deze bestanden
  nergens door de site of de build worden gelezen of getoond.

Na correctie: een verse, herhaalde repo-brede zoekopdracht (zelfde patroon,
hoofdlettergevoelig, over dezelfde bestandstypen) bevestigt **0 resterende foutieve
vermeldingen buiten de bewust ongewijzigd gelaten historische changelogs** — inclusief
een aparte controle op "BRABANTSCHOON" (hoofdletters) en overige tikfoutvarianten
(`braban[a-z]*`-patroon): geen enkele andere schrijffout gevonden. `package-lock.json`
(lokaal, alleen voor jsdom-tests, staat in `.gitignore` en wordt dus nooit meegecommit)
bevat wél "BrabantSchoon-main" als automatisch door npm afgeleide package-naam (komt
van de mapnaam) — dat is geen door de site of repository gebruikte merkvermelding en
blijft daarom buiten scope.

## 5. Wordt de officiële merknaam "Brabantschoon" nu overal gebruikt?

Ja, in alle levende/publieke bronnen: elke gegenereerde pagina, alle metadata/
structured data/alt-teksten/aria-labels/paginatitels, footer/header, offertewizard,
contactformulieren, foutmeldingen, `generate.py`, `js/main.js`, beide API-bestanden,
`sitemap.xml`, `robots.txt`, `vercel.json` en nu ook `README.md`. Alleen de historische
changelog-bestanden (zie punt 4) bevatten nog de oude schrijfwijze, bewust en
doelbewust ongewijzigd als historisch verslag.

## 6. Wat moet u nu zelf nog doen?

1. **Vercel**: niets nieuws bovenop ronde 40 — `WEB3FORMS_ACCESS_KEY` staat (of komt)
   al onder Project Settings → Environment Variables. Zodra u die heeft ingesteld,
   werken zowel de offertewizard als het contact-/footerformulier automatisch, zonder
   verdere Vercel-stappen voor deze ronde.
2. **Web3Forms**: geen nieuwe actie hier — als u de key al heeft geroteerd na ronde 40,
   hoeft u nu niets extra's te doen. Was u dat nog van plan: dat kan nu zonder de
   eerdere complicatie dat het contact-/footerformulier apart moest worden
   geregenereerd — beide endpoints lezen voortaan uitsluitend dezelfde
   `WEB3FORMS_ACCESS_KEY`-omgevingsvariabele.
3. **Upload naar GitHub**: zoals elke ronde — deze sandbox heeft geen gekoppelde
   Git-repository of GitHub-toegang tot uw Brabantschoon-repo, dus de wijzigingen zijn
   klaargezet als zip. Let bij het uploaden op de **verwijderde bestanden**: de 7
   verweesde root-level dienstpagina's (zie punt 1) moeten ook in uw GitHub-repo
   verwijderd worden — een zip-upload via GitHub's webinterface voegt bestanden toe/
   overschrijft ze, maar verwijdert normaal gesproken geen bestanden die niet in de
   zip zitten. Verwijder deze 7 bestanden dus handmatig in GitHub (of via `git rm`) als
   ze daar nog staan: `gevelreiniging.html`, `glasbewassing.html`,
   `kantoorreiniging.html`, `opleveringsschoonmaak.html`,
   `periodieke-schoonmaak.html`, `specialistische-reiniging.html`,
   `vve-schoonmaak.html` (allen op repo-root-niveau, niet de gelijknamige/correcte
   bestanden onder `diensten/`).

## 7. Getest

- `node test_contact_api.js` — alle 8 tests slagen (e-mailopbouw, validatie,
  botdetectie, key-uit-`process.env`-garantie, veilig falen zonder key, normaal
  verzenden mét (test-)key, bot/ontbrekende velden/verkeerde methode).
- `node test_offerte_api.js` — alle 12 tests slagen ongewijzigd (bevestigt dat de
  offertewizard/het endpoint niet is geraakt door deze ronde).
- `node test_wizard.js` (jsdom) — volledige wizard-flow (particulier en zakelijk)
  draait zonder fouten, exit code 0.
- `python3.12 generate.py` — alle 38 pagina's + `sitemap.xml` + `robots.txt` opnieuw
  gegenereerd zonder fouten; geen duplicate HTML-id's geïntroduceerd door de
  footerformulier-wijziging (de bekende, al langer bestaande duplicate id's binnen
  `offerte.html` horen bij de particulier/zakelijk-wizardstappen zelf en zijn dit
  keer niet aangeraakt).
- Repo-brede scan bevestigt 0 voorkomens van de oude Web3Forms-sleutel en 0 foutieve
  merknaamvermeldingen buiten de bewust ongewijzigde historische changelogs (zie punt
  3-4).
- **Niet mogelijk in deze sandbox**: een visuele controle op daadwerkelijk mobiel/
  desktop-scherm (geen browser beschikbaar) en een levende end-to-end test tegen de
  echte Web3Forms-API (vereist een echte, door u ingestelde key op een live Vercel-
  deployment). Er zijn geen CSS-wijzigingen doorgevoerd (de nieuwe statusregel
  hergebruikt de bestaande `.wizard-status`-stijl) en de formulierstructuur/-velden
  zijn ongewijzigd, dus een layoutregressie is niet te verwachten — maar een korte
  visuele controle door uzelf na deployment blijft aan te raden, met name van het
  contactformulier op `contact.html` en de footer op een willekeurige andere pagina.
