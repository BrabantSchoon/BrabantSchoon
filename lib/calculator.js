// lib/calculator.js
//
// Calculator v2 — interne commerciële beslissingshulp voor Brabantschoon.
// Uitsluitend server-side gebruikt (zie api/offerte-aanvraag.js). De klant
// ziet nooit iets uit dit bestand: geen kostprijs, geen marge, geen
// ZZP-tarief.
//
// RONDE 47 — "definitieve kalibratie". Dit is GEEN Calculator v3 en GEEN
// redesign: de architectuur (dit bestand, tijdsbandbreedtes, conservatieve
// calculatietijd, minimum gezonde prijs, adviesprijsbandbreedte, maandbedrag,
// betrouwbaarheid Hoog/Middel/Laag, locatieopname-advies, max. verantwoord
// ZZP-tarief, exacte-m²-veld, gebruiksintensiteit, frequentie, server-side
// berekening) blijft volledig behouden. Wat ronde 47 wél wijzigt: HOE de
// tijd wordt opgebouwd (structurele fix tegen cumulatieve overcalculatie —
// zie hieronder), en de kilometerfallback (verwijderd uit de prijs, zie
// CONFIG.VEHICLE_COST_PER_KM_EXCL_BTW-gebruik verderop). Zie CHANGELOG-47.md
// voor de volledige toelichting en testresultaten.
//
// WAT WAS HET PROBLEEM (ronde 46)?
// Ronde 46 stapelde meerdere behoudende factoren VERMENIGVULDIGEND op elkaar
// (m²-tijd × overhead × ruimtetoeslagen × intensiteitsfactor ×
// vervuilingsfactor × frequentiefactor) en gebruikte daarna standaard de
// BOVENGRENS van elke factor voor de calculatietijd. Voor het
// garage-testscenario (≤50 m², alleen kantoor+kantine, intensief gebruik)
// leverde dat 65–140 minuten op met 137 calculatieminuten — veel te ruim
// voor een startcalculatie.
//
// HOE IS DIT NU STRUCTUREEL OPGELOST?
// Oppervlakte is de PRIMAIRE tijdsbasis (briefpunt 3). Een puntschatting
// (PE = "point estimate") wordt bepaald met een vloeiende, stuksgewijs
// lineaire curve die door de door Brabantschoon opgegeven ranges loopt (zie
// CURVE_NORMAAL_M2_MINUTEN / CURVE_INTENSIEF_M2_MINUTEN hieronder — deze
// curven geven ONGEVEER de gevraagde ranges terug, zie CHANGELOG-47.md voor
// de exacte testuitkomsten). Ruimtes die AL in de reguliere m²-basistijd
// zitten (kantoor, gangen, entree) geven GEEN extra minuten meer — dat zou
// dubbel tellen zijn. Alleen aantoonbaar arbeidsintensieve onderdelen
// (sanitair, kantine/pantry, kleedruimte, werkplaats, vergaderruimte) geven
// nog een KLEINE, ADDITIEVE correctie (in minuten, niet in een
// vermenigvuldigingsfactor). Vervuiling en frequentie zijn vervolgens
// GEMATIGDE percentagecorrecties op die ene puntschatting — niet nog een
// laag vermenigvuldigende factoren op een al opgeblazen tijdsbandbreedte.
// Pas HELEMAAL aan het einde wordt er één bandbreedte (min–max) om de
// puntschatting gelegd, die de resterende praktische onzekerheid weergeeft
// (smaller wanneer een exact m² is opgegeven, breder wanneer alleen een
// categorie is gekozen). Dit voorkomt precies de "cumulatieve
// overcalculatie" die in ronde 46 optrad.
//
// ================================================================
// ZEER BELANGRIJK — dit zijn STARTNORMEN, geen door Brabantschoon
// bevestigde waarheden. Elke parameter hieronder die "TE KALIBREREN" of
// "TE BEVESTIGEN" draagt, is een bewuste, verdedigbare eerste aanname —
// géén verborgen aanname. Zodra er echte Brabantschoon-opdrachten zijn
// (geschatte tijd vs. werkelijke tijd), moeten deze waarden hier worden
// bijgewerkt — dit is precies waarom ze allemaal centraal, op één plek,
// staan in plaats van verspreid door de code.
// ================================================================
"use strict";

// Dienst-slugs waarvoor Calculator v2 een betrouwbaar tijdmodel heeft.
// Moet in sync blijven met de kopie in js/main.js (client kan dit bestand
// niet direct meelezen zonder build-stap) en met data-requires-dienst op
// wizardstap 9 in generate.py.
const CALC_DIENST_SLUGS = ["periodiek-zakelijk", "kantoorreiniging"];

