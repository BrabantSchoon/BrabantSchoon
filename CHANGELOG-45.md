# Changelog — Brabantschoon website (ronde 45: fix auto-advance oppervlaktestap)

Deze ronde is een gerichte bugfix bovenop ronde 44 (wizard-UX/auto-advance).
Alleen `js/main.js` en `generate.py` (uitsluitend `ASSET_VERSION`) zijn
gewijzigd. **Niets aan de calculator, prijzen, het tijdmodel, de
Resend-mailflow of overige wizardlogica is aangeraakt.**

## Wat was de oorzaak?

Uitgebreid onderzocht (jsdom-simulaties van elk realistisch pad: directe
klik-flow, `Terug`/opnieuw-kiezen, en binnenkomst via `?type=&dienst=`
URL-preselectie, met zowel programmatische event-dispatch als een
gesimuleerde echte klik op het kaartje) — in geen van die simulaties kon de
gemelde storing worden gereproduceerd: de ronde-44-listener op
`input[name="oppervlakte"]` riep `scheduleAutoAdvance()` in elke test
correct aan.

Dat betekent niet dat er niets te verbeteren viel. De ronde-44-opzet bond
voor elk apart veld (klanttype, dienst, pakket, oppervlakte,
frequentie_particulier, frequentie) een **eigen, losse**
`form.querySelectorAll(...).forEach(el => el.addEventListener('change',
...))`-blok. Dat werkt betrouwbaar zolang alle elementen op het moment van
initialisatie al in de DOM staan én geen enkel eerder blok een fout gooit
die de rest van de initialisatie afbreekt — maar het is inherent kwetsbaarder
dan nodig, en met zes verspreide registratieblokken is dat soort volgorde-
/timingafhankelijkheid lastig met 100% zekerheid uit te sluiten voor een
live omgeving die ik hier niet zelf kan bezoeken. Omdat ik de storing zelf
niet kon reproduceren maar de melding wel serieus neem, heb ik dit
structureel steviger gemaakt in plaats van te concluderen "geen bug
gevonden, niets gedaan".

## Wat is er veranderd?

**`js/main.js`** — de zes losse `scheduleAutoAdvance()`-aanroepen zijn
vervangen door **één centrale, delegated `change`-listener op het
`<form>`-element zelf**:

```js
const AUTO_ADVANCE_RADIO_NAMES = ['klanttype', 'dienst', 'pakket', 'oppervlakte', 'frequentie_particulier'];
form.addEventListener('change', (e) => {
  const t = e.target;
  if (!t || t.tagName !== 'INPUT' || t.type !== 'radio' || !t.checked) return;
  if (AUTO_ADVANCE_RADIO_NAMES.indexOf(t.name) !== -1) {
    scheduleAutoAdvance(current);
  } else if (t.name === 'frequentie' && t.value !== 'Meerdere keren per week') {
    scheduleAutoAdvance(current);
  }
});
```

Belangrijk: dit is **dezelfde bestaande architectuur**, niet een tweede
systeem. `scheduleAutoAdvance()`, `cancelAutoAdvance()`, `applicableSteps()`,
`show()` en `validateStep()` zijn allemaal ongewijzigd. Alleen de manier
waarop de trigger wordt opgevangen is veranderd: van "veel losse listeners,
elk gebonden op het moment dat hun eigen `querySelectorAll`-blok draait"
naar "één listener op het formulier zelf, die elke omhoogbubbelende
`change` van een radio-input afvangt, ongeacht wanneer of hoe die specifieke
radio in de DOM terechtkwam". Dat is aantoonbaar minstens even betrouwbaar
(alle bestaande tests blijven slagen) en sluit een hele klasse van
denkbare timing-/volgordeproblemen bij voorbaat uit — de meest voor de hand
liggende, verantwoorde verklaring voor een storing die ik zelf niet kon
reproduceren.

De veld-specifieke neveneffecten (`applyKlanttype()`, `applyDienst()`,
`syncPakketNaamField()`, het tonen van het "aantal per week"-veld bij
"Meerdere keren per week", de prijsindicatie-koppeling) blijven gewoon in
hun eigen listeners staan — alleen de auto-advance-aanroep zelf is
verhuisd naar de nieuwe centrale listener.

**`generate.py`** — alleen `ASSET_VERSION` opgehoogd (178 → 179) voor
cache-busting, omdat `js/main.js` opnieuw is gewijzigd. Site volledig
opnieuw gegenereerd.

## Audit: overige zakelijke single-choice-vragen

Op verzoek nagelopen of er nog een andere zakelijke radio/kaart-vraag is die
onnodig op "Volgende" laat drukken. De zakelijke wizardstappen zijn:

