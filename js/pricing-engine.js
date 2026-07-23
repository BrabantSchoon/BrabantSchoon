/**
 * BrabantSchoon - Prijsrekenengine
 * ----------------------------------
 * Volledig gescheiden van de interface (zie main.js voor de UI-koppeling).
 * Pas UITSLUITEND de waarden in PRICING_CONFIG aan om tarieven te wijzigen -
 * de rekenlogica daaronder hoeft daarvoor nooit aangeraakt te worden.
 *
 * BELANGRIJK: contractorHourlyRate is de interne inkoopprijs die BrabantSchoon
 * betaalt aan een ingehuurde zzp-schoonmaker. Dit bedrag wordt nergens in de
 * zichtbare pagina getoond - alleen de uiteindelijke klantprijs (als bandbreedte)
 * verschijnt op het scherm. De volledige interne uitsplitsing wordt automatisch
 * meegestuurd in de offerte-e-mail, zodat deze nergens in de HTML/JS van de
 * publieke pagina zelf terug te vinden is voor een bezoeker.
 */

const PRICING_CONFIG = {
  contractorHourlyRate: 30.00,      // interne kostprijs per uur (zzp-inhuur), NOOIT aan klant tonen
  materialCostPerHour: 2.50,        // materiaalkosten per gewerkt uur
  travelCostPerVisit: 12.50,        // reiskosten per bezoek
  companyOverheadPercentage: 8,     // bedrijfskosten, percentage over de kostprijs
  profitMarginPercentage: 20,       // winstmarge, percentage over kostprijs + overhead
  minimumVisitDuration: 1.5,        // minimale bezoekduur in uren
  minimumMonthlyPrice: 220,         // ondergrens voor de klantprijs per maand
  priceRangeSpreadPercentage: 8     // getoonde bandbreedte rondom de berekende prijs (marktconform, geen grote spreiding)
};

// Normtijden: minuten per 100 m², per pandtype. Gebaseerd op gangbare productiviteit
// in de zakelijke schoonmaakbranche (circa 150-220 m²/uur voor regulier onderhoud).
const NORM_TIMES_MINUTES_PER_100M2 = {
  office: 40,
  vve: 45,
  practice: 55,
  school: 50,
  retail: 45,
  warehouse: 30,
  other: 40
};

// Vervuilingsgraad: vermenigvuldigt de benodigde tijd. 'Normaal' is de standaardwaarde.
const SOILING_LEVEL_MULTIPLIER = {
  light: 0.85,
  normal: 1.0,
  heavy: 1.2
};

// Bezoeken per maand, per gekozen frequentie
const VISITS_PER_MONTH = {
  weekly1: 4,
  weekly2: 8,
  weekly3: 13,
  weekly5: 22,
  daily: 30
};

// Toeslagen voor extra diensten (percentage over de klantprijs)
const EXTRA_SERVICE_SURCHARGES_PERCENTAGE = {
  glasbewassing: 15,
  vloeronderhoud: 10,
  sanitair: 8,
  gevelreiniging: 20,
  tapijtreiniging: 12,
  desinfectie: 10,
  afvalbeheer: 5
};

/**
 * Zorgt dat een waarde altijd een geldig, eindig getal is. Anders: fallback.
 */
function safeNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Geeft een geadviseerde schoonmaakfrequentie op basis van pandtype en oppervlakte.
 * Dit is uitsluitend een advies - de bezoeker kan altijd zelf een andere frequentie kiezen.
 * De drempelwaarden zijn gebaseerd op gangbare praktijk in de zakelijke schoonmaakbranche
 * en kunnen hieronder eenvoudig aangepast worden.
 */
const FREQUENCY_RECOMMENDATION_RULES = {
  office: [
    { maxM2: 250, freqKey: "weekly2" },
    { maxM2: 750, freqKey: "weekly3" },
    { maxM2: 1500, freqKey: "weekly5" },
    { maxM2: Infinity, freqKey: "daily" }
  ],
  practice: [
    { maxM2: 200, freqKey: "weekly5" },
    { maxM2: Infinity, freqKey: "daily" }
  ],
  school: [
    { maxM2: 800, freqKey: "weekly5" },
    { maxM2: Infinity, freqKey: "daily" }
  ],
  retail: [
    { maxM2: 150, freqKey: "weekly2" },
    { maxM2: 500, freqKey: "weekly3" },
    { maxM2: Infinity, freqKey: "weekly5" }
  ],
  warehouse: [
    { maxM2: 500, freqKey: "weekly1" },
    { maxM2: 1500, freqKey: "weekly2" },
    { maxM2: Infinity, freqKey: "weekly3" }
  ],
  vve: [
    { maxM2: 500, freqKey: "weekly1" },
    { maxM2: Infinity, freqKey: "weekly2" }
  ],
  other: [
    { maxM2: Infinity, freqKey: "weekly2" }
  ]
};

