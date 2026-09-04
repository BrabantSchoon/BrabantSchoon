# CHANGELOG — Ronde 49

**Productiedebug: offertewizard toont "Er ging iets mis" ondanks HTTP 200, geen e-mail in Resend**

Gerichte debugronde bovenop ronde 48. Calculator v2 (tijdmodel/prijzen/marges), het Resend-From-adres, de kilometer-/vervoerslogica, de particuliere pakketten, dienst-preselectie en de auto-advance-timingregels zelf zijn **niet** aangepast — alleen de botdetectie/observability en het response-contract van `api/offerte-aanvraag.js` (plus de bijbehorende documentatie in `js/main.js`).

---

## 1. Root cause

`api/offerte-aanvraag.js` heeft **twee** codepaden die HTTP 200 teruggeven, en die stuurden vóór deze ronde een **identieke** JSON-body (`{ ok: true }`):

1. **Genuine succes**: pas nadat validatie, botdetectie én `verstuurEmail()` (dus een bevestigde Resend-response) allemaal zijn gepasseerd.
2. **Stil geblokkeerde bot/honeypot-aanvraag** (`lijktOpBot()` → `true`): stuurt bewust 200 terug zodat een bot geen signaal krijgt dat hij geblokkeerd is — maar roept `verstuurEmail()` **nooit** aan, dus er verschijnt geen mail in Resend.

Omdat beide paden exact dezelfde 200/`{ok:true}`-respons gaven, was het voor Egzon (en voor mij, zonder live Vercel Logs) onmogelijk om vanuit een enkele waarneming ("HTTP 200, maar geen mail") te onderscheiden welk van de twee paden daadwerkelijk werd geraakt. Dat is de kern van het probleem: **geen observability**, niet per se een foute botclassificatie.

Ik heb `lijktOpBot()` en de invultijd-/honeypotlogica grondig doorgelicht (zie punt 2 hieronder) en kan met de code die er lag geen realistisch scenario construeren waarin een normale, menselijke gebruiker van de 12-staps-wizard (die verplichte tekstvelden als naam/e-mail/telefoon/plaats moet invullen) onder de `MIN_FILL_TIME_MS`-drempel van 2500ms zou komen — ook niet met de auto-advance uit ronde 45. `form_rendered_at` wordt bovendien maar één keer gezet, bij het initialiseren van de wizard (niet per stap/auto-advance) — dit is nu ook expliciet met een test bevestigd (zie punt 6). Er zit met andere woorden geen aangetoonde bug in de botdetectie zelf.

**Belangrijke kanttekening, eerlijk gerapporteerd:** ik kan vanuit deze sandbox niet bij de live Vercel Logs of een live browsersessie. Ik kan dus niet met 100% zekerheid vaststellen of het geraakte pad bij Egzon's test daadwerkelijk het bot-pad was, dan wel iets anders (bijvoorbeeld een verouderde/nog niet volledig bijgewerkte deploy op GitHub/Vercel — een probleem dat zich in dit project al eerder heeft voorgedaan, zie de aanbeveling onderaan). Wat ik wél met zekerheid heb gefixt: het architecturale gat waardoor dit soort situaties tot nu toe volledig onzichtbaar waren. Na deze ronde toont Vercel Logs voor elke aanvraag exact welk van de vijf codepaden is geraakt (zie punt 3), zodat een volgende test dit definitief kan bevestigen.

## 2. Inventarisatie van alle 200-responses (vóór deze ronde)

| Codepad | Status | Body (vóór ronde 49) | Roept `verstuurEmail()` aan? |
|---|---|---|---|
| Verkeerde HTTP-methode | 405 | `{ok:false, error:'method_not_allowed'}` | Nee |
| Ongeldige JSON-body | 400 | `{ok:false, error:'invalid_json'}` | Nee |
| **Bot/honeypot geblokkeerd** | **200** | `{ok:true}` | **Nee** |
| Verplichte velden ontbreken/ongeldig | 400 | `{ok:false, error:'missing_fields'}` | Nee |
| `RESEND_API_KEY`/`RESEND_FROM_EMAIL` ontbreken | 500 | `{ok:false, error:'server_misconfigured'}` | Nee (faalt vóór de aanroep) |
| Resend wijst de aanvraag af / netwerkfout | 502 | `{ok:false, error:'send_failed'}` | Ja, maar mislukt |
| **Echte succesvolle verzending** | **200** | `{ok:true}` | **Ja, en Resend bevestigt succes** |

Alleen de twee vetgedrukte paden geven 200. Dit was al zo sinds ronde 39/43 — géén regressie die specifiek door ronde 48 is geïntroduceerd (zie punt 7).

## 3. Botdetectie/honeypot — grondig gecontroleerd

