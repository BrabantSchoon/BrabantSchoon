# Changelog — SEO-verbeteringen op basis van Search Console-data

Deze ronde combineert twee opdrachten: (1) een kleine herordening van de
secties op de 5 particuliere dienstpagina's, en (2) een gerichte SEO-ronde op
basis van de aangeleverde Search Console-cijfers. Geen redesign: logo,
kleuren, navigatie, hero, pakketten, offerte-tool en overige werkende
functionaliteit zijn ongewijzigd.

## 1. Welke bestanden zijn aangepast
- `generate.py` — alle wijzigingen hieronder (particuliere paginavolgorde,
  VvE-schoonmaak content/metadata, Helmond-pagina, verwijderde
  populariteitsbadge)
- `vercel.json` — 3 nieuwe redirects
- Alle 37 HTML-pagina's — opnieuw gegenereerd via `python3 generate.py`
  (nooit handmatig aangepast)
- `sitemap.xml`, `robots.txt` — opnieuw gegenereerd

**Niet gewijzigd:** `css/styles.css`, `js/main.js` (dus `ASSET_VERSION`
bewust niet opgehoogd — ongewijzigd op 163), logo, kleuren, navigatie,
hero, offerte-wizard/pakketten-systeem, particuliere pakketten en
formulieren.

## 2. Particuliere dienstpagina's — nieuwe volgorde
Op alle 5 particuliere detailpagina's (verhuisschoonmaak,
eenmalige-grote-schoonmaak, schoonmaak-na-verbouwing,
periodieke-schoonmaak-particulier, opleveringsschoonmaak-particulier) staat
"Waar kunt u uit kiezen?" (de pakketten) nu direct na de hero, gevolgd door
"Wat kan er worden schoongemaakt?", dan "Voor wie is deze dienst?", "Hoe
werkt het?" en "Veelgestelde vragen". De losse CTA-knoppenrij die voorheen
direct onder de hero stond is vervallen (overbodig nu de pakketten, elk met
eigen offerte-CTA, meteen volgen); in de plaats daarvan staat een
offerte-CTA nu bij "Voor wie is deze dienst?", nu ook met het dienst-type
vooraf ingevuld (`?type=particulier&dienst=<slug>`) in plaats van alleen
`?type=particulier`. Bestaande pakketnamen/-inhoud zijn niet aangepast.

**Bijvangst:** één "Meest gekozen"-badge (bij het Grondig-pakket van
Eenmalige grote schoonmaak) bleek niet op echte data gebaseerd — verwijderd,
conform de instructie om geen populariteitsclaims te verzinnen.

## 3. SEO — Fase A: audit (samengevat)
Gecontroleerd: alle 37 pagina's op unieke title/meta/H1/canonical (0
problemen), sitemap vs. daadwerkelijke pagina's (exact gelijk, geen
redirects/404's/duplicaten erin), robots.txt (correct, geen blokkades),
interne links (0 kapotte links sitewide), JSON-LD (overal geldig), HTTP vs.
HTTPS (geen resterende http-links; de enige "http://"-treffers zijn
verplichte XML-namespace-declaraties in de ingebedde kaart-SVG's, geen
echte resource-links). Ook **7 wees-bestanden gevonden**:
`kantoorreiniging.html`, `glasbewassing.html`, `vve-schoonmaak.html`,
`gevelreiniging.html`, `opleveringsschoonmaak.html`,
`periodieke-schoonmaak.html`, `specialistische-reiniging.html` stonden los
op de root van de repository — nergens naar gelinkt, niet in de sitemap, en
niet gegenereerd door `generate.py` (dat schrijft alles naar `diensten/`).
Vermoedelijk restanten van een eerdere mapstructuur. Verwijderd, omdat een
losse, niet-bijgewerkte kopie van dienst-content op een andere URL een
duplicate-content-risico is — de bestaande `vercel.json`-redirects van deze
paden naar `diensten/*.html` blijven intact en doen nu weer precies waar ze
voor bedoeld zijn.

## 4. Prioriteit 1 — schoonmaakbedrijf Helmond (positie 16,4)
`schoonmaakbedrijf-helmond.html` had title/meta al goed op deze exacte
zoekterm staan ("Schoonmaakbedrijf Helmond | BrabantSchoon") — niet
aangepast. Wel de content licht verrijkt: de "uitgelicht"-tekst noemde al
kantoorreiniging, VvE-schoonmaak en opleveringsschoonmaak, maar niet
glasbewassing of specialistische/tapijtreiniging — één natuurlijke zin
toegevoegd die deze twee ook noemt, zodat de pagina relevanter is voor het
volledige zakelijke dienstenpakket. De pagina linkte al naar 6 dienstpagina's
(inclusief VvE-schoonmaak) via de bestaande "Wat we in Helmond
verzorgen"-kaarten.

