// Test voor lib/calculator.js (Calculator v2, ronde 47 — "definitieve
// kalibratie") — losstaand van de e-mailopbouw/HTTP-handler (zie
// test_offerte_api.js voor die laag). Dekt de volledige testlijst uit
// briefpunt 17 voor zover die op de calculatiemotor zelf van toepassing is:
// tijd (alle opgegeven m²-waarden + grenswaarden 50/51,100/101,150/151,
// 250/251), rustig/gemiddeld/intensief, frequentieverschillen,
// sanitair/kantine zonder dubbele m²-telling, werkplaats
// geselecteerd/niet-geselecteerd, het autogarage-scenario, vervoer
// (kilometerfallback-verwijdering), en financieel (minimumprijs,
// adviesprijsbandbreedte, maandbedrag, materiaal, marge, max. ZZP-tarief,
// uitbesteedbaarheid, geen automatische betaalde reistijd).
"use strict";

const assert = require("assert");
const {
  CALC_DIENST_SLUGS,
  CONFIG,
  calculateOffer,
  roundStep,
  parseExactM2,
  parseRetourKm,
  curveWaarde,
  formatDuurBandbreedte,
  formatPrijsBandbreedte,
  formatMaandBandbreedte,
  bepaalBetrouwbaarheid,
  berekenMaxZzpTarief,
  bepaalUitbesteedbaarheid,
  euro,
} = require("./lib/calculator.js");

function basisCalc(overrides) {
  return Object.assign(
    {
      oppervlakte: "Klein",
      frequentie: "Wekelijks",
      vervuiling: "Normale kantoor-/bedrijfsvervuiling",
      gebruiksintensiteit: "Gemiddeld",
      ruimtes: ["ruimte_kantoor"],
      ruimteOverig: false,
      aantalLocaties: "1",
      meerderePerWeekAantal: "",
      retourKm: "",
    },
    overrides || {}
  );
}

function basisPayload(calcOverrides, payloadOverrides) {
  return Object.assign(
    {
      klanttype: "Bedrijf",
      dienstSlug: "periodiek-zakelijk",
      calc: basisCalc(calcOverrides),
    },
    payloadOverrides || {}
  );
}

console.log("=== Test 1: particuliere aanvraag -> altijd null (geen interne sectie) ===");
{
  assert.strictEqual(calculateOffer(null), null);
  assert.strictEqual(calculateOffer({ klanttype: "Particulier", dienstSlug: "periodiek-zakelijk", calc: basisCalc() }), null);
  console.log("OK.");
}

console.log("\n=== Test 2: dienst buiten CALC_DIENST_SLUGS -> status niet_beschikbaar, nooit een bedrag ===");
{
  ["glasbewassing-zakelijk", "gevelreiniging", "industriele-schoonmaak", "opleveringsschoonmaak"].forEach((slug) => {
    const r = calculateOffer(basisPayload({}, { dienstSlug: slug }));
    assert.deepStrictEqual(r, { status: "niet_beschikbaar" }, "dienst " + slug + " moet niet_beschikbaar zijn");
  });
  assert.ok(CALC_DIENST_SLUGS.indexOf("periodiek-zakelijk") !== -1);
  assert.ok(CALC_DIENST_SLUGS.indexOf("kantoorreiniging") !== -1);
  console.log("OK: niet-calculeerbare diensten leveren nooit een verzonnen bedrag op.");
}

console.log('\n=== Test 3: onbekende oppervlakte ("Weet ik niet") -> onvoldoende_info, geen bedrag ===');
{
  const r = calculateOffer(basisPayload({ oppervlakte: "Weet ik niet" }));
  assert.strictEqual(r.status, "onvoldoende_info");
  assert.ok(r.redenen.some((x) => x.includes("oppervlakte")));
  assert.ok(!("adviesprijsTekst" in r));
  console.log("Redenen:", r.redenen);
  console.log("OK.");
}

console.log("\n=== Test 3b: ontbrekende vervuiling/frequentie -> onvoldoende_info met juiste redenen ===");
{
  const r1 = calculateOffer(basisPayload({ vervuiling: "" }));
  assert.strictEqual(r1.status, "onvoldoende_info");
  assert.ok(r1.redenen.some((x) => x.includes("vervuilingsgraad")));

  const r2 = calculateOffer(basisPayload({ frequentie: "" }));
  assert.strictEqual(r2.status, "onvoldoende_info");
  assert.ok(r2.redenen.some((x) => x.includes("frequentie")));
  console.log("OK.");
}

console.log("\n=== Test 4: curveWaarde() -- vlak onder het eerste breekpunt, lineair ertussen, extrapolatie erna ===");
{
  const bp = [
    [0, 45],
    [50, 60],
    [100, 75],
  ];
  assert.strictEqual(curveWaarde(0, bp), 45);
  assert.strictEqual(curveWaarde(-10, bp), 45, "onder het eerste breekpunt blijft de curve vlak");
  assert.strictEqual(curveWaarde(25, bp), 45 + 0.5 * 15);
  assert.strictEqual(curveWaarde(50, bp), 60);
  assert.strictEqual(curveWaarde(75, bp), 67.5);
  // Extrapolatie voorbij het laatste breekpunt: zelfde helling als het
  // laatste segment (100-50 -> 75-60, helling 0.3/m²).
  assert.ok(Math.abs(curveWaarde(150, bp) - (75 + 0.3 * 50)) < 1e-9);
  console.log("OK: curveWaarde() interpoleert lineair en extrapoleert met de laatste helling.");
}

