// Regressietest: simuleert de "Garagebedrijf Van Brussel"-scenario (en een
// aantal andere flows) door offerte.html + js/main.js in jsdom te laden en de
// wizard te bedienen zoals een echte gebruiker, om te controleren dat:
// - de stap-hernummering (9 nieuw ingevoegd, 10/11/12 verschoven) correct werkt;
// - de nieuwe zakelijke velden (ruimtes/vervuiling/moment) goed worden opgehaald;
// - buildOffertePayload() een schone payload bouwt zonder rommel;
// - de particuliere flow niet is aangetast.
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync(path.join(__dirname, 'offerte.html'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, 'js/main.js'), 'utf8');

function makeDom() {
  const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://www.brabantschoon.nl/offerte.html' });
  // jsdom implementeert scrollIntoView niet (bekende beperking, geen bug in
  // main.js) -- stub globaal zodat form.scrollIntoView(...) in show() niet
  // een onafgehandelde fout in de event-listener veroorzaakt tijdens tests.
  dom.window.Element.prototype.scrollIntoView = () => {};
  dom.window.eval(js);
  return dom;
}

function click(el) { el.dispatchEvent(new el.ownerDocument.defaultView.Event('click', { bubbles: true })); }
function setRadio(doc, name, value, customerTypeScope) {
  // Sommige diensten (bijv. "Glasbewassing") komen zowel in de zakelijke als
  // de particuliere lijst voor met dezelfde label/value -- scope dan op
  // data-customer-types om de juiste (anders dubbelzinnige) radio te pakken.
  let candidates = Array.from(doc.querySelectorAll(`input[name="${name}"]`)).filter(r => r.value === value);
  if (candidates.length > 1 && customerTypeScope) {
    candidates = candidates.filter(r => {
      const wrap = r.closest('.rc-wrap');
      const types = wrap && wrap.getAttribute('data-customer-types');
      return types && types.split(' ').includes(customerTypeScope);
    });
  }
  const el = candidates[0];
  if (!el) throw new Error(`radio not found: ${name}=${value}${customerTypeScope ? ' (scope=' + customerTypeScope + ')' : ''}`);
  el.checked = true;
  el.dispatchEvent(new doc.defaultView.Event('change', { bubbles: true }));
}
function setChecked(doc, selector, checked) {
  const el = doc.querySelector(selector);
  if (!el) throw new Error(`checkbox not found: ${selector}`);
  el.checked = checked;
  el.dispatchEvent(new doc.defaultView.Event('change', { bubbles: true }));
}
function setValue(doc, selector, value) {
  const el = doc.querySelector(selector);
  if (!el) throw new Error(`field not found: ${selector}`);
  el.value = value;
  el.dispatchEvent(new doc.defaultView.Event('input', { bubbles: true }));
}
function next(doc) { click(doc.getElementById('wizardNext')); }
function setPakketRadio(doc, dienstSlug, value) {
  // Pakketnamen ("Basis"/"Uitgebreid"/"Compleet"/...) worden per particuliere
  // dienst hergebruikt, dus zoek altijd binnen de .rc-wrap[data-dienst-for]
  // van de huidige dienst om de juiste (niet een gelijknamige van een andere
  // dienst) te pakken.
  const wrap = Array.from(doc.querySelectorAll(`.rc-wrap[data-dienst-for="${dienstSlug}"]`)).find(w => {
    const input = w.querySelector('input[name="pakket"]');
    return input && input.value === value;
  });
  if (!wrap) throw new Error(`pakket not found: dienst=${dienstSlug} value=${value}`);
  const el = wrap.querySelector('input[name="pakket"]');
  el.checked = true;
  el.dispatchEvent(new doc.defaultView.Event('change', { bubbles: true }));
}

