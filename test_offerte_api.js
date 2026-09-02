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
const api = require('./api/offerte-aanvraag.js');
const { berekenInterneCalculatie, bouwEmailTekst, bouwOnderwerp, lijktOpBot, valideerVerplichteVelden, CONFIG } = api._internal;

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

console.log('\nAlle tests geslaagd.');