console.log("\n=== Test 5: oppervlaktecategorieën -> oplopende, PLAUSIBELE tijdsbandbreedte (structurele fix t.o.v. ronde 46) ===");
{
  const uitkomsten = ["Klein", "Middel", "Groot", "Zeer groot"].map((cat) => {
    const r = calculateOffer(basisPayload({ oppervlakte: cat }));
    assert.strictEqual(r.status, "ok");
    return { cat, min: r.totaalMinutenMin, max: r.totaalMinutenMax };
  });
  for (let i = 1; i < uitkomsten.length; i++) {
    assert.ok(uitkomsten[i].min > uitkomsten[i - 1].min, uitkomsten[i].cat + " moet meer tijd kosten dan " + uitkomsten[i - 1].cat);
    assert.ok(uitkomsten[i].max > uitkomsten[i - 1].max);
  }
  // Klein (referentie 35 m², Gemiddeld/Normaal-curve, geen exact m²) moet
  // dicht bij de opgegeven "t/m 50 m²: 45-60 min"-startnorm liggen.
  const klein = uitkomsten[0];
  assert.ok(klein.min >= 35 && klein.max <= 75, "Klein-categorie moet in de buurt van de opgegeven 45-60 min-startnorm liggen, niet extreem afwijken");
  console.log(uitkomsten.map((u) => u.cat + ": " + Math.round(u.min) + "-" + Math.round(u.max) + " min").join(" | "));
  console.log("OK: tijdsbandbreedte loopt logisch op met de oppervlaktecategorie en blijft plausibel.");
}

console.log('\n=== Test 5b: "Zeer groot" zonder exact m² -> Laag + locatieopname (briefpunt 4: geen harde eindprijs zonder nadere beoordeling) ===');
{
  const r = calculateOffer(basisPayload({ oppervlakte: "Zeer groot" }));
  assert.strictEqual(r.betrouwbaarheid, "Laag");
  assert.strictEqual(r.locatieopnameAanbevolen, true);
  console.log("Factoren:", r.betrouwbaarheidFactoren);
  console.log("OK.");
}

console.log("\n=== Test 6: exact m² krijgt voorrang op categorie, en verhoogt de betrouwbaarheid ===");
{
  const zonderExact = calculateOffer(basisPayload({ oppervlakte: "Middel" }));
  const metExact = calculateOffer(basisPayload({ oppervlakte: "Middel", oppervlakteExactM2: "85" }));
  assert.strictEqual(zonderExact.gebruikteM2, 100);
  assert.strictEqual(metExact.gebruikteM2, 85);
  assert.notStrictEqual(zonderExact.gebruikteM2, metExact.gebruikteM2, "exact m² (85) wijkt bewust af van het categorie-referentiepunt in deze test");
  assert.strictEqual(zonderExact.exactM2Bekend, false);
  assert.strictEqual(metExact.exactM2Bekend, true);
  assert.strictEqual(zonderExact.betrouwbaarheid, "Middel");
  assert.strictEqual(metExact.betrouwbaarheid, "Hoog");
  console.log("Zonder exact m²: " + zonderExact.gebruikteM2 + "m² -> " + zonderExact.betrouwbaarheid);
  console.log("Met exact m² (85): " + metExact.gebruikteM2 + "m² -> " + metExact.betrouwbaarheid);
  console.log("OK: exact m² heeft voorrang en verhoogt de betrouwbaarheid.");
}

console.log("\n=== Test 6b: exact m² geeft een SMALLERE bandbreedte dan alleen een categorie (briefpunt 10: verfijning) ===");
{
  const zonderExact = calculateOffer(basisPayload({ oppervlakte: "Klein" }));
  const metExact = calculateOffer(basisPayload({ oppervlakte: "Klein", oppervlakteExactM2: "35" }));
  const breedteZonder = zonderExact.totaalMinutenMax - zonderExact.totaalMinutenMin;
  const breedteMet = metExact.totaalMinutenMax - metExact.totaalMinutenMin;
  assert.ok(breedteMet < breedteZonder, "een exact m² moet een nauwkeurigere (smallere) bandbreedte geven dan alleen een categorie");
  console.log("Zonder exact m²: " + zonderExact.tijdsbandbreedteTekst + " | Met exact m² (35): " + metExact.tijdsbandbreedteTekst);
  console.log("OK.");
}

console.log("\n=== Test 6c: onrealistische exact-m²-invoer wordt genegeerd (nooit blindelings gebruikt) ===");
{
  assert.strictEqual(parseExactM2("0"), null);
  assert.strictEqual(parseExactM2("-5"), null);
  assert.strictEqual(parseExactM2("25000"), null);
  assert.strictEqual(parseExactM2(""), null);
  assert.strictEqual(parseExactM2(null), null);
  assert.strictEqual(parseExactM2("ong. 45"), 45);
  assert.strictEqual(parseExactM2("45,5"), 45.5);
  assert.strictEqual(parseExactM2("45.5"), 45.5);
  const r = calculateOffer(basisPayload({ oppervlakte: "Klein", oppervlakteExactM2: "-5" }));
  assert.strictEqual(r.exactM2Bekend, false, "een negatieve/onrealistische m²-invoer mag nooit als 'exact bekend' gelden");
  console.log("OK: parseExactM2() filtert onrealistische invoer, komma/punt worden beide begrepen.");
}

console.log("\n=== Test 7: grenswaardetests 50/51, 100/101, 150/151, 250/251 m² -- geen vreemde sprongen ===");
{
  const grenzen = [
    [50, 51],
    [100, 101],
    [150, 151],
    [250, 251],
  ];
  grenzen.forEach(([lo, hi]) => {
    const rLo = calculateOffer(basisPayload({ oppervlakteExactM2: String(lo) }));
    const rHi = calculateOffer(basisPayload({ oppervlakteExactM2: String(hi) }));
    const verschilPunt = Math.abs((rHi.totaalMinutenMin + rHi.totaalMinutenMax) / 2 - (rLo.totaalMinutenMin + rLo.totaalMinutenMax) / 2);
    assert.ok(verschilPunt < 5, "de puntschatting mag rond " + lo + "/" + hi + " m² niet met meer dan een paar minuten springen (was: " + verschilPunt.toFixed(2) + ")");
    console.log(lo + "m²: " + rLo.tijdsbandbreedteTekst + " | " + hi + "m²: " + rHi.tijdsbandbreedteTekst);
  });
  console.log("OK: geen vreemde sprongen op de bandgrenzen.");
}

