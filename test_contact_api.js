// Test voor api/contact-aanvraag.js (het compacte contactformulier op
// contact.html EN het footer-terugbelformulier op elke pagina -- beide delen
// hetzelfde `id="footerTerugbelForm"` en dus hetzelfde endpoint, dus één
// testsuite dekt beide). Controleert dat de e-mailtekst conditioneel wordt
// opgebouwd (geen lege bedrijfsnaam/bericht-regels), dat validatie/botdetectie
// werken, en dat verzending sinds ronde 43 via Resend loopt (lib/mail.js,
// zie CHANGELOG-43.md) i.p.v. Web3Forms: RESEND_API_KEY/RESEND_FROM_EMAIL
// komen uitsluitend uit process.env, nooit hardcoded, en het endpoint faalt
// veilig (geen "ok:true", geen secret-lek) wanneer ze ontbreken. Gebruikt
// uitsluitend verzonnen testwaarden, nooit een echte sleutel.
const assert = require('assert');
const fs = require('fs');
const api = require('./api/contact-aanvraag.js');
const { bouwEmailTekst, bouwEmailHtmlContact, lijktOpBot, valideerVerplichteVelden, isValidEmail, isValidTelefoon, CONFIG } = api._internal;

const volledigPayload = {
  naam: 'Marieke de Groot',
  telefoon: '0612345678',
  email: 'marieke@example.com',
  bedrijfsnaam: '',
  bericht: '',
  botcheck: false,
  form_rendered_at: String(Date.now() - 9000),
};

console.log('=== Test 1: e-mailtekst -- alleen ingevulde velden, geen lege bedrijfsnaam/bericht-regels ===');
{
  const tekst = bouwEmailTekst(volledigPayload);
  console.log('\n--- e-mailtekst ---\n' + tekst + '\n--- einde ---\n');
  assert.ok(tekst.includes('NIEUW TERUGBELVERZOEK'));
  assert.ok(tekst.includes('Marieke de Groot'));
  assert.ok(tekst.includes('0612345678'));
  assert.ok(tekst.includes('marieke@example.com'));
  assert.ok(!tekst.includes('Bedrijfsnaam:'), 'lege bedrijfsnaam mag geen regel opleveren');
  assert.ok(!tekst.includes('Bericht:'), 'leeg bericht mag geen regel opleveren');
  assert.ok(!/\bundefined\b|\bnull\b/.test(tekst));
  console.log('OK: alleen ingevulde velden in de e-mail.');
}

console.log('\n=== Test 1b (ronde 48, Deel B, briefpunt 11): vaste onderwerpregel is zakelijk en niet spamachtig ===');
{
  const onderwerp = CONFIG.SUBJECT;
  assert.ok(!/[!]/.test(onderwerp), 'onderwerpregel mag geen uitroepteken bevatten: ' + onderwerp);
  assert.ok(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(onderwerp), 'onderwerpregel mag geen emoji bevatten: ' + onderwerp);
  assert.ok(!/\b[A-Z]{4,}\b/.test(onderwerp), 'onderwerpregel mag geen overdreven hoofdletters bevatten: ' + onderwerp);
  assert.ok(!/gratis|korting|actie|nu bestellen|klik hier/i.test(onderwerp), 'onderwerpregel mag geen commerciële reclametaal/spamwoorden bevatten: ' + onderwerp);
  console.log('OK: de vaste onderwerpregel ("' + onderwerp + '") is zakelijk/herkenbaar, zonder uitroeptekens, emoji, overdreven hoofdletters of spamwoorden.');
}

console.log('\n=== Test 2: e-mailtekst met optionele velden ingevuld ===');
{
  const payload = { ...volledigPayload, bedrijfsnaam: 'Garagebedrijf Van Brussel B.V.', bericht: 'Graag deze week nog contact.' };
  const tekst = bouwEmailTekst(payload);
  assert.ok(tekst.includes('Bedrijfsnaam:'));
  assert.ok(tekst.includes('Garagebedrijf Van Brussel B.V.'));
  assert.ok(tekst.includes('Bericht:'));
  assert.ok(tekst.includes('Graag deze week nog contact.'));
  console.log('OK: optionele velden verschijnen zodra ze zijn ingevuld.');
}

