// api/contact-aanvraag.js
//
// Vercel Serverless Function (Node.js runtime). Verstuurt server-side via
// Resend (zie lib/mail.js) — geen npm-dependency nodig, gewone `fetch()`.
//
// Verwerkt het compacte "Snel contact aanvragen"-formulier in de footer
// (aanwezig op elke pagina, zie render_footer() in generate.py) en het
// contactformulier op contact.html — beide gebruiken hetzelfde formulier/
// dezelfde `id="footerTerugbelForm"` en dus hetzelfde endpoint.
//
// MAILVERZENDING (ronde 43 — was Web3Forms, zie CHANGELOG-42.md/CHANGELOG-43.md):
// Web3Forms bleek zuivere server-to-server aanroepen te weigeren op een
// gratis abonnement (structurele 502 in productie, zie CHANGELOG-42.md). Dit
// endpoint verstuurt daarom nu via Resend — zie lib/mail.js voor de volledige
// verzendlogica (`process.env.RESEND_API_KEY`/`RESEND_FROM_EMAIL`, nooit
// hardcoded, faalt veilig zonder secret-lek wanneer die ontbreken).
//
// Bewust een eigen, zelfstandig bestand (i.p.v. gedeeld met
// api/offerte-aanvraag.js): beide endpoints hebben elk hun eigen
// e-mailinhoud/validatie, maar delen nu wél de onderliggende verzendlogica
// via lib/mail.js — dat is precies de "gedeelde mailservice" die dubbele
// Resend/foutafhandelingscode voorkomt, zonder de endpoint-specifieke
// e-mailopbouw en velden samen te voegen (zie README.md).

"use strict";

const { bouwEmailHtml, verstuurEmail } = require("../lib/mail.js");

const CONFIG = {
  // Vaste onderwerpregel — identiek aan de vroegere hidden "subject"-input,
  // zodat de e-mail voor de ontvanger herkenbaar hetzelfde blijft.
  SUBJECT: "Terugbelverzoek via de footer (geen volledige offerteaanvraag)",
  // Minimale tijd (ms) tussen renderen en versturen van het formulier —
  // zelfde dependency-vrije bot-heuristiek als bij de offertewizard.
  MIN_FILL_TIME_MS: 2500,
};

function isNietLeeg(v) {
  return typeof v === "string" ? v.trim().length > 0 : !!v;
}

function isValidEmail(v) {
  return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

// Telefoonvalidatie: zelfde patroon als het HTML5 `pattern`-attribuut op het
// formulierveld zelf (cijfers, spaties en +/-/()), minimaal 6 tekens.
function isValidTelefoon(v) {
  return typeof v === "string" && /^[0-9+\-\s()]{6,}$/.test(v.trim());
}

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
  if (!isNietLeeg(payload.naam)) fouten.push("naam");
  if (!isValidTelefoon(payload.telefoon)) fouten.push("telefoon");
  if (!isValidEmail(payload.email)) fouten.push("email");
  return fouten;
}

// Conditionele e-mailtekst: alleen ingevulde velden, geen lege regels voor
// de optionele bedrijfsnaam/bericht -- zelfde principe als de offertewizard
// (nooit een leeg/onnodig veld in de mail). ONGEWIJZIGD deze ronde.
function bouwEmailTekst(payload) {
  const regels = ["NIEUW TERUGBELVERZOEK (footerformulier)", ""];
  regels.push("Naam:");
  regels.push(payload.naam);
  regels.push("");
  regels.push("Telefoon:");
  regels.push(payload.telefoon);
  regels.push("");
  regels.push("E-mail:");
  regels.push(payload.email);
  if (isNietLeeg(payload.bedrijfsnaam)) {
    regels.push("");
    regels.push("Bedrijfsnaam:");
    regels.push(payload.bedrijfsnaam);
  }
  if (isNietLeeg(payload.bericht)) {
    regels.push("");
    regels.push("Bericht:");
    regels.push(payload.bericht);
  }
  return regels.join("\n").trim();
}

// HTML-versie van dezelfde mail — zelfde inhoud als bouwEmailTekst()
// hierboven, nu nette, rustige HTML. Klantwaarden worden geëscaped door
// bouwEmailHtml() (lib/mail.js).
function bouwEmailHtmlContact(payload) {
  const rows = [
    ["Naam", payload.naam],
    ["Telefoon", payload.telefoon],
    ["E-mail", payload.email],
  ];
  if (isNietLeeg(payload.bedrijfsnaam)) rows.push(["Bedrijfsnaam", payload.bedrijfsnaam]);
  if (isNietLeeg(payload.bericht)) rows.push(["Bericht", payload.bericht]);
  return bouwEmailHtml({
    titel: "Nieuw terugbelverzoek (footerformulier)",
    secties: [{ heading: "Gegevens", rows }],
  });
}

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

  // Stille afhandeling voor vermoedelijke bots: geen foutmelding teruggeven,
  // gewoon doen alsof het gelukt is (zelfde patroon als de offertewizard).
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
    const text = bouwEmailTekst(payload);
    const html = bouwEmailHtmlContact(payload);
    await verstuurEmail({
      subject: CONFIG.SUBJECT,
      text,
      html,
      replyTo: payload.email,
      logPrefix: "contact-aanvraag",
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    // verstuurEmail() (lib/mail.js) heeft de technische details al veilig
    // gelogd (nooit de API-key, nooit klantgegevens) en zet `.reden` op de
    // fout: "server_misconfigured" (RESEND_API_KEY/RESEND_FROM_EMAIL
    // ontbreekt) of "send_failed" (Resend wijst de aanvraag af, of een
    // netwerkfout). De bezoeker krijgt in beide gevallen alleen een
    // generieke foutcode, nooit responsdetails.
    if (err && err.reden === "server_misconfigured") {
      res.status(500).json({ ok: false, error: "server_misconfigured" });
    } else {
      res.status(502).json({ ok: false, error: "send_failed" });
    }
  }
};

// Alleen voor lokale tests -- geen effect op Vercel. Bevat GEEN secret.
module.exports._internal = { bouwEmailTekst, bouwEmailHtmlContact, lijktOpBot, valideerVerplichteVelden, isValidEmail, isValidTelefoon, CONFIG };