console.log('=== Scenario 1: Garagebedrijf Van Brussel (regressietest brief-scenario) ===');
{
  const dom = makeDom();
  const doc = dom.window.document;
  setRadio(doc, 'klanttype', 'Bedrijf');
  next(doc);
  setRadio(doc, 'dienst', 'Periodieke bedrijfsschoonmaak');
  next(doc);
  setRadio(doc, 'oppervlakte', 'Klein');
  next(doc);
  setRadio(doc, 'frequentie', 'Wekelijks');
  next(doc);
  // stap 9 (nieuw): ruimtes + vervuiling + moment
  setChecked(doc, '#zakelijkRuimtes input[data-ruimte-id="ruimte_kantoor"]', true);
  setChecked(doc, '#zakelijkRuimtes input[data-ruimte-id="ruimte_kantine"]', true);
  setRadio(doc, 'vervuilingsgraad_zakelijk', 'Bovengemiddelde vervuiling');
  setRadio(doc, 'schoonmaakmoment', 'Geen voorkeur / in overleg');
  next(doc);
  // stap 10: toelichting
  setValue(doc, '#aantal_locaties', '1');
  setValue(doc, '#bericht', 'Kantine en kantoor van een autogarage');
  next(doc);
  // stap 11: gegevens
  setValue(doc, '#naam', 'Frank Verberne');
  setValue(doc, '#bedrijfsnaam', 'Garagebedrijf Van Brussel B.V.');
  setValue(doc, '#email', 'frank@vanbrussel.nl');
  setValue(doc, '#telefoon', '0492123456');
  setValue(doc, '#plaats', 'Liessel');
  next(doc);
  // stap 12: controle - lees de samenvatting + bouw de payload zoals submit dat zou doen
  const summaryRows = Array.from(doc.querySelectorAll('#wizardSummary .summary-row')).map(r => [r.querySelector('dt').textContent, r.querySelector('dd').textContent]);
  console.log('Samenvatting op scherm (' + summaryRows.length + ' regels):');
  summaryRows.forEach(([k, v]) => console.log('  ' + k + ': ' + v));
  const zeroFields = summaryRows.filter(([k, v]) => /^0$/.test(v) || v === 'undefined' || v === 'null' || v === '');
  console.log('Regels met 0/undefined/null/leeg:', zeroFields.length);
  const currentStep = doc.querySelector('.wizard-step:not([hidden])').dataset.step;
  console.log('Huidige stap (verwacht 12):', currentStep);
}

console.log('\n=== Scenario 2: particuliere flow (grote schoonmaak, Compleet) blijft werken ===');
{
  const dom = makeDom();
  const doc = dom.window.document;
  setRadio(doc, 'klanttype', 'Particulier');
  next(doc);
  setRadio(doc, 'dienst', 'Eenmalige grote schoonmaak');
  next(doc);
  setRadio(doc, 'pakket', 'Compleet');
  next(doc);
  setValue(doc, '#typewoning', 'Eengezinswoning');
  setRadio(doc, 'woonoppervlakte_staffel', 't/m 60 m²');
  setRadio(doc, 'vervuilingsgraad', 'Normaal vervuild');
  next(doc);
  const prijsBlok = doc.getElementById('prijsBlokExtra').textContent;
  console.log('Live prijsindicatie zichtbaar op Extra-stap:', /€\d/.test(prijsBlok));
  const currentStep = doc.querySelector('.wizard-step:not([hidden])').dataset.step;
  console.log('Huidige stap na 3x Volgende (verwacht 5):', currentStep);
  // Controleer dat de nieuwe zakelijke stap 9 nooit in de applicable-steps zit voor particulier
  console.log('Stap 9 zichtbaar (moet hidden zijn):', doc.querySelector('.wizard-step[data-step="9"]').hidden);
}