- Stap 1 (klanttype) — auto-advance ✓
- Stap 2 (dienst) — auto-advance ✓
- Stap 7 (oppervlakte) — auto-advance ✓ (dit rondes fix)
- Stap 8 (frequentie) — auto-advance ✓, behalve bij "Meerdere keren per
  week" (extra verplicht veld op dezelfde stap)
- Stap 9 (ruimtes/vervuiling/moment) — samengesteld (checkboxes +
  vervuilingsgraad_zakelijk + schoonmaakmoment op één stap) — bewust GEEN
  auto-advance, ook al zijn vervuilingsgraad_zakelijk en schoonmaakmoment
  zelf single-choice

Er is geen extra zakelijke single-choice-vraag gevonden die nog "Volgende"
nodig had — alle vier de pure single-choice zakelijke stappen (1, 2, 7, 8)
hebben nu auto-advance.

## Welke stappen hebben nu auto-advance (ongewijzigd t.o.v. ronde 44, behalve dat oppervlakte nu bevestigd werkt)

Klanttype (1), Dienst (2), Pakket (3, particulier), Frequentie-particulier
(6), Oppervlakte (7, bedrijf/VvE), Frequentie (8, bedrijf/VvE, behalve
"Meerdere keren per week").

## Welke stappen gebruiken bewust nog "Volgende"

Woning-info (4), Extra werkzaamheden (5), Ruimtes/vervuiling/moment (9),
Toelichting (10), Gegevens (11), Controle (12) — allemaal samengestelde
stappen met meerdere (deels conditionele) velden, of vrije tekst-/
invoervelden.

## Tests

- `node --check` op `js/main.js` en alle API/lib-bestanden.
- `test_wizard.js`: 3 nieuwe scenario's toegevoegd (14, 15, 16), gedekt met
  harde `assert`-checks en echte `setTimeout`-gebaseerde vertraging (geen
  gemockte timers):
  - **Scenario 14** — Klein, Middel én Groot elk apart, in een verse
    wizard-sessie: elk moet automatisch naar stap 8 gaan.
  - **Scenario 15** — Terug naar de oppervlaktestap: de eerdere keuze
    blijft zichtbaar, geen automatische sprong; een nieuwe bewuste keuze
    (Groot) daarna advancet weer normaal.
  - **Scenario 16** — expliciete herbevestiging na de refactor dat
    samengestelde stappen (zakelijke stap 9 én particuliere stap 4) nog
    steeds nooit vanzelf doorspringen.
  - Scenario's 1 t/m 13 (rondes 39-44) blijven ongewijzigd en slagen nog
    steeds — inclusief de eerdere oppervlakte-dekking in Scenario 10.
- `test_offerte_api.js` (16 tests), `test_contact_api.js` (10 tests),
  `test_mail.js` (10 tests) — ongewijzigd, allemaal nog steeds groen,
  bevestigt dat de calculator/Resend-mailflow niet is geraakt.
- Handmatige controles: geen "BrabantSchoon"/"Brabant Schoon" in
  live/gegenereerde bestanden, geen duplicate HTML-`id`'s in offerte.html,
  geen van de 7 eerder gevonden orphaned root-dienstpagina's teruggekeerd,
  `ASSET_VERSION` (179) consistent doorgevoerd in alle gegenereerde
  pagina's, geen echte Resend-sleutels in de zip.

**Alle tests slagen.**

## Bevestiging: niets gewijzigd aan calculator/prijzen/mailflow

`api/offerte-aanvraag.js`, `api/contact-aanvraag.js` en `lib/mail.js` zijn
byte-voor-byte identiek aan de ronde-44-versie (geverifieerd met `diff`
tegen de eerder geleverde ronde-44-zip). `generate.py` verschilt uitsluitend
op de `ASSET_VERSION`-regel.

## Gewijzigde bestanden

- `js/main.js` — auto-advance-triggers gecentraliseerd in één delegated
  listener (zie boven).
- `generate.py` — alleen `ASSET_VERSION` 178 → 179; site opnieuw
  gegenereerd (alle HTML-pagina's, sitemap.xml, robots.txt).
- `test_wizard.js` — 3 nieuwe regressiescenario's (14, 15, 16).
- `CHANGELOG-45.md` — dit bestand.

Bewust niet gewijzigd: `api/offerte-aanvraag.js`, `api/contact-aanvraag.js`,
`lib/mail.js`, `test_offerte_api.js`, `test_contact_api.js`, `test_mail.js`,
alle overige HTML-content, de calculator, de particuliere pakket-/
prijslogica.