- **Checkbox**: `.checked`, nooit `.value`, wordt correct gebruikt in zowel `js/main.js` (`botcheckInput.checked`) als de payload-opbouw. Het veld heeft `tabindex="-1"` en `autocomplete="off"` en staat buiten het normale tabvolgorde-pad.
- **Verborgen velden**: alleen de honeypot-checkbox en het `form_rendered_at`-hidden-input zijn hiervoor relevant; geen andere verborgen velden spelen een rol in de botdetectie.
- **`form_rendered_at`**: wordt éénmalig gezet bij het **initialiseren** van de wizard (`current = startStep; show(current, false); formRenderedAtField.value = String(Date.now());` — dit staat vóór de `submit`-listener wordt geregistreerd, dus loopt maar één keer per paginabezoek). Nieuw toegevoegd: **Scenario 21** in `test_wizard.js` bevestigt expliciet dat deze waarde na een volledige (auto-advance-)doorloop van de wizard nog exact gelijk is aan de waarde bij initialisatie — geen enkele stap of auto-advance-timer reset hem.
- **`MIN_FILL_TIME_MS = 2500`**: losstaand van Calculator v2, een simpele spamheuristiek. Bij ontbrekend/niet-numeriek `form_rendered_at` faalt de check **open** (geen blokkade) — een client-clockprobleem kan dus nooit een mens blokkeren. Bij negatieve `verstreken` (client-klok ver vooruit) faalt de check ook open.
- **Ronde 47/48-invloed**: geen. Het retourafstand-veld (verwijderd in ronde 48) had geen enkele relatie met de honeypot/timing-logica; de auto-advance-timing (ronde 45) is dit debug expliciet nagelopen en niet aangepast, alleen extra getest (zie punt 6).
- **Conclusie**: ik kan met de huidige code geen realistisch pad reproduceren waarin een normale menselijke gebruiker ten onrechte als bot wordt geclassificeerd. Dit blijft de "eerste verdachte" totdat de nieuwe logs (punt 4) het live bevestigen of uitsluiten.

## 4. Nieuwe, veilige diagnostiek toegevoegd

`api/offerte-aanvraag.js` logt nu bij elke aanvraag exact welk codepad is geraakt:

- `Offerte aanvraag verwerkt: bot_blocked honeypotFilled=<true/false> fillTimeTooShort=<true/false> fillTimeMs=<getal of "onbekend">`
- `Offerte aanvraag verwerkt: validation_failed ontbrekendeVelden=<veldnamen, komma-gescheiden>`
- `Offerte aanvraag verwerkt: resend_attempted`
- `Offerte aanvraag verwerkt: resend_success`
- `Offerte aanvraag verwerkt: resend_failed reden=<server_misconfigured/send_failed>`

**Nooit gelogd**: naam, e-mail, telefoon, berichtinhoud, de volledige payload, of de API-key — bevestigd met een repo-brede grep en met tests (`test_offerte_api.js`, o.a. de bestaande veilige-logging-tests plus de nieuwe scenario A/B-tests die expliciet controleren dat het log alleen booleans/een tijdsduur bevat).

Nieuwe hulpfunctie `bepaalBotSignalen(payload)` splitst het botoordeel in de twee losse signalen (`honeypotFilled`, `fillTimeTooShort`, plus de ruwe `fillTimeMs`) zodat deze apart gelogd kunnen worden. `lijktOpBot()` blijft bestaan met exact dezelfde boolean-signatuur (gebruikt door de bestaande tests) en is nu een dunne wrapper om `bepaalBotSignalen()`.

## 5. Eenduidig response-contract

- **Echte succesvolle verzending**: HTTP 200 + `{ ok: true, success: true }` — `success:true` wordt uitsluitend gezet **nadat** `verstuurEmail()` daadwerkelijk succesvol is gebleken (dus nadat Resend zelf een succesvolle response heeft teruggegeven). Dit was in de code al zo gestructureerd (de `res.status(200)`-aanroep stond al ná een geslaagde `await verstuurEmail()`) — deze ronde maakt het nu ook expliciet zichtbaar in de response-body.
- **Echte technische fout**: 4xx/5xx + `{ ok: false, success: false, error: '...' }`.
- **Geblokkeerde bot/honeypot-aanvraag**: blijft bewust HTTP 200 + `{ ok: true }` — **zonder** het `success`-veld. Dit houdt het pad ondoorzichtig richting een eventuele bot (zoals de brief expliciet toestaat), terwijl het nu via de server-log wél volledig te onderscheiden is van een echte verzending.
- `js/main.js` bleef qua gedrag ongewijzigd (de bestaande check `!res.ok || data.ok === false` werkt correct met de uitgebreide body — extra velden worden genegeerd) — er is alleen een verduidelijkende comment toegevoegd die dit contract expliciet documenteert, zodat een volgende sessie/ontwikkelaar dit niet opnieuw hoeft te reconstrueren.

