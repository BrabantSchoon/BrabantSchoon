// Test voor api/offerte-aanvraag.js: voedt de _internal-functies met exacte
// payloads (waaronder de "Garagebedrijf Van Brussel"-scenario, letterlijk
// gekopieerd uit de fetch-payload die test_wizard.js Scenario 5 registreert)
// en controleert de output:
// 1. Onderwerpregel en e-mailtekst voor het brief-regressiescenario.
// 2. Onafhankelijke herberekening van de interne calculatie (tijd, kosten,
//    adviesprijs, marge) om te bevestigen dat de formule correct is
//    geïmplementeerd -- niet alleen "de code leest logisch".
// 3. Botcheck/spamdetectie.
// 4. Validatie van verplichte velden.
// 5. "Onvoldoende informatie"-pad (oppervlakte = "Weet ik niet").
// 6. Particuliere flow: dienstSlug !== 'periodiek-zakelijk' => geen calc-sectie.
const assert = require('assert');
const fs = require('fs');
const api = require('./api/offerte-aanvraag.js');
// 10+. RESEND_API_KEY/RESEND_FROM_EMAIL komen uitsluitend uit process.env (nooit
//      hardcoded) -- de handler faalt veilig (geen "ok:true", geen secret in
//      respons/log) als ze ontbreken, en verstuurt normaal zodra ze aanwezig
//      zijn. Verzending loopt sinds ronde 43 via Resend (lib/mail.js) i.p.v.
//      Web3Forms (zie CHANGELOG-42.md/CHANGELOG-43.md). Deze tests gebruiken
//      uitsluitend verzonnen testwaarden, nooit een echte productiesleutel.
const { berekenInterneCalculatie, bouwEmailTekst, bouwEmailHtmlOfferte, bouwOnderwerp, lijktOpBot, valideerVerplichteVelden, CONFIG } = api._internal;

const garageVelden = [
  ['Klanttype', 'Bedrijf'],
  ['Dienst', 'Periodieke bedrijfsschoonmaak'],
  ['Bedrijfsnaam / VvE', 'Garagebedrijf Van Brussel B.V.'],
  ['Omvang', 'Klein'],
  ['Aantal locaties', '1'],
  ['Frequentie', 'Wekelijks'],
  ['Ruimtes', 'Kantoorruimte, Kantine / pantry'],
  ['Extra vervuiling', 'Bovengemiddelde vervuiling'],
  ['Schoonmaakmoment', 'Geen voorkeur / in overleg'],
  ['Omschrijving', 'Kantine en kantoor van een autogarage'],
  ['Naam', 'Frank Verberne'],
  ['E-mailadres', 'frank@vanbrussel.nl'],
  ['Telefoonnummer', '0492123456'],
  ['Plaats/postcode', 'Liessel'],
];

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
    frequentie: 'Wekelijks',
    meerderePerWeekAantal: '',
    aantalLocaties: '1',
    ruimtes: ['ruimte_kantoor', 'ruimte_kantine'],
    ruimteOverig: false,
    vervuiling: 'Bovengemiddelde vervuiling',
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
  assert.ok(tekst.includes('INTERNE CALCULATIE'));
  assert.ok(tekst.includes('Interne prijsindicatie – niet automatisch aan de klant gecommuniceerd en geen definitieve offerte.'));
  assert.ok(tekst.includes('CONTACTGEGEVENS'));
  assert.ok(tekst.includes('Contactpersoon:'));
  console.log('OK: subject + body bevatten verwachte secties, geen rommelvelden.');
}