// =================================================================
// CENTRALE CONFIGURATIE — Calculator v2
// =================================================================
const CONFIG = {
  TIME_MODEL: {
    // ---------------------------------------------------------------
    // Puntschattingscurven (briefpunt 4): oppervlakte -> minuten.
    // Elk punt [m², minuten] is een breekpunt; ertussenin wordt lineair
    // geïnterpoleerd, voorbij het laatste breekpunt wordt de helling van
    // het laatste segment doorgetrokken (zie curveWaarde()). Deze curve IS
    // de formule — er wordt niet eerst een vaste categorietijd berekend om
    // er vervolgens factoren overheen te stapelen (briefpunt 4, expliciete
    // eis). De breekpunten zijn rechtstreeks afgeleid van de
    // Brabantschoon-startnormen uit de brief:
    //   Normaal:   t/m 50 m²: 45–60 min · 51–100: 60–75 · 101–150: 75–105
    //              · 151–250: 105–150 (deze ranges sluiten exact op elkaar
    //              aan: 60=60, 75=75, 105=105 — vandaar dat elk breekpunt
    //              hieronder één enkele waarde heeft in plaats van een
    //              aparte min/max-curve).
    //   Intensief: t/m 50 m²: 60–75 · 51–100: 75–90 · 101–150: 90–120 ·
    //              151–250: 135–180. LET OP: de brief zelf sluit hier NIET
    //              perfect aan (101–150 eindigt op 120, 151–250 begint op
    //              135 — een sprong van 15 min bij exact 150/151 m²). Om
    //              een "vreemde sprong" op de grenswaarde 150/151 te
    //              voorkomen (briefpunt 10, expliciete eis) is dit hier
    //              gladgestreken: het breekpunt op 150 m² gebruikt 120 (de
    //              bovengrens van de 101–150-band) en de 151–250-band
    //              (135–180) wordt zo geïnterpreteerd als een vloeiend
    //              vervolg vanaf 120 naar 180 bij 250 m². Dit is een bewuste
    //              afronding op een inconsistentie in de brondata, hier
    //              expliciet gedocumenteerd (zie ook CHANGELOG-47.md).
    //   251–500 m²: geen harde getallen opgegeven ("geen harde automatische
    //              eindprijs zonder nadere beoordeling" / "lage/middelmatige
    //              betrouwbaarheid en locatieopname overwegen") — hier
    //              geëxtrapoleerd met dezelfde helling als het laatste
    //              gegeven segment (150->250 m²), NIET hardcoded. Boven
    //              250 m² wordt de betrouwbaarheid altijd verlaagd (zie
    //              bepaalBetrouwbaarheid) — de extrapolatie is dus altijd
    //              vergezeld van een expliciete waarschuwing, nooit een
    //              stille aanname.
    // Onder het eerste breekpunt (0 m²) is de curve vlak (curveWaarde()
    // geeft de waarde van het eerste breekpunt terug) — een zeer kleine
    // locatie zakt dus nooit onder de "t/m 50 m²"-ondergrens.
    // TE KALIBREREN.
    CURVE_NORMAAL_M2_MINUTEN: [
      [0, 45],
      [50, 60],
      [100, 75],
      [150, 105],
      [250, 150],
    ],
    CURVE_INTENSIEF_M2_MINUTEN: [
      [0, 60],
      [50, 75],
      [100, 90],
      [150, 120],
      [250, 180],
    ],

    // Rustig gebruik (briefpunt 5): NIET een aparte curve, maar een
    // gematigde korting op de Normaal-curve ("ongeveer 10% minder tijd dan
    // Normaal"), met een praktische ondergrens zodat een kleine opdracht
    // nooit theoretisch naar bijv. 20 minuten kan zakken terwijl gewone
    // taken (afval, oppervlaktes, vloer, eventueel pantry/sanitair)
    // gewoon uitgevoerd moeten worden. TE KALIBREREN.
    RUSTIG_FACTOR: 0.90,
    RUSTIG_MINIMUM_MINUTEN: 35,

    // Absolute praktische bodem voor de UITEINDELIJKE puntschatting (na
    // ruimte-/vervuilings-/frequentiecorrecties), als laatste vangnet —
    // wordt in de praktijk vrijwel nooit geraakt (Rustig heeft al zijn
    // eigen hogere bodem hierboven), maar voorkomt dat een ongelukkige
    // combinatie van kortingen (bijv. Rustig + zeer frequent) alsnog een
    // onrealistisch lage tijd oplevert.
    ABSOLUTE_MINIMUM_MINUTEN: 30,

    // ---------------------------------------------------------------
    // Ruimtecorrecties (briefpunt 6): KLEINE, ADDITIEVE correcties in
    // minuten, uitsluitend voor aantoonbaar arbeidsintensieve onderdelen.
    // Kantoorruimte, gangen/verkeersruimte en entree zitten AL in de
    // reguliere m²-basistijd hierboven — die geven daarom bewust 0 minuten
    // extra (voorkomt dubbel tellen, briefpunt 3/6). Vergaderruimte is een
    // reguliere ruimte en krijgt daarom hooguit een kleine correctie.
    // Sanitair/kantine/kleedruimte/werkplaats zijn de onderdelen die
    // aantoonbaar meer tijd kosten (schrobben, afwassen/aanrecht,
    // olie/vet), maar de toegepaste waarde (het gemiddelde van min/max) is
    // fors kleiner dan in ronde 46 om te voorkomen dat bijv. één kantine
    // alsnog 20 minuten bovenop een al volledige basistijd zet. min/max
    // blijven hier gedocumenteerd (i.p.v. één los getal) zodat toekomstige
    // kalibratie de bandbreedte kan blijven zien; toegepast wordt het
    // gemiddelde. TE KALIBREREN.
    ROOM_TASK_MINUTES: {
      ruimte_kantoor: { min: 0, max: 0 },
      ruimte_gangen: { min: 0, max: 0 },
      ruimte_entree: { min: 0, max: 0 },
      ruimte_vergaderruimte: { min: 0, max: 5 },
      ruimte_kantine: { min: 3, max: 8 },
      ruimte_toiletten: { min: 4, max: 8 },
      ruimte_kleedruimte: { min: 2, max: 6 },
      // Werkplaats telt uitsluitend mee wanneer DEZE RUIMTE ZELF is
      // aangevinkt (briefpunt 8: "de werkplaats zelf mag nooit worden
      // meegerekend als deze niet geselecteerd is") — de garagevloer zelf
      // wordt dus nooit automatisch meegerekend, alleen wanneer een
      // klant expliciet aangeeft dat de werkplaats ZELF ook wordt
      // schoongemaakt.
      ruimte_werkplaats: { min: 15, max: 25 },
      ruimte_overig: { min: 3, max: 9 },
    },

    // ---------------------------------------------------------------
    // Vervuilingscorrectie (briefpunt 7): een GEMATIGDE percentagecorrectie
    // op de puntschatting (basis + ruimtecorrecties), i.p.v. een aparte
    // vermenigvuldigende factor die samen met intensiteit een dubbele
    // bestraffing kon geven. "Anders / toelichting" (bijv. een garage waar
    // vuil vanuit de werkplaats meekomt) krijgt EXPLICIET GEEN agressieve
    // automatische vermenigvuldiging — in plaats daarvan verlaagt dit de
    // betrouwbaarheid en adviseert het een locatieopname (zie
    // bepaalBetrouwbaarheid). Het doel bij onzekerheid is nooit om
    // automatisch een enorm bedrag te produceren. TE KALIBREREN.
    VERVUILING_CORRECTIE: {
      "Normale kantoor-/bedrijfsvervuiling": 0,
      "Enige extra vervuiling": 0.075, // richtwaarde ongeveer +5 tot +10%
      "Bovengemiddelde vervuiling": 0.15, // richtwaarde ongeveer +10 tot +20%
      "Anders / toelichting": 0, // bewust GEEN automatische opslag, zie hierboven
    },

    // ---------------------------------------------------------------
    // Frequentiecorrectie (briefpunt 9): eveneens een GEMATIGDE
    // percentagecorrectie t.o.v. "Wekelijks" (= referentiepunt, 0%) i.p.v.
    // een brede vermenigvuldigende bandbreedte. "Meerdere keren per week"
    // wordt hieronder als functie van het opgegeven aantal berekend (zie
    // frequentieCorrectie()) zodat dagelijks/zeer frequent gebruik "nog iets
    // efficiënter" is dan een enkele extra bezoek per week, maar essentiële
    // taken (afval/sanitair/oppervlaktes) nooit verdwijnen — vandaar een
    // bodem op de korting (max. -15%). TE KALIBREREN.
    FREQUENTIE_CORRECTIE: {
      "Wekelijks": 0, // referentiepunt (briefpunt 9)
      "Maandelijks": 0.20, // "duidelijk intensiever"
      "Eenmalig": 0.15, // geen opgebouwd ritme, meer onbekende factoren
      "In overleg": 0.08, // lichte marge voor onzekerheid
    },
    // "Meerdere keren per week" korting naar aantal bezoeken/week — zie
    // frequentieCorrectie(). Bodem op -15% zodat frequent schoonmaken nooit
    // onrealistisch snel wordt (essentiële taken blijven altijd nodig).
    FREQUENTIE_MEERDERE_PER_WEEK: {
      2: -0.05,
      3: -0.10,
      4: -0.10,
      5: -0.15, // en hoger
    },

    // ---------------------------------------------------------------
    // Bandbreedte (onzekerheidsmarge) om de uiteindelijke puntschatting
    // heen — dit is waar de getoonde "tijdsbandbreedteTekst" vandaan komt.
    // Kleiner wanneer een EXACT m² is opgegeven (nauwkeuriger basis, zie
    // briefpunt 10 "Exacte m² heeft voorrang op categorie"), breder
    // wanneer alleen een categorie is gekozen (meer onzekerheid over de
    // werkelijke omvang). TE KALIBREREN.
    SPREAD_MET_EXACT_M2: 0.08,
    SPREAD_ZONDER_EXACT_M2: 0.12,

    // Vanaf welke oppervlakte de betrouwbaarheid altijd wordt verlaagd
    // (komt overeen met de "251-500 m²"-grens uit de brief, briefpunt 4/8).
    M2_BOVENGRENS_BETROUWBAAR: 250,

    // Afronding van de getoonde tijdsbandbreedte, voor leesbaarheid.
    ROUND_MINUTES_STEP: 5,
  },

  // --- Kostenmodel (briefpunt 13) — allemaal TE BEVESTIGEN/TE KALIBREREN,
  // duidelijk gemarkeerde startconfiguratie, geen verborgen harde waarheid.
  // Ongewijzigd t.o.v. ronde 46, met UITZONDERING van de kilometerfallback
  // (DEFAULT_ROUND_TRIP_KM), die in ronde 47 volledig is VERWIJDERD — zie
  // de toelichting bij km/voertuigkosten in calculateOffer() hieronder.
  //
  // Referentie ZZP/inhuurtarief: wat het BEDRIJF een productief schoonmaakuur
  // kost om te laten uitvoeren (zzp'er inhuren of personeel in loondienst).
  ZZP_REFERENTIETARIEF_PER_UUR_EXCL_BTW: 32.5, // TE BEVESTIGEN (brief-opgave)

  // Interne voertuigkosten per kilometer (brandstof/afschrijving/onderhoud),
  // GEEN betaalde reistijd (zie hieronder) — dat is bewust apart gehouden.
  // Wordt ALLEEN toegepast wanneer een daadwerkelijke retourafstand bekend
  // is (zie calculateOffer) — nooit meer op een verzonnen/geschatte afstand.
  VEHICLE_COST_PER_KM_EXCL_BTW: 0.35, // TE BEVESTIGEN (brief-opgave)

  // Betaalde reistijd van een uitvoerder (zzp'er/personeel) is BEWUST géén
  // automatische kostenpost (briefpunt 12: Brabantschoon voert de eerste
  // opdrachten waarschijnlijk zelf uit, dus betaalde reistijd van een
  // toekomstige zzp'er mag niet automatisch in de kostprijs verschijnen).
  TRAVEL_TIME_IS_PAID_LABOR: false,

  // Middelen/materiaal per bezoek, afhankelijk van omvang. TE KALIBREREN.
  MATERIAL_COST_PER_VISIT_BY_OPPERVLAKTE_EXCL_BTW: {
    "Klein": { min: 3, max: 5 },
    "Middel": { min: 5, max: 8 },
    "Groot": { min: 8, max: 14 },
    "Zeer groot": { min: 14, max: 22 },
  },
  // Fallback wanneer de oppervlaktecategorie niet bekend genoeg is om een
  // materiaalkost aan te koppelen (zou in de praktijk nooit voorkomen omdat
  // dat pad al bij ONVOLDOENDE_INFO strandt, maar voorkomt een undefined-fout).
  DEFAULT_MATERIAL_COST_EXCL_BTW: { min: 3, max: 5 },

  // Gewenste marge (richting waarnaar de bovenzijde van de adviesprijs
  // streeft) en minimale gezonde marge (ondergrens/vloer van de
  // adviesprijs-bandbreedte).
  DESIRED_GROSS_MARGIN: 0.35, // TE BEVESTIGEN
  MINIMUM_GROSS_MARGIN: 0.20, // TE BEVESTIGEN
  // Absolute bodemprijs per bezoek, ongeacht marge — beschermt tegen
  // onrendabele hele kleine opdrachten (reistijd/opstart/administratie).
  MIN_PRICE_PER_VISIT_EXCL_BTW: 45, // TE BEVESTIGEN

  VAT_RATE_PERCENT: 21, // geen placeholder — geldend Nederlands btw-tarief
  WEEKS_PER_MONTH: 52 / 12, // geen placeholder — rekenkundig gegeven

  // Commerciële afronding: liever "€90–€95" dan "€92,37–€96,81".
  PRICE_ROUND_STEP_EUR: 5,
  MONTH_ROUND_STEP_EUR: 10,

  // Uitbesteedbaarheid-classificatie (briefpunt 14): drempels op de
  // verhouding tussen het berekende max. verantwoorde ZZP-tarief en het
  // referentietarief hierboven. Bewust eenvoudig gehouden (drie standen,
  // geen nieuw model) — zie bepaalUitbesteedbaarheid(). TE KALIBREREN.
  UITBESTEEDBAARHEID_GOED_RATIO: 1.05,
  UITBESTEEDBAARHEID_KRAP_RATIO: 0.90,
};

