# BrabantSchoon — v5

Volledig herontwerp volgens de strengere brief: eigen illustratiestijl (geen foto's),
géén onbewezen claims, géén verzonnen reviews, en het woonadres alleen als stad
(Helmond) vermeld — nergens de straatnaam.

## Structuur

```
brabantschoon-v5/
├── index.html
├── diensten.html
├── diensten/
│   ├── kantoorreiniging.html
│   ├── glasbewassing.html
│   ├── gevelreiniging.html
│   ├── opleveringsschoonmaak.html
│   ├── vve-schoonmaak.html
│   ├── periodieke-schoonmaak.html
│   └── specialistische-reiniging.html
├── over-ons.html
├── werkgebied.html
├── contact.html
├── thanks.html
├── privacy.html
├── voorwaarden.html
├── robots.txt / sitemap.xml / netlify.toml
├── css/styles.css
├── js/main.js
├── images/ (logo, favicon, og-image)
└── generate.py   ← alle pagina's worden hiermee gegenereerd
```

## Wat is er veranderd t.o.v. v3/v4

- **Navigatie vereenvoudigd**: Home, Diensten, Over ons, Werkgebied, Contact + knop
  "Offerte aanvragen" — geen Branches, geen Projecten, geen dropdown-menu.
- **Illustraties in plaats van foto's**: elke hero en dienstenkaart heeft nu een eigen,
  afgewerkte lijnillustratie in uw merkkleuren (venster, sleutel, gebouw, klok, etc.),
  zonder enige "vervang deze afbeelding"-tekst. Dit is een bewuste, afgeronde designkeuze.
- **Geen onbewezen claims verwijderd**: "volledig verzekerd", "gescreend personeel" en
  vergelijkbare uitspraken zijn eruit gehaald, omdat ik dit niet kan verifiëren. Wat blijft
  staan is uw KvK-nummer (99274175) — dat is een controleerbaar feit, geen marketingclaim.
- **Reviews**: geen verzonnen testimonials meer. In plaats daarvan een nette, eerlijke
  sectie die aangeeft dat hier binnenkort echte klantbeoordelingen komen.
- **Werkgebied bijgewerkt**: focus op {CITY} en de Peelgemeenten (Deurne, Asten, Someren,
  Gemert-Bakel, Laarbeek), met Eindhoven, Geldrop-Mierlo, Nuenen en Mierlo als aanvullend
  gebied. Een regel geeft aan dat opdrachten daarbuiten in overleg mogelijk zijn.
- **Adres**: nergens een straatnaam. Alleen "Helmond" wordt genoemd, ook in de
  onzichtbare schema-markup voor Google (géén huisnummer of postcode).

## Live zetten op Netlify

1. **Pak eerst de zip volledig uit** op uw computer.
2. Open de uitgepakte map `brabantschoon-v5` — u moet meerdere bestanden en mappen naast
   elkaar zien (`index.html`, `css`, `js`, `images`, `diensten`, etc.).
3. Ga naar [app.netlify.com](https://app.netlify.com) → uw site → tabblad **Deploys**.
4. Selecteer **alle inhoud van de map** (Ctrl+A / Cmd+A) en sleep dit in het upload-vak.
5. Controleer in de deploy-summary dat er meerdere bestanden zijn geüpload (niet "1 new
   file uploaded" — dat betekent dat alleen `index.html` is meegekomen).

## Nog te doen

- [ ] Social media-profielen: als u die heeft, kunnen die aan de footer toegevoegd worden
- [ ] Privacyverklaring en algemene voorwaarden laten controleren door een jurist
- [ ] Zodra u zelf reviews verzamelt: laat het weten, dan bouw ik de reviews-sectie verder uit

## SEO & performance optimalisatie (laatste update)

**Structured data (JSON-LD)**
- `Organization` op elke pagina (site-breed)
- `LocalBusiness` + `CleaningService` op home en contact
- `Service` op elke dienstenpagina
- `BreadcrumbList` op alle binnenpagina's, exact overeenkomend met de zichtbare broodkruimel
- `FAQPage` op de homepage en op elke dienstenpagina (2 vragen per dienst)
- Alle JSON-LD is gevalideerd op correcte syntax

**Metadata**
- Elke pagina heeft een unieke title en meta description (gecontroleerd op duplicaten — geen enkele dubbele)
- Titles/descriptions verwijzen natuurlijk naar kernsteden (Helmond, Eindhoven) zonder keyword stuffing

**Local SEO**
- De werkgebiedpagina heeft nu een uniek, natuurlijk geschreven paragraaf per gemeente (Helmond, Deurne, Asten, Someren, Gemert-Bakel, Laarbeek, Eindhoven, Geldrop-Mierlo, Nuenen, Mierlo) — geen gekopieerde sjabloontekst
- Losse vermeldingen van "Gemert", "Geldrop" en "Mierlo" naast de officiële gemeentenamen, voor herkenbaarheid bij lokale zoekopdrachten

**Performance / Core Web Vitals**
- Hero-afbeelding: `fetchpriority="high"`, preload in de `<head>`, geen lazy loading (dit is het LCP-element)
- Alle overige afbeeldingen: `loading="lazy"`, `decoding="async"`, expliciete `width`/`height` (voorkomt layout shifts / CLS)
- JavaScript geladen met `defer`, minimale hoeveelheid custom JS
- Geen zware frameworks, alleen platte HTML/CSS/JS

**Toegankelijkheid**
- "Ga direct naar inhoud"-skiplink voor toetsenbordgebruikers
- Tekstcontrast doorgelicht en verbeterd: linkkleur en knopkleuren zijn aangepast naar varianten die aan WCAG AA voldoen
- Zichtbare focus-status op het hamburgermenu bij toetsenbordnavigatie
- Sticky mobiele actiebalk (Bel direct / Vrijblijvende offerte) altijd binnen handbereik

**Belangrijk om te weten:** ik heb geen tool om Google PageSpeed Insights of Lighthouse hier daadwerkelijk te draaien, dus ik kan geen exacte score garanderen. Alle bovenstaande maatregelen zijn wel de erkende best practices die naar een groene score toewerken. Test de site na livegang zelf via pagespeed.web.dev en laat het weten als er nog iets opvalt.

## Overstap naar Nederlandse hosting (i.p.v. Netlify)

De site is nu losgekoppeld van Netlify Forms en gebruikt een eigen PHP-script
(`send-offerte.php`) om offerteaanvragen per e-mail te versturen. Dit werkt op
vrijwel elk Nederlands shared-hostingpakket, zoals **TransIP**, **Hostnet**,
**Antagonist** of **Vimexx** — zonder extra configuratie, zolang PHP beschikbaar is
(dat is bij alle genoemde partijen standaard het geval).

### Wat je nodig hebt
- Een shared-hostingpakket met PHP-ondersteuning (elk basispakket voldoet)
- FTP-toegang (krijg je bij het hostingpakket) of een bestandsbeheerder in het
  klantenpaneel van je hostingprovider

### Live zetten
1. Log in bij je hostingprovider en zoek de **bestandsbeheerder** of gebruik een
   FTP-programma zoals FileZilla.
2. Upload **de hele inhoud** van de map `brabantschoon-v5` naar de hoofdmap van je
   hostingpakket (vaak `public_html`, `htdocs` of `www` genoemd — check de
   documentatie van je provider).
3. Zorg dat `index.html` direct in die hoofdmap staat, niet in een submap.
4. Koppel je domein `brabantschoon.nl` aan dit hostingpakket via de DNS-instellingen
   bij je hostingprovider (zij kunnen je hier altijd bij helpen als je vastloopt).

### Testen of het offerteformulier werkt
Vul het formulier één keer zelf in op de live site. Komt de e-mail aan op
`info@brabantschoon.nl`? Dan werkt alles. Komt er niets binnen, check dan:
- Staat PHP aan voor dit hostingpakket? (meestal standaard aan, maar te checken in
  het klantenpaneel)
- Kijk ook in je spamfolder — soms wordt de eerste e-mail vanaf een nieuw domein
  als spam gemarkeerd
- Twijfel je? Neem contact op met de support van je hostingprovider — dit is een
  standaardvraag die zij dagelijks krijgen

### Wat is er veranderd in de code
- `netlify.toml` is vervangen door `.htaccess` (forceert HTTPS en www, cachet
  afbeeldingen/CSS, verbergt mapoverzichten — de Apache-standaard bij Nederlandse
  hosting)
- Het offerteformulier verwijst nu naar `/send-offerte.php` in plaats van naar
  Netlify Forms
- De spambeveiliging (honeypot-veld) werkt nu via het PHP-script in plaats van via
  Netlify