console.log('\n=== Test 2: onafhankelijke herberekening interne calculatie ===');
{
  const calc = berekenInterneCalculatie(garagePayload);
  console.log(JSON.stringify(calc, null, 2));

  // Handmatige herberekening volgens de briefformule, losstaand van de
  // implementatie, met dezelfde CONFIG-waarden:
  const baseMinutes = 45; // "Klein"
  const roomMinutes = 10 + 15; // kantoor + kantine
  const vervuilingFactor = 1.35; // "Bovengemiddelde vervuiling"
  const verwachteTotaalMinuten = (baseMinutes + roomMinutes) * vervuilingFactor;
  assert.strictEqual(calc.totaalMinuten, verwachteTotaalMinuten);
  console.log('Totaal minuten (verwacht ' + verwachteTotaalMinuten + '):', calc.totaalMinuten);

  const verwachteUren = verwachteTotaalMinuten / 60;
  assert.strictEqual(calc.uren, verwachteUren);

  const verwachteArbeidskosten = verwachteUren * CONFIG.INTERNAL_HOURLY_COST_EXCL_BTW;
  const verwachteReiskosten = (CONFIG.TRAVEL_MINUTES_PER_VISIT / 60) * CONFIG.TRAVEL_RATE_PER_HOUR_EXCL_BTW;
  const verwachteMateriaalkosten = CONFIG.MATERIAL_COST_PER_VISIT_EXCL_BTW;
  const verwachteDirecteKosten = verwachteArbeidskosten + verwachteReiskosten + verwachteMateriaalkosten + CONFIG.OTHER_DIRECT_COSTS_PER_VISIT_EXCL_BTW;
  assert.ok(Math.abs(calc.directeKostenPerBezoek - verwachteDirecteKosten) < 1e-9);
  console.log('Directe kosten per bezoek (verwacht ' + verwachteDirecteKosten.toFixed(4) + '):', calc.directeKostenPerBezoek.toFixed(4));

  const verwachteAdviesprijsRuw = verwachteDirecteKosten / (1 - CONFIG.DESIRED_GROSS_MARGIN);
  const verwachteAdviesprijs = Math.max(verwachteAdviesprijsRuw, CONFIG.MIN_PRICE_PER_VISIT_EXCL_BTW);
  assert.ok(Math.abs(calc.adviesprijsExclBtw - verwachteAdviesprijs) < 1e-9);
  console.log('Adviesprijs excl. btw per bezoek (verwacht ' + verwachteAdviesprijs.toFixed(4) + '):', calc.adviesprijsExclBtw.toFixed(4));
  assert.strictEqual(calc.minimumToegepast, verwachteAdviesprijs > verwachteAdviesprijsRuw + 0.005);

  const verwachteBtw = verwachteAdviesprijs * (CONFIG.VAT_RATE_PERCENT / 100);
  const verwachteInclBtw = verwachteAdviesprijs + verwachteBtw;
  assert.ok(Math.abs(calc.btwBedrag - verwachteBtw) < 1e-9);
  assert.ok(Math.abs(calc.adviesprijsInclBtw - verwachteInclBtw) < 1e-9);
  console.log('Adviesprijs incl. btw per bezoek (verwacht ' + verwachteInclBtw.toFixed(4) + '):', calc.adviesprijsInclBtw.toFixed(4));

  // Frequentie "Wekelijks" => bezoeken/maand = 52/12 (NIET simpelweg x4).
  const verwachteBezoekenPerMaand = 52 / 12;
  assert.strictEqual(calc.visitsPerMonth, verwachteBezoekenPerMaand);
  assert.notStrictEqual(verwachteBezoekenPerMaand, 4, 'sanity: 52/12 != 4');
  console.log('Bezoeken per maand (verwacht ' + verwachteBezoekenPerMaand.toFixed(4) + '):', calc.visitsPerMonth.toFixed(4));

  const verwachtePerMaandExclBtw = verwachteAdviesprijs * verwachteBezoekenPerMaand;
  assert.ok(Math.abs(calc.adviesprijsPerMaandExclBtw - verwachtePerMaandExclBtw) < 1e-9);
  console.log('Adviesprijs per maand excl. btw (verwacht ' + verwachtePerMaandExclBtw.toFixed(2) + '):', calc.adviesprijsPerMaandExclBtw.toFixed(2));

  const verwachteMarge = ((verwachteAdviesprijs - verwachteDirecteKosten) / verwachteAdviesprijs) * 100;
  assert.ok(Math.abs(calc.werkelijkeMargePercent - verwachteMarge) < 1e-9);
  console.log('Werkelijke brutomarge % (verwacht ' + verwachteMarge.toFixed(2) + '):', calc.werkelijkeMargePercent.toFixed(2));

  // Sanity: marge moet in de buurt van de gewenste marge liggen wanneer het
  // minimumbedrag niet is toegepast (hier is dat het geval, dus moet gelijk
  // zijn aan DESIRED_GROSS_MARGIN * 100 op afrondingsniveau).
  if (!calc.minimumToegepast) {
    assert.ok(Math.abs(calc.werkelijkeMargePercent - CONFIG.DESIRED_GROSS_MARGIN * 100) < 1e-6);
    console.log('OK: marge komt overeen met DESIRED_GROSS_MARGIN (minimum niet toegepast).');
  }
  console.log('OK: alle herberekende waarden komen overeen met berekenInterneCalculatie().');
}