const FREQUENCY_LABELS = {
  weekly1: "1x per week", weekly2: "2x per week", weekly3: "3x per week",
  weekly5: "5x per week", daily: "dagelijks"
};

function getRecommendedFrequency(propertyType, surfaceM2) {
  const rules = FREQUENCY_RECOMMENDATION_RULES[propertyType] || FREQUENCY_RECOMMENDATION_RULES.other;
  const m2 = safeNumber(surfaceM2, 250);
  const rule = rules.find(r => m2 <= r.maxM2) || rules[rules.length - 1];
  return {
    freqKey: rule.freqKey,
    label: FREQUENCY_LABELS[rule.freqKey],
    explanation: `Op basis van uw pandtype en oppervlakte adviseren wij ${FREQUENCY_LABELS[rule.freqKey]} schoonmaken voor een representatieve en hygi\u00ebnische werkomgeving. U kunt hier altijd van afwijken.`
  };
}

/**
 * Voert de volledige berekening uit.
 * @param {Object} input
 * @param {number} input.surfaceM2 - oppervlakte in m²
 * @param {string} input.propertyType - key uit NORM_TIMES_MINUTES_PER_100M2
 * @param {string} input.frequencyKey - key uit VISITS_PER_MONTH
 * @param {number} input.extraServicesSurchargePercentage - som van gekozen toeslagen
 * @returns {Object} interne uitsplitsing + klant-bandbreedte (nooit NaN, altijd geldige getallen)
 */
// Schaalvoordeel: grotere, structurele opdrachten zijn efficiënter in te plannen
// (minder relatieve impact van reistijd en vaste overhead per gewerkt uur), en
// krijgen daarom een korting op de opslag. Dit houdt het effectieve verkoopuurtarief
// voor kleine opdrachten iets hoger en voor grote opdrachten duidelijk lager,
// zoals gebruikelijk in de zakelijke schoonmaakmarkt.
function getVolumeDiscountFactor(hoursPerMonth) {
  if (hoursPerMonth <= 8) return 0.90;    // kleine opdrachten
  if (hoursPerMonth <= 20) return 0.85;   // kleine-tot-middelgrote opdrachten
  if (hoursPerMonth <= 45) return 0.86;   // gemiddelde zakelijke opdrachten
  return 0.89;                             // grote, structurele contracten
}

