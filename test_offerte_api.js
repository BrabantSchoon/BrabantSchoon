// Test voor api/offerte-aanvraag.js: voedt de _internal-functies met exacte
// payloads (waaronder het "Garagebedrijf Van Brussel"-scenario, ronde 46 —
// zie ook test_calculator.js voor de losstaande, veel uitgebreidere
// dekking van lib/calculator.js zelf) en controleert de output:
// 1. Onderwerpregel en e-mailtekst voor het brief-regressiescenario.
// 2. Kruiscontrole: de e-mail geeft exact de waarden terug die
//    calculateOffer() (lib/calculator.js) voor dezelfde payload levert —
//    bevestigt dat api/offerte-aanvraag.js de gedeelde module aanroept en
//    niet zelf nog een tweede (verouderde) formule gebruikt.
// 3. "Meerdere keren per week"-pad (met en zonder geldig aantal).
// 4. Minimumprijs-clamp (kunstmatig verhoogd CONFIG-minimum).
// 5. "Onvoldoende informatie"-pad (oppervlakte = "Weet ik niet").
// 6. Particuliere flow / niet-calculeerbare zakelijke dienst => geen of een
//    expliciete "niet beschikbaar"-sectie, nooit een verzonnen bedrag.
// 7-9. Bot-/spamdetectie, validatie verplichte velden, meerdere-locaties-
//      waarschuwing.
// 10-11. Geen Web3Forms/hardcoded secrets meer; HTML-mail bevat dezelfde
//        inhoud als de teksversie en escaped klantinvoer correct.
// 12-14. De HTTP-handler zelf: veilig falen zonder Resend-config, normale
//        verzending met gemockte fetch, en veilige 502-afhandeling wanneer
//        Resend zelf de aanvraag afwijst.
"use strict";

const assert = require('assert');
const fs = require('fs');
const api = require('./api/offerte-aanvraag.js');
const calculatorLib = require('./lib/calculator.js');
// 10+. RESEND_API_KEY/RESEND_FROM_EMAIL komen uitsluitend uit process.env (nooit
//      hardcoded) -- de handler faalt veilig (geen "ok:true", geen secret in
//      respons/log) als ze ontbreken, en verstuurt normaal zodra ze aanwezig
//      zijn. Verzending loopt sinds ronde 43 via Resend (lib/mail.js) i.p.v.
//      Web3Forms (zie CHANGELOG-42.md/CHANGELOG-43.md).
const { calculateOffer, bouwEmailTekst, bouwEmailHtmlOfferte, bouwOnderwerp, lijktOpBot, valideerVerplichteVelden, CONFIG } = api._internal;

const garageVelden = [
  ['Klanttype', 'Bedrijf'],
  ['Dienst', 'Periodieke bedrijfsschoonmaak'],
  ['Bedrijfsnaam / VvE', 'Garagebedrijf Van Brussel B.V.'],
  ['Omvang', 'Klein'],
  ['Aantal locaties', '1'],
  ['Frequentie', 'Wekelijks'],
  ['Ruimtes', 'Kantoorruimte, Kantine / pantry'],
  ['Gebruiksintensiteit', 'Intensief'],
  ['Extra vervuiling', 'Bovengemiddelde vervuiling'],
  ['Schoonmaakmoment', 'Geen voorkeur / in overleg'],
  ['Omschrijving', 'Kantine en kantoor van een autogarage; de werkplaats zelf wordt niet meegenomen'],
  ['Naam', 'Frank Verberne'],
  ['E-mailadres', 'frank@vanbrussel.nl'],
  ['Telefoonnummer', '0492123456'],
  ['Plaats/postcode', 'Liessel'],
];

// Regressiescenario ronde 46, briefpunt 14: zakelijke periodieke schoonmaak,
// tot 50m² te reinigen, kantoor+kantine, dagelijks/intensief gebruikt,
// autogarage-omgeving, werkplaats zelf NIET schoongemaakt, 1x/week.
const garagePayload = {
  klanttype: 'Bedrijf',
  dienst: 'Periodieke bedrijfsschoonmaak',
  dienstSlug: 'periodiek-zakelijk',
  naam: 'Frank Verberne',
  bedrijfsnaam: 'Garagebedrijf Van Brussel B.V.',
  email: 'frank@vanbrussel.nl',
  telefoon: '0492123456',
  plaats: 'Liessel',
  velden: garageVelden,
  calc: {
    oppervlakte: 'Klein',
    oppervlakteExactM2: '',
    frequentie: 'Wekelijks',
    meerderePerWeekAantal: '',
    aantalLocaties: '1',
    ruimtes: ['ruimte_kantoor', 'ruimte_kantine'], // NIET ruimte_werkplaats
    ruimteOverig: false,
    vervuiling: 'Bovengemiddelde vervuiling',
    gebruiksintensiteit: 'Intensief',
    retourKm: '', // ronde 47: afstand onbekend -- mag NOOIT als 20km fallback behandeld worden
  },
  botcheck: false,
  form_rendered_at: String(Date.now() - 9000),
};

