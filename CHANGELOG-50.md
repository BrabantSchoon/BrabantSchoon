# Ronde 50 — Productiefix: Resend 422 "Invalid `from` field"

## Gerapporteerd probleem

Resend wees uitgaande e-mails af met een `422 validation_error`:

> Invalid `from` field

Het daadwerkelijke request-payload dat naar Resend ging bevatte:

```json
"from": "<offerte@brabantschoon.nl>"
```

— punthaken, maar **zonder geldige weergavenaam ervoor**. Resend accepteert
uitsluitend een kaal e-mailadres (`email@voorbeeld.nl`) of `Naam
<email@voorbeeld.nl>`; `<email@voorbeeld.nl>` zonder naam wordt geweigerd.

De Vercel-omgevingsvariabele `RESEND_FROM_EMAIL` staat ingesteld op de kale
waarde `offerte@brabantschoon.nl` (geen punthaken) en hoefde/mocht van de
opdrachtgever niet wijzigen.

## Root cause — concreet onderzocht en gerapporteerd

Vóór deze fix bevatte `lib/mail.js` het volgende (in `getResendConfig()`):

```js
const from = leesEnv("RESEND_FROM_EMAIL"); // ruw, ongewijzigd
```

en in `verstuurEmail()`:

```js
const body = { from: config.from, ... }; // rechtstreeks gebruikt
```

Er stond **nergens** in de repository code die zelf punthaken toevoegt aan
`RESEND_FROM_EMAIL`. Dit is expliciet gecontroleerd met een repo-brede grep:

```
grep -rn "RESEND_FROM_EMAIL\|config\.from\|body\.from\b" --include="*.js" .
```

— buiten `lib/mail.js` zelf raakt geen enkele andere plek in de code het
adres aan.

**Conclusie / eerlijke bevinding:** met de hier aanwezige (pre-fix) code zou
`RESEND_FROM_EMAIL=offerte@brabantschoon.nl` woordelijk `offerte@brabant
schoon.nl` (kaal, zonder punthaken) naar Resend hebben gestuurd — niet
`<offerte@brabantschoon.nl>`. De meest waarschijnlijke verklaring voor de
daadwerkelijk waargenomen productiefout is dat de Vercel-omgevingsvariabele
zelf al de kapotte waarde `<offerte@brabantschoon.nl>` bevatte (bijvoorbeeld
doordat ooit een voorbeeldwaarde met punthaken is gekopieerd zonder er zelf
een naam vóór te zetten). Dit kan ik zonder toegang tot de live Vercel-
omgevingsvariabelen niet met 100% zekerheid vaststellen — maar het maakt voor
de fix ook niet uit: onderstaande oplossing herstelt **beide** situaties (een
kale waarde én een kapotte punthaken-zonder-naam-waarde) automatisch en
robuust, ongeacht wat er precies in de omgevingsvariabele staat.

## Fix

**Enige gewijzigde bestanden:** `lib/mail.js` (functionele wijziging) en
`test_mail.js` (nieuwe regressietests). Verder is niets aangepast.

### Nieuwe functie: `bouwFromHeader(ruweWaarde)`

Bouwt een geldig, idempotent Resend-`from`-veld op uit de ruwe
`RESEND_FROM_EMAIL`-waarde:

1. **Trimt** whitespace/regeleindes (via de bestaande `enkeleRegel()`-helper
   — dezelfde header-injectiebescherming die al voor `subject`/`reply_to`
   werd gebruikt).
2. **Kale, geldige e-mailwaarde** (geen punthaken) → wordt gewrapt tot
   `Brabantschoon <e-mailadres>`.
3. **Al correct geformatteerd** (`Naam <e-mailadres>` met niet-lege naam en
   geldig adres) → **ongewijzigd teruggegeven**. Nooit dubbel gewrapt: een
   tweede aanroep op de eigen uitvoer is altijd een no-op
   (`Brabantschoon <x> ` wordt nooit `Brabantschoon <Brabantschoon <x>>`).
4. **Punthaken zonder naam** (`<offerte@brabantschoon.nl>` — exact de
   gerapporteerde productiefout) → hersteld door alsnog de vaste
   weergavenaam (`Brabantschoon`) ervoor te zetten.
5. **Alles anders** (leeg, ongeldig e-mailadres, dubbel/verward genest zoals
   `Brabantschoon <Brabantschoon <...>>`) → `null`. Er wordt **nooit**
   gegokt of een half geformatteerde waarde teruggegeven.

`getResendConfig()` gebruikt deze functie nu voor het `from`-veld. Een
`null`-resultaat (ontbrekende óf onherstelbare waarde) wordt behandeld als
ontbrekende configuratie: `verstuurEmail()` gooit dan `server_misconfigured`
(HTTP 500), **vóórdat** er ooit een netwerkverzoek naar Resend gaat. Er
wordt dus nooit een ongeldig `from`-veld daadwerkelijk verzonden.

