# CHANGELOG — Ronde 47: definitieve kalibratie Calculator v2

Deze ronde is **geen nieuwe Calculator v3 en geen redesign**. De architectuur uit
ronde 46 (`lib/calculator.js` als centrale gedeelde module, tijdsbandbreedtes,
conservatieve calculatietijd, minimum gezonde prijs, adviesprijsbandbreedte,
maandbedrag, betrouwbaarheid Hoog/Middel/Laag, locatieopname-advies, max.
verantwoord ZZP-tarief, het optionele exacte-m²-veld, gebruiksintensiteit,
frequentie, de vijfdelige interne e-mail, server-side berekening, Resend,
auto-advance, dienst-preselectie, de particuliere flows) blijft **volledig
behouden**. Deze ronde corrigeert uitsluitend de commerciële/tijdtechnische
startparameters en de kilometerfallback, zodat Calculator v2 realistische interne
schattingen geeft zonder overdreven stapeling van conservatieve factoren.

Deze ronde is in één keer production-ready opgeleverd, direct te uploaden over
ronde 46 (`Brabantschoon-ronde47.zip`).

---

## 1. Exact welke tijdparameters zijn gewijzigd

Ronde 46 bouwde de tijdschatting op als **m²-tijd × overhead × ruimtetoeslagen ×
intensiteitsfactor × vervuilingsfactor × frequentiefactor**, en gebruikte daarna
standaard de bovengrens van élk van die factoren. Dat stapelde behoudende
aannames op behoudende aannames ("cumulatieve overcalculatie").

Ronde 47 vervangt dat volledig door één coherente, oppervlakte-gedreven pijplijn
in `lib/calculator.js`:

1. **Puntschatting op basis van oppervlakte** (`CURVE_NORMAAL_M2_MINUTEN` /
   `CURVE_INTENSIEF_M2_MINUTEN`): een vloeiende, stuksgewijs lineaire curve
   opgebouwd uit de exacte Brabantschoon-startnormen uit de brief (t/m 50 m²,
   51–100, 101–150, 151–250 m², voor zowel Normaal als Intensief gebruik).
   Oppervlakte is nu letterlijk de **primaire tijdsbasis** — geen vaste
   categorietijd meer die vervolgens vermenigvuldigd wordt.
   - "Gemiddeld" en "Intensief" kiezen elk een **andere curve** (tabelkeuze)
     in plaats van een vermenigvuldigende `INTENSITEIT_FACTOR` — dit is de kern
     van de structurele fix.
   - "Rustig" vertrekt vanaf de Normaal-curve met een gematigde korting
     (`RUSTIG_FACTOR = 0.90`) en een praktische bodem (`RUSTIG_MINIMUM_MINUTEN =
     35`), zodat een kleine opdracht nooit theoretisch naar bijv. 20 minuten kan
     zakken.
   - Voorbij 250 m² is er geen harde brief-opgave; de curve extrapoleert met de
     helling van het laatste gegeven segment (150→250 m²) — nooit een
     hardcoded getal, altijd vergezeld van een verlaagde betrouwbaarheid (zie
     punt 6 hieronder).
   - **Gedocumenteerde inconsistentie gladgestreken**: de brief zelf sluit bij
     de Intensief-tabel niet perfect aan (101–150 m² eindigt op 120 min,
     151–250 m² begint op 135 min — een sprong van 15 minuten exact op de
     grenswaarde). Om een "vreemde sprong" op 150/151 m² te voorkomen (een
     expliciete eis uit de brief) is dit breekpunt gladgestreken naar 120 min,
     met een vloeiend vervolg naar 180 min bij 250 m². Zie de commentaren in
     `lib/calculator.js` bij `CURVE_INTENSIEF_M2_MINUTEN`.
