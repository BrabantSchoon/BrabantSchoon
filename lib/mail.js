// lib/mail.js
//
// Gedeelde, server-side mailhelper voor Brabantschoon's twee Vercel Serverless
// Functions (`api/offerte-aanvraag.js` en `api/contact-aanvraag.js`). Verstuurt
// e-mail via de Resend REST API (https://api.resend.com/emails) — rechtstreeks
// met `fetch()`, bewust ZONDER de `resend` npm-package: deze repository heeft
// geen enkele andere npm-dependency (geen package.json in de repository, zie
// README "Lokaal testen"), en Vercel's zero-config `/api/*.js`-functies hebben
// geen build-stap nodig. Eén extra dependency toevoegen voor een enkele
// POST-aanroep zou onnodige complexiteit zijn (een package.json zou dan wél
// nodig worden, met alle bijkomende installatie-/lockfile-zorgen) — een gewone
// `fetch()`-aanroep, zoals hiervoor ook voor Web3Forms werd gebruikt, past
// technisch beter bij deze eenvoudige, dependency-vrije repository.
//
// Waarom overgestapt van Web3Forms naar Resend (ronde 43): Web3Forms bleek
// zuivere server-to-server (backend, geen browser) aanroepen te weren op een
// gratis abonnement ("This method is not allowed" — zie CHANGELOG-42.md).
// Resend is uitdrukkelijk gebouwd voor server-side verzending vanuit een eigen
// backend/serverless-omgeving en kent die beperking niet.
//
// BELANGRIJK — geen secret hier: `RESEND_API_KEY` staat NIET in de broncode.
// Wordt bij elk verzoek vers uit de Vercel-omgevingsvariabele gelezen (zie
// getResendConfig() hieronder) en nooit gelogd — ook niet bij een fout.

"use strict";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

// Vaste, openbare fallback-ontvanger — dit is GEEN secret, het is hetzelfde
// publieke bedrijfsadres dat al overal op de site staat (zie EMAIL in
// generate.py). Uitsluitend gebruikt wanneer RESEND_TO_EMAIL niet is ingesteld
// in Vercel, zodat er nooit per ongeluk "nergens heen" wordt verstuurd.
const DEFAULT_TO_EMAIL = "info@brabantschoon.nl";

