// api/contact-aanvraag.js
//
// Vercel Serverless Function (Node.js runtime, geen dependencies buiten de
// standaard `fetch` die Vercel's Node-runtime al meelevert).
//
// Verwerkt het compacte "Snel contact aanvragen"-formulier in de footer
// (aanwezig op elke pagina, zie render_footer() in generate.py). Dit
// formulier stuurde voorheen rechtstreeks (native form-POST, geen JS nodig)
// naar Web3Forms, met de access key als zichtbaar veld in de HTML. Dat is
// hier bewust losgekoppeld: net als bij de offertewizard (zie
// api/offerte-aanvraag.js) bouwt dit endpoint de e-mail nu server-side op en
// stuurt die server-to-server door naar Web3Forms, zodat de access key
// nergens meer in publieke HTML/JavaScript hoeft te staan.
//
// BELANGRIJK — geen secret hier: de Web3Forms access key staat NIET in de
// broncode. Deze functie leest hem bij elk verzoek uit de Vercel-omgevings-
// variabele `WEB3FORMS_ACCESS_KEY` en faalt veilig (zonder de sleutel te
// loggen of te versturen) wanneer die ontbreekt. Zie README.md
// ("Secrets & environment variables").
//
// Bewust een eigen, zelfstandig bestand (i.p.v. gedeeld met
// api/offerte-aanvraag.js): dat endpoint is net uitgebreid getest en
// opgeleverd (zakelijke calculator/e-mailopbouw) en wordt deze ronde
// expliciet niet aangeraakt, om geen enkel risico te lopen op dat inmiddels
// werkende, geverifieerde pad. Zie README.md voor een opmerking over een
// eventuele latere refactor naar een gedeelde helper.

"use strict";

const CONFIG = {
  WEB3FORMS_ENDPOINT: "https://api.web3forms.com/submit",
  // Vaste onderwerpregel — identiek aan de vroegere hidden "subject"-input,
  // zodat de e-mail voor de ontvanger herkenbaar hetzelfde blijft.
  SUBJECT: "Terugbelverzoek via de footer (geen volledige offerteaanvraag)",
  // Minimale tijd (ms) tussen renderen en versturen van het formulier —
  // zelfde dependency-vrije bot-heuristiek als bij de offertewizard.
  MIN_FILL_TIME_MS: 2500,
};

function getWeb3FormsAccessKey() {
  const key = process.env.WEB3FORMS_ACCESS_KEY;
  return typeof key === "string" && key.trim().length > 0 ? key.trim() : null;
}

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
// (nooit een leeg/onnodig veld in de mail).
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

async function verstuurNaarWeb3Forms({ message, replyto, fromName, accessKey }) {
  const body = {
    access_key: accessKey,
    subject: CONFIG.SUBJECT,
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

  // Configuratiecontrole: zonder access key kan er sowieso niets verstuurd
  // worden. Faal hier expliciet en veilig, VOORDAT er iets geprobeerd wordt
  // -- nooit stilzwijgend doen alsof het verzoek is verzonden wanneer dat
  // niet zo is. Log alleen dat de variabele ontbreekt, nooit een waarde.
  const accessKey = getWeb3FormsAccessKey();
  if (!accessKey) {
    console.error("contact-aanvraag: WEB3FORMS_ACCESS_KEY ontbreekt (omgevingsvariabele niet ingesteld) — verzoek kan niet worden verstuurd.");
    res.status(500).json({ ok: false, error: "server_misconfigured" });
    return;
  }

  try {
    const message = bouwEmailTekst(payload);
    await verstuurNaarWeb3Forms({
      message,
      replyto: payload.email,
      fromName: payload.bedrijfsnaam || payload.naam,
      accessKey,
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    // Nooit err.message (kan Web3Forms-responsdetails bevatten) naar de
    // bezoeker doorgeven -- alleen een generieke foutcode.
    res.status(502).json({ ok: false, error: "send_failed" });
  }
};

// Alleen voor lokale tests -- geen effect op Vercel. Bevat GEEN secret:
// getWeb3FormsAccessKey zelf wordt geëxporteerd (leest bij aanroep uit
// process.env), niet een reeds-uitgelezen sleutelwaarde.
module.exports._internal = { bouwEmailTekst, lijktOpBot, valideerVerplichteVelden, getWeb3FormsAccessKey, isValidEmail, isValidTelefoon, CONFIG };