2. **Ruimtecorrecties** (`ROOM_TASK_MINUTES`): kleine, **additieve** correcties
   in minuten (niet langer vermenigvuldigend), en alleen voor aantoonbaar
   arbeidsintensieve onderdelen. Kantoor, gangen en entree zitten al in de
   m²-basistijd en geven nu **0 minuten extra** (zie punt 2 hieronder).
3. **Vervuilingscorrectie** (`VERVUILING_CORRECTIE`): een gematigde
   percentagecorrectie op de puntschatting (0% / ~7,5% / ~15% / 0%), in plaats
   van een aparte vermenigvuldigende factor (was 1.0–1.60).
4. **Frequentiecorrectie** (`FREQUENTIE_CORRECTIE` /
   `FREQUENTIE_MEERDERE_PER_WEEK`): eveneens gematigde percentages t.o.v.
   "Wekelijks" (0% referentiepunt), in plaats van brede vermenigvuldigende
   bandbreedtes (was 0.75–1.50).
5. **Bandbreedte pas aan het eind**: de min–max-marge om de puntschatting heen
   (`SPREAD_MET_EXACT_M2 = 8%`, `SPREAD_ZONDER_EXACT_M2 = 12%`) wordt nu als
   allerlaatste stap toegepast op de al-gecorrigeerde puntschatting — niet meer
   vooraf berekend en vervolgens nogmaals vermenigvuldigd.
6. **Absolute praktische bodem**: `ABSOLUTE_MINIMUM_MINUTEN = 30` als laatste
   vangnet tegen een ongelukkige combinatie van kortingen.

De oude `MINUTES_PER_M2`, `REFERENCE_M2_BY_OPPERVLAKTE` (als tijdmodel-input),
`VISIT_OVERHEAD_MINUTES`, `INTENSITEIT_FACTOR` en de brede `VERVUILING_FACTOR`/
`FREQUENTIE_FACTOR`-bandbreedtes uit ronde 46 zijn volledig vervangen.

## 2. Hoe dubbele tijdstelling is voorkomen

`ROOM_TASK_MINUTES` is opnieuw gekalibreerd volgens één principe: **een ruimte
mag alleen corrigeren voor aantoonbaar arbeidsintensieve onderdelen, nooit voor
werk dat al in de reguliere m²-basistijd zit.**

- Kantoorruimte, gangen/verkeersruimte en entree: **0 minuten** (al inbegrepen
  in de m²-basistijd — was 5–10 / 0–5 / 5–10 minuten in ronde 46).
- Vergaderruimte: 0–5 min (kleine correctie, alleen indien aantoonbaar nodig).
- Kantine/pantry, sanitair, kleedruimte: kleine, beperkte correcties
  (respectievelijk 3–8, 4–8, 2–6 min — fors lager dan ronde 46's 10–20/10–20/
  5–10 min), toegepast als het gemiddelde van de bandbreedte.
- Werkplaats: 15–25 min, **uitsluitend wanneer deze ruimte zelf is
  aangevinkt** — de werkplaatsvloer wordt nooit automatisch meegerekend als
  hij niet geselecteerd is (getest in `test_calculator.js` Test 11/12).

Test bevestigt: alleen kantoor selecteren geeft exact dezelfde tijd als kantoor +
gangen + entree samen (0 minuten verschil) — geen dubbele telling meer.

## 3. Nieuwe garage-testuitkomst (het scenario uit de brief)

Zakelijke periodieke schoonmaak, ≤50 m², alleen kantoor + kantine (werkplaats
NIET geselecteerd), intensief gebruik, wekelijks:

| Vervuiling | Ronde 46 | **Ronde 47** |
|---|---|---|
| Normale vervuiling | 65–140 min, 137 calculatiemin. | **65–90 min, 85 calculatiemin.** |
| Bovengemiddelde vervuiling | 65–140 min, 137 calculatiemin. | **75–100 min, 98 calculatiemin.** |

