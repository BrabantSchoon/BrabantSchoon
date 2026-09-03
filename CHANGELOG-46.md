# Changelog — Brabantschoon website (ronde 46: Calculator v2 + interne offerte-e-mail)

Deze ronde vervangt de zakelijke interne calculator (v1, rondes 39-45) volledig
door **Calculator v2**: een zuiver **interne** commerciële beslissingshulp die
werkt met tijds-/prijs**bandbreedtes** in plaats van één schijnprecies bedrag,
en die een expliciet betrouwbaarheidsniveau meegeeft. De klant ziet nooit iets
uit de calculator — geen kostprijs, geen marge, geen ZZP-tarief. De wizard,
dienst-preselectie en auto-advance (ronde 44/45) zijn **niet** aangeraakt
buiten de twee nieuwe, kleine velden die deze ronde vereist.

Deze changelog volgt de 10-punts opleverstructuur uit de briefopdracht.

---

## 1. Complete bijgewerkte ZIP

Zie `Brabantschoon-ronde46.zip` (bijgeleverd). Bevat de volledige site
(gegenereerde HTML, `css/js/images`, `api/`, `lib/`, `generate.py`, tests,
`README.md`, alle changelogs). Geen `node_modules`, geen `.env`, geen echte
secrets.

## 2. Deze changelog

Dit bestand.

## 3. Lijst van gewijzigde/nieuwe bestanden

**Nieuw:**
- `lib/calculator.js` — Calculator v2, de volledige rekenlogica (tijdmodel,
  kostenmodel, adviesprijsbandbreedte, betrouwbaarheid, max. ZZP-tarief),
  gedeeld en onafhankelijk testbaar. Vervangt de v1-logica die voorheen
  inline in `api/offerte-aanvraag.js` stond.
- `test_calculator.js` — 21 losstaande tests voor `lib/calculator.js` (zie
  punt 9).
- `CHANGELOG-46.md` — dit bestand.