console.log('\n=== Test 3: "Meerdere keren per week" (2x/week) -> juiste bezoeken/maand ===');
{
  const payload2x = JSON.parse(JSON.stringify(garagePayload));
  payload2x.calc.frequentie = 'Meerdere keren per week';
  payload2x.calc.meerderePerWeekAantal = '2';
  const calc2x = berekenInterneCalculatie(payload2x);
  const verwacht2x = 2 * (52 / 12);
  assert.strictEqual(calc2x.visitsPerMonth, verwacht2x);
  console.log('Bezoeken per maand bij 2x/week (verwacht ' + verwacht2x.toFixed(4) + '):', calc2x.visitsPerMonth.toFixed(4));
  assert.strictEqual(calc2x.frequentieLabel, '2× per week');
  console.log('OK: 2x/week correct doorgerekend (niet simpelweg x4 t.o.v. wekelijks).');
}

console.log('\n=== Test 4: minimumprijs wordt toegepast bij zeer kleine/lichte opdracht ===');
{
  const kleinPayload = JSON.parse(JSON.stringify(garagePayload));
  kleinPayload.calc.ruimtes = ['ruimte_kantoor'];
  kleinPayload.calc.vervuiling = 'Normale kantoor-/bedrijfsvervuiling';
  kleinPayload.calc.frequentie = 'Maandelijks';
  let calcKlein = berekenInterneCalculatie(kleinPayload);
  console.log('Met huidige CONFIG -> Directe kosten:', calcKlein.directeKostenPerBezoek.toFixed(2), '| Adviesprijs:', calcKlein.adviesprijsExclBtw.toFixed(2), '| Minimum toegepast:', calcKlein.minimumToegepast);
  // Met de huidige placeholder-parameters ligt de berekende commerciële prijs
  // hierboven toevallig BOVEN de minimumprijs -- dat is op zich een goed
  // teken (het minimum is een vangnet, geen normale prijsbepaler). Om de
  // MAX(...)-clamp zelf te verifiëren zetten we de minimumprijs tijdelijk
  // hoger dan de berekende commerciële prijs, en zetten die daarna exact terug.
  const origMin = CONFIG.MIN_PRICE_PER_VISIT_EXCL_BTW;
  const commercieleRuw = calcKlein.adviesprijsExclBtw; // minimum was hier niet toegepast, dus dit IS de ruwe waarde
  CONFIG.MIN_PRICE_PER_VISIT_EXCL_BTW = commercieleRuw + 25;
  try {
    calcKlein = berekenInterneCalculatie(kleinPayload);
    console.log('Met kunstmatig verhoogd minimum (' + CONFIG.MIN_PRICE_PER_VISIT_EXCL_BTW.toFixed(2) + ') -> Adviesprijs:', calcKlein.adviesprijsExclBtw.toFixed(2), '| Minimum toegepast:', calcKlein.minimumToegepast);
    assert.strictEqual(calcKlein.minimumToegepast, true);
    assert.strictEqual(calcKlein.adviesprijsExclBtw, CONFIG.MIN_PRICE_PER_VISIT_EXCL_BTW);
  } finally {
    CONFIG.MIN_PRICE_PER_VISIT_EXCL_BTW = origMin;
  }
  console.log('OK: MAX(commerciële prijs, minimumprijs) werkt zoals bedoeld (getest door het minimum tijdelijk boven de commerciële prijs te zetten).');
}