Adviesprijs bij normale vervuiling: **€65–€80** excl. btw per bezoek, advies
maandbedrag **€290–€350** excl. btw, betrouwbaarheid **Middel** (nooit hoger dan
Middel voor dit scenario, zoals gevraagd). Bij "Anders / toelichting" (bijv. een
eigen omschrijving van olie/vet/zware werkplaatsvervuiling) blijft de tijd zelf
gelijk aan het normale scenario (geen automatische opslag) maar zakt de
betrouwbaarheid naar **Laag** met **"Locatieopname aanbevolen"**.

De brief noemt haar eigen voorbeeldcijfers (~60–75 / ~65–90 min) expliciet als
richting, niet als hardcoded doel — de bovenstaande uitkomst volgt rechtstreeks
uit de gecorrigeerde formule en ligt in dezelfde orde van grootte, ruim onder de
oude 137/140-minutengrens en **ver onder 2 uur**.

## 4. Normale ≤50 m²-testuitkomst

Categorie "Klein" (referentie 35 m²), gebruiksintensiteit Gemiddeld, wekelijks,
alleen kantoorruimte, normale vervuiling: **45–65 minuten**. Bij een exact
opgegeven m² van 50: **55–65 minuten** (smallere bandbreedte dankzij de
verfijning, zie punt 9).

## 5. Intensieve ≤50 m²-testuitkomst

Zelfde scenario, gebruiksintensiteit Intensief: **60–80 minuten**.

## 6. Wat er gebeurt bij bovengemiddelde vervuiling

Een gematigde correctie van ~15% (richtwaarde uit de brief: 10–20%) op de
puntschatting — géén nieuwe vermenigvuldigende factor die samen met
intensiteit/frequentie verder kon opstapelen. In het garagescenario geeft dit
65–90 → 75–100 minuten (+10 min op de calculatietijd), in plaats van de
"Intensief × Bovengemiddeld"-stapeling uit ronde 46 die tot 137 minuten leidde.
"Anders / toelichting" krijgt bewust **geen** automatische vermenigvuldiging
meer (was 1.30–1.60×) — in plaats daarvan verlaagt dit de betrouwbaarheid naar
Laag en adviseert het altijd een locatieopname.

## 7. Hoe onbekende kilometers nu worden behandeld (BELANGRIJKE CORRECTIE)

Ronde 46 gebruikte standaard **20 km retour** wanneer de echte afstand onbekend
was, en liet dat bedrag de kostprijs/verkoopprijs beïnvloeden. Dat is in ronde 47
**volledig verwijderd** (`DEFAULT_ROUND_TRIP_KM` bestaat niet meer in `CONFIG`):

- **Afstand onbekend** (geen retourkilometers ingevuld): `km = null`,
  `voertuigkosten = €0` in de voorlopige kostprijs, `vervoerNogTeBepalen = true`.
  De interne e-mail toont expliciet **"Retourkilometers: nog te bepalen"** /
  **"Voertuigkosten: nog te bepalen"** en de regel **"Vervoer nog niet
  meegerekend — verkoopindicatie is exclusief nog te bepalen vervoerskosten."**
- **Afstand bekend**: een nieuw, optioneel wizardveld ("Retourafstand vanaf
  Brabantschoon", stap 10 — Toelichting, naast "Aantal locaties", zichtbaar voor
  elke zakelijke/VvE-aanvraag) levert `calc.retourKm`. Server-side telt dit mee
  als `retourkilometers × €0,35`, en de e-mail toont het daadwerkelijke aantal
  km + de daadwerkelijke voertuigkosten.
- Een onbekende afstand verlaagt **niet** de betrouwbaarheid van de
  schoonmaaktijd zelf — dat is een aparte, commerciële kostenpost, geen
  tijdsinschattingsprobleem (getest in `test_calculator.js` Test 15b).
- Onrealistische/negatieve invoer (`parseRetourKm`) wordt genegeerd en telt als
  "onbekend" — er wordt nooit een afstand verzonnen.