// =================================================================
// KLEINE HELPERS
// =================================================================
function roundStep(value, step, direction) {
  if (direction === "down") return Math.floor(value / step) * step;
  if (direction === "up") return Math.ceil(value / step) * step;
  return Math.round(value / step) * step;
}

function parseLeadingInt(str) {
  if (!str) return null;
  const m = String(str).match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
}

// Exact m² mag met een komma of punt zijn ingevoerd, en mag desnoods
// begeleidende tekst bevatten ("ong. 45") — we lezen alleen het eerste
// getal. Onrealistische invoer (0, negatief, absurd groot) wordt genegeerd
// (nooit blindelings gebruikt) zodat een tikfout niet stilzwijgend een
// compleet verkeerde tijdsinschatting oplevert.
function parseExactM2(raw) {
  if (raw == null) return null;
  const str = String(raw).trim().replace(",", ".");
  // Let op: het minteken hoort expliciet in de match, anders zou "-5"
  // alleen de "5" oppikken en zo per ongeluk als geldige (positieve) invoer
  // worden geaccepteerd -- juist bij een duidelijk onzinnige negatieve
  // invoer moet dit worden afgewezen, niet stilzwijgend het teken laten
  // vallen.
  const m = str.match(/-?\d+(\.\d+)?/);
  if (!m) return null;
  const n = parseFloat(m[0]);
  if (!Number.isFinite(n) || n <= 0 || n > 20000) return null;
  return n;
}

