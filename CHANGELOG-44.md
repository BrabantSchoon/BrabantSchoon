# Changelog — Brabantschoon website (ronde 44: wizard-UX, dienstconsistentie, calculatorbereik-analyse)

Deze ronde raakt uitsluitend de offertewizard-flow (dienstcontext, auto-advance),
de dienstenstructuur tussen website en wizard, en het BEREIK van de bestaande
interne calculator. **Geen enkele financiële parameter, tijdmodel- of
vervuilingsfactor-waarde is gewijzigd** (zie punt 15). Resend-mailflow,
reply-to, e-mailopmaak, contact-/footerformulier, honeypot, validatie, de
particuliere pakketten/prijslogica en SEO zijn ongewijzigd gebleven.

## 1. Waarom werd de dienst dubbel gevraagd?

De website heeft 7 zakelijke dienstpagina's (`SERVICES` in `generate.py`:
kantoorreiniging, glasbewassing, gevelreiniging, opleveringsschoonmaak,
vve-schoonmaak, periodieke-schoonmaak, specialistische-reiniging). Hun
offerte-CTA's linkten allemaal naar `offerte.html?type=zakelijk#offerteWizard`
— zonder dienst-parameter. De wizard-dienstenlijst (`MASTER_DIENSTEN`) kende
voor bijna al deze diensten ook geen eigen `data-dienst-slug`-attribuut (alleen
"Periodieke bedrijfsschoonmaak"/"Periodieke schoonmaak" hadden er één, voor de
interne calculator). Zonder dienst-parameter én zonder slug om op te matchen
kon de al langer bestaande URL-preselectielogica in `js/main.js` de dienst
domweg niet voorinvullen — de wizard viel dan terug op de normale flow en
vroeg de dienst gewoon opnieuw, ook al had de bezoeker die net op de
dienstpagina al impliciet aangegeven.

## 2. Hoe wordt de context nu van dienstpagina naar wizard meegenomen?

Elke van de 7 dienstpagina's kreeg in `MASTER_DIENSTEN` een eigen
`data-dienst-slug`, en een nieuwe `SERVICE_TO_WIZARD_DIENST_SLUG`-mapping
(`generate.py`) koppelt de website-slug aan die wizard-slug. Beide CTA's op elke
dienstpagina (de hoofd-CTA in de hero, én de `cta_band()` onderaan) geven nu
`?type=…&dienst=…` mee. De bestaande (ongewijzigde) URL-preselectielogica in
`js/main.js` herkent dit, vinkt klanttype én dienst automatisch aan, en slaat
zowel stap 1 (klanttype) als stap 2 (dienstvraag) over wanneer beide bekend
zijn — precies het bestaande gedrag dat al werkte voor de particuliere
dienstpagina's, nu ook voor de zakelijke.

## 3. Welke URL/queryparameterstructuur wordt gebruikt?

Ongewijzigd t.o.v. de bestaande, al werkende particuliere aanpak:
`offerte.html?type=<type>&dienst=<slug>#offerteWizard`. Concreet per dienstpagina:

| Dienstpagina | `type` | `dienst` |
|---|---|---|
| `diensten/kantoorreiniging.html` | `zakelijk` | `kantoorreiniging` |
| `diensten/glasbewassing.html` | `zakelijk` | `glasbewassing-zakelijk` |
| `diensten/gevelreiniging.html` | `zakelijk` | `gevelreiniging` |
| `diensten/opleveringsschoonmaak.html` | `zakelijk` | `opleveringsschoonmaak` |
| `diensten/vve-schoonmaak.html` | `vve` | `vve-schoonmaak` |
| `diensten/periodieke-schoonmaak.html` | `zakelijk` | `periodiek-zakelijk` (bestaande slug hergebruikt) |
| `diensten/specialistische-reiniging.html` | `zakelijk` | `specialistische-reiniging` |