`ASSET_VERSION` is opgehoogd naar `181` (nieuw wizardveld in `generate.py`/
`js/main.js`).

## 8. Hoe het max. ZZP-tarief wordt berekend

De formule zelf (ondergrens adviesprijs → minimale gezonde marge reserveren →
overige directe kosten (materiaal + voertuig) aftrekken → resterend budget ÷
calculatie-uren) is wiskundig ongewijzigd t.o.v. ronde 46 — dat was al exact de
formule die de brief zelf beschrijft. **De reden dat het garagescenario in ronde
46 precies op het referentietarief (€32,50/u) uitkwam, is een onvermijdelijke
wiskundige eigenschap van die formule** (transparant gedocumenteerd in
`lib/calculator.js` bij `berekenMaxZzpTarief()`): zolang de adviesprijs-ondergrens
niet door de absolute bodemprijs (€45) omhoog geduwd wordt, is
`max. ZZP-tarief` per constructie altijd exact gelijk aan het referentietarief.

Om dit desondanks commercieel informatief te maken, toont Calculator v2 nu
**altijd** ook:
- **Referentie ZZP-tarief** (€32,50/u) apart in de e-mail, zodat direct
  zichtbaar is of een opdracht bij dat tarief schaalbaar is.
- **Uitbesteedbaarheid**: een eenvoudige, centrale driestandenclassificatie
  (`bepaalUitbesteedbaarheid()`) op basis van de verhouding tussen het max.
  ZZP-tarief en het referentietarief:
  - **Goed uitbesteedbaar** (ratio ≥ 1,05) — vooral bij kleine opdrachten die
    tegen de absolute bodemprijs (€45) aanlopen: getest scenario geeft
    €44,14/u (ruim boven het referentietarief).
  - **Krap uitbesteedbaar** (0,90 ≤ ratio < 1,05) — het meest voorkomende geval
    (waaronder het garagescenario: €32,50/u = exact referentieniveau).
  - **Niet gezond uitbesteedbaar** (ratio < 0,90, of geen tarief berekenbaar
    door lage betrouwbaarheid).

## 9. Overige wijzigingen (behorend bij de opgedragen scope)

- **Exact m² geeft nu een smallere bandbreedte** dan alleen een categorie
  (8% spread vs. 12%) — directe, meetbare "verfijning" zoals gevraagd. 55 m² en
  145 m² (beide onder categorie "Middel") geven aantoonbaar verschillende
  uitkomsten.
- **Grenswaardetests** op 50/51, 100/101, 150/151 en 250/251 m² bevestigen dat
  de puntschatting op geen van deze grenzen met meer dan een paar minuten
  springt.
- **Frequentie** is gematigd: Wekelijks = referentiepunt (0%), Maandelijks
  +20%, Eenmalig +15%, In overleg +8%, "Meerdere keren per week" schaalt met
  het opgegeven aantal (2× → −5%, 3–4× → −10%, 5×+ → −15%, met een bodem zodat
  essentiële taken nooit verdwijnen). Zonder een geldig aantal bij "Meerdere
  keren per week" wordt bewust geen (onverdiende) korting toegepast.