// Retourkilometers (briefpunt 11): optioneel veld, ZELFDE parse-voorzichtigheid
// als parseExactM2 -- een onbruikbare/negatieve invoer wordt genegeerd (dan
// telt de aanvraag als "afstand onbekend", nooit als "0 km" of een geraden
// getal). "Verzin nooit kilometers": bij twijfel is null (onbekend) altijd
// het juiste antwoord, nooit een geschatte waarde.
function parseRetourKm(raw) {
  if (raw == null) return null;
  const str = String(raw).trim().replace(",", ".");
  const m = str.match(/-?\d+(\.\d+)?/);
  if (!m) return null;
  const n = parseFloat(m[0]);
  if (!Number.isFinite(n) || n <= 0 || n > 1000) return null;
  return n;
}

function formatDuurBandbreedte(minMin, maxMin) {
  const step = CONFIG.TIME_MODEL.ROUND_MINUTES_STEP;
  const lo = roundStep(minMin, step, "down");
  const hi = Math.max(roundStep(maxMin, step, "up"), lo + step);
  return lo + "–" + hi + " minuten";
}

function euro(bedrag) {
  return "€" + bedrag.toFixed(2).replace(".", ",");
}

// Ondergrens wordt bewust naar BOVEN afgerond (nooit naar beneden) — het is
// een gezonde-marge-vloer, en afronden mag die vloer nooit verlagen. `lo`/`hi`
// zijn hier al de (ongeronde) prijs-per-bezoek-waarden op marge-niveau; wordt
// gebruikt voor zowel de per-bezoek- als de per-maand-tekst (met hun eigen
// afrondingsstap), zodat beide altijd consistent zijn met de apart getoonde
// "minimum gezonde prijs".
function rondPrijsbandbreedteAf(lo, hi, step) {
  const loR = roundStep(lo, step, "up");
  let hiR = roundStep(hi, step, "up");
  if (hiR <= loR) hiR = loR + step;
  return [loR, hiR];
}

function formatPrijsBandbreedte(lo, hi) {
  const [loR, hiR] = rondPrijsbandbreedteAf(lo, hi, CONFIG.PRICE_ROUND_STEP_EUR);
  return "€" + loR + "–€" + hiR;
}

function formatMaandBandbreedte(lo, hi) {
  const [loR, hiR] = rondPrijsbandbreedteAf(lo, hi, CONFIG.MONTH_ROUND_STEP_EUR);
  return "€" + loR + "–€" + hiR;
}

// =================================================================
// TIJDSCURVE (briefpunt 3/4) — oppervlakte als primaire, vloeiende
// tijdsbasis. `breakpoints` is een gesorteerde array van [m², minuten].
// Onder het eerste breekpunt: vlak (geeft de waarde van het eerste
// breekpunt terug). Voorbij het laatste breekpunt: extrapoleert met de
// helling van het laatste segment (nooit een harde afkap, maar ook nooit
// een hardcoded waarde voor grote oppervlaktes — zie M2_BOVENGRENS_BETROUWBAAR
// voor hoe dat gebied van betrouwbaarheidslabels wordt voorzien).
// =================================================================
function curveWaarde(m2, breakpoints) {
  const eerste = breakpoints[0];
  if (m2 <= eerste[0]) return eerste[1];
  for (let i = 1; i < breakpoints.length; i++) {
    const [m2a, va] = breakpoints[i - 1];
    const [m2b, vb] = breakpoints[i];
    if (m2 <= m2b) {
      const frac = (m2 - m2a) / (m2b - m2a);
      return va + frac * (vb - va);
    }
  }
  const n = breakpoints.length;
  const [m2a, va] = breakpoints[n - 2];
  const [m2b, vb] = breakpoints[n - 1];
  const helling = (vb - va) / (m2b - m2a);
  return vb + helling * (m2 - m2b);
}

