// Test voor lib/mail.js -- de gedeelde Resend-mailhelper die zowel
// api/offerte-aanvraag.js als api/contact-aanvraag.js gebruiken. Controleert
// vooral: RESEND_API_KEY/RESEND_FROM_EMAIL komen uitsluitend uit process.env
// (nooit hardcoded), het endpoint faalt veilig (geen fetch-aanroep, geen
// secret-lek) wanneer die ontbreken, de Resend-aanroep zelf gebruikt de
// juiste headers/velden, en fouten worden veilig gelogd (nooit de API-key,
// nooit klantgegevens). Gebruikt uitsluitend verzonnen testwaarden, nooit een
// echte Resend-sleutel, en doet nooit een echt netwerkverzoek (fetch wordt
// altijd gemockt).
const assert = require('assert');
const mail = require('./lib/mail.js');
const { escapeHtml, enkeleRegel, isValidEmail, getResendConfig, bouwEmailHtml, verstuurEmail, DEFAULT_TO_EMAIL, RESEND_ENDPOINT } = mail;

function metEnv(vars, fn) {
  const orig = {};
  Object.keys(vars).forEach((k) => { orig[k] = process.env[k]; });
  try {
    Object.keys(vars).forEach((k) => {
      if (vars[k] === undefined) delete process.env[k];
      else process.env[k] = vars[k];
    });
    return fn();
  } finally {
    Object.keys(vars).forEach((k) => {
      if (orig[k] === undefined) delete process.env[k];
      else process.env[k] = orig[k];
    });
  }
}

console.log('=== Test 1: escapeHtml() escaped alle gevaarlijke tekens ===');
{
  assert.strictEqual(escapeHtml('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;');
  assert.strictEqual(escapeHtml('Jan & "Piet" \'De Vries\''), 'Jan &amp; &quot;Piet&quot; &#39;De Vries&#39;');
  assert.strictEqual(escapeHtml(null), '');
  assert.strictEqual(escapeHtml(undefined), '');
  console.log('OK: escapeHtml() voorkomt HTML-injectie in klantwaarden.');
}

console.log('\n=== Test 2: enkeleRegel() verwijdert regeleindes/besturingstekens (header-injectiebescherming) ===');
{
  assert.strictEqual(enkeleRegel('Normale tekst'), 'Normale tekst');
  assert.strictEqual(enkeleRegel('Regel1\r\nBcc: kwaadaardig@voorbeeld.com\r\nRegel2'), 'Regel1 Bcc: kwaadaardig@voorbeeld.com Regel2');
  assert.strictEqual(enkeleRegel('  spaties  '), 'spaties');
  assert.strictEqual(enkeleRegel(null), '');
  console.log('OK: enkeleRegel() strip regeleindes/besturingstekens uit subject/reply_to-achtige velden.');
}

console.log('\n=== Test 3: isValidEmail() ===');
{
  assert.strictEqual(isValidEmail('info@brabantschoon.nl'), true);
  assert.strictEqual(isValidEmail('niet-geldig'), false);
  assert.strictEqual(isValidEmail(''), false);
  console.log('OK: isValidEmail() gedraagt zich zoals verwacht.');
}

console.log('\n=== Test 4: getResendConfig() -- RESEND_API_KEY/RESEND_FROM_EMAIL uitsluitend uit process.env, RESEND_TO_EMAIL heeft veilige default ===');
{
  metEnv({ RESEND_API_KEY: undefined, RESEND_FROM_EMAIL: undefined, RESEND_TO_EMAIL: undefined }, () => {
    const cfg = getResendConfig();
    assert.strictEqual(cfg.apiKey, null);
    assert.strictEqual(cfg.from, null, 'RESEND_FROM_EMAIL heeft GEEN code-default -- en dus zeker geen hardcoded noreply@-adres');
    assert.strictEqual(cfg.to, DEFAULT_TO_EMAIL);
    assert.strictEqual(cfg.to, 'info@brabantschoon.nl');
    assert.deepStrictEqual(cfg.ontbrekend.sort(), ['RESEND_API_KEY', 'RESEND_FROM_EMAIL']);
  });
  metEnv({ RESEND_API_KEY: 're_test_fake_1234', RESEND_FROM_EMAIL: 'Brabantschoon <info@brabantschoon.nl>', RESEND_TO_EMAIL: 'aanvragen@brabantschoon.nl' }, () => {
    const cfg = getResendConfig();
    assert.strictEqual(cfg.apiKey, 're_test_fake_1234');
    assert.strictEqual(cfg.from, 'Brabantschoon <info@brabantschoon.nl>');
    assert.ok(cfg.from.includes('@brabantschoon.nl'), 'het From-adres moet op het brabantschoon.nl-domein staan (alignment)');
    assert.ok(!/noreply/i.test(cfg.from), 'het geconfigureerde From-adres in dit voorbeeld is bewust geen noreply-adres');
    assert.strictEqual(cfg.to, 'aanvragen@brabantschoon.nl');
    assert.deepStrictEqual(cfg.ontbrekend, []);
  });
  console.log('OK: config komt uitsluitend uit process.env (geen hardcoded noreply-default); RESEND_TO_EMAIL valt terug op het bestaande, publieke info@brabantschoon.nl-adres (geen secret).');
}

console.log('\n=== Test 5: bouwEmailHtml() escaped waarden, laat lege secties weg ===');
{
  const html = bouwEmailHtml({
    titel: 'Test <titel>',
    secties: [
      { heading: 'Sectie A', rows: [['Naam', '<script>kwaad()</script>']] },
      { heading: 'Lege sectie', rows: [] },
    ],
    noot: 'Een noot & wat "aanhalingstekens"',
  });
  assert.ok(html.includes('&lt;script&gt;kwaad()&lt;/script&gt;'), 'waarde moet geescaped zijn');
  assert.ok(!html.includes('<script>kwaad()</script>'), 'ongeescapete script-tag mag niet in de HTML staan');
  assert.ok(!html.includes('Lege sectie'), 'een sectie zonder rows/tekst mag niet worden weergegeven');
  assert.ok(html.includes('Een noot &amp; wat &quot;aanhalingstekens&quot;'));
  console.log('OK: bouwEmailHtml() escaped klantwaarden en laat lege secties weg.');
}

function mockFetchOk(captureBody) {
  return (url, opts) => {
    if (captureBody) captureBody.url = url, captureBody.opts = opts, captureBody.body = JSON.parse(opts.body);
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ id: 'test-resend-id-0000' }) });
  };
}