console.log('\n=== Scenario 3: andere zakelijke dienst zonder calculator (Winkel- of showroomreiniging) krijgt GEEN stap 9 ===');
{
  // Ronde 44: Kantoorreiniging kreeg WEL een calculator (zie Scenario 3b) --
  // deze test gebruikt daarom een dienst die dat bewust niet kreeg, om de
  // "niet elke zakelijke dienst krijgt stap 9"-aanname te blijven dekken.
  const dom = makeDom();
  const doc = dom.window.document;
  setRadio(doc, 'klanttype', 'Bedrijf');
  next(doc);
  setRadio(doc, 'dienst', 'Winkel- of showroomreiniging');
  next(doc);
  setRadio(doc, 'oppervlakte', 'Middel');
  next(doc);
  setRadio(doc, 'frequentie', 'Wekelijks');
  next(doc);
  // Nu zou stap 9 moeten worden overgeslagen (niet van toepassing) -> direct naar stap 10 (toelichting)
  const currentStep = doc.querySelector('.wizard-step:not([hidden])').dataset.step;
  console.log('Huidige stap na Frequentie->Volgende (verwacht 10, stap 9 overgeslagen):', currentStep);
}

console.log('\n=== Scenario 3b: Kantoorreiniging krijgt nu WEL stap 9 + interne calculatie (ronde 44 calculatorbereik-uitbreiding) ===');
{
  const dom = makeDom();
  const doc = dom.window.document;
  setRadio(doc, 'klanttype', 'Bedrijf');
  next(doc);
  setRadio(doc, 'dienst', 'Kantoorreiniging');
  next(doc);
  setRadio(doc, 'oppervlakte', 'Klein');
  next(doc);
  setRadio(doc, 'frequentie', 'Wekelijks');
  next(doc);
  const stepNaFrequentie = doc.querySelector('.wizard-step:not([hidden])').dataset.step;
  console.log('Stap na Frequentie->Volgende voor Kantoorreiniging (verwacht 9, NIET meer overgeslagen):', stepNaFrequentie);
  setChecked(doc, '#zakelijkRuimtes input[data-ruimte-id="ruimte_kantoor"]', true);
  setChecked(doc, '#zakelijkRuimtes input[data-ruimte-id="ruimte_kantine"]', true);
  setChecked(doc, '#zakelijkRuimtes input[data-ruimte-id="ruimte_toiletten"]', true);
  setRadio(doc, 'vervuilingsgraad_zakelijk', 'Bovengemiddelde vervuiling');
  setRadio(doc, 'schoonmaakmoment', 'Na sluiting');
  next(doc);
  setValue(doc, '#bericht', 'Wekelijkse kantoorreiniging');
  next(doc);
  setValue(doc, '#naam', 'Test Kantoor');
  setValue(doc, '#email', 'test@voorbeeld.nl');
  setValue(doc, '#telefoon', '0611112222');
  setValue(doc, '#plaats', 'Helmond');
  next(doc);
  const rows = Array.from(doc.querySelectorAll('#wizardSummary .summary-row')).map(r => [r.querySelector('dt').textContent, r.querySelector('dd').textContent]);
  console.log('Bevat "Ruimtes" in samenvatting (hoort nu WEL bij Kantoorreiniging):', rows.some(([k]) => k === 'Ruimtes'));
  console.log('Huidige stap (verwacht 12):', doc.querySelector('.wizard-step:not([hidden])').dataset.step);
}

console.log('\n=== Scenario 4: "Meerdere keren per week" -> extra veld verschijnt en verdwijnt weer ===');
{
  const dom = makeDom();
  const doc = dom.window.document;
  setRadio(doc, 'klanttype', 'Bedrijf');
  next(doc);
  setRadio(doc, 'dienst', 'Periodieke bedrijfsschoonmaak');
  next(doc);
  setRadio(doc, 'oppervlakte', 'Middel');
  next(doc);
  setRadio(doc, 'frequentie', 'Meerdere keren per week');
  console.log('Veld zichtbaar na "Meerdere keren per week":', !doc.getElementById('fieldMeerderePerWeek').hidden);
  setRadio(doc, 'frequentie', 'Maandelijks');
  console.log('Veld weer verborgen na wissel naar "Maandelijks":', doc.getElementById('fieldMeerderePerWeek').hidden);
  console.log('Waarde geleegd:', doc.getElementById('meerdere_per_week_aantal').value === '');
}

