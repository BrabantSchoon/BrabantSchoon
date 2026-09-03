# Changelog — Brabantschoon website (ronde 43: migratie Web3Forms → Resend)

Deze ronde bevat geen wijzigingen aan de calculator, de wizard-UX of de zichtbare
content van de site. Het is uitsluitend een migratie van de server-side
mailverzending: van Web3Forms naar Resend.

## 1. Waarom is Web3Forms verwijderd?

Zie CHANGELOG-42.md voor de volledige diagnose. Kort samengevat: na het instellen van
`WEB3FORMS_ACCESS_KEY` in Vercel gaf de offertewizard live een `502`. Onderzoek naar
Web3Forms' API-gedrag wees op een structurele beperking: Web3Forms is primair gebouwd
voor formulieren die **rechtstreeks vanuit de browser** posten, en blokkeert (op het
gratis abonnement, zonder IP-whitelisting en betaald plan) zuivere
server-to-server-aanroepen zoals een Vercel Serverless Function die doet. Dat is
precies onze architectuur (klant → onze server → mailservice), dus deze beperking zou
blijven terugkomen, ongeacht verdere debugging. Resend is daarentegen expliciet
gebouwd en gedocumenteerd voor backend/server-side verzending — dat is er de normale,
bedoelde gebruikswijze, zonder IP-whitelisting-vereiste.

## 2. Welke bestanden zijn gewijzigd?

Nieuw:
- **`lib/mail.js`** — nieuwe gedeelde mailservice (zie punt 5).
- **`test_mail.js`** — nieuwe tests voor `lib/mail.js`.
- **`CHANGELOG-43.md`** — dit bestand.

Gewijzigd:
- **`api/offerte-aanvraag.js`** — Web3Forms-verzendcode verwijderd, gebruikt nu
  `lib/mail.js`. Calculator (`CONFIG`, `berekenInterneCalculatie()`) **niet
  aangeraakt** (zie punt 15).
- **`api/contact-aanvraag.js`** — zelfde migratie, geldt voor zowel het
  contactformulier als het footerformulier (beide lopen door dit ene endpoint).
- **`test_offerte_api.js`** — de Web3Forms-specifieke tests vervangen door
  Resend-equivalenten; alle calculator-/inhoudstests ongewijzigd.
- **`test_contact_api.js`** — zelfde aanpak.
- **`js/main.js`** — uitsluitend commentaarregels bijgewerkt (geen enkele
  functionele/logica-wijziging; geverifieerd met `node --check` en met
  `test_wizard.js`, die byte-voor-byte dezelfde payload naar het endpoint blijft
  bouwen).
- **`.env.example`** — bevat nu `RESEND_API_KEY`, `RESEND_FROM_EMAIL`,
  `RESEND_TO_EMAIL` (leeg, geen echte waarden). Zie de kanttekening in punt 6 over
  waarom hier bewust van de letterlijke instructie is afgeweken.
- **`.gitignore`** — commentaarregel bijgewerkt (verwijst nu naar de
  Resend-variabelen i.p.v. `WEB3FORMS_ACCESS_KEY`; de daadwerkelijke ignore-regels
  zijn ongewijzigd).
- **`README.md`** — secties "Formulieren", "Secrets & environment variables" en
  "Lokaal testen" bijgewerkt; nieuwe sectie "Gedeelde mailservice — `lib/mail.js`"
  toegevoegd.

Bewust **niet** gewijzigd: `generate.py` (geen enkele Web3Forms/Resend-referentie
aanwezig — de HTML-pagina's praten alleen tegen `/api/offerte-aanvraag` en
`/api/contact-aanvraag`, wat architectuur-onafhankelijk is van wat daarachter zit),
alle gegenereerde HTML-pagina's (geen regeneratie nodig — zie punt 16), `vercel.json`
(bevat uitsluitend redirects, geen Web3Forms/Resend-referenties), en alle historische
`CHANGELOG-*.md`-bestanden (die blijven Web3Forms noemen als geschiedenis, zoals het
hoort).

## 3. Hoe worden offerte-e-mails nu verstuurd?