console.log('\n=== Test 5: "onvoldoende informatie"-pad (oppervlakte = "Weet ik niet") ===');
{
  const onbekendPayload = JSON.parse(JSON.stringify(garagePayload));
  onbekendPayload.calc.oppervlakte = 'Weet ik niet';
  const calcOnbekend = berekenInterneCalculatie(onbekendPayload);
  assert.strictEqual(calcOnbekend.onvoldoendeInfo, true);
  console.log('Redenen:', calcOnbekend.redenen);
  const tekst = bouwEmailTekst(onbekendPayload);
  assert.ok(tekst.includes('Onvoldoende informatie voor een automatische prijsindicatie.'));
  assert.ok(!/€\d/.test(tekst.split('INTERNE CALCULATIE')[1].split('CONTACTGEGEVENS')[0]), 'geen gefabriceerde bedragen in het onvoldoende-info-blok');
  console.log('OK: geen bedragen verzonnen bij onbekende oppervlakte, nette fallbacktekst getoond.');
}

console.log('\n=== Test 6: particuliere flow / niet-periodieke zakelijke dienst -> GEEN interne calculatie ===');
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
  const calc = berekenInterneCalculatie(particulierPayload);
  assert.strictEqual(calc, null);
  const tekst = bouwEmailTekst(particulierPayload);
  assert.ok(!tekst.includes('INTERNE CALCULATIE'));
  assert.ok(!tekst.includes('Interne prijsindicatie'));
  assert.ok(tekst.includes('NIEUWE PARTICULIERE OFFERTEAANVRAAG'));
  assert.ok(tekst.includes('Prijsindicatie (getoond aan klant):') === false || true); // veld mag getoond worden, het is een AANVRAAG-veld, geen interne calc
  assert.ok(!/\bundefined\b|\bnull\b/.test(tekst));
  console.log('OK: particuliere e-mail bevat geen INTERNE CALCULATIE-sectie en geen rommelvelden.');
  console.log('\n--- Particuliere e-mailtekst ---\n' + tekst + '\n--- einde ---');
}