console.log("\n=== Test 7b: 55 m² hoeft niet hetzelfde te worden berekend als 145 m² (beide onder “Middel”) ===");
{
  const r55 = calculateOffer(basisPayload({ oppervlakte: "Middel", oppervlakteExactM2: "55" }));
  const r145 = calculateOffer(basisPayload({ oppervlakte: "Middel", oppervlakteExactM2: "145" }));
  assert.notStrictEqual(r55.tijdsbandbreedteTekst, r145.tijdsbandbreedteTekst);
  assert.ok(r145.totaalMinutenMax > r55.totaalMinutenMax);
  console.log("55m²: " + r55.tijdsbandbreedteTekst + " | 145m²: " + r145.tijdsbandbreedteTekst);
  console.log("OK: exacte m² zorgt voor verfijning binnen dezelfde categorie.");
}

console.log("\n=== Test 8: tijd voor 75/100/125/150/200/300 m² (Normaal, Gemiddeld) -- oplopend en plausibel ===");
{
  const waarden = [75, 100, 125, 150, 200, 300];
  const uitkomsten = waarden.map((m2) => {
    const r = calculateOffer(basisPayload({ oppervlakteExactM2: String(m2) }));
    return { m2, tekst: r.tijdsbandbreedteTekst, calct: r.calculatietijdTekst, betrouwbaarheid: r.betrouwbaarheid };
  });
  for (let i = 1; i < uitkomsten.length; i++) {
    const rPrev = calculateOffer(basisPayload({ oppervlakteExactM2: String(waarden[i - 1]) }));
    const rCur = calculateOffer(basisPayload({ oppervlakteExactM2: String(waarden[i]) }));
    assert.ok(rCur.totaalMinutenMax >= rPrev.totaalMinutenMax, waarden[i] + "m² mag niet minder tijd opleveren dan " + waarden[i - 1] + "m²");
  }
  // 300 m² (> 250) moet altijd een verlaagde betrouwbaarheid geven.
  const r300 = calculateOffer(basisPayload({ oppervlakteExactM2: "300" }));
  assert.notStrictEqual(r300.betrouwbaarheid, "Hoog");
  uitkomsten.forEach((u) => console.log(u.m2 + "m²: " + u.tekst + " (calculatietijd " + u.calct + ", betrouwbaarheid " + u.betrouwbaarheid + ")"));
  console.log("OK.");
}

console.log("\n=== Test 9: gebruiksintensiteit (rustig/gemiddeld/intensief) beïnvloedt de tijd, en ontbreken verlaagt betrouwbaarheid ===");
{
  const rustig = calculateOffer(basisPayload({ gebruiksintensiteit: "Rustig" }));
  const gemiddeld = calculateOffer(basisPayload({ gebruiksintensiteit: "Gemiddeld" }));
  const intensief = calculateOffer(basisPayload({ gebruiksintensiteit: "Intensief" }));
  assert.ok(rustig.totaalMinutenMax < gemiddeld.totaalMinutenMax);
  assert.ok(intensief.totaalMinutenMax > gemiddeld.totaalMinutenMax);
  console.log("Rustig: " + Math.round(rustig.totaalMinutenMax) + " min | Gemiddeld: " + Math.round(gemiddeld.totaalMinutenMax) + " min | Intensief: " + Math.round(intensief.totaalMinutenMax) + " min");

  // Rustig mag nooit extreem laag worden (briefpunt 5): praktische bodem.
  assert.ok(rustig.totaalMinutenMin >= CONFIG.TIME_MODEL.RUSTIG_MINIMUM_MINUTEN - 1e-6, "Rustig-gebruik mag nooit onder de praktische bodem zakken");

  const zonderIntensiteitCalc = basisCalc();
  delete zonderIntensiteitCalc.gebruiksintensiteit;
  const zonderIntensiteit = calculateOffer({ klanttype: "Bedrijf", dienstSlug: "periodiek-zakelijk", calc: zonderIntensiteitCalc });
  assert.strictEqual(zonderIntensiteit.intensiteitLabel, "Gemiddeld (verondersteld)");
  assert.strictEqual(zonderIntensiteit.betrouwbaarheid, "Middel");
  assert.ok(zonderIntensiteit.betrouwbaarheidFactoren.some((f) => f.includes("intensiteit")));
  assert.strictEqual(zonderIntensiteit.totaalMinutenMax, gemiddeld.totaalMinutenMax);
  console.log("OK: intensiteit beïnvloedt de tijd via tabelkeuze (geen vermenigvuldigende factor meer); ontbrekende invoer valt terug op “Gemiddeld” én verlaagt de betrouwbaarheid.");
}

console.log("\n=== Test 10: reguliere vs bijzondere vervuiling -- gematigde correcties, geen dubbele bestraffing ===");
{
  const normaal = calculateOffer(basisPayload({ vervuiling: "Normale kantoor-/bedrijfsvervuiling", oppervlakteExactM2: "35" }));
  const enige = calculateOffer(basisPayload({ vervuiling: "Enige extra vervuiling", oppervlakteExactM2: "35" }));
  const boven = calculateOffer(basisPayload({ vervuiling: "Bovengemiddelde vervuiling", oppervlakteExactM2: "35" }));
  const anders = calculateOffer(basisPayload({ vervuiling: "Anders / toelichting", oppervlakteExactM2: "35" }));
  assert.ok(normaal.totaalMinutenMax < enige.totaalMinutenMax);
  assert.ok(enige.totaalMinutenMax < boven.totaalMinutenMax);
  // "Anders / toelichting" krijgt bewust GEEN agressieve automatische
  // vermenigvuldiging (briefpunt 7) -- de tijd zelf blijft dus gelijk aan
  // "Normaal", het is de betrouwbaarheid/het advies dat verandert.
  assert.strictEqual(anders.totaalMinutenMax, normaal.totaalMinutenMax, '"Anders / toelichting" mag de tijd zelf niet automatisch opblazen');
  assert.strictEqual(normaal.betrouwbaarheid, "Hoog");
  assert.strictEqual(boven.betrouwbaarheid, "Middel");
  assert.strictEqual(anders.betrouwbaarheid, "Laag");
  assert.strictEqual(anders.locatieopnameAanbevolen, true);
  assert.strictEqual(anders.maxZzpTariefTekst, null, "bij Laag betrouwbaarheid mag nooit een ZZP-tarief getoond worden");
  // Bovengemiddeld mag een merkbare, maar GEMATIGDE (niet extreme) opslag geven.
  const opslagPercentage = boven.totaalMinutenMax / normaal.totaalMinutenMax - 1;
  assert.ok(opslagPercentage > 0.05 && opslagPercentage < 0.30, "bovengemiddelde vervuiling moet een gematigde opslag geven (5-30%), niet extreem: kreeg " + (opslagPercentage * 100).toFixed(1) + "%");
  console.log("OK: vervuilingsniveaus geven gematigde, niet-gestapelde correcties; “Anders / toelichting” blaast de tijd nooit automatisch op maar verlaagt wel de betrouwbaarheid.");
}

