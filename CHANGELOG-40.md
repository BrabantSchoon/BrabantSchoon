# Changelog — Brabantschoon website (ronde 40, beveiligingsronde)

Web3Forms access key uit de broncode van `api/offerte-aanvraag.js` gehaald.

## 1. Waar stond de hardcoded key?

In `api/offerte-aanvraag.js`, in het `CONFIG`-object:
`WEB3FORMS_ACCESS_KEY: "abc98c0d-af...5299"` — deze werd rechtstreeks meegestuurd
naar Web3Forms bij elke zakelijke/particuliere offerteaanvraag via de wizard.

## 2. Welke bestanden zijn aangepast?

- **`api/offerte-aanvraag.js`** — de hardcoded key is volledig verwijderd. Nieuwe
  functie `getWeb3FormsAccessKey()` leest de key bij elk verzoek uit
  `process.env.WEB3FORMS_ACCESS_KEY`; `verstuurNaarWeb3Forms()` krijgt hem nu als
  parameter mee in plaats van uit `CONFIG` te lezen. De handler controleert vóór
  elke verzendpoging of de key aanwezig is; ontbreekt hij, dan stopt de aanvraag
  daar veilig (zie punt 3-4).
- **`.env.example`** *(nieuw)* — bevat uitsluitend `WEB3FORMS_ACCESS_KEY=` (leeg),
  met uitleg in commentaar. Geen echte waarde.
- **`.gitignore`** *(nieuw — bestond nog niet)* — negeert `.env`/`.env.*.local`/etc.,
  plus `node_modules/` en `__pycache__/` (lokaal testgereedschap resp. Python-cache,
  horen sowieso niet in de repository).
- **`README.md`** — nieuwe sectie "Secrets & environment variables" met volledige
  uitleg (hoe in te stellen in Vercel, hoe lokaal te testen, en een belangrijke
  nuance over het contactformulier, zie punt 5 hieronder); kleine aanvulling bij
  "Lokaal testen" over de nieuwe env-var-tests.
- **`test_offerte_api.js`** — 3 nieuwe tests (10, 11, 12): bevestigen dat `CONFIG`
  geen key-veld meer bevat, dat het endpoint veilig faalt (500,
  `{ok:false, error:"server_misconfigured"}`, geen "verzonden"-melding, geen
  sleutelwaarde in de log) wanneer de omgevingsvariabele ontbreekt, en dat
  verzending normaal verloopt zodra hij aanwezig is (getest met een verzonnen
  testwaarde en een gemockte `fetch` — nooit een echt netwerkverzoek of de echte
  sleutel).

**Niet gewijzigd (bewust, per instructie):** de offertewizard zelf (`offerte.html`,
`js/main.js`), de zakelijke calculatielogica/parameters, de e-mailopmaak, de
particuliere offerteflows, styling. `generate.py` — zie punt 5 voor waarom dat
bestand ondanks de gerelateerde bevinding bewust ongewijzigd is gelaten.
md5sum-controle bevestigt: `generate.py`, `js/main.js`, `css/styles.css` en
`offerte.html` zijn byte-identiek aan de vorige ronde.

## 3. Welke environment variable wordt nu verwacht?

**`WEB3FORMS_ACCESS_KEY`** — moet in Vercel worden ingesteld onder
**Project Settings → Environment Variables** (minimaal voor Production; ook Preview
als u pull-request-previews wilt kunnen testen). Zonder deze variabele blijft het
endpoint actief maar stuurt het niets: elk verzoek krijgt een generieke
`500`-foutmelding, zonder dat de bezoeker ooit een valse succesmelding ziet, en zonder
dat er ergens een sleutelwaarde gelogd wordt.

## 4. Zijn er andere hardcoded secrets gevonden?

Nee — een repo-brede scan (patronen als `api_key`/`secret`/`token`/`password`/
`bearer`/`private_key`, en een aparte zoekopdracht naar de Web3Forms-sleutel zelf)
leverde verder niets op. De Google Analytics measurement-ID (`G-DXH4VEW9TV` in
`generate.py`) is geen secret — dat is per ontwerp een publiek identifier, net als
elke GA-trackingcode. Er stond geen `.env`-bestand in de repository.

Wél gevonden — geen "ander" secret, maar een belangrijke nuance bij dezelfde sleutel:
**dezelfde Web3Forms access key staat óók, onveranderd, hardcoded in de HTML van het
compacte contactformulier en het footerformulier op alle 38 gegenereerde pagina's**
(bron: `generate.py`, regel 433: `<input type="hidden" name="access_key" value="...">`).
Dat is **geen fout die deze ronde is geïntroduceerd of gemist** — het is een
inherente eigenschap van Web3Forms' pure-client-side-integratiemodel (dat formulier
heeft geen eigen backend, dus de key moet daar wel zichtbaar in de HTML staan om te
kunnen werken) — maar het betekent wel dat **het verwijderen van de key uit
`api/offerte-aanvraag.js` niet hetzelfde is als "de key is nergens meer zichtbaar"**.
Zie punt 5 voor wat dit concreet betekent bij het roteren.