function leesEnv(naam) {
  const v = process.env[naam];
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

// Leest de Resend-configuratie bij elk verzoek opnieuw uit process.env (nooit
// gecachet op module-niveau, zodat een lokale test de omgevingsvariabelen kan
// wijzigen tussen aanroepen door). `RESEND_API_KEY` heeft BEWUST geen
// fallbackwaarde in code. `RESEND_TO_EMAIL` mag wél een veilige default
// hebben: dat is simpelweg het bestaande, overal al zichtbare bedrijfsadres,
// geen secret.
//
// PRODUCTIEDEBUG -- root cause van de Resend 422 ("Invalid `from` field"):
// vóór deze fix werd de ruwe `RESEND_FROM_EMAIL`-omgevingsvariabele
// woordelijk, ONGEWIJZIGD als `from`-veld naar Resend gestuurd (`const from =
// leesEnv("RESEND_FROM_EMAIL")`, direct gebruikt als `body.from` in
// verstuurEmail()). Er stond in deze module GEEN enkele regel code die zelf
// punthaken toevoegt -- dat is expliciet gecontroleerd (repo-brede grep op
// `RESEND_FROM_EMAIL`/`config.from`/`body.from` levert buiten deze functie
// geen andere plek op die het adres aanraakt). De meest waarschijnlijke
// verklaring is dus dat de Vercel-omgevingsvariabele zelf al de kapotte
// waarde `<offerte@brabantschoon.nl>` bevatte (punthaken zonder
// weergavenaam) -- bijvoorbeeld doordat een voorbeeldwaarde met punthaken is
// gekopieerd zonder er zelf een naam vóór te zetten. Resend accepteert dat
// niet: het verwacht óf een kaal e-mailadres, óf `Naam <e-mailadres>`, nooit
// `<e-mailadres>` zonder naam. Onafhankelijk van de precieze oorzaak van de
// huidige omgevingswaarde bouwt `bouwFromHeader()` hieronder het `from`-veld
// nu altijd zelf, robuust en idempotent op (zie de uitgebreide toelichting
// daar) -- zodat zowel een kale e-mailwaarde als een per ongeluk al
// (half) geformatteerde waarde altijd op een geldig, niet-dubbel-gewrapt
// resultaat uitkomt, of anders een veilige configuratiefout oplevert in
// plaats van een ongeldig verzoek naar Resend te sturen.
function getResendConfig() {
  const apiKey = leesEnv("RESEND_API_KEY");
  const ruweFrom = leesEnv("RESEND_FROM_EMAIL");
  const from = ruweFrom ? bouwFromHeader(ruweFrom) : null;
  const to = leesEnv("RESEND_TO_EMAIL") || DEFAULT_TO_EMAIL;
  const ontbrekend = [];
  if (!apiKey) ontbrekend.push("RESEND_API_KEY");
  // Ontbreekt óf kon niet veilig tot een geldig from-formaat herleid worden
  // -- in beide gevallen mag er nooit een verzoek naar Resend gaan.
  if (!from) ontbrekend.push("RESEND_FROM_EMAIL");
  return { apiKey, from, to, ontbrekend };
}

function escapeHtml(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Verwijdert regeleindes/besturingstekens uit tekst die in een "header-achtig"
// e-mailveld terechtkomt (subject, reply_to) — verdediging in de diepte tegen
// header-injectie via klantinvoer (bijv. bedrijfsnaam/naam in de onderwerp-
// regel), ook al maakt Resend's JSON-gebaseerde API losse regeleindes in een
// los stringveld al grotendeels onschadelijk.
function enkeleRegel(str) {
  return String(str == null ? "" : str).replace(/[\r\n\t\x00-\x1f]+/g, " ").trim();
}

function isValidEmail(v) {
  return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

// Vaste weergavenaam voor een kale RESEND_FROM_EMAIL-waarde (geen secret,
// gewoon de bedrijfsnaam die al overal op de site staat).
const DEFAULT_FROM_DISPLAYNAAM = "Brabantschoon";

// Bouwt een geldig Resend "from"-veld ("email@example.com" of
// "Naam <email@example.com>") op een robuuste, idempotente manier uit de
// ruwe RESEND_FROM_EMAIL-omgevingsvariabele. Root-cause-fix (productiedebug):
// zie het uitgebreide commentaar bij getResendConfig() hieronder voor waarom
// dit nodig was.
//
// Regels:
// - trimt whitespace/regeleindes (via enkeleRegel(), dezelfde
//   header-injectiebescherming als subject/reply_to);
// - een kale, geldige e-mailwaarde (geen punthaken) wordt gewrapt tot
//   "Brabantschoon <e-mailadres>";
// - een waarde die AL in "Naam <e-mailadres>"-formaat staat, met een
//   niet-lege naam en een geldig e-mailadres, wordt ONGEWIJZIGD teruggegeven
//   -- nooit dubbel gewrapt (bijv. een tweede aanroep op de eigen uitvoer
//   van deze functie is altijd een no-op, zie test_mail.js);
// - punthaken ZONDER een naam ervoor (bijv. "<offerte@brabantschoon.nl>" --
//   exact de gerapporteerde productiefout) worden hersteld door alsnog de
//   vaste weergavenaam ervoor te zetten;
// - elke andere vorm (leeg, geen geldig e-mailadres binnen/buiten de
//   punthaken, of dubbel/verward genest zoals
//   "Brabantschoon <Brabantschoon <...>>") levert `null` op -- NOOIT een
//   gegokte/half geformatteerde waarde. `null` wordt door getResendConfig()
//   behandeld als een ontbrekende configuratie (veilige configuratiefout,
//   er wordt dan nooit een ongeldig verzoek naar Resend gestuurd).
function bouwFromHeader(ruweWaarde) {
  if (typeof ruweWaarde !== "string") return null;
  const waarde = enkeleRegel(ruweWaarde);
  if (!waarde) return null;

  const metPunthaken = waarde.match(/^(.*)<([^<>]*)>$/);
  if (metPunthaken) {
    const naam = metPunthaken[1].trim();
    const emailDeel = metPunthaken[2].trim();
    if (!isValidEmail(emailDeel)) return null;
    return (naam || DEFAULT_FROM_DISPLAYNAAM) + " <" + emailDeel + ">";
  }

  if (isValidEmail(waarde)) {
    return DEFAULT_FROM_DISPLAYNAAM + " <" + waarde + ">";
  }

  return null;
}

// Bouwt een rustige, professionele HTML-e-mail op uit dezelfde label/waarde-
// secties als de platte-tekstversie — geen marketingvormgeving, alleen
// duidelijke koppen en regels. Alle WAARDEN worden HTML-geescaped (labels zijn
// vaste, vertrouwde tekst uit de eigen code, geen klantinvoer).
function bouwEmailHtml({ titel, secties, noot }) {
  let html = '<div style="font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;font-size:14px;line-height:1.5;max-width:600px;margin:0 auto;">';
  html += '<h2 style="color:#002B5C;margin:0 0 16px;font-size:19px;">' + escapeHtml(titel) + "</h2>";
  (secties || []).forEach((sectie) => {
    if (!sectie || ((!sectie.rows || sectie.rows.length === 0) && !sectie.tekst)) return;
    html += '<h3 style="color:#007A33;margin:20px 0 8px;font-size:14px;border-bottom:1px solid #e5e5e5;padding-bottom:4px;">' + escapeHtml(sectie.heading) + "</h3>";
    if (sectie.tekst) {
      html += '<p style="margin:0 0 8px;white-space:pre-line;">' + escapeHtml(sectie.tekst) + "</p>";
    }
    if (sectie.rows && sectie.rows.length > 0) {
      html += '<table role="presentation" style="width:100%;border-collapse:collapse;margin-bottom:8px;">';
      sectie.rows.forEach(([label, waarde]) => {
        html +=
          '<tr><td style="padding:3px 10px 3px 0;color:#555;white-space:nowrap;vertical-align:top;">' +
          escapeHtml(label) +
          '</td><td style="padding:3px 0;">' +
          escapeHtml(waarde) +
          "</td></tr>";
      });
      html += "</table>";
    }
  });
  if (noot) {
    html += '<p style="margin-top:20px;font-size:12px;color:#777;font-style:italic;">' + escapeHtml(noot) + "</p>";
  }
  html += "</div>";
  return html;
}

// =================================================================
// VERSTUREN VIA RESEND (server-to-server)
// =================================================================
// Gooit bij een fout een Error met een `.reden`-property:
//   "server_misconfigured" -> RESEND_API_KEY of RESEND_FROM_EMAIL ontbreekt;
//                             de aanroepende handler moet dit als 500 afhandelen,
//                             VOORDAT er ooit een netwerkaanroep is gedaan.
//   "send_failed"          -> Resend zelf wijst de aanvraag af, of een
//                             netwerkfout; de aanroepende handler moet dit als
//                             502 afhandelen. Details staan al veilig gelogd
//                             hieronder (nooit de API-key, nooit volledige
//                             klantgegevens).
async function verstuurEmail({ subject, html, text, replyTo, logPrefix }) {
  const prefix = logPrefix || "mail";
  const config = getResendConfig();

  // Veilige diagnostiek: uitsluitend welke omgevingsvariabelen ontbreken,
  // NOOIT de waarden zelf.
  console.log(prefix + ": RESEND_API_KEY aanwezig=" + !!config.apiKey + " RESEND_FROM_EMAIL aanwezig=" + !!config.from);

  if (config.ontbrekend.length > 0) {
    console.error(prefix + ": ontbrekende configuratie -- " + config.ontbrekend.join(", ") + " (omgevingsvariabele(n) niet ingesteld) -- er kan niets worden verstuurd.");
    const err = new Error("mail_misconfigured");
    err.reden = "server_misconfigured";
    throw err;
  }

  const body = {
    from: config.from,
    to: [config.to],
    subject: enkeleRegel(subject),
    html,
    text,
  };
  // Reply-To (ronde 48, Deel B, briefpunt 9): bij een geldig klantadres
  // gaat een antwoord in Outlook/Gmail rechtstreeks naar de aanvrager. Een
  // ontbrekend of ONGELDIG klantadres mag nooit een kapotte of onveilige
  // mailheader veroorzaken -- daarom wordt het adres hier server-side
  // gevalideerd (isValidEmail) vóórdat het als Reply-To wordt gebruikt, en
  // valt de header bij twijfel altijd terug op het eigen, al gevalideerde
  // Brabantschoon-ontvangstadres (config.to) in plaats van simpelweg te
  // ontbreken. Zo heeft elke uitgaande mail altijd een veilige Reply-To.
  const veiligeReplyTo = replyTo && isValidEmail(replyTo) ? replyTo : config.to;
  body.reply_to = enkeleRegel(veiligeReplyTo);

  let resp;
  try {
    resp = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + config.apiKey,
      },
      body: JSON.stringify(body),
    });
  } catch (netwerkErr) {
    console.error(
      prefix + ": netwerkfout bij Resend-aanroep (geen respons ontvangen).",
      "type=" + (netwerkErr && netwerkErr.name ? netwerkErr.name : "onbekend"),
      "bericht=" + (netwerkErr && netwerkErr.message ? String(netwerkErr.message).slice(0, 300) : "onbekend")
    );
    const err = new Error("resend_network_failed");
    err.reden = "send_failed";
    throw err;
  }

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    // Veilige diagnostiek: uitsluitend technische responsmetadata van Resend
    // zelf. NOOIT de API-key, NOOIT klantgegevens of de volledige payload.
    console.error(
      prefix + ": Resend-verzending mislukt.",
      "http_status=" + resp.status,
      "name=" + (data && data.name ? data.name : "(geen name-veld in response)"),
      "message=" + (data && data.message ? String(data.message).slice(0, 300) : "(geen message-veld in response)")
    );
    const err = new Error("resend_failed");
    err.reden = "send_failed";
    throw err;
  }

  return data; // { id: "<resend-email-id>" } bij succes
}

module.exports = {
  RESEND_ENDPOINT,
  DEFAULT_TO_EMAIL,
  DEFAULT_FROM_DISPLAYNAAM,
  getResendConfig,
  bouwFromHeader,
  escapeHtml,
  enkeleRegel,
  isValidEmail,
  bouwEmailHtml,
  verstuurEmail,
};