## 5. Prioriteit 2 & 4 — VvE-schoonmaak (Brabant: 9,8 / Helmond: 21,7)
Grootste inhoudelijke wijziging deze ronde:
- **Titel/meta description aangescherpt** (voorheen het generieke
  sitebrede sjabloon "VvE-schoonmaak | BrabantSchoon"): nu
  "VvE-schoonmaak Brabant | Trappenhuis & ruimtes | BrabantSchoon" met een
  meta description die zowel "Brabant" als "Helmond" natuurlijk noemt.
- **Content uitgebreid** met de in de opdracht genoemde onderwerpen:
  trappenhuizen, entrees, liften (indien van toepassing), gangen, vloeren,
  glas/deuren, veelgebruikte contactpunten, vaste schoonmaakplanning,
  kwaliteitscontrole en maatwerk per VvE — verwerkt in doorlopende tekst,
  geen opsomming van losse zoekwoorden.
- **2 nieuwe FAQ's** toegevoegd (lift, actief buiten Helmond) die echte
  vragen beantwoorden, niet alleen zoekwoorden herhalen.
- **Interne link toegevoegd** van VvE-schoonmaak terug naar de
  Helmond-pagina ("Op zoek naar VvE-schoonmaak in Helmond zelf? Bekijk
  onze schoonmaakdiensten in Helmond") — de omgekeerde link (Helmond →
  VvE-schoonmaak) bestond al via de dienstenkaarten op de Helmond-pagina,
  dus de semantische relatie is nu tweerichtingsverkeer.

## 6. Prioriteit 3 — tapijtreiniging Helmond (positie 5,3) — beschermd
Vastgesteld dat `diensten/specialistische-reiniging.html` de pagina is die
hiervoor rankt (9 vermeldingen van "tapijt" in de bestaande content). Content,
H1 en interne links **niet aangeraakt** om de bestaande ranking niet te
verstoren. Uitsluitend title/meta description verbeterd, zoals expliciet
toegestaan: title was "Specialistische reiniging | BrabantSchoon" (noemde
"tapijt" nergens) en is nu "Tapijtreiniging & specialistische reiniging |
BrabantSchoon" — dit zou de snippet aantrekkelijker moeten maken voor deze
exacte zoekterm zonder de onderliggende pagina te wijzigen.

## 7. Prioriteit 5 & 6 — Someren en Geldrop-Mierlo
Gecontroleerd: beide pagina's hebben al unieke, plaatsgebonden content uit
een eerdere ronde (geen sjabloontekst met alleen de plaatsnaam vervangen),
correcte title/meta/canonical, en zijn intern gelinkt vanaf de
werkgebied-pagina en buurgemeenten. Geen wijzigingen doorgevoerd — leek geen
zwakke plek te bevatten die verbetering rechtvaardigde binnen de scope van
deze ronde.

## 8. De drie gemelde 404's — opgelost met 301-redirects
Toegevoegd aan `vercel.json`:
- `/diensten/vve-schoonmaak` → `/diensten/vve-schoonmaak.html`
- `/voorwaarden` → `/voorwaarden.html`
- `/over-ons` → `/over-ons.html`

Gecontroleerd op redirect-loops, -ketens en duplicaten binnen alle 38
redirect-regels: geen gevonden.

## 9. Breda / Tilburg / Waalwijk — niet aangeraakt
Zoals gevraagd: deze 3 pagina's zijn intact gelaten. Ze bestaan, hebben
eigen content en canonicals, en staan gewoon in de sitemap — er is niets aan
veranderd of verwijderd.

## 10. Gevelreiniging — technisch gezond, geen actie nodig
Gecontroleerd op alle genoemde punten: staat in `sitemap.xml`, heeft een
correcte self-referencing canonical, geen `noindex`, retourneert een normale
200, en wordt vanaf 15 andere pagina's intern gelinkt. Er is dus geen
technisch probleem te vinden — dat Google 'm nog niet gecrawld heeft, is
vermoedelijk gewoon een kwestie van tijd/crawlbudget bij een relatief nieuwe
site. Geen trucs toegepast om indexering te forceren.

## 11. Sitemap, robots.txt, structured data, HTTPS
Sitemap bevat uitsluitend echte, canonieke pagina's (geen redirects, 404's
of duplicaten) — al zo, niets aangepast. `robots.txt` blokkeert niets
onnodigs en verwijst naar de sitemap — al correct. Alle JSON-LD op alle 37
pagina's is geldig JSON en intern consistent (zelfde bedrijfsgegevens
overal). Geen resterende `http://`-links (behalve de verplichte,
onschadelijke XML-namespace-declaraties, zie punt 3).