console.log("\n=== Test 11 (AUTOGARAGESCENARIO, briefpunt 8): kantoor+kantine, ≤50m², intensief, wekelijks, werkplaats NIET geselecteerd ===");
{
  const garageNormaal = calculateOffer(
    basisPayload({
      oppervlakte: "Klein",
      frequentie: "Wekelijks",
      vervuiling: "Normale kantoor-/bedrijfsvervuiling",
      gebruiksintensiteit: "Intensief",
      ruimtes: ["ruimte_kantoor", "ruimte_kantine"], // NIET ruimte_werkplaats
    })
  );
  assert.strictEqual(garageNormaal.status, "ok");
  console.log("Normale vervuiling  -> tijd:", garageNormaal.tijdsbandbreedteTekst, "| calculatietijd:", garageNormaal.calculatietijdTekst);

  // KERNEIS (briefpunt 8, expliciete slottoets): mag niet opnieuw
  // 65-140 minuten / 137 calculatieminuten worden -- en al helemaal niet
  // richting 2+ uur (120+ min) schieten.
  assert.ok(garageNormaal.calculatietijdMinuten < 120, "garagescenario (normale vervuiling) mag nooit richting 2+ uur schieten -- kreeg " + garageNormaal.calculatietijdMinuten.toFixed(1) + " min");
  assert.ok(garageNormaal.totaalMinutenMax < 120, "bovengrens van de bandbreedte moet ruim onder 2 uur blijven");

  const garageBoven = calculateOffer(
    basisPayload({
      oppervlakte: "Klein",
      frequentie: "Wekelijks",
      vervuiling: "Bovengemiddelde vervuiling",
      gebruiksintensiteit: "Intensief",
      ruimtes: ["ruimte_kantoor", "ruimte_kantine"],
    })
  );
  console.log("Bovengem. vervuiling -> tijd:", garageBoven.tijdsbandbreedteTekst, "| calculatietijd:", garageBoven.calculatietijdTekst);
  // DE expliciete slottoets uit de brief: nooit meer 65-140 min / 137
  // calculatieminuten, en zeker nooit 2+ uur (120+ minuten).
  assert.ok(garageBoven.calculatietijdMinuten < 120, "garagescenario (bovengemiddelde vervuiling) mag nooit richting 2+ uur schieten -- kreeg " + garageBoven.calculatietijdMinuten.toFixed(1) + " min (ronde 46 gaf hier 137 min)");
  assert.ok(garageBoven.totaalMinutenMax <= 110, "bovengrens moet duidelijk onder de oude 140-minutengrens blijven");
  assert.ok(garageBoven.calculatietijdMinuten > garageNormaal.calculatietijdMinuten, "bovengemiddelde vervuiling moet wél meer tijd geven dan normale vervuiling, alleen niet extreem");

  // Betrouwbaarheid: maximaal Middel voor dit scenario (briefpunt 8).
  assert.notStrictEqual(garageNormaal.betrouwbaarheid, "Hoog");
  assert.notStrictEqual(garageBoven.betrouwbaarheid, "Hoog");

  // De werkplaats zelf mag NOOIT stilzwijgend meegerekend worden.
  const zonderWerkplaats = calculateOffer(
    basisPayload({ oppervlakte: "Klein", frequentie: "Wekelijks", vervuiling: "Normale kantoor-/bedrijfsvervuiling", gebruiksintensiteit: "Gemiddeld", ruimtes: ["ruimte_kantoor", "ruimte_kantine"] })
  );
  const metWerkplaatsErbij = calculateOffer(
    basisPayload({ oppervlakte: "Klein", frequentie: "Wekelijks", vervuiling: "Normale kantoor-/bedrijfsvervuiling", gebruiksintensiteit: "Gemiddeld", ruimtes: ["ruimte_kantoor", "ruimte_kantine", "ruimte_werkplaats"] })
  );
  assert.ok(zonderWerkplaats.totaalMinutenMax < metWerkplaatsErbij.totaalMinutenMax, "het niet-selecteren van de werkplaats moet ook daadwerkelijk minder tijd opleveren dan wel-selecteren");
  console.log("Zonder werkplaats:", zonderWerkplaats.tijdsbandbreedteTekst, "| Met werkplaats:", metWerkplaatsErbij.tijdsbandbreedteTekst);

  assert.ok(garageNormaal.adviesprijsTekst.startsWith("€"));
  assert.ok(garageNormaal.maandbedragTekst && garageNormaal.maandbedragTekst.startsWith("€"));
  console.log("OK: garagescenario levert een realistische, plausibele bandbreedte op -- geen cumulatieve overcalculatie meer.");
}

console.log("\n=== Test 11b: garagescenario met “Anders / toelichting” (bijv. olie/vet/zware werkplaatsvervuiling) -> Laag + locatieopname, GEEN kunstmatig enorme tijd ===");
{
  const garageAnders = calculateOffer(
    basisPayload({
      oppervlakte: "Klein",
      frequentie: "Wekelijks",
      vervuiling: "Anders / toelichting",
      gebruiksintensiteit: "Intensief",
      ruimtes: ["ruimte_kantoor", "ruimte_kantine"],
    })
  );
  assert.strictEqual(garageAnders.betrouwbaarheid, "Laag");
  assert.strictEqual(garageAnders.locatieopnameAanbevolen, true);
  assert.ok(garageAnders.calculatietijdMinuten < 120, "ook bij 'Anders / toelichting' mag de tijd nooit kunstmatig enorm worden");
  console.log("Tijd:", garageAnders.tijdsbandbreedteTekst, "| Betrouwbaarheid:", garageAnders.betrouwbaarheid);
  console.log("OK: bijzondere vervuiling geeft locatieopname aanbevolen, geen kunstmatig enorme automatische tijd.");
}