console.log('=== Test 1: onderwerp + e-mailtekst (Garagebedrijf Van Brussel) ===');
{
  const onderwerp = bouwOnderwerp(garagePayload);
  console.log('Onderwerp:', onderwerp);
  assert.strictEqual(onderwerp, 'Nieuwe zakelijke offerteaanvraag – Garagebedrijf Van Brussel B.V. – Liessel');

  const tekst = bouwEmailTekst(garagePayload);
  console.log('\n--- Volledige e-mailtekst ---\n' + tekst + '\n--- einde ---\n');

  // Geen enkel "0"/undefined/null/leeg particulier veld mag voorkomen.
  assert.ok(!/\bundefined\b/.test(tekst), 'geen "undefined" in tekst');
  assert.ok(!/\bnull\b/.test(tekst), 'geen "null" in tekst');
  assert.ok(!tekst.includes('Pakket:'), 'geen particulier "Pakket" veld');
  assert.ok(!tekst.includes('Woonoppervlakte'), 'geen particuliere woonoppervlakte');
  assert.ok(tekst.includes('NIEUWE ZAKELIJKE OFFERTEAANVRAAG'));
  assert.ok(tekst.includes('Garagebedrijf Van Brussel B.V.'));
  assert.ok(tekst.includes('Liessel'));
  assert.ok(tekst.includes('AANVRAAG'));
  assert.ok(tekst.includes('INTERNE PRIJSINDICATIE'));
  assert.ok(tekst.includes('MIDDELEN & VERVOER'));
  assert.ok(tekst.includes('INTERN ADVIES'));
  assert.ok(tekst.includes('Interne calculatie – niet automatisch aan de klant gecommuniceerd en geen definitieve offerte.'));
  assert.ok(tekst.includes('CONTACTGEGEVENS'));
  assert.ok(tekst.includes('Contactpersoon:'));
  // Nooit interne kostprijs-/margewoorden lekken naar de AANVRAAG-sectie
  // (die komt 1-op-1 overeen met wat de klant zelf ziet in de wizard).
  const aanvraagBlok = tekst.split('AANVRAAG')[1].split('INTERNE PRIJSINDICATIE')[0];
  assert.ok(!/kostprijs|marge|zzp/i.test(aanvraagBlok), 'AANVRAAG-sectie mag nooit interne calculatietermen bevatten');
  console.log('OK: subject + body bevatten verwachte secties, geen rommelvelden, geen interne termen in de AANVRAAG-sectie.');
}

console.log('\n=== Test 2: kruiscontrole -- e-mail gebruikt exact calculateOffer() uit lib/calculator.js (geen tweede formule) ===');
{
  const calc = calculateOffer(garagePayload);
  assert.strictEqual(calc.status, 'ok');
  console.log(JSON.stringify(calc, null, 2));

  const tekst = bouwEmailTekst(garagePayload);
  assert.ok(tekst.includes('Geschatte schoonmaaktijd: ' + calc.tijdsbandbreedteTekst + ' per bezoek'));
  assert.ok(tekst.includes('Calculatietijd (gebruikt voor onderstaande prijzen): ' + calc.calculatietijdTekst));
  assert.ok(tekst.includes('Minimum gezonde prijs: ' + calculatorLib.euro(calc.minimumGezondePrijsExclBtw) + ' excl. btw per bezoek'));
  assert.ok(tekst.includes('Adviesprijs: ' + calc.adviesprijsTekst + ' excl. btw per bezoek'));
  assert.ok(tekst.includes('Advies maandbedrag: ' + calc.maandbedragTekst));
  assert.ok(tekst.includes('Betrouwbaarheid: ' + calc.betrouwbaarheid));
  assert.ok(tekst.includes('Referentie ZZP-tarief: ' + calc.referentieZzpTariefTekst));
  assert.ok(tekst.includes('Retourkilometers: nog te bepalen'), 'onbekende afstand moet expliciet "nog te bepalen" tonen, nooit een verzonnen km-getal');
  assert.ok(tekst.includes('Voertuigkosten: nog te bepalen'));
  assert.ok(tekst.includes('Vervoer nog niet meegerekend'), 'e-mail moet duidelijk maken dat de verkoopindicatie exclusief vervoer is');
  assert.ok(!tekst.includes(calc.km + ' km'), 'er mag nooit een gefabriceerd km-getal in de mail staan');
  assert.ok(tekst.includes('Totale bekende interne kostprijs per bezoek: ' + calculatorLib.euro(calc.kostprijsPerBezoek)));
  assert.ok(calc.calculatietijdMinuten < 120, 'garagescenario (ronde 47) mag nooit meer richting 2+ uur schieten (was 137 min in ronde 46)');

  const html = bouwEmailHtmlOfferte(garagePayload);
  assert.ok(html.includes(calc.tijdsbandbreedteTekst));
  assert.ok(html.includes(calc.adviesprijsTekst));
  assert.ok(html.includes(calc.maandbedragTekst));
  assert.ok(html.includes('Referentie ZZP-tarief'));
  assert.ok(html.includes('nog te bepalen'));
  console.log('OK: zowel de teksversie als de HTML-versie geven exact dezelfde cijfers als calculateOffer() zelf -- geen dubbele/verouderde calculatielogica in api/offerte-aanvraag.js.');
}