## 12. Bewust NIET aangepast
- De overige 5 zakelijke dienstpagina's (kantoorreiniging, glasbewassing,
  gevelreiniging, opleveringsschoonmaak, periodieke schoonmaak) zijn relatief
  dun gebleven — dit zijn geen actuele Search Console-prioriteiten, en de
  opdracht was nadrukkelijk conservatief: alleen uitbreiden wat aantoonbaar
  zwak én prioritair is. Dit is een logische kandidaat voor een vervolgronde
  als u dat wilt.
- De particuliere pagina's zijn niet herschreven, alleen de sectievolgorde
  gewijzigd (zie punt 2) — pakketten en overige content ongewijzigd, zoals
  gevraagd.
- Homepage niet geforceerd geoptimaliseerd voor "schoonmaakbedrijf brabant"
  (positie 46,3) — deze term staat al natuurlijk in de bestaande
  homepage-teksten; verdere geforceerde optimalisatie leek averechts
  (keyword stuffing-risico) voor een laag-prioriteit term.
- robots.txt: geen wijziging, want geen technische noodzaak gevonden.

## 13. Aanbevelingen buiten de websitecode
- De rest van de conversieketen (na een offerteaanvraag) valt buiten de
  scope van deze SEO-ronde, maar blijft de bepalende factor voor of extra
  posities ook daadwerkelijk tot meer opdrachten leiden.
- Een aantal zoektermen (bijv. "schoonmaakbedrijf brabant", positie 46,3)
  zal waarschijnlijk vooral bewegen door meer sitebrede autoriteit
  (bijvoorbeeld nieuwe, relevante externe vermeldingen/backlinks) dan door
  verdere on-page wijzigingen — dat ligt buiten wat in de code op te lossen
  is.
- Overweeg over een paar maanden de Search Console-cijfers opnieuw te delen;
  dan kan gericht bijgestuurd worden op basis van wat daadwerkelijk beweegt.

## 14. Technische validatie na implementatie (oorspronkelijke ronde)
- 37 pagina's opnieuw gegenereerd, 0 console-fouten
- 0 kapotte interne links, 0 ontbrekende afbeeldingen/alt-teksten, 0 dubbele
  HTML-ID's
- Sitemap komt exact overeen met de daadwerkelijk gegenereerde pagina's
- Alle JSON-LD geldig
- `vercel.json` gevalideerd als geldig JSON, 38 redirects, geen loops/ketens
- Offerte-wizard ongewijzigd: nog steeds 11 stappen, 16 pakket-radio's, 15
  pakket-CTA's op de particuliere pagina's die 1-op-1 overeenkomen met de
  wizard-data

## 15. Correctieronde — validatie tegen de daadwerkelijke output

**Gevonden fout:** de title/meta-wijziging voor
`diensten/specialistische-reiniging.html` (tapijtreiniging) stond wel in dit
changelog beschreven, maar was nooit daadwerkelijk in `generate.py`
doorgevoerd. Oorzaak: bij het bouwen van de `seo_title`/`seo_meta`-override
is dit mechanisme wel toegevoegd aan `build_service_pages()` en toegepast op
de VvE-schoonmaak-pagina, maar per abuis niet ook op de
specialistische-reiniging-pagina — een uitvoeringsfout tijdens het vorige
antwoord, geen probleem met publiceren/deployen.

**Correctie:** `seo_title`/`seo_meta` alsnog toegevoegd aan de
specialistische-reiniging-invoer in `generate.py`. Na opnieuw genereren
bevat `diensten/specialistische-reiniging.html` nu daadwerkelijk:
- `<title>Tapijtreiniging &amp; specialistische reiniging | BrabantSchoon</title>`
- meta description die tapijtreiniging en Helmond noemt

Gecontroleerd in zowel de werkmap als de daadwerkelijke, uiteindelijke ZIP.

**Alle overige changelog-claims geverifieerd tegen de daadwerkelijke
gegenereerde bestanden** (niet alleen tegen `generate.py`): VvE-schoonmaak
title/meta/content/FAQ's/link naar Helmond, Helmond-verrijking, de 7
verwijderde wees-bestanden, de 3 nieuwe redirects — allemaal correct
aanwezig, geen andere inconsistenties gevonden.

**Volledige technische validatie na correctie:** 0 kapotte links, 0
ontbrekende afbeeldingen, 0 ontbrekende canonicals, 0 dubbele HTML-ID's, 0
dubbele titles/meta descriptions, sitemap komt exact overeen met de 37
werkelijke pagina's, alle JSON-LD geldig, `vercel.json` bevat 38 redirects
zonder duplicaten of ketens, elke pagina precies 1 H1, `robots.txt`
ongewijzigd correct. Wizard/pakketten-systeem ongewijzigd: nog steeds 11
stappen, 16 pakket-radio's, 15 pakket-CTA's 1-op-1 met de wizard-data. Geen
CSS/JS aangeraakt, dus `ASSET_VERSION` bewust ongewijzigd op 163 en overal
consistent. Alle 37 pagina's opnieuw gecontroleerd op console-fouten: 0
gevonden.

