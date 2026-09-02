# Changelog — Brabantschoon website (ronde 39)

Zakelijke offertewizard: interne calculator + volledig herbouwde aanvraagmail.

## 1. Wat was er fout?

De offertewizard had **geen backend** — het formulier stuurde rechtstreeks (native
`<form method="POST">`) naar Web3Forms, dat automatisch élk meegestuurd veld in de
notificatiemail opsomt. Voor een zakelijke aanvraag (bijv. periodieke bedrijfsschoonmaak)
betekende dat: tientallen irrelevante particuliere velden (pakket, woonoppervlakte,
slaapkamers, badkamers, glasbewassing-opties, enz.) verschenen allemaal met waarde "0"
of leeg, de daadwerkelijke aanvraag stond onderaan verstopt, en op mobiel moest u
eindeloos scrollen langs lege velden voordat u bij de kern van de aanvraag kwam.

Daarnaast bestond er **geen enkele interne prijs-/tijdcalculator** voor zakelijke
periodieke schoonmaak — alleen particuliere consumentprijzen (`PARTICULIER_PRIJZEN` in
`generate.py`). Er was in de hele repository geen eerdere zakelijke prijsconfiguratie of
calculatorlogica aanwezig om op voort te bouwen; dit is dus bevestigd nieuw werk, geen
vervanging van iets bestaands. (Wel bestond er ooit een publieke, klant-zichtbare
prijscalculator-pagina — inmiddels verwijderd, met een redirect in `vercel.json` — maar
dat was een heel ander soort pagina dan de interne calculatiemotor die deze ronde is
gebouwd, en is er verder niet bij betrokken.)

Verder ontbrak een manier om voor zakelijke periodieke schoonmaak: (a) aan te geven
welke ruimtes schoongemaakt moeten worden, (b) een indicatie van afwijkende vervuiling
te geven (bijv. een garagebedrijf waar werkplaatsvuil het kantoor/de kantine in komt),
en (c) een schoonmaakmoment-voorkeur op te geven.

## 2. Welke bestanden zijn gewijzigd?

- **`generate.py`** — nieuwe wizardstap 9 ("Ruimtes/vervuiling/moment", alleen bij
  periodieke bedrijfs-/VvE-schoonmaak), nieuwe constanten
  (`ZAKELIJK_RUIMTE_OPTIES`/`ZAKELIJK_VERVUILING_OPTIES`/`ZAKELIJK_MOMENT_OPTIES`),
  formulier-`action` gewijzigd naar `/api/offerte-aanvraag`, `access_key`/`redirect`
  hidden fields uit de wizard verwijderd (verplaatst naar server-side), 2 nieuwe hidden
  velden (`ruimtes`, `form_rendered_at`), voorwaardelijk veld "aantal keer per week".
  Verder: correctie van "BrabantSchoon" → "Brabantschoon" in één resterende plek (zie
  punt 13), en een kleine README-correctie (zie hieronder).
- **`js/main.js`** — nieuwe stapnummering (9 nieuw ingevoegd, oude 9/10/11 → 10/11/12),
  wiring voor de nieuwe zakelijke velden, `collectRows()` uit `buildSummary()`
  geëxtraheerd zodat samenvatting-op-scherm én verzend-payload altijd identiek zijn,
  nieuwe `buildOffertePayload()`, formulierverzending omgezet van native POST naar
  `fetch()` JSON-POST naar `/api/offerte-aanvraag`, en de kleine
  "BrabantSchoon"-schrijffout in de Maps-iframe-titel gecorrigeerd.
- **`api/offerte-aanvraag.js`** *(nieuw bestand)* — Vercel Serverless Function: bouwt de
  interne calculatie, bouwt de conditionele e-mailtekst, doet bot-/spamcontrole en
  velvalidatie, en stuurt server-to-server naar Web3Forms door. Dit is het bestand waar
  alle interne prijslogica staat — zie punt 5/6/7.
- **`README.md`** — documentatie van `api/offerte-aanvraag.js` toegevoegd, de
  Formulieren-sectie bijgewerkt (contactformulier vs. offertewizard lopen nu via
  verschillende paden), en een bestaande onnauwkeurigheid gecorrigeerd (de wizard stond
  nog vermeld als onderdeel van `contact.html`; die staat al sinds een eerdere ronde op
  de eigen `offerte.html`-pagina — puur een documentatiefout, geen gedragswijziging).
