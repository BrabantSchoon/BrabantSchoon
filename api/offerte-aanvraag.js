// api/offerte-aanvraag.js
//
// Vercel Serverless Function (Node.js runtime). Verstuurt server-side via
// Resend (zie lib/mail.js) — geen npm-dependency nodig, gewone `fetch()`.
//
// Twee redenen waarom dit endpoint bestaat (i.p.v. een rechtstreekse
// formulier-POST vanuit de browser):
//
// 1. De oude opzet stuurde ALLE velden van het wizard-formulier mee, ook
//    tientallen verborgen tellers/checkboxes van niet-gekozen particuliere
//    opties (met waarde "0" of leeg) — dat werd automatisch een onleesbare
//    mail. Dit bestand bouwt de mailtekst zelf, conditioneel, op basis van
//    alleen de velden die de klant daadwerkelijk heeft ingevuld voor de
//    gekozen klantsoort/dienst.
// 2. Brabantschoon wil een interne tijd-/prijsindicatie voor periodieke
//    bedrijfsschoonmaak, die de klant nooit te zien mag krijgen. Zolang die
//    berekening in de browser gebeurt, is ze — ongeacht hoe goed ze verstopt
//    wordt — gewoon uit te lezen via devtools/netwerkverkeer. Daarom gebeurt
//    de berekening hier, server-side; de browser levert alleen de ruwe
//    invoer (oppervlakte, ruimtes, vervuiling, frequentie) aan, nooit een
//    berekend bedrag.
//
// MAILVERZENDING (ronde 43 — was Web3Forms, zie CHANGELOG-42.md/CHANGELOG-43.md):
// Web3Forms bleek zuivere server-to-server aanroepen te weigeren op een
// gratis abonnement, wat een structurele 502 in productie veroorzaakte. Dit
// endpoint verstuurt daarom nu via Resend, met dezelfde
// veilig-falen-zonder-secret-aanpak als voorheen — zie lib/mail.js voor de
// volledige verzendlogica (`process.env.RESEND_API_KEY`/`RESEND_FROM_EMAIL`,
// nooit hardcoded).
//
// BELANGRIJK — financiële parameters: dit is de ENIGE plek in de repository
// waar interne kostprijzen/marges voor zakelijke periodieke schoonmaak
// hardcoded staan. Er is in de rest van de repository GEEN eerdere zakelijke
// prijsconfiguratie of calculatorlogica aangetroffen (alleen consumentprijzen
// voor particuliere pakketten, in generate.py) — de onderstaande waarden zijn
// dus nieuw, en zijn bewuste, verdedigbare placeholders, GEEN door
// Brabantschoon bevestigde tarieven. Alles wat hieronder "TE BEVESTIGEN" is
// gemarkeerd moet door de ondernemer worden nagekeken/aangepast voordat de
// interne indicaties als leidend voor calculatie worden gebruikt.

"use strict";

const { bouwEmailHtml, verstuurEmail } = require("../lib/mail.js");