console.log('\n=== Test 2b: expliciete retourafstand -> juiste km getoond in de e-mail, geen "nog te bepalen" meer ===');
{
  const metKm = JSON.parse(JSON.stringify(garagePayload));
  metKm.calc.retourKm = '14';
  const calc = calculateOffer(metKm);
  assert.strictEqual(calc.km, 14);
  assert.strictEqual(calc.vervoerBekend, true);
  const tekst = bouwEmailTekst(metKm);
  assert.ok(tekst.includes('Retourkilometers: 14 km'));
  assert.ok(tekst.includes('Voertuigkosten: ' + calculatorLib.euro(calc.voertuigkosten)));
  assert.ok(!tekst.includes('nog te bepalen'));
  const html = bouwEmailHtmlOfferte(metKm);
  assert.ok(html.includes('14 km'));
  console.log('OK: een expliciet opgegeven retourafstand wordt correct getoond (nooit meer "nog te bepalen" als de afstand wél bekend is).');
}

console.log('\n=== Test 3: "Meerdere keren per week" -- met geldig aantal, en het onvolledige pad (blokkeert nu NIET meer de hele schatting) ===');
{
  const payload2x = JSON.parse(JSON.stringify(garagePayload));
  payload2x.calc.frequentie = 'Meerdere keren per week';
  payload2x.calc.meerderePerWeekAantal = '2';
  const calc2x = calculateOffer(payload2x);
  assert.strictEqual(calc2x.status, 'ok');
  const verwacht2x = 2 * (52 / 12);
  assert.strictEqual(calc2x.visitsPerMonth, verwacht2x);
  assert.strictEqual(calc2x.frequentieLabel, '2× per week');
  const tekst2x = bouwEmailTekst(payload2x);
  assert.ok(tekst2x.includes('Advies maandbedrag: ' + calc2x.maandbedragTekst));
  console.log('OK: 2x/week correct doorgerekend (niet simpelweg x4 t.o.v. wekelijks).');

  const payloadOnvolledig = JSON.parse(JSON.stringify(garagePayload));
  payloadOnvolledig.calc.frequentie = 'Meerdere keren per week';
  payloadOnvolledig.calc.meerderePerWeekAantal = '';
  const calcOnvolledig = calculateOffer(payloadOnvolledig);
  assert.strictEqual(calcOnvolledig.status, 'ok', 'v2-verbetering t.o.v. v1: ontbrekend aantal mag de PER-BEZOEK-schatting niet blokkeren');
  assert.strictEqual(calcOnvolledig.maandbedragTekst, null);
  const tekstOnvolledig = bouwEmailTekst(payloadOnvolledig);
  assert.ok(tekstOnvolledig.includes('Advies maandbedrag: niet beschikbaar (aantal keer per week niet opgegeven)'));
  assert.ok(tekstOnvolledig.includes('Adviesprijs: ' + calcOnvolledig.adviesprijsTekst), 'per-bezoek-adviesprijs moet nog steeds getoond worden');
  console.log('OK: zonder geldig aantal blijft een per-bezoek-schatting behouden, alleen het maandbedrag vervalt netjes.');
}

console.log('\n=== Test 4: minimumprijs wordt toegepast bij een kunstmatig verhoogd minimum ===');
{
  const kleinPayload = JSON.parse(JSON.stringify(garagePayload));
  kleinPayload.calc.ruimtes = ['ruimte_kantoor'];
  kleinPayload.calc.vervuiling = 'Normale kantoor-/bedrijfsvervuiling';
  kleinPayload.calc.frequentie = 'Maandelijks';
  kleinPayload.calc.gebruiksintensiteit = 'Rustig';
  let calcKlein = calculateOffer(kleinPayload);
  console.log('Met huidige CONFIG -> kostprijs:', calcKlein.kostprijsPerBezoek.toFixed(2), '| adviesprijs:', calcKlein.adviesprijsTekst, '| minimum toegepast:', calcKlein.minimumToegepast);
  const origMin = CONFIG.MIN_PRICE_PER_VISIT_EXCL_BTW;
  CONFIG.MIN_PRICE_PER_VISIT_EXCL_BTW = 500; // ruim boven elke normale kostprijs
  try {
    calcKlein = calculateOffer(kleinPayload);
    console.log('Met kunstmatig verhoogd minimum (' + CONFIG.MIN_PRICE_PER_VISIT_EXCL_BTW.toFixed(2) + ') -> adviesprijs:', calcKlein.adviesprijsTekst, '| minimum toegepast:', calcKlein.minimumToegepast);
    assert.strictEqual(calcKlein.minimumToegepast, true);
    assert.ok(calcKlein.prijsOnderzijdeExclBtw >= 500);
    assert.strictEqual(calcKlein.minimumGezondePrijsExclBtw, calcKlein.prijsOnderzijdeExclBtw);
    const tekst = bouwEmailTekst(kleinPayload);
    assert.ok(tekst.includes('(minimumprijs toegepast)'));
  } finally {
    CONFIG.MIN_PRICE_PER_VISIT_EXCL_BTW = origMin;
  }
  console.log('OK: minimumprijs werkt als vangnet en wordt correct in de e-mail vermeld (getest door het minimum tijdelijk kunstmatig te verhogen -- CONFIG is dezelfde referentie als in lib/calculator.js, dus dit test ook de echte gedeelde module).');
}