console.log('\n=== Test 3: validatie verplichte velden (naam/telefoon/e-mail) -- ongeldig e-mailadres wordt geweerd ===');
{
  assert.deepStrictEqual(valideerVerplichteVelden(volledigPayload), []);
  const fouten = valideerVerplichteVelden({ naam: '', telefoon: 'x', email: 'niet-geldig' });
  assert.deepStrictEqual(fouten, ['naam', 'telefoon', 'email']);
  assert.strictEqual(isValidEmail('foo@bar.nl'), true);
  assert.strictEqual(isValidEmail('foobar'), false);
  assert.strictEqual(isValidTelefoon('0492 313050'), true);
  assert.strictEqual(isValidTelefoon('abc'), false);
  console.log('OK: validatie gedraagt zich zoals verwacht (zelfde regels als het HTML5 pattern-attribuut).');
}

console.log('\n=== Test 4: botdetectie (honeypot + te snel ingevuld) ===');
{
  assert.strictEqual(lijktOpBot({ botcheck: true, form_rendered_at: String(Date.now() - 9000) }), true);
  assert.strictEqual(lijktOpBot({ botcheck: false, form_rendered_at: String(Date.now() - 100) }), true);
  assert.strictEqual(lijktOpBot({ botcheck: false, form_rendered_at: String(Date.now() - 9000) }), false);
  console.log('OK: botdetectie gedraagt zich zoals verwacht.');
}

console.log('\n=== Test 5: geen Web3Forms/RESEND_API_KEY-literal meer in de actieve broncode ===');
{
  assert.ok(!('WEB3FORMS_ACCESS_KEY' in CONFIG), 'CONFIG mag geen WEB3FORMS_ACCESS_KEY-veld hebben');
  assert.ok(!('RESEND_API_KEY' in CONFIG), 'CONFIG mag geen RESEND_API_KEY-veld hebben -- die hoort alleen in process.env te staan');
  const eigenBroncode = fs.readFileSync(__dirname + '/api/contact-aanvraag.js', 'utf8');
  assert.ok(!/api\.web3forms\.com/i.test(eigenBroncode), 'api/contact-aanvraag.js mag geen Web3Forms-endpoint meer bevatten');
  assert.ok(!/WEB3FORMS_ACCESS_KEY/.test(eigenBroncode), 'api/contact-aanvraag.js mag WEB3FORMS_ACCESS_KEY niet meer noemen (volledig verwijderd, zie CHANGELOG-43.md)');
  assert.ok(!/re_[A-Za-z0-9]{10,}/.test(eigenBroncode), 'geen letterlijke Resend-sleutel (formaat re_...) in de broncode');
  console.log('OK: geen Web3Forms-afhankelijkheid en geen hardcoded sleutel meer in de actieve broncode.');
}

console.log('\n=== Test 6: bouwEmailHtmlContact() -- zelfde inhoud als de platte tekst, correct geescaped ===');
{
  const payload = { ...volledigPayload, bedrijfsnaam: 'Garagebedrijf Van Brussel B.V.', bericht: 'Graag deze week nog contact.' };
  const html = bouwEmailHtmlContact(payload);
  assert.ok(html.includes('Nieuw terugbelverzoek'));
  assert.ok(html.includes('Marieke de Groot'));
  assert.ok(html.includes('Garagebedrijf Van Brussel B.V.'));
  assert.ok(!/\bundefined\b|\bnull\b/.test(html));
  const kwaadPayload = { ...volledigPayload, bericht: '<script>alert(1)</script>' };
  const kwaadHtml = bouwEmailHtmlContact(kwaadPayload);
  assert.ok(!kwaadHtml.includes('<script>alert(1)</script>'), 'ongeescapete HTML/JS-injectie via het berichtveld mag niet voorkomen');
  assert.ok(kwaadHtml.includes('&lt;script&gt;alert(1)&lt;/script&gt;'), 'berichtveld moet HTML-geescaped in de mail staan');
  console.log('OK: HTML-mail bevat dezelfde gegevens als de tekstversie en escaped klantinvoer correct (HTML-injectiebescherming).');
}

