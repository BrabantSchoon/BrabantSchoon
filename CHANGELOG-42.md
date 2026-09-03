# Changelog — Brabantschoon website (ronde 42: debug productie-502 op offertewizard)

Gerichte debugronde naar aanleiding van een 502 bij een live geteste zakelijke
offerteaanvraag, ná het instellen van `WEB3FORMS_ACCESS_KEY` in Vercel Production.
**Geen wijziging aan de calculator/prijsmethode, de wizard-UX, of de key-architectuur**
— uitsluitend veilige diagnostiek toegevoegd en de meest waarschijnlijke oorzaak
vastgesteld op basis van Web3Forms' eigen documentatie.

## 1. Welk codepad geeft de 502?

`api/offerte-aanvraag.js`, de `catch`-blok rond de aanroep van
`verstuurNaarWeb3Forms()` in de handler (was al aanwezig sinds ronde 40, ongewijzigd
qua gedrag — alleen de logging eromheen is nu uitgebreid). Dat blok vangt elke fout
op die optreedt ná de accesskey-controle: zowel een afgewezen/foutieve response van
Web3Forms zelf (`resp.ok === false` of `data.success === false`, binnen
`verstuurNaarWeb3Forms()`) als een netwerkfout die daarvóór al optreedt. Beide
resulteren in een generieke `502 {ok:false, error:"send_failed"}` naar de bezoeker —
by design, zodat er nooit responsdetails van Web3Forms rechtstreeks naar de bezoeker
lekken. Vóór deze ronde werd in dat geval alléén de generieke fout gelogd, zonder de
onderliggende Web3Forms-respons — dat is nu verholpen (zie punt 5).

## 2. Wordt `WEB3FORMS_ACCESS_KEY` in Production correct gelezen?

Vermoedelijk ja. De Vercel-log die u deelde toont dat de function daadwerkelijk wordt
uitgevoerd én een externe POST probeert — bij een ontbrekende/lege omgevingsvariabele
was de aanvraag al vóór dat punt gestopt met een `500 server_misconfigured`
(zie de bestaande check vóór de verzendpoging), niet een `502`. Dat de fout een 502 is
in plaats van een 500, is dus zelf al indirect bewijs dat de key aanwezig is. Om dit
voortaan ook expliciet, veilig zichtbaar te maken: beide endpoints loggen nu bij elk
verzoek `WEB3FORMS_ACCESS_KEY aanwezig=true` of `=false` — uitsluitend een boolean,
nooit de waarde. Bij uw volgende testaanvraag ziet u dit direct in Vercel Logs.

## 3-4. De server-to-server request en de payload

De request gaat naar `https://api.web3forms.com/submit` met
`Content-Type: application/json` en `Accept: application/json`, en een JSON-body met
`access_key`, `subject`, `from_name`, `message`, en (indien bekend) `replyto`. Dit is
gecontroleerd tegen Web3Forms' actuele API-referentie: **`access_key` is het enige
verplichte veld**; `email`/`subject`/`replyto` zijn optioneel, en `message`/`from_name`
zijn geen gereserveerde veldnamen — Web3Forms neemt elk meegestuurd veld gewoon op in
de e-mail. De payload-vorm zelf is dus geen waarschijnlijke oorzaak.

**Wél gevonden — de vermoedelijke daadwerkelijke oorzaak:** Web3Forms' eigen
documentatie (Troubleshooting-pagina, foutmelding "This method is not allowed")
vermeldt expliciet dat hun API primair bedoeld is voor **client-side (browser)**
gebruik als spampreventie, en dat **server-to-server (backend) gebruik alleen wordt
toegestaan op een betaald abonnement, ná het laten whitelisten van uw server-IP-adres
bij hun support**. Precies dát is wat dit endpoint sinds ronde 39/41 doet: een
Vercel Serverless Function die zonder browser-context (geen Origin/Referer) rechtstreeks
naar hun `/submit`-endpoint post — exact het scenario dat hun documentatie als
mogelijk geblokkeerd beschrijft. Dit verklaart het waargenomen patroon precies: de
function draait, de externe POST wordt geprobeerd, Web3Forms antwoordt met een
afwijzing, en onze eigen foutafhandeling zet dat om in een generieke 502.