- **>250 m²**: betrouwbaarheid wordt nu op basis van het daadwerkelijke
  (numerieke) `gebruikteM2` verlaagd, niet meer alleen op basis van de
  categorieknop "Zeer groot". Zonder exact m² geeft dit "Laag" +
  locatieopname-advies ("geen harde automatische eindprijs zonder nadere
  beoordeling"); mét exact m² blijft indicatief rekenen mogelijk op niveau
  Middel. Bij Intensief gebruik boven 250 m² wordt altijd een locatieopname
  aanbevolen, ook met een bekend exact m².
- Financiële startparameters (ZZP-referentietarief, voertuigkostprijs per km,
  marges, absolute minimumprijs, materiaalbandbreedtes) zijn **ongewijzigd**
  gelaten — zie punt 10.

## 10. Welke financiële parameters nog TE BEVESTIGEN zijn

Ongewijzigd t.o.v. ronde 46, stuk voor stuk nog te bevestigen door de
ondernemer (zie de `// TE BEVESTIGEN`/`// TE KALIBREREN`-markeringen in
`lib/calculator.js`):

- `ZZP_REFERENTIETARIEF_PER_UUR_EXCL_BTW` — €32,50/u
- `VEHICLE_COST_PER_KM_EXCL_BTW` — €0,35/km
- `DESIRED_GROSS_MARGIN` — 35%
- `MINIMUM_GROSS_MARGIN` — 20%
- `MIN_PRICE_PER_VISIT_EXCL_BTW` — €45
- `MATERIAL_COST_PER_VISIT_BY_OPPERVLAKTE_EXCL_BTW` — €3–€5 / €5–€8 / €8–€14 /
  €14–€22 (Klein/Middel/Groot/Zeer groot)
- Het volledige tijdmodel (`CURVE_NORMAAL_M2_MINUTEN`,
  `CURVE_INTENSIEF_M2_MINUTEN`, `ROOM_TASK_MINUTES`, `VERVUILING_CORRECTIE`,
  `FREQUENTIE_CORRECTIE`, de spread-percentages) — dit zijn interne
  startnormen die pas met echte Brabantschoon-opdrachten (geschat vs.
  werkelijk) definitief gekalibreerd kunnen worden.
- `UITBESTEEDBAARHEID_GOED_RATIO` (1,05) / `UITBESTEEDBAARHEID_KRAP_RATIO`
  (0,90) — nieuwe classificatiedrempels, eveneens een eerste, verdedigbare
  aanname.

Geen van deze parameters is deze ronde zelf verzonnen of gewijzigd — uitsluitend
de tijdmodel-structuur, de vervuilings-/frequentiecorrecties en de
kilometerfallback zijn aangepast, zoals opgedragen.

## Volledige testresultaten

Alle vijf testsuites geslaagd, geen regressies:

- `node test_calculator.js` → **32 testgroepen, alle geslaagd** (uitgebreid met
  grenswaardetests, curve-interpolatie, het garagescenario met de expliciete
  "nooit 2+ uur"-toets, vervoer/km-tests, uitbesteedbaarheid-classificatie).
- `node test_offerte_api.js` → **19 testgroepen, alle geslaagd** (inclusief een
  nieuwe test voor "nog te bepalen"-vervoer en een bekende retourafstand in de
  e-mail).
- `node test_contact_api.js` → alle tests geslaagd (ongewijzigd, regressie
  bevestigd).
- `node test_mail.js` → alle tests geslaagd (ongewijzigd, regressie bevestigd).
- `node test_wizard.js` → **20 scenario's, alle geslaagd** (19 bestaand +
  Scenario 20 nieuw: het retourafstand-veld wordt correct getoond/verborgen op
  basis van klanttype en komt correct in de calculatie terecht; Scenario 19's
  garagescenario-assertie is aangescherpt van "< 240 min" naar "< 120 min").

**Expliciete pre-oplevering-controle** (letterlijk gevraagd door de opdracht):
het garagescenario schiet in geen enkele geteste combinatie (normale vervuiling,
bovengemiddelde vervuiling, met/zonder werkplaats, met/zonder exact m²) meer
richting 2+ uur door gestapelde bovengrensfactoren — de hoogste geteste
calculatietijd voor dit scenario is 98 minuten (bovengemiddelde vervuiling),
ruim onder de oude 137 minuten en ver onder de 120-minutengrens.

---

*Zie `CHANGELOG-46.md` voor de volledige vergelijking tussen Calculator v1 en
Calculator v2, en de commentaren bovenin `lib/calculator.js` voor de volledige,
regel-voor-regel toelichting bij elke parameter.*