function mockRes() {
  const res = { statusCode: null, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => { res.body = obj; return res; };
  return res;
}

function metEnv(vars, fn) {
  const orig = {};
  Object.keys(vars).forEach((k) => { orig[k] = process.env[k]; });
  return (async () => {
    try {
      Object.keys(vars).forEach((k) => {
        if (vars[k] === undefined) delete process.env[k];
        else process.env[k] = vars[k];
      });
      return await fn();
    } finally {
      Object.keys(vars).forEach((k) => {
        if (orig[k] === undefined) delete process.env[k];
        else process.env[k] = orig[k];
      });
    }
  })();
}

async function testHandlerZonderConfig() {
  console.log('\n=== Test 7: handler faalt veilig zonder RESEND_API_KEY/RESEND_FROM_EMAIL (geen "ok:true", geen secret-lek, geen netwerkaanroep) ===');
  const origConsoleError = console.error;
  const loggedLines = [];
  console.error = (...args) => { loggedLines.push(args.map(String).join(' ')); };
  let fetchAangeroepen = false;
  const origFetch = global.fetch;
  global.fetch = () => { fetchAangeroepen = true; return Promise.reject(new Error('mag niet aangeroepen worden')); };
  try {
    await metEnv({ RESEND_API_KEY: undefined, RESEND_FROM_EMAIL: undefined }, async () => {
      const req = { method: 'POST', body: JSON.stringify(volledigPayload) };
      const res = mockRes();
      await api(req, res);
      console.log('Statuscode zonder configuratie (verwacht 500):', res.statusCode);
      assert.strictEqual(res.statusCode, 500);
      assert.strictEqual(res.body.ok, false);
      assert.strictEqual(res.body.error, 'server_misconfigured');
      assert.strictEqual(fetchAangeroepen, false, 'zonder configuratie mag er nooit een Resend-aanroep gebeuren');
      const loggedText = loggedLines.join('\n');
      assert.ok(loggedText.includes('RESEND_API_KEY'));
      assert.ok(!/re_[A-Za-z0-9]{10,}/.test(loggedText), 'log mag nergens een sleutelwaarde bevatten');
    });
  } finally {
    console.error = origConsoleError;
    global.fetch = origFetch;
  }
  console.log('OK: handler faalt veilig (500/ok:false/server_misconfigured), geen netwerkaanroep, geen secret in de log.');
}

async function testHandlerMetConfig() {
  console.log('\n=== Test 8: handler verstuurt normaal via Resend zodra configuratie aanwezig is (fetch gemockt); replyTo correct ===');
  const origFetch = global.fetch;
  try {
    let capturedBody = null;
    let capturedHeaders = null;
    global.fetch = (url, opts) => {
      capturedBody = JSON.parse(opts.body);
      capturedHeaders = opts.headers;
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ id: 'test-resend-id' }) });
    };
    await metEnv({ RESEND_API_KEY: 're_test_fake_5678', RESEND_FROM_EMAIL: 'Brabantschoon <noreply@brabantschoon.nl>', RESEND_TO_EMAIL: undefined }, async () => {
      const req = { method: 'POST', body: JSON.stringify(volledigPayload) };
      const res = mockRes();
      await api(req, res);
      console.log('Statuscode met (test-)configuratie (verwacht 200):', res.statusCode);
      assert.strictEqual(res.statusCode, 200);
      assert.deepStrictEqual(res.body, { ok: true });
      assert.strictEqual(capturedHeaders['Authorization'], 'Bearer re_test_fake_5678');
      assert.strictEqual(capturedBody.from, 'Brabantschoon <noreply@brabantschoon.nl>');
      assert.deepStrictEqual(capturedBody.to, ['info@brabantschoon.nl']);
      assert.strictEqual(capturedBody.subject, CONFIG.SUBJECT);
      assert.strictEqual(capturedBody.reply_to, volledigPayload.email, 'reply_to moet het klant-e-mailadres zijn, zodat "Beantwoorden" naar de klant gaat');
    });
  } finally {
    global.fetch = origFetch;
  }
  console.log('OK: verzending verloopt normaal via Resend; subject identiek aan de vroegere hidden-inputwaarde; reply_to correct.');
}

