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
// BELANGRIJK — financiële parameters: sinds ronde 46 staan alle interne
// kostprijzen/marges/tijdnormen voor Calculator v2 centraal in
// lib/calculator.js (NIET meer in dit bestand — zie CHANGELOG-46.md voor de
// volledige oud-vs-nieuw-vergelijking). Dit bestand roept die gedeelde module
// alleen aan en bouwt er de interne e-mail omheen. Er is in de rest van de
// repository geen andere plek met calculatielogica (briefpunt 16: één
// gedeelde bron).

"use strict";

const { bouwEmailHtml, verstuurEmail } = require("../lib/mail.js");
const calculator = require("../lib/calculator.js");
const { calculateOffer, euro } = calculator;

// Minimale tijd (ms) tussen renderen en versturen van het formulier — een
// eenvoudige, dependency-vrije bot-heuristiek: geen mens vult een
// meerstaps-wizard in <2,5s in. Losstaand van de Calculator v2-config
// (lib/calculator.js) — dit is een spamcontrole, geen prijs-/tijdparameter.
const MIN_FILL_TIME_MS = 2500;

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
function isNietLeeg(v) {
  return typeof v === "string" ? v.trim().length > 0 : !!v;
}

function isValidEmail(v) {
  return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

// =================================================================
// INTERNE CALCULATIE — Calculator v2 (lib/calculator.js, ronde 46)
// =================================================================
// De volledige rekenlogica (tijdsbandbreedte, kostprijs, adviesprijs-
// bandbreedte, betrouwbaarheid, max. ZZP-tarief) staat sinds ronde 46
// uitsluitend in lib/calculator.js — hier wordt die alleen aangeroepen.
// `calculateOffer()` retourneert altijd één van drie vormen:
//   null                                       -- particuliere aanvraag (geen interne sectie)
//   { status: "niet_beschikbaar" }              -- dienst buiten CALC_DIENST_SLUGS
//   { status: "onvoldoende_info", redenen }      -- te weinig basisinvoer
//   { status: "ok", ... }                        -- een bandbreedte-inschatting
// Zie CHANGELOG-46.md voor de volledige vergelijking met Calculator v1.

// Eén regel, alleen intern, die de betrouwbaarheid/het vervolgadvies
// samenvat (briefpunt 13, "Intern advies"). Gebruikt de kleurcodes uit de
// brief zelf (🟢/🟡/🟠) als snelle visuele indicator voor Egzon — geen
// klantwaarde, puur intern leesgemak.
function bouwInterneAdviesRegel(calc) {
  if (calc.locatieopnameAanbevolen) {
    const reden = (calc.betrouwbaarheidFactoren || []).length
      ? calc.betrouwbaarheidFactoren.join("; ")
      : "bijzondere situatie opgegeven door de klant";
    return "🟠 Locatieopname aanbevolen – " + reden + ".";
  }
  if (calc.betrouwbaarheid === "Middel") {
    const redenen = (calc.betrouwbaarheidFactoren || []).join("; ");
    return "🟡 Betrouwbaarheid: Middel" + (redenen ? " – " + redenen + "." : ".");
  }
  return "🟢 Betrouwbaarheid: Hoog – bruikbaar als eerste interne indicatie.";
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

  const calc = calculateOffer(payload);
  if (calc) {
    if (calc.status === "niet_beschikbaar") {
      regels.push("INTERNE PRIJSINDICATIE");
      regels.push("Niet beschikbaar voor deze dienst (nog geen betrouwbaar rekenmodel).");
      regels.push("");
      regels.push("INTERN ADVIES");
      regels.push("Handmatige calculatie / locatieopname aanbevolen.");
      regels.push("");
    } else if (calc.status === "onvoldoende_info") {
      regels.push("INTERNE PRIJSINDICATIE");
      regels.push("Onvoldoende informatie voor een automatische inschatting.");
      regels.push("Reden: " + calc.redenen.join("; "));
      regels.push("");
      regels.push("INTERN ADVIES");
      regels.push("Handmatige calculatie / locatieopname aanbevolen.");
      regels.push("Interne calculatie – niet automatisch aan de klant gecommuniceerd en geen definitieve offerte.");
      regels.push("");
    } else if (calc.status === "ok") {
      regels.push("INTERNE PRIJSINDICATIE");
      regels.push("Geschatte schoonmaaktijd: " + calc.tijdsbandbreedteTekst + " per bezoek");
      regels.push("Calculatietijd (gebruikt voor onderstaande prijzen): " + calc.calculatietijdTekst);
      regels.push("Minimum gezonde prijs: " + euro(calc.minimumGezondePrijsExclBtw) + " excl. btw per bezoek");
      regels.push("Adviesprijs: " + calc.adviesprijsTekst + " excl. btw per bezoek" + (calc.minimumToegepast ? " (minimumprijs toegepast)" : ""));
      if (calc.maandbedragTekst) {
        regels.push("Advies maandbedrag: " + calc.maandbedragTekst + " excl. btw (" + calc.frequentieLabel + ")");
      } else {
        regels.push("Advies maandbedrag: niet beschikbaar (" + (calc.meerdereKerenPerWeekOnvolledig ? 'aantal keer per week niet opgegeven' : 'frequentie "' + calc.frequentieLabel + '" heeft geen maandritme') + ")");
      }
      regels.push("Referentie ZZP-tarief: " + calc.referentieZzpTariefTekst);
      if (calc.maxZzpTariefTekst) {
        regels.push("Max. verantwoord ZZP-tarief: " + calc.maxZzpTariefTekst);
      }
      if (calc.uitbesteedbaarheid) {
        regels.push("Uitbesteedbaarheid: " + calc.uitbesteedbaarheid);
      }
      regels.push("Betrouwbaarheid: " + calc.betrouwbaarheid);
      if (calc.meerdereLocaties) {
        regels.push("Let op: aanvraag betreft " + calc.locatiesAantal + " locaties — bovenstaande is PER LOCATIE, vermenigvuldig handmatig voor een totaalinschatting.");
      }
      regels.push("");

      regels.push("MIDDELEN & VERVOER");
      regels.push("Middelen/materialen: " + calc.materiaalkostenTekst + " per bezoek (gebruikt: " + euro(calc.materiaalkosten) + ")");
      if (calc.vervoerBekend) {
        regels.push("Retourkilometers: " + calc.km + " km");
        regels.push("Voertuigkosten: " + euro(calc.voertuigkosten) + " per bezoek");
      } else {
        regels.push("Retourkilometers: nog te bepalen");
        regels.push("Voertuigkosten: nog te bepalen");
      }
      regels.push("Totale bekende interne kostprijs per bezoek: " + euro(calc.kostprijsPerBezoek));
      if (calc.vervoerNogTeBepalen) {
        regels.push("Vervoer nog niet meegerekend — verkoopindicatie is exclusief nog te bepalen vervoerskosten.");
      }
      regels.push("");

      regels.push("INTERN ADVIES");
      regels.push(bouwInterneAdviesRegel(calc));
      regels.push("Interne calculatie – niet automatisch aan de klant gecommuniceerd en geen definitieve offerte.");
      regels.push("");
    }
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

  const calc = calculateOffer(payload);
  let noot = null;
  if (calc) {
    if (calc.status === "niet_beschikbaar") {
      secties.push({
        heading: "Interne prijsindicatie",
        tekst: "Niet beschikbaar voor deze dienst (nog geen betrouwbaar rekenmodel).",
      });
      secties.push({
        heading: "Intern advies",
        tekst: "Handmatige calculatie / locatieopname aanbevolen.",
      });
    } else if (calc.status === "onvoldoende_info") {
      secties.push({
        heading: "Interne prijsindicatie",
        tekst: "Onvoldoende informatie voor een automatische inschatting. Reden: " + calc.redenen.join("; "),
      });
      secties.push({
        heading: "Intern advies",
        tekst: "Handmatige calculatie / locatieopname aanbevolen.",
      });
      noot = "Interne calculatie – niet automatisch aan de klant gecommuniceerd en geen definitieve offerte.";
    } else if (calc.status === "ok") {
      const prijsRows = [
        ["Geschatte schoonmaaktijd", calc.tijdsbandbreedteTekst + " per bezoek"],
        ["Calculatietijd", calc.calculatietijdTekst],
        ["Minimum gezonde prijs", euro(calc.minimumGezondePrijsExclBtw) + " excl. btw per bezoek"],
        ["Adviesprijs", calc.adviesprijsTekst + " excl. btw per bezoek" + (calc.minimumToegepast ? " (minimumprijs toegepast)" : "")],
        ["Advies maandbedrag", calc.maandbedragTekst ? calc.maandbedragTekst + " excl. btw (" + calc.frequentieLabel + ")" : "Niet beschikbaar (" + (calc.meerdereKerenPerWeekOnvolledig ? "aantal keer per week niet opgegeven" : "frequentie “" + calc.frequentieLabel + "” heeft geen maandritme") + ")"],
      ];
      prijsRows.push(["Referentie ZZP-tarief", calc.referentieZzpTariefTekst]);
      if (calc.maxZzpTariefTekst) {
        prijsRows.push(["Max. verantwoord ZZP-tarief", calc.maxZzpTariefTekst]);
      }
      if (calc.uitbesteedbaarheid) {
        prijsRows.push(["Uitbesteedbaarheid", calc.uitbesteedbaarheid]);
      }
      prijsRows.push(["Betrouwbaarheid", calc.betrouwbaarheid]);
      if (calc.meerdereLocaties) {
        prijsRows.push(["Let op", "Aanvraag betreft " + calc.locatiesAantal + " locaties — bovenstaande is PER LOCATIE, vermenigvuldig handmatig voor een totaalinschatting."]);
      }
      secties.push({ heading: "Interne prijsindicatie", rows: prijsRows });

      const vervoerRows = [
        ["Middelen/materialen", calc.materiaalkostenTekst + " per bezoek (gebruikt: " + euro(calc.materiaalkosten) + ")"],
      ];
      if (calc.vervoerBekend) {
        vervoerRows.push(["Retourkilometers", calc.km + " km"]);
        vervoerRows.push(["Voertuigkosten", euro(calc.voertuigkosten) + " per bezoek"]);
      } else {
        vervoerRows.push(["Retourkilometers", "nog te bepalen"]);
        vervoerRows.push(["Voertuigkosten", "nog te bepalen"]);
      }
      vervoerRows.push(["Totale bekende interne kostprijs per bezoek", euro(calc.kostprijsPerBezoek)]);
      if (calc.vervoerNogTeBepalen) {
        vervoerRows.push(["Let op", "Vervoer nog niet meegerekend — verkoopindicatie is exclusief nog te bepalen vervoerskosten."]);
      }
      secties.push({
        heading: "Middelen & vervoer",
        rows: vervoerRows,
      });

      secties.push({
        heading: "Intern advies",
        tekst: bouwInterneAdviesRegel(calc),
      });
      noot = "Interne calculatie – niet automatisch aan de klant gecommuniceerd en geen definitieve offerte.";
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
// Post-ronde-48 productiedebug: bepaalt PER SIGNAAL (niet alleen het
// eindoordeel) waarom een aanvraag als bot/spam wordt aangemerkt, zodat de
// handler dit veilig kan loggen (uitsluitend booleans/een getal, nooit
// klantgegevens) -- zie de diagnostiek in de handler hieronder. `lijktOpBot()`
// blijft de bestaande boolean-signatuur behouden (gebruikt door
// test_offerte_api.js Test 7) en is nu simpelweg een dunne wrapper hieromheen.
function bepaalBotSignalen(payload) {
  const honeypotFilled = payload.botcheck === true;
  const renderedAt = parseInt(payload.form_rendered_at, 10);
  let fillTimeMs = null;
  let fillTimeTooShort = false;
  if (Number.isFinite(renderedAt)) {
    const verstreken = Date.now() - renderedAt;
    fillTimeMs = verstreken;
    if (verstreken >= 0 && verstreken < MIN_FILL_TIME_MS) fillTimeTooShort = true;
  }
  return { honeypotFilled, fillTimeTooShort, fillTimeMs, isBot: honeypotFilled || fillTimeTooShort };
}

function lijktOpBot(payload) {
  return bepaalBotSignalen(payload).isBot;
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

  // ================================================================
  // VEILIGE, TIJDELIJKE DIAGNOSTIEK (productiedebug na ronde 48)
  // ================================================================
  // Elke aanvraag logt uitsluitend WELK codepad is geraakt, plus -- bij
  // botdetectie -- welk van de twee losse signalen daarvoor zorgde. Dit is
  // de enige manier om in Vercel Logs te onderscheiden of een "HTTP 200 maar
  // geen mail in Resend"-melding kwam door botdetectie, door validatie, of
  // door een mislukte Resend-aanroep. NOOIT gelogd: naam, e-mail, telefoon,
  // berichtinhoud, de volledige payload, of de API-key.
  //
  // Stille afhandeling voor vermoedelijke bots: geen foutmelding teruggeven
  // (dat zou een bot juist tips geven), gewoon doen alsof het gelukt is.
  // Dit pad roept verstuurEmail() NOOIT aan -- vandaar geen mail in Resend
  // als dit pad wordt geraakt. Een normale menselijke gebruiker hoort hier
  // vrijwel nooit te belanden: de honeypot is een onzichtbaar veld
  // (tabindex="-1", autocomplete="off") dat een mens nooit invult, en
  // MIN_FILL_TIME_MS (2500ms) wordt gemeten vanaf het renderen van de hele
  // wizard (éénmalig gezet bij initialisatie, niet per stap) tot de
  // uiteindelijke submit -- ruim onder de tijd die een 12-staps-wizard met
  // verplichte tekstvelden (naam/e-mail/telefoon/plaats) realistisch kost,
  // ook met auto-advance. Zie test_wizard.js voor een expliciete
  // regressietest hierop en test_offerte_api.js voor de codepad-tests A-E.
  const botSignalen = bepaalBotSignalen(payload);
  if (botSignalen.isBot) {
    console.log(
      "offerte-aanvraag: Offerte aanvraag verwerkt: bot_blocked",
      "honeypotFilled=" + botSignalen.honeypotFilled,
      "fillTimeTooShort=" + botSignalen.fillTimeTooShort,
      "fillTimeMs=" + (botSignalen.fillTimeMs === null ? "onbekend" : botSignalen.fillTimeMs)
    );
    res.status(200).json({ ok: true });
    return;
  }

  const ontbrekend = valideerVerplichteVelden(payload);
  if (ontbrekend.length > 0) {
    // Uitsluitend de NAMEN van de ontbrekende/ongeldige velden (bijv.
    // "email,telefoon") -- nooit de ingevulde waarden zelf.
    console.log("offerte-aanvraag: Offerte aanvraag verwerkt: validation_failed", "ontbrekendeVelden=" + ontbrekend.join(","));
    res.status(400).json({ ok: false, error: "missing_fields" });
    return;
  }

  try {
    const subject = bouwOnderwerp(payload);
    const text = bouwEmailTekst(payload);
    const html = bouwEmailHtmlOfferte(payload);
    console.log("offerte-aanvraag: Offerte aanvraag verwerkt: resend_attempted");
    await verstuurEmail({
      subject,
      text,
      html,
      replyTo: payload.email,
      logPrefix: "offerte-aanvraag",
    });
    console.log("offerte-aanvraag: Offerte aanvraag verwerkt: resend_success");
    // Eenduidig response-contract (briefpunt 4): `success:true` wordt
    // UITSLUITEND gezet nadat verstuurEmail() daadwerkelijk succesvol is
    // gebleken -- dus nadat Resend zelf een succesvolle response heeft
    // teruggegeven (zie briefpunt 5: nooit een false-positive succes vóór
    // mailverzending). `ok:true` blijft ernaast staan voor achterwaartse
    // compatibiliteit met de bestaande frontend-check in js/main.js. Het
    // bot-pad hierboven zet bewust GEEN `success`-veld: dat pad blijft
    // opzettelijk ondoorzichtig richting een eventuele bot, maar is nu wel
    // volledig te onderscheiden via de server-side log hierboven.
    res.status(200).json({ ok: true, success: true });
  } catch (err) {
    // verstuurEmail() (lib/mail.js) heeft de technische details al veilig
    // gelogd (nooit de API-key, nooit klantgegevens) en zet `.reden` op de
    // fout: "server_misconfigured" (RESEND_API_KEY/RESEND_FROM_EMAIL
    // ontbreekt, nog vóór er iets geprobeerd is) of "send_failed" (Resend
    // wijst de aanvraag af, of een netwerkfout). De bezoeker krijgt in beide
    // gevallen alleen een generieke foutcode, nooit responsdetails -- en
    // NOOIT `success:true` (voorkomt een false-positive succesmelding).
    const reden = err && err.reden;
    console.log("offerte-aanvraag: Offerte aanvraag verwerkt: resend_failed", "reden=" + (reden || "onbekend"));
    if (reden === "server_misconfigured") {
      res.status(500).json({ ok: false, success: false, error: "server_misconfigured" });
    } else {
      res.status(502).json({ ok: false, success: false, error: "send_failed" });
    }
  }
};

// Alleen voor lokale tests (zie test_offerte_api.js) — geen effect op Vercel.
// Bevat GEEN secret.
module.exports._internal = {
  calculateOffer,
  bouwEmailTekst,
  bouwEmailHtmlOfferte,
  bouwOnderwerp,
  bouwInterneAdviesRegel,
  lijktOpBot,
  bepaalBotSignalen,
  valideerVerplichteVelden,
  MIN_FILL_TIME_MS,
  CONFIG: calculator.CONFIG,
  CALC_DIENST_SLUGS: calculator.CALC_DIENST_SLUGS,
};
