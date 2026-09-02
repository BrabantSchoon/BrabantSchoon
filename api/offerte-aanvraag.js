// api/offerte-aanvraag.js
//
// Vercel Serverless Function (Node.js runtime, geen dependencies buiten de
// standaard `fetch` die Vercel's Node-runtime al meelevert).
//
// Dit endpoint vervangt de vroegere rechtstreekse formulier-POST vanuit de
// browser naar Web3Forms. Twee redenen daarvoor (zie CHANGELOG voor het volle
// verhaal):
//
// 1. De oude opzet stuurde ALLE velden van het wizard-formulier mee, ook
//    tientallen verborgen tellers/checkboxes van niet-gekozen particuliere
//    opties (met waarde "0" of leeg). Web3Forms somt automatisch alle
//    meegestuurde velden op, dus dat werd een onleesbare mail. Dit bestand
//    bouwt de mailtekst zelf, conditioneel, op basis van alleen de velden die
//    de klant daadwerkelijk heeft ingevuld voor de gekozen klantsoort/dienst.
// 2. Brabantschoon wil een interne tijd-/prijsindicatie voor periodieke
//    bedrijfsschoonmaak, die de klant nooit te zien mag krijgen. Zolang die
//    berekening in de browser gebeurt, is ze — ongeacht hoe goed ze verstopt
//    wordt — gewoon uit te lezen via devtools/netwerkverkeer. Daarom gebeurt
//    de berekening hier, server-side; de browser levert alleen de ruwe
//    invoer (oppervlakte, ruimtes, vervuiling, frequentie) aan, nooit een
//    berekend bedrag.
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

// =================================================================
// CENTRALE CONFIGURATIE — interne calculatie periodieke bedrijfsschoonmaak
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

  // BELANGRIJK — GEEN secret hier: de Web3Forms access key staat NIET meer in de
  // broncode. Deze functie leest hem bij elk verzoek uit de Vercel-omgevings-
  // variabele `WEB3FORMS_ACCESS_KEY` (zie getWeb3FormsAccessKey() hieronder) en
  // faalt veilig — zonder de sleutel te loggen of te versturen — wanneer die
  // variabele niet is ingesteld. Zie README.md ("Secrets & environment variables")
  // voor hoe u deze in Vercel instelt.
  WEB3FORMS_ENDPOINT: "https://api.web3forms.com/submit",
};

// =================================================================
// WEB3FORMS ACCESS KEY — uit environment variable, nooit hardcoded
// =================================================================
// Geeft de access key terug, of null wanneer de omgevingsvariabele ontbreekt of
// leeg is. Bewust een aparte functie (i.p.v. rechtstreeks `process.env...` overal
// in de code) zodat er precies één plek is die ooit met de echte sleutel omgaat,
// en zodat tests dit gedrag kunnen simuleren zonder een echte sleutel nodig te
// hebben (zie test_offerte_api.js — die zet/verwijdert alleen de omgevings-
// variabele, leest of logt nooit een echte waarde).
function getWeb3FormsAccessKey() {
  const key = process.env.WEB3FORMS_ACCESS_KEY;
  return typeof key === "string" && key.trim().length > 0 ? key.trim() : null;
}

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
// INTERNE CALCULATIE (alleen voor dienstSlug === "periodiek-zakelijk")
// =================================================================
function berekenInterneCalculatie(payload) {
  if (!payload || payload.dienstSlug !== "periodiek-zakelijk") return null;
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
    if (calc.onvoldoendeInfo) {
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
    regels.push("");
    regels.push('Interne prijsindicatie – niet automatisch aan de klant gecommuniceerd en geen definitieve offerte.');
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
// VERSTUREN VIA WEB3FORMS (server-to-server — de klant ziet dit verzoek
// nooit, in tegenstelling tot de oude rechtstreekse browser-POST)
// =================================================================
async function verstuurNaarWeb3Forms({ subject, message, replyto, fromName, accessKey }) {
  const body = {
    access_key: accessKey,
    subject,
    from_name: fromName || "Brabantschoon website",
    message,
  };
  if (replyto) body.replyto = replyto;
  const resp = await fetch(CONFIG.WEB3FORMS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || data.success === false) {
    throw new Error("web3forms_failed: " + (data && data.message ? data.message : resp.status));
  }
  return data;
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

  // Configuratiecontrole: zonder access key kan er sowieso niets verstuurd
  // worden. Faal hier expliciet en veilig, VOORDAT er iets geprobeerd wordt —
  // nooit stilzwijgend doen alsof de aanvraag is verzonden wanneer dat niet zo
  // is. Log alleen dat de variabele ontbreekt, nooit een sleutelwaarde (die is
  // er in dit geval per definitie ook niet). Geen foutdetails naar de bezoeker
  // — alleen een generieke foutcode, net als bij een mislukte verzending.
  const accessKey = getWeb3FormsAccessKey();
  if (!accessKey) {
    console.error("offerte-aanvraag: WEB3FORMS_ACCESS_KEY ontbreekt (omgevingsvariabele niet ingesteld) — aanvraag kan niet worden verstuurd.");
    res.status(500).json({ ok: false, error: "server_misconfigured" });
    return;
  }

  try {
    const subject = bouwOnderwerp(payload);
    const message = bouwEmailTekst(payload);
    await verstuurNaarWeb3Forms({
      subject,
      message,
      replyto: payload.email,
      fromName: payload.bedrijfsnaam || payload.naam,
      accessKey,
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    // Nooit err.message (kan Web3Forms-responsdetails bevatten) naar de
    // bezoeker doorgeven — alleen een generieke foutcode.
    res.status(502).json({ ok: false, error: "send_failed" });
  }
};

// Alleen voor lokale tests (zie test_offerte_api.js) — geen effect op Vercel.
// Bevat GEEN secret: getWeb3FormsAccessKey zelf wordt geëxporteerd (leest bij
// aanroep uit process.env), niet een reeds-uitgelezen sleutelwaarde.
module.exports._internal = { berekenInterneCalculatie, bouwEmailTekst, bouwOnderwerp, lijktOpBot, valideerVerplichteVelden, getWeb3FormsAccessKey, CONFIG };