console.log("\n=== Test 12: sanitair/kantine geven een KLEINE correctie, kantoor/gangen/entree GEEN dubbele m²-telling ===");
{
  const alleenKantoor = calculateOffer(basisPayload({ ruimtes: ["ruimte_kantoor"] }));
  const kantoorPlusGangenEntree = calculateOffer(basisPayload({ ruimtes: ["ruimte_kantoor", "ruimte_gangen", "ruimte_entree"] }));
  assert.strictEqual(alleenKantoor.totaalMinutenMax, kantoorPlusGangenEntree.totaalMinutenMax, "kantoor/gangen/entree zitten al in de m²-basistijd en mogen dus geen extra tijd toevoegen (voorkomt dubbel tellen)");

  const metKantine = calculateOffer(basisPayload({ ruimtes: ["ruimte_kantoor", "ruimte_kantine"] }));
  const metSanitair = calculateOffer(basisPayload({ ruimtes: ["ruimte_kantoor", "ruimte_toiletten"] }));
  assert.ok(metKantine.totaalMinutenMax > alleenKantoor.totaalMinutenMax, "kantine moet een kleine, meetbare correctie geven");
  assert.ok(metSanitair.totaalMinutenMax > alleenKantoor.totaalMinutenMax, "sanitair moet een kleine, meetbare correctie geven");
  // "Klein" (beperkt): correctie mag niet meer dan ~15 minuten zijn voor één ruimte.
  assert.ok(metKantine.totaalMinutenMax - alleenKantoor.totaalMinutenMax < 15, "één kantine mag niet tientallen minuten bovenop een al volledige basistijd zetten");
  console.log("Alleen kantoor: " + alleenKantoor.tijdsbandbreedteTekst + " | + gangen/entree: " + kantoorPlusGangenEntree.tijdsbandbreedteTekst + " | + kantine: " + metKantine.tijdsbandbreedteTekst + " | + sanitair: " + metSanitair.tijdsbandbreedteTekst);
  console.log("OK: geen dubbele m²-telling voor reguliere ruimtes, kleine correctie voor arbeidsintensieve ruimtes.");
}

console.log("\n=== Test 13: frequentie -- gematigde correcties, Wekelijks = referentiepunt (0%) ===");
{
  const wekelijks = calculateOffer(basisPayload({ frequentie: "Wekelijks" }));
  assert.strictEqual(wekelijks.visitsPerMonth, CONFIG.WEEKS_PER_MONTH);
  assert.notStrictEqual(wekelijks.visitsPerMonth, 4, "sanity: 52/12 != 4");

  const maandelijks = calculateOffer(basisPayload({ frequentie: "Maandelijks" }));
  assert.ok(maandelijks.totaalMinutenMax > wekelijks.totaalMinutenMax, "maandelijks moet duidelijk intensiever zijn dan wekelijks");
  const opslag = maandelijks.totaalMinutenMax / wekelijks.totaalMinutenMax - 1;
  assert.ok(opslag < 0.35, "frequentiecorrectie moet gematigd blijven, geen extreme vermenigvuldiging: kreeg " + (opslag * 100).toFixed(1) + "%");

  const tweeKeer = calculateOffer(basisPayload({ frequentie: "Meerdere keren per week", meerderePerWeekAantal: "2" }));
  assert.strictEqual(tweeKeer.visitsPerMonth, 2 * CONFIG.WEEKS_PER_MONTH);
  assert.strictEqual(tweeKeer.frequentieLabel, "2× per week");
  assert.strictEqual(tweeKeer.meerdereKerenPerWeekOnvolledig, false);
  assert.ok(tweeKeer.totaalMinutenMax < wekelijks.totaalMinutenMax, "meerdere keren per week moet per bezoek iets efficiënter zijn dan wekelijks");

  const dagelijks = calculateOffer(basisPayload({ frequentie: "Meerdere keren per week", meerderePerWeekAantal: "5" }));
  assert.ok(dagelijks.totaalMinutenMax < tweeKeer.totaalMinutenMax, "zeer frequent (5x/week) moet nog iets efficiënter zijn dan 2x/week");
  // Essentiële taken mogen nooit verdwijnen: praktische bodem blijft gelden.
  assert.ok(dagelijks.totaalMinutenMin >= CONFIG.TIME_MODEL.ABSOLUTE_MINIMUM_MINUTEN - 1e-6);

  const zonderAantal = calculateOffer(basisPayload({ frequentie: "Meerdere keren per week", meerderePerWeekAantal: "" }));
  assert.strictEqual(zonderAantal.status, "ok", 'ontbrekend aantal bij "Meerdere keren per week" mag de HELE schatting niet blokkeren');
  assert.strictEqual(zonderAantal.visitsPerMonth, null);
  assert.strictEqual(zonderAantal.maandbedragTekst, null);
  assert.strictEqual(zonderAantal.meerdereKerenPerWeekOnvolledig, true);
  assert.ok(zonderAantal.adviesprijsTekst.startsWith("€"), "per-bezoek-schatting moet nog steeds beschikbaar zijn");
  // Geen onverdiende korting zonder bekend aantal.
  assert.strictEqual(zonderAantal.totaalMinutenMax, wekelijks.totaalMinutenMax, "zonder bekend aantal per week mag er geen (onverdiende) efficiëntiekorting worden toegepast");

  const eenmalig = calculateOffer(basisPayload({ frequentie: "Eenmalig" }));
  assert.strictEqual(eenmalig.visitsPerMonth, null);
  assert.strictEqual(eenmalig.maandbedragTekst, null);
  assert.ok(eenmalig.adviesprijsTekst.startsWith("€"), "eenmalige opdracht krijgt nog steeds een per-bezoek-schatting, alleen geen maandbedrag");

  console.log("Wekelijks: " + wekelijks.tijdsbandbreedteTekst + " | Maandelijks: " + maandelijks.tijdsbandbreedteTekst + " | 2x/week: " + tweeKeer.tijdsbandbreedteTekst + " | 5x/week: " + dagelijks.tijdsbandbreedteTekst);
  console.log("OK: frequentiecorrecties zijn gematigd en essentiële taken verdwijnen nooit.");
}