console.log('\n=== Test 5: "onvoldoende informatie"-pad (oppervlakte = "Weet ik niet") ===');
{
  const onbekendPayload = JSON.parse(JSON.stringify(garagePayload));
  onbekendPayload.calc.oppervlakte = 'Weet ik niet';
  const calcOnbekend = calculateOffer(onbekendPayload);
  assert.strictEqual(calcOnbekend.status, 'onvoldoende_info');
  console.log('Redenen:', calcOnbekend.redenen);
  const tekst = bouwEmailTekst(onbekendPayload);
  assert.ok(tekst.includes('Onvoldoende informatie voor een automatische inschatting.'));
  assert.ok(tekst.includes('Handmatige calculatie / locatieopname aanbevolen.'));
  const interneBlok = tekst.split('INTERNE PRIJSINDICATIE')[1].split('CONTACTGEGEVENS')[0];
  assert.ok(!/€\d/.test(interneBlok), 'geen gefabriceerde bedragen in het onvoldoende-info-blok');
  console.log('OK: geen bedragen verzonnen bij onbekende oppervlakte, nette fallbacktekst getoond.');
}

console.log('\n=== Test 6: particuliere flow -> GEEN interne prijsindicatie ===');
{
  const particulierPayload = {
    klanttype: 'Particulier',
    dienst: 'Eenmalige grote schoonmaak',
    dienstSlug: 'grote-schoonmaak',
    naam: 'Jan Jansen',
    bedrijfsnaam: '',
    email: 'jan@example.com',
    telefoon: '0612345678',
    plaats: 'Helmond',
    velden: [
      ['Klanttype', 'Particulier'],
      ['Dienst', 'Eenmalige grote schoonmaak'],
      ['Pakket', 'Compleet'],
      ['Type woning', 'Eengezinswoning'],
      ['Woonoppervlakte', 't/m 60 m²'],
      ['Staat van de woning', 'Normaal vervuild'],
      ['Prijsindicatie (getoond aan klant)', '€149,00'],
      ['Naam', 'Jan Jansen'],
      ['E-mailadres', 'jan@example.com'],
      ['Telefoonnummer', '0612345678'],
      ['Plaats/postcode', 'Helmond'],
    ],
    calc: {},
    botcheck: false,
    form_rendered_at: String(Date.now() - 9000),
  };
  const calc = calculateOffer(particulierPayload);
  assert.strictEqual(calc, null);
  const tekst = bouwEmailTekst(particulierPayload);
  assert.ok(!tekst.includes('INTERNE PRIJSINDICATIE'));
  assert.ok(!tekst.includes('MIDDELEN & VERVOER'));
  assert.ok(!tekst.includes('INTERN ADVIES'));
  assert.ok(tekst.includes('NIEUWE PARTICULIERE OFFERTEAANVRAAG'));
  assert.ok(!/\bundefined\b|\bnull\b/.test(tekst));
  console.log('OK: particuliere e-mail bevat geen interne-calculatiesecties en geen rommelvelden.');
  console.log('\n--- Particuliere e-mailtekst ---\n' + tekst + '\n--- einde ---');
}