**Belangrijke kanttekening — dit is de meest waarschijnlijke, best onderbouwde
verklaring, geen 100%-zekerheid.** Ik kon dit niet rechtstreeks tegen uw eigen
Web3Forms-account/-abonnement verifiëren (geen toegang tot uw dashboard vanuit deze
sandbox), en de webresearch-tool bereikte tijdens dit onderzoek een sessielimiet
vlak voordat ik de exacte foutmelding zelf nogmaals kon verifiëren. Zie punt 9 voor
hoe u dit binnen enkele minuten hard kunt bevestigen met de nu toegevoegde logging.

## 5. Toegevoegde diagnostiek (tijdelijk, veilig)

In beide endpoints (`api/offerte-aanvraag.js`, `api/contact-aanvraag.js`):

- Bij elk verzoek: `console.log("... WEB3FORMS_ACCESS_KEY aanwezig=" + true/false)` —
  uitsluitend een boolean.
- Wanneer Web3Forms een niet-2xx status geeft óf `success:false` teruggeeft:
  `console.error` met `http_status=`, `success=`, en een tot 300 tekens **ingekorte**
  `message=` uit de Web3Forms-respons. **Nooit** de access key, **nooit**
  klantgegevens (naam/e-mail/telefoon/bericht) — geverifieerd met een nieuwe
  geautomatiseerde test (zie punt 8) die expliciet controleert dat de testsleutel en
  het testklant-e-mailadres NERGENS in de gelogde regels voorkomen.
- Een vangnet-log in de buitenste `catch` van de handler voor fouten die zich vóór een
  Web3Forms-respons voordoen (bijv. een netwerkfout) — logt alleen het generieke
  fouttype/bericht (ingekort), nooit gevoelige data.

Deze diagnostiek is functioneel neutraal: ze verandert niets aan wélke statuscode de
bezoeker ziet, alleen wát er (veilig) in Vercel Logs terechtkomt. Kan desgewenst in
een latere, rustige ronde weer worden ingekort zodra het onderliggende probleem is
opgelost — voor nu bewust laten staan totdat de 502 structureel is verholpen.

## 6. JSON-verwerking van de Web3Forms-respons

Gecontroleerd: `resp.json().catch(() => ({}))` vangt een niet-JSON-respons al af
(bijv. als Web3Forms bij een blokkade een lege of afwijkende body teruggeeft), en
`!resp.ok || data.success === false` triggert de foutafhandeling op basis van de
**HTTP-status**, niet uitsluitend op het `success`-veld — dus ook een respons zonder
`success`-veld (zoals Web3Forms' eigen documentatie als mogelijke 500-vorm toont:
`{statusCode, error}`, zonder `success`-sleutel) wordt correct als mislukking
herkend via `resp.ok`. Dit deel van de code was al correct en is inhoudelijk
ongewijzigd; alleen de logging eromheen is toegevoegd.

## 7. Gedeelde verzendfunctie?

Nee — bewust, sinds ronde 41: `api/offerte-aanvraag.js` en `api/contact-aanvraag.js`
zijn twee volledig zelfstandige bestanden, elk met hun eigen `verstuurNaarWeb3Forms()`.
**Consequentie voor deze bug**: als de oorzaak inderdaad Web3Forms' blokkade van
server-side gebruik is (zie punt 4), treft dat **beide** endpoints identiek — niet
alleen de offertewizard. Dat is ook precies waarom dezelfde diagnostiek nu in beide
bestanden is toegevoegd, ook al is alleen de offertewizard door u al live getest.