console.log("\n=== Test 14: materiaalberekening volgt de oppervlaktecategorie-bandbreedte (ongewijzigd) ===");
{
  ["Klein", "Middel", "Groot", "Zeer groot"].forEach((cat) => {
    const r = calculateOffer(basisPayload({ oppervlakte: cat }));
    const verwacht = CONFIG.MATERIAL_COST_PER_VISIT_BY_OPPERVLAKTE_EXCL_BTW[cat];
    assert.strictEqual(r.materiaalkosten, verwacht.max, cat + ": materiaalkosten moeten de (conservatieve) bovenzijde van de bandbreedte gebruiken");
    assert.strictEqual(r.materiaalkostenTekst, euro(verwacht.min) + "–" + euro(verwacht.max));
  });
  console.log("OK: materiaalkosten volgen de geconfigureerde bandbreedte per categorie, conservatief (bovenzijde) toegepast op de kostprijs.");
}

console.log("\n=== Test 15 (BELANGRIJKE CORRECTIE, briefpunt 11): onbekende afstand -> NOOIT een fictieve 20 km, €0 voertuigkosten ===");
{
  assert.strictEqual(CONFIG.DEFAULT_ROUND_TRIP_KM, undefined, "de kilometerfallback (DEFAULT_ROUND_TRIP_KM) moet volledig verwijderd zijn uit CONFIG");
  const r = calculateOffer(basisPayload({ retourKm: "" }));
  assert.strictEqual(r.km, null, "zonder opgegeven afstand mag km nooit een verzonnen getal zijn");
  assert.strictEqual(r.voertuigkosten, 0, "zonder bekende afstand moeten de voertuigkosten €0 zijn in de voorlopige kostprijs");
  assert.strictEqual(r.vervoerBekend, false);
  assert.strictEqual(r.vervoerNogTeBepalen, true);
  console.log("Onbekende afstand -> km:", r.km, "| voertuigkosten:", euro(r.voertuigkosten), "| vervoerNogTeBepalen:", r.vervoerNogTeBepalen);
  console.log("OK: geen fictieve 20 km meer, expliciet 'nog te bepalen'.");
}

console.log("\n=== Test 15b: onbekende afstand verlaagt de betrouwbaarheid van de SCHOONMAAKTIJD niet ===");
{
  const zonderVervoer = calculateOffer(basisPayload({ retourKm: "" }));
  const metVervoer = calculateOffer(basisPayload({ retourKm: "15" }));
  assert.strictEqual(zonderVervoer.betrouwbaarheid, metVervoer.betrouwbaarheid, "een ontbrekende afstand is een aparte, commerciële onzekerheid -- geen reden om de tijdsbetrouwbaarheid te verlagen");
  console.log("OK.");
}

console.log("\n=== Test 15c: expliciete retourafstand -> juiste km x €0,35, alleen bekende kosten meegenomen ===");
{
  const r = calculateOffer(basisPayload({ retourKm: "18" }));
  assert.strictEqual(r.km, 18);
  assert.ok(Math.abs(r.voertuigkosten - 18 * CONFIG.VEHICLE_COST_PER_KM_EXCL_BTW) < 1e-9);
  assert.strictEqual(r.vervoerBekend, true);
  assert.strictEqual(r.vervoerNogTeBepalen, false);

  const verwachteArbeid = (r.calculatietijdMinuten / 60) * CONFIG.ZZP_REFERENTIETARIEF_PER_UUR_EXCL_BTW;
  const verwachteKostprijs = verwachteArbeid + r.materiaalkosten + r.voertuigkosten;
  assert.ok(Math.abs(r.kostprijsPerBezoek - verwachteKostprijs) < 1e-6, "kostprijs moet exact arbeid + materiaal + (bekende) voertuigkosten zijn, niets extra's");

  // Onrealistische/negatieve invoer wordt genegeerd (telt als onbekend).
  assert.strictEqual(parseRetourKm("-5"), null);
  assert.strictEqual(parseRetourKm("0"), null);
  assert.strictEqual(parseRetourKm(""), null);
  assert.strictEqual(parseRetourKm("18,5"), 18.5);
  const rNegatief = calculateOffer(basisPayload({ retourKm: "-5" }));
  assert.strictEqual(rNegatief.vervoerBekend, false, "een onzinnige afstand mag nooit als bekend gelden -- 'verzin nooit kilometers'");
  console.log("18 km -> voertuigkosten:", euro(r.voertuigkosten));
  console.log("OK: alleen een daadwerkelijk opgegeven, geldige afstand telt mee.");
}

console.log("\n=== Test 16: betaalde reistijd telt NIET automatisch mee als kostenpost ===");
{
  assert.strictEqual(CONFIG.TRAVEL_TIME_IS_PAID_LABOR, false, "briefpunt 12: reistijd mag nooit automatisch als kostenpost gelden");
  const r = calculateOffer(basisPayload({ retourKm: "10" }));
  const verwachteArbeid = (r.calculatietijdMinuten / 60) * CONFIG.ZZP_REFERENTIETARIEF_PER_UUR_EXCL_BTW;
  const verwachteKostprijs = verwachteArbeid + r.materiaalkosten + r.voertuigkosten;
  assert.ok(Math.abs(r.kostprijsPerBezoek - verwachteKostprijs) < 1e-6);
  console.log("OK: kostprijs bevat geen automatische reistijd-arbeidskosten.");
}