console.log('\n=== Test 6b: Kantoorreiniging krijgt een volledige interne prijsindicatie (zelfde bereik als periodiek-zakelijk) ===');
{
  const kantoorPayload = {
    klanttype: 'Bedrijf',
    dienst: 'Kantoorreiniging',
    dienstSlug: 'kantoorreiniging',
    naam: 'Test Kantoor',
    bedrijfsnaam: 'Testbedrijf B.V.',
    email: 'test@voorbeeld.nl',
    telefoon: '0611112222',
    plaats: 'Helmond',
    velden: [
      ['Klanttype', 'Bedrijf'],
      ['Dienst', 'Kantoorreiniging'],
      ['Bedrijfsnaam / VvE', 'Testbedrijf B.V.'],
      ['Omvang', 'Klein'],
      ['Frequentie', 'Wekelijks'],
      ['Ruimtes', 'Kantoorruimte, Kantine / pantry, Toiletten / sanitair'],
      ['Gebruiksintensiteit', 'Gemiddeld'],
      ['Extra vervuiling', 'Bovengemiddelde vervuiling'],
      ['Schoonmaakmoment', 'Na sluiting'],
      ['Naam', 'Test Kantoor'],
      ['E-mailadres', 'test@voorbeeld.nl'],
      ['Telefoonnummer', '0611112222'],
      ['Plaats/postcode', 'Helmond'],
    ],
    calc: {
      oppervlakte: 'Klein',
      oppervlakteExactM2: '',
      frequentie: 'Wekelijks',
      meerderePerWeekAantal: '',
      aantalLocaties: '',
      ruimtes: ['ruimte_kantoor', 'ruimte_kantine', 'ruimte_toiletten'],
      ruimteOverig: false,
      vervuiling: 'Bovengemiddelde vervuiling',
      gebruiksintensiteit: 'Gemiddeld',
    },
    botcheck: false,
    form_rendered_at: String(Date.now() - 9000),
  };
  const calc = calculateOffer(kantoorPayload);
  assert.strictEqual(calc.status, 'ok', 'Kantoorreiniging moet een volledige interne prijsindicatie krijgen');
  const tekst = bouwEmailTekst(kantoorPayload);
  assert.ok(tekst.includes('INTERNE PRIJSINDICATIE'), 'e-mail moet nu een INTERNE PRIJSINDICATIE-sectie bevatten voor Kantoorreiniging');
  assert.ok(tekst.includes(calc.tijdsbandbreedteTekst));
  const html = bouwEmailHtmlOfferte(kantoorPayload);
  assert.ok(html.includes('Interne prijsindicatie'), 'HTML-mail moet ook de interne-prijsindicatiesectie bevatten');
  console.log('Kantoorreiniging-scenario -- tijdsbandbreedte:', calc.tijdsbandbreedteTekst, '| adviesprijs:', calc.adviesprijsTekst);
  console.log('OK: Kantoorreiniging krijgt een volledige, correcte interne prijsindicatie via dezelfde gedeelde module.');
}

console.log('\n=== Test 6c: niet-calculeerbare zakelijke dienst (Glasbewassing) krijgt expliciete "niet beschikbaar"-melding, GEEN verzonnen bedrag ===');
{
  const glasZakelijkPayload = {
    klanttype: 'Bedrijf',
    dienst: 'Glasbewassing',
    dienstSlug: 'glasbewassing-zakelijk',
    naam: 'Test Glas',
    bedrijfsnaam: 'Glasbedrijf B.V.',
    email: 'glas@voorbeeld.nl',
    telefoon: '0611113333',
    plaats: 'Helmond',
    velden: [
      ['Klanttype', 'Bedrijf'],
      ['Dienst', 'Glasbewassing'],
      ['Bedrijfsnaam / VvE', 'Glasbedrijf B.V.'],
      ['Omvang', 'Klein'],
      ['Frequentie', 'Maandelijks'],
      ['Naam', 'Test Glas'],
      ['E-mailadres', 'glas@voorbeeld.nl'],
      ['Telefoonnummer', '0611113333'],
      ['Plaats/postcode', 'Helmond'],
    ],
    calc: { oppervlakte: 'Klein', frequentie: 'Maandelijks', meerderePerWeekAantal: '', aantalLocaties: '', ruimtes: [], ruimteOverig: false, vervuiling: '' },
    botcheck: false,
    form_rendered_at: String(Date.now() - 9000),
  };
  const calc = calculateOffer(glasZakelijkPayload);
  assert.deepStrictEqual(calc, { status: 'niet_beschikbaar' }, 'niet-calculeerbare zakelijke dienst moet status niet_beschikbaar opleveren, geen bedrag');
  const tekst = bouwEmailTekst(glasZakelijkPayload);
  assert.ok(tekst.includes('INTERNE PRIJSINDICATIE'), 'sectie moet WEL getoond worden (niet stilzwijgend weggelaten)');
  assert.ok(tekst.includes('Niet beschikbaar voor deze dienst'), 'moet expliciet "niet beschikbaar" tonen');
  assert.ok(tekst.includes('Handmatige calculatie / locatieopname aanbevolen'), 'moet het advies tonen');
  const interneBlok = tekst.split('INTERNE PRIJSINDICATIE')[1].split('CONTACTGEGEVENS')[0];
  assert.ok(!/€\d/.test(interneBlok), 'er mag GEEN verzonnen bedrag in de interne-prijsindicatiesectie staan');
  const html = bouwEmailHtmlOfferte(glasZakelijkPayload);
  assert.ok(html.includes('Niet beschikbaar voor deze dienst'), 'HTML-versie moet dezelfde melding tonen');
  console.log('OK: niet-calculeerbare zakelijke dienst toont intern een expliciete "niet beschikbaar"-melding, nooit een verzonnen bedrag.');
}