async function testVerstuurEmailZonderConfig() {
  console.log('\n=== Test 6: verstuurEmail() faalt veilig zonder RESEND_API_KEY/RESEND_FROM_EMAIL -- NOOIT een fetch-aanroep ===');
  const origConsoleError = console.error;
  const loggedLines = [];
  console.error = (...args) => { loggedLines.push(args.map(String).join(' ')); };
  let fetchAangeroepen = false;
  const origFetch = global.fetch;
  global.fetch = () => { fetchAangeroepen = true; return Promise.reject(new Error('fetch had niet aangeroepen mogen worden')); };
  try {
    await metEnv({ RESEND_API_KEY: undefined, RESEND_FROM_EMAIL: undefined }, async () => {
      let gegooid = null;
      try {
        await verstuurEmail({ subject: 'Test', html: '<p>x</p>', text: 'x', replyTo: 'klant@voorbeeld.com', logPrefix: 'test' });
      } catch (err) {
        gegooid = err;
      }
      assert.ok(gegooid, 'verstuurEmail() moet gooien wanneer configuratie ontbreekt');
      assert.strictEqual(gegooid.reden, 'server_misconfigured');
      assert.strictEqual(fetchAangeroepen, false, 'zonder geldige configuratie mag er NOOIT een netwerkaanroep naar Resend gebeuren');
      const loggedText = loggedLines.join('\n');
      assert.ok(loggedText.includes('RESEND_API_KEY'), 'log moet vermelden welke variabele ontbreekt');
      assert.ok(loggedText.includes('RESEND_FROM_EMAIL'), 'log moet vermelden welke variabele ontbreekt');
      assert.ok(!loggedText.includes('re_'), 'log mag nooit een sleutelwaarde bevatten');
    });
  } finally {
    console.error = origConsoleError;
    global.fetch = origFetch;
  }
  console.log('OK: geen configuratie -> reden=server_misconfigured, geen fetch-aanroep, geen secret in de log.');
}