console.log("\n=== Test 17: minimumprijs beschermt tegen te lage bedragen bij een kunstmatig hoog minimum ===");
{
  const origMin = CONFIG.MIN_PRICE_PER_VISIT_EXCL_BTW;
  CONFIG.MIN_PRICE_PER_VISIT_EXCL_BTW = 500; // ruim boven elke normale kostprijs
  try {
    const rHoog = calculateOffer(basisPayload({ oppervlakte: "Klein", ruimtes: [] }));
    assert.strictEqual(rHoog.minimumToegepast, true);
    assert.ok(rHoog.prijsOnderzijdeExclBtw >= 500);
    assert.strictEqual(rHoog.minimumGezondePrijsExclBtw, rHoog.prijsOnderzijdeExclBtw, "minimum gezonde prijs moet altijd gelijk zijn aan de ondergrens van de adviesprijsbandbreedte");
  } finally {
    CONFIG.MIN_PRICE_PER_VISIT_EXCL_BTW = origMin;
  }
  console.log("OK: MIN_PRICE_PER_VISIT_EXCL_BTW werkt als bodem, en 'minimum gezonde prijs' blijft altijd consistent met de ondergrens van de bandbreedte.");
}

console.log("\n=== Test 18: adviesprijsbandbreedte -- ondergrens < bovengrens, beide naar boven afgerond, nooit schijnprecisie ===");
{
  for (let i = 0; i < 20; i++) {
    const lo = 50 + i * 3.37;
    const hi = lo + 1 + i * 0.6;
    const [loR, hiR] = (() => {
      const text = formatPrijsBandbreedte(lo, hi);
      const m = text.match(/€(\d+)–€(\d+)/);
      return [parseInt(m[1], 10), parseInt(m[2], 10)];
    })();
    assert.ok(loR % CONFIG.PRICE_ROUND_STEP_EUR === 0);
    assert.ok(hiR % CONFIG.PRICE_ROUND_STEP_EUR === 0);
    assert.ok(loR >= lo, "ondergrens mag NOOIT naar beneden afgerond worden (marge-vloer)");
    assert.ok(hiR > loR);
  }
  const r = calculateOffer(basisPayload());
  const m = r.adviesprijsTekst.match(/€(\d+)–€(\d+)/);
  assert.ok(m, "adviesprijsTekst moet het formaat €X–€Y hebben");
  assert.ok(parseInt(m[2], 10) > parseInt(m[1], 10));
  assert.strictEqual(r.prijsOnderzijdeExclBtw, r.minimumGezondePrijsExclBtw);
  console.log("Voorbeeld adviesprijs:", r.adviesprijsTekst, "| minimum gezonde prijs:", euro(r.minimumGezondePrijsExclBtw));
  console.log("OK.");
}

console.log("\n=== Test 19: maandbedrag -- consistent met de al-afgeronde per-bezoek-prijzen ===");
{
  const r = calculateOffer(basisPayload({ frequentie: "Wekelijks" }));
  assert.ok(r.maandbedragTekst);
  const m = r.maandbedragTekst.match(/€(\d+)–€(\d+)/);
  const loMaand = parseInt(m[1], 10);
  const hiMaand = parseInt(m[2], 10);
  const verwachtLoMaand = roundStep(r.prijsOnderzijdeExclBtw * r.visitsPerMonth, CONFIG.MONTH_ROUND_STEP_EUR, "up");
  let verwachtHiMaand = roundStep(r.prijsBovenzijdeExclBtw * r.visitsPerMonth, CONFIG.MONTH_ROUND_STEP_EUR, "up");
  if (verwachtHiMaand <= verwachtLoMaand) verwachtHiMaand = verwachtLoMaand + CONFIG.MONTH_ROUND_STEP_EUR;
  assert.strictEqual(loMaand, verwachtLoMaand);
  assert.strictEqual(hiMaand, verwachtHiMaand);
  console.log("Per bezoek:", r.adviesprijsTekst, "-> per maand (" + r.frequentieLabel + "):", r.maandbedragTekst);
  console.log("OK.");
}