### Wat expliciet NIET is aangepast

Zoals gevraagd: **uitsluitend de From-header-opbouw** is aangepast.
Ongewijzigd gebleven:

- Calculator v2, prijzen, tijdmodel (`lib/calculator.js`) — geen enkele
  regel aangeraakt.
- Botdetectie (`bepaalBotSignalen()`, honeypot/invultijd-logica).
- De wizard en auto-advance-gedrag (`js/main.js`).
- Kilometer/vervoer-logica.
- Offerte-inhoud (tekst/HTML-secties van de e-mail).
- **Reply-To**: `verstuurEmail()`'s Reply-To-fallback (`veiligeReplyTo`,
  `body.reply_to`) is letterlijk dezelfde code als vóór deze ronde. Reply-To
  blijft altijd het geldige e-mailadres van de klant (met de bestaande
  veilige fallback naar het eigen Brabantschoon-adres bij een ontbrekend of
  ongeldig klantadres).
- De Resend-provider zelf (endpoint, requestvorm, foutafhandeling).

`RESEND_FROM_EMAIL` in Vercel **hoeft niet te wijzigen** en kan gewoon
blijven staan als de kale waarde `offerte@brabantschoon.nl` — de code
herstelt dit nu zelf tot het geldige `Brabantschoon
<offerte@brabantschoon.nl>`.

## Regressietests toegevoegd (`test_mail.js`)

**Test 4b** — unit tests voor `bouwFromHeader()`, dekt minimaal de 5
gevraagde scenario's:

1. `offerte@brabantschoon.nl` → `Brabantschoon <offerte@brabantschoon.nl>`
2. `"  offerte@brabantschoon.nl  "` (whitespace rondom) → correct getrimd,
   zelfde resultaat als (1).
3. Reeds geformatteerd `Brabantschoon <offerte@brabantschoon.nl>` → precies
   ongewijzigd teruggegeven (niet dubbel geformatteerd).
4. Lege/ongeldige waarden (`""`, `"niet-een-emailadres"`,
   `"<niet-een-emailadres>"`) → `null`.
5. Extra dekking: de exacte productiefout `<offerte@brabantschoon.nl>`
   (punthaken zonder naam) → hersteld tot
   `Brabantschoon <offerte@brabantschoon.nl>`; en het pathologische geval
   `Brabantschoon <Brabantschoon <offerte@brabantschoon.nl>>` → veilig
   `null` (nooit een gegokte dubbele wrap).

**Test 4c** — `getResendConfig()`-integratietests: bare env-waarde, de
root-cause-scenario (punthaken zonder naam), en een ongeldige waarde die
veilig als configuratiefout eindigt (nooit een kapotte config die alsnog
"geldig" lijkt).

**Test 4d** — volledige end-to-end `verstuurEmail()`-test (scenario 5,
"normale offerteaanvraag"): met een kale `RESEND_FROM_EMAIL` bevat het
daadwerkelijke Resend-requestbody exact `Brabantschoon
<offerte@brabantschoon.nl>` als `from`, en blijft Reply-To het (ongewijzigde)
e-mailadres van de klant.

## Testresultaten — alle bestaande tests gedraaid

Alle 5 testbestanden zijn na de wijziging gedraaid en zijn **volledig
groen**, exit code 0, geen regressies:

| Testbestand | Resultaat |
|---|---|
| `test_mail.js` | ✅ Alle tests geslaagd (incl. nieuwe Tests 4b/4c/4d) |
| `test_offerte_api.js` | ✅ Alle 20 testblokken geslaagd (0 regressies door de From-header-fix) |
| `test_contact_api.js` | ✅ Alle 10 testblokken geslaagd (0 regressies) |
| `test_calculator.js` | ✅ Alle 24 tests geslaagd (ongewijzigd, zoals verwacht — dit bestand raakt `lib/mail.js` niet aan) |
| `test_wizard.js` | ✅ Alle 21 scenario's geslaagd (ongewijzigd, zoals verwacht) |

`test_offerte_api.js` en `test_contact_api.js` gebruikten in hun bestaande
`RESEND_FROM_EMAIL`-testwaarden al correct geformatteerde strings
(`Brabantschoon <noreply@brabantschoon.nl>` /
`Brabantschoon <info@brabantschoon.nl>`) — deze lopen door
`bouwFromHeader()` ongewijzigd door (idempotentie-garantie), wat door de
volledige testrun nu ook empirisch bevestigd is.

## Benodigde actie in Vercel

**Geen.** `RESEND_FROM_EMAIL` mag blijven staan zoals hij nu is
(`offerte@brabantschoon.nl`, zonder punthaken). Zodra deze ronde live staat,
bouwt de code zelf het geldige `Brabantschoon
<offerte@brabantschoon.nl>`-formaat op bij elke verzending.