console.log('\n=== Scenario 4b: glasbewassing-particulier (skipt pakketstap, eigen glas_*-velden) ===');
{
  const dom = makeDom();
  const doc = dom.window.document;
  setRadio(doc, 'klanttype', 'Particulier');
  next(doc);
  setRadio(doc, 'dienst', 'Glasbewassing', 'particulier');
  next(doc);
  // Stap 3 (pakket) moet worden overgeslagen voor glasbewassing-particulier.
  const stepNaPakket = doc.querySelector('.wizard-step:not([hidden])').dataset.step;
  console.log('Stap na dienstkeuze glasbewassing (verwacht 4, pakketstap overgeslagen):', stepNaPakket);
  setRadio(doc, 'glas_type', 'Binnen- en buitenzijde');
  setRadio(doc, 'glas_frequentie', 'Periodiek');
  setRadio(doc, 'glas_verdieping', 'Eerste verdieping');
  setRadio(doc, 'glas_bereikbaarheid', 'Ja, normaal bereikbaar');
  next(doc); // -> extra's/toelichting-stap
  next(doc); // -> toelichtingstap (aantal_locaties/bericht zijn hier niet verplicht voor particulier)
  setValue(doc, '#naam', 'Marieke de Groot');
  setValue(doc, '#email', 'marieke@example.com');
  setValue(doc, '#telefoon', '0623456789');
  setValue(doc, '#plaats', 'Helmond');
  next(doc); // -> gegevensstap (11)
  next(doc); // -> controlestap (12)
  console.log('Huidige stap (verwacht 12):', doc.querySelector('.wizard-step:not([hidden])').dataset.step);
  const rows = Array.from(doc.querySelectorAll('#wizardSummary .summary-row')).map(r => [r.querySelector('dt').textContent, r.querySelector('dd').textContent]);
  console.log('Samenvatting glasbewassing-particulier (' + rows.length + ' regels):');
  rows.forEach(([k, v]) => console.log('  ' + k + ': ' + v));
  const rommel = rows.filter(([k, v]) => /^0$/.test(v) || v === 'undefined' || v === 'null' || v === '');
  console.log('Regels met 0/undefined/null/leeg:', rommel.length);
  console.log('Bevat "Type woning" (hoort NIET bij glasbewassing):', rows.some(([k]) => k === 'Type woning'));
}

console.log('\n=== Scenario 4c: schoonmaak na verbouwing (verbouwing_type + bouwresten) ===');
{
  const dom = makeDom();
  const doc = dom.window.document;
  setRadio(doc, 'klanttype', 'Particulier');
  next(doc);
  setRadio(doc, 'dienst', 'Schoonmaak na verbouwing');
  next(doc);
  setPakketRadio(doc, 'na-verbouwing', 'Uitgebreid');
  next(doc);
  setValue(doc, '#typewoning', 'Eengezinswoning');
  setRadio(doc, 'woonoppervlakte_staffel', 't/m 60 m²');
  setRadio(doc, 'vervuilingsgraad', 'Normaal vervuild');
  setRadio(doc, 'verbouwing_type', 'Badkamer');
  setRadio(doc, 'bouwresten', 'Nee, geen hardnekkige bouwresten');
  next(doc); // -> extra's/toelichting-stap (5)
  next(doc); // -> toelichtingstap (10)
  setValue(doc, '#naam', 'Peter Willems');
  setValue(doc, '#email', 'peter@example.com');
  setValue(doc, '#telefoon', '0634567890');
  setValue(doc, '#plaats', 'Deurne');
  next(doc); // -> gegevensstap (11)
  next(doc); // -> controlestap (12)
  console.log('Huidige stap (verwacht 12):', doc.querySelector('.wizard-step:not([hidden])').dataset.step);
  const rows = Array.from(doc.querySelectorAll('#wizardSummary .summary-row')).map(r => [r.querySelector('dt').textContent, r.querySelector('dd').textContent]);
  console.log('Samenvatting na-verbouwing (' + rows.length + ' regels):');
  rows.forEach(([k, v]) => console.log('  ' + k + ': ' + v));
  const rommel = rows.filter(([k, v]) => /^0$/.test(v) || v === 'undefined' || v === 'null' || v === '');
  console.log('Regels met 0/undefined/null/leeg:', rommel.length);
  console.log('Bevat "Ruimtes" (hoort NIET bij particulier):', rows.some(([k]) => k === 'Ruimtes'));
}