console.log('\n=== Test 6d: bijzondere vervuiling ("Anders / toelichting") -> intern advies toont "Locatieopname aanbevolen" ===');
{
  const specialPayload = JSON.parse(JSON.stringify(garagePayload));
  specialPayload.calc.vervuiling = 'Anders / toelichting';
  const calc = calculateOffer(specialPayload);
  assert.strictEqual(calc.betrouwbaarheid, 'Laag');
  assert.strictEqual(calc.locatieopnameAanbevolen, true);
  const tekst = bouwEmailTekst(specialPayload);
  assert.ok(tekst.includes('Locatieopname aanbevolen'), 'intern advies moet locatieopname aanraden bij een bijzondere/eigen toelichting');
  assert.ok(!tekst.includes('Max. verantwoord ZZP-tarief'), 'bij Laag betrouwbaarheid mag geen ZZP-tarief getoond worden');
  const html = bouwEmailHtmlOfferte(specialPayload);
  assert.ok(html.includes('Locatieopname aanbevolen'));
  console.log('OK: bijzondere vervuiling/situatie leidt tot een zichtbaar "Locatieopname aanbevolen"-advies, in plaats van een te zeker gepresenteerde prijs.');
}

console.log('\n=== Test 7: botdetectie (honeypot + te snel ingevuld) ===');
{
  assert.strictEqual(lijktOpBot({ botcheck: true, form_rendered_at: String(Date.now() - 9000) }), true, 'honeypot aangevinkt => bot');
  assert.strictEqual(lijktOpBot({ botcheck: false, form_rendered_at: String(Date.now() - 100) }), true, 'te snel ingevuld (100ms) => bot');
  assert.strictEqual(lijktOpBot({ botcheck: false, form_rendered_at: String(Date.now() - 9000) }), false, 'normaal ingevuld => geen bot');
  console.log('OK: botdetectie gedraagt zich zoals verwacht.');
}

console.log('\n=== Test 8: validatie verplichte velden ===');
{
  const fouten = valideerVerplichteVelden({ klanttype: 'Bedrijf', dienst: 'x', naam: '', email: 'niet-geldig', telefoon: '', plaats: '' });
  console.log('Ontbrekende/ongeldige velden:', fouten);
  assert.deepStrictEqual(fouten, ['naam', 'email', 'telefoon', 'plaats']);
  const geen = valideerVerplichteVelden(garagePayload);
  assert.deepStrictEqual(geen, []);
  console.log('OK: validatie werkt correct voor zowel ontbrekende als volledige payloads.');
}

console.log('\n=== Test 9: e-mailtekst bij meerdere locaties bevat waarschuwing ===');
{
  const meerdereLocPayload = JSON.parse(JSON.stringify(garagePayload));
  meerdereLocPayload.calc.aantalLocaties = '3';
  const tekst = bouwEmailTekst(meerdereLocPayload);
  assert.ok(tekst.includes('3 locaties'));
  assert.ok(tekst.includes('PER LOCATIE'));
  console.log('OK: waarschuwing bij meerdere locaties aanwezig.');
}

console.log('\n=== Test 10: geen Web3Forms/RESEND_API_KEY-literal meer in de actieve broncode ===');
{
  assert.ok(!('WEB3FORMS_ACCESS_KEY' in CONFIG), 'CONFIG mag geen WEB3FORMS_ACCESS_KEY-veld hebben');
  assert.ok(!('RESEND_API_KEY' in CONFIG), 'CONFIG mag geen RESEND_API_KEY-veld hebben -- die hoort alleen in process.env te staan');
  const eigenBroncode = fs.readFileSync(__dirname + '/api/offerte-aanvraag.js', 'utf8');
  assert.ok(!/api\.web3forms\.com/i.test(eigenBroncode), 'api/offerte-aanvraag.js mag geen Web3Forms-endpoint meer bevatten');
  assert.ok(!/WEB3FORMS_ACCESS_KEY/.test(eigenBroncode), 'api/offerte-aanvraag.js mag WEB3FORMS_ACCESS_KEY niet meer noemen (volledig verwijderd, zie CHANGELOG-43.md)');
  assert.ok(!/re_[A-Za-z0-9]{10,}/.test(eigenBroncode), 'geen letterlijke Resend-sleutel (formaat re_...) in de broncode');
  const calculatorBroncode = fs.readFileSync(__dirname + '/lib/calculator.js', 'utf8');
  assert.ok(!/re_[A-Za-z0-9]{10,}/.test(calculatorBroncode), 'geen letterlijke Resend-sleutel in lib/calculator.js');
  const mailBroncode = fs.readFileSync(__dirname + '/lib/mail.js', 'utf8');
  assert.ok(!/api\.web3forms\.com/i.test(mailBroncode), 'lib/mail.js mag geen Web3Forms-endpoint bevatten');
  assert.ok(/api\.resend\.com/.test(mailBroncode), 'lib/mail.js moet het Resend-endpoint gebruiken');
  assert.ok(!/re_[A-Za-z0-9]{10,}/.test(mailBroncode), 'geen letterlijke Resend-sleutel (formaat re_...) in lib/mail.js');
  console.log('OK: geen Web3Forms-afhankelijkheid en geen hardcoded sleutel meer in de actieve broncode.');
}