## 6. Bevestigd: Resend wordt pas aangeroepen ná validatie + botdetectie

De code-structuur garandeerde dit al vóór deze ronde (de `try`-blok-aanroep van `verstuurEmail()` staat ná de bot- en validatiechecks, en `res.status(200)` staat ná een geslaagde `await`) — nieuw is dat dit nu ook expliciet met een test is vastgelegd: **Test 15** (`test_offerte_api.js`) verifieert bij een normale aanvraag stap voor stap dat (1) botdetectie `false` is, (2) de Resend-fetch precies één keer wordt aangeroepen, (3) de respons `success:true` bevat, (4)/(5) er geen foutveld aanwezig is.

## 7. Ronde 47 vs. ronde 48 vergeleken — geen regressie gevonden die dit specifiek veroorzaakt

- **`js/main.js`**: ronde 48 verwijderde uitsluitend het retourafstand-veld (const-declaraties, een zichtbaarheids-blok, een `collectRows()`-regel, een payload-veld). Geen van deze wijzigingen raakt `botcheckInput`, `renderedAtInput`, de `fetch()`-aanroep, of de submit-handler. De verwijderde/aangepaste code was bovendien al defensief geschreven (`enableField()`/`clearAndDisable()` hebben altijd al een `if (!input) return;`-guard), dus een eventuele DOM/JS-mismatch op dit specifieke veld zou niet tot een crash leiden.
- **`api/offerte-aanvraag.js`**: geen wijzigingen in ronde 48 (bevestigd in CHANGELOG-48.md).
- **`lib/mail.js`**: ronde 48's enige functionele wijziging was de Reply-To-fallback (bij een ontbrekend/ongeldig klantadres valt `reply_to` terug op het eigen `RESEND_TO_EMAIL`-adres in plaats van de header weg te laten). Deze wijziging kan een `fetch()`-aanroep naar Resend nooit VERHINDEREN — hooguit, in een falend geval, een extra header toevoegen aan een aanroep die toch al gebeurt. Ze verklaart dus niet "200 maar geen mail".
- **`generate.py`**: alleen de verwijdering van het retourafstand-veld uit de HTML en de ASSET_VERSION-ophoging.
- **Conclusie**: geen van de ronde-48-wijzigingen introduceert een nieuw pad waarbij Resend niet zou worden aangeroepen. De onderliggende dubbelzinnigheid (bot-pad = succes-pad qua respons) bestond al sinds ronde 39/43.