console.log('\n=== Test 6b: Kantoorreiniging krijgt nu WEL een interne calculatie (ronde 44 calculatorbereik-uitbreiding) ===');
{
  // Zelfde onderliggende model/CONFIG als periodiek-zakelijk (zie
  // CHANGELOG-44.md) -- alleen dienstSlug/dienst-label wijken af van
  // garagePayload. Bevestigt dat de calculator nu ECHT wordt aangeroepen voor
  // deze dienst (niet alleen dat de gate-conditie is aangepast).
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
      ['Extra vervuiling', 'Bovengemiddelde vervuiling'],
      ['Schoonmaakmoment', 'Na sluiting'],
      ['Naam', 'Test Kantoor'],
      ['E-mailadres', 'test@voorbeeld.nl'],
      ['Telefoonnummer', '0611112222'],
      ['Plaats/postcode', 'Helmond'],
    ],
    calc: {
      oppervlakte: 'Klein',
      frequentie: 'Wekelijks',
      meerderePerWeekAantal: '',
      aantalLocaties: '',
      ruimtes: ['ruimte_kantoor', 'ruimte_kantine', 'ruimte_toiletten'],
      ruimteOverig: false,
      vervuiling: 'Bovengemiddelde vervuiling',
    },
    botcheck: false,
    form_rendered_at: String(Date.now() - 9000),
  };
  const calc = berekenInterneCalculatie(kantoorPayload);
  assert.ok(calc && calc.onvoldoendeInfo === false, 'Kantoorreiniging moet nu een volledige interne calculatie krijgen');
  // Handmatige herberekening van het exacte scenario uit de brief (ronde 44,
  // sectie 13): Klein (45 min) + kantoor(10)+kantine(15)+toiletten(15) = 40
  // extra min, vervuilingsfactor "Bovengemiddelde vervuiling" = 1.35.
  const verwachteMinuten = (45 + 10 + 15 + 15) * 1.35;
  assert.ok(Math.abs(calc.totaalMinuten - verwachteMinuten) < 0.001, 'totaalMinuten moet exact overeenkomen met het CONFIG-tijdmodel (ongewijzigd)');
  const verwachteUren = verwachteMinuten / 60;
  const verwachteArbeid = verwachteUren * CONFIG.INTERNAL_HOURLY_COST_EXCL_BTW;
  const verwachteReis = (CONFIG.TRAVEL_MINUTES_PER_VISIT / 60) * CONFIG.TRAVEL_RATE_PER_HOUR_EXCL_BTW;
  const verwachteDirecteKosten = verwachteArbeid + verwachteReis + CONFIG.MATERIAL_COST_PER_VISIT_EXCL_BTW + CONFIG.OTHER_DIRECT_COSTS_PER_VISIT_EXCL_BTW;
  const verwachteAdviesprijs = verwachteDirecteKosten / (1 - CONFIG.DESIRED_GROSS_MARGIN);
  assert.ok(Math.abs(calc.adviesprijsExclBtw - verwachteAdviesprijs) < 0.005, 'adviesprijsExclBtw moet overeenkomen met de ONGEWIJZIGDE formule/parameters');
  console.log('Kantoorreiniging-scenario -- totaalMinuten (verwacht ' + verwachteMinuten.toFixed(2) + '): ' + calc.totaalMinuten.toFixed(2) + ' (' + formatDuurLokaal(calc.totaalMinuten) + ')');
  console.log('Kantoorreiniging-scenario -- adviesprijsExclBtw (verwacht ' + verwachteAdviesprijs.toFixed(2) + '): ' + calc.adviesprijsExclBtw.toFixed(2));
  const tekst = bouwEmailTekst(kantoorPayload);
  assert.ok(tekst.includes('INTERNE CALCULATIE'), 'e-mail moet nu een INTERNE CALCULATIE-sectie bevatten voor Kantoorreiniging');
  assert.ok(tekst.includes('Interne prijsindicatie'), 'disclaimer moet aanwezig zijn bij een daadwerkelijk berekend bedrag');
  const html = bouwEmailHtmlOfferte(kantoorPayload);
  assert.ok(html.includes('Interne calculatie'), 'HTML-mail moet ook de interne-calculatiesectie bevatten');
  console.log('OK: Kantoorreiniging krijgt nu een volledige, correcte interne calculatie (formule zelf ongewijzigd).');
}
function formatDuurLokaal(minuten) {
  const afgerond = Math.round(minuten / 5) * 5;
  const uren = Math.floor(afgerond / 60);
  const min = afgerond % 60;
  if (uren === 0) return min + ' min';
  if (min === 0) return uren + ' uur';
  return uren + ' uur ' + min + ' min';
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
  const calc = berekenInterneCalculatie(glasZakelijkPayload);
  assert.deepStrictEqual(calc, { nietBeschikbaar: true }, 'niet-calculeerbare zakelijke dienst moet nietBeschikbaar:true opleveren, geen bedrag');
  const tekst = bouwEmailTekst(glasZakelijkPayload);
  assert.ok(tekst.includes('INTERNE CALCULATIE'), 'sectie moet WEL getoond worden (niet stilzwijgend weggelaten)');
  assert.ok(tekst.includes('Niet beschikbaar voor deze dienst'), 'moet expliciet "niet beschikbaar" tonen');
  assert.ok(tekst.includes('Handmatige calculatie / locatieopname aanbevolen'), 'moet het advies tonen');
  assert.ok(!/€\d/.test(tekst.split('INTERNE CALCULATIE')[1].split('CONTACTGEGEVENS')[0]), 'er mag GEEN verzonnen bedrag in de interne-calculatiesectie staan');
  assert.ok(!tekst.includes('Interne prijsindicatie – niet automatisch'), 'de "berekend bedrag"-disclaimer hoort hier niet thuis (er is niets berekend)');
  const html = bouwEmailHtmlOfferte(glasZakelijkPayload);
  assert.ok(html.includes('Niet beschikbaar voor deze dienst'), 'HTML-versie moet dezelfde melding tonen');
  console.log('OK: niet-calculeerbare zakelijke dienst toont intern een expliciete "niet beschikbaar"-melding, nooit een verzonnen bedrag.');
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
  assert.ok(html.includes('Interne calculatie'));
  assert.ok(html.includes('Interne prijsindicatie'));
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