console.log('\n=== Test 11: bouwEmailHtmlOfferte() -- zelfde inhoud als de platte tekst, correct geescaped ===');
{
  const html = bouwEmailHtmlOfferte(garagePayload);
  assert.ok(html.includes('Nieuwe zakelijke offerteaanvraag'));
  assert.ok(html.includes('Garagebedrijf Van Brussel B.V.'));
  assert.ok(html.includes('Liessel'));
  assert.ok(html.includes('Interne prijsindicatie'));
  assert.ok(html.includes('Middelen &amp; vervoer') || html.includes('Middelen & vervoer'), 'sectiekop Middelen & vervoer moet aanwezig zijn (eventueel HTML-geescaped)');
  assert.ok(html.includes('Intern advies'));
  assert.ok(html.includes('Contactgegevens'));
  assert.ok(!/\bundefined\b|\bnull\b/.test(html), 'geen "undefined"/"null" in de HTML-mail');
  // HTML-injectietest: kwaadaardige tekens in een klantveld mogen nooit
  // ongeescaped in de uitvoer belanden.
  const kwaadPayload = JSON.parse(JSON.stringify(garagePayload));
  kwaadPayload.naam = '<img src=x onerror=alert(1)>';
  const kwaadHtml = bouwEmailHtmlOfferte(kwaadPayload);
  assert.ok(!kwaadHtml.includes('<img src=x onerror=alert(1)>'), 'ongeescapete HTML/JS-injectie via klantnaam mag niet voorkomen');
  assert.ok(kwaadHtml.includes('&lt;img src=x onerror=alert(1)&gt;'), 'klantnaam moet HTML-geescaped in de mail staan');
  console.log('OK: HTML-mail bevat dezelfde secties als de tekstversie en escaped klantinvoer correct (HTML-injectiebescherming).');
}

console.log('\n=== Test 11b: server-side manipulatie van client-bedragen is onmogelijk -- de payload bevat nooit een bedrag, alleen ruwe invoer ===');
{
  // De browser (js/main.js) levert uitsluitend ruwe `calc`-velden aan (zie
  // buildOffertePayload()) -- nooit een reeds berekend bedrag. Simuleer een
  // kwaadwillende client die toch een prijsveld meestuurt: dat veld wordt
  // simpelweg genegeerd, calculateOffer() berekent zelf, server-side, opnieuw.
  const manipulatiePayload = JSON.parse(JSON.stringify(garagePayload));
  manipulatiePayload.calc.adviesprijsExclBtw = 1; // zou, indien vertrouwd, een absurd lage prijs opleveren
  manipulatiePayload.calc.kostprijsPerBezoek = 0;
  const calcNormaal = calculateOffer(garagePayload);
  const calcMetInjectie = calculateOffer(manipulatiePayload);
  assert.strictEqual(calcMetInjectie.adviesprijsTekst, calcNormaal.adviesprijsTekst, 'een door de client meegestuurd prijsveld mag de servercalculatie nooit beïnvloeden');
  assert.strictEqual(calcMetInjectie.kostprijsPerBezoek, calcNormaal.kostprijsPerBezoek);
  console.log('OK: extra/gemanipuleerde prijsvelden in de payload hebben geen enkel effect -- de server berekent altijd zelf, uitsluitend op basis van de ruwe invoervelden.');
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
  console.log('\n=== Test 12: handler faalt veilig zonder RESEND_API_KEY/RESEND_FROM_EMAIL (geen "ok:true", geen secret-lek, geen netwerkaanroep) ===');
  const origConsoleError = console.error;
  const loggedLines = [];
  console.error = (...args) => { loggedLines.push(args.map(String).join(' ')); };
  let fetchAangeroepen = false;
  const origFetch = global.fetch;
  global.fetch = () => { fetchAangeroepen = true; return Promise.reject(new Error('mag niet aangeroepen worden')); };
  try {
    await metEnv({ RESEND_API_KEY: undefined, RESEND_FROM_EMAIL: undefined }, async () => {
      const req = { method: 'POST', body: JSON.stringify(garagePayload) };
      const res = mockRes();
      await api(req, res);
      console.log('Statuscode zonder configuratie (verwacht 500):', res.statusCode);
      console.log('Response body:', JSON.stringify(res.body));
      assert.strictEqual(res.statusCode, 500);
      assert.strictEqual(res.body.ok, false, 'mag NOOIT ok:true teruggeven wanneer er niets verzonden kon worden');
      assert.strictEqual(res.body.error, 'server_misconfigured');
      assert.strictEqual(fetchAangeroepen, false, 'zonder configuratie mag er nooit een Resend-aanroep gebeuren');
      const loggedText = loggedLines.join('\n');
      assert.ok(loggedText.includes('RESEND_API_KEY'), 'log moet duidelijk maken welke variabele ontbreekt');
      assert.ok(!/re_[A-Za-z0-9]{10,}/.test(loggedText), 'log mag nergens een sleutelwaarde bevatten');
    });
  } finally {
    console.error = origConsoleError;
    global.fetch = origFetch;
  }
  console.log('OK: handler faalt veilig (500/ok:false/server_misconfigured), geen netwerkaanroep, geen secret in de log.');
}