async function testVerstuurEmailNormaal() {
  console.log('\n=== Test 7: verstuurEmail() verstuurt correct via Resend (fetch gemockt, nooit een echt netwerkverzoek) ===');
  const origFetch = global.fetch;
  const captured = {};
  global.fetch = mockFetchOk(captured);
  try {
    await metEnv({ RESEND_API_KEY: 're_test_fake_1234', RESEND_FROM_EMAIL: 'Brabantschoon <noreply@brabantschoon.nl>', RESEND_TO_EMAIL: undefined }, async () => {
      const result = await verstuurEmail({
        subject: 'Nieuwe aanvraag\r\nBcc: kwaad@voorbeeld.com',
        html: '<p>hallo</p>',
        text: 'hallo',
        replyTo: 'klant@voorbeeld.com',
        logPrefix: 'test',
      });
      assert.deepStrictEqual(result, { id: 'test-resend-id-0000' });
      assert.strictEqual(captured.url, RESEND_ENDPOINT);
      assert.strictEqual(captured.opts.headers['Authorization'], 'Bearer re_test_fake_1234');
      assert.strictEqual(captured.opts.headers['Content-Type'], 'application/json');
      assert.strictEqual(captured.body.from, 'Brabantschoon <noreply@brabantschoon.nl>');
      assert.deepStrictEqual(captured.body.to, ['info@brabantschoon.nl']);
      assert.strictEqual(captured.body.subject, 'Nieuwe aanvraag Bcc: kwaad@voorbeeld.com', 'subject moet ontdaan zijn van regeleindes (header-injectiebescherming)');
      assert.strictEqual(captured.body.reply_to, 'klant@voorbeeld.com');
      assert.strictEqual(captured.body.html, '<p>hallo</p>');
      assert.strictEqual(captured.body.text, 'hallo');
    });
  } finally {
    global.fetch = origFetch;
  }
  console.log('OK: correcte Authorization-header (Bearer), from/to/subject/html/text/reply_to-velden, RESEND_TO_EMAIL valt terug op info@brabantschoon.nl.');
}

async function testVerstuurEmailOngeldigeReplyTo() {
  console.log('\n=== Test 8 (ronde 48, Deel B, briefpunt 9): ongeldig/ontbrekend replyTo -> veilige fallback naar het eigen Brabantschoon-adres, NOOIT een kapotte header ===');
  const origFetch = global.fetch;
  const captured = {};
  global.fetch = mockFetchOk(captured);
  try {
    await metEnv({ RESEND_API_KEY: 're_test_fake_1234', RESEND_FROM_EMAIL: 'Brabantschoon <info@brabantschoon.nl>', RESEND_TO_EMAIL: 'aanvragen@brabantschoon.nl' }, async () => {
      // Ongeldig (bijv. gemanipuleerd) klantadres: reply_to moet nooit
      // ontbreken, kapot zijn, of het ongeldige adres doorzetten -- het valt
      // veilig terug op het eigen, al gevalideerde ontvangstadres.
      await verstuurEmail({ subject: 'Test', html: '<p>x</p>', text: 'x', replyTo: 'niet-geldig', logPrefix: 'test' });
      assert.strictEqual(captured.body.reply_to, 'aanvragen@brabantschoon.nl', 'bij een ongeldig replyTo-adres moet reply_to veilig terugvallen op het eigen Brabantschoon-adres (RESEND_TO_EMAIL)');
    });
    captured.body = null;
    await metEnv({ RESEND_API_KEY: 're_test_fake_1234', RESEND_FROM_EMAIL: 'Brabantschoon <info@brabantschoon.nl>', RESEND_TO_EMAIL: 'aanvragen@brabantschoon.nl' }, async () => {
      // Ontbrekend replyTo (bijv. contactformulier zonder e-mailveld): zelfde
      // veilige fallback, nooit een lege/ontbrekende reply_to-header.
      await verstuurEmail({ subject: 'Test', html: '<p>x</p>', text: 'x', logPrefix: 'test' });
      assert.strictEqual(captured.body.reply_to, 'aanvragen@brabantschoon.nl', 'zonder replyTo moet reply_to ook veilig terugvallen op het eigen Brabantschoon-adres');
    });
  } finally {
    global.fetch = origFetch;
  }
  console.log('OK: een ongeldig of ontbrekend klantadres veroorzaakt nooit een kapotte/onveilige reply_to-header -- altijd een veilige, geldige fallback.');
}

console.log('\n=== Test 8b (ronde 48, Deel B): geen tracking-parameters, geen scripts/tracking-pixels/forms in de mail ===');
{
  const html = bouwEmailHtml({
    titel: 'Nieuwe zakelijke offerteaanvraag',
    secties: [{ heading: 'Aanvraag', rows: [['Naam', 'Test Persoon']] }],
    noot: 'Interne calculatie – niet automatisch aan de klant gecommuniceerd en geen definitieve offerte.',
  });
  assert.ok(!/<script/i.test(html), 'de HTML-mail mag geen <script> bevatten');
  assert.ok(!/<form/i.test(html), 'de HTML-mail mag geen <form> bevatten');
  assert.ok(!/<img/i.test(html), 'de HTML-mail mag geen afbeeldingen (bijv. tracking pixels) bevatten');
  assert.ok(!/onclick|onload|onerror=/i.test(html), 'de HTML-mail mag geen inline event-handlers bevatten');
  console.log('OK: de HTML-mail bevat geen scripts, forms, afbeeldingen/tracking-pixels of inline event-handlers -- een eenvoudige, transactionele melding.');
}