- **`test_wizard.js`, `test_offerte_api.js`** *(nieuwe bestanden, meegeleverd)* — de
  regressietests waarmee dit werk is geverifieerd (zie punt 10-12). Blijven in de repo
  staan als herbruikbaar testgereedschap voor toekomstige rondes; hebben geen invloed op
  de live site (draaien alleen lokaal via Node, zie README "Lokaal testen").

**Niet gewijzigd:** `css/styles.css` (geen nieuwe stijlen nodig — de nieuwe stap 9
hergebruikt de bestaande `.cb-card`/`.rc-card`-componenten 1-op-1), `vercel.json`, alle
particuliere pakket-/prijslogica, alle overige 37 gegenereerde pagina's.

## 3. Hoe is de zakelijke wizard verbeterd?

Alleen voor de dienst "Periodieke bedrijfsschoonmaak" (bedrijf) en "Periodieke
schoonmaak" (VvE) — dus niet voor eenmalige/overige zakelijke diensten — is een nieuwe
stap 9 toegevoegd, ná Frequentie en vóór Toelichting:

- **Welke ruimtes moeten worden schoongemaakt?** — selecteerbare kaarten (zelfde
  visuele stijl als de bestaande checkbox-extra's): Kantoorruimte, Kantine/pantry,
  Toiletten/sanitair, Entree/receptie, Gangen/algemene ruimtes, Vergader-/
  spreekruimtes, Kleedruimte, Werkplaats/productieruimte, Overige ruimte (met optioneel
  toelichtingsveld dat verschijnt zodra "Overige ruimte" is aangevinkt).
- **Is er sprake van extra vervuiling waar we rekening mee moeten houden?** — 4 opties
  (Normale kantoor-/bedrijfsvervuiling / Enige extra vervuiling / Bovengemiddelde
  vervuiling / Anders, met toelichtingsveld), neutraal geformuleerd — geen van de opties
  suggereert dat de standaardsituatie "slecht" is.
- **Wanneer heeft u de schoonmaak bij voorkeur?** — Tijdens kantooruren / Voor opening /
  Na sluiting / Geen voorkeur, in overleg.

Er wordt bewust **niets** gevraagd over standaardtaken (stofzuigen, prullenbak legen,
oppervlakken afnemen, dweilen) — die horen inherent bij periodieke schoonmaak en voegen
als aparte vraag geen bruikbare informatie toe. Alleen vragen die daadwerkelijk tijd,
prijs, planning of moeilijkheidsgraad beïnvloeden zijn toegevoegd.

Bij "Meerdere keren per week" verschijnt nu ook een klein veld om het exacte aantal
keer per week op te geven (2-14) — nodig voor een correcte maandberekening (zie punt 5).

De wizard is met deze toevoeging van 11 naar 12 stappen gegaan, maar blijft voor alle
andere diensten en voor particulieren precies zoals hij was — de nieuwe stap wordt
alleen getoond wanneer hij daadwerkelijk van toepassing is.

## 4. Hoe wordt de geschatte schoonmaaktijd berekend?

De oude, te simpele aanpak ("tot 50 m² = altijd 1 uur") is vervangen door:

```
totaal_minuten = (basis_minuten[oppervlaktecategorie] + som(extra_minuten per geselecteerde ruimte)) × vervuilingsfactor
```

- **Basistijd per oppervlaktecategorie**: Klein (tot 50 m²) 45 min, Middel (50-150 m²)
  90 min, Groot (150-500 m²) 180 min, Zeer groot (500 m²+) 300 min. Bij "Weet ik niet"
  wordt bewust **geen** automatische schatting gemaakt (zie punt 9/onvoldoende-info-pad).
- **Extra minuten per geselecteerde ruimte**: bijv. Kantoor +10 min, Kantine +15 min,
  Toiletten +15 min, Werkplaats/productieruimte +20 min (hogere vervuilingsgevoeligheid),
  enz. — volledige tabel in `api/offerte-aanvraag.js`, `CONFIG.TIME_MODEL`.
- **Vervuilingsfactor**: Normaal ×1,0, Enige extra vervuiling ×1,15, Bovengemiddelde
  vervuiling ×1,35, Anders/toelichting ×1,35 (conservatief behandeld tot handmatig
  beoordeeld).

Dit hele tijdmodel is één centraal object (`CONFIG.TIME_MODEL`) — nieuwe ruimtetypes of
aangepaste tijden per ruimte hoeven maar op één plek gewijzigd te worden.

## 5. Welke calculatorformule is geïmplementeerd?

Exact de formule uit de opdracht, met de 52/12-weken-per-maand-precisie:

```
directe_kosten_per_bezoek = arbeidskosten + reiskosten + materiaalkosten + overige_kosten
  arbeidskosten = (totaal_minuten / 60) × interne_uitvoeringskost_per_uur
  reiskosten    = (reistijd_minuten / 60) × reistijd_uurtarief
adviesprijs_excl_btw = MAX(directe_kosten_per_bezoek / (1 − gewenste_brutomarge), minimumprijs_per_bezoek)
adviesprijs_incl_btw = adviesprijs_excl_btw × (1 + 21%)
bezoeken_per_maand    = frequentie_naar_bezoeken(frequentie)   // bijv. wekelijks = 52/12, met volle precisie
adviesprijs_per_maand = adviesprijs_excl_btw × bezoeken_per_maand
```

Belangrijke details, elk expliciet getest (zie punt 10-11):

- `52/12` (= 4,3333...) wordt intern met volle drijvende-kommaprecisie gebruikt, nooit
  simpelweg `× 4` — geverifieerd voor zowel 1×/week als N×/week.
- De minimumprijs werkt als een vangnet (`MAX(...)`), niet als een normale prijsbepaler
  — bij het brief-scenario (Garagebedrijf Van Brussel) ligt de berekende commerciële
  prijs er ruim boven, dus wordt die gewoon gebruikt; het minimum grijpt pas in bij
  kleine/lichte opdrachten waar reistijd/materiaal/opstarttijd anders onrendabel zou
  zijn.
- De interne uitvoeringskost per uur is een **losstaande, altijd-ingevulde** parameter
  — nergens in de code wordt aangenomen dat de eigenaar zelf gratis schoonmaakt. Een
  opdracht die met deze parameters wordt geaccepteerd, blijft dus ook rendabel wanneer
  een zzp'er of personeelslid wordt ingezet in plaats van Egzon zelf.
- Bij meerdere locaties (`aantal_locaties > 1`) toont de e-mail een expliciete
  waarschuwing dat de berekening PER LOCATIE is en handmatig vermenigvuldigd moet
  worden — er wordt bewust niet automatisch vermenigvuldigd, omdat locaties in de
  praktijk kunnen verschillen in grootte/ruimtes.

## 6. Welke financiële parameters zijn gebruikt?

Er is in de repository **geen bestaande zakelijke prijsconfiguratie of
calculatorlogica** aangetroffen (alleen `PARTICULIER_PRIJZEN` voor consumentpakketten,
volledig ongerelateerd). Alle onderstaande waarden in `CONFIG`
(`api/offerte-aanvraag.js`) zijn dus **nieuw** en expliciet als placeholder gemarkeerd:

| Parameter | Waarde | Status |
|---|---|---|
| Interne uitvoeringskost per uur (excl. btw) | €27,50 | **TE BEVESTIGEN** |
| Gewenste brutomarge | 35% | **TE BEVESTIGEN** |
| Minimumprijs per bezoek (excl. btw) | €45,00 | **TE BEVESTIGEN** |
| Reistijd per bezoek (heen+terug) | 20 minuten | **TE BEVESTIGEN** |
| Reistijd-uurtarief | €27,50 (= zelfde als uitvoeringskost) | **TE BEVESTIGEN** |
| Materiaalkosten per bezoek | €3,50 | **TE BEVESTIGEN** |
| Overige directe kosten per bezoek | €0,00 | placeholder |
| Btw-tarief | 21% | **niet** een placeholder — het geldende wettelijke tarief |
| Weken per maand | 52/12 (4,3333...) | rekenkundig gegeven, geen aanname |
| Basistijd/ruimte-extra/vervuilingsfactor (tijdmodel) | zie punt 4 | **TE BEVESTIGEN/verfijnen** |

Met deze placeholderwaarden komt het brief-scenario (Garagebedrijf Van Brussel, Klein,
kantoor+kantine, bovengemiddelde vervuiling, wekelijks) uit op: 1u35 per bezoek, €55,98
directe kosten per bezoek, €86,12 adviesprijs excl. btw per bezoek (€104,21 incl. btw),
€373,19 adviesprijs excl. btw per maand — een intern consistente, plausibele uitkomst,
maar de absolute hoogte hangt volledig af van de hierboven gemarkeerde, nog te
bevestigen parameters.

## 7. Welke parameters moeten nog door de eigenaar bevestigd worden?

Alle regels met **TE BEVESTIGEN** in de tabel bij punt 6 — met name:
1. Wat een schoonmaakuur het bedrijf werkelijk kost wanneer een zzp'er of medewerker
   wordt ingezet (het bedrag van €27,50 is een redelijke, verdedigbare aanname, geen
   navraag bij een echte tariefafspraak).
2. De gewenste brutomarge (35% is gebruikelijk in de branche maar niet Brabantschoon-
   specifiek bevestigd).
3. De minimumprijs per bezoek.
4. De reistijd-aanname (vlak 20 minuten per bezoek — een verfijning per postcodegebied
   zou nauwkeuriger zijn, maar is bewust nog niet gebouwd om de eerste versie niet
   onnodig complex te maken).
5. Het tijdmodel per ruimte (de minuten-per-ruimtetype-tabel) — een eerste, redelijke
   inschatting, geen resultaat van tijdmetingen.

Zolang deze niet zijn nagekeken, moet de interne calculatie in de e-mail gezien worden
als een **richtinggevend rekenvoorbeeld**, niet als een direct te hanteren prijs — de
e-mail zegt dit ook letterlijk (zie punt 8).

## 8. Hoe ziet de nieuwe interne aanvraagmail eruit?

Voor het exacte brief-scenario (Garagebedrijf Van Brussel B.V., Liessel):

```
Onderwerp: Nieuwe zakelijke offerteaanvraag – Garagebedrijf Van Brussel B.V. – Liessel

NIEUWE ZAKELIJKE OFFERTEAANVRAAG
Garagebedrijf Van Brussel B.V.
Liessel

AANVRAAG
Dienst: Periodieke bedrijfsschoonmaak
Omvang: Klein
Aantal locaties: 1
Frequentie: Wekelijks
Ruimtes: Kantoorruimte, Kantine / pantry
Extra vervuiling: Bovengemiddelde vervuiling
Schoonmaakmoment: Geen voorkeur / in overleg
Omschrijving: Kantine en kantoor van een autogarage

INTERNE CALCULATIE
Geschatte schoonmaaktijd: 1 uur 35 min per bezoek
Frequentie: Wekelijks — gemiddeld 4,33 bezoeken per maand
Geschatte directe kosten: €55,98 per bezoek — €242,58 per maand
Adviesprijs per bezoek: €86,12 excl. btw
Adviesprijs per maand: €373,19 excl. btw
Btw (per bezoek): €18,09
Adviesprijs incl. btw: €104,21 per bezoek — €451,57 per maand
Verwachte brutomarge: 35,0%

Interne prijsindicatie – niet automatisch aan de klant gecommuniceerd en geen
definitieve offerte.

CONTACTGEGEVENS
Contactpersoon: Frank Verberne
Bedrijfsnaam: Garagebedrijf Van Brussel B.V.
E-mail: frank@vanbrussel.nl
Telefoon: 0492123456
Plaats: Liessel
```

Geen enkel particulier veld, geen "0"-waarden, geen lege regels — alleen wat
daadwerkelijk is ingevuld. Voor een particuliere aanvraag (of een niet-periodieke
zakelijke dienst) ontbreekt de hele "INTERNE CALCULATIE"-sectie automatisch — die wordt
alleen gebouwd wanneer de gekozen dienst-slug "periodiek-zakelijk" is.

Wanneer er onvoldoende informatie is voor een betrouwbare schatting (bijv. oppervlakte
"Weet ik niet"), verzint de e-mail géén bedragen, maar toont een nette, expliciete
melding met de reden ("Onvoldoende informatie voor een automatische prijsindicatie" +
de concrete reden) — zodat u zelf beoordeelt in plaats van op een fictief getal af te
gaan.

## 9. Wat ziet de klant?

Niets van het bovenstaande. De klant ziet, ongeacht dienst of klanttype, na het
versturen alleen de bestaande, generieke bedankpagina (`thanks.html`): een bevestiging
dat de aanvraag is ontvangen en dat Brabantschoon binnen één werkdag contact opneemt —
geen bedrag, geen calculatie, geen interne informatie. De interne calculatie wordt
uitsluitend server-side berekend (in `api/offerte-aanvraag.js`); de browser levert
alleen de ruwe invoer aan (oppervlakte, ruimtes, vervuiling, frequentie) en krijgt het
berekende bedrag nooit terug — niet in de pagina, niet in de URL, niet in verborgen
HTML/data-attributen, niet in devtools/netwerkverkeer, niet in de eigen samenvatting
vóór verzending. Voor particuliere diensten met bestaande prijsindicatie (pakketten,
staffels) verandert er niets: die blijven gewoon zichtbaar zoals voorheen — dat is
bewust ander, niet-vertrouwelijk gedrag (consument-gerichte prijsindicatie, geen
interne kostprijs).

## 10. Welke particuliere flows zijn getest?

Via een jsdom-gebaseerde regressietest (`test_wizard.js`, bedient de daadwerkelijk
gegenereerde `offerte.html` + `js/main.js` zoals een echte bezoeker):

- **Eenmalige grote schoonmaak** (pakket "Compleet") — volledige flow, live
  prijsindicatie nog zichtbaar, stap-telling ongewijzigd (5 stappen tot de Extra's-stap
  bij dit controlepunt), nieuwe zakelijke stap 9 correct verborgen.
- **Glasbewassing (particulier)** — pakketstap correct overgeslagen (deze dienst kent
  geen pakketten), eigen glas_*-vragen correct beantwoord, 11 schone samenvattingsregels,
  geen "Type woning" (hoort niet bij glasbewassing).
- **Schoonmaak na verbouwing** — pakket "Uitgebreid", plus de dienst-specifieke
  verbouwing_type/hardnekkige-bouwresten-vragen, 13 schone samenvattingsregels, geen
  "Ruimtes"-veld (hoort niet bij particulier).

Voor alle drie: 0 regels met "0"/undefined/null/leeg in de samenvatting, en de wizard
bereikt correct de laatste (controle-)stap.

## 11. Welke zakelijke flows zijn getest?

- **Periodieke bedrijfsschoonmaak** (het volledige brief-regressiescenario,
  Garagebedrijf Van Brussel B.V.) — end-to-end door de hele wizard, inclusief de nieuwe
  stap 9, tot en met de exacte payload die naar `/api/offerte-aanvraag` verstuurd zou
  worden; vervolgens die payload door de daadwerkelijke server-functie gehaald en de
  gegenereerde onderwerpregel + e-mailtekst + interne calculatie geïnspecteerd (zie punt
  8) — inclusief een volledig **onafhankelijke herberekening** van elk tussenresultaat
  (tijd, arbeidskosten, reiskosten, materiaalkosten, adviesprijs excl./incl. btw,
  marge) om te bevestigen dat de code exact de formule uit punt 5 implementeert, niet
  alleen "er logisch uitziet".
- **Kantoorreiniging** (niet-periodieke zakelijke dienst) — bevestigd dat stap 9 correct
  wordt overgeslagen (geen ruimtes/vervuiling/moment-vragen voor diensten waarvoor geen
  interne calculator is gebouwd).
- **Glasbewassing (zakelijk)** — zelfde controle: geen stap 9, geen calculatieonderdeel.
- **"Meerdere keren per week"** — het extra "aantal keer per week"-veld verschijnt/
  verdwijnt correct en wordt geleegd bij wisselen van frequentie; apart geverifieerd dat
  2×/week correct naar `2 × 52/12` bezoeken per maand rekent (niet simpelweg ×4 t.o.v.
  wekelijks).
- **Minimumprijs-clamp** — exppalliciet los getest dat `MAX(commerciële prijs,
  minimumprijs)` daadwerkelijk het minimum toepast zodra dat hoger ligt dan de
  berekende prijs.
- **"Onvoldoende informatie"-pad** — oppervlakte "Weet ik niet" resulteert in een nette
  fallbackmelding zonder verzonnen bedragen.
- **Meerdere locaties** — de waarschuwingszin ("PER LOCATIE, vermenigvuldig handmatig")
  verschijnt correct in de e-mail.
- **Bot-/spamdetectie** — honeypot-checkbox en te-snel-ingevuld-detectie (<2,5s) apart
  getest; een normaal ingevulde aanvraag wordt niet als bot herkend.
- **Verplichte-veldvalidatie** — server-side validatie van klanttype/dienst/naam/
  geldig e-mailadres/telefoon/plaats getest op zowel een onvolledige als een volledige
  payload.

## 12. Zijn build/typecheck/tests geslaagd?

- `python3.12 generate.py` — slaagt, genereert alle 38 pagina's + sitemap.xml +
  robots.txt zonder fouten.
- `node --check js/main.js` en `node --check api/offerte-aanvraag.js` — beide geldig.
- Alle jsdom-wizardscenario's (`node test_wizard.js`) — geslaagd, 0 rommelvelden in elk
  getest scenario.
- Alle API-/calculatietests inclusief onafhankelijke herberekening
  (`node test_offerte_api.js`) — geslaagd, alle 9 subtests.
- 0 duplicate HTML-`id`-attributen sitebreed (correcte regex, geen `data-*-id`
  false-positives) over alle 38 gegenereerde pagina's.
- Pakket-CTA-telling ongewijzigd: 13 (12 echte pakketten + 1 "weet-niet"-fallback) —
  bevestigt geen regressie in het particuliere pakketsysteem.
- Wizard-stapstructuur: 12 oplopende, uniek genummerde `data-step`-secties, DOM-volgorde
  correct (een vereiste voor de navigatielogica, zie eerdere rondes se memory).
- Geen `console.*`-aanroepen in `js/main.js` of `api/offerte-aanvraag.js` — geen kans op
  onbedoeld lekken van interne data via de browserconsole.
- Handmatige controle: geen "adviesprijs"/"kostprijs"/"marge"/interne-calculatiewaarden
  op enige plek in `generate.py`, `offerte.html` of `js/main.js` — de enige plek waar
  deze termen voorkomen is `api/offerte-aanvraag.js` zelf (server-side).
- Sitebreed 0 resterende "BrabantSchoon"/"Brabant Schoon"-schrijffouten (incl. de ene
  nieuw-gevonden restformulering in `js/main.js`, zie punt 13).

Er is geen aparte lint-/typecheck-toolchain in deze repository (geen package.json/
build-stap, bewust — zie README "generate.py is de bron van de website"); `node --check`
en de bovenstaande functionele tests zijn hier het equivalent.

## 13. Resterende risico's en aanbevelingen

- **De financiële parameters in punt 6/7 zijn placeholders** — voordat u op basis van
  de interne calculatie daadwerkelijk prijzen gaat communiceren, controleer/pas minimaal
  de uitvoeringskost per uur, de gewenste marge en de minimumprijs aan in `CONFIG`
  (bovenin `api/offerte-aanvraag.js`, duidelijk gemarkeerd).
- **Het tijdmodel is een eerste, redelijke inschatting**, geen resultaat van
  daadwerkelijke tijdmetingen — na een paar weken praktijkervaring is het verstandig de
  minuten-per-ruimte-tabel bij te stellen aan de hand van hoe lang bezoeken werkelijk
  duren.
- **Reistijd is nu een vlakke schatting** (20 min/bezoek) — een verfijning per
  postcodegebied/afstand zou nauwkeuriger zijn; bewust niet gebouwd deze ronde om de
  eerste versie niet onnodig complex te maken.
- **De Web3Forms access key staat, net als voorheen bij het contactformulier, in
  leesbare vorm** — nu server-side in `api/offerte-aanvraag.js` in plaats van in de
  HTML zoals voorheen (al een verbetering: hij staat niet meer in de door de browser
  geladen pagina), maar staat wel nog in de broncode zelf. Wilt u dit verder afschermen,
  dan is de volgende stap een Vercel-omgevingsvariabele (`process.env.WEB3FORMS_KEY`)
  in plaats van de hardcoded waarde — technisch eenvoudig, maar niet aangepast omdat het
  buiten de scope van deze opdracht viel en de bestaande sleutel al zo werd gebruikt.
- **Vercel-verificatie op de live omgeving nog nodig**: dit is uitgebreid getest in een
  gesimuleerde (jsdom + directe Node-aanroepen) omgeving, maar `/api/offerte-aanvraag.js`
  is nog niet daadwerkelijk op een live Vercel-deployment getest (dat kan pas na
  uploaden naar GitHub en de automatische Vercel-deploy). Test na livegang minimaal één
  keer het brief-scenario end-to-end en controleer dat de e-mail daadwerkelijk aankomt
  zoals hierboven getoond.
- **`npm`/`jsdom` is alleen een lokaal testgereedschap**, geen dependency van de site
  zelf — de site blijft, zoals altijd, een pure statische site zonder build-stap; alleen
  wie deze twee nieuwe testbestanden lokaal wil draaien heeft `npm install jsdom` nodig
  (zie README "Lokaal testen").
- **Andere zakelijke diensten** (kantoorreiniging, industriële schoonmaak, VvE-diensten
  buiten periodiek, enz.) krijgen bewust nog géén interne calculator — alleen periodieke
  bedrijfs-/VvE-schoonmaak, conform de opdracht. Een logische vervolgstap zou zijn om,
  zodra het tijdmodel voor periodiek is gevalideerd in de praktijk, te beoordelen of een
  vergelijkbare aanpak zinvol is voor bijvoorbeeld opleverings- of evenementenreiniging.