console.log('\n=== Scenario 4d: zakelijke Glasbewassing (niet-periodiek) skipt stap 9, geen calc-velden ===');
{
  const dom = makeDom();
  const doc = dom.window.document;
  setRadio(doc, 'klanttype', 'Bedrijf');
  next(doc);
  setRadio(doc, 'dienst', 'Glasbewassing', 'bedrijf');
  next(doc);
  setRadio(doc, 'oppervlakte', 'Middel');
  next(doc);
  setRadio(doc, 'frequentie', 'Eenmalig');
  next(doc);
  const currentStep = doc.querySelector('.wizard-step:not([hidden])').dataset.step;
  console.log('Stap na Frequentie->Volgende voor zakelijke Glasbewassing (verwacht 10, stap 9 overgeslagen):', currentStep);
}

console.log('\n=== Scenario 5: exacte payload die naar /api/offerte-aanvraag zou gaan ===');
{
  const dom = makeDom();
  const doc = dom.window.document;
  dom.window.Element.prototype.scrollIntoView = () => {};
  let captured = null;
  dom.window.fetch = (url, opts) => {
    captured = { url, body: JSON.parse(opts.body) };
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) });
  };
  setRadio(doc, 'klanttype', 'Bedrijf');
  next(doc);
  setRadio(doc, 'dienst', 'Periodieke bedrijfsschoonmaak');
  next(doc);
  setRadio(doc, 'oppervlakte', 'Klein');
  next(doc);
  setRadio(doc, 'frequentie', 'Wekelijks');
  next(doc);
  setChecked(doc, '#zakelijkRuimtes input[data-ruimte-id="ruimte_kantoor"]', true);
  setChecked(doc, '#zakelijkRuimtes input[data-ruimte-id="ruimte_kantine"]', true);
  setRadio(doc, 'vervuilingsgraad_zakelijk', 'Bovengemiddelde vervuiling');
  setRadio(doc, 'schoonmaakmoment', 'Geen voorkeur / in overleg');
  next(doc);
  setValue(doc, '#aantal_locaties', '1');
  setValue(doc, '#bericht', 'Kantine en kantoor van een autogarage');
  next(doc);
  setValue(doc, '#naam', 'Frank Verberne');
  setValue(doc, '#bedrijfsnaam', 'Garagebedrijf Van Brussel B.V.');
  setValue(doc, '#email', 'frank@vanbrussel.nl');
  setValue(doc, '#telefoon', '0492123456');
  setValue(doc, '#plaats', 'Liessel');
  next(doc);
  doc.getElementById('wizardSubmit').removeAttribute('hidden');
  const formEl = doc.getElementById('offerteWizard');
  formEl.requestSubmit ? formEl.requestSubmit() : formEl.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
  setTimeout(() => {
    console.log('fetch url:', captured && captured.url);
    console.log(JSON.stringify(captured && captured.body, null, 2));
  }, 50);
}

// =================================================================
// Ronde 44 — nieuwe scenario's: dienstcontext vanaf een specifieke
// dienstpagina, auto-advance (incl. de niet-mag-wel scenario's uit de
// brief), en de Standing-Lesson-#4-regressiefix voor de gedeelde
// "periodiek-zakelijk"-slug. Deze gebruiken, in tegenstelling tot de
// scenario's hierboven, echte `assert`s (harde pass/fail) en wachten waar
// nodig écht op de 150-250ms auto-advance-vertraging via een echte timer
// (geen fake timers) — zo wordt de daadwerkelijke, door de browser
// geplande vertraging getest, niet alleen de aanroeplogica.
const assert = require('assert');
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function makeDomWithUrl(url) {
  const dom = new JSDOM(html, { runScripts: 'dangerously', url });
  dom.window.Element.prototype.scrollIntoView = () => {};
  dom.window.eval(js);
  return dom;
}
function huidigeStap(doc) {
  return doc.querySelector('.wizard-step:not([hidden])').dataset.step;
}