async function testHandlerBotEnOntbrekendeVelden() {
  console.log('\n=== Test 9: handler -- bot krijgt stille ok:true, ontbrekende velden en ongeldig e-mailadres geven 400, verkeerde methode geeft 405 ===');
  const req1 = { method: 'POST', body: JSON.stringify({ ...volledigPayload, botcheck: true }) };
  const res1 = mockRes();
  await api(req1, res1);
  assert.strictEqual(res1.statusCode, 200);
  assert.deepStrictEqual(res1.body, { ok: true });
  console.log('OK: vermoedelijke bot krijgt stille ok:true (geen hint dat het geblokkeerd is).');

  const req2 = { method: 'POST', body: JSON.stringify({ naam: '', telefoon: '', email: '', form_rendered_at: String(Date.now() - 9000) }) };
  const res2 = mockRes();
  await api(req2, res2);
  assert.strictEqual(res2.statusCode, 400);
  assert.strictEqual(res2.body.ok, false);
  assert.strictEqual(res2.body.error, 'missing_fields');
  console.log('OK: ontbrekende verplichte velden geven een nette 400.');

  const req2b = { method: 'POST', body: JSON.stringify({ ...volledigPayload, email: 'niet-geldig-e-mailadres' }) };
  const res2b = mockRes();
  await api(req2b, res2b);
  assert.strictEqual(res2b.statusCode, 400);
  assert.strictEqual(res2b.body.error, 'missing_fields');
  console.log('OK: ongeldig e-mailadres wordt server-side geweerd (nette 400, nooit als reply_to gebruikt).');

  const req3 = { method: 'GET' };
  const res3 = mockRes();
  await api(req3, res3);
  assert.strictEqual(res3.statusCode, 405);
  console.log('OK: niet-POST-methode geeft 405.');
}

async function testHandlerResendAfgewezen() {
  console.log('\n=== Test 10: handler geeft 502 wanneer Resend de aanvraag zelf afwijst, en logt veilig ===');
  const origFetch = global.fetch;
  const origConsoleError = console.error;
  const loggedLines = [];
  console.error = (...args) => { loggedLines.push(args.map(String).join(' ')); };
  try {
    global.fetch = () => Promise.resolve({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ name: 'validation_error', statusCode: 403, message: 'The brabantschoon.nl domain is not verified' }),
    });
    await metEnv({ RESEND_API_KEY: 're_test_fake_0000', RESEND_FROM_EMAIL: 'Brabantschoon <noreply@brabantschoon.nl>' }, async () => {
      const req = { method: 'POST', body: JSON.stringify(volledigPayload) };
      const res = mockRes();
      await api(req, res);
      console.log('Statuscode wanneer Resend afwijst (verwacht 502):', res.statusCode);
      assert.strictEqual(res.statusCode, 502);
      assert.strictEqual(res.body.error, 'send_failed');
      const loggedText = loggedLines.join('\n');
      assert.ok(loggedText.includes('http_status=403'));
      assert.ok(loggedText.includes('not verified'));
      assert.ok(!loggedText.includes('re_test_fake_0000'), 'log mag NOOIT de API-key bevatten, ook niet een testwaarde');
      assert.ok(!loggedText.includes(volledigPayload.email), 'log mag NOOIT klantgegevens bevatten');
    });
  } finally {
    console.error = origConsoleError;
    global.fetch = origFetch;
  }
  console.log('OK: bij een afwijzing door Resend zelf krijgt de bezoeker alleen een generieke 502, en logt de server veilig zonder key of klantgegevens.');
}

(async () => {
  await testHandlerZonderConfig();
  await testHandlerMetConfig();
  await testHandlerBotEnOntbrekendeVelden();
  await testHandlerResendAfgewezen();
  console.log('\nAlle tests geslaagd.');
})().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