function calculatePricing(input) {
  // Validatie van alle invoer, met veilige standaardwaarden bij ontbrekende/ongeldige input
  const surfaceM2 = Math.max(1, safeNumber(input && input.surfaceM2, 250));
  const normTimeMinutesPer100m2 = safeNumber(
    NORM_TIMES_MINUTES_PER_100M2[input && input.propertyType],
    NORM_TIMES_MINUTES_PER_100M2.office
  );
  const soilingMultiplier = safeNumber(
    SOILING_LEVEL_MULTIPLIER[input && input.soilingLevel],
    SOILING_LEVEL_MULTIPLIER.normal
  );
  const visitsPerMonth = safeNumber(
    VISITS_PER_MONTH[input && input.frequencyKey],
    VISITS_PER_MONTH.weekly2
  );
  const extraServicesSurchargePercentage = safeNumber(input && input.extraServicesSurchargePercentage, 0);

  // 1. Geschatte schoonmaaktijd (inclusief vervuilingsgraad)
  const rawMinutesPerVisit = (surfaceM2 / 100) * normTimeMinutesPer100m2 * soilingMultiplier;
  const rawHoursPerVisit = rawMinutesPerVisit / 60;
  const estimatedLaborHoursPerVisit = Math.max(PRICING_CONFIG.minimumVisitDuration, rawHoursPerVisit);
  const estimatedLaborHoursPerMonth = estimatedLaborHoursPerVisit * visitsPerMonth;

  // 2. Kostencomponenten
  const laborCost = estimatedLaborHoursPerMonth * PRICING_CONFIG.contractorHourlyRate;
  const materialCost = estimatedLaborHoursPerMonth * PRICING_CONFIG.materialCostPerHour;
  const travelCost = PRICING_CONFIG.travelCostPerVisit * visitsPerMonth;
  const directCosts = laborCost + materialCost + travelCost;

  // 3. Bedrijfskosten (overhead) - onderdeel van de kostprijs, geen winst
  const overheadCost = directCosts * (PRICING_CONFIG.companyOverheadPercentage / 100);
  const totalCostPrice = directCosts + overheadCost;

  // 4. Winstmarge - pas hierna toegevoegd (percentage blijft ongewijzigd, zoals afgesproken)
  const profitMarginAmount = totalCostPrice * (PRICING_CONFIG.profitMarginPercentage / 100);
  let customerMonthlyPrice = totalCostPrice + profitMarginAmount;

  // 5. Extra diensten (toeslag op de klantprijs)
  const extraServicesAmount = customerMonthlyPrice * (extraServicesSurchargePercentage / 100);
  customerMonthlyPrice += extraServicesAmount;

  // 5b. Schaalvoordeel: een aparte, transparante correctie op de totaalprijs voor grotere
  // opdrachten. De basistarieven en -percentages hierboven blijven ongewijzigd; dit is
  // een losse stap die het effectieve verkoopuurtarief bij schaal omlaag brengt, zoals
  // gebruikelijk bij structurele zakelijke contracten.
  const volumeDiscountFactor = getVolumeDiscountFactor(estimatedLaborHoursPerMonth);
  const volumeDiscountAmount = customerMonthlyPrice * (1 - volumeDiscountFactor);
  customerMonthlyPrice *= volumeDiscountFactor;

  // 6. Ondergrens
  customerMonthlyPrice = Math.max(PRICING_CONFIG.minimumMonthlyPrice, customerMonthlyPrice);

  // 7. Bandbreedte voor de klant, afgerond op tientallen voor een geloofwaardig, professioneel bedrag
  // (geen "€861 - €1.052", wel "€860 - €1.050")
  const roundToTen = (n) => Math.round(n / 10) * 10;
  const spread = PRICING_CONFIG.priceRangeSpreadPercentage / 100;
  const customerPriceLow = roundToTen(customerMonthlyPrice * (1 - spread));
  const customerPriceHigh = roundToTen(customerMonthlyPrice * (1 + spread));

  // Laatste veiligheidscontrole: mocht er, ondanks alle validatie hierboven, toch ergens
  // een ongeldig getal ontstaan zijn, dan valt het resultaat terug op 0 in plaats van NaN.
  const finalize = (n) => safeNumber(n, 0);

  return {
    // --- Alleen intern gebruik (verzonden via e-mail, nooit getoond op de pagina) ---
    internal: {
      estimatedLaborHoursPerVisit: finalize(estimatedLaborHoursPerVisit),
      estimatedLaborHoursPerMonth: finalize(estimatedLaborHoursPerMonth),
      contractorHourlyRate: PRICING_CONFIG.contractorHourlyRate,
      laborCost: finalize(laborCost),
      materialCost: finalize(materialCost),
      travelCost: finalize(travelCost),
      overheadCost: finalize(overheadCost),
      totalCostPrice: finalize(totalCostPrice),
      profitMarginAmount: finalize(profitMarginAmount),
      extraServicesAmount: finalize(extraServicesAmount),
      volumeDiscountAmount: finalize(volumeDiscountAmount),
      customerMonthlyPrice: finalize(customerMonthlyPrice)
    },
    // --- Publiek: alleen dit mag zichtbaar zijn voor de bezoeker ---
    customer: {
      priceLow: finalize(customerPriceLow),
      priceHigh: finalize(customerPriceHigh),
      estimatedLaborHoursPerVisit: finalize(estimatedLaborHoursPerVisit),
      estimatedLaborHoursPerMonth: finalize(estimatedLaborHoursPerMonth)
    }
  };
}

/* ==========================================================================
   EENMALIGE OPDRACHTEN (oplevering, verhuis, dieptereiniging)
   Aparte, eenvoudigere berekening: geen frequentie/maandprijs, wel een
   toeslag t.o.v. periodieke schoonmaak (gangbaar in de branche: eenmalig
   werk is minder efficiënt in te plannen dan een vast contract).
   ========================================================================== */
