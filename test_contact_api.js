// Test voor api/contact-aanvraag.js (het footer-terugbelformulier): controleert
// dat de e-mailtekst conditioneel wordt opgebouwd (geen lege bedrijfsnaam/
// bericht-regels), dat validatie/botdetectie werken, en vooral dat de
// WEB3FORMS_ACCESS_KEY uitsluitend uit process.env komt -- nooit hardcoded --
// en dat het endpoint veilig faalt (geen "ok:true", geen secret-lek) wanneer
// die omgevingsvariabele ontbreekt. Gebruikt uitsluitend verzonnen testwaarden,
// nooit de echte Web3Forms-sleutel.
const assert = require('assert');
const api = require('./api/contact-aanvraag.js');
const { bouwEmailTekst, lijktOpBot, valideerVerplichteVelden, getWeb3FormsAccessKey, isValidEmail, isValidTelefoon, CONFIG } = api._internal;

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

console.log('\n=== Test 3: validatie verplichte velden (naam/telefoon/e-mail) ===');
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

console.log('\n=== Test 5: WEB3FORMS_ACCESS_KEY uitsluitend uit process.env, nooit hardcoded ===');
{
  assert.ok(!('WEB3FORMS_ACCESS_KEY' in CONFIG), 'CONFIG mag geen WEB3FORMS_ACCESS_KEY-veld hebben');
  const origKey = process.env.WEB3FORMS_ACCESS_KEY;
  try {
    delete process.env.WEB3FORMS_ACCESS_KEY;
    assert.strictEqual(getWeb3FormsAccessKey(), null);
    process.env.WEB3FORMS_ACCESS_KEY = 'test-fake-key-niet-echt-5678';
    assert.strictEqual(getWeb3FormsAccessKey(), 'test-fake-key-niet-echt-5678');
    console.log('OK: getWeb3FormsAccessKey() gedraagt zich correct.');
  } finally {
    if (origKey === undefined) delete process.env.WEB3FORMS_ACCESS_KEY; else process.env.WEB3FORMS_ACCESS_KEY = origKey;
  }
}

function mockRes() {
  const res = { statusCode: null, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => { res.body = obj; return res; };
  return res;
}

async function testHandlerZonderAccessKey() {
  console.log('\n=== Test 6: handler faalt veilig zonder WEB3FORMS_ACCESS_KEY ===');
  const origKey = process.env.WEB3FORMS_ACCESS_KEY;
  const origConsoleError = console.error;
  const loggedLines = [];
  console.error = (...args) => { loggedLines.push(args.join(' ')); };
  try {
    delete process.env.WEB3FORMS_ACCESS_KEY;
    const req = { method: 'POST', body: JSON.stringify(volledigPayload) };
    const res = mockRes();
    await api(req, res);
    console.log('Statuscode zonder access key (verwacht 500):', res.statusCode);
    assert.strictEqual(res.statusCode, 500);
    assert.strictEqual(res.body.ok, false);
    assert.strictEqual(res.body.error, 'server_misconfigured');
    const loggedText = loggedLines.join('\n');
    assert.ok(loggedText.includes('WEB3FORMS_ACCESS_KEY ontbreekt'));
    assert.ok(!/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(loggedText), 'log mag geen sleutelwaarde bevatten');
    console.log('OK: handler faalt veilig (500/ok:false/server_misconfigured), logt nooit een waarde.');
  } finally {
    console.error = origConsoleError;
    if (origKey === undefined) delete process.env.WEB3FORMS_ACCESS_KEY; else process.env.WEB3FORMS_ACCESS_KEY = origKey;
  }
}

async function testHandlerMetAccessKey() {
  console.log('\n=== Test 7: handler verstuurt normaal zodra WEB3FORMS_ACCESS_KEY aanwezig is (fetch gemockt) ===');
  const origKey = process.env.WEB3FORMS_ACCESS_KEY;
  const origFetch = global.fetch;
  try {
    process.env.WEB3FORMS_ACCESS_KEY = 'test-fake-key-niet-echt-5678';
    let capturedFetchBody = null;
    global.fetch = (url, opts) => {
      capturedFetchBody = JSON.parse(opts.body);
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
    };
    const req = { method: 'POST', body: JSON.stringify(volledigPayload) };
    const res = mockRes();
    await api(req, res);
    console.log('Statuscode met (test-)access key (verwacht 200):', res.statusCode);
    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(res.body, { ok: true });
    assert.strictEqual(capturedFetchBody.access_key, 'test-fake-key-niet-echt-5678');
    assert.strictEqual(capturedFetchBody.subject, 'Terugbelverzoek via de footer (geen volledige offerteaanvraag)');
    console.log('OK: verzending verloopt normaal; subject identiek aan de vroegere hidden-inputwaarde.');
  } finally {
    global.fetch = origFetch;
    if (origKey === undefined) delete process.env.WEB3FORMS_ACCESS_KEY; else process.env.WEB3FORMS_ACCESS_KEY = origKey;
  }
}

async function testHandlerBotEnOntbrekendeVelden() {
  console.log('\n=== Test 8: handler -- bot krijgt stille ok:true, ontbrekende velden geven 400 ===');
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

  const req3 = { method: 'GET' };
  const res3 = mockRes();
  await api(req3, res3);
  assert.strictEqual(res3.statusCode, 405);
  console.log('OK: niet-POST-methode geeft 405.');
}

(async () => {
  await testHandlerZonderAccessKey();
  await testHandlerMetAccessKey();
  await testHandlerBotEnOntbrekendeVelden();
  console.log('\nAlle tests geslaagd.');
})().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