Deze plek is bewust **niet** aangepast deze ronde: dat zou `generate.py` en alle 38
gegenereerde pagina's raken, wat uitdrukkelijk buiten de scope van deze
beveiligingsronde viel ("verander niet onnodig de bestaande offerteflow") en ook niet
expliciet gevraagd was. Zie punt 9/aanbevelingen als u dit ook wilt aanpakken.

## 5. Staat `.gitignore` goed?

Er bestond nog **geen** `.gitignore` in de repository. Deze is nu toegevoegd met
`.env`/`.env.local`/`.env.*.local`/etc., `node_modules/`, `__pycache__/` en wat
gebruikelijke OS-bestanden (`.DS_Store`). Niets bestaands is hierdoor kapotgemaakt —
er stonden geen van deze bestanden al in de repository om per ongeluk te negeren.

## 6. Staat de oude key mogelijk nog in de Git-history?

Zeer waarschijnlijk ja — u gaf zelf al aan dat de versie mét de hardcoded key naar
GitHub is gepusht, dus die staat in minimaal één eerdere commit. Ik heb hier vanuit
deze sandbox geen inzage in (geen gekoppelde Git-repository of GitHub-toegang hier,
zie punt 9) en kan dit dus niet zelf bevestigen of opschonen. Dit is echter, zoals u
zelf al aangaf, ook niet per se nodig: **de gangbare, juiste aanpak bij een mogelijk
gelekte key is roteren (de oude key ongeldig maken bij de bron), niet Git-history
herschrijven.** History herschrijven (bijv. met `git filter-repo`) is ingrijpend,
verstoort iedereens lokale kloon, en lost het achterliggende risico niet op als de
oude key inmiddels ook al ergens anders gekloond/gecached is — zodra u de key bij
Web3Forms roteert, is de oude, in de geschiedenis zichtbare key sowieso waardeloos
voor een aanvaller. Alleen roteren is dus voldoende; history-herschrijving is niet
nodig.

## 7. Wat moet u nu zelf nog doen?

1. **Web3Forms**: genereer een nieuwe access key (rotatie) voor het bestaande
   formulier/project. Web3Forms toont doorgaans zowel de oude als de nieuwe key even
   naast elkaar of maakt de oude direct ongeldig, afhankelijk van hun huidige
   dashboard-flow — controleer dit bij het roteren.
2. **Vercel**: voeg de NIEUWE key toe als environment variable
   `WEB3FORMS_ACCESS_KEY` onder Project Settings → Environment Variables (Production,
   en Preview indien gewenst). Trigger daarna een nieuwe deployment (een environment
   variable-wijziging wordt pas meegenomen bij de eerstvolgende build/deploy, niet
   automatisch met terugwerkende kracht op een al draaiende deployment).
3. **Belangrijk — lees punt 4/5 hierboven**: als Web3Forms de oude key bij rotatie
   ongeldig maakt, stopt het **contact-/footerformulier** (dat de oude key nog
   hardcoded in de HTML heeft) met werken totdat u `generate.py` ook met de nieuwe
   key opnieuw genereert en deployt. Wilt u dat ik dat in een aparte, kleine ronde
   voor u doorvoer zodra u de rotatie heeft uitgevoerd? Dat is een kleine, geïsoleerde
   wijziging (één waarde in `generate.py`, gevolgd door `python3.12 generate.py` en
   opnieuw deployen) — ik heb hem nu bewust niet zelf al doorgevoerd omdat ik de
   nieuwe key niet mag verzinnen en u die zelf bij Web3Forms genereert.
4. **Push naar GitHub**: zie punt 9 — dat moet u zelf doen, zoals bij elke eerdere
   ronde (zip uitpakken, uploaden via GitHub's "Add file → Upload files").

## 8. Is de offerteflow technisch klaar voor een test?

Ja, met één voorwaarde: **zodra `WEB3FORMS_ACCESS_KEY` in Vercel is ingesteld**
(punt 7.2) werkt de offertewizard exact zoals in ronde 39 opgeleverd en getest —
niets aan de wizard, de calculatielogica of de e-mailopmaak is veranderd. Vóór die
Vercel-instelling is gedaan, zal elke aanvraag via de wizard netjes falen met een
generieke foutmelding voor de bezoeker (formulier blijft zichtbaar, geen valse
succesmelding) in plaats van te "verdwijnen" — dat is precies het gewenste,
veilige gedrag.

## 9. Kon dit direct naar GitHub gepusht worden?

Nee. Deze sandbox-omgeving heeft geen gekoppelde Git-repository en geen
GitHub-toegang tot uw specifieke Brabantschoon-repo — er is hier domweg geen
verbinding met uw GitHub-account of -repository beschikbaar om vanuit te pushen. De
wijzigingen zijn daarom, zoals elke eerdere ronde, klaargezet als bestanden/zip: u
uploadt ze op dezelfde manier als altijd (uitpakken, dan via GitHub's
"Add file → Upload files" de gewijzigde/nieuwe bestanden plaatsen). Nieuw ten
opzichte van eerdere rondes: dit keer horen daar ook **twee nieuwe, niet eerder
bestaande bestanden** bij die niet over het hoofd gezien mogen worden:
`api/offerte-aanvraag.js` (gewijzigd), `.env.example` (nieuw) en `.gitignore`
(nieuw) — plus de bijgewerkte `README.md` en `test_offerte_api.js`.