async function testHandlerMetConfig() {
  console.log('\n=== Test 13: handler verstuurt normaal via Resend zodra configuratie aanwezig is (fetch gemockt, nooit een echt netwerkverzoek); replyTo correct ===');
  const origFetch = global.fetch;
  try {
    let capturedBody = null;
    let capturedHeaders = null;
    global.fetch = (url, opts) => {
      capturedBody = JSON.parse(opts.body);
      capturedHeaders = opts.headers;
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ id: 'test-resend-id' }) });
    };
    await metEnv({ RESEND_API_KEY: 're_test_fake_1234', RESEND_FROM_EMAIL: 'Brabantschoon <noreply@brabantschoon.nl>', RESEND_TO_EMAIL: undefined }, async () => {
      const req = { method: 'POST', body: JSON.stringify(garagePayload) };
      const res = mockRes();
      await api(req, res);
      console.log('Statuscode met (test-)configuratie (verwacht 200):', res.statusCode);
      assert.strictEqual(res.statusCode, 200);
      assert.deepStrictEqual(res.body, { ok: true });
      assert.strictEqual(capturedHeaders['Authorization'], 'Bearer re_test_fake_1234', 'de (test-)sleutel gaat alleen server-side naar Resend, nooit terug naar de bezoeker');
      assert.strictEqual(capturedBody.from, 'Brabantschoon <noreply@brabantschoon.nl>');
      assert.deepStrictEqual(capturedBody.to, ['info@brabantschoon.nl']);
      assert.strictEqual(capturedBody.reply_to, garagePayload.email, 'reply_to moet het klant-e-mailadres zijn, zodat "Beantwoorden" naar de klant gaat i.p.v. het noreply-adres');
      assert.ok(capturedBody.html && capturedBody.html.length > 0);
      assert.ok(capturedBody.text && capturedBody.text.length > 0);
      assert.ok(capturedBody.html.includes('Interne prijsindicatie'), 'de daadwerkelijk verstuurde HTML-mail moet de nieuwe interne-prijsindicatiesectie bevatten');
    });
  } finally {
    global.fetch = origFetch;
  }
  console.log('OK: bij aanwezige configuratie verloopt verzending normaal via Resend; reply_to correct; respons bevat alleen {ok:true}.');
}

async function testHandlerResendAfgewezen() {
  console.log('\n=== Test 14: handler geeft 502 wanneer Resend de aanvraag zelf afwijst, en logt veilig ===');
  const origFetch = global.fetch;
  const origConsoleError = console.error;
  const loggedLines = [];
  console.error = (...args) => { loggedLines.push(args.map(String).join(' ')); };
  try {
    // Simuleert bijv. een nog niet geverifieerd verzenddomein bij Resend.
    global.fetch = () => Promise.resolve({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ name: 'validation_error', statusCode: 403, message: 'The brabantschoon.nl domain is not verified' }),
    });
    await metEnv({ RESEND_API_KEY: 're_test_fake_9999', RESEND_FROM_EMAIL: 'Brabantschoon <noreply@brabantschoon.nl>' }, async () => {
      const req = { method: 'POST', body: JSON.stringify(garagePayload) };
      const res = mockRes();
      await api(req, res);
      console.log('Statuscode wanneer Resend afwijst (verwacht 502):', res.statusCode);
      assert.strictEqual(res.statusCode, 502);
      assert.strictEqual(res.body.ok, false);
      assert.strictEqual(res.body.error, 'send_failed');
      assert.ok(!('message' in res.body) && !('detail' in res.body), 'de bezoeker mag NOOIT de Resend-foutmelding zelf te zien krijgen -- alleen de generieke code');
      const loggedText = loggedLines.join('\n');
      assert.ok(loggedText.includes('http_status=403'));
      assert.ok(loggedText.includes('not verified'), 'log moet de (ingekorte) foutmelding van Resend bevatten, voor diagnose');
      assert.ok(!loggedText.includes('re_test_fake_9999'), 'log mag NOOIT de API-key bevatten, ook niet een testwaarde');
      assert.ok(!loggedText.includes(garagePayload.email), 'log mag NOOIT klantgegevens (bijv. e-mailadres) bevatten');
    });
  } finally {
    console.error = origConsoleError;
    global.fetch = origFetch;
  }
  console.log('OK: bij een afwijzing door Resend zelf krijgt de bezoeker alleen een generieke 502, en logt de server veilig status/message zonder key of klantgegevens.');
}

(async () => {
  await testHandlerZonderConfig();
  await testHandlerMetConfig();
  await testHandlerResendAfgewezen();
  console.log('\nAlle tests geslaagd.');
})().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
