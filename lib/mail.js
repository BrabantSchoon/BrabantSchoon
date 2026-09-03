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
// wijzigen tussen aanroepen door). `RESEND_API_KEY` en `RESEND_FROM_EMAIL`
// hebben BEWUST geen fallbackwaarde in code: een verzonnen afzenderadres zonder
// domeinverificatie zou de verzending toch laten mislukken bij Resend zelf, en
// het is aan de ondernemer om een geverifieerd `brabantschoon.nl`-adres te
// kiezen (zie README "Secrets & environment variables"). `RESEND_TO_EMAIL` mag
// wél een veilige default hebben: dat is simpelweg het bestaande, overal al
// zichtbare bedrijfsadres, geen secret.
function getResendConfig() {
  const apiKey = leesEnv("RESEND_API_KEY");
  const from = leesEnv("RESEND_FROM_EMAIL");
  const to = leesEnv("RESEND_TO_EMAIL") || DEFAULT_TO_EMAIL;
  const ontbrekend = [];
  if (!apiKey) ontbrekend.push("RESEND_API_KEY");
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
  getResendConfig,
  escapeHtml,
  enkeleRegel,
  isValidEmail,
  bouwEmailHtml,
  verstuurEmail,
};