`vve-schoonmaak` is de enige dienst die uitsluitend bij VvE hoort (in
`MASTER_DIENSTEN` alleen `["vve"]`), dus die pagina gebruikt bewust `type=vve`
in plaats van het overal elders gebruikte generieke `type=zakelijk` (dat naar
"Bedrijf" voorselecteert). De 4 diensten die zowel voor bedrijf als VvE gelden
(glasbewassing/gevelreiniging/opleveringsschoonmaak/specialistische reiniging)
gebruiken, net als de rest van de site, het generieke `type=zakelijk`
("Bedrijf") — een VvE-bezoeker kan dit altijd corrigeren via "Terug" naar de
klanttype-vraag. De algemene offerteknoppen (diensten-overzicht,
zakelijke-schoonmaak-overzicht, werkgebiedpagina's) zijn bewust NIET gewijzigd
— die geven nooit een specifieke dienst mee, dus vragen terecht nog gewoon
"Waar wilt u een offerte voor aanvragen?" (zie punt 4 uit de brief).

## 4. Hoe worden ongeldige dienstparameters afgehandeld?

Ongewijzigd, robuust gedrag (al aanwezig vóór deze ronde, nu getest — zie
`test_wizard.js` Scenario 7): een onbekende of niet-bestaande `?dienst=`-waarde
matcht simpelweg geen enkele `data-dienst-slug`, dus `dienstOk` blijft `false`
en de wizard valt terug op de normale dienstvraag (stap 2) — nooit een lege of
kapotte state, en de eventueel wél geldige `type`-parameter blijft gewoon
staan (klanttype-stap wordt dus nog steeds overgeslagen).

## 5. Welke single-choice stappen gebruiken nu auto-advance?

Alleen stappen die **uitsluitend** één radio-groep bevatten (geen ander,
mogelijk nog leeg verplicht veld op dezelfde stap):

- Stap 1 — Klanttype
- Stap 2 — Dienst
- Stap 3 — Pakket (particulier)
- Stap 6 — Frequentie (particulier, alleen bij periodiek)
- Stap 7 — Oppervlakte/locatiegrootte (bedrijf/VvE)
- Stap 8 — Frequentie (bedrijf/VvE) — **behalve** bij "Meerdere keren per
  week" (zie punt 6)

Na selectie volgt een vaste vertraging van 200ms (binnen de gevraagde
150–250ms-marge) vóórdat de wizard doorspringt — lang genoeg om de
al bestaande 'geselecteerd'-stijl op het gekozen kaartje even te laten zien,
kort genoeg om niet traag aan te voelen.

## 6. Welke stappen gebruiken bewust GEEN auto-advance?

- Stap 4 (particulier: woninginfo) en stap 5 (particulier: extra
  werkzaamheden) — samengestelde stappen met meerdere (deels conditionele)
  vragen die gecombineerd moeten worden vóór de stap compleet is.
- Stap 9 (bedrijf/VvE: ruimtes/vervuiling/schoonmaakmoment) — meerdere losse
  vragen (checkboxgroep + 2 radiogroepen) op één stap; zelfs de radiogroepen
  daarbinnen advancen niet, precies zoals brief-scenario E vraagt.
- Stap 8, specifiek bij de keuze "Meerdere keren per week": er verschijnt dan
  een extra verplicht invoerveld (aantal keer per week) op dezelfde stap — de
  gebruiker vult dat zelf in en klikt zelf "Volgende".
- Stap 10 (toelichting), 11 (gegevens), 12 (controle) — bevatten geen enkele
  single-choice-vraag, dus sowieso niet van toepassing.
- Tekstvelden, datumvelden, aantallen en checkboxgroepen zijn nooit aan
  auto-advance gekoppeld.

Toegankelijkheid blijft ongewijzigd: dezelfde native `<input type="radio">` +
`<label>`-structuur, dus toetsenbordnavigatie (Tab/pijltjes/Spatie) werkt
identiek aan voorheen, en `aria-live`/focus-naar-stap-titel (al aanwezig in
`show()`) wordt automatisch ook bij een auto-advance uitgevoerd — een
schermlezer krijgt dus dezelfde aankondiging als bij een handmatige
stapwissel.

## 7. Hoe werkt Terug zonder automatisch weer vooruit te springen?

Auto-advance wordt uitsluitend gestart vanuit een 'change'-event van een
ECHTE gebruikersactie. Een programmatische `.checked = true` (bijv. bij
URL-voorselectie, of bij het resetten van velden elders in de wizard) vuurt in
JavaScript nooit een 'change'-event — dus kan nooit per ongeluk een
auto-advance triggeren. Terugnavigeren via `show()` verandert bovendien geen
enkele radiowaarde en vuurt dus sowieso geen 'change'. Daarnaast annuleert
zowel `show()` zelf als elke handmatige navigatie (Terug/Volgende/"Keuze
wijzigen") een eventueel nog lopende auto-advance-timer meteen — zo kan een
late auto-advance nooit een inmiddels handmatige stapwissel overschrijven.
Resultaat (zie `test_wizard.js` Scenario 10, letterlijk het scenario uit de
brief): na Terug staat de eerdere keuze nog gewoon aangevinkt, de wizard
springt niet vanzelf weer vooruit, en pas een NIEUWE selectie advancet weer
normaal.

## 8. Hoe is "Uw keuze" gerepareerd?

Technisch was dit al werkend voor particuliere dienstpagina's — het probleem
was uitsluitend dat zakelijke dienstpagina's nooit een geldige
dienst-parameter meegaven (zie punt 1), waardoor "Uw keuze" voor die flows
altijd leeg bleef. Met de mapping uit punt 2/3 toont de balk nu voor alle 7
zakelijke dienstpagina's gewoon de gekozen dienstnaam (bijv. "Kantoorreiniging"
of "VvE-schoonmaak"), en "Keuze wijzigen" werkt zoals voorheen (terug naar de
pakket- of dienststap, afhankelijk van wat al bekend is).

## 9. Volledige mapping van zakelijke diensten

| Website (`SERVICES`) | Eigen pagina | Wizard-label(s) (`MASTER_DIENSTEN`) | Klanttype(s) | Wizard-slug | Interne calculator |
|---|---|---|---|---|---|
| Kantoorreiniging | Ja | Kantoorreiniging | bedrijf | `kantoorreiniging` | **Ja (nieuw, ronde 44)** |
| — | Nee | Periodieke bedrijfsschoonmaak | bedrijf | `periodiek-zakelijk` | Ja (bestond al) |
| — | Nee | Winkel- of showroomreiniging | bedrijf | *(geen)* | Nee |
| — | Nee | Praktijk- of zorglocatiereiniging | bedrijf | *(geen)* | Nee |
| — | Nee | Industriële schoonmaak | bedrijf | *(geen)* | Nee |
| — | Nee | Evenementenreiniging | bedrijf | *(geen)* | Nee |
| VvE-schoonmaak | Ja | VvE-schoonmaak | vve | `vve-schoonmaak` | Nee |
| — | Nee | Trappenhuisreiniging | vve | *(geen)* | Nee |
| — | Nee | Schoonmaak van gemeenschappelijke ruimtes | vve | *(geen)* | Nee |
| Periodieke schoonmaak | Ja | Periodieke schoonmaak (vve) | vve | `periodiek-zakelijk` (gedeeld met bedrijfsvariant) | Ja (bestond al) |
| — | Nee | Schoonmaak van scholen of instellingen | vve | *(geen)* | Nee |
| — | Nee | Zorglocaties | vve | *(geen)* | Nee |
| Glasbewassing | Ja | Glasbewassing | bedrijf + vve | `glasbewassing-zakelijk` | Nee |
| Gevelreiniging | Ja | Gevelreiniging | bedrijf + vve | `gevelreiniging` | Nee |
| Opleveringsschoonmaak | Ja | Opleveringsschoonmaak | bedrijf + vve | `opleveringsschoonmaak` | Nee |
| Specialistische reiniging | Ja | Specialistische reiniging | bedrijf + vve | `specialistische-reiniging` | Nee |
| — | Nee | Anders / eigen omschrijving | bedrijf + vve | *(geen)* | Nee |

Alle 7 dienstpagina's (linkerkolom "Ja") zijn nu 1-op-1 gekoppeld aan hun
wizard-tegenhanger. De 9 wizard-only diensten (rechterkolom "Nee") hebben geen
eigen pagina en dus ook geen CTA die een dienst-parameter zou kunnen
meegeven — hun `data-dienst-slug` is bewust leeg gelaten, zodat er geen
ongebruikte infrastructuur wordt toegevoegd zonder een pagina die hem nodig
heeft.

## 10. Welke inconsistenties/overlap zijn gevonden?

- **Kantoorreiniging vs. Periodieke bedrijfsschoonmaak**: dit zijn twee
  verschillende MARKETING-labels (een specifieke vertical vs. een generieke
  propositie) die onder de motorkap identieke input vragen (oppervlakte,
  ruimtes, vervuiling, frequentie) en dus met hetzelfde rekenmodel te
  benaderen zijn. Ik heb ze **niet samengevoegd of hernoemd** (dat is een
  productbeslissing die niet aan mij is — zie punt 19), maar wel allebei
  calculeerbaar gemaakt met exact dezelfde, ongewijzigde formule (zie punt 11).
- **9 wizard-diensten zonder eigen pagina** (Winkel-/showroomreiniging,
  Praktijk-/zorglocatiereiniging, Industriële schoonmaak, Evenementenreiniging,
  Trappenhuisreiniging, Schoonmaak van gemeenschappelijke ruimtes, Schoonmaak
  van scholen of instellingen, Zorglocaties, en impliciet "Anders/eigen
  omschrijving"): deze zijn inhoudelijk prima losse proposities, maar worden
  nergens op de site zelf toegelicht. Dat is een content-/SEO-vraagstuk (zou
  een dienstpagina moeten krijgen?) en geen technische inconsistentie — ik heb
  ze daarom laten staan zoals ze waren, in lijn met "verwijder of hernoem niet
  zomaar bestaande diensten".
- **Geen dubbele/inconsistente slugs gevonden** tussen zakelijk/particulier: de
  nieuwe zakelijke slugs (`kantoorreiniging`, `glasbewassing-zakelijk`,
  `gevelreiniging`, `opleveringsschoonmaak`, `vve-schoonmaak`,
  `specialistische-reiniging`) zijn bewust anders dan hun eventuele
  particuliere buren (bijv. `glasbewassing-zakelijk` vs. het bestaande
  `glasbewassing-particulier`) — nooit verwarrend dicht bij elkaar.
- **Technische bug gevonden en gefixt** (geen productbeslissing, dus direct
  opgelost): de gedeelde slug `periodiek-zakelijk` (gebruikt door zowel de
  bedrijfs- als de VvE-variant van "periodieke schoonmaak") kon bij de
  bestaande URL-preselectielogica de VERKEERDE (uitgeschakelde) kaart vinden
  wanneer `type=vve` werd meegegeven — de code zocht alleen op slug, niet ook
  op klanttype. Dit is exact de klasse fout die in het projectgeheugen al
  eerder is vastgelegd ("Standing Lesson #4": gedeelde waarden moeten altijd
  binnen hun klanttype/dienst-scope gezocht worden). Gefixt door de zoekactie
  ook te filteren op `data-customer-types`, met een regressietest
  (`test_wizard.js` Scenario 8).

## 11. Welke diensten zijn automatisch calculeerbaar?

**A. Automatisch calculeerbaar (ongewijzigd rekenmodel, alleen bereik
uitgebreid):**
- Periodieke bedrijfsschoonmaak / Periodieke schoonmaak (VvE) — bestond al.
- **Kantoorreiniging — nieuw deze ronde.** Motivatie: exact dezelfde
  vraagset (oppervlakte, ruimtes uit `ZAKELIJK_RUIMTE_OPTIES`, vervuilingsgraad
  uit `ZAKELIJK_VERVUILING_OPTIES`, frequentie uit `WIZARD_FREQUENTIE`) is al
  van toepassing en inhoudelijk correct voor een kantooromgeving — dit is
  letterlijk het scenario dat u zelf testte.

**B. Alleen met extra input calculeerbaar (niet geïmplementeerd deze ronde,
mogelijke kandidaten voor een volgende ronde — EERST TERUGKOPPELEN, zie punt
19):**
- Winkel- of showroomreiniging / Praktijk- of zorglocatiereiniging — qua
  vraagstructuur vergelijkbaar met kantoorreiniging (een ruimte met een
  oppervlakte, frequentie, vervuilingsgraad), maar de huidige
  `ZAKELIJK_RUIMTE_OPTIES`-lijst ("Kantoorruimte", "Kantine/pantry", …) is
  woordelijk op kantooromgevingen toegesneden. Zou waarschijnlijk werken via de
  "Overig"-ruimte-optie, maar dat is een contentkeuze, geen zuiver technische.

**C. Niet betrouwbaar automatisch calculeerbaar (bewust NIET uitgebreid):**
- Glasbewassing, Gevelreiniging, Opleveringsschoonmaak, Specialistische
  reiniging — fundamenteel ander werkmodel (m² glas/gevel, eenmalige
  opleverklus, tapijt-/vloertype) dat niet in het bestaande
  "ruimte-op-basis-van-tijd"-model past; hiervoor zou een volledig nieuw
  rekenmodel nodig zijn, wat expliciet buiten deze ronde valt.
- VvE-schoonmaak / Trappenhuisreiniging / Schoonmaak van gemeenschappelijke
  ruimtes — het bestaande `ZAKELIJK_RUIMTE_OPTIES`-lijstje mist trappenhuis-/
  lift-/entree-specifieke opties; deze diensten met de kantoor-ruimtelijst
  benaderen zou een onbetrouwbare tijdschatting opleveren.
- Industriële schoonmaak, Evenementenreiniging, Schoonmaak van scholen of
  instellingen, Zorglocaties — te uiteenlopend van omvang/aard voor een
  generiek tijdmodel zonder aanvullende input.

## 12. Welke diensten zijn niet automatisch calculeerbaar (en wat gebeurt daar nu)?

Alle diensten in categorie B en C hierboven (zie punt 11) — voor elke
zakelijke/VvE-aanvraag met zo'n dienst toont de interne e-mail nu expliciet:

```
INTERNE CALCULATIE
Automatische prijsindicatie:
Niet beschikbaar voor deze dienst.

Advies:
Handmatige calculatie / locatieopname aanbevolen.
```

Dit verving de vorige situatie waarin de hele "INTERNE CALCULATIE"-sectie
gewoon stilzwijgend ontbrak — nu is voor de lezer van de e-mail altijd
duidelijk dát er geen automatische indicatie is, zonder ooit een verzonnen
bedrag te tonen. De klant ziet dit nooit (deze sectie zit alleen in de interne
e-mail, nooit in wat de klant invult of terugziet). Particuliere aanvragen
krijgen — ongewijzigd — helemaal geen "INTERNE CALCULATIE"-sectie, want die
hebben hun eigen, aan de klant getoonde prijsindicatie.

## 13. Krijgt Kantoorreiniging nu een interne calculatie, en waarom?

Ja. `berekenInterneCalculatie()` in `api/offerte-aanvraag.js` gebruikte
voorheen de voorwaarde `payload.dienstSlug !== "periodiek-zakelijk"` om
meteen `null` terug te geven. Dat is vervangen door een gedeelde
`CALC_DIENST_SLUGS = ["periodiek-zakelijk", "kantoorreiniging"]`-lijst (ook
gebruikt in `js/main.js`, zie punt 16) — dezelfde, volledig ongewijzigde
rekenfunctie wordt nu simpelweg ook voor `dienstSlug === "kantoorreiniging"`
aangeroepen. Wizardstap 9 (ruimtes/vervuiling/schoonmaakmoment) is daarvoor
ook zichtbaar gemaakt bij Kantoorreiniging (`data-requires-dienst` op die stap
uitgebreid van uitsluitend `"periodiek-zakelijk"` naar
`"periodiek-zakelijk kantoorreiniging"`), zodat de benodigde ruwe
invoervelden ook daadwerkelijk verzameld worden — zonder die stap zou de
calculator anders altijd op "onvoldoende informatie" uitkomen. Geverifieerd
met een onafhankelijke herberekening in `test_offerte_api.js` (Test 6b) en een
volledige wizard-simulatie in `test_wizard.js` (Scenario 3b).

## 14. Stap-voor-stap analyse: waarom kwam uw test op 1 uur 55 minuten / €100,40?

Uw testscenario (Kantoorreiniging, oppervlakte "Klein", ruimtes
Kantoorruimte + Kantine/pantry + Toiletten/sanitair, "Bovengemiddelde
vervuiling") rekent, met het **volledig ongewijzigde** `CONFIG`-tijdmodel, als
volgt:

1. **Basistijd** (`BASE_MINUTES_BY_OPPERVLAKTE["Klein"]`): **45 minuten** (tot
   50 m²).
2. **Extra tijd per ruimte** (`ROOM_EXTRA_MINUTES`): Kantoorruimte
   (`ruimte_kantoor`) = 10 min, Kantine/pantry (`ruimte_kantine`) = 15 min,
   Toiletten/sanitair (`ruimte_toiletten`) = 15 min → samen **40 minuten**.
3. **Subtotaal vóór vervuilingsfactor**: 45 + 40 = **85 minuten**.
4. **Vervuilingsfactor** (`VERVUILING_FACTOR["Bovengemiddelde vervuiling"]`):
   **× 1,35**.
5. **Totale schoonmaaktijd**: 85 × 1,35 = **114,75 minuten**, afgerond op 5
   minuten voor leesbaarheid (`formatDuur()`) → **115 minuten = 1 uur 55
   minuten**. Dit verklaart exact uw waargenomen "1 uur 55 min".
6. **Arbeidskosten**: 114,75 min ÷ 60 = 1,9125 uur × €27,50
   (`INTERNAL_HOURLY_COST_EXCL_BTW`) = **€52,59**.
7. **Reiskosten**: 20 min (`TRAVEL_MINUTES_PER_VISIT`) ÷ 60 × €27,50
   (`TRAVEL_RATE_PER_HOUR_EXCL_BTW`) = **€9,17**.
8. **Materiaalkosten**: €3,50 (`MATERIAL_COST_PER_VISIT_EXCL_BTW`, vast).
9. **Directe kosten per bezoek**: 52,59 + 9,17 + 3,50 = **€65,26**.
10. **Adviesprijs excl. btw**: €65,26 ÷ (1 − 0,35) (`DESIRED_GROSS_MARGIN`) =
    **€100,40** — exact uw waargenomen bedrag, en boven de minimumprijs van
    €45 (`MIN_PRICE_PER_VISIT_EXCL_BTW`), dus geen minimum toegepast.

Deze berekening is onafhankelijk herbevestigd in `test_offerte_api.js` (Test
6b), die de formule los van de implementatie zelf herberekent en exact
dezelfde uitkomst (114,75 min / €100,40) controleert.

## 15. Bevestiging: zijn financiële/tijdsparameters gewijzigd?

**Nee.** `CONFIG` in `api/offerte-aanvraag.js` (uurtarief, marge,
minimumprijs, reistijd/-tarief, materiaalkosten, `BASE_MINUTES_BY_OPPERVLAKTE`,
`ROOM_EXTRA_MINUTES`, `VERVUILING_FACTOR`, btw-tarief, weken-per-maand) is
letterlijk geen teken aangeraakt — de enige wijziging in dat bestand is de
gate-conditie (welke dienstSlug's de functie mág aanroepen) en een puur
tekstuele "niet beschikbaar"-melding voor diensten daarbuiten. Punt 14
hierboven bevestigt dit ook cijfermatig: de herberekende waarden komen exact
overeen met wat u zelf waarnam, wat alleen kan als de formule ongewijzigd is.

## 16. Welke bestanden zijn gewijzigd?

- **`generate.py`** — `MASTER_DIENSTEN` (6 nieuwe dienst-slugs), nieuwe
  `SERVICE_TO_WIZARD_DIENST_SLUG`/`SERVICE_TO_WIZARD_TYPE`-mappings,
  `cta_band()` kreeg een `dienst_param`, `build_service_pages()` geeft nu
  dienstcontext mee aan beide CTA's per dienstpagina, wizardstap 9's
  `data-requires-dienst` uitgebreid, `ASSET_VERSION` **177 → 178** (cache-
  busting, omdat `js/main.js` deze ronde substantieel is gewijzigd — anders
  zouden bezoekers de oude, niet-auto-advancende main.js uit hun
  browsercache kunnen blijven laden na deployment). Hele site opnieuw
  gegenereerd met deze nieuwe versie; alle tests hierna opnieuw gedraaid en
  nog steeds groen.
- **`js/main.js`** — nieuwe `CALC_DIENST_SLUGS`-constante,
  `stepApplies()`/`data-requires-dienst` ondersteunt nu meerdere waarden,
  URL-preselectie zoekt de dienst-slug nu ook binnen het juiste klanttype
  (regressiefix), `collectRows()`/`applyDienst()` gebruiken
  `CALC_DIENST_SLUGS` i.p.v. een hardcoded enkele waarde, en de nieuwe
  auto-advance-logica (`scheduleAutoAdvance()`/`cancelAutoAdvance()` + de
  bijbehorende 'change'-listeners op klanttype/dienst/pakket/oppervlakte/
  frequentie/frequentie_particulier).
- **`api/offerte-aanvraag.js`** — `berekenInterneCalculatie()`'s gate-conditie
  vervangen door `CALC_DIENST_SLUGS`, een nieuw `nietBeschikbaar`-pad
  toegevoegd (voor zakelijke/VvE-aanvragen buiten dat bereik), zowel
  `bouwEmailTekst()` als `bouwEmailHtmlOfferte()` tonen die nieuwe melding.
  **`CONFIG` zelf is niet gewijzigd** (zie punt 15).
- **`README.md`** — "Formulieren"-sectie uitgebreid met de
  calculatorbereik-uitleg en de dienstcontext-CTA-uitleg.
- **`test_wizard.js`** — Scenario 3 gebruikt nu een dienst zonder calculator
  (Winkel-/showroomreiniging) om die aanname te blijven dekken; nieuwe
  Scenario 3b (Kantoorreiniging krijgt nu wél stap 9 + calculatie) en
  Scenario's 6 t/m 13 (dienstcontext-CTA, ongeldige dienstparameter,
  VvE-slugfix, auto-advance-timing, Terug-gedrag, de
  "Meerdere-keren-per-week"-uitzondering, de multi-choice-uitzondering, en
  particuliere auto-advance).
- **`test_offerte_api.js`** — nieuwe Test 6b (Kantoorreiniging-calculatie,
  inclusief het exacte 1u55/€100,40-scenario) en Test 6c
  (niet-calculeerbare zakelijke dienst krijgt de "niet beschikbaar"-melding,
  nooit een bedrag).
- **`CHANGELOG-44.md`** — dit bestand.

Bewust **niet** gewijzigd: `api/contact-aanvraag.js`, `lib/mail.js`,
`test_contact_api.js`, `test_mail.js`, alle particuliere pakket-/prijslogica,
alle overige HTML-content.

## 17. Welke tests zijn uitgevoerd?

- `python3.12 generate.py` — volledige regeneratie, geen fouten.
- `node --check` op alle gewijzigde JS-bestanden.
- `node test_mail.js` (10 tests, ongewijzigd, nog steeds groen — bevestigt dat
  de Resend-mailflow niet is geraakt).
- `node test_offerte_api.js` (nu 16 tests: de bestaande 14 + de 2 nieuwe uit
  punt 16).
- `node test_contact_api.js` (10 tests, ongewijzigd, nog steeds groen).
- `node test_wizard.js` (jsdom): alle bestaande scenario's + 8 nieuwe
  ronde-44-scenario's, waarvan de nieuwe met harde `assert`s (niet alleen
  eyeballen) — inclusief scenario's die een ECHTE 150-250ms-vertraging
  afwachten (geen fake timers) om de daadwerkelijke auto-advance-timing te
  verifiëren.
- Handmatige jsdom-check: alle 7 dienstpagina-CTA's geladen met hun eigen
  querystring, 0 JavaScript-fouten, elk correct doorgesprongen naar stap 7 met
  "Uw keuze" zichtbaar.
- Repo-brede controle: geen duplicate HTML-`id`-attributen, geen resterende
  "BrabantSchoon"/"Brabant Schoon"-schrijffouten in levende bestanden (alleen
  in historische changelogs, zoals het hoort), geen ontbrekende dienst-slugs.

## 18. Slagen alle tests?

Ja — alle testbestanden eindigen met "Alle tests geslaagd." (exit code 0),
inclusief de 8 nieuwe scenario's in `test_wizard.js`, zonder regressie in een
van de bestaande tests.

## 19. Productbeslissingen die nog door u genomen moeten worden

1. **Winkel-/showroomreiniging en Praktijk-/zorglocatiereiniging als
   categorie B** (zie punt 11): zou u deze ook calculeerbaar willen maken?
   Technisch zou dat kunnen door dezelfde `ZAKELIJK_RUIMTE_OPTIES`-lijst te
   hergebruiken (via de "Overig"-ruimte-optie), maar de huidige ruimtelabels
   zijn woordelijk op een kantooromgeving toegesneden — ik wil dat niet
   stilzwijgend doortrekken zonder uw akkoord.
2. **9 wizard-diensten zonder eigen website-pagina** (zie punt 9/10): wilt u
   hier op termijn dienstpagina's voor, zodat ook die vanaf een specifieke
   pagina context kunnen meegeven? Of blijven dit bewust alleen
   wizard-opties?
3. **Mobiele sticky CTA-balk** ("Bel direct" / "Vrijblijvende offerte",
   onderaan elke pagina): deze komt uit één centrale, sitebrede sjabloonfunctie
   (`page_shell()`) en geeft daarom nooit dienstcontext mee, ook niet op een
   specifieke dienstpagina — dat zou een bredere wijziging aan die gedeelde
   functie vergen. Ik heb dit bewust buiten deze ronde gehouden ("geen grote
   redesign") maar wil het niet stilzwijgend laten liggen: zullen we dit een
   volgende ronde meenemen?
4. **Kantoorreiniging vs. Periodieke bedrijfsschoonmaak** (zie punt 10): beide
   zijn nu calculeerbaar met exact dezelfde formule maar blijven twee losse
   labels/pagina's. Wilt u deze op termijn inhoudelijk samenvoegen, of blijven
   het bewust twee aparte proposities in uw communicatie? Ik heb hier zelf
   geen keuze in gemaakt.

Geen van deze punten blokkeert het gebruik van de wijzigingen in deze ronde —
het zijn uitsluitend mogelijke vervolgstappen.