`api/offerte-aanvraag.js` bouwt — exact zoals voorheen — de platte-tekst-e-mail via
`bouwEmailTekst()` (onveranderd) en nu **ook** een HTML-versie via de nieuwe
`bouwEmailHtmlOfferte()`, met identieke secties en inhoud. Beide worden meegegeven aan
`verstuurEmail()` uit `lib/mail.js`, die de e-mail via de Resend REST-API
(`POST https://api.resend.com/emails`) verstuurt. Alle content-eisen uit uw brief
(NIEUWE ZAKELIJKE OFFERTEAANVRAAG / Bedrijfsnaam / Plaats / AANVRAAG / INTERNE
CALCULATIE met alle genoemde regels / de disclaimer "Interne prijsindicatie – niet
automatisch aan de klant gecommuniceerd en geen definitieve offerte." / CONTACTGEGEVENS)
staan zowel in de tekst- als de HTML-versie, alleen ingevulde velden, geen
0/null/undefined-regels, en de interne calculatie verschijnt alleen bij een
zakelijke, periodieke aanvraag — precies zoals voorheen.

## 4. Hoe worden contact-/footer-e-mails nu verstuurd?

Zelfde principe: `api/contact-aanvraag.js` bouwt tekst (`bouwEmailTekst()`,
onveranderd) + HTML (nieuwe `bouwEmailHtmlContact()`) en stuurt via dezelfde
`verstuurEmail()`. Dit endpoint bedient zowel het hoofdcontactformulier als het
footerformulier (dat was al zo, is niet gewijzigd) — voor de klant verandert er
zichtbaar niets: zelfde velden, validatie, honeypot, succes-/foutmelding, en
mobiel gedrag.

## 5. Welke gedeelde mailservice is gebruikt?

Een nieuwe `lib/mail.js`, gebruikt door beide endpoints, met:
- `getResendConfig()` — leest `RESEND_API_KEY`/`RESEND_FROM_EMAIL`/`RESEND_TO_EMAIL`
  uitsluitend uit `process.env`, meldt welke verplichte variabelen ontbreken.
- `escapeHtml()` — escaped alle klantinvoer die in de HTML-mail terechtkomt
  (voorkomt HTML-injectie).
- `enkeleRegel()` — verwijdert regeleindes/besturingstekens uit `subject`/`reply_to`
  (bescherming tegen header-injectie, ook al voorkomt Resend's JSON-API dit al
  grotendeels zelf).
- `isValidEmail()` — server-side validatie voordat een adres als `reply_to` gebruikt
  wordt.
- `bouwEmailHtml()` — gedeelde HTML-sjabloon (rustige, professionele opmaak in de
  huisstijlkleuren, geen overdreven marketingstyling), gebruikt door beide endpoints
  via hun eigen `bouwEmailHtmlOfferte()`/`bouwEmailHtmlContact()`.
- `verstuurEmail()` — de daadwerkelijke Resend-aanroep, met veilige foutafhandeling
  (zie punt 9 hieronder / vraag 9 uit uw brief).

Dit voorkomt dubbele code tussen de twee endpoints, zonder een onnodig zware
architectuur op te tuigen — elk endpoint bouwt nog steeds zijn eigen e-mailinhoud en
validatie, alleen het "versturen" zelf is gedeeld.

**Waarom een rechtstreekse `fetch()`-aanroep i.p.v. het officiële `resend`
npm-pakket?** Deze repository committeert bewust geen `package.json`/dependencies
(die worden alleen lokaal en tijdelijk gebruikt voor jsdom-tests, en altijd weer
verwijderd) — Vercel's `/api/*.js`-functions draaien zonder build-stap. Een
rechtstreekse REST-aanroep naar Resend's goed gedocumenteerde JSON-API vergt geen
extra dependency-beheer en past bij die bestaande, bewust eenvoudige opzet.

## 6. Welke environment-variabelen zijn nodig in Vercel?

| Variabele | Verplicht | Betekenis |
|---|---|---|
| `RESEND_API_KEY` | Ja | Uw Resend API-sleutel. Nooit hardcoded, nooit in de repo. |
| `RESEND_FROM_EMAIL` | Ja | Het afzenderadres, bijv. `Brabantschoon <noreply@brabantschoon.nl>`. **Geen code-default** — zie punt 9, dit adres moet u zelf bepalen/verifiëren. |
| `RESEND_TO_EMAIL` | Nee | Ontvangeradres voor aanvragen. Valt in de code terug op `info@brabantschoon.nl` (uw eigen, al publieke bedrijfsadres — geen geheim) als u hem niet instelt. |

Geen van deze drie mag een `NEXT_PUBLIC_`-achtig voorvoegsel krijgen — het zijn
server-only secrets/config, nooit client-side zichtbaar.

**Kanttekening over `.env.example`**: uw brief zei op één plek dat `.env.example`
uitsluitend `RESEND_API_KEY=` mag bevatten, terwijl elders in dezelfde brief expliciet
om alle drie de variabelen als env-config wordt gevraagd (voor Vercel). Ik heb ervoor
gekozen om alle drie in `.env.example` op te nemen — leeg, zonder enige echte waarde —
zodat lokale/Vercel-documentatie consistent is met wat daadwerkelijk nodig is. Als u
liever alleen `RESEND_API_KEY=` in `.env.example` ziet staan, laat het weten, dan pas
ik dat in één regel aan.

## 7. Wat moet u zelf nog in Resend instellen?

1. Resend-account aanmaken/inloggen op resend.com.
2. Onder "Domains" het domein `brabantschoon.nl` toevoegen.
3. Resend toont u dan **zelf** een set DNS-records (meestal SPF/DKIM, soms een extra
   verificatierecord) — die zet u bij uw DNS-provider. **Ik verzin deze records hier
   niet**; zodra u ze in uw Resend-dashboard ziet, kunt u ze mij doorgeven en help ik
   ze correct te plaatsen/controleren.
4. Wachten tot Resend het domein als "Verified" toont (kan van minuten tot enkele
   uren duren, afhankelijk van DNS-propagatie).
5. Pas daarna kunt u een adres op `brabantschoon.nl` als `RESEND_FROM_EMAIL` gebruiken
   (bijv. `Brabantschoon <noreply@brabantschoon.nl>`).

## 8. Is domeinverificatie verplicht?

Ja, om vanaf een `@brabantschoon.nl`-adres te versturen. Zonder geverifieerd domein
biedt Resend alleen `onboarding@resend.dev` aan, wat bovendien alleen naar het eigen
Resend-accountadres mag versturen — niet bruikbaar voor een publiek formulier dat naar
`info@brabantschoon.nl` moet gaan. Domeinverificatie is dus in de praktijk een
vereiste stap voordat de offerte-/contactformulieren daadwerkelijk e-mail kunnen
afleveren, niet optioneel.

## 9. Welk afzenderadres wordt verwacht?

De code verzint dit adres niet en heeft er ook geen fallback voor — `RESEND_FROM_EMAIL`
is verplicht en moet door u worden ingesteld zodra het domein geverifieerd is.
Voorstel, in lijn met uw brief: `Brabantschoon <noreply@brabantschoon.nl>` — maar de
uiteindelijke keuze (bijv. een ander adres op hetzelfde domein) is aan u; de code is
hier volledig centraal configureerbaar via die ene omgevingsvariabele.

## 10. Werkt reply-to correct?

Ja. Zowel `api/offerte-aanvraag.js` als `api/contact-aanvraag.js` geven het door de
klant ingevulde e-mailadres door als `replyTo` aan `verstuurEmail()`. Die valideert
het adres server-side (`isValidEmail()`) vóórdat het als `reply_to` wordt meegestuurd
— een ongeldig adres wordt gewoon weggelaten (de e-mail wordt dan nog steeds verstuurd,
alleen zonder reply-to), nooit klakkeloos doorgestuurd. Dit is getest in zowel
`test_mail.js` (Test 8) als beide API-tests. Resultaat: "Beantwoorden" in de mailbox
gaat naar de klant, niet naar het noreply-adres.

## 11. Welke tests zijn uitgevoerd?

- `node test_mail.js` — 10 tests voor `lib/mail.js` zelf (escaping, header-injectie-
  bescherming, e-mailvalidatie, config uitsluitend uit env, HTML-opbouw, en 5
  scenario's voor `verstuurEmail()`: ontbrekende config, normale verzending,
  ongeldig replyTo, Resend-foutrespons, netwerkfout — telkens met veilige logging
  geverifieerd).
- `node test_offerte_api.js` — 14 tests: de 9 bestaande calculator-/inhoudstests
  (ongewijzigd, incl. de "Garagebedrijf Van Brussel"-scenario) + 5 nieuwe/vervangen
  tests voor de Resend-migratie (geen Web3Forms/geheime sleutel meer in de broncode,
  HTML-mail-inhoud + escaping, handler zonder config, handler met config, handler bij
  Resend-afwijzing).
- `node test_contact_api.js` — 10 tests: 4 bestaande inhouds-/validatietests
  (ongewijzigd) + 6 nieuwe/vervangen tests, zelfde opzet als hierboven.
- `node test_wizard.js` — alle bestaande end-to-end wizard-scenario's (jsdom),
  inclusief de exacte payload-vorm richting `/api/offerte-aanvraag` — ongewijzigd
  gedrag bevestigd.

## 12. Slagen alle tests?

Ja — alle 4 testbestanden zijn deze ronde volledig gedraaid en eindigen met "Alle
tests geslaagd." / exit code 0, zonder enige regressie in de bestaande tests.

## 13. Is Web3Forms volledig weg uit de actieve flow?

Ja. Een repo-brede zoekactie (met uitzondering van historische changelogs, die
bewust ongewijzigd blijven) toont alleen nog: (a) verklarende commentaarregels die de
migratie documenteren ("was Web3Forms, zie CHANGELOG-42.md/CHANGELOG-43.md"), en (b)
geautomatiseerde tests die expliciet controleren dát er geen Web3Forms-endpoint of
`WEB3FORMS_ACCESS_KEY`-verwijzing meer in de actieve broncode staat. Nergens wordt
`https://api.web3forms.com/submit` nog daadwerkelijk aangeroepen.

## 14. Kan `WEB3FORMS_ACCESS_KEY` uit Vercel verwijderd worden?

Ja — zodra u bevestigd heeft dat de nieuwe Resend-flow werkt (na de stappen in
punt 16), kan `WEB3FORMS_ACCESS_KEY` volledig uit Vercel's Environment Variables
verwijderd worden. De code leest deze variabele nergens meer.

## 15. Is de offertecalculator ongewijzigd?

Ja, functioneel en inhoudelijk volledig ongewijzigd. In `api/offerte-aanvraag.js` is
uit `CONFIG` uitsluitend de `WEB3FORMS_ENDPOINT`-sleutel verwijderd (die had toch al
niets met de calculator te maken); alle financiële parameters
(`INTERNAL_HOURLY_COST_EXCL_BTW`, `DESIRED_GROSS_MARGIN`, `MIN_PRICE_PER_VISIT_EXCL_BTW`,
reis-, materiaal- en overige kosten, `VAT_RATE_PERCENT`, het volledige `TIME_MODEL`
met `BASE_MINUTES_BY_OPPERVLAKTE`/`ROOM_EXTRA_MINUTES`/`VERVUILING_FACTOR`) staan
letterlijk nog zoals ze waren. `berekenInterneCalculatie()` zelf is geen letter
aangeraakt. Test 2 in `test_offerte_api.js` herberekent de volledige calculatie
onafhankelijk voor het bekende "Garagebedrijf Van Brussel"-scenario en bevestigt
identieke uitkomsten (o.a. adviesprijs €86,12 excl. btw per bezoek, marge 35,0%) aan
eerdere rondes.

## 16. Risico's en vervolgstappen

**Zo migreert u veilig:**
1. Upload/push deze bijgewerkte bestanden naar GitHub (Vercel deployt automatisch).
2. Stel `RESEND_API_KEY` in bij Vercel → Project Settings → Environment Variables.
3. Stel `RESEND_FROM_EMAIL` in (pas nadat het domein in Resend geverifieerd is — zie
   punt 7/8) en optioneel `RESEND_TO_EMAIL` (anders valt dit terug op
   `info@brabantschoon.nl`).
4. Redeploy het project in Vercel (of wacht op de automatische deploy vanuit GitHub).
5. Test de offertewizard live (een zakelijke periodieke aanvraag, zodat u ook de
   interne-calculatie-e-mail ziet).
6. Test het hoofdcontactformulier live.
7. Test het footerformulier live.
8. Zodra alles bevestigd werkt: verwijder `WEB3FORMS_ACCESS_KEY` uit Vercel (zie
   punt 14).

**Risico's / aandachtspunten:**
- De offerteflow kan pas écht end-to-end getest worden zodra u zelf
  `RESEND_API_KEY`/`RESEND_FROM_EMAIL` in Vercel heeft gezet én het domein in Resend
  geverifieerd is — dat kan hier niet vooraf gesimuleerd worden (wel is elk onderdeel
  afzonderlijk met gemockte `fetch`-aanroepen getest, zoals hierboven beschreven).
- Zonder geverifieerd domein zal `verstuurEmail()` netjes falen (500/502, geen
  crash, geen secret-lek) — maar er gaat dan geen e-mail uit totdat u
  domeinverificatie afrondt.
- De `.env.example`-kanttekening uit punt 6 (3 variabelen i.p.v. uitsluitend
  `RESEND_API_KEY=`) is een bewuste interpretatiekeuze — laat het weten als u dit
  liever letterlijk volgens uw oorspronkelijke instructie wilt.
- Resend heeft eigen verzendlimieten per abonnement (gratis tier: een beperkt aantal
  e-mails per dag/maand) — bij hoog volume kan `daily_quota_exceeded` optreden; dat
  wordt door `verstuurEmail()` afgevangen als een veilige `502`, maar is verder geen
  onderdeel van deze ronde om op te lossen.
