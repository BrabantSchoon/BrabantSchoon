# CHANGELOG — Ronde 48

**Definitieve pre-deploy correctieronde: klantzichtbaar kilometerveld verwijderen + e-maildeliverability verbeteren**

Dit is nadrukkelijk een kleine, gerichte correctieronde bovenop ronde 47. Calculator v2 is **niet** opnieuw gebouwd: het tijdsmodel, prijsmodel, de marges en de kalibratie uit ronde 47 zijn ongewijzigd. Er zijn twee dingen gecorrigeerd: (A) het klantzichtbare retourafstand-veld is volledig uit de offertewizard verwijderd, en (B) de e-maildeliverability is verbeterd binnen de bestaande Resend-configuratie (geen nieuwe mailprovider, geen secrets gewijzigd, geen DNS-waarden verzonnen).

---

## 1. Gewijzigde bestanden

| Bestand | Wijziging |
|---|---|
| `generate.py` | Het `<div id="fieldRetourKm">`-blok (label, input, helptekst) volledig verwijderd uit wizardstap 10. `ASSET_VERSION` opgehoogd van `"181"` naar `"182"`. Site geregenereerd (`python3.12 generate.py`) — alle 27 HTML-pagina's + `sitemap.xml`/`robots.txt` opnieuw geschreven. |
| `js/main.js` | Vier plekken verwijderd: de `retourKmField`/`retourKmInput`-const-declaraties, het zichtbaarheids-/enable-blok in `applyKlanttype()`, de `collectRows()`-regel ("Retourafstand (km)"), en het `retourKm`-veld in `buildOffertePayload()`. Het veld wordt nergens meer gerenderd, gelezen, samengevat of verzonden. |
| `lib/calculator.js` | **Geen functionele wijziging.** Alleen de code-comment boven de vervoersberekening (rond regel 659) bijgewerkt: deze beschreef nog het "nieuwe optionele wizardveld" uit ronde 47, wat sinds ronde 48 niet meer klopt. `parseRetourKm(calc.retourKm)` blijft ongewijzigd bestaan als intern/toekomstig uitbreidingspunt (bijv. handmatige invoer of een latere routeprovider) — zonder dat daar nu client-input voor bestaat, dus in de praktijk is `calc.retourKm` altijd `undefined` en is vervoer altijd "nog te bepalen". |
| `lib/mail.js` | **Eén functionele wijziging**: `verstuurEmail()` stelt nu altijd een `reply_to`-header in. Bij een geldig klantadres wordt dat gebruikt (ongewijzigd gedrag); bij een ontbrekend of ongeldig adres valt de header veilig terug op het eigen `RESEND_TO_EMAIL`-adres, in plaats van de header simpelweg weg te laten. Alle overige logica (config uit `process.env`, geen hardcoded from-adres, header-injectiebescherming via `enkeleRegel()`, veilige logging) is ongewijzigd. |
| `README.md` | Documentatie bijgewerkt: het voorbeeld-`RESEND_FROM_EMAIL` is veranderd van `noreply@brabantschoon.nl` naar `info@brabantschoon.nl`, met een expliciete waarschuwing tegen `noreply@`-adressen. De `reply_to`-paragraaf beschrijft nu de nieuwe veilige fallback. Een nieuwe sectie **"E-maildeliverability (spamfilters)"** is toegevoegd met SPF/DKIM/DMARC-controlestappen (uitsluitend verwijzingen naar het Resend-dashboard/MijnDomein, geen verzonnen waarden) en de live-teststappen na deploy. |
| `api/offerte-aanvraag.js` | **Geen wijziging nodig** (geaudit — zie punt 2 hieronder). |
| `api/contact-aanvraag.js` | **Geen wijziging nodig** (geaudit — zie punt 2 hieronder). |
| `test_wizard.js` | Scenario 20 herschreven: test niet langer de zichtbaarheid/waarde van het (verwijderde) veld, maar bevestigt dat het nergens meer in de DOM/payload voorkomt en dat de calculator dit correct als "nog te bepalen" behandelt. Regel in Scenario 19 aangepast (`calc.retourKm` moet nu `undefined` zijn, niet `''`). |
| `test_calculator.js` | Verduidelijkende comment toegevoegd bij Test 15c: deze test roept `calculateOffer()` nu bewust rechtstreeks aan als test van interne capaciteit (parseRetourKm/vervoerBekend), niet meer als test van een bestaand klantinvoerpad. |
| `test_offerte_api.js` | Nieuwe Test 1b: onderwerpregels (zakelijk + particulier) bevatten geen uitroeptekens, emoji, overdreven hoofdletters of spamwoorden. Comments bij de bestaande retourKm-tests bijgewerkt. |
| `test_contact_api.js` | Nieuwe Test 1b: de vaste onderwerpregel voldoet aan dezelfde deliverability-eisen. |
| `test_mail.js` | Test 8 herschreven voor de nieuwe reply_to-fallback (ongeldig én ontbrekend adres). Nieuwe Test 8b (geen scripts/forms/afbeeldingen/event-handlers in de HTML-mail) en Test 8c (geen tracking-parameters in de Resend-requestbody — exact de 6 verwachte velden, niets extra's). Test 4 uitgebreid met een expliciete controle dat er geen hardcoded noreply-default in de code zit. |

Geen enkel bestand buiten deze lijst is aangeraakt.

## 2. Bevestiging: klantzichtbaar km-/retourafstandveld volledig weg

- Het veld (`fieldRetourKm`/`retour_km`, label "Retourafstand vanaf Brabantschoon…") is verwijderd uit `generate.py`, `js/main.js`, en dus uit alle 27 geregenereerde HTML-pagina's.
- Repo-brede grep (uitgezonderd de eigen testassertie die de afwezigheid controleert) bevestigt: de tekst **"Retourafstand vanaf Brabantschoon"** komt nergens meer klantzichtbaar voor — niet in HTML, niet in `generate.py`, niet in `js/main.js`.
- `api/offerte-aanvraag.js` is geaudit en bleek geen wijziging nodig te hebben: de e-mailopbouw verwijst uitsluitend generiek naar `calc.km`/`calc.vervoerBekend`/`calc.vervoerNogTeBepalen`, zonder veldspecifieke tekst — dit werkt automatisch correct zodra de client het veld niet meer meestuurt.
- De payload bevat geen `retour_km`/`retourKm`-sleutel meer vanuit de wizard (bevestigd in `test_wizard.js`, Scenario 20).

## 3. Bevestiging: Calculator v2 / ronde-47-tijdmodel verder ongewijzigd

- Oppervlaktecurves, tijdsbandbreedtes, intensiteits-/vervuilingscorrecties, frequentielogica, ruimtecorrecties, marges, ZZP-referentietarief, max-ZZP-formule, uitbesteedbaarheidsclassificatie, materiaalmodel, minimumprijs en prijsafronding: **niet aangeraakt**.
- Het autogarage-regressiescenario (Scenario 19, `test_wizard.js`) blijft groen en levert nog steeds 75–100 minuten op — nooit meer richting 2+ uur, zoals ronde 47 vereiste.
- `lib/calculator.js` kreeg uitsluitend een bijgewerkte code-comment, geen enkele functionele/rekenkundige wijziging.

## 4. Gedrag bij onbekende afstand

- De calculator verzint nooit een afstand: geen 20-km-fallback, geen postcode-gok, geen Maps/API-integratie.
- Onbekend (de normale situatie na deze ronde, want de client stuurt het veld niet meer mee): `km = null`, `voertuigkosten = €0` in de voorlopige kostprijs, `vervoerNogTeBepalen = true`.
- De interne e-mail toont in dat geval expliciet:
  - `Retourkilometers: nog te bepalen`
  - `Voertuigkosten: nog te bepalen`
  - `Vervoer nog niet meegerekend.`
- Deze wording staat los van de tijdschatting: de betrouwbaarheid van de schoonmaaktijd zelf wordt niet verlaagd door een onbekende afstand (aparte, commerciële onzekerheid).

## 5. Huidige `From`

- Nog steeds volledig bepaald door de Vercel-omgevingsvariabele `RESEND_FROM_EMAIL` — geen hardcoded waarde in code (bewust, zie `lib/mail.js`).
- **Wat is aangepast:** de documentatie (README.md) raadt niet langer `noreply@brabantschoon.nl` aan als voorbeeld, maar een herkenbaar adres: `Brabantschoon <info@brabantschoon.nl>` (desgewenst `offerte@` / `contact@brabantschoon.nl`, maar één consistent adres is eenvoudiger en dus de aanbevolen keuze).
- **Actie voor u:** als `RESEND_FROM_EMAIL` in Vercel op dit moment een `noreply@`-adres bevat, moet u dit **zelf** in het Vercel-dashboard aanpassen naar een niet-noreply-adres op het geverifieerde `brabantschoon.nl`-domein — de code kan een omgevingsvariabele niet voor u wijzigen.

## 6. Huidige `Reply-To`

- Bij een geldig, server-side gevalideerd klantadres: het klantadres zelf (ongewijzigd t.o.v. ronde 43/47) — "Beantwoorden" gaat direct naar de klant.
- **Nieuw in ronde 48:** bij een ontbrekend of ongeldig klantadres valt `reply_to` nu veilig terug op uw eigen `RESEND_TO_EMAIL`-adres, in plaats van de header simpelweg weg te laten. Een gemanipuleerd of onvolledig forminvoerveld kan dus nooit meer tot een ontbrekende of onveilige `reply_to`-header leiden.

## 7. HTML/plain-text-status

- Beide endpoints versturen zowel een HTML- als een platte-tekstversie, met dezelfde kerninformatie (bevestigd in `test_offerte_api.js` Test 11 en `test_contact_api.js` Test 6).
- De platte tekst is echte, handgeschreven leesbare tekst (`bouwEmailTekst()`), geen automatische HTML-strip.
- De nette vijf-secties-indeling uit Calculator v2 (Aanvraag / Interne prijsindicatie / Middelen & vervoer / Intern advies / Contactgegevens) blijft in de HTML-mail staan.

## 8. Trackingstatus

- **Uit onze eigen code:** geen tracking. De Resend-requestbody bevat uitsluitend `from`, `to`, `subject`, `html`, `text` en `reply_to` — geen `tags`, geen open-/klik-trackingparameters (nieuw bevestigd in `test_mail.js` Test 8c, die expliciet de volledige sleutelset van de requestbody controleert).
- **Op Resend-dashboardniveau:** kan vanuit deze repository niet worden vastgesteld of gewijzigd. **Actie voor u:** controleer in het Resend-dashboard (accountinstellingen) of open-/klik-tracking daar is ingeschakeld voor uw domein/verzendidentiteit, en schakel dit uit voor deze transactionele meldingsmails als dat het geval is.

## 9. SPF-status

**Onbekend vanuit de repository — niet te bepalen zonder te gokken.** Deze repository bevat geen enkele DNS-recordwaarde. Controleer de actuele SPF-status bij **Resend → Domains → brabantschoon.nl**; als het record ontbreekt of afwijkt, toont Resend daar de exacte waarde die u bij uw DNS-provider (MijnDomein) moet instellen.

## 10. DKIM-status

**Onbekend vanuit de repository — niet te bepalen zonder te gokken.** Zelfde controlepunt als SPF: Resend genereert de exacte DKIM-recordwaarden bij domeinverificatie en toont de geverifieerd/niet-geverifieerd-status in hetzelfde scherm. Deze waarden worden hier nooit verzonnen.

## 11. DMARC-status

**Onbekend vanuit de repository — niet te bepalen zonder te gokken.** Controleer of er al een DMARC-record staat voor `brabantschoon.nl`. **Belangrijk:** als DMARC ontbreekt, niet direct een streng beleid (`p=reject`) instellen — ga eerst na welke andere diensten (bijv. een ander mailprogramma, factuur-/boekhoudsysteem, nieuwsbrieftool) ook namens `brabantschoon.nl` mail versturen, zodat een te streng beleid die legitieme mail niet blokkeert. Begin bij twijfel met een mild beleid (bijv. `p=none`, alleen monitoren).

## 12. Handmatige actie nog nodig in Resend

1. Controleer domeinstatus (SPF/DKIM) bij **Domains → brabantschoon.nl** — zie punt 9/10.
2. Controleer of open-/klik-tracking op account-/domeinniveau aan staat, en schakel dit uit voor deze transactionele mails indien van toepassing — zie punt 8.
3. Als `RESEND_FROM_EMAIL` in Vercel nog een `noreply@`-adres is: wijzig dit naar een herkenbaar adres (bijv. `info@brabantschoon.nl`) op het geverifieerde domein — zie punt 5.

## 13. Handmatige actie nog nodig bij MijnDomein (DNS)

- Alleen nodig **als** Resend bij punt 9/10/11 aangeeft dat een record ontbreekt of afwijkt. Kopieer in dat geval exact de door Resend getoonde waarde (nooit een zelfverzonnen waarde) naar uw DNS-instellingen bij MijnDomein.
- Voor DMARC specifiek: pas dit pas aan nadat u heeft nagegaan welke andere diensten mogelijk ook namens `brabantschoon.nl` versturen (zie punt 11) — dit is een bewuste, aparte handmatige stap, niet iets wat vanuit deze ronde automatisch is aangepast.
- Er zijn in deze ronde **geen** DNS-wijzigingen doorgevoerd of voorgesteld met concrete waarden — dat kan uitsluitend via het Resend-dashboard worden vastgesteld.

## 14. Volledige testresultaten

Alle 5 testsuites groen, `node <bestand>.js`, exit code 0:

| Testbestand | Aantal testblokken | Resultaat |
|---|---|---|
| `test_calculator.js` | 32 | Alle tests geslaagd |
| `test_offerte_api.js` | 20 (was 19; nieuwe Test 1b toegevoegd) | Alle tests geslaagd |
| `test_contact_api.js` | 11 (was 10; nieuwe Test 1b toegevoegd) | Alle tests geslaagd |
| `test_mail.js` | 12 (was 10; nieuwe Test 8b/8c toegevoegd) | Alle tests geslaagd |
| `test_wizard.js` | 20 scenario's (Scenario 20 herschreven) | Alle scenario's geslaagd |

Gedekt door deze ronde specifiek:
- Kilometercorrectie: veld nergens meer klantzichtbaar; geen invoerveld meer in de wizard; payload bevat geen klant-retourkm-veld meer; onbekende afstand levert nooit een verzonnen km-waarde; €0 voertuigkosten intern; mail toont "Retourkilometers: nog te bepalen" / "Voertuigkosten: nog te bepalen" / "Vervoer nog niet meegerekend"; de oude 20-km-fallback bestaat nergens meer in `CONFIG`.
- E-mail: From uitsluitend uit `RESEND_FROM_EMAIL` (geen hardcoded noreply-default); Reply-To veilig (geldig klantadres of veilige fallback, nooit een kapotte header); HTML + platte tekst beide aanwezig; onderwerpregels zonder uitroeptekens/emoji/hoofdletters/spamwoorden; geen tracking-parameters vanuit de eigen code; geen secrets client-side; API-key uitsluitend server-side; HTML-escaping intact; header-injectie via klantinvoer onmogelijk (`enkeleRegel()`).
- Regressie: Calculator v2 (ronde 47), garagescenario, normale/intensieve tijdcalculatie, particuliere en zakelijke offerteflow, contactformulier, Resend-verzending, dienst-preselectie, auto-advance, terugnavigatie, server-side calculator, HTML-escaping, bot-/spamdetectie, merknaam "Brabantschoon" — allemaal nog steeds groen.

## 15. Live-teststappen na deploy

1. Verstuur één test-offerteaanvraag (zakelijk) via de live site.
2. Open het Resend-dashboard → **Emails** en open de zojuist verzonden mail.
3. Bekijk **Deliverability Insights** (indien beschikbaar) en de headers van de mail voor eventuele SPF/DKIM/DMARC-waarschuwingen.
4. Controleer de ontvangst in Outlook (inbox vs. Ongewenste e-mail).
5. Controleer de ontvangst in Gmail, indien beschikbaar.
6. Belandt de mail nog steeds in spam? Geef dan door (nooit de API-sleutel): de volledige raw/brontekst van de ontvangen mail inclusief headers, de SPF/DKIM/DMARC-status uit Resend's Deliverability Insights, en of het om de zakelijke/particuliere offerteaanvraag of het contactformulier ging.

---

**Stopconditie gerespecteerd:** geen redesign, geen Calculator v3, geen Maps-integratie, geen andere mailprovider, geen wijzigingen buiten deze opdracht. Deze ronde levert één definitieve, stabiele ZIP op die direct naar GitHub geüpload kan worden.
