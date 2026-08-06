# BrabantSchoon — website

Broncode van [brabantschoon.nl](https://www.brabantschoon.nl), een statische website
voor schoonmaakbedrijf BrabantSchoon (gevestigd in Helmond, actief in Brabant).

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
├── contact.html                        Offertewizard + contactformulier
├── thanks.html                         Bedankpagina na formulierverzending
├── privacy.html / voorwaarden.html / cookiebeleid.html
├── css/styles.css                      Alle styling (huisstijlkleuren als CSS-variabelen)
├── js/main.js                          Offertewizard-logica, mobiel menu, scroll-reveal
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

Zowel de offertewizard op `contact.html` als het compacte formulier in de footer
sturen rechtstreeks naar **[Web3Forms](https://web3forms.com)**
(`https://api.web3forms.com/submit`) — een gratis, serverless formulierdienst zonder
eigen backend nodig. De access key staat als verborgen veld in het formulier zelf.
Bij een geslaagde inzending wordt de bezoeker doorgestuurd naar `thanks.html`.

## SEO-opbouw

- **Title & meta description**: uniek per pagina. Algemene pagina's (homepage,
  diensten-overzicht, werkgebied-overzicht, de 7 losse dienstpagina's) positioneren
  BrabantSchoon Brabant-breed. De 13 lokale `schoonmaakbedrijf-{plaats}`-pagina's
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

Geen build-stap nodig. Vanuit de hoofdmap:
```
python3 -m http.server 8000
```
en open `http://localhost:8000/` in de browser.