**Gewijzigd:**
- `generate.py` — `ASSET_VERSION` 179 → 180; nieuwe
  `ZAKELIJK_INTENSITEIT_OPTIES`-lijst; het optionele exacte-m²-veld
  toegevoegd aan wizardstap 7 (oppervlakte); de gebruiksintensiteit-vraag
  toegevoegd aan wizardstap 9 (ruimtes/vervuiling/moment). Site volledig
  opnieuw gegenereerd (alle HTML-pagina's, sitemap.xml, robots.txt).
- `js/main.js` — `oppervlakte_m2_exact` en `gebruiksintensiteit_zakelijk`
  toegevoegd aan de `calc`-payload (`buildOffertePayload()`) en aan de
  samenvatting (`collectRows()`); beide velden worden gewist door
  `resetZakelijkPeriodiekStep()` zodra de klant wisselt naar particulier of
  een andere zakelijke dienst; een nieuwe, kleine listener annuleert een
  lopende auto-advance-timer zodra de gebruiker in het exacte-m²-veld focust
  of typt (zie punt 4). **Auto-advance zelf (ronde 44/45) is niet gewijzigd**
  — `gebruiksintensiteit_zakelijk` staat bewust niet in
  `AUTO_ADVANCE_RADIO_NAMES` (het is een veld op een samengestelde stap).
- `api/offerte-aanvraag.js` — de volledige v1-`CONFIG`/`TIME_MODEL`/
  `berekenInterneCalculatie()`/`formatDuur()` is verwijderd en vervangen door
  `require('../lib/calculator.js')`; `bouwEmailTekst()`/
  `bouwEmailHtmlOfferte()` zijn herschreven naar de nieuwe 5-sectiestructuur
  (zie punt 4/7). Bot-/spamdetectie (`lijktOpBot`), veldvalidatie
  (`valideerVerplichteVelden`) en de Resend-verzendflow zelf zijn **niet**
  gewijzigd.
- `test_offerte_api.js` — herschreven voor Calculator v2's andere
  outputvorm/sectiestructuur; het garagescenario is uitgebreid met de nieuwe
  velden; bevat nu ook een expliciete kruiscontroletest (dat de e-mail exact
  `calculateOffer()` gebruikt, geen tweede formule) en een test voor
  server-side manipulatiebestendigheid.
- `test_wizard.js` — 3 nieuwe scenario's (17, 18, 19; zie punt 9).
- `README.md` — de "Offertewizard"-paragraaf en "Lokaal testen"-sectie
  bijgewerkt voor Calculator v2/`lib/calculator.js`/`test_calculator.js`.

**Bewust niet gewijzigd:** `api/contact-aanvraag.js`, `lib/mail.js`,
`test_contact_api.js`, `test_mail.js`, alle overige HTML-content, de
particuliere pakket-/prijslogica, dienst-preselectie, en het auto-advance-
mechanisme zelf (`scheduleAutoAdvance`/`cancelAutoAdvance`/de delegated
`change`-listener uit ronde 45).

## 4. Oude vs. nieuwe calculatielogica

| Aspect | Calculator v1 (rondes 39-44) | Calculator v2 (ronde 46) |
|---|---|---|
| Waar | inline in `api/offerte-aanvraag.js` | eigen module `lib/calculator.js` |
| Tijdmodel | vaste basistijd per oppervlaktecategorie + vaste minuten per ruimte, × 1 vervuilingsfactor | m²-gebaseerd (min/max per m²) + vaste overheadtijd + taakspecifieke tijd per ruimte, × (intensiteit × vervuiling × frequentie), als **bandbreedte** (min/max apart doorgerekend) |
| Oppervlakte-invoer | alleen categorie (Klein/Middel/Groot/Zeer groot) | categorie, **of** een optioneel exact m²-getal (heeft voorrang, verhoogt betrouwbaarheid) |
| Gebruiksintensiteit | bestond niet | nieuwe vraag (Rustig/Gemiddeld/Intensief), beïnvloedt de tijd; ontbreken verlaagt de betrouwbaarheid |
| Frequentie-invloed op tijd | geen (frequentie bepaalde alleen bezoeken/maand) | frequentie beïnvloedt nu ook de tijd per bezoek (1×/week = referentiepunt; minder frequent = intensiever per bezoek; vaker = iets efficiënter, met een bodem zodat sanitair/afval/pantry nooit "verdwijnen") |
| Financiële tijdsbasis | het enige berekende getal | de **conservatieve bovenzijde** van de tijdsbandbreedte (beschermt de marge) |
| Kostprijs | vast uurtarief + vaste reistijd (20 min) × uurtarief + vast materiaalbedrag (€3,50) | ZZP-referentietarief × calculatietijd + materiaalbandbreedte per categorie (conservatieve bovenzijde) + kilometerkosten (vaste, transparante fallback-schatting); **reistijd telt bewust NIET automatisch mee** als kostenpost (aparte, uitstaande schakelaar) |
| Uitkomst | één adviesprijs, één marge% | een **prijsbandbreedte** (ondergrens = minimum gezonde prijs), een maandbandbreedte, en (indien betrouwbaar genoeg) een maximaal verantwoord ZZP-uurtarief |
| Betrouwbaarheid | bestond niet als apart begrip | expliciet niveau (Hoog/Middel/Laag) + lijst factoren + eventueel "Locatieopname aanbevolen" |
| Bijzondere/afwijkende situaties (bijv. autogarage-werkplaats) | geen apart mechanisme; vervuilingsfactor was de enige hendel | hergebruikt bewust dezelfde bestaande vervuilingsvraag: "Bovengemiddelde vervuiling" verlaagt de betrouwbaarheid naar Middel, "Anders / toelichting" verlaagt naar Laag + toont altijd "Locatieopname aanbevolen" — **zonder** de (niet-geselecteerde) ruimte zelf als schoon te maken mee te rekenen |
| Diensten in bereik | `periodiek-zakelijk`, `kantoorreiniging` | ongewijzigd — zelfde twee diensten (`CALC_DIENST_SLUGS`); scope-uitbreiding was expliciet buiten scope deze ronde |
| Afronding | 2 decimalen (schijnprecisie, bijv. "€143,24") | commerciële afronding in stappen van €5 (per bezoek) / €10 (per maand), ondergrens altijd naar boven afgerond zodat de marge-vloer nooit wordt geschonden |
| "Meerdere keren per week" zonder geldig aantal | blokkeerde de HELE schatting (`onvoldoendeInfo: true`) | blokkeert alleen het maandbedrag — een per-bezoek-schatting blijft gewoon beschikbaar (verbetering) |

## 5. Alle gebruikte tijd-/kostenparameters (huidige waarden in `lib/calculator.js`)

**Tijdmodel:**
- Minuten per m²: 0,7–1,1 min/m²
- Referentie-m² per categorie (fallback zonder exacte opgave): Klein 35 m²,
  Middel 100 m², Groot 300 m², Zeer groot 600 m²
- Vaste overheadtijd per bezoek: 10 min
- Taakspecifieke extra tijd per ruimte (min–max): kantoor 5–10,
  kantine/pantry 10–20, toiletten/sanitair 10–20, entree 5–10, gangen 0–5,
  vergaderruimte 5–10, kleedruimte 5–10, werkplaats 15–30, overig 5–15
- Gebruiksintensiteitsfactor: Rustig 0,90–0,95, Gemiddeld 1,0 (referentie),
  Intensief 1,10–1,25
- Frequentiefactor (t.o.v. wekelijks = 1,0): Eenmalig 1,15–1,30, Maandelijks
  1,30–1,50, Meerdere keren per week 0,75–0,85, In overleg 1,0–1,15
- Vervuilingsfactor: Normaal 1,0, Enige extra vervuiling 1,08–1,18,
  Bovengemiddeld 1,20–1,40, Anders/toelichting 1,30–1,60
- Financiële calculatietijd = de conservatieve (langste) bovenzijde van de
  tijdsbandbreedte

**Kostenmodel:**
- ZZP-/inhuurreferentietarief: €32,50 per productief uur
- Interne voertuigkosten: €0,35/km
- Standaard retourkilometers (fallback, NIET gemeten): 20 km
- Betaalde reistijd van een uitvoerder: bewust **niet** automatisch een
  kostenpost (`TRAVEL_TIME_IS_PAID_LABOR: false`)
- Materiaalkosten per bezoek (bandbreedte, conservatieve bovenzijde
  gebruikt): Klein €3–€5, Middel €5–€8, Groot €8–€14, Zeer groot €14–€22
- Gewenste brutomarge: 35% — minimale gezonde marge: 20%
- Absolute minimumprijs per bezoek: €45
- Btw-tarief: 21% (geen aanname, wettelijk tarief)
- Afrondingsstappen: €5 per bezoek, €10 per maand

## 6. Welke parameters nog kalibratie/bevestiging nodig hebben

Alles hierboven staat in `lib/calculator.js` gemarkeerd als `// TE
BEVESTIGEN` (bedrijfsparameters — Egzon moet deze bevestigen/aanpassen) of
`// TE KALIBREREN` (tijdmodel-aannames — pas met echte
Brabantschoon-opdrachten, ingeschatte vs. werkelijke tijd, verder te
verfijnen):
- **TE BEVESTIGEN:** ZZP-referentietarief (€32,50), voertuigkosten/km
  (€0,35), gewenste marge (35%), minimum marge (20%), minimumprijs (€45),
  standaard retourkilometers (20 km, expliciet een schatting, nooit een
  gemeten waarde).
- **TE KALIBREREN:** minuten per m², referentie-m² per categorie, vaste
  overheadtijd, taakspecifieke tijd per ruimte, alle intensiteits-/
  frequentie-/vervuilingsfactoren, materiaalkostenbandbreedte per categorie.

Geen van deze waarden is stilzwijgend verzonnen — ze zijn allemaal expliciet,
op één centrale plek, gemarkeerd, precies zoals de brief vereiste.

## 7. Voorbeeld van de nieuwe interne e-mail

Onderwerp: `Nieuwe zakelijke offerteaanvraag – Garagebedrijf Van Brussel B.V. – Liessel`

```
NIEUWE ZAKELIJKE OFFERTEAANVRAAG
Garagebedrijf Van Brussel B.V.
Liessel

AANVRAAG
Dienst:
Periodieke bedrijfsschoonmaak

Omvang:
Klein

Aantal locaties:
1

Frequentie:
Wekelijks

Ruimtes:
Kantoorruimte, Kantine / pantry

Gebruiksintensiteit:
Intensief

Extra vervuiling:
Bovengemiddelde vervuiling

Schoonmaakmoment:
Geen voorkeur / in overleg

Omschrijving:
Kantine en kantoor van een autogarage; de werkplaats zelf wordt niet meegenomen

INTERNE PRIJSINDICATIE
Geschatte schoonmaaktijd: 65–140 minuten per bezoek
Calculatietijd (gebruikt voor onderstaande prijzen): 137 min
Minimum gezonde prijs: €110,00 excl. btw per bezoek
Adviesprijs: €110–€135 excl. btw per bezoek
Advies maandbedrag: €480–€590 excl. btw (Wekelijks)
Max. verantwoord ZZP-tarief: €32,50/u
Betrouwbaarheid: Middel

MIDDELEN & VERVOER
Middelen/materialen: €3,00–€5,00 per bezoek (gebruikt: €5,00)
Retourkilometers (standaardschatting, niet gemeten): 20 km
Interne voertuigkosten: €7,00 per bezoek
Totale interne kostprijs per bezoek: €86,41

INTERN ADVIES
🟡 Betrouwbaarheid: Middel – exacte m² niet opgegeven (categorie-inschatting gebruikt); bovengemiddelde vervuiling opgegeven.
Interne calculatie – niet automatisch aan de klant gecommuniceerd en geen definitieve offerte.

CONTACTGEGEVENS
Contactpersoon:
Frank Verberne

Bedrijfsnaam:
Garagebedrijf Van Brussel B.V.

E-mail:
frank@vanbrussel.nl

Telefoon:
0492123456

Plaats:
Liessel
```

De HTML-versie (`bouwEmailHtmlOfferte`) bevat exact dezelfde vijf secties
(Aanvraag / Interne prijsindicatie / Middelen & vervoer / Intern advies /
Contactgegevens), netjes opgemaakt, met dezelfde escaping als voorheen.

## 8. Resultaat van het garagebedrijf-testscenario (briefpunt 14)

Scenario: zakelijke periodieke schoonmaak, tot 50m² te reinigen, kantoor +
kantine (NIET de werkplaats), dagelijks/intensief gebruikt, autogarage-
context, 1×/week — exact het scenario hierboven onder punt 7.

Resultaat (`calculateOffer()`):
- **Tijdsbandbreedte:** 65–140 minuten per bezoek (calculatietijd: 137 min)
- **Adviesprijs:** €110–€135 excl. btw per bezoek
- **Advies maandbedrag:** €480–€590 excl. btw
- **Max. verantwoord ZZP-tarief:** €32,50/u
- **Betrouwbaarheid:** Middel — factoren: "exacte m² niet opgegeven
  (categorie-inschatting gebruikt)", "bovengemiddelde vervuiling opgegeven"
- De werkplaats zelf is **niet** meegerekend: alleen de taakspecifieke tijd
  van de geselecteerde ruimtes (kantoor + kantine) telt mee. Een aparte test
  (`test_calculator.js`, Test 9) bevestigt expliciet dat hetzelfde scenario
  mét `ruimte_werkplaats` toegevoegd een hogere tijdsschatting oplevert —
  het niet-selecteren maakt dus daadwerkelijk verschil, in plaats van
  stilzwijgend toch te worden meegerekend.
- Wanneer de vervuiling in plaats daarvan als "Anders / toelichting" wordt
  opgegeven (bijv. een eigen omschrijving van meegekomen werkplaatsvuil),
  toont het interne advies altijd expliciet **"🟠 Locatieopname
  aanbevolen"** in plaats van een te zeker gepresenteerde prijs
  (`test_calculator.js` Test 9b, `test_offerte_api.js` Test 6d).
- De volledige wizardflow (inclusief de nieuwe velden, mét het exacte-m²-veld
  bewust leeg gelaten) is end-to-end doorlopen in `test_wizard.js` Scenario
  19: de payload die daadwerkelijk naar `/api/offerte-aanvraag` zou gaan is
  gecontroleerd op het ontbreken van `ruimte_werkplaats`, en vervolgens
  onafhankelijk opnieuw doorgerekend met `calculateOffer()`.

## 9. Overzicht van alle uitgevoerde tests

- `node --check` op alle gewijzigde/nieuwe bestanden (`js/main.js`,
  `api/offerte-aanvraag.js`, `lib/calculator.js`) — geen syntaxfouten.
- **`test_calculator.js` (nieuw, 21 tests, allemaal geslaagd):** particuliere
  aanvraag → altijd `null`; niet-calculeerbare dienst → `niet_beschikbaar`;
  onbekende oppervlakte/vervuiling/frequentie → `onvoldoende_info` met
  correcte redenen, nooit een bedrag; Klein/Middel/Groot/Zeer groot →
  oplopende tijdsbandbreedte; "Zeer groot" → betrouwbaarheid Middel; exact m²
  krijgt voorrang op categorie én verhoogt de betrouwbaarheid; onrealistische
  m²-invoer (0, negatief, >20.000) wordt genegeerd (inclusief een tijdens
  deze ronde zelf gevonden en gefixte bug: `parseExactM2("-5")` gaf eerder
  `5` terug in plaats van de invoer af te wijzen — zie hieronder);
  gebruiksintensiteit beïnvloedt de tijd en het ontbreken ervan verlaagt de
  betrouwbaarheid; reguliere vs. bijzondere vervuiling (incl. dat "Anders /
  toelichting" altijd Laag + locatieopname triggert); het volledige
  **autogarage-regressiescenario** (incl. de bevestiging dat de werkplaats
  nooit automatisch wordt meegerekend); 1× vs. meerdere keren per week (met
  en zonder geldig aantal); materiaalberekening per categorie;
  kilometerkosten (vaste fallback, nooit een verzonnen afstand); dat
  betaalde reistijd nooit automatisch een kostenpost is; de minimumprijs als
  vangnet; de adviesprijsbandbreedte-afronding (geen schijnprecisie,
  ondergrens altijd naar boven, consistent met "minimum gezonde prijs"); het
  maandbedrag (consistent met de al-afgeronde per-bezoekprijzen); het
  maximaal verantwoorde ZZP-tarief (alleen bij voldoende betrouwbaarheid,
  nooit boven het eigen referentietarief); de betrouwbaarheidsbeoordeling
  zelf (Laag wint altijd van Middel); de kleine gedeelde helpers
  (`roundStep`, `formatDuurBandbreedte`); en dat een lege/rommelige
  `calc`-payload nooit crasht of een verzonnen bedrag oplevert.
- **`test_offerte_api.js` (herschreven, 17 tests, allemaal geslaagd):**
  onderwerp + volledige e-mailtekst voor het garagescenario; een
  kruiscontrole dat de e-mail exact dezelfde cijfers gebruikt als
  `calculateOffer()` zelf (geen tweede/verouderde formule meer in
  `api/offerte-aanvraag.js`); "Meerdere keren per week" met en zonder geldig
  aantal; de minimumprijs-clamp; het "onvoldoende informatie"-pad; de
  particuliere flow (geen interne sectie); Kantoorreiniging (zelfde bereik
  als periodiek-zakelijk); een niet-calculeerbare dienst (Glasbewassing) →
  expliciete "niet beschikbaar", nooit een bedrag; bijzondere vervuiling →
  zichtbaar "Locatieopname aanbevolen"-advies; botdetectie; veldvalidatie;
  de meerdere-locaties-waarschuwing; afwezigheid van Web3Forms-/hardcoded-
  secret-referenties; HTML-mailpariteit + HTML-injectiebescherming; expliciet
  dat een door de client meegestuurd (gemanipuleerd) prijsveld de
  servercalculatie niet beïnvloedt; en de drie handlertests (veilig falen
  zonder Resend-config, normale verzending met gemockte Resend, veilige
  502-afhandeling bij een afwijzing door Resend).
- **`test_wizard.js` (16 bestaande + 3 nieuwe scenario's, allemaal geslaagd):**
  alle 16 scenario's uit rondes 39-45 zijn ongewijzigd blijven slagen
  (particuliere flow, dienst-preselectie, auto-advance incl. de
  ronde-45-regressiefix, samengestelde stappen die nooit auto-advancen).
  Nieuw: **Scenario 17** — typen in het exacte-m²-veld op stap 7 annuleert
  een reeds gestarte auto-advance-timer van de oppervlaktecategorie, en
  "Volgende" blijft daarna gewoon werken als fallback; **Scenario 18** —
  gebruiksintensiteit (samengestelde stap 9) advancet nooit vanzelf;
  **Scenario 19** — het volledige autogarage-regressiescenario end-to-end
  door de wizard, met verificatie van de exacte payload richting het
  endpoint én een onafhankelijke herberekening met `calculateOffer()`.
- **`test_contact_api.js` (10 tests) en `test_mail.js` (10 tests) —
  ongewijzigd, allemaal nog steeds groen**, bevestigt dat het
  contactformulier en de gedeelde Resend-verzendlogica niet zijn geraakt.
- Handmatige controles: geen "BrabantSchoon"/"Brabant Schoon" ergens in de
  broncode of gegenereerde bestanden; geen duplicate HTML-`id`'s in
  `offerte.html`; `ASSET_VERSION` (180) consistent doorgevoerd in alle
  gegenereerde pagina's; geen letterlijke Resend-sleutel (`re_...`) in de
  broncode of de zip.

**Tijdens het testen zelf gevonden en gefixte bug** (vóór enige externe
review, tijdens mijn eigen implementatie): `parseExactM2()` gebruikte een
regex zonder ondersteuning voor een minteken, waardoor "-5" werd gelezen als
"5" in plaats van als ongeldige invoer te worden afgewezen. Gefixt door het
minteken expliciet in de match op te nemen (`/-?\d+(\.\d+)?/`), zodat een
negatief getal nu correct wordt genegeerd in plaats van stilzwijgend
positief gemaakt. Ook gevonden (en als bewust, niet-fout gedrag bevestigd,
geen fix nodig): het maximaal verantwoorde ZZP-tarief kan in het randgeval
exact gelijk zijn aan het ZZP-referentietarief zelf (zie punt 10 hieronder)
— wiskundig correct bij de ondergrens van de adviesprijs, maar wel een punt
om in de gaten te houden bij de kalibratie.

**Alle tests slagen.**

## 10. Punten waar een ondernemersbeslissing van Egzon nodig is

1. **Alle "TE BEVESTIGEN"-parameters** (zie punt 6): ZZP-referentietarief
   (€32,50), voertuigkosten/km (€0,35), gewenste/minimum marge (35%/20%),
   minimumprijs (€45), standaard retourkilometers (20 km). Dit zijn
   verdedigbare startaannames, geen bevestigde Brabantschoon-tarieven.
2. **Alle "TE KALIBREREN"-tijdparameters** (minuten per m², tijd per
   ruimtetype, intensiteits-/frequentie-/vervuilingsfactoren) — deze horen
   te worden bijgesteld zodra er echte Brabantschoon-opdrachten zijn om
   geschatte tegen werkelijke tijd af te zetten.
3. **Reistijd als kostenpost:** momenteel bewust UIT gezet
   (`TRAVEL_TIME_IS_PAID_LABOR: false`), omdat Brabantschoon de eerste
   opdrachten waarschijnlijk zelf uitvoert. Zodra structureel een ZZP'er of
   personeelslid wordt ingezet die voor reistijd betaald moet worden, is dit
   een bewuste knop om aan te zetten in `lib/calculator.js` — geen
   codewijziging nodig, wel een ondernemersbeslissing over hoeveel/of.
4. **Automatische afstandsbepaling:** er is bewust geen Google
   Maps/API-integratie gebouwd deze ronde (buiten scope). De 20 km
   retourkilometers is een vaste, transparant gelabelde fallback-schatting
   voor het kerngebied (Zuidoost-Brabant/Peelgemeenten) — geen gemeten
   waarde per aanvraag. Als een preciezere afstandsbepaling gewenst is, is
   dat een aparte, latere beslissing (met een eigen kosten-/
   complexiteitsafweging).
5. **Max. verantwoord ZZP-tarief bij de prijsondergrens:** wiskundig geldt
   dat dit tarief, wanneer de minimumprijs niet als vangnet wordt toegepast,
   in het randgeval exact gelijk kan zijn aan het ingestelde
   ZZP-referentietarief zelf (zoals in het garagevoorbeeld: beide €32,50/u).
   Dat is correct (bij de absolute prijsondergrens blijft er precies genoeg
   over om het referentietarief te dekken, niet meer), maar betekent dat dit
   getal in de praktijk vaak weinig extra's toont bovenop de al bekende
   `ZZP_REFERENTIETARIEF_PER_UUR_EXCL_BTW`. Het is aan Egzon om te bepalen of
   dit voldoende bruikbaar is, of dat de formule later verfijnd moet worden
   zodra er meer duidelijkheid is over de gewenste ZZP-tariefstelling.
6. **Scope van de calculator** (welke diensten) is deze ronde bewust
   ongewijzigd gelaten (`periodiek-zakelijk`, `kantoorreiniging`) — een
   eventuele uitbreiding naar andere zakelijke diensten is een aparte,
   toekomstige beslissing.