(async () => {
  console.log('\n=== Scenario 6: CTA vanaf specifieke dienstpagina (Kantoorreiniging) slaat de dienstvraag over ===');
  {
    const dom = makeDomWithUrl('https://www.brabantschoon.nl/offerte.html?type=zakelijk&dienst=kantoorreiniging');
    const doc = dom.window.document;
    // Zowel klanttype- als dienststap moeten zijn overgeslagen -> direct naar
    // stap 7 (oppervlakte), de eerstvolgende relevante stap na de dienstkeuze.
    assert.strictEqual(huidigeStap(doc), '7', 'moet direct naar stap 7 (oppervlakte) springen, dienstvraag overgeslagen');
    const preselectBox = doc.getElementById('wizardPreselect');
    const preselectText = doc.getElementById('wizardPreselectText');
    assert.strictEqual(preselectBox.hidden, false, '"Uw keuze" moet zichtbaar zijn');
    assert.strictEqual(preselectText.textContent, 'Kantoorreiniging', '"Uw keuze" moet de gekozen dienst tonen, geen lege balk');
    console.log('OK: dienstvraag overgeslagen, stap 7, "Uw keuze" toont "Kantoorreiniging".');
  }

  console.log('\n=== Scenario 7: onbekende ?dienst= queryparameter valt veilig terug op de normale dienstvraag ===');
  {
    const dom = makeDomWithUrl('https://www.brabantschoon.nl/offerte.html?type=zakelijk&dienst=niet-bestaande-dienst');
    const doc = dom.window.document;
    // type is wel geldig (skip klanttype-stap), dienst niet -> lands op stap 2
    // (de normale dienstvraag), nooit een lege of kapotte wizardstate.
    assert.strictEqual(huidigeStap(doc), '2', 'ongeldige dienst-slug moet terugvallen op de normale dienstvraag (stap 2)');
    const preselectBox = doc.getElementById('wizardPreselect');
    assert.strictEqual(preselectBox.hidden, true, '"Uw keuze" mag niet getoond worden zonder geldige dienst');
    // De stap zelf moet nog gewoon bruikbaar zijn (dienstkaarten selecteerbaar).
    setRadio(doc, 'dienst', 'Kantoorreiniging');
    assert.ok(doc.querySelector('input[name="dienst"][value="Kantoorreiniging"]').checked, 'dienstkeuze moet na de fallback nog gewoon werken');
    console.log('OK: ongeldige dienst-parameter geeft geen kapotte state, gewone dienstvraag blijft werken.');
  }

  console.log('\n=== Scenario 8: gedeelde slug "periodiek-zakelijk" bij VvE correct voorgeselecteerd (regressiefix Standing Lesson #4) ===');
  {
    // Zowel de bedrijfs- als de VvE-variant van "periodiek-zakelijk" delen
    // dezelfde dienst-slug (twee losse .rc-wraps, andere data-customer-types).
    // Vóór de ronde-44-fix pakte de code altijd de EERSTE (bedrijfs-)wrap,
    // waardoor dit bij VvE stilzwijgend faalde.
    const dom = makeDomWithUrl('https://www.brabantschoon.nl/offerte.html?type=vve&dienst=periodiek-zakelijk');
    const doc = dom.window.document;
    const preselectText = doc.getElementById('wizardPreselectText');
    assert.strictEqual(preselectText.textContent, 'Periodieke schoonmaak', 'moet de VvE-variant ("Periodieke schoonmaak") voorselecteren, niet stilzwijgend falen');
    const checked = doc.querySelector('input[name="dienst"]:checked');
    const wrap = checked.closest('.rc-wrap');
    assert.ok((wrap.getAttribute('data-customer-types') || '').split(' ').includes('vve'), 'de gevonden dienstkaart moet echt de VvE-variant zijn');
    console.log('OK: VvE-variant van "periodiek-zakelijk" wordt correct gevonden (niet de bedrijfsvariant).');
  }

  console.log('\n=== Scenario 9: auto-advance (klanttype) wacht 150-250ms en springt dan pas door ===');
  {
    const dom = makeDom();
    const doc = dom.window.document;
    setRadio(doc, 'klanttype', 'Bedrijf');
    assert.strictEqual(huidigeStap(doc), '1', 'mag niet meteen doorspringen -- eerst de korte, zichtbare bevestiging');
    await sleep(80);
    assert.strictEqual(huidigeStap(doc), '1', 'mag ook na 80ms nog niet doorgesprongen zijn (delay is 150-250ms)');
    await sleep(220);
    assert.strictEqual(huidigeStap(doc), '2', 'moet na de volledige vertraging automatisch naar stap 2 (dienst) zijn gesprongen');
    console.log('OK: auto-advance springt pas na de korte vertraging door, niet meteen.');
  }

  console.log('\n=== Scenario 10 (brief-scenario D): terug-navigeren springt NIET vanzelf weer vooruit; een NIEUWE keuze doet dat wel ===');
  {
    const dom = makeDom();
    const doc = dom.window.document;
    setRadio(doc, 'klanttype', 'Bedrijf');
    await sleep(260); // -> stap 2
    setRadio(doc, 'dienst', 'Kantoorreiniging');
    await sleep(260); // -> stap 7 (oppervlakte)
    setRadio(doc, 'oppervlakte', 'Klein');
    await sleep(260); // -> stap 8 (frequentie)
    assert.strictEqual(huidigeStap(doc), '8', 'voorbereiding: moet nu op de frequentiestap staan');
    click(doc.getElementById('wizardBack')); // -> terug naar stap 7, 'Klein' staat nog aangevinkt
    assert.strictEqual(huidigeStap(doc), '7', 'Terug moet naar de oppervlaktestap gaan');
    assert.ok(doc.querySelector('input[name="oppervlakte"][value="Klein"]').checked, 'de eerdere keuze ("Klein") moet nog gewoon aangevinkt staan');
    await sleep(300);
    assert.strictEqual(huidigeStap(doc), '7', 'mag NIET vanzelf weer doorspringen alleen omdat er al een waarde staat (brief-sectie 7)');
    // Nu een ECHTE nieuwe keuze -- dat moet wél auto-advancen.
    setRadio(doc, 'oppervlakte', 'Middel');
    await sleep(260);
    assert.strictEqual(huidigeStap(doc), '8', 'een NIEUWE selectie na Terug moet weer gewoon auto-advancen');
    console.log('OK: Terug springt niet vanzelf vooruit; een nieuwe selectie daarna advancet weer normaal.');
  }

  console.log('\n=== Scenario 11 (brief-scenario "Meerdere keren per week"): frequentie-uitzondering advancet NOOIT automatisch ===');
  {
    const dom = makeDom();
    const doc = dom.window.document;
    setRadio(doc, 'klanttype', 'Bedrijf');
    await sleep(260);
    setRadio(doc, 'dienst', 'Periodieke bedrijfsschoonmaak');
    await sleep(260);
    setRadio(doc, 'oppervlakte', 'Klein');
    await sleep(260); // -> stap 8
    assert.strictEqual(huidigeStap(doc), '8', 'voorbereiding: frequentiestap');
    setRadio(doc, 'frequentie', 'Meerdere keren per week');
    await sleep(300);
    assert.strictEqual(huidigeStap(doc), '8', '"Meerdere keren per week" mag NOOIT auto-advancen (extra verplicht veld op dezelfde stap)');
    assert.strictEqual(doc.getElementById('fieldMeerderePerWeek').hidden, false, 'het aantal-per-week-veld moet zichtbaar zijn');
    console.log('OK: "Meerdere keren per week" blijft op dezelfde stap staan, gebruiker moet zelf "Volgende" klikken.');
  }

  console.log('\n=== Scenario 12 (brief-scenario E): een samengestelde/multi-choice stap (ruimtes) advancet nooit vanzelf ===');
  {
    const dom = makeDom();
    const doc = dom.window.document;
    setRadio(doc, 'klanttype', 'Bedrijf');
    await sleep(260);
    setRadio(doc, 'dienst', 'Periodieke bedrijfsschoonmaak');
    await sleep(260);
    setRadio(doc, 'oppervlakte', 'Klein');
    await sleep(260);
    setRadio(doc, 'frequentie', 'Wekelijks');
    await sleep(260); // -> stap 9
    assert.strictEqual(huidigeStap(doc), '9', 'voorbereiding: ruimtes/vervuiling/moment-stap');
    setChecked(doc, '#zakelijkRuimtes input[data-ruimte-id="ruimte_kantoor"]', true);
    await sleep(300);
    assert.strictEqual(huidigeStap(doc), '9', 'een los aangevinkte ruimte mag nooit de hele (samengestelde) stap laten advancen');
    setRadio(doc, 'vervuilingsgraad_zakelijk', 'Bovengemiddelde vervuiling');
    await sleep(300);
    assert.strictEqual(huidigeStap(doc), '9', 'vervuilingsgraad (binnen dezelfde samengestelde stap) mag ook niet auto-advancen');
    setRadio(doc, 'schoonmaakmoment', 'Na sluiting');
    await sleep(300);
    assert.strictEqual(huidigeStap(doc), '9', 'schoonmaakmoment (idem) mag ook niet auto-advancen -- gebruiker klikt zelf Volgende');
    console.log('OK: stap 9 (ruimtes/vervuiling/moment) advancet nooit vanzelf, ongeacht welk los veld wordt ingevuld.');
  }

  console.log('\n=== Scenario 13 (brief-sectie 23): particuliere wizard krijgt dezelfde auto-advance op zijn pure single-choice-stappen (pakket, frequentie) ===');
  {
    const dom = makeDom();
    const doc = dom.window.document;
    setRadio(doc, 'klanttype', 'Particulier');
    await sleep(260); // -> stap 2 (dienst)
    setRadio(doc, 'dienst', 'Periodieke schoonmaak', 'particulier');
    await sleep(260); // periodiek heeft geen pakketstap -> stap 4 (woning, samengesteld, GEEN auto-advance)
    assert.strictEqual(huidigeStap(doc), '4', 'voorbereiding: woningstap (samengesteld, blijft handmatig)');
    setRadio(doc, 'woonoppervlakte_staffel', 't/m 60 m²');
    await sleep(300);
    assert.strictEqual(huidigeStap(doc), '4', 'woonoppervlakte zit op een samengestelde stap en mag niet auto-advancen');
    next(doc); // handmatig -> stap 5 (extra's, samengesteld)
    next(doc); // handmatig -> stap 6 (frequentie_particulier, PUUR single-choice)
    assert.strictEqual(huidigeStap(doc), '6', 'voorbereiding: frequentiestap (particulier)');
    setRadio(doc, 'frequentie_particulier', 'Wekelijks');
    await sleep(260);
    assert.strictEqual(huidigeStap(doc), '10', 'frequentie_particulier (stap 6, puur single-choice) moet auto-advancen');
    console.log('OK: particuliere wizard auto-advancet op zijn eigen pure single-choice-stap (frequentie), niet op de samengestelde woningstap.');
  }

  console.log('\nAlle ronde-44-scenario\'s (6 t/m 13) geslaagd.');
})().catch((e) => { console.error('FOUT in ronde-44-scenario:', e); process.exitCode = 1; });