**Aanbeveling naast deze code-fix**: dit project heeft een bekend, herhaald optredend deploy-probleem (zie het projectgeheugen: GitHub's bulk-drag-and-drop-upload heeft in het verleden meerdere keren stil gefaald om CSS/JS bij te werken, ook wanneer HTML er correct uitzag). Controleer na het uploaden van deze zip in GitHub's raw-bestandsweergave dat `js/main.js` en `api/offerte-aanvraag.js` daadwerkelijk de nieuwe inhoud bevatten, en dat Vercel's laatste deployment naar de juiste commit wijst, vóórdat de live test wordt uitgevoerd.

## 8. Onaangeraakt gelaten (zoals gevraagd)

Calculator v2 tijdmodel/prijzen/marges/materiaalberekening/ZZP-logica/uitbesteedbaarheid, het Resend-From-adreslogica, de afstand-/vervoerslogica, de particuliere pakketten, dienst-preselectie, en de auto-advance-mechaniek zelf (`scheduleAutoAdvance`/`cancelAutoAdvance`) — alleen de timing-**gevolgen** daarvan zijn extra getest (Scenario 21), er is niets aan die logica gewijzigd.

## 9. Gewijzigde bestanden

| Bestand | Wijziging |
|---|---|
| `api/offerte-aanvraag.js` | Nieuwe `bepaalBotSignalen()`-hulpfunctie (losse honeypot-/timingsignalen); `lijktOpBot()` behoudt zijn bestaande boolean-signatuur. Veilige diagnostische `console.log`-regels op elk van de vijf codepaden. Response-body van de echte succesvolle verzending uitgebreid met `success:true`; foutresponses uitgebreid met `success:false`. `_internal`-export uitgebreid met `bepaalBotSignalen`. |
| `js/main.js` | Alleen een verduidelijkende comment toegevoegd boven de wizard-submit-`fetch()`-aanroep die het nieuwe response-contract documenteert. Geen functionele wijziging. |
| `generate.py` | `ASSET_VERSION` opgehoogd van `"182"` naar `"183"` (omdat `js/main.js` is gewijzigd); site geregenereerd. |
| `test_offerte_api.js` | Test 7 uitgebreid met Test 7b (`bepaalBotSignalen()`, incl. fail-open-gedrag en een expliciete "snelle maar geldige mens"-check). Test 13/14 uitgebreid met assertions voor `success:true`/`success:false`. Vijf nieuwe tests toegevoegd: Test 15 (productieregressie, normale kantoorreinigingsaanvraag), Test 16 (scenario A: honeypot), Test 17 (scenario B: invultijd te kort), Test 18 (scenario C: snelle maar geldige mens/auto-advance), Test 19 (scenario D: Resend-fout, geen false-positive succes), Test 20 (scenario E: geldige Resend-response, succescontract). |
| `test_wizard.js` | Scenario 21 toegevoegd: bevestigt dat `form_rendered_at` eenmalig bij init wordt gezet en stabiel blijft door een volledige (auto-advance-)wizarddoorloop, en dat de honeypot onaangevinkt blijft. |

Geen enkel ander bestand is aangeraakt.

## 10. Hoe botdetectie nu normale gebruikers niet blokkeert

Zie punt 3 voor de volledige analyse: honeypot reageert alleen op een daadwerkelijk aangevinkte checkbox (nooit door normale interactie bereikbaar, bevestigd in Scenario 21), en de invultijd-drempel (2500ms) ligt ruim onder wat een 12-staps-wizard met verplichte tekstvelden realistisch kost — ook met auto-advance. Beide claims zijn nu voor het eerst expliciet met een test vastgelegd (`test_offerte_api.js` Test 7b/15/18, `test_wizard.js` Scenario 21) in plaats van alleen impliciet uit de code af te leiden.

## 11. Hoe het frontend/backend-succescontract nu werkt

Zie punt 5. Samengevat: `success:true` verschijnt uitsluitend na een bevestigde Resend-verzending; elke fout geeft een echte 4xx/5xx + `success:false`; het bot-pad blijft bewust 200 zonder `success`-veld (niet zichtbaar anders voor een eventuele bot, wel te onderscheiden via de server-log).

## 12. Volledige testresultaten

Alle 5 testsuites groen, `node <bestand>.js`, exit code 0:

| Testbestand | Aantal testblokken | Resultaat |
|---|---|---|
| `test_calculator.js` | 32 (ongewijzigd) | Alle tests geslaagd |
| `test_offerte_api.js` | 27 (was 20; Test 7b + Test 15 t/m 20 toegevoegd) | Alle tests geslaagd |
| `test_contact_api.js` | 11 (ongewijzigd) | Alle tests geslaagd |
| `test_mail.js` | 12 (ongewijzigd) | Alle tests geslaagd |
| `test_wizard.js` | 21 scenario's (Scenario 21 toegevoegd) | Alle scenario's geslaagd |

## 13. Live-teststappen na deploy (met de nieuwe diagnostiek)

1. **Vóór het testen**: controleer in GitHub's raw-bestandsweergave dat `js/main.js` en `api/offerte-aanvraag.js` daadwerkelijk de nieuwe inhoud bevatten, en dat Vercel's laatste deployment naar de juiste commit wijst (zie de aanbeveling in punt 7 — dit project heeft hier eerder problemen mee gehad).
2. Verstuur één test-offerteaanvraag (zakelijk) via de live site, op de normale manier (niet via curl/Postman, om de honeypot/timing exact als een echte bezoeker te doorlopen).
3. Open direct daarna **Vercel → uw project → Logs** (of **Functions → api/offerte-aanvraag → Logs**) en zoek de regel die begint met `offerte-aanvraag: Offerte aanvraag verwerkt:`.
4. Lees exact welk codepad is geraakt:
   - `resend_success` → de mail is daadwerkelijk bij Resend aangeboden; controleer dan Resend → Emails (en eventueel spamfilters, zie CHANGELOG-48.md's deliverability-sectie).
   - `bot_blocked honeypotFilled=true` → de honeypot-checkbox stond aangevinkt bij het versturen (zeer ongebruikelijk voor een mens — controleer of er bijv. een browserextensie/autofill-tool de honeypot heeft aangeraakt).
   - `bot_blocked fillTimeTooShort=true fillTimeMs=<getal>` → de aanvraag kwam binnen minder dan 2500ms na het openen van de wizard; het gelogde `fillTimeMs`-getal laat precies zien hoe kort.
   - `validation_failed ontbrekendeVelden=...` → een verplicht veld ontbrak of was ongeldig; de gelogde veldnamen tonen exact welke.
   - `resend_failed reden=server_misconfigured` → `RESEND_API_KEY`/`RESEND_FROM_EMAIL` ontbreekt in Vercel.
   - `resend_failed reden=send_failed` → Resend zelf wees de aanvraag af, of er was een netwerkfout; de gedetailleerde (veilige) foutmelding staat in de regel direct erboven/eronder van `lib/mail.js`.
5. Deel deze ene loggregel (en, indien `resend_failed`, de bijbehorende detailregel) terug — dat geeft voor het eerst een 100% zekere diagnose in plaats van een educated guess.