// Frequentiecorrectie als percentage t.o.v. de puntschatting (briefpunt 9).
// "Meerdere keren per week" zonder (geldig) aantal krijgt bewust GEEN
// korting (0%) -- er is dan geen aantoonbare efficiëntiewinst bekend, dus
// wordt er ook niets onverdiend afgetrokken; het maandbedrag blijft in dat
// geval alsnog niet berekenbaar (zie meerdereKerenPerWeekOnvolledig).
function frequentieCorrectie(frequentie, meerderePerWeekAantal) {
  if (frequentie === "Meerdere keren per week") {
    const n = meerderePerWeekAantal;
    if (!Number.isFinite(n) || n < 2) return 0;
    const tabel = CONFIG.TIME_MODEL.FREQUENTIE_MEERDERE_PER_WEEK;
    if (n >= 5) return tabel[5];
    if (tabel[n] != null) return tabel[n];
    return tabel[5];
  }
  const c = CONFIG.TIME_MODEL.FREQUENTIE_CORRECTIE[frequentie];
  return c != null ? c : 0;
}

// =================================================================
// BETROUWBAARHEID
// =================================================================
const NIVEAU_RANG = { "Hoog": 3, "Middel": 2, "Laag": 1 };
function laagsteVan(a, b) {
  return NIVEAU_RANG[a] <= NIVEAU_RANG[b] ? a : b;
}

function bepaalBetrouwbaarheid({ exactM2Bekend, gebruikteM2, vervuiling, intensiteitBekend, intensiteitKey, meerdereLocaties }) {
  let niveau = "Hoog";
  const factoren = [];
  let locatieopnameAanbevolen = false;

  if (!exactM2Bekend) {
    niveau = laagsteVan(niveau, "Middel");
    factoren.push("exacte m² niet opgegeven (categorie-inschatting gebruikt)");
  }
  const bovengrens = CONFIG.TIME_MODEL.M2_BOVENGRENS_BETROUWBAAR;
  if (gebruikteM2 > bovengrens) {
    if (!exactM2Bekend) {
      // Briefpunt 4: "geen harde automatische eindprijs zonder nadere
      // beoordeling" wanneer boven 250 m² ZONDER exact m² -- dan is er
      // onvoldoende basis voor een indicatieve schatting.
      niveau = "Laag";
      locatieopnameAanbevolen = true;
      factoren.push("locatie groter dan " + bovengrens + " m² zonder exact m² opgegeven — geen harde automatische eindprijs, locatieopname aanbevolen");
    } else {
      niveau = laagsteVan(niveau, "Middel");
      factoren.push("locatie groter dan " + bovengrens + " m² — indicatieve schatting, lagere betrouwbaarheid");
    }
  }
  if (intensiteitKey === "Intensief" && gebruikteM2 > bovengrens) {
    // Briefpunt 4 (Intensief, 251-500 m²): "lage/middelmatige
    // betrouwbaarheid en locatieopname overwegen" -- expliciet altijd
    // overwegen bij deze combinatie, ook met een bekend exact m².
    locatieopnameAanbevolen = true;
    factoren.push("intensief gebruik bij een locatie groter dan " + bovengrens + " m² — locatieopname wordt aanbevolen");
  }
  if (!intensiteitBekend) {
    niveau = laagsteVan(niveau, "Middel");
    factoren.push("gebruiksintensiteit niet opgegeven (“Gemiddeld” verondersteld)");
  }
  if (vervuiling === "Bovengemiddelde vervuiling") {
    niveau = laagsteVan(niveau, "Middel");
    factoren.push("bovengemiddelde vervuiling opgegeven");
  }
  if (vervuiling === "Anders / toelichting") {
    niveau = "Laag";
    locatieopnameAanbevolen = true;
    factoren.push("bijzondere vervuiling/situatie opgegeven (eigen toelichting)");
  }
  if (meerdereLocaties) {
    niveau = laagsteVan(niveau, "Middel");
    factoren.push("aanvraag betreft meerdere locaties (calculatie is per locatie)");
  }
  return { niveau, factoren, locatieopnameAanbevolen };
}

// =================================================================
// MAXIMAAL VERANTWOORD ZZP-UURTARIEF (briefpunt 14)
// =================================================================
// Wat blijft er over voor uitvoering, gegeven de (behoudende, onderzijde-)
// adviesprijs, ALLE overige directe kosten die Brabantschoon daadwerkelijk
// draagt (materiaal + voertuig), en de ingestelde minimale gezonde marge
// voor Brabantschoon zelf? Dat beschikbare uitvoeringsbudget gedeeld door de
// conservatieve calculatie-uren is het maximaal verantwoorde ZZP-tarief.
// Gebruikt bewust de ONDERZIJDE van de adviesprijsbandbreedte (worst case
// omzet) zodat dit nooit een te optimistisch tarief voorspiegelt.
//
// Wiskundige opmerking (transparant gedocumenteerd, geen verborgen
// eigenschap): omdat de minimale marge in deze formule een percentage is
// van diezelfde prijsonderzijde, geldt -- wanneer de prijsonderzijde NIET
// door de absolute bodemprijs (MIN_PRICE_PER_VISIT_EXCL_BTW) omhoog is
// geduwd -- altijd exact: max. ZZP-tarief == ZZP_REFERENTIETARIEF_PER_UUR.
// Dat is geen berekeningsfout maar een directe, onvermijdelijke consequentie
// van deze (door de brief zelf beschreven) formule: de prijsonderzijde IS in
// dat geval per definitie precies gelijk aan kostprijs/(1-minimale marge),
// dus na aftrek van marge en overige kosten blijft er precies de
// arbeidskostenpost (calculatie-uren x referentietarief) over. Om dit
// desondanks commercieel informatief te houden, toont de interne e-mail
// ALTIJD ook de aparte "Uitbesteedbaarheid"-classificatie (zie
// bepaalUitbesteedbaarheid) -- díe classificatie varieert wél zinvol,
// vooral bij kleine opdrachten waar de absolute bodemprijs (€45) de
// prijsonderzijde omhoog duwt boven het pure margeniveau.
function berekenMaxZzpTarief({ prijsOnderzijdeExclBtw, calculatietijdUren, materiaalkosten, voertuigkosten }) {
  const brabantschoonMinimaleWinst = prijsOnderzijdeExclBtw * CONFIG.MINIMUM_GROSS_MARGIN;
  const beschikbaarVoorUitvoeringEnKosten = prijsOnderzijdeExclBtw - brabantschoonMinimaleWinst;
  const beschikbaarVoorUitvoering = beschikbaarVoorUitvoeringEnKosten - materiaalkosten - voertuigkosten;
  if (calculatietijdUren <= 0 || beschikbaarVoorUitvoering <= 0) return null;
  return beschikbaarVoorUitvoering / calculatietijdUren;
}