// =================================================================
// CENTRALE CONFIGURATIE — interne calculatie periodieke bedrijfsschoonmaak
// (ONGEWIJZIGD deze ronde — zie briefpunt 17: geen enkele financiële
// parameter, tijdmodel- of vervuilingsfactor-waarde is aangepast)
// =================================================================
const CONFIG = {
  // --- Kostprijs & marge (TE BEVESTIGEN door Brabantschoon) ---
  // Interne uitvoeringskost per uur: wat het BEDRIJF een schoonmaakuur kost
  // om te laten uitvoeren, inclusief werkgeverslasten/overhead als het geen
  // "de eigenaar maakt zelf schoon"-uur is (zzp'er inhuren of personeel in
  // loondienst). Bewust NIET nul, ook al maakt Egzon momenteel misschien nog
  // zelf schoon — de calculator moet ook kloppen zodra iemand anders wordt
  // ingezet (zie briefpunt 8).
  INTERNAL_HOURLY_COST_EXCL_BTW: 27.5, // TE BEVESTIGEN
  // Gewenste brutomarge op de adviesprijs (excl. btw), als fractie.
  DESIRED_GROSS_MARGIN: 0.35, // TE BEVESTIGEN (35%)
  // Minimumprijs per bezoek (excl. btw) — voorkomt dat kleine opdrachten
  // onrendabel worden door reistijd/administratie/opstart- en afsluittijd.
  MIN_PRICE_PER_VISIT_EXCL_BTW: 45, // TE BEVESTIGEN

  // --- Reistijd (TE BEVESTIGEN) ---
  // Vlakke inschatting per bezoek (heen + terug), tot een preciezer model
  // (bijv. per postcodegebied) beschikbaar is.
  TRAVEL_MINUTES_PER_VISIT: 20, // TE BEVESTIGEN
  // Uurtarief waartegen reistijd wordt gewaardeerd — standaard gelijk aan de
  // uitvoeringskost, maar apart configureerbaar mocht Brabantschoon reistijd
  // tegen een ander tarief willen waarderen.
  TRAVEL_RATE_PER_HOUR_EXCL_BTW: 27.5, // TE BEVESTIGEN

  // --- Materiaal & overig (TE BEVESTIGEN) ---
  MATERIAL_COST_PER_VISIT_EXCL_BTW: 3.5, // TE BEVESTIGEN
  OTHER_DIRECT_COSTS_PER_VISIT_EXCL_BTW: 0,

  // --- Btw ---
  // Standaard Nederlands btw-tarief — GEEN placeholder, dit is het geldende
  // wettelijke tarief voor deze diensten.
  VAT_RATE_PERCENT: 21,

  // --- Weken per maand ---
  // 52 weken / 12 maanden, intern altijd met volle precisie gebruikt (zie
  // briefpunt 7); alleen bedragen worden afgerond voor presentatie.
  WEEKS_PER_MONTH: 52 / 12,

  // --- Tijdmodel (TE BEVESTIGEN/verfijnen) ---
  // Concept: basis schoonmaaktijd (afhankelijk van oppervlaktecategorie) +
  // tijd per geselecteerde ruimte, vermenigvuldigd met een vervuilingsfactor.
  // Dit vervangt de oude, te simpele regel "tot 50 m² = altijd 1 uur".
  TIME_MODEL: {
    BASE_MINUTES_BY_OPPERVLAKTE: {
      "Klein": 45, // tot 50 m²
      "Middel": 90, // 50-150 m²
      "Groot": 180, // 150-500 m²
      "Zeer groot": 300, // 500 m² of meer
      // "Weet ik niet" bestaat bewust niet in deze tabel: bij onbekende
      // oppervlakte is een automatische tijdschatting niet verantwoord.
    },
    // Extra minuten per geselecteerde ruimte (bovenop de basistijd) — komt
    // overeen met ZAKELIJK_RUIMTE_OPTIES in generate.py; ids moeten exact
    // overeenkomen.
    ROOM_EXTRA_MINUTES: {
      ruimte_kantoor: 10,
      ruimte_kantine: 15,
      ruimte_toiletten: 15,
      ruimte_entree: 10,
      ruimte_gangen: 10,
      ruimte_vergaderruimte: 10,
      ruimte_kleedruimte: 10,
      ruimte_werkplaats: 20,
      ruimte_overig: 15,
    },
    // Vervuilingsfactor — komt overeen met ZAKELIJK_VERVUILING_OPTIES in
    // generate.py; labels moeten exact overeenkomen (geen aparte ids nodig,
    // deze labels zijn stabiele, door de gebruiker gekozen tekst).
    VERVUILING_FACTOR: {
      "Normale kantoor-/bedrijfsvervuiling": 1.0,
      "Enige extra vervuiling": 1.15,
      "Bovengemiddelde vervuiling": 1.35,
      "Anders / toelichting": 1.35, // conservatief behandeld tot handmatig beoordeeld
    },
  },

  // Minimale tijd (ms) tussen renderen en versturen van het formulier — een
  // eenvoudige, dependency-vrije bot-heuristiek: geen mens vult een
  // meerstaps-wizard in <2,5s in.
  MIN_FILL_TIME_MS: 2500,
};

