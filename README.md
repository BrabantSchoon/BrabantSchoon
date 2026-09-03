# Brabantschoon — website

Broncode van [brabantschoon.nl](https://www.brabantschoon.nl), een statische website
voor schoonmaakbedrijf Brabantschoon (gevestigd in Helmond, actief in Brabant).

## Hosting & deployment

- **Broncode:** GitHub repository.
- **Hosting/deployment:** [Vercel](https://vercel.com), gekoppeld aan deze GitHub-repo.
  Elke keer dat de inhoud van deze repo wijzigt (via een commit/upload naar de
  gekoppelde branch), start Vercel automatisch een nieuwe deployment.
- **Domeinredirects** (HTTPS-afdwingen, eventueel www-voorkeur) worden geregeld via de
  domein-instellingen in het Vercel-dashboard, niet via code in deze repo.
- Pad-redirects voor individuele pagina's (oude URL's die niet meer bestaan) staan wél
  in code, in `vercel.json` — zie hieronder.

## generate.py — dit is de bron van de website

**Belangrijk:** de HTML-bestanden in deze repo (`index.html`, `diensten/*.html`,
`schoonmaakbedrijf-*.html`, enz.) worden **gegenereerd** door `generate.py`. Dit is
geen restant van een oude workflow — het is actief de manier waarop deze site wordt
onderhouden.

**Wijzig dus nooit een `.html`-bestand rechtstreeks.** Wijzigingen die je in een
losse HTML-pagina aanbrengt, gaan verloren zodra `generate.py` opnieuw wordt
gedraaid — en omdat vrijwel elke content-wijziging via dat bestand hoort te gaan, is
dat vroeg of laat het geval.

### Hoe je een wijziging doorvoert

1. Zorg dat je Python 3 hebt geïnstalleerd (geen extra dependencies nodig — het
   script gebruikt alleen de Python-standaardbibliotheek).
2. Pas de relevante tekst, data of template aan in `generate.py`.
3. Draai het script vanuit de hoofdmap van de repo:
   ```
   python3 generate.py
   ```
4. Dit overschrijft alle gegenereerde bestanden: elke pagina in de root en in
   `diensten/`, plus `sitemap.xml` en `robots.txt`.
5. Commit/upload de gewijzigde bestanden (zowel `generate.py` zelf als de
   gegenereerde output) naar GitHub. Vercel deployt automatisch.

### Wat je in generate.py vindt

- **Merkconstanten** bovenaan: telefoonnummer, e-mailadres, KvK-nummer,
  Google Analytics-ID, `ASSET_VERSION` (cache-busting voor CSS/JS — ophogen bij elke
  wijziging aan `css/styles.css` of `js/main.js`).
- **`SERVICES`**: de 7 diensten (kantoorreiniging, glasbewassing, gevelreiniging,
  opleveringsschoonmaak, VvE-schoonmaak, periodieke schoonmaak, specialistische
  reiniging) — naam, korte omschrijving, bullets, FAQ's per dienst.
- **`SERVICE_PHOTOS`**: koppelt elke dienst aan een foto in `images/diensten/`. Zodra
  hier een bestandsnaam bij een dienst staat, gebruikt de site die foto automatisch
  op alle plekken waar die dienst getoond wordt (kaarten én detailpagina).
- **`KERNGEBIED`** (9 plaatsen: Helmond, Deurne, Asten, Someren, Gemert-Bakel,
  Laarbeek, Nuenen, Geldrop-Mierlo, Eindhoven) en **`LOCATIONS`** (4 plaatsen verder
  weg: Tilburg, Breda, Den Bosch, Waalwijk): de data achter de 13
  `schoonmaakbedrijf-{plaats}.html`-pagina's. Elke plaats heeft eigen velden
  (`intro`, `waarom`, `klanten`, `uitgelicht`, `doelgroep_lokaal`, `faqs`) met
  daadwerkelijk unieke, plaatsgebonden tekst — dit is bewust **geen** sjabloon
  waarbij alleen de plaatsnaam wordt vervangen. Nieuwe informatie over een
  specifieke plaats voeg je toe door het betreffende veld bij die plaats aan te
  passen, niet door een gedeelde functie te wijzigen.
- **Paginabouwers** (`build_home`, `build_diensten_overview`, `build_service_pages`,
  `build_over_ons`, `build_werkgebied`, `build_kerngebied_pages`,
  `build_location_pages`, `build_contact`, `build_thanks`, `build_legal`,
  `build_seo_files`): elk verantwoordelijk voor één pagina of pagina-groep, aangeroepen
  vanuit het `if __name__ == "__main__":`-blok onderaan het bestand.

### Wat generate.py NIET aanraakt

`css/styles.css`, `js/main.js`, `vercel.json`, alles in `images/` en dit
`README.md` worden **niet** gegenereerd en blijven gewoon staan wanneer je het
script draait. Wijzig deze bestanden rechtstreeks.

## Mappenstructuur

```
.
├── index.html                          Homepage
├── diensten.html                       Diensten-overzicht
├── diensten/                           7 losse dienstpagina's
├── schoonmaakbedrijf-{plaats}.html     13 lokale SEO-pagina's (zie hierboven)
├── werkgebied.html                     Werkgebied-overzicht (kerngebied + regio)
├── over-ons.html
├── contact.html                        Eenvoudig contactformulier
├── offerte.html                        Offertewizard (particulier + zakelijk/vve)
├── thanks.html                         Bedankpagina na formulierverzending
├── privacy.html / voorwaarden.html / cookiebeleid.html
├── css/styles.css                      Alle styling (huisstijlkleuren als CSS-variabelen)
├── js/main.js                          Offertewizard-logica, mobiel menu, scroll-reveal
├── api/offerte-aanvraag.js             Serverless function: e-mailopbouw + interne calculatie (zie hieronder)
├── images/
│   ├── logo.png, favicon.png, og-image.png
│   ├── hero.jpg, over-ons.jpg
│   ├── werkgebied-kerngebied.jpg, werkgebied-regio.jpg
│   └── diensten/{dienst}.jpg           Eén foto per dienst
├── generate.py                         Genereert alle HTML/sitemap/robots (zie boven)
├── vercel.json                         Redirects voor oude/verwijderde URL's
├── sitemap.xml / robots.txt            Gegenereerd — niet handmatig bewerken
└── README.md                           Dit bestand
```

## Bedrijfsfotografie

Alle foto's op de site (hero, over ons, de 6 gefotografeerde diensten, werkgebied)
zijn eigen bedrijfsfotografie in de huidige huisstijl en bedrijfskleding — geen
stockfoto's. Nieuwe foto's plaats je gewoon onder dezelfde bestandsnaam in `images/`
resp. `images/diensten/`; er is geen aparte stap nodig omdat de HTML er al naar
verwijst. Voor foto's die in een volle-breedte bannersectie komen (over-ons.html,
werkgebied.html, de lokale pagina's): gebruik een brede/panoramische uitsnede
(richting 2,4-2,6:1), anders knipt de banner het beeld te agressief bij.

Eén dienst — **specialistische reiniging** — heeft nog geen eigen nieuwe foto en
gebruikt tijdelijk nog een oudere afbeelding, in afwachting van een passend beeld.

## Formulieren

Alle formulieren op de site sturen **server-side** via **[Resend](https://resend.com)**
(`https://api.resend.com/emails`) — nooit rechtstreeks vanuit de browser. De
Resend API-sleutel staat dus nergens in publieke HTML of JavaScript; hij bestaat
alleen server-side, als omgevingsvariabele (zie "Secrets & environment variables"
hieronder). *Tot ronde 43 liep dit via Web3Forms; dat bleek zuivere
server-to-server aanroepen (zonder browser) te weigeren op een gratis abonnement,
wat een structurele `502` in productie veroorzaakte — zie `CHANGELOG-42.md` en
`CHANGELOG-43.md` voor de volledige migratie naar Resend.*

- **Compacte contactformulier** (`contact.html` + hetzelfde formulier in de footer op
  elke pagina, `id="footerTerugbelForm"`): de browser doet een `fetch()` met JSON naar
  het eigen endpoint **`/api/contact-aanvraag`** (`api/contact-aanvraag.js`, een
  Vercel Serverless Function). Dat endpoint valideert de verplichte velden
  (naam/telefoon/e-mail), past dezelfde honeypot-/timing-gebaseerde botdetectie toe
  als de offertewizard, bouwt de e-mail conditioneel op (geen lege
  bedrijfsnaam-/berichtregel, zowel platte tekst als HTML) en stuurt die zelf via
  Resend. De client-side logica staat in `initFooterForm()` in `js/main.js`. Zonder
  JavaScript toont het formulier een `<noscript>`-melding met een verwijzing naar
  telefoon/e-mail — er is bewust geen non-JS-fallback, net als bij de offertewizard.
  Bij een geslaagde inzending wordt de bezoeker doorgestuurd naar `thanks.html`.
- **Offertewizard** (`offerte.html`): stuurt een `fetch()` met JSON naar het eigen
  endpoint **`/api/offerte-aanvraag`** (`api/offerte-aanvraag.js`). Reden: alleen zo
  kan (1) de e-mail conditioneel worden opgebouwd — nooit lege/irrelevante velden,
  nooit particuliere woningvelden in een zakelijke aanvraag of andersom — en (2) de
  interne tijd-/kostprijs-/margecalculatie voor periodieke bedrijfsschoonmaak
  volledig server-side blijven, zodat een bezoeker deze nooit via devtools of
  netwerkverkeer kan achterhalen. De browser levert alleen de ruwe invoer aan
  (oppervlakte, exacte m², gebruiksintensiteit, ruimtes, vervuiling, frequentie);
  het endpoint berekent, bouwt de e-mail (platte tekst + HTML) en stuurt die zelf
  via Resend. **Sinds ronde 46 heet dit rekenmodel Calculator v2 en staat het
  volledig in `lib/calculator.js`** (niet meer in `api/offerte-aanvraag.js` zelf —
  dat bestand roept alleen nog `calculateOffer()` aan en bouwt er de e-mail omheen).
  Calculator v2 werkt met tijds-/prijs**bandbreedtes** in plaats van één
  schijnprecies bedrag, en geeft een betrouwbaarheidsniveau (Hoog/Middel/Laag,
  eventueel met "Locatieopname aanbevolen") — zie de commentaren bovenin
  `lib/calculator.js` voor de volledige `CONFIG` (ZZP-referentietarief,
  voertuigkosten/km, materiaalkosten, marges, minimumprijs, tijdmodel per m²/
  ruimte/intensiteit/vervuiling/frequentie) en `CHANGELOG-46.md`/`CHANGELOG-47.md`
  voor de volledige vergelijking met Calculator v1 (rondes 39-45) en de
  tijdmodel-/kilometerfallback-herkalibratie (ronde 47). Elke parameter die nog niet
  door de ondernemer is bevestigd/gekalibreerd staat daar expliciet gemarkeerd als
  `// TE BEVESTIGEN` of `// TE KALIBREREN`. **Sinds ronde 47** is de oude vaste
  kilometerfallback (20 km bij een onbekende afstand) volledig verwijderd uit de
  prijsberekening: een onbekende retourafstand telt nooit meer als gereden km mee
  (€0 voertuigkosten, expliciet "nog te bepalen" in de interne e-mail); alleen een
  daadwerkelijk ingevulde afstand (nieuw optioneel wizardveld, stap 10) telt mee
  tegen `VEHICLE_COST_PER_KM_EXCL_BTW`. Zie `CALC_DIENST_SLUGS` (nu in
  `lib/calculator.js`, met een noodzakelijke eigen kopie in `js/main.js` omdat de
  browser dat bestand niet rechtstreeks kan meelezen) voor welke diensten de
  calculator gebruiken — een zakelijke/VvE-aanvraag voor een dienst buiten dat
  bereik krijgt intern altijd een expliciete "Niet beschikbaar voor deze dienst" +
  "Handmatige calculatie / locatieopname aanbevolen"-melding — nooit een verzonnen
  bedrag en nooit een stilzwijgend ontbrekende sectie.
- **Dienstcontext vanaf een specifieke dienstpagina** (ronde 44): elke
  `diensten/<slug>.html`-pagina geeft zijn eigen wizard-dienst-slug mee aan de
  offerte-CTA's (zie `SERVICE_TO_WIZARD_DIENST_SLUG` in `generate.py`), zodat de
  wizard de vraag "Waar wilt u een offerte voor aanvragen?" overslaat wanneer de
  bezoeker al vanaf een specifieke dienst komt — de algemene offerteknop (vanaf de
  diensten-/zakelijke-schoonmaak-overzichtspagina) blijft die vraag wél gewoon
  stellen. Zie `CHANGELOG-44.md` voor de volledige dienstenmapping en de
  auto-advance-UX die in dezelfde ronde is toegevoegd.

Beide endpoints delen de daadwerkelijke Resend-verzendlogica via **`lib/mail.js`**
(zie "Gedeelde mailservice" hieronder) — dat voorkomt dubbele code voor iets dat écht
identiek is (de Resend-aanroep, headers, foutafhandeling, HTML-opmaak), terwijl elk
endpoint zijn eigen e-mailinhoud, velden en validatie behoudt (die verschillen
inhoudelijk te veel om samen te voegen, en dat hoeft ook niet).

## Gedeelde mailservice — `lib/mail.js`

`lib/mail.js` is de ENIGE plek in de repository die met Resend praat. Beide endpoints
importeren hieruit:
- **`verstuurEmail({ subject, html, text, replyTo, logPrefix })`** — leest de
  Resend-configuratie vers uit `process.env` bij elk verzoek, valt veilig terug
  (gooit een fout met `.reden = "server_misconfigured"`, ZONDER ooit een
  netwerkaanroep te doen) wanneer `RESEND_API_KEY` of `RESEND_FROM_EMAIL` ontbreekt,
  en stuurt anders een POST naar `https://api.resend.com/emails` met
  `Authorization: Bearer <RESEND_API_KEY>`. Bij een afwijzing door Resend zelf (bijv.
  een niet-geverifieerd domein) gooit de functie een fout met `.reden = "send_failed"`
  — de aanroepende handler zet dat om in een generieke `502`, nooit de
  Resend-foutmelding zelf naar de bezoeker.
- **`bouwEmailHtml({ titel, secties, noot })`** — bouwt een rustige, professionele
  HTML-e-mail (geen marketingvormgeving) uit dezelfde label/waarde-secties als de
  bestaande platte-tekstopbouw; escaped automatisch alle klantwaarden
  (HTML-injectiebescherming).
- **`escapeHtml()` / `enkeleRegel()` / `isValidEmail()`** — kleine, herbruikbare
  hulpfuncties (de laatste twee ook voor header-injectiebescherming: regeleindes/
  besturingstekens worden uit subject/reply_to gestript vóórdat ze naar Resend gaan).

Bewust **geen** npm-package (`resend`) gebruikt, maar een gewone `fetch()`-aanroep:
deze repository heeft geen enkele andere npm-dependency (geen `package.json` in de
repository zelf) en Vercel's zero-config `/api/*.js`-functies hebben geen build-stap
nodig — één dependency toevoegen voor één simpele POST-aanroep zou onnodige
complexiteit zijn. Vercel bundelt `require('../lib/mail.js')` in de serverless
function automatisch mee; dat werkt zonder enige extra configuratie.

## Secrets & environment variables

Geen van beide endpoints, en ook `lib/mail.js` niet, bevat een hardcoded Resend
API-sleutel. De configuratie wordt bij elk verzoek vers uit `process.env` gelezen
(zie `getResendConfig()` in `lib/mail.js`). In te stellen in het Vercel-dashboard:
**Project Settings → Environment Variables** (Production; ook Preview als u
pull-request-previews wilt testen):

| Variabele | Verplicht | Betekenis |
|---|---|---|
| `RESEND_API_KEY` | Ja | Uw Resend API-sleutel (begint met `re_`). Zonder deze variabele faalt elk endpoint veilig met een generieke `500` — er wordt **niets** verstuurd, de bezoeker krijgt nooit een valse succesmelding, en er wordt nooit een sleutelwaarde gelogd. |
| `RESEND_FROM_EMAIL` | Ja | Het afzenderadres, bijv. `Brabantschoon <noreply@brabantschoon.nl>`. Moet op een bij Resend **geverifieerd domein** staan (zie hieronder) — anders wijst Resend elke verzending af. Bewust GEEN default in code: een verzonnen adres zonder verificatie zou toch mislukken, en het is aan u welk adres u kiest. |
| `RESEND_TO_EMAIL` | Nee | De ontvanger. Valt terug op `info@brabantschoon.nl` (het bestaande, overal al zichtbare bedrijfsadres — geen secret) wanneer niet ingesteld. Alleen nodig als aanvragen naar een ander adres moeten. |

Dit zijn allemaal **server-only** variabelen — gebruik geen client-side prefix zoals
`NEXT_PUBLIC_` of vergelijkbaar; ze horen nooit in de browserbundel terecht te komen,
en dat gebeurt ook niet (beide endpoints en `lib/mail.js` draaien uitsluitend
server-side).

**Resend-domeinverificatie — dit moet u zelf doen, ik kan dit niet voor u
verzinnen:** Resend vereist dat het verzenddomein (`brabantschoon.nl`) geverifieerd
is via DNS voordat u vanaf een adres op dat domein kunt versturen. Zonder verificatie
werkt alleen het testadres `onboarding@resend.dev`, en dát mag uitsluitend naar het
eigen, bij Resend geregistreerde accountadres versturen — niet bruikbaar voor een
live contactformulier waar willekeurige bezoekers aanvragen indienen. Stappen (in
het Resend-dashboard, exacte DNS-records toont Resend u zelf zodra u een domein
toevoegt — die verzin ik hier niet):
1. Account aanmaken/inloggen op resend.com.
2. Domein `brabantschoon.nl` toevoegen onder **Domains**.
3. De door Resend getoonde DNS-records (SPF/DKIM, mogelijk DMARC) instellen bij uw
   domeinregistrar/DNS-provider.
4. Domein verifiëren in het Resend-dashboard (kan enige tijd duren na het instellen
   van de DNS-records).
5. Een geschikt afzenderadres op dat domein kiezen (bijv. `noreply@brabantschoon.nl`
   of `aanvragen@brabantschoon.nl`) en dat als `RESEND_FROM_EMAIL` in Vercel
   instellen.

Voor lokaal testen: kopieer `.env.example` naar `.env` en vul uw eigen waarden in.
`.env` staat in `.gitignore` en wordt dus nooit meegecommit. (De site zelf heeft hier
niets aan nodig — `python3 -m http.server` gebruikt geen `.env`; dit is alleen
relevant wanneer u `api/offerte-aanvraag.js`/`api/contact-aanvraag.js`/`lib/mail.js`
lokaal via Node aanroept, zie "Lokaal testen" hieronder.)

**`reply_to` — "Beantwoorden" gaat naar de klant, niet naar het noreply-adres.** Beide
endpoints geven het door de klant ingevulde, server-side gevalideerde e-mailadres mee
als `reply_to` aan Resend (nooit een ongeldig adres — dat wordt vóór verzending al
geweerd door de bestaande veldvalidatie). Klikt u in uw mailbox op "Beantwoorden", dan
gaat het antwoord dus naar de klant.

## SEO-opbouw

- **Title & meta description**: uniek per pagina. Algemene pagina's (homepage,
  diensten-overzicht, werkgebied-overzicht, de 7 losse dienstpagina's) positioneren
  Brabantschoon Brabant-breed. De 13 lokale `schoonmaakbedrijf-{plaats}`-pagina's
  richten zich juist bewust op die ene plaats — dat is waar ze op moeten scoren.
- **Canonical tags**: op elke pagina, gegenereerd vanuit `SITE_URL` + het pad.
- **Open Graph / Twitter Card**: op elke pagina, met `images/og-image.png` als
  gedeelde afbeelding.
- **Structured data (JSON-LD)**: `Organization` site-breed, `LocalBusiness` +
  `CleaningService` op home/contact/lokale pagina's, `Service` op elke
  dienstenpagina, `BreadcrumbList` op alle binnenpagina's, `FAQPage` waar een
  FAQ-sectie staat.
- **`sitemap.xml`** en **`robots.txt`**: worden gegenereerd door `generate.py`
  (functie `build_seo_files`) — bevatten automatisch elke pagina die het script
  daadwerkelijk aanmaakt. Een pagina die niet meer gegenereerd wordt, verdwijnt dus
  ook automatisch uit de sitemap.
- **`vercel.json`**: 301-redirects voor URL's die ooit bestonden maar nu niet meer
  (oude mapstructuur, verwijderde pagina's zoals de vroegere prijscalculator). Deze
  redirects blijven bewust staan, ook als de oude pagina al lang weg is — dat is
  precies waar een redirect voor dient.

## Lokaal testen

Geen build-stap nodig voor de statische pagina's. Vanuit de hoofdmap:
```
python3 -m http.server 8000
```
en open `http://localhost:8000/` in de browser.

**Let op:** een gewone `http.server` voert `/api/offerte-aanvraag.js` niet uit (dat
is alleen een Vercel Serverless Function) — de offertewizard kan dan dus niet
daadwerkelijk verzenden. Om alleen de e-mailopbouw en interne calculatie te testen
(zonder Vercel of een echte deploy nodig te hebben), gebruik je de functies in
`api/offerte-aanvraag.js` rechtstreeks vanuit Node, bijvoorbeeld:
```js
const { calculateOffer, bouwEmailTekst, bouwOnderwerp } = require('./api/offerte-aanvraag.js')._internal;
```
Of, om Calculator v2 helemaal los van de e-mailopbouw/HTTP-laag te testen:
```js
const { calculateOffer } = require('./lib/calculator.js');
```
Wil je de complete wizard-flow (stapnavigatie, conditionele velden, de payload die
naar het endpoint zou gaan) end-to-end simuleren zonder een browser, dan kan dat met
[jsdom](https://www.npmjs.com/package/jsdom) (`npm install jsdom`) door
`offerte.html` + `js/main.js` in een virtuele DOM te laden en de wizard te bedienen
zoals een bezoeker dat zou doen.

`test_mail.js` (`node test_mail.js`) test de gedeelde mailservice in `lib/mail.js`
rechtstreeks en in isolatie: `escapeHtml`, `enkeleRegel` (header-injectiebescherming),
`isValidEmail`, `getResendConfig` (uitsluitend via env-variabelen, geen hardcoded
waarden), `bouwEmailHtml` (escaping, weglaten van lege secties) en `verstuurEmail`
zelf — inclusief dat er bij een ontbrekende `RESEND_API_KEY`/`RESEND_FROM_EMAIL`
géén netwerkverzoek wordt gedaan, dat de juiste `Authorization`/`from`/`to`/`reply_to`
velden worden meegestuurd (met een verzonnen testwaarde en een gemockte `fetch`, nooit
een echt netwerkverzoek naar Resend), en dat foutlogging bij een afgewezen verzoek of
netwerkfout nooit de API-key of klantgegevens bevat.

`test_offerte_api.js` (`node test_offerte_api.js`) en `test_contact_api.js`
(`node test_contact_api.js`) draaien zonder jsdom en zonder een echte
`RESEND_API_KEY` nodig te hebben — ze testen onder andere expliciet dat het
betreffende endpoint veilig faalt (geen "verzonden"-melding, geen secret in de
foutmelding/log, HTTP 500) wanneer `RESEND_API_KEY` of `RESEND_FROM_EMAIL`
ontbreekt, dat verzending normaal verloopt zodra ze aanwezig zijn (met een verzonnen
testwaarde en een gemockte `fetch`, nooit een echt netwerkverzoek naar Resend), dat
een afwijzing door Resend resulteert in HTTP 502 met veilige logging, en dat er geen
Web3Forms-referenties of `RESEND_API_KEY`-literals in de eigen broncode voorkomen.

`test_calculator.js` (`node test_calculator.js`, uitgebreid in ronde 47) test
Calculator v2 (`lib/calculator.js`) volledig losstaand van de e-mailopbouw/HTTP-laag:
de vloeiende tijdscurve per m² (incl. grenswaardetests op 50/51, 100/101, 150/151,
250/251 m²), exacte m² vs. categorie-fallback, rustig/gemiddeld/intensief,
reguliere vs. bijzondere vervuiling (incl. het autogarage-regressiescenario uit de
ronde-47-brief, met de expliciete eis dat de garage nooit meer richting 2+ uur
schiet), alle frequentiepaden, materiaalkosten, de kilometerfallback-verwijdering
(nooit een verzonnen afstand, alleen een expliciet opgegeven retourafstand telt
mee), de minimumprijs, de adviesprijs-/maandbandbreedte-afronding, het maximaal
verantwoorde ZZP-tarief + de Uitbesteedbaarheid-classificatie, en de
betrouwbaarheidsbeoordeling.

`test_wizard.js` (`npm install jsdom` vereist) simuleert de complete
offertewizard-flow end-to-end in een virtuele DOM, inclusief (sinds ronde 46) het
exacte-m²-veld en de gebruiksintensiteit-vraag, en het volledige
autogarage-regressiescenario van submit tot aan `calculateOffer()`.