console.log("\n=== Test 20 (briefpunt 14): max. verantwoord ZZP-tarief + Uitbesteedbaarheid-classificatie ===");
{
  const betrouwbaar = calculateOffer(basisPayload({ oppervlakte: "Middel", oppervlakteExactM2: "100", gebruiksintensiteit: "Gemiddeld", vervuiling: "Normale kantoor-/bedrijfsvervuiling" }));
  assert.strictEqual(betrouwbaar.betrouwbaarheid, "Hoog");
  assert.ok(betrouwbaar.maxZzpTarief != null);
  assert.ok(betrouwbaar.maxZzpTarief > 0);
  assert.strictEqual(betrouwbaar.referentieZzpTarief, CONFIG.ZZP_REFERENTIETARIEF_PER_UUR_EXCL_BTW);
  assert.strictEqual(betrouwbaar.referentieZzpTariefTekst, euro(CONFIG.ZZP_REFERENTIETARIEF_PER_UUR_EXCL_BTW) + "/u");
  // Wiskundige eigenschap (gedocumenteerd in lib/calculator.js): zolang de
  // adviesprijs-ondergrens niet door de absolute bodemprijs omhoog is
  // geduwd, is het max. ZZP-tarief per constructie nooit HOGER dan het
  // referentietarief.
  assert.ok(betrouwbaar.maxZzpTarief <= CONFIG.ZZP_REFERENTIETARIEF_PER_UUR_EXCL_BTW + 1e-9, "het verantwoorde ZZP-tarief mag NOOIT boven het eigen referentietarief uitkomen (tenzij de absolute bodemprijs de prijs omhoog duwt)");
  assert.ok(["Goed uitbesteedbaar", "Krap uitbesteedbaar", "Niet gezond uitbesteedbaar"].indexOf(betrouwbaar.uitbesteedbaarheid) !== -1);

  const verwacht = berekenMaxZzpTarief({ prijsOnderzijdeExclBtw: null, calculatietijdUren: 1, materiaalkosten: 0, voertuigkosten: 0 });
  assert.strictEqual(verwacht, null, "sanity: berekenMaxZzpTarief met prijsOnderzijdeExclBtw=null mag nooit crashen");

  const onbetrouwbaar = calculateOffer(basisPayload({ vervuiling: "Anders / toelichting" }));
  assert.strictEqual(onbetrouwbaar.betrouwbaarheid, "Laag");
  assert.strictEqual(onbetrouwbaar.maxZzpTarief, null, "bij Laag betrouwbaarheid mag NOOIT een ZZP-tarief getoond worden");
  assert.strictEqual(onbetrouwbaar.maxZzpTariefTekst, null);
  assert.strictEqual(onbetrouwbaar.uitbesteedbaarheid, null);

  // Uitbesteedbaarheid moet daadwerkelijk KUNNEN variëren: een kleine
  // opdracht die tegen de absolute bodemprijs (€45) aanloopt, heeft
  // aantoonbaar meer ruimte per uur dan het pure margeniveau -> "Goed".
  const kleineOpdracht = calculateOffer(
    basisPayload({ oppervlakte: "Klein", oppervlakteExactM2: "20", gebruiksintensiteit: "Rustig", frequentie: "Meerdere keren per week", meerderePerWeekAantal: "5" })
  );
  assert.ok(kleineOpdracht.minimumToegepast, "sanity: dit scenario moet de absolute bodemprijs raken");
  assert.strictEqual(kleineOpdracht.uitbesteedbaarheid, "Goed uitbesteedbaar", "een opdracht tegen de bodemprijs moet 'Goed uitbesteedbaar' worden geclassificeerd");
  assert.ok(kleineOpdracht.maxZzpTarief > CONFIG.ZZP_REFERENTIETARIEF_PER_UUR_EXCL_BTW, "bij de bodemprijs moet er daadwerkelijk MEER ruimte zijn dan het referentietarief");

  // bepaalUitbesteedbaarheid() direct getest.
  assert.strictEqual(bepaalUitbesteedbaarheid(null, 32.5), "Niet gezond uitbesteedbaar");
  assert.strictEqual(bepaalUitbesteedbaarheid(35, 32.5), "Goed uitbesteedbaar");
  assert.strictEqual(bepaalUitbesteedbaarheid(32.5, 32.5), "Krap uitbesteedbaar");
  assert.strictEqual(bepaalUitbesteedbaarheid(25, 32.5), "Niet gezond uitbesteedbaar");

  console.log("Betrouwbaar scenario -> referentie:", betrouwbaar.referentieZzpTariefTekst, "| max:", betrouwbaar.maxZzpTariefTekst, "| uitbesteedbaarheid:", betrouwbaar.uitbesteedbaarheid);
  console.log("Kleine opdracht (bodemprijs) -> max:", kleineOpdracht.maxZzpTariefTekst, "| uitbesteedbaarheid:", kleineOpdracht.uitbesteedbaarheid);
  console.log("OK: uitbesteedbaarheid-classificatie is aanwezig en varieert daadwerkelijk zinvol.");
}

console.log("\n=== Test 21: betrouwbaarheid -- meerdere locaties telt ook mee als verlagende factor ===");
{
  const eenLocatie = calculateOffer(basisPayload({}, {}));
  const meerdereLocaties = calculateOffer(basisPayload({ aantalLocaties: "3" }));
  assert.strictEqual(eenLocatie.meerdereLocaties, false);
  assert.strictEqual(meerdereLocaties.meerdereLocaties, true);
  assert.strictEqual(meerdereLocaties.locatiesAantal, 3);
  assert.notStrictEqual(meerdereLocaties.betrouwbaarheid, "Hoog");
  console.log("OK: meerdere locaties verlaagt de betrouwbaarheid en wordt correct geteld.");
}

console.log("\n=== Test 22: bepaalBetrouwbaarheid() -- Laag wint altijd van Middel (niet andersom overschreven) ===");
{
  const r = bepaalBetrouwbaarheid({
    exactM2Bekend: false, // -> Middel
    gebruikteM2: 35,
    vervuiling: "Anders / toelichting", // -> Laag
    intensiteitBekend: false, // -> Middel
    intensiteitKey: "Gemiddeld",
    meerdereLocaties: true, // -> Middel
  });
  assert.strictEqual(r.niveau, "Laag", "zodra één factor Laag oplevert, mag een latere Middel-factor dat nooit meer overschrijven");
  assert.strictEqual(r.locatieopnameAanbevolen, true);
  console.log("Factoren:", r.factoren);
  console.log("OK.");
}

console.log("\n=== Test 23: roundStep() / formatDuurBandbreedte() -- basisgedrag van de gedeelde helpers ===");
{
  assert.strictEqual(roundStep(12, 5, "up"), 15);
  assert.strictEqual(roundStep(10, 5, "up"), 10);
  assert.strictEqual(roundStep(12, 5, "down"), 10);
  assert.strictEqual(roundStep(13, 5), 15);
  const tekst = formatDuurBandbreedte(62, 78);
  assert.ok(/^\d+–\d+ minuten$/.test(tekst), "formaat moet 'X–Y minuten' zijn: " + tekst);
  console.log(tekst);
  console.log("OK.");
}

console.log("\n=== Test 24: server-side robuustheid -- ontbrekende/rommelige calc-payload crasht nooit ===");
{
  assert.doesNotThrow(() => calculateOffer({ klanttype: "Bedrijf", dienstSlug: "periodiek-zakelijk" }));
  assert.doesNotThrow(() => calculateOffer({ klanttype: "Bedrijf", dienstSlug: "periodiek-zakelijk", calc: null }));
  assert.doesNotThrow(() => calculateOffer({ klanttype: "Bedrijf", dienstSlug: "periodiek-zakelijk", calc: {} }));
  const r = calculateOffer({ klanttype: "Bedrijf", dienstSlug: "periodiek-zakelijk", calc: {} });
  assert.strictEqual(r.status, "onvoldoende_info");
  console.log("OK: een lege/ontbrekende calc-payload leidt netjes tot onvoldoende_info, nooit tot een crash of een verzonnen bedrag.");
}

console.log("\nAlle test_calculator.js-tests geslaagd.");