// Labels die bij CONTACTGEGEVENS horen (en dus NIET nogmaals in de
// AANVRAAG-sectie mogen verschijnen) — moet als set overeenkomen met de
// labels die de wizard zelf gebruikt in collectRows() (js/main.js).
const CONTACT_LABELS = new Set([
  "Klanttype",
  "Naam",
  "Bedrijfsnaam / VvE",
  "E-mailadres",
  "Telefoonnummer",
  "Plaats/postcode",
]);

// =================================================================
// HELPERS
// =================================================================
function euro(bedrag) {
  return "€" + bedrag.toFixed(2).replace(".", ",");
}

function parseLeadingInt(str) {
  if (!str) return null;
  const m = String(str).match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
}

function isNietLeeg(v) {
  return typeof v === "string" ? v.trim().length > 0 : !!v;
}

function isValidEmail(v) {
  return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

// =================================================================
// INTERNE CALCULATIE
// =================================================================
// Ronde 44: het rekenmodel zelf (tijdmodel/kostprijs/marge hieronder in
// CONFIG) is NIET gewijzigd — alleen het BEREIK is uitgebreid van uitsluitend
// "periodiek-zakelijk" naar ook "kantoorreiniging" (zelfde onderliggende
// vraagset: oppervlakte/ruimtes/vervuiling/frequentie, zie
// CHANGELOG-44.md § calculatorbereik-analyse). Moet in sync blijven met
// CALC_DIENST_SLUGS in js/main.js en data-requires-dienst op wizardstap 9 in
// generate.py.
const CALC_DIENST_SLUGS = ["periodiek-zakelijk", "kantoorreiniging"];

function berekenInterneCalculatie(payload) {
  if (!payload) return null;
  const type = payload.klanttype || "";
  const isZakelijk = type === "Bedrijf" || type === "VvE / organisatie";
  // Particuliere aanvragen hebben hun eigen, aan de klant getoonde
  // prijsindicatie (zie generate.py/js/main.js) — daar hoort nooit een
  // "INTERNE CALCULATIE"-sectie bij, dus geen wijziging t.o.v. voorheen.
  if (!isZakelijk) return null;
  // Zakelijke/VvE-aanvraag voor een dienst waarvoor (nog) geen betrouwbaar
  // intern rekenmodel bestaat (bijv. glasbewassing, gevelreiniging,
  // opleveringsschoonmaak — zie brief ronde 44, sectie 12): toon dit expliciet
  // intern, in plaats van de sectie stilzwijgend weg te laten of een bedrag te
  // verzinnen.
  if (CALC_DIENST_SLUGS.indexOf(payload.dienstSlug) === -1) {
    return { nietBeschikbaar: true };
  }
  const calc = payload.calc || {};
  const redenen = [];

  const baseMinutes = CONFIG.TIME_MODEL.BASE_MINUTES_BY_OPPERVLAKTE[calc.oppervlakte];
  if (baseMinutes == null) redenen.push("oppervlakte onbekend of nog niet beoordeeld (“weet ik niet”)");

  const vervuilingFactor = calc.vervuiling ? CONFIG.TIME_MODEL.VERVUILING_FACTOR[calc.vervuiling] : null;
  if (!vervuilingFactor) redenen.push("vervuilingsgraad niet opgegeven");

  let visitsPerMonth = null;
  let frequentieLabel = calc.frequentie || "";
  if (calc.frequentie === "Wekelijks") {
    visitsPerMonth = CONFIG.WEEKS_PER_MONTH;
  } else if (calc.frequentie === "Meerdere keren per week") {
    const n = parseInt(calc.meerderePerWeekAantal, 10);
    if (Number.isFinite(n) && n >= 2) {
      visitsPerMonth = n * CONFIG.WEEKS_PER_MONTH;
      frequentieLabel = n + "× per week";
    } else {
      redenen.push('exact aantal keer per week niet opgegeven bij "Meerdere keren per week"');
    }
  } else if (calc.frequentie === "Maandelijks") {
    visitsPerMonth = 1;
  } else {
    redenen.push('frequentie is "' + (calc.frequentie || "onbekend") + '" — geen automatische periodieke prijsindicatie mogelijk');
  }

  if (redenen.length > 0) {
    return { onvoldoendeInfo: true, redenen };
  }

  let roomMinutes = 0;
  (calc.ruimtes || []).forEach((rid) => {
    roomMinutes += CONFIG.TIME_MODEL.ROOM_EXTRA_MINUTES[rid] || 0;
  });
  if (calc.ruimteOverig) roomMinutes += CONFIG.TIME_MODEL.ROOM_EXTRA_MINUTES.ruimte_overig;

  const totaalMinuten = (baseMinutes + roomMinutes) * vervuilingFactor;
  const uren = totaalMinuten / 60;

  const arbeidskosten = uren * CONFIG.INTERNAL_HOURLY_COST_EXCL_BTW;
  const reiskosten = (CONFIG.TRAVEL_MINUTES_PER_VISIT / 60) * CONFIG.TRAVEL_RATE_PER_HOUR_EXCL_BTW;
  const materiaalkosten = CONFIG.MATERIAL_COST_PER_VISIT_EXCL_BTW;
  const overigeKosten = CONFIG.OTHER_DIRECT_COSTS_PER_VISIT_EXCL_BTW;
  const directeKostenPerBezoek = arbeidskosten + reiskosten + materiaalkosten + overigeKosten;

  const adviesprijsRuwExclBtw = directeKostenPerBezoek / (1 - CONFIG.DESIRED_GROSS_MARGIN);
  const adviesprijsExclBtw = Math.max(adviesprijsRuwExclBtw, CONFIG.MIN_PRICE_PER_VISIT_EXCL_BTW);
  const minimumToegepast = adviesprijsExclBtw > adviesprijsRuwExclBtw + 0.005;
  const btwBedrag = adviesprijsExclBtw * (CONFIG.VAT_RATE_PERCENT / 100);
  const adviesprijsInclBtw = adviesprijsExclBtw + btwBedrag;
  const werkelijkeMargePercent = ((adviesprijsExclBtw - directeKostenPerBezoek) / adviesprijsExclBtw) * 100;

  const adviesprijsPerMaandExclBtw = adviesprijsExclBtw * visitsPerMonth;
  const adviesprijsPerMaandInclBtw = adviesprijsInclBtw * visitsPerMonth;
  const directeKostenPerMaand = directeKostenPerBezoek * visitsPerMonth;

  const locatiesAantal = parseLeadingInt(calc.aantalLocaties);
  const meerdereLocaties = !!(locatiesAantal && locatiesAantal > 1);

  return {
    onvoldoendeInfo: false,
    totaalMinuten,
    uren,
    frequentieLabel,
    visitsPerMonth,
    arbeidskosten,
    reiskosten,
    materiaalkosten,
    overigeKosten,
    directeKostenPerBezoek,
    directeKostenPerMaand,
    adviesprijsExclBtw,
    adviesprijsInclBtw,
    adviesprijsPerMaandExclBtw,
    adviesprijsPerMaandInclBtw,
    btwBedrag,
    werkelijkeMargePercent,
    minimumToegepast,
    meerdereLocaties,
    locatiesAantal,
  };
}

function formatDuur(minuten) {
  const afgerond = Math.round(minuten / 5) * 5; // afronden op 5 min voor leesbaarheid
  const uren = Math.floor(afgerond / 60);
  const min = afgerond % 60;
  if (uren === 0) return min + " min";
  if (min === 0) return uren + " uur";
  return uren + " uur " + min + " min";
}

// =================================================================
// E-MAIL OPBOUW — conditioneel, alleen relevante/ingevulde velden
// =================================================================
function bouwOnderwerp(payload) {
  const type = payload.klanttype || "";
  const isZakelijk = type === "Bedrijf" || type === "VvE / organisatie";
  const wie = payload.bedrijfsnaam || payload.naam || "Onbekend";
  const plaats = payload.plaats || "";
  const prefix = isZakelijk ? "Nieuwe zakelijke offerteaanvraag" : "Nieuwe particuliere offerteaanvraag";
  return prefix + (wie ? " – " + wie : "") + (plaats ? " – " + plaats : "");
}

function bouwEmailTekst(payload) {
  const type = payload.klanttype || "";
  const isZakelijk = type === "Bedrijf" || type === "VvE / organisatie";
  const regels = [];

  regels.push(isZakelijk ? "NIEUWE ZAKELIJKE OFFERTEAANVRAAG" : "NIEUWE PARTICULIERE OFFERTEAANVRAAG");
  if (payload.bedrijfsnaam) regels.push(payload.bedrijfsnaam);
  if (payload.plaats) regels.push(payload.plaats);
  regels.push("");

  regels.push("AANVRAAG");
  const aanvraagVelden = (payload.velden || []).filter(([label]) => !CONTACT_LABELS.has(label));
  aanvraagVelden.forEach(([label, waarde]) => {
    regels.push(label + ":");
    regels.push(String(waarde));
    regels.push("");
  });

  const calc = berekenInterneCalculatie(payload);
  if (calc) {
    regels.push("INTERNE CALCULATIE");
    if (calc.nietBeschikbaar) {
      regels.push("Automatische prijsindicatie:");
      regels.push("Niet beschikbaar voor deze dienst.");
      regels.push("");
      regels.push("Advies:");
      regels.push("Handmatige calculatie / locatieopname aanbevolen.");
    } else if (calc.onvoldoendeInfo) {
      regels.push("Onvoldoende informatie voor een automatische prijsindicatie.");
      regels.push("Reden: " + calc.redenen.join("; "));
    } else {
      regels.push("Geschatte schoonmaaktijd:");
      regels.push(formatDuur(calc.totaalMinuten) + " per bezoek");
      regels.push("");
      regels.push("Frequentie:");
      regels.push(calc.frequentieLabel);
      regels.push("Gemiddeld " + calc.visitsPerMonth.toFixed(2).replace(".", ",") + " bezoeken per maand");
      regels.push("");
      regels.push("Geschatte directe kosten:");
      regels.push(euro(calc.directeKostenPerBezoek) + " per bezoek — " + euro(calc.directeKostenPerMaand) + " per maand");
      regels.push("");
      regels.push("Adviesprijs per bezoek:");
      regels.push(euro(calc.adviesprijsExclBtw) + " excl. btw" + (calc.minimumToegepast ? " (minimumprijs per bezoek toegepast)" : ""));
      regels.push("");
      regels.push("Adviesprijs per maand:");
      regels.push(euro(calc.adviesprijsPerMaandExclBtw) + " excl. btw");
      regels.push("");
      regels.push("Btw (per bezoek):");
      regels.push(euro(calc.btwBedrag));
      regels.push("");
      regels.push("Adviesprijs incl. btw:");
      regels.push(euro(calc.adviesprijsInclBtw) + " per bezoek — " + euro(calc.adviesprijsPerMaandInclBtw) + " per maand");
      regels.push("");
      regels.push("Verwachte brutomarge:");
      regels.push(calc.werkelijkeMargePercent.toFixed(1).replace(".", ",") + "%");
      if (calc.meerdereLocaties) {
        regels.push("");
        regels.push("Let op: aanvraag betreft " + calc.locatiesAantal + " locaties — bovenstaande calculatie is PER LOCATIE, vermenigvuldig handmatig voor een totaalinschatting.");
      }
    }
    // Disclaimer alleen bij een daadwerkelijk (of poging tot) berekend bedrag
    // — bij "nietBeschikbaar" is er nooit iets berekend, dus zou de zin
    // "prijsindicatie niet automatisch gecommuniceerd" verwarrend zijn.
    if (!calc.nietBeschikbaar) {
      regels.push("");
      regels.push('Interne prijsindicatie – niet automatisch aan de klant gecommuniceerd en geen definitieve offerte.');
    }
    regels.push("");
  }

  regels.push("CONTACTGEGEVENS");
  if (isZakelijk && payload.naam) { regels.push("Contactpersoon:"); regels.push(payload.naam); regels.push(""); }
  else if (payload.naam) { regels.push("Naam:"); regels.push(payload.naam); regels.push(""); }
  if (payload.bedrijfsnaam) { regels.push("Bedrijfsnaam:"); regels.push(payload.bedrijfsnaam); regels.push(""); }
  if (payload.email) { regels.push("E-mail:"); regels.push(payload.email); regels.push(""); }
  if (payload.telefoon) { regels.push("Telefoon:"); regels.push(payload.telefoon); regels.push(""); }
  if (payload.plaats) { regels.push("Plaats:"); regels.push(payload.plaats); }

  return regels.join("\n").trim();
}

// HTML-versie van dezelfde mail — zelfde secties/inhoud als bouwEmailTekst()
// hierboven (die blijft de bron van waarheid voor de tekst-fallback), nu
// nette, rustige HTML voor mailclients die dat tonen. Alle klantwaarden
// worden geëscaped door bouwEmailHtml() (lib/mail.js), labels zijn vaste tekst.
function bouwEmailHtmlOfferte(payload) {
  const type = payload.klanttype || "";
  const isZakelijk = type === "Bedrijf" || type === "VvE / organisatie";
  const titelPrefix = isZakelijk ? "Nieuwe zakelijke offerteaanvraag" : "Nieuwe particuliere offerteaanvraag";
  const subtitelDelen = [payload.bedrijfsnaam, payload.plaats].filter(isNietLeeg);
  const titel = titelPrefix + (subtitelDelen.length ? " – " + subtitelDelen.join(" – ") : "");

  const secties = [];

  const aanvraagVelden = (payload.velden || []).filter(([label]) => !CONTACT_LABELS.has(label));
  secties.push({
    heading: "Aanvraag",
    rows: aanvraagVelden.map(([label, waarde]) => [label, String(waarde)]),
  });

  const calc = berekenInterneCalculatie(payload);
  let noot = null;
  if (calc) {
    if (calc.nietBeschikbaar) {
      secties.push({
        heading: "Interne calculatie",
        tekst: "Automatische prijsindicatie: Niet beschikbaar voor deze dienst. Advies: Handmatige calculatie / locatieopname aanbevolen.",
      });
    } else if (calc.onvoldoendeInfo) {
      secties.push({
        heading: "Interne calculatie",
        tekst: "Onvoldoende informatie voor een automatische prijsindicatie. Reden: " + calc.redenen.join("; "),
      });
    } else {
      const calcRows = [
        ["Geschatte schoonmaaktijd", formatDuur(calc.totaalMinuten) + " per bezoek"],
        ["Frequentie", calc.frequentieLabel],
        ["Bezoeken per maand (gem.)", calc.visitsPerMonth.toFixed(2).replace(".", ",")],
        ["Geschatte directe kosten", euro(calc.directeKostenPerBezoek) + " per bezoek — " + euro(calc.directeKostenPerMaand) + " per maand"],
        ["Adviesprijs per bezoek", euro(calc.adviesprijsExclBtw) + " excl. btw" + (calc.minimumToegepast ? " (minimumprijs toegepast)" : "")],
        ["Adviesprijs per maand", euro(calc.adviesprijsPerMaandExclBtw) + " excl. btw"],
        ["Btw (per bezoek)", euro(calc.btwBedrag)],
        ["Adviesprijs incl. btw", euro(calc.adviesprijsInclBtw) + " per bezoek — " + euro(calc.adviesprijsPerMaandInclBtw) + " per maand"],
        ["Verwachte brutomarge", calc.werkelijkeMargePercent.toFixed(1).replace(".", ",") + "%"],
      ];
      if (calc.meerdereLocaties) {
        calcRows.push(["Let op", "Aanvraag betreft " + calc.locatiesAantal + " locaties — calculatie is PER LOCATIE, vermenigvuldig handmatig voor een totaalinschatting."]);
      }
      secties.push({ heading: "Interne calculatie", rows: calcRows });
      noot = "Interne prijsindicatie – niet automatisch aan de klant gecommuniceerd en geen definitieve offerte.";
    }
  }

  const contactRows = [];
  if (isZakelijk && payload.naam) contactRows.push(["Contactpersoon", payload.naam]);
  else if (payload.naam) contactRows.push(["Naam", payload.naam]);
  if (payload.bedrijfsnaam) contactRows.push(["Bedrijfsnaam", payload.bedrijfsnaam]);
  if (payload.email) contactRows.push(["E-mail", payload.email]);
  if (payload.telefoon) contactRows.push(["Telefoon", payload.telefoon]);
  if (payload.plaats) contactRows.push(["Plaats", payload.plaats]);
  secties.push({ heading: "Contactgegevens", rows: contactRows });

  return bouwEmailHtml({ titel, secties, noot });
}

// =================================================================
// SPAM-/VALIDATIECONTROLES
// =================================================================
function lijktOpBot(payload) {
  if (payload.botcheck === true) return true;
  const renderedAt = parseInt(payload.form_rendered_at, 10);
  if (Number.isFinite(renderedAt)) {
    const verstreken = Date.now() - renderedAt;
    if (verstreken >= 0 && verstreken < CONFIG.MIN_FILL_TIME_MS) return true;
  }
  return false;
}

function valideerVerplichteVelden(payload) {
  const fouten = [];
  if (!isNietLeeg(payload.klanttype)) fouten.push("klanttype");
  if (!isNietLeeg(payload.dienst)) fouten.push("dienst");
  if (!isNietLeeg(payload.naam)) fouten.push("naam");
  if (!isValidEmail(payload.email)) fouten.push("email");
  if (!isNietLeeg(payload.telefoon)) fouten.push("telefoon");
  if (!isNietLeeg(payload.plaats)) fouten.push("plaats");
  return fouten;
}

// =================================================================
// HANDLER
// =================================================================
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "method_not_allowed" });
    return;
  }

  let payload;
  try {
    payload = typeof req.body === "object" && req.body !== null ? req.body : JSON.parse(req.body || "{}");
  } catch (e) {
    res.status(400).json({ ok: false, error: "invalid_json" });
    return;
  }

  // Stille afhandeling voor vermoedelijke bots: geen foutmelding teruggeven
  // (dat zou een bot juist tips geven), gewoon doen alsof het gelukt is.
  if (lijktOpBot(payload)) {
    res.status(200).json({ ok: true });
    return;
  }

  const ontbrekend = valideerVerplichteVelden(payload);
  if (ontbrekend.length > 0) {
    res.status(400).json({ ok: false, error: "missing_fields" });
    return;
  }

  try {
    const subject = bouwOnderwerp(payload);
    const text = bouwEmailTekst(payload);
    const html = bouwEmailHtmlOfferte(payload);
    await verstuurEmail({
      subject,
      text,
      html,
      replyTo: payload.email,
      logPrefix: "offerte-aanvraag",
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    // verstuurEmail() (lib/mail.js) heeft de technische details al veilig
    // gelogd (nooit de API-key, nooit klantgegevens) en zet `.reden` op de
    // fout: "server_misconfigured" (RESEND_API_KEY/RESEND_FROM_EMAIL
    // ontbreekt, nog vóór er iets geprobeerd is) of "send_failed" (Resend
    // wijst de aanvraag af, of een netwerkfout). De bezoeker krijgt in beide
    // gevallen alleen een generieke foutcode, nooit responsdetails.
    if (err && err.reden === "server_misconfigured") {
      res.status(500).json({ ok: false, error: "server_misconfigured" });
    } else {
      res.status(502).json({ ok: false, error: "send_failed" });
    }
  }
};

// Alleen voor lokale tests (zie test_offerte_api.js) — geen effect op Vercel.
// Bevat GEEN secret.
module.exports._internal = { berekenInterneCalculatie, bouwEmailTekst, bouwEmailHtmlOfferte, bouwOnderwerp, lijktOpBot, valideerVerplichteVelden, CONFIG, CALC_DIENST_SLUGS };