async function testVerstuurEmailGeenTrackingParams() {
  console.log('\n=== Test 8c (ronde 48, Deel B, briefpunt 13): geen tracking-parameters in de Resend-aanroep vanuit onze eigen code ===');
  const origFetch = global.fetch;
  const captured = {};
  global.fetch = mockFetchOk(captured);
  try {
    await metEnv({ RESEND_API_KEY: 're_test_fake_1234', RESEND_FROM_EMAIL: 'Brabantschoon <info@brabantschoon.nl>' }, async () => {
      await verstuurEmail({ subject: 'Test', html: '<p>x</p>', text: 'x', replyTo: 'klant@voorbeeld.com', logPrefix: 'test' });
      assert.ok(!('tags' in captured.body), 'de Resend-aanroep mag geen tags/trackingvelden meesturen vanuit onze code');
      assert.ok(!('track_opens' in captured.body) && !('open_tracking' in captured.body), 'geen open-tracking-parameter vanuit onze code');
      assert.ok(!('track_clicks' in captured.body) && !('click_tracking' in captured.body), 'geen klik-tracking-parameter vanuit onze code');
      const verwachteSleutels = ['from', 'to', 'subject', 'html', 'text', 'reply_to'].sort();
      assert.deepStrictEqual(Object.keys(captured.body).sort(), verwachteSleutels, 'de Resend-requestbody mag alleen de bekende, noodzakelijke velden bevatten -- niets extra\'s zoals tracking- of marketingparameters');
    });
  } finally {
    global.fetch = origFetch;
  }
  console.log('OK: onze eigen code stuurt geen enkele tracking-parameter mee naar Resend -- eventuele tracking kan dus alleen dashboard-/accountconfiguratie bij Resend zelf zijn.');
}

async function testVerstuurEmailResendFout() {
  console.log('\n=== Test 9: verstuurEmail() geeft reden=send_failed door bij een Resend-foutrespons, en logt veilig ===');
  const origFetch = global.fetch;
  const origConsoleError = console.error;
  const loggedLines = [];
  console.error = (...args) => { loggedLines.push(args.map(String).join(' ')); };
  global.fetch = () => Promise.resolve({
    ok: false,
    status: 403,
    json: () => Promise.resolve({ name: 'validation_error', statusCode: 403, message: 'The brabantschoon.nl domain is not verified' }),
  });
  try {
    await metEnv({ RESEND_API_KEY: 're_test_fake_1234', RESEND_FROM_EMAIL: 'Brabantschoon <noreply@brabantschoon.nl>' }, async () => {
      let gegooid = null;
      try {
        await verstuurEmail({ subject: 'Test', html: '<p>x</p>', text: 'x', replyTo: 'klant@voorbeeld.com', logPrefix: 'test' });
      } catch (err) {
        gegooid = err;
      }
      assert.ok(gegooid);
      assert.strictEqual(gegooid.reden, 'send_failed');
      const loggedText = loggedLines.join('\n');
      assert.ok(loggedText.includes('http_status=403'));
      assert.ok(loggedText.includes('validation_error'));
      assert.ok(loggedText.includes('not verified'));
      assert.ok(!loggedText.includes('re_test_fake_1234'), 'log mag nooit de API-key bevatten');
      assert.ok(!loggedText.includes('klant@voorbeeld.com'), 'log mag geen klantgegevens bevatten');
    });
  } finally {
    console.error = origConsoleError;
    global.fetch = origFetch;
  }
  console.log('OK: Resend-foutrespons -> reden=send_failed, veilige log (status/name/message, nooit key/klantgegevens).');
}

async function testVerstuurEmailNetwerkfout() {
  console.log('\n=== Test 10: verstuurEmail() geeft reden=send_failed door bij een netwerkfout (geen respons van Resend) ===');
  const origFetch = global.fetch;
  global.fetch = () => Promise.reject(new Error('getaddrinfo ENOTFOUND api.resend.com'));
  try {
    await metEnv({ RESEND_API_KEY: 're_test_fake_1234', RESEND_FROM_EMAIL: 'Brabantschoon <noreply@brabantschoon.nl>' }, async () => {
      let gegooid = null;
      try {
        await verstuurEmail({ subject: 'Test', html: '<p>x</p>', text: 'x', logPrefix: 'test' });
      } catch (err) {
        gegooid = err;
      }
      assert.ok(gegooid);
      assert.strictEqual(gegooid.reden, 'send_failed');
    });
  } finally {
    global.fetch = origFetch;
  }
  console.log('OK: netwerkfout -> ook veilig afgevangen als reden=send_failed.');
}

(async () => {
  await testVerstuurEmailZonderConfig();
  await testVerstuurEmailNormaal();
  await testVerstuurEmailOngeldigeReplyTo();
  await testVerstuurEmailGeenTrackingParams();
  await testVerstuurEmailResendFout();
  await testVerstuurEmailNetwerkfout();
  console.log('\nAlle tests geslaagd.');
})().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