## 8. Lokaal getest (mock, geen echte key/netwerkverzoek)

Nieuwe test in zowel `test_offerte_api.js` (Test 13) als `test_contact_api.js`
(Test 9): simuleert exact het scenario uit punt 4 — een gemockte `fetch` die een
403-achtige afwijzing teruggeeft (`ok:false, status:403,
{success:false, message:"This method is not allowed"}`) — en controleert dat (a) de
bezoeker nog steeds alleen een generieke `502 send_failed` krijgt, nooit de
Web3Forms-foutmelding zelf; (b) de server-log wél `http_status=403`, `success=false`
en de (ingekorte) foutmelding bevat; en (c) de log **nergens** de testsleutel of het
testklant-e-mailadres bevat. Alle 13 tests in `test_offerte_api.js` en alle 9 tests
in `test_contact_api.js` slagen, inclusief alle reeds bestaande tests (geen
regressie). `test_wizard.js` opnieuw gedraaid: geen wijziging, exit code 0.

## 9. Wat moet u nu doen?

1. **Deploy deze wijziging** (alleen `api/offerte-aanvraag.js` en
   `api/contact-aanvraag.js` zijn aangepast — verder niets).
2. **Test opnieuw** een zakelijke offerteaanvraag (of het contactformulier) live.
3. **Bekijk de Vercel-logs van die aanvraag** en zoek naar de regel die begint met
   `offerte-aanvraag: Web3Forms-verzending mislukt.` (of `contact-aanvraag: ...`).
   Deel de waarden van `http_status=`, `success=` en `message=` uit die regel met mij
   (dit bevat gegarandeerd geen sleutel of klantgegevens, dus veilig te delen).
4. **Als de melding inderdaad wijst op "method not allowed"/server-side blokkade**
   (punt 4): dan is dit geen bug in deze code, maar een beperking van Web3Forms' gratis
   abonnement voor server-to-server gebruik. Twee vervolgopties, waarvan ik zelf geen
   van beide zomaar zou doorvoeren zonder uw akkoord (kosten- en architectuurkeuze):
   - **(a)** Contact opnemen met Web3Forms-support, uw Vercel-uitgaande IP-adres(sen)
     laten whitelisten, én overstappen op een betaald Web3Forms-abonnement. Nadeel:
     Vercel Serverless Functions hebben doorgaans GEEN vast IP-adres (dat vereist een
     apart, ook betaald Vercel-product) — dus dit pad kan alsnog vastlopen tenzij u dat
     ook regelt.
   - **(b)** Overstappen naar een e-maildienst die server-to-server-verzending zonder
     beperking ondersteunt (bijv. Resend, Postmark, SendGrid, Mailgun — allemaal
     expliciet gebouwd voor backend-gebruik). Dit raakt beide `/api/*.js`-bestanden
     (de verzendfunctie), maar NIET de calculator, de wizard-UX, of de rest van de
     site. Ik voer dit bewust niet uit zonder uw akkoord, omdat het een keuze van
     dienst (en mogelijk kosten) is die aan u is.
   Zodra u de exacte logregel deelt, bevestig ik welke van deze twee (of eventueel een
   andere oorzaak) van toepassing is, en werk ik gericht de daadwerkelijke oplossing
   uit.
5. **Als de melding iets anders toont** (bijv. een domeinblokkade, een ongeverifieerde
   key, of een heel andere foutmelding): stuur die tekst door, dan pas ik de diagnose
   en de fix daarop aan.

**Nog niet definitief opgelost** — deze ronde levert gerichte diagnostiek en een
onderbouwde hypothese, maar de daadwerkelijke, blijvende oplossing hangt af van wat de
Vercel-logs na deze deploy laten zien. Zie ik geen enkele reden om verder te wachten
met deployen: de toegevoegde logging is puur informatief en verandert niets aan het
zichtbare gedrag voor bezoekers.