const ONE_TIME_CONFIG = {
  oneTimeSurchargePercentage: 25,   // opslag t.o.v. het normale uurtarief voor eenmalig werk
  rangeSpreadPercentage: 12,        // eenmalige klussen variëren iets meer dan periodiek, maar niet extreem
  minimumOneTimePrice: 145          // eigen, lagere ondergrens dan de maandprijs-minimum
};

// Normtijden voor eenmalig werk: minuten per 100 m² (hoger dan periodiek onderhoud,
// want dieper/grondiger werk per bezoek)
const ONE_TIME_NORM_TIMES_MINUTES_PER_100M2 = {
  oplevering_nieuwbouw: 100,
  oplevering_renovatie: 130,   // renovatiestof/-vuil vraagt meer tijd dan kale nieuwbouw
  verhuis: 75,
  dieptereiniging: 95
};

function calculateOneTimePricing(jobType, input) {
  let normTime;
  if (jobType === "oplevering") {
    normTime = input.opleveringType === "renovatie"
      ? ONE_TIME_NORM_TIMES_MINUTES_PER_100M2.oplevering_renovatie
      : ONE_TIME_NORM_TIMES_MINUTES_PER_100M2.oplevering_nieuwbouw;
  } else if (jobType === "verhuis") {
    normTime = ONE_TIME_NORM_TIMES_MINUTES_PER_100M2.verhuis;
  } else {
    normTime = ONE_TIME_NORM_TIMES_MINUTES_PER_100M2.dieptereiniging;
  }

  const surfaceM2 = Math.max(1, safeNumber(input.surfaceM2, 100));
  const soilingMultiplier = safeNumber(SOILING_LEVEL_MULTIPLIER[input.soilingLevel], SOILING_LEVEL_MULTIPLIER.normal);
  const rawHours = (surfaceM2 / 100) * normTime * soilingMultiplier / 60;
  const estimatedLaborHours = Math.max(PRICING_CONFIG.minimumVisitDuration, rawHours);

  // Pand niet leeg bij verhuisschoonmaak = meer voorzichtig/tijdrovend werken
  const notEmptySurcharge = (jobType === "verhuis" && input.panNietLeeg) ? 1.15 : 1;
  // Extra werkzaamheden bij verhuisschoonmaak (percentagetoeslag, zelfde principe als extra diensten)
  const extraPct = safeNumber(input.extraServicesSurchargePercentage, 0);

  const laborCost = estimatedLaborHours * PRICING_CONFIG.contractorHourlyRate * (1 + ONE_TIME_CONFIG.oneTimeSurchargePercentage / 100) * notEmptySurcharge;
  const materialCost = estimatedLaborHours * PRICING_CONFIG.materialCostPerHour;
  const travelCost = PRICING_CONFIG.travelCostPerVisit;
  const directCosts = laborCost + materialCost + travelCost;
  const overheadCost = directCosts * (PRICING_CONFIG.companyOverheadPercentage / 100);
  const totalCostPrice = directCosts + overheadCost;
  const profitMarginAmount = totalCostPrice * (PRICING_CONFIG.profitMarginPercentage / 100);
  let totalPrice = totalCostPrice + profitMarginAmount;
  totalPrice *= (1 + extraPct / 100);
  totalPrice = Math.max(ONE_TIME_CONFIG.minimumOneTimePrice, totalPrice);

  const spread = ONE_TIME_CONFIG.rangeSpreadPercentage / 100;
  const finalize = (n) => safeNumber(n, 0);

  return {
    internal: {
      estimatedLaborHours: finalize(estimatedLaborHours),
      laborCost: finalize(laborCost), materialCost: finalize(materialCost),
      travelCost: finalize(travelCost), overheadCost: finalize(overheadCost),
      totalCostPrice: finalize(totalCostPrice), profitMarginAmount: finalize(profitMarginAmount),
      totalPrice: finalize(totalPrice)
    },
    customer: {
      priceLow: finalize(Math.round(totalPrice * (1 - spread) / 10) * 10),
      priceHigh: finalize(Math.round(totalPrice * (1 + spread) / 10) * 10),
      estimatedLaborHours: finalize(estimatedLaborHours)
    }
  };
}