// Uitbesteedbaarheid-classificatie (briefpunt 14): eenvoudige, centrale
// driestandenclassificatie op basis van de werkelijke ruimte tussen het
// max. verantwoorde ZZP-tarief en het referentietarief. Bewust géén
// ingewikkeld nieuw model.
function bepaalUitbesteedbaarheid(maxZzpTarief, referentieTarief) {
  if (maxZzpTarief == null) return "Niet gezond uitbesteedbaar";
  const ratio = maxZzpTarief / referentieTarief;
  if (ratio >= CONFIG.UITBESTEEDBAARHEID_GOED_RATIO) return "Goed uitbesteedbaar";
  if (ratio >= CONFIG.UITBESTEEDBAARHEID_KRAP_RATIO) return "Krap uitbesteedbaar";
  return "Niet gezond uitbesteedbaar";
}

// =================================================================
// HOOFDFUNCTIE
// =================================================================
// Retourneert altijd één van drie vormen:
//   { status: "niet_beschikbaar" }                     -- dienst buiten CALC_DIENST_SLUGS (of particulier: null, zie hieronder)
//   { status: "onvoldoende_info", redenen: [...] }      -- te weinig basisinvoer voor ELKE schatting
//   { status: "ok", ...alle velden hieronder }          -- een (bandbreedte-)schatting kon gemaakt worden
// `null` (geen van bovenstaande) betekent: particuliere aanvraag, waarvoor
// nooit een interne-calculatie-sectie hoort (ongewijzigd).
function calculateOffer(payload) {
  if (!payload) return null;
  const type = payload.klanttype || "";
  const isZakelijk = type === "Bedrijf" || type === "VvE / organisatie";
  if (!isZakelijk) return null;

  if (CALC_DIENST_SLUGS.indexOf(payload.dienstSlug) === -1) {
    return { status: "niet_beschikbaar" };
  }

  const calc = payload.calc || {};
  const redenen = [];

  const oppervlakteCategorie = calc.oppervlakte || "";
  const REFERENTIE_M2 = { "Klein": 35, "Middel": 100, "Groot": 300, "Zeer groot": 600 };
  const referentieM2 = REFERENTIE_M2[oppervlakteCategorie];
  if (referentieM2 == null) redenen.push("oppervlakte onbekend of nog niet beoordeeld (“weet ik niet”)");

  const vervuiling = calc.vervuiling || "";
  const vervuilingCorrectie = CONFIG.TIME_MODEL.VERVUILING_CORRECTIE[vervuiling];
  if (vervuilingCorrectie == null) redenen.push("vervuilingsgraad niet opgegeven");

  const frequentie = calc.frequentie || "";
  const frequentieBekend =
    frequentie === "Wekelijks" || frequentie === "Maandelijks" || frequentie === "Eenmalig" ||
    frequentie === "In overleg" || frequentie === "Meerdere keren per week";
  if (!frequentieBekend) redenen.push("frequentie niet opgegeven");

  if (redenen.length > 0) {
    return { status: "onvoldoende_info", redenen };
  }

  // --- m²: exact (voorrang) of categorie-referentie (briefpunt 10) ---
  const exactM2 = parseExactM2(calc.oppervlakteExactM2);
  const exactM2Bekend = exactM2 != null;
  const gebruikteM2 = exactM2Bekend ? exactM2 : referentieM2;

  // --- gebruiksintensiteit: optioneel, default "Gemiddeld" ---
  const intensiteitRaw = calc.gebruiksintensiteit || "";
  const intensiteitBekend = intensiteitRaw === "Rustig" || intensiteitRaw === "Gemiddeld" || intensiteitRaw === "Intensief";
  const intensiteitKey = intensiteitBekend ? intensiteitRaw : "Gemiddeld";
  const intensiteitLabel = intensiteitBekend ? intensiteitRaw : "Gemiddeld (verondersteld)";

  // --- puntschatting op basis van oppervlakte (briefpunt 3/4): de
  // PRIMAIRE tijdsbasis. "Gemiddeld" en "Intensief" kiezen een andere
  // curve (tabelkeuze i.p.v. vermenigvuldigende factor — dit is de kern
  // van de structurele fix); "Rustig" vertrekt vanaf de Normaal-curve met
  // een gematigde korting en een praktische bodem (briefpunt 5).
  const curve = intensiteitKey === "Intensief"
    ? CONFIG.TIME_MODEL.CURVE_INTENSIEF_M2_MINUTEN
    : CONFIG.TIME_MODEL.CURVE_NORMAAL_M2_MINUTEN;
  let puntschatting = curveWaarde(gebruikteM2, curve);
  if (intensiteitKey === "Rustig") {
    puntschatting = Math.max(puntschatting * CONFIG.TIME_MODEL.RUSTIG_FACTOR, CONFIG.TIME_MODEL.RUSTIG_MINIMUM_MINUTEN);
  }

  // --- ruimtes: kleine, additieve correctie BOVENOP de m²-puntschatting,
  // uitsluitend voor aantoonbaar arbeidsintensieve onderdelen (briefpunt 6).
  // Kantoor/gangen/entree zitten al in de m²-basis en geven dus 0 minuten.
  let roomCorrectie = 0;
  (calc.ruimtes || []).forEach((rid) => {
    const r = CONFIG.TIME_MODEL.ROOM_TASK_MINUTES[rid];
    if (r) roomCorrectie += (r.min + r.max) / 2;
  });
  if (calc.ruimteOverig) {
    const r = CONFIG.TIME_MODEL.ROOM_TASK_MINUTES.ruimte_overig;
    roomCorrectie += (r.min + r.max) / 2;
  }
  puntschatting += roomCorrectie;

  // --- vervuiling: gematigde percentagecorrectie (briefpunt 7) ---
  puntschatting *= (1 + vervuilingCorrectie);

  // --- frequentie: bezoeken per maand + gematigde percentagecorrectie
  // (briefpunt 9) ---
  let visitsPerMonth = null;
  let frequentieLabel = frequentie;
  let meerdereKerenPerWeekOnvolledig = false;
  let meerderePerWeekAantal = null;
  if (frequentie === "Wekelijks") {
    visitsPerMonth = CONFIG.WEEKS_PER_MONTH;
  } else if (frequentie === "Maandelijks") {
    visitsPerMonth = 1;
  } else if (frequentie === "Meerdere keren per week") {
    const n = parseInt(calc.meerderePerWeekAantal, 10);
    if (Number.isFinite(n) && n >= 2) {
      meerderePerWeekAantal = n;
      visitsPerMonth = n * CONFIG.WEEKS_PER_MONTH;
      frequentieLabel = n + "× per week";
    } else {
      meerdereKerenPerWeekOnvolledig = true;
    }
  }
  // "Eenmalig"/"In overleg": per-bezoek-schatting blijft mogelijk (de
  // frequentiecorrectie hierboven is al toegepast), maar er is geen zinvol
  // "per maand"-bedrag -- visitsPerMonth blijft null, zie e-mailopbouw.
  puntschatting *= (1 + frequentieCorrectie(frequentie, meerderePerWeekAantal));

  // --- laatste vangnet: nooit onder de absolute praktische bodem (briefpunt 5) ---
  puntschatting = Math.max(puntschatting, CONFIG.TIME_MODEL.ABSOLUTE_MINIMUM_MINUTEN);

  // --- bandbreedte om de puntschatting heen (pas HELEMAAL aan het einde,
  // i.p.v. eerst een bandbreedte te berekenen en daar factoren overheen te
  // stapelen — dit is de kern van briefpunt 4's expliciete eis) ---
  const spread = exactM2Bekend
    ? CONFIG.TIME_MODEL.SPREAD_MET_EXACT_M2
    : CONFIG.TIME_MODEL.SPREAD_ZONDER_EXACT_M2;
  const totaalMinutenMin = puntschatting * (1 - spread);
  const totaalMinutenMax = puntschatting * (1 + spread);

  // Briefpunt 3: voor de FINANCIËLE calculatie de conservatieve (langste)
  // bovenzijde van de bandbreedte gebruiken — beschermt de marge tegen een
  // iets langere uitvoering dan verwacht. Dit blijft behouden uit ronde 46;
  // het verschil met ronde 46 is dat de bandbreedte zelf nu niet meer
  // structureel opgeblazen is, dus deze bovenzijde is nu een realistisch
  // getal (zie CHANGELOG-47.md voor de testresultaten).
  const calculatietijdMinuten = totaalMinutenMax;
  const calculatietijdUren = calculatietijdMinuten / 60;

  // --- kosten per bezoek ---
  const arbeidskosten = calculatietijdUren * CONFIG.ZZP_REFERENTIETARIEF_PER_UUR_EXCL_BTW;
  const materiaalRange = CONFIG.MATERIAL_COST_PER_VISIT_BY_OPPERVLAKTE_EXCL_BTW[oppervlakteCategorie] || CONFIG.DEFAULT_MATERIAL_COST_EXCL_BTW;
  // Conservatief: ook hier de bovenzijde voor de kostprijsbasis.
  const materiaalkosten = materiaalRange.max;

  // --- vervoer (briefpunt 11 — BELANGRIJKE CORRECTIE t.o.v. ronde 46) ---
  // Ronde 46 gebruikte standaard 20 km retour wanneer de echte afstand
  // onbekend was, en liet dat bedrag de kostprijs/verkoopprijs beïnvloeden.
  // Dat is hier volledig verwijderd: een onbekende afstand wordt NOOIT meer
  // behandeld alsof er daadwerkelijk is gereden. Alleen een expliciet
  // opgegeven retourafstand (calc.retourKm, het nieuwe optionele
  // wizardveld) telt mee, tegen de vaste km-kostprijs. Bij een onbekende
  // afstand: km=null, voertuigkosten=€0 in de voorlopige kostprijs, en
  // vervoerNogTeBepalen=true zodat de interne e-mail dit duidelijk als
  // "nog te bepalen" toont (zie api/offerte-aanvraag.js) — de
  // verkoopindicatie is dan expliciet EXCLUSIEF nog onbekende
  // vervoerskosten. Dit verlaagt bewust NIET de betrouwbaarheid van de
  // schoonmaaktijd zelf (dat is een ander soort onzekerheid) — het is een
  // ontbrekende commerciële kostenpost, geen tijdsinschattingsprobleem.
  const retourKm = parseRetourKm(calc.retourKm);
  const vervoerBekend = retourKm != null;
  const km = vervoerBekend ? retourKm : null;
  const voertuigkosten = vervoerBekend ? km * CONFIG.VEHICLE_COST_PER_KM_EXCL_BTW : 0;
  const vervoerNogTeBepalen = !vervoerBekend;

  // Betaalde reistijd telt bewust NIET automatisch mee als arbeidskosten
  // (briefpunt 12) -- alleen wanneer expliciet aangezet in CONFIG.
  const reistijdArbeidskosten = CONFIG.TRAVEL_TIME_IS_PAID_LABOR ? 0 : 0; // placeholder: bewust géén automatische aanname, zie CONFIG.TRAVEL_TIME_IS_PAID_LABOR

  const kostprijsPerBezoek = arbeidskosten + materiaalkosten + voertuigkosten + reistijdArbeidskosten;

  // --- adviesprijs-bandbreedte ---
  const prijsOnderzijdeRuw = Math.max(kostprijsPerBezoek / (1 - CONFIG.MINIMUM_GROSS_MARGIN), CONFIG.MIN_PRICE_PER_VISIT_EXCL_BTW);
  const prijsBovenzijdeRuw = Math.max(kostprijsPerBezoek / (1 - CONFIG.DESIRED_GROSS_MARGIN), prijsOnderzijdeRuw);
  const minimumToegepast = prijsOnderzijdeRuw > kostprijsPerBezoek / (1 - CONFIG.MINIMUM_GROSS_MARGIN) + 0.005;

  // Belangrijk: de ondergrens wordt ALTIJD naar BOVEN afgerond (nooit naar
  // beneden) — het is een gezonde-marge-vloer, dus afronden mag die vloer
  // nooit verlagen. "Minimum gezonde prijs" en de ondergrens van de
  // adviesprijs-bandbreedte zijn daarom bewust hetzelfde bedrag.
  const prijsOnderzijdeAfgerond = roundStep(prijsOnderzijdeRuw, CONFIG.PRICE_ROUND_STEP_EUR, "up");
  let prijsBovenzijdeAfgerond = roundStep(prijsBovenzijdeRuw, CONFIG.PRICE_ROUND_STEP_EUR, "up");
  if (prijsBovenzijdeAfgerond <= prijsOnderzijdeAfgerond) prijsBovenzijdeAfgerond = prijsOnderzijdeAfgerond + CONFIG.PRICE_ROUND_STEP_EUR;

  // Minimum gezonde prijs: hetzelfde bedrag als de ondergrens hierboven.
  const minimumGezondePrijs = prijsOnderzijdeAfgerond;

  // --- maandbedrag (alleen bij een bekend periodiek ritme) ---
  let maandbedragTekst = null;
  if (visitsPerMonth != null) {
    maandbedragTekst = formatMaandBandbreedte(prijsOnderzijdeAfgerond * visitsPerMonth, prijsBovenzijdeAfgerond * visitsPerMonth);
  } else if (meerdereKerenPerWeekOnvolledig) {
    maandbedragTekst = null; // expliciet niet berekenbaar, zie redenen/toelichting in de aanroeper
  }

  // --- betrouwbaarheid ---
  const locatiesAantal = parseLeadingInt(calc.aantalLocaties);
  const meerdereLocaties = !!(locatiesAantal && locatiesAantal > 1);
  const betrouwbaarheid = bepaalBetrouwbaarheid({
    exactM2Bekend,
    gebruikteM2,
    vervuiling,
    intensiteitBekend,
    intensiteitKey,
    meerdereLocaties,
  });
  if (meerdereKerenPerWeekOnvolledig) {
    betrouwbaarheid.factoren.push('exact aantal keer per week niet opgegeven bij "Meerdere keren per week" -- geen maandbedrag berekend');
  }

  // --- max. verantwoord ZZP-uurtarief + uitbesteedbaarheid (alleen tonen
  // bij voldoende betrouwbaarheid) ---
  let maxZzpTarief = null;
  let uitbesteedbaarheid = null;
  if (betrouwbaarheid.niveau !== "Laag") {
    maxZzpTarief = berekenMaxZzpTarief({
      prijsOnderzijdeExclBtw: prijsOnderzijdeRuw,
      calculatietijdUren,
      materiaalkosten,
      voertuigkosten,
    });
    uitbesteedbaarheid = bepaalUitbesteedbaarheid(maxZzpTarief, CONFIG.ZZP_REFERENTIETARIEF_PER_UUR_EXCL_BTW);
  }

  return {
    status: "ok",
    // tijd
    totaalMinutenMin,
    totaalMinutenMax,
    tijdsbandbreedteTekst: formatDuurBandbreedte(totaalMinutenMin, totaalMinutenMax),
    calculatietijdMinuten,
    calculatietijdTekst: Math.round(calculatietijdMinuten) + " min",
    exactM2Bekend,
    gebruikteM2,
    intensiteitLabel,
    // frequentie
    frequentieLabel,
    visitsPerMonth,
    meerdereKerenPerWeekOnvolledig,
    // kosten (intern, nooit naar de klant)
    kostprijsPerBezoek,
    materiaalkosten,
    materiaalkostenTekst: euro(materiaalRange.min) + "–" + euro(materiaalRange.max),
    km,
    voertuigkosten,
    vervoerBekend,
    vervoerNogTeBepalen,
    // prijs
    minimumGezondePrijsExclBtw: minimumGezondePrijs,
    adviesprijsTekst: "€" + prijsOnderzijdeAfgerond + "–€" + prijsBovenzijdeAfgerond,
    prijsOnderzijdeExclBtw: prijsOnderzijdeAfgerond,
    prijsBovenzijdeExclBtw: prijsBovenzijdeAfgerond,
    minimumToegepast,
    maandbedragTekst,
    // schaalbaarheid
    referentieZzpTarief: CONFIG.ZZP_REFERENTIETARIEF_PER_UUR_EXCL_BTW,
    referentieZzpTariefTekst: euro(CONFIG.ZZP_REFERENTIETARIEF_PER_UUR_EXCL_BTW) + "/u",
    maxZzpTarief,
    maxZzpTariefTekst: maxZzpTarief != null ? euro(maxZzpTarief) + "/u" : null,
    uitbesteedbaarheid,
    // betrouwbaarheid + advies
    betrouwbaarheid: betrouwbaarheid.niveau,
    betrouwbaarheidFactoren: betrouwbaarheid.factoren,
    locatieopnameAanbevolen: betrouwbaarheid.locatieopnameAanbevolen,
    // overig
    meerdereLocaties,
    locatiesAantal,
  };
}

module.exports = {
  CALC_DIENST_SLUGS,
  CONFIG,
  calculateOffer,
  // Helpers geëxporteerd t.b.v. onafhankelijke tests (test_calculator.js) en
  // hergebruik in de e-mailopbouw (api/offerte-aanvraag.js).
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
};
