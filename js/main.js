// Mobiel menu werkt volledig via CSS (checkbox-methode), geen JS nodig.

// Pakketkaarten (particuliere detailpagina's): "Bekijk wat inbegrepen is"
// klapt alleen de onderdelenlijst van díe kaart open/dicht — geen nieuwe
// pagina, geen popup. Kaarten werken onafhankelijk van elkaar: Basis,
// Uitgebreid en Compleet mogen tegelijk open staan, zodat een bezoeker ze
// naast elkaar kan vergelijken. Puur een hidden-toggle, geen
// IntersectionObserver erbij betrokken — de inhoud is dus altijd
// betrouwbaar beschikbaar. Zelfstandige initialisatiefunctie, veilig
// aangeroepen na DOMContentLoaded en in een try/catch: een eventuele fout
// elders in dit bestand mag nooit verhinderen dat de pakketknoppen werken.
function setPakketToggleState(btn, expanded) {
  btn.setAttribute('aria-expanded', String(expanded));
  const label = btn.querySelector('.pakket-toggle-label');
  const arrow = btn.querySelector('.pakket-toggle-arrow');
  if (label) label.textContent = expanded ? 'Minder informatie' : 'Bekijk wat inbegrepen is';
  if (arrow) arrow.textContent = expanded ? '\u2191' : '\u2193';
}
function initPakketCards() {
  document.querySelectorAll('.pakket-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.getAttribute('aria-controls'));
      if (!target) return;
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      setPakketToggleState(btn, !expanded);
      target.hidden = expanded;
    });
  });
}
function safeInitPakketCards() {
  try { initPakketCards(); } catch (e) { /* nooit de rest van de pagina blokkeren */ }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', safeInitPakketCards);
} else {
  // Dit script heeft al 'defer', dus de DOM is normaliter al klaar; deze
  // vertakking is puur een extra vangnet voor het geval het script ooit
  // zonder 'defer' of dynamisch wordt ingeladen.
  safeInitPakketCards();
}

// Footer-terugbelformulier (op elke pagina aanwezig, via render_footer() in
// generate.py). Stuurt, net als de offertewizard, een JSON fetch() naar een
// eigen server-side endpoint (/api/contact-aanvraag) zodat er nooit een
// mailing-service access key in publieke HTML/JS hoeft te staan (dat
// endpoint verstuurt sinds ronde 43 via Resend, was Web3Forms -- zie
// CHANGELOG-43.md; deze client-side flow zelf is daardoor niet gewijzigd).
// UX/validatie/honeypot blijven functioneel hetzelfde: dezelfde verplichte
// velden (naam/telefoon/e-mail), dezelfde HTML5-constraint-validatie (geen
// `novalidate`, dus de browser blokkeert een ongeldige inzending zoals
// voorheen), dezelfde onzichtbare honeypot-checkbox. Bij succes dezelfde
// doorverwijzing naar thanks.html als voorheen, via JS.
function initFooterForm() {
  const form = document.getElementById('footerTerugbelForm');
  if (!form) return;
  const renderedAtField = document.getElementById('footerFormRenderedAtField');
  if (renderedAtField) renderedAtField.value = String(Date.now());
  const statusEl = document.getElementById('footerFormStatus');
  const submitBtn = form.querySelector('.footer-form-submit');
  const submitLabelDefault = submitBtn ? submitBtn.textContent : '';
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (form.dataset.submitting === '1') return;
    // Native HTML5-validatie (required/pattern) is al gecontroleerd voordat
    // dit submit-event vuurt (geen novalidate op het formulier) -- exact
    // hetzelfde gedrag als bij de vroegere native form-POST.
    const botcheckInput = form.querySelector('input[name="botcheck"]');
    const payload = {
      naam: (form.querySelector('input[name="naam"]') || {}).value || '',
      telefoon: (form.querySelector('input[name="telefoon"]') || {}).value || '',
      email: (form.querySelector('input[name="email"]') || {}).value || '',
      bedrijfsnaam: (form.querySelector('input[name="bedrijfsnaam"]') || {}).value || '',
      bericht: (form.querySelector('textarea[name="bericht"]') || {}).value || '',
      botcheck: !!(botcheckInput && botcheckInput.checked),
      form_rendered_at: renderedAtField ? renderedAtField.value : '',
    };
    form.dataset.submitting = '1';
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Bezig met verzenden…'; }
    if (statusEl) statusEl.textContent = 'Bezig met verzenden…';
    fetch(form.getAttribute('action') || '/api/contact-aanvraag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(res => res.json().catch(() => ({})).then(data => {
      if (!res.ok || (data && data.ok === false)) throw new Error((data && data.error) || ('http-' + res.status));
      window.location.href = '/thanks.html';
    })).catch(() => {
      form.dataset.submitting = '';
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = submitLabelDefault; }
      if (statusEl) statusEl.textContent = 'Er ging iets mis bij het verzenden. Probeer het nog eens, of bel ons rechtstreeks via het nummer bovenaan de pagina.';
    });
  });
}
function safeInitFooterForm() {
  try { initFooterForm(); } catch (e) { /* nooit de rest van de pagina blokkeren */ }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', safeInitFooterForm);
} else {
  safeInitFooterForm();
}

// Offerte-wizard
(function () {
  const form = document.getElementById('offerteWizard');
  if (!form) return;

  const steps = Array.from(form.querySelectorAll('.wizard-step'));
  const fill = document.getElementById('wizardFill');
  const backBtn = document.getElementById('wizardBack');
  const nextBtn = document.getElementById('wizardNext');
  const submitBtn = document.getElementById('wizardSubmit');
  const statusEl = document.getElementById('wizardStatus');
  const subjectInput = document.getElementById('wizardSubject');
  const liveRegion = document.getElementById('wizardLive');
  const stepLabelEl = document.getElementById('wizardStepLabel');
  let current = 1;

  // === Klantgerichte fasenvoortgang (Woning \u2192 Extra's \u2192 Gegevens \u2192
  // Controleren) — een VISUELE groepering bovenop de bestaande technische
  // stappen, alleen voor de particuliere flow. De technische stapnummers en
  // -logica blijven ongewijzigd; dit vertaalt alleen welk nummer bij welke
  // klantfase hoort. Selectiestappen (klanttype/dienst/pakket) en de
  // zakelijke/VvE-stappen tellen niet mee als fase (null) — de balk blijft
  // dan verborgen, precies zoals gevraagd.
  const STEP_PHASE = { 1: null, 2: null, 3: null, 4: 'woning', 5: 'extras', 6: 'woning', 7: null, 8: null, 9: null, 10: 'gegevens', 11: 'gegevens', 12: 'controleren' };
  const PHASE_ORDER = ['woning', 'extras', 'gegevens', 'controleren'];
  const PHASE_LABELS = { woning: 'Woning', extras: "Extra's", gegevens: 'Gegevens', controleren: 'Controleren' };
  const phasesNav = document.getElementById('wizardPhases');
  const phaseEls = phasesNav ? Array.from(phasesNav.querySelectorAll('.wizard-phase')) : [];
  const phaseNowEl = document.getElementById('wizardPhaseNow');
  const phaseNextEl = document.getElementById('wizardPhaseNext');
  const phaseFillEl = document.getElementById('wizardPhaseFill');
  function updatePhaseNav(stepNum) {
    if (!phasesNav) return;
    const phase = STEP_PHASE[stepNum];
    if (!phase || currentKlanttype() !== 'particulier') { phasesNav.hidden = true; return; }
    phasesNav.hidden = false;
    const idx = PHASE_ORDER.indexOf(phase);
    phaseEls.forEach(el => {
      const p = el.getAttribute('data-phase');
      const i = PHASE_ORDER.indexOf(p);
      el.classList.toggle('is-done', i < idx);
      el.classList.toggle('is-current', i === idx);
    });
    if (phaseNowEl) phaseNowEl.textContent = PHASE_LABELS[phase];
    const next = PHASE_ORDER[idx + 1];
    if (phaseNextEl) phaseNextEl.textContent = next ? ('Hierna: ' + PHASE_LABELS[next] + ' \u2192') : '';
    if (phaseFillEl) phaseFillEl.style.width = (((idx + 1) / PHASE_ORDER.length) * 100) + '%';
  }

  function currentStepEl() {
    return steps.find(s => parseInt(s.dataset.step, 10) === current);
  }

  // === Welke stappen zijn op dit moment relevant? ===
  // Een stap kan data-applies-to="bedrijf vve" of "particulier" hebben (leeg/afwezig
  // = altijd relevant), en optioneel data-requires-dienst="periodiek" (alleen
  // relevant als de gekozen particuliere dienst-slug hiermee overeenkomt).
  function currentKlanttype() {
    const map = { 'Bedrijf': 'bedrijf', 'VvE / organisatie': 'vve', 'Particulier': 'particulier' };
    const checked = form.querySelector('input[name="klanttype"]:checked');
    return checked ? (map[checked.value] || '') : '';
  }
  function currentDienstSlug() {
    const checked = form.querySelector('input[name="dienst"]:checked:not(:disabled)');
    if (!checked) return '';
    const wrap = checked.closest('.rc-wrap');
    return wrap ? (wrap.getAttribute('data-dienst-slug') || '') : '';
  }
  function stepApplies(stepEl) {
    if (!stepEl) return false;
    const types = stepEl.getAttribute('data-applies-to');
    if (types && !types.split(' ').includes(currentKlanttype())) return false;
    // data-requires-dienst ondersteunt (net als data-applies-to/-excludes-dienst)
    // meerdere spatie-gescheiden waarden — nodig sinds ronde 44, waarin stap 9
    // zowel bij "periodiek-zakelijk" als bij "kantoorreiniging" van toepassing is.
    // Eén losse waarde (het meest voorkomende geval) gedraagt zich identiek aan
    // de oude exacte '!==='-vergelijking.
    const requiresDienst = stepEl.getAttribute('data-requires-dienst');
    if (requiresDienst && !requiresDienst.split(' ').includes(currentDienstSlug())) return false;
    const excludesDienst = stepEl.getAttribute('data-excludes-dienst');
    if (excludesDienst && excludesDienst.split(' ').includes(currentDienstSlug())) return false;
    return true;
  }
  function applicableSteps() {
    return steps.filter(stepApplies).map(s => parseInt(s.dataset.step, 10));
  }

  // === Auto-advance (ronde 44) ===
  // Voor stappen met precies ÉÉN mogelijk antwoord (klanttype, dienst, pakket,
  // oppervlakte, frequentie-particulier, en frequentie-zakelijk behalve bij
  // "Meerdere keren per week") gaat de wizard na een korte, zichtbare
  // bevestiging (het geselecteerde kaartje krijgt direct zijn 'geselecteerd'-
  // stijl) automatisch door naar de volgende stap — zie CHANGELOG-44.md.
  // Bewust GEEN auto-advance op samengestelde stappen (bijv. stap 4/5/9) waar
  // meerdere losse keuzes gecombineerd moeten worden vóór de stap compleet is.
  //
  // Betrouwbaarheid: de timer wordt uitsluitend gestart vanuit een 'change'-
  // event van een ECHTE gebruikersactie (klik/toetsenbord) — een programmatische
  // `.checked = true` (bijv. bij URL-voorselectie, of bij het legen/resetten van
  // velden elders in dit bestand) vuurt in JavaScript nooit een 'change'-event,
  // dus kan nooit per ongeluk een auto-advance triggeren. Bij elke handmatige
  // navigatie (Terug/Volgende/Keuze wijzigen) en bij elke aanroep van show()
  // zelf wordt een eventueel nog lopende timer meteen geannuleerd — zo kan een
  // late auto-advance nooit een inmiddels handmatige stap-wissel overschrijven,
  // en springt de wizard bij terug-navigeren nooit vanzelf weer vooruit alleen
  // omdat er al een eerdere keuze staat (die keuze is dan geen NIEUWE
  // gebruikersactie, dus er is ook geen 'change'-event geweest om een timer te
  // starten).
  let autoAdvanceTimer = null;
  const AUTO_ADVANCE_DELAY_MS = 200;
  function cancelAutoAdvance() {
    if (autoAdvanceTimer) { clearTimeout(autoAdvanceTimer); autoAdvanceTimer = null; }
  }
  function scheduleAutoAdvance(fromStep) {
    cancelAutoAdvance();
    autoAdvanceTimer = setTimeout(() => {
      autoAdvanceTimer = null;
      // Nooit doorspringen als de gebruiker in de tussentijd al (handmatig of
      // via een andere weg) een andere stap heeft bereikt.
      if (current !== fromStep) return;
      if (!validateStep()) return;
      const appl = applicableSteps();
      const idx = appl.indexOf(current);
      if (idx > -1 && idx < appl.length - 1) { current = appl[idx + 1]; show(current, true); }
    }, AUTO_ADVANCE_DELAY_MS);
  }

  // Welke radiogroepen zijn "pure" single-choice stappen (geen ander verplicht
  // veld op dezelfde stap) en mogen dus auto-advancen. "frequentie" staat hier
  // bewust NIET generiek in — die kent één uitzondering ("Meerdere keren per
  // week", zie hieronder) en wordt daarom apart afgehandeld.
  const AUTO_ADVANCE_RADIO_NAMES = ['klanttype', 'dienst', 'pakket', 'oppervlakte', 'frequentie_particulier'];

  // === Ronde 45: één centrale, delegated 'change'-listener voor auto-advance ===
  // Eerder (ronde 44) werd scheduleAutoAdvance() per veld los aangeroepen,
  // verspreid over losse `form.querySelectorAll(...).forEach(el =>
  // el.addEventListener('change', ...))`-blokken. Dat werkte aantoonbaar in
  // alle geautomatiseerde tests, maar is inherent kwetsbaarder dan nodig: elke
  // los gebonden listener hangt af van het moment/de volgorde waarop dat
  // specifieke queryAll-blok draait, en bindt alleen aan de radio's die op
  // dát moment al in de DOM staan. Eén listener op het <form>-element zelf
  // (event delegation) vangt ELKE 'change' die vanaf een radio-input omhoog
  // bubbelt, ongeacht wanneer/hoe die specifieke listener-registratie liep —
  // dit is dezelfde bestaande scheduleAutoAdvance()/cancelAutoAdvance()-
  // architectuur, alleen de manier waarop de trigger wordt opgevangen is
  // robuuster gemaakt. De eigen effecten per veld (applyKlanttype/applyDienst/
  // syncPakketNaamField/het "Meerdere keren per week"-veld tonen, etc.) blijven
  // gewoon in hun eigen listeners hieronder — deze delegated listener regelt
  // uitsluitend het WEL/NIET auto-advancen, op precies dezelfde velden als
  // voorheen.
  form.addEventListener('change', (e) => {
    const t = e.target;
    if (!t || t.tagName !== 'INPUT' || t.type !== 'radio' || !t.checked) return;
    if (AUTO_ADVANCE_RADIO_NAMES.indexOf(t.name) !== -1) {
      scheduleAutoAdvance(current);
    } else if (t.name === 'frequentie' && t.value !== 'Meerdere keren per week') {
      // Stap 8 (frequentie, zakelijk/VvE): pure single-choice, BEHALVE bij
      // "Meerdere keren per week" — dan verschijnt een extra verplicht
      // invoerveld op dezelfde stap (zie brief ronde 44, sectie 6).
      scheduleAutoAdvance(current);
    }
  });

  // Ronde 46: het optionele exacte-m²-veld staat op dezelfde stap (7) als de
  // auto-advancende oppervlakte-categoriekaarten. Zonder ingreep zou een
  // gebruiker die eerst een categorie aanklikt (waarmee de 200ms-auto-advance-
  // timer start) en daarna nog een exact m²-getal wil intypen, halverwege naar
  // stap 8 kunnen worden doorgestuurd. Elke focus/invoer in dit veld annuleert
  // daarom een eventueel lopende auto-advance-timer, zodat de gebruiker onbeperkt
  // de tijd heeft om te typen — daarna blijft "Volgende" gewoon beschikbaar.
  const oppervlakteM2ExactInput = document.getElementById('oppervlakte_m2_exact');
  if (oppervlakteM2ExactInput) {
    ['focus', 'input'].forEach(evt => {
      oppervlakteM2ExactInput.addEventListener(evt, cancelAutoAdvance);
    });
  }

  function show(stepNum, scrollTo) {
    cancelAutoAdvance();
    steps.forEach(s => { s.hidden = parseInt(s.dataset.step, 10) !== stepNum; });
    // Robuustheid: bij het openen van de pakket- of extra's-stap altijd opnieuw
    // uitlezen welke dienst nu daadwerkelijk gekozen is en de pakketten/extra's
    // daarop afstemmen — nooit alleen vertrouwen op het change-event van de
    // vorige stap (dat kan gemist zijn bij terugnavigeren, voorinvullen via
    // URL-parameters, of een programmatische wijziging).
    if (stepNum === 3 || stepNum === 4 || stepNum === 5) applyDienst(currentDienstSlug());
    if (stepNum === 4 || stepNum === 5 || stepNum === 6 || stepNum === 12) updatePrijsIndicatie();
    const appl = applicableSteps();
    const idx = appl.indexOf(stepNum);
    const pos = idx === -1 ? 1 : idx + 1;
    const totalAppl = appl.length || 1;
    fill.style.width = (pos / totalAppl * 100) + '%';
    updatePhaseNav(stepNum);
    backBtn.hidden = pos === 1;
    nextBtn.hidden = pos === totalAppl;
    submitBtn.hidden = pos !== totalAppl;
    if (pos === totalAppl) buildSummary();
    if (scrollTo) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Focus en aria-live: verplaats focus naar de nieuwe stap-titel, zodat
    // toetsenbord- en schermlezergebruikers meekrijgen dat de stap wisselde,
    // zonder dat de focus op een inmiddels verborgen knop achterblijft.
    const heading = currentStepEl() && currentStepEl().querySelector('.wizard-q');
    const label = 'Stap ' + pos + ' van ' + totalAppl + (heading ? ': ' + heading.textContent : '');
    if (stepLabelEl) stepLabelEl.textContent = label;
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
      if (liveRegion) liveRegion.textContent = label;
    }
  }

  function validateStep() {
    const el = currentStepEl();
    // :not(:disabled) is bewust: verborgen/irrelevante velden zijn disabled
    // (zie applyKlanttype hieronder) en mogen nooit gevalideerd worden.
    const requiredFields = el.querySelectorAll('[required]:not(:disabled)');
    for (const field of requiredFields) {
      if (field.type === 'radio') {
        const group = el.querySelectorAll(`input[name="${field.name}"]:not(:disabled)`);
        const anyChecked = Array.from(group).some(r => r.checked);
        if (!anyChecked) {
          if (field.reportValidity) field.reportValidity();
          if (statusEl) statusEl.textContent = 'Maak een keuze om verder te gaan.';
          return false;
        }
      } else if (!field.checkValidity()) {
        field.reportValidity();
        if (statusEl) statusEl.textContent = 'Controleer het gemarkeerde veld.';
        return false;
      }
    }
    if (statusEl) statusEl.textContent = '';
    return true;
  }

  nextBtn.addEventListener('click', () => {
    if (!validateStep()) return;
    const appl = applicableSteps();
    const idx = appl.indexOf(current);
    if (idx > -1 && idx < appl.length - 1) { current = appl[idx + 1]; show(current, true); }
  });
  backBtn.addEventListener('click', () => {
    const appl = applicableSteps();
    const idx = appl.indexOf(current);
    if (idx > 0) { current = appl[idx - 1]; show(current, true); }
  });

  // === Klanttype bepaalt welke diensten en velden relevant zijn ===
  // Geen auto-advance meer na een keuze: de gebruiker ziet zijn keuze eerst
  // bevestigd (rc-card krijgt direct de 'geselecteerd'-stijl) en klikt zelf op
  // 'Volgende'. Dat is voorspelbaarder op mobiel (geen onverwachte
  // schermwissel net na een tik) en betrouwbaarder voor toetsenbordgebruikers.
  const TYPE_MAP = { 'Bedrijf': 'bedrijf', 'VvE / organisatie': 'vve', 'Particulier': 'particulier' };
  // Ronde 44: dienst-slugs waarvoor wizard-stap 9 (ruimtes/vervuiling/moment) en
  // de interne calculatie van toepassing zijn — was uitsluitend "periodiek-zakelijk",
  // nu ook "kantoorreiniging" (zelfde onderliggende vraagset/tijdmodel, zie
  // CHANGELOG-44.md). Eén bron van waarheid, gebruikt door zowel applyDienst()
  // (stap-9-velden resetten) als collectRows() (welke velden in de samenvatting/
  // e-mail terechtkomen) — moet in sync blijven met data-requires-dienst op stap 9
  // in generate.py (contact_form()) en de server-side gate in
  // api/offerte-aanvraag.js (berekenInterneCalculatie()).
  const CALC_DIENST_SLUGS = ['periodiek-zakelijk', 'kantoorreiniging'];
  const dienstWraps = Array.from(form.querySelectorAll('#offerteWizard .wizard-step[data-step="2"] .rc-wrap'));
  const bedrijfsnaamField = document.getElementById('fieldBedrijfsnaam');
  const bedrijfsnaamInput = document.getElementById('bedrijfsnaam');
  const aantalLocatiesField = document.getElementById('fieldAantalLocaties');
  const aantalLocatiesInput = document.getElementById('aantal_locaties');
  const oppQ = document.getElementById('oppervlakteQ');
  const oppSub = document.getElementById('oppervlakteSub');
  const toelichtingQ = document.getElementById('toelichtingQ');

  // === Zakelijke/VvE stap 9 (ruimtes/vervuiling/moment) — alleen relevant bij
  // dienst-slug "periodiek-zakelijk" (Periodieke bedrijfsschoonmaak / Periodieke
  // schoonmaak bij VvE). Ruimte-checkboxes hebben BEWUST geen name-attribuut
  // (zie generate.py, contact_form): ze worden nooit los meegestuurd, alleen
  // samengevoegd in het verborgen "ruimtes"-veld — zo kan hier nooit een lawine
  // aan losse ruimte_*=on/off velden ontstaan.
  const zakelijkRuimteChecks = Array.from(form.querySelectorAll('#zakelijkRuimtes input[type="checkbox"]'));
  const ruimteOverigCheck = form.querySelector('#zakelijkRuimtes input[data-ruimte-id="ruimte_overig"]');
  const ruimteOverigWrap = document.getElementById('ruimteOverigWrap');
  const ruimteOverigInput = document.getElementById('ruimte_overig_toelichting');
  const ruimtesField = document.getElementById('ruimtesField');
  const vervuilingZakelijkToelichtingWrap = document.getElementById('vervuilingZakelijkToelichtingWrap');
  const vervuilingZakelijkToelichtingInput = document.getElementById('vervuiling_zakelijk_toelichting');
  const meerderePerWeekField = document.getElementById('fieldMeerderePerWeek');
  const meerderePerWeekInput = document.getElementById('meerdere_per_week_aantal');

  function syncRuimtesField() {
    if (!ruimtesField) return;
    const labels = zakelijkRuimteChecks.filter(cb => cb.checked).map(cb => {
      const span = cb.closest('.cb-card') && cb.closest('.cb-card').querySelector('span');
      return span ? span.textContent : cb.getAttribute('data-ruimte-id');
    });
    ruimtesField.value = labels.join(', ');
  }
  zakelijkRuimteChecks.forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb === ruimteOverigCheck) {
        if (ruimteOverigWrap) ruimteOverigWrap.hidden = !cb.checked;
        if (cb.checked) enableField(ruimteOverigInput); else clearAndDisable(ruimteOverigInput);
      }
      syncRuimtesField();
    });
  });
  form.querySelectorAll('input[name="vervuilingsgraad_zakelijk"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const isAnders = radio.value === 'Anders / toelichting';
      if (vervuilingZakelijkToelichtingWrap) vervuilingZakelijkToelichtingWrap.hidden = !isAnders;
      if (isAnders) enableField(vervuilingZakelijkToelichtingInput); else clearAndDisable(vervuilingZakelijkToelichtingInput);
    });
  });
  form.querySelectorAll('input[name="frequentie"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const toonAantalVeld = radio.value === 'Meerdere keren per week';
      if (meerderePerWeekField) meerderePerWeekField.hidden = !toonAantalVeld;
      if (toonAantalVeld) enableField(meerderePerWeekInput); else clearAndDisable(meerderePerWeekInput);
      // Auto-advance voor deze stap loopt sinds ronde 45 via de centrale
      // delegated 'change'-listener op het form (zie hierboven bij
      // scheduleAutoAdvance) — inclusief de "Meerdere keren per week"-
      // uitzondering. Deze listener regelt hier uitsluitend het tonen/
      // verplicht maken van het aantal-per-week-veld.
    });
  });
  // Wist alle stap-9-velden en verbergt de bijbehorende toelichtingen — nodig
  // zodra klanttype wisselt naar particulier, of de zakelijke/VvE-dienst iets
  // anders wordt dan "periodiek-zakelijk" (zie applyKlanttype/applyDienst).
  function resetZakelijkPeriodiekStep() {
    zakelijkRuimteChecks.forEach(cb => { cb.checked = false; });
    syncRuimtesField();
    if (ruimteOverigWrap) ruimteOverigWrap.hidden = true;
    clearAndDisable(ruimteOverigInput);
    form.querySelectorAll('input[name="vervuilingsgraad_zakelijk"], input[name="schoonmaakmoment"], input[name="gebruiksintensiteit_zakelijk"]').forEach(r => { r.checked = false; });
    if (vervuilingZakelijkToelichtingWrap) vervuilingZakelijkToelichtingWrap.hidden = true;
    clearAndDisable(vervuilingZakelijkToelichtingInput);
  }

  // Particuliere stap-3/4-elementen (pakket + extra werkzaamheden), gefilterd op dienst-slug
  const pakketWraps = Array.from(form.querySelectorAll('.wizard-step[data-step="3"] .rc-wrap'));
  const extraCheckboxLabels = Array.from(form.querySelectorAll('#extraCheckboxes .cb-card[data-dienst-for]'));
  const counterCards = Array.from(form.querySelectorAll('.counter-card[data-dienst-for]'));
  const extraAndersCheck = document.getElementById('extraAndersCheck');
  const extraAndersWrap = document.getElementById('extraAndersWrap');
  const extraAndersInput = document.getElementById('extra_anders');
  const extraOptiesField = document.getElementById('extraOptiesField');
  const pakketNaamField = document.getElementById('pakketNaamField');
  // Subsecties bínnen een stap die per dienst getoond/verborgen moeten worden
  // (bijv. vervuilingsgraad niet bij periodiek, "Is de woning leeg" alléén bij
  // verhuisschoonmaak, "Wat is er verbouwd" alléén bij na-verbouwing) — een
  // lichtere variant van data-excludes-dienst/data-requires-dienst voor
  // stukken die geen eigen stap zijn.
  const subsections = Array.from(form.querySelectorAll('.wizard-subsection[data-excludes-dienst], .wizard-subsection[data-requires-dienst]'));
  function applySubsections(slug) {
    subsections.forEach(sub => {
      const excludes = (sub.getAttribute('data-excludes-dienst') || '').split(' ').filter(Boolean);
      const requires = (sub.getAttribute('data-requires-dienst') || '').split(' ').filter(Boolean);
      let hide = false;
      if (excludes.length && excludes.includes(slug)) hide = true;
      if (requires.length && !requires.includes(slug)) hide = true;
      sub.hidden = hide;
      sub.querySelectorAll('input').forEach(inp => { if (hide) clearAndDisable(inp); else enableField(inp); });
    });
  }
  // === Aantalselectors voor telbare extra opties ([\u2212] N [+]) ===
  function currentPakketId() {
    const checked = form.querySelector('input[name="pakket"]:checked:not(:disabled)');
    return checked ? checked.getAttribute('data-pakket-id') : null;
  }
  function inbegrepenAantal(slug, pakketId, extraId) {
    if (!prijsData || !prijsData.inbegrepen) return 0;
    const perDienst = prijsData.inbegrepen[slug];
    if (!perDienst) return 0;
    const perPakket = perDienst[pakketId];
    if (!perPakket) return 0;
    return perPakket[extraId] || 0;
  }
  // Werkt de "X inbegrepen in [pakket]"-notitie en het standaardaantal van
  // één teller bij, op basis van de nu geldende dienst + pakket. Als de
  // klant het aantal nog niet zelf heeft aangepast (waarde staat nog op het
  // vorige inbegrepen-aantal), wordt de nieuwe inbegrepen hoeveelheid
  // overgenomen; heeft de klant zelf al een hoger aantal gekozen, dan blijft
  // dat behouden (zie briefpunt 8: "behoud gekozen aantallen waar logisch").
  function updateCounterCard(card) {
    const slug = card.getAttribute('data-dienst-for');
    const eid = card.getAttribute('data-extra-id');
    const valueInput = card.querySelector('.counter-value');
    const noteEl = card.querySelector('.counter-included-note');
    const currentSlug = currentDienstSlug();
    const pakketId = currentSlug === slug ? currentPakketId() : null;
    const inbegrepen = (currentSlug === slug && pakketId) ? inbegrepenAantal(slug, pakketId, eid) : 0;
    const prevIncluded = parseInt(card.dataset.prevIncluded || '0', 10);
    const huidigeWaarde = parseInt(valueInput.value, 10) || 0;
    if (huidigeWaarde === prevIncluded) {
      valueInput.value = String(inbegrepen);
    }
    card.dataset.prevIncluded = String(inbegrepen);
    if (inbegrepen > 0) {
      const pakketRadio = form.querySelector('input[name="pakket"]:checked:not(:disabled)');
      const pakketNaam = pakketRadio ? pakketRadio.value : '';
      noteEl.textContent = '\u2713 ' + inbegrepen + ' inbegrepen in ' + pakketNaam;
      noteEl.hidden = false;
    } else {
      noteEl.hidden = true;
    }
  }
  function updateAllCounters() {
    counterCards.forEach(updateCounterCard);
  }
  counterCards.forEach(card => {
    const valueInput = card.querySelector('.counter-value');
    const maxAantal = parseInt(card.getAttribute('data-max'), 10) || 5;
    const minus = card.querySelector('.counter-minus');
    const plus = card.querySelector('.counter-plus');
    function setValue(v) {
      const minimum = parseInt(card.dataset.prevIncluded || '0', 10);
      const clamped = Math.max(minimum, Math.min(maxAantal, v));
      valueInput.value = String(clamped);
      syncExtraOptiesField();
      updatePrijsIndicatie();
    }
    minus.addEventListener('click', () => setValue((parseInt(valueInput.value, 10) || 0) - 1));
    plus.addEventListener('click', () => setValue((parseInt(valueInput.value, 10) || 0) + 1));
  });


  const prijsDataEl = document.getElementById('prijsData');
  let prijsData = null;
  try { prijsData = prijsDataEl ? JSON.parse(prijsDataEl.textContent) : null; } catch (e) { prijsData = null; }
  const prijsIndicatieField = document.getElementById('prijsIndicatieField');
  const FREQ_ID_MAP = { 'Wekelijks': 'wekelijks', 'Iedere 2 weken': '2weken', 'Iedere 4 weken': '4weken' };
  const ingerichtNote = document.getElementById('ingerichtNote');
  const bouwrestenNote = document.getElementById('bouwrestenNote');
  const glasBereikbaarheidNote = document.getElementById('glasBereikbaarheidNote');

  function getRadioValue(name) {
    const checked = form.querySelector(`input[name="${name}"]:checked:not(:disabled)`);
    return checked ? checked.value : '';
  }
  function staffelIdFromLabel(label) {
    if (!prijsData || !label) return null;
    return Object.keys(prijsData.staffelLabels).find(k => prijsData.staffelLabels[k] === label) || null;
  }

  // Berekent de huidige prijsindicatie op basis van alle op dit moment
  // ingevulde/aangevinkte gegevens. Geeft null terug als er nog te weinig
  // bekend is om iets te tonen (bijv. dienst of pakket nog niet gekozen),
  // of een resultaat-object met ofwel {opMaat:true, reden} ofwel
  // {opMaat:false, regels:[[label,bedrag],...], totaal, vanaf, perBeurt}.
  // Telbare extra opties (aantalselectors): per kaart wordt het gekozen
  // aantal vergeleken met het aantal dat al inbegrepen is in het huidige
  // pakket (bij periodiek altijd 0, want geen pakketten). Alleen het aantal
  // BOVEN het inbegrepen aantal wordt in rekening gebracht
  // (extraAantal = max(0, gekozen - inbegrepen)) — zo kan nooit dubbel
  // gerekend worden. Gedeeld door zowel de eenmalige diensten als periodiek.
  function berekenExtrasVoorDienst(slug, pakketId) {
    const regels = [];
    let totaal = 0;
    counterCards.forEach(card => {
      if (card.getAttribute('data-dienst-for') !== slug) return;
      const eid = card.getAttribute('data-extra-id');
      const prijs = parseInt(card.getAttribute('data-price'), 10) || 0;
      const info = prijsData.extras[eid];
      const label = info ? info.label : eid;
      const eenheid = info ? info.eenheid : 'stuk';
      const gekozen = parseInt(card.querySelector('.counter-value').value, 10) || 0;
      const inbegrepen = inbegrepenAantal(slug, pakketId, eid);
      if (gekozen <= 0) return;
      const inbegrepenGetoond = Math.min(gekozen, inbegrepen);
      if (inbegrepenGetoond > 0) {
        regels.push([inbegrepenGetoond + ' ' + label, 'Inbegrepen']);
      }
      const extraAantal = Math.max(0, gekozen - inbegrepen);
      if (extraAantal > 0) {
        const naam = (extraAantal > 1 ? extraAantal + ' extra ' + label : 'Extra ' + label) + ' (\u20ac' + prijs + ' per ' + eenheid + ')';
        regels.push([naam, extraAantal * prijs]);
        totaal += extraAantal * prijs;
      }
    });
    return { regels, totaal };
  }

  function berekenPrijs() {
    if (!prijsData) return null;
    const slug = currentDienstSlug();
    const staffelLabel = getRadioValue('woonoppervlakte_staffel');
    const staffelId = staffelIdFromLabel(staffelLabel);

    if (slug === 'periodiek') {
      const freqLabel = getRadioValue('frequentie_particulier');
      const freqId = FREQ_ID_MAP[freqLabel];
      if (!staffelId || !freqId) return null;
      if (staffelId === 'boven150') return { opMaat: true, reden: 'een woning boven de 150 m\u00b2' };
      const bedrag = prijsData.periodiek[staffelId] && prijsData.periodiek[staffelId][freqId];
      if (bedrag == null) return null;
      if (extraAndersCheck && extraAndersCheck.checked) {
        return { opMaat: true, reden: 'een aangepaste extra wens ("Anders, namelijk\u2026")' };
      }
      const { regels: extraRegelsPeriodiek, totaal: extraTotaalPeriodiek } = berekenExtrasVoorDienst('periodiek', null);
      const regelsPeriodiek = [['Prijs per beurt', bedrag]];
      extraRegelsPeriodiek.forEach(r => regelsPeriodiek.push(r));
      return { opMaat: false, regels: regelsPeriodiek, totaal: bedrag + extraTotaalPeriodiek, perBeurt: true, vanaf: false };
    }

    if (slug === 'glasbewassing-particulier') {
      // Nog geen vaste tarieven (zie brief) — altijd een prijs op maat,
      // maar wel al met een duidelijke, klantvriendelijke boodschap i.p.v.
      // stilte, zodra er genoeg bekend is om die te tonen.
      const glasType = getRadioValue('glas_type');
      if (!glasType) return null;
      return { opMaat: true, reden: 'glasbewassing \u2014 hier zijn nog geen vaste tarieven voor' };
    }

    const dienstPrijzen = prijsData.eenmalig[slug];
    if (!dienstPrijzen) return null; // oplevering / weet-niet: geen calculator voor deze dienst
    const pakketRadio = form.querySelector('input[name="pakket"]:checked:not(:disabled)');
    const pakketId = pakketRadio ? pakketRadio.getAttribute('data-pakket-id') : null;
    if (!pakketId || pakketId === 'weet-niet' || !staffelId) return null;
    if (staffelId === 'boven150') return { opMaat: true, reden: 'een woning boven de 150 m\u00b2' };

    const vervuiling = getRadioValue('vervuilingsgraad') || 'Normaal vervuild';
    if (vervuiling.indexOf('Zeer sterk') === 0) return { opMaat: true, reden: 'een zeer sterk vervuilde of bijzondere situatie' };
    // Na verbouwing: hardnekkige bouwresten (verf/kit/lijm/cement e.d.) zijn
    // niet standaard inbegrepen en vereisen altijd eerst een beoordeling,
    // ongeacht welk pakket of welke vervuilingsgraad verder gekozen is.
    if (slug === 'na-verbouwing' && getRadioValue('bouwresten') === 'Ja, er zijn hardnekkige bouwresten') {
      return {
        opMaat: true,
        reden: 'hardnekkige bouwresten, zoals verf-, kit-, lijm- of cementresten',
        extra: 'Verwijdering van dit soort hardnekkige bouwresten is niet standaard in het pakket inbegrepen. We beoordelen dit soort situaties eerst persoonlijk, voordat we een definitieve prijs kunnen geven.'
      };
    }
    // "Anders, namelijk..." is een vrije, niet-geprijsde wens \u2014 daarvoor
    // stellen we altijd een prijs op maat op, we verzinnen geen bedrag.
    if (extraAndersCheck && extraAndersCheck.checked) {
      return { opMaat: true, reden: 'een aangepaste extra wens ("Anders, namelijk\u2026")' };
    }

    const staffelPrijzen = dienstPrijzen.prijzen[staffelId];
    const basisBedrag = staffelPrijzen ? staffelPrijzen[pakketId] : null;
    if (basisBedrag == null) return null;

    let toeslag = 0;
    if (vervuiling === 'Sterk vervuild') toeslag = Math.round(basisBedrag * prijsData.toeslagPercentage / 100);

    // Telbare extra opties: per aantalselector-kaart wordt het gekozen
    // aantal vergeleken met het aantal dat al inbegrepen is in het huidige
    // pakket. Alleen het aantal BOVEN het inbegrepen aantal wordt in
    // rekening gebracht (extraAantal = max(0, gekozen - inbegrepen)) —
    // zo kan nooit dubbel gerekend worden.
    const extra = berekenExtrasVoorDienst(slug, pakketId);
    const regels = [['Pakket', basisBedrag]];
    if (toeslag > 0) regels.push(['Sterke vervuiling (+' + prijsData.toeslagPercentage + '%)', toeslag]);
    extra.regels.forEach(r => regels.push(r));
    return { opMaat: false, regels, totaal: basisBedrag + toeslag + extra.totaal, vanaf: !!dienstPrijzen.vanaf, perBeurt: false };
  }

  function escapeHtmlLocal(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function renderPrijsBlok(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const resultaat = berekenPrijs();
    if (!resultaat) {
      el.innerHTML = '';
      // Belangrijk: nooit een verouderde prijsindicatie laten staan wanneer er
      // (nu even) onvoldoende gegevens zijn, bijvoorbeeld na het wisselen naar
      // een dienst zonder calculator (oplevering) of "weet ik niet".
      if (prijsIndicatieField) prijsIndicatieField.value = '';
      return;
    }
    if (resultaat.opMaat) {
      const extraZin = resultaat.extra ? ' ' + escapeHtmlLocal(resultaat.extra) : '';
      el.innerHTML = '<div class="prijs-blok"><p class="prijs-op-maat-label">Prijsindicatie</p>'
        + '<p class="prijs-op-maat">Prijs op maat</p>'
        + '<p class="prijs-disclaimer">Bij ' + escapeHtmlLocal(resultaat.reden) + ' kunnen we geen automatische indicatie tonen. We beoordelen uw situatie persoonlijk en nemen contact met u op voor een passende offerte.' + extraZin + '</p></div>';
      if (prijsIndicatieField) prijsIndicatieField.value = 'Prijs op maat';
      return;
    }
    const rowsHtml = resultaat.regels.map(function (r) {
      const waarde = r[1] === 'Inbegrepen' ? '<span class="prijs-inbegrepen">Inbegrepen</span>' : '\u20ac' + r[1];
      return '<div class="prijs-regel"><span>' + escapeHtmlLocal(r[0]) + '</span><span>' + waarde + '</span></div>';
    }).join('');
    const vanafPrefix = resultaat.vanaf ? 'vanaf ' : '';
    const totaalLabel = resultaat.perBeurt ? 'Geschatte prijs per beurt' : 'Geschatte totaalprijs';
    el.innerHTML = '<div class="prijs-blok">'
      + '<p class="prijs-op-maat-label">Prijsindicatie</p>'
      + rowsHtml
      + '<div class="prijs-totaal"><span>' + totaalLabel + '</span><span>' + vanafPrefix + '\u20ac' + resultaat.totaal + ' incl. btw</span></div>'
      + '<p class="prijs-disclaimer">Deze prijs is een indicatie op basis van de door u ingevulde gegevens. Na beoordeling van uw aanvraag ontvangt u de definitieve prijs. Wanneer de situatie afwijkt van de ingevulde gegevens, nemen wij eerst contact met u op.</p></div>';
    if (prijsIndicatieField) prijsIndicatieField.value = (vanafPrefix ? 'Vanaf ' : '') + '\u20ac' + resultaat.totaal + (resultaat.perBeurt ? ' per beurt' : '') + ' incl. btw';
  }

  function updatePrijsIndicatie() {
    renderPrijsBlok('prijsBlokWoning');
    renderPrijsBlok('prijsBlokExtra');
    renderPrijsBlok('prijsBlokFrequentie');
    renderPrijsBlok('prijsBlokControle');
    updatePreselectExtra();
  }

  // Houdt de "Uw keuze"-balk bovenaan de wizard actueel: zodra een
  // woonoppervlakte (en eventueel prijs) bekend is, verschijnt die er
  // meteen bij \u2014 zichtbaar gedurende de hele rest van de wizard.
  const preselectExtra = document.getElementById('wizardPreselectExtra');
  function updatePreselectExtra() {
    if (!preselectExtra || !preselectBox || preselectBox.hidden) return;
    const staffelLabel = getRadioValue('woonoppervlakte_staffel');
    const resultaat = berekenPrijs();
    const delen = [];
    if (staffelLabel) delen.push(staffelLabel);
    if (resultaat && !resultaat.opMaat) {
      const vanafPrefix = resultaat.vanaf ? 'vanaf ' : '';
      delen.push('Prijsindicatie: ' + vanafPrefix + '\u20ac' + resultaat.totaal + (resultaat.perBeurt ? ' per beurt' : '') + ' incl. btw');
    } else if (resultaat && resultaat.opMaat) {
      delen.push('Prijsindicatie: prijs op maat');
    }
    preselectExtra.textContent = delen.join(' \u2014 ');
  }

  function applyDynamicLabel(el, type) {
    if (!el) return;
    const val = el.getAttribute('data-q-' + type);
    if (val) el.textContent = val;
  }

  // Verborgen/irrelevante velden worden geleegd EN disabled: disabled velden
  // worden door de browser vanzelf overgeslagen bij zowel validatie als het
  // opbouwen van de payload, dus oude waarden kunnen nooit meesturen.
  function clearAndDisable(input) {
    if (!input) return;
    if (input.type === 'radio' || input.type === 'checkbox') { input.checked = false; }
    else { input.value = ''; }
    input.disabled = true;
  }
  function enableField(input) {
    if (!input) return;
    input.disabled = false;
  }

  function applyKlanttype(type) {
    dienstWraps.forEach(wrap => {
      const types = (wrap.getAttribute('data-customer-types') || '').split(' ');
      const relevant = types.includes(type);
      const input = wrap.querySelector('input[type="radio"]');
      wrap.classList.toggle('rc-hidden', !relevant);
      if (relevant) enableField(input); else clearAndDisable(input);
    });

    applyDynamicLabel(oppQ, type);
    applyDynamicLabel(oppSub, type);
    applyDynamicLabel(toelichtingQ, type);

    const isParticulier = type === 'particulier';
    if (bedrijfsnaamField) bedrijfsnaamField.hidden = isParticulier;
    if (isParticulier) { clearAndDisable(bedrijfsnaamInput); }
    else { enableField(bedrijfsnaamInput); }

    const showAantal = type === 'bedrijf' || type === 'vve';
    if (aantalLocatiesField) aantalLocatiesField.hidden = !showAantal;
    if (showAantal) enableField(aantalLocatiesInput); else clearAndDisable(aantalLocatiesInput);

    if (!isParticulier) {
      // Particuliere stappen (pakket, extra's, woning, frequentie-particulier)
      // worden door stepApplies() al overgeslagen; velden ook legen/disablen
      // zodat er nooit particuliere data meestuurt bij een zakelijke aanvraag.
      pakketWraps.forEach(w => clearAndDisable(w.querySelector('input[type="radio"]')));
      extraCheckboxLabels.forEach(l => { const cb = l.querySelector('input'); if (cb) { cb.checked = false; l.classList.remove('cb-checked'); } });
      counterCards.forEach(card => {
        card.querySelector('.counter-value').value = '0';
        card.dataset.prevIncluded = '0';
        const note = card.querySelector('.counter-included-note');
        if (note) note.hidden = true;
      });
      if (extraAndersCheck) extraAndersCheck.checked = false;
      if (extraAndersWrap) extraAndersWrap.hidden = true;
      clearAndDisable(extraAndersInput);
      syncExtraOptiesField();
      if (pakketNaamField) pakketNaamField.value = '';
      ['typewoning', 'slaapkamers', 'badkamers', 'toiletten'].forEach(n => {
        const f = form.querySelector(`[name="${n}"]`);
        if (f) f.value = '';
      });
      form.querySelectorAll('input[name="bewoond_leeg"], input[name="vervuilingsgraad"], input[name="frequentie_particulier"], input[name="woonoppervlakte_staffel"], input[name="verbouwing_type"], input[name="bouwresten"], input[name="glas_type"], input[name="glas_frequentie"], input[name="glas_verdieping"], input[name="glas_bereikbaarheid"]').forEach(r => { r.checked = false; });
      ['glas_aantal'].forEach(n => { const f = form.querySelector(`[name="${n}"]`); if (f) f.value = ''; });
      applySubsections('');
      if (ingerichtNote) ingerichtNote.hidden = true;
      if (bouwrestenNote) bouwrestenNote.hidden = true;
      if (glasBereikbaarheidNote) glasBereikbaarheidNote.hidden = true;
      updatePrijsIndicatie();
      // Particulier gekozen: stap 9 (ruimtes/vervuiling/moment) is uitsluitend
      // zakelijk/VvE — nooit particuliere data laten meesturen.
      resetZakelijkPeriodiekStep();
      if (meerderePerWeekField) meerderePerWeekField.hidden = true;
      clearAndDisable(meerderePerWeekInput);
    }

    if (subjectInput) {
      const labelMap = { bedrijf: 'Bedrijf', vve: 'VvE/organisatie', particulier: 'Particulier' };
      subjectInput.value = 'Nieuwe offerteaanvraag (' + (labelMap[type] || type) + ') via de website';
    }
  }

  // === Dienst bepaalt welke pakketten en extra werkzaamheden relevant zijn ===
  function applyDienst(slug) {
    pakketWraps.forEach(wrap => {
      const forSlug = wrap.getAttribute('data-dienst-for');
      const relevant = !!slug && (forSlug === slug || forSlug === 'all');
      const input = wrap.querySelector('input[type="radio"]');
      wrap.classList.toggle('rc-hidden', !relevant);
      if (relevant) enableField(input); else clearAndDisable(input);
    });
    extraCheckboxLabels.forEach(label => {
      const forSlug = label.getAttribute('data-dienst-for');
      const relevant = !!slug && (forSlug === slug || forSlug === 'all');
      label.classList.toggle('cb-hidden', !relevant);
      if (!relevant) {
        const cb = label.querySelector('input');
        if (cb) { cb.checked = false; label.classList.remove('cb-checked'); }
      }
    });
    counterCards.forEach(card => {
      const forSlug = card.getAttribute('data-dienst-for');
      const relevant = !!slug && forSlug === slug;
      card.classList.toggle('cb-hidden', !relevant);
      if (!relevant) {
        card.querySelector('.counter-value').value = '0';
        card.dataset.prevIncluded = '0';
        const note = card.querySelector('.counter-included-note');
        if (note) note.hidden = true;
      }
    });
    updateAllCounters();
    applySubsections(slug || '');
    // De radio's in deze subsecties zijn net (mogelijk) gewist — bijbehorende
    // toelichtingen horen dan ook altijd weer verborgen te zijn, ongeacht hun
    // vorige zichtbaarheidsstatus.
    if (ingerichtNote) ingerichtNote.hidden = true;
    if (bouwrestenNote) bouwrestenNote.hidden = true;
    if (glasBereikbaarheidNote) glasBereikbaarheidNote.hidden = true;
    // Stap 9 (ruimtes/vervuiling/moment) is uitsluitend relevant bij
    // "periodiek-zakelijk" — bij elke andere (of geen) dienst altijd wissen,
    // zodat er nooit een oude keuze van een vorige dienst blijft hangen of
    // meestuurt.
    if (CALC_DIENST_SLUGS.indexOf(slug) === -1) resetZakelijkPeriodiekStep();
    syncExtraOptiesField();
    syncPakketNaamField();
    updatePrijsIndicatie();
  }

  function syncPakketNaamField() {
    const checked = form.querySelector('input[name="pakket"]:checked:not(:disabled)');
    if (pakketNaamField) pakketNaamField.value = checked ? checked.value : '';
  }

  function syncExtraOptiesField() {
    if (!extraOptiesField) return;
    const values = extraCheckboxLabels
      .filter(l => !l.classList.contains('cb-hidden'))
      .map(l => l.querySelector('input'))
      .filter(cb => cb && cb.checked)
      .map(cb => cb.value);
    // Aantalselectors: alleen de zichtbare (huidige dienst) kaarten met een
    // gekozen aantal > 0 meesturen, met vermelding van het aantal.
    counterCards.forEach(card => {
      if (card.classList.contains('cb-hidden')) return;
      const aantal = parseInt(card.querySelector('.counter-value').value, 10) || 0;
      if (aantal <= 0) return;
      const eid = card.getAttribute('data-extra-id');
      const info = prijsData && prijsData.extras ? prijsData.extras[eid] : null;
      const label = info ? info.label : eid;
      values.push(aantal + 'x ' + label);
    });
    if (extraAndersCheck && extraAndersCheck.checked && extraAndersInput && extraAndersInput.value.trim()) {
      values.push('Anders: ' + extraAndersInput.value.trim());
    }
    extraOptiesField.value = values.join(', ');
  }

  form.querySelectorAll('input[name="klanttype"]').forEach(radio => {
    radio.addEventListener('change', () => {
      if (!radio.checked) return;
      const type = TYPE_MAP[radio.value] || radio.value.toLowerCase();
      applyKlanttype(type);
      // Een al gekozen dienst die niet meer bij de nieuwe route hoort, wissen
      // — ook als het kaartje er inmiddels niet meer is.
      const dienstChecked = form.querySelector('input[name="dienst"]:checked');
      if (dienstChecked) {
        const wrap = dienstChecked.closest('.rc-wrap');
        const types = wrap ? (wrap.getAttribute('data-customer-types') || '').split(' ') : [];
        if (!types.includes(type)) dienstChecked.checked = false;
      }
      // Auto-advance voor stap 1 loopt sinds ronde 45 via de centrale
      // delegated 'change'-listener (zie scheduleAutoAdvance hierboven).
    });
  });

  form.querySelectorAll('input[name="dienst"]').forEach(radio => {
    radio.addEventListener('change', () => {
      if (!radio.checked) return;
      const wrap = radio.closest('.rc-wrap');
      const slug = wrap ? (wrap.getAttribute('data-dienst-slug') || '') : '';
      if (slug) applyDienst(slug);
      // Auto-advance voor stap 2 loopt sinds ronde 45 via de centrale
      // delegated 'change'-listener (zie scheduleAutoAdvance hierboven).
    });
  });

  form.querySelectorAll('input[name="pakket"]').forEach(radio => {
    radio.addEventListener('change', () => {
      syncPakketNaamField();
      updateAllCounters();
      updatePrijsIndicatie();
      // Auto-advance voor stap 3 loopt sinds ronde 45 via de centrale
      // delegated 'change'-listener (zie scheduleAutoAdvance hierboven).
    });
  });

  extraCheckboxLabels.forEach(label => {
    const cb = label.querySelector('input');
    if (!cb) return;
    cb.addEventListener('change', () => {
      label.classList.toggle('cb-checked', cb.checked);
      syncExtraOptiesField();
      updatePrijsIndicatie();
    });
  });
  if (extraAndersCheck) {
    extraAndersCheck.addEventListener('change', () => {
      const checked = extraAndersCheck.checked;
      if (extraAndersWrap) extraAndersWrap.hidden = !checked;
      if (checked) enableField(extraAndersInput); else clearAndDisable(extraAndersInput);
      updatePrijsIndicatie();
    });
  }

  // Prijsafhankelijke velden: woonoppervlakte, vervuilingsgraad, frequentie
  // (periodiek), bouwresten (na-verbouwing), glas_type (glasbewassing) — bij
  // elke wijziging direct de prijsindicatie herberekenen.
  form.querySelectorAll('input[name="woonoppervlakte_staffel"], input[name="vervuilingsgraad"], input[name="frequentie_particulier"], input[name="bouwresten"], input[name="glas_type"]').forEach(radio => {
    radio.addEventListener('change', updatePrijsIndicatie);
  });
  // "Hoe vaak wilt u schoonmaak?" (particulier, stap 6) en "Hoe groot is de
  // locatie/het gebouw ongeveer?" (bedrijf/VvE, stap 7) zijn allebei pure
  // single-choice-stappen. Woonoppervlakte/vervuilingsgraad/bouwresten/
  // glas_type horen bij stap 4/5, die ELK meerdere (deels conditionele)
  // vragen combineren — daar dus bewust GEEN auto-advance, ook al is elke
  // individuele vraag zelf single-choice. Auto-advance voor
  // frequentie_particulier/oppervlakte loopt sinds ronde 45 via de centrale
  // delegated 'change'-listener (zie scheduleAutoAdvance hierboven,
  // AUTO_ADVANCE_RADIO_NAMES) — hier alleen nog de prijsindicatie-koppeling.
  // "Is de woning tijdens de schoonmaak leeg?" (alleen verhuisschoonmaak) —
  // bij "Nee, nog ingericht" een korte, niet-prijsverhogende toelichting
  // tonen (zie brief-punt F): de calculator verhoogt de prijs hier NIET
  // automatisch op basis van.
  form.querySelectorAll('input[name="bewoond_leeg"]').forEach(radio => {
    radio.addEventListener('change', () => {
      if (ingerichtNote) ingerichtNote.hidden = radio.value !== 'Nee, nog ingericht' || !radio.checked;
    });
  });
  // "Zijn er hardnekkige bouwresten aanwezig?" (alleen na-verbouwing) — bij
  // "Ja" een toelichting tonen dat verwijdering niet standaard is inbegrepen
  // en dat de prijsindicatie daarom op maat wordt (zie berekenPrijs()).
  form.querySelectorAll('input[name="bouwresten"]').forEach(radio => {
    radio.addEventListener('change', () => {
      if (bouwrestenNote) bouwrestenNote.hidden = radio.value !== 'Ja, er zijn hardnekkige bouwresten' || !radio.checked;
    });
  });
  // "Zijn alle ramen normaal bereikbaar?" (alleen glasbewassing) — bij
  // "Nee, moeilijk bereikbaar" een toelichting tonen dat we dit eerst
  // beoordelen; de prijs is bij glasbewassing sowieso altijd op maat.
  form.querySelectorAll('input[name="glas_bereikbaarheid"]').forEach(radio => {
    radio.addEventListener('change', () => {
      if (glasBereikbaarheidNote) glasBereikbaarheidNote.hidden = radio.value !== 'Nee, moeilijk bereikbaar' || !radio.checked;
    });
  });

  // Eventueel al aangevinkt klanttype/dienst (bijv. na terug-navigeren in de
  // browser) direct toepassen, niet pas wachten op een nieuwe 'change'.
  const preCheckedType = form.querySelector('input[name="klanttype"]:checked');
  if (preCheckedType) applyKlanttype(TYPE_MAP[preCheckedType.value] || preCheckedType.value.toLowerCase());
  const preCheckedDienst = form.querySelector('input[name="dienst"]:checked');
  if (preCheckedDienst) {
    const wrap = preCheckedDienst.closest('.rc-wrap');
    const slug = wrap ? (wrap.getAttribute('data-dienst-slug') || '') : '';
    if (slug) applyDienst(slug);
  }

  // Klanttype/dienst/pakket voorselecteren via URL-parameters, bijv. vanaf de
  // knop "Offerte voor dit pakket aanvragen" op een particuliere dienstpagina:
  // offerte.html?type=particulier&dienst=grote-schoonmaak&pakket=grondig
  // De keuze blijft daarna gewoon handmatig aan te passen via "Keuze wijzigen".
  //
  // Robuustheid: elke stap hieronder controleert expliciet of de vorige stap
  // ook echt geslaagd is (radio gevonden, niet disabled) voordat de volgende
  // wordt geprobeerd. Ontbrekende/ongeldige/onbekende parameters leiden nooit
  // tot een fout of leeg scherm — de wizard valt dan gewoon terug op de
  // normale beginstap (route A).
  const preselectBox = document.getElementById('wizardPreselect');
  const preselectText = document.getElementById('wizardPreselectText');
  const preselectChangeBtn = document.getElementById('wizardPreselectChange');
  const QUERY_TYPE_MAP = { zakelijk: 'Bedrijf', bedrijf: 'Bedrijf', vve: 'VvE / organisatie', particulier: 'Particulier' };
  let startStep = 1;
  try {
    const params = new URLSearchParams(window.location.search);
    const requestedType = (params.get('type') || '').toLowerCase();
    const wantedType = QUERY_TYPE_MAP[requestedType];
    let typeOk = false;
    if (wantedType) {
      const radio = Array.from(form.querySelectorAll('input[name="klanttype"]')).find(r => r.value === wantedType);
      if (radio) {
        radio.checked = true;
        applyKlanttype(TYPE_MAP[wantedType]);
        typeOk = true;
      }
    }

    let dienstOk = false;
    let dienstLabel = '';
    const requestedDienstSlug = typeOk ? params.get('dienst') : null;
    if (requestedDienstSlug) {
      // BELANGRIJK (zie repo-geheugen "Standing Lesson #4"): een dienst-slug is
      // NIET altijd uniek — "periodiek-zakelijk" komt zowel bij een bedrijfs- als
      // een VvE-dienstkaart voor (twee losse .rc-wraps, met een verschillende
      // data-customer-types). Zoek daarom altijd BINNEN het al vastgestelde
      // klanttype (wantedType), nooit los op slug alleen — anders kan de eerste
      // (mogelijk disabled) wrap van het ANDERE klanttype gevonden worden, wat de
      // match altijd laat mislukken zodra die twee wraps niet in dezelfde volgorde
      // als het gekozen type in de HTML staan.
      const wantedTypeKey = TYPE_MAP[wantedType] || '';
      const dienstWrap = Array.from(form.querySelectorAll('.wizard-step[data-step="2"] .rc-wrap[data-dienst-slug]'))
        .filter(w => w.getAttribute('data-dienst-slug') === requestedDienstSlug)
        .find(w => (w.getAttribute('data-customer-types') || '').split(' ').includes(wantedTypeKey));
      const dienstRadio = dienstWrap ? dienstWrap.querySelector('input[type="radio"]') : null;
      if (dienstRadio && !dienstRadio.disabled) {
        dienstRadio.checked = true;
        applyDienst(requestedDienstSlug);
        dienstOk = true;
        dienstLabel = dienstRadio.value;
      }
    }

    let pakketOk = false;
    let pakketLabel = '';
    const requestedPakketId = dienstOk ? params.get('pakket') : null;
    if (requestedPakketId) {
      // BELANGRIJK: pakket-ID's zoals "basis" en "uitgebreid" zijn NIET uniek
      // — meerdere diensten gebruiken dezelfde ID voor hun eerste twee
      // pakketten (bijv. verhuisschoonmaak, grote-schoonmaak en
      // na-verbouwing hebben allemaal een "basis"). Zoek daarom altijd
      // binnen de wrap van de AANGEVRAAGDE dienst, nooit los op pakket-ID
      // alleen — anders kan de eerste (nog uitgeschakelde) radio van een
      // andere dienst gevonden worden, die als 'disabled' de match laat
      // mislukken.
      const pakketRadio = Array.from(form.querySelectorAll('.wizard-step[data-step="3"] .rc-wrap[data-dienst-for="' + requestedDienstSlug + '"] input[name="pakket"][data-pakket-id]'))
        .find(r => r.getAttribute('data-pakket-id') === requestedPakketId);
      if (pakketRadio && !pakketRadio.disabled) {
        pakketRadio.checked = true;
        syncPakketNaamField();
        pakketOk = true;
        pakketLabel = pakketRadio.value;
      }
    }

    // Hoe verder we automatisch mogen doorspringen hangt af van hoeveel er
    // al geldig bekend is: alleen type (sla de doelgroepvraag over), type +
    // dienst (sla ook de dienstvraag over — bijv. voor periodiek, dat geen
    // pakket heeft), of type + dienst + pakket (sla ook de pakketvraag
    // over). We zoeken steeds de eerstvolgende stap die ná dat laatst
    // geldige "anker" nog daadwerkelijk van toepassing is — dankzij
    // applicableSteps() automatisch correct, ook wanneer een tussenliggende
    // stap (zoals Pakket bij periodiek) niet van toepassing is.
    // Bij een onvolledige/ongeldige combinatie (bijv. dienst-slug bestaat
    // niet) doorloopt de bezoeker gewoon de normale wizard vanaf stap 1
    // (route A) — een eventueel wel geldig deel blijft dan gewoon aangevinkt.
    if (typeOk) {
      const appl = applicableSteps();
      let anker = 1;
      if (dienstOk) anker = 2;
      if (pakketOk) anker = 3;
      const idx = appl.indexOf(anker);
      startStep = (idx > -1 && idx < appl.length - 1) ? appl[idx + 1] : (appl[0] || 1);
      if (dienstOk && preselectBox && preselectText) {
        preselectText.textContent = pakketOk ? (dienstLabel + ' \u2014 ' + pakketLabel) : dienstLabel;
        preselectBox.hidden = false;
      }
    }
  } catch (e) { /* URLSearchParams niet beschikbaar: gewoon geen voorselectie */ }

  if (preselectChangeBtn) {
    preselectChangeBtn.addEventListener('click', () => {
      if (preselectBox) preselectBox.hidden = true;
      // Gericht: is er al een pakket bekend, dan gaan we naar de pakketstap
      // zélf (binnen dezelfde dienst) in plaats van helemaal terug naar de
      // doelgroep- of dienstkeuze. Is er geen pakket (bijv. periodiek of
      // glasbewassing), dan is de dienststap de meest gerichte stap. Vanaf
      // de pakketstap blijft "Terug" gewoon beschikbaar als iemand alsnog
      // een andere dienst wil kiezen.
      const target = currentPakketId() ? 3 : 2;
      current = target;
      show(target, true);
    });
  }

  // === Samenvatting vóór verzending ===
  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function getFieldValue(name) {
    const els = form.querySelectorAll(`[name="${name}"]`);
    for (const el of els) {
      if (el.disabled) continue;
      if (el.type === 'radio') { if (el.checked) return el.value; continue; }
      if (el.value && el.value.trim()) return el.value.trim();
    }
    return '';
  }

  // Eén bron van waarheid voor "welke velden zijn nu relevant, in welke
  // volgorde, met welk label" — gebruikt door zowel de samenvatting op het
  // scherm (buildSummary) als de payload die naar de server gaat
  // (buildOffertePayload). Zo kunnen samenvatting en verzonden aanvraag nooit
  // uit de pas lopen, en komt een leeg/irrelevant veld nergens ooit terecht
  // (alles wordt aan het einde gefilterd op een niet-lege waarde).
  function collectRows() {
    const typeRadio = form.querySelector('input[name="klanttype"]:checked');
    const isParticulier = typeRadio && TYPE_MAP[typeRadio.value] === 'particulier';
    const isZakelijkPeriodiek = !isParticulier && CALC_DIENST_SLUGS.indexOf(currentDienstSlug()) !== -1;
    const rows = [
      ['Klanttype', typeRadio ? typeRadio.value : ''],
      ['Dienst', getFieldValue('dienst')],
    ];
    if (isParticulier) {
      rows.push(
        ['Pakket', getFieldValue('pakket')],
        ['Extra werkzaamheden', getFieldValue('extra_opties')],
        ['Anders, namelijk', getFieldValue('extra_anders')],
        ['Type woning', getFieldValue('typewoning')],
        ['Woonoppervlakte', getFieldValue('woonoppervlakte_staffel')],
        ['Slaapkamers', getFieldValue('slaapkamers')],
        ['Badkamers', getFieldValue('badkamers')],
        ['Toiletten', getFieldValue('toiletten')],
        ['Woning tijdens schoonmaak', getFieldValue('bewoond_leeg')],
        ['Staat van de woning', getFieldValue('vervuilingsgraad')],
        ['Wat is er verbouwd', getFieldValue('verbouwing_type')],
        ['Hardnekkige bouwresten', getFieldValue('bouwresten')],
        ['Glasbewassing: te reinigen', getFieldValue('glas_type')],
        ['Glasbewassing: frequentie', getFieldValue('glas_frequentie')],
        ['Aantal ramen/glasvlakken', getFieldValue('glas_aantal')],
        ['Verdieping', getFieldValue('glas_verdieping')],
        ['Bereikbaarheid', getFieldValue('glas_bereikbaarheid')],
        ['Gewenste frequentie', getFieldValue('frequentie_particulier')],
        ['Prijsindicatie (getoond aan klant)', getFieldValue('prijsindicatie')]
      );
    } else {
      rows.push(
        ['Bedrijfsnaam / VvE', getFieldValue('bedrijfsnaam')],
        ['Omvang', getFieldValue('oppervlakte')],
        ['Exacte oppervlakte (m²)', getFieldValue('oppervlakte_m2_exact')],
        ['Aantal locaties', getFieldValue('aantal_locaties')],
        ['Frequentie', getFieldValue('frequentie')],
        ['Aantal keer per week', getFieldValue('meerdere_per_week_aantal')]
      );
      if (isZakelijkPeriodiek) {
        rows.push(
          ['Ruimtes', getFieldValue('ruimtes')],
          ['Toelichting ruimte', getFieldValue('ruimte_overig_toelichting')],
          ['Gebruiksintensiteit', getFieldValue('gebruiksintensiteit_zakelijk')],
          ['Extra vervuiling', getFieldValue('vervuilingsgraad_zakelijk')],
          ['Toelichting vervuiling', getFieldValue('vervuiling_zakelijk_toelichting')],
          ['Schoonmaakmoment', getFieldValue('schoonmaakmoment')]
        );
      }
    }
    rows.push(
      ['Gewenste datum/periode', getFieldValue('startdatum')],
      ['Omschrijving', getFieldValue('bericht')],
      ['Naam', getFieldValue('naam')],
      ['E-mailadres', getFieldValue('email')],
      ['Telefoonnummer', getFieldValue('telefoon')],
      ['Plaats/postcode', getFieldValue('plaats')]
    );
    return rows.filter(row => row[1]);
  }

  function buildSummary() {
    const dl = document.getElementById('wizardSummary');
    if (!dl) return;
    const filtered = collectRows();
    dl.innerHTML = filtered.map(row => `<div class="summary-row"><dt>${escapeHtml(row[0])}</dt><dd>${escapeHtml(row[1])}</dd></div>`).join('');
  }

  // Bouwt de payload die naar /api/offerte-aanvraag gaat. "velden" is exact
  // dezelfde, al gefilterde lijst als de samenvatting die de klant zelf ziet
  // (collectRows) — de server gebruikt die rechtstreeks voor de AANVRAAG-sectie
  // van de interne e-mail, zodat wat de klant ziet en wat Brabantschoon
  // ontvangt altijd overeenkomen. "calc" bevat losse, machineleesbare velden
  // die de server nodig heeft voor de interne tijd-/prijsberekening (alleen
  // gebruikt bij dienstSlug "periodiek-zakelijk"); de calculatie zelf gebeurt
  // uitsluitend server-side, hier wordt nooit een prijs berekend of verzonden.
  function buildOffertePayload() {
    const typeRadio = form.querySelector('input[name="klanttype"]:checked');
    const botcheckInput = form.querySelector('input[name="botcheck"]');
    const renderedAtInput = document.getElementById('formRenderedAtField');
    return {
      klanttype: typeRadio ? typeRadio.value : '',
      dienst: getFieldValue('dienst'),
      dienstSlug: currentDienstSlug(),
      naam: getFieldValue('naam'),
      bedrijfsnaam: getFieldValue('bedrijfsnaam'),
      email: getFieldValue('email'),
      telefoon: getFieldValue('telefoon'),
      plaats: getFieldValue('plaats'),
      velden: collectRows(),
      calc: {
        oppervlakte: getFieldValue('oppervlakte'),
        oppervlakteExactM2: getFieldValue('oppervlakte_m2_exact'),
        frequentie: getFieldValue('frequentie'),
        meerderePerWeekAantal: getFieldValue('meerdere_per_week_aantal'),
        aantalLocaties: getFieldValue('aantal_locaties'),
        ruimtes: zakelijkRuimteChecks.filter(cb => cb.checked && cb !== ruimteOverigCheck).map(cb => cb.getAttribute('data-ruimte-id')),
        ruimteOverig: !!(ruimteOverigCheck && ruimteOverigCheck.checked),
        vervuiling: getFieldValue('vervuilingsgraad_zakelijk'),
        gebruiksintensiteit: getFieldValue('gebruiksintensiteit_zakelijk'),
      },
      botcheck: !!(botcheckInput && botcheckInput.checked),
      form_rendered_at: renderedAtInput ? renderedAtInput.value : '',
    };
  }

  current = startStep;
  show(current, false);
  const formRenderedAtField = document.getElementById('formRenderedAtField');
  if (formRenderedAtField) formRenderedAtField.value = String(Date.now());

  // Verzending: JSON naar onze eigen /api/offerte-aanvraag (Vercel serverless
  // function) i.p.v. een rechtstreekse formulier-POST naar een externe
  // mailing-service. Zo bouwt de server de interne e-mail conditioneel op
  // (nooit lege/irrelevante velden) en blijft de interne calculatie
  // (tijd/kostprijs/marge) altijd server-side -- die verlaat de browser
  // nooit, dus is ook niet zichtbaar via devtools/netwerkverkeer. Bij een
  // fout blijft de ingevulde data gewoon staan, zodat de klant het simpelweg
  // nog eens kan proberen.
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (form.dataset.submitting === '1') return;
    if (!validateStep()) return;
    syncPakketNaamField();
    syncExtraOptiesField();
    syncRuimtesField();
    form.dataset.submitting = '1';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Aanvraag wordt verzonden\u2026';
    if (statusEl) statusEl.textContent = 'Aanvraag wordt verzonden\u2026';
    const payload = buildOffertePayload();
    fetch(form.getAttribute('action') || '/api/offerte-aanvraag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(res => res.json().catch(() => ({})).then(data => {
      if (!res.ok || (data && data.ok === false)) throw new Error((data && data.error) || ('http-' + res.status));
      window.location.href = '/thanks.html';
    })).catch(() => {
      form.dataset.submitting = '';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Vraag vrijblijvende offerte aan';
      if (statusEl) statusEl.textContent = 'Er ging iets mis bij het verzenden. Probeer het nog eens, of bel ons via het nummer bovenaan de pagina.';
    });
  });

  // Vaste onderbalk (Bel direct / Vrijblijvende offerte) verbergen zolang de wizard zelf in
  // beeld is, en de WhatsApp-knop tegelijk hoger zetten zodat deze nooit over de vaste
  // Volgende/Terug-balk van de wizard heen komt te staan (zie .wizard-nav-active in styles.css).
  const ctaBar = document.querySelector('.mobile-cta-bar');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (ctaBar) ctaBar.style.display = entry.isIntersecting ? 'none' : '';
        document.body.classList.toggle('wizard-nav-active', entry.isIntersecting);
      });
    }, { threshold: 0.15 });
    io.observe(form);
  }
})();

// Kaart pas laden na klik (zie contact_info_block in generate.py) — voorkomt
// dat de Google Maps-iframe al voor toestemming/interactie wordt geladen.
document.querySelectorAll('.map-load-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const wrap = document.getElementById(btn.dataset.target);
    if (!wrap) return;
    const src = wrap.getAttribute('data-src');
    wrap.innerHTML = `<iframe src="${src}" width="100%" height="280" style="border:0; border-radius:16px;" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Brabantschoon op de kaart"></iframe>`;
  });
});

const revealEls = document.querySelectorAll('.reveal');
if (revealEls.length) {
  // Veiligheidsnet: als IntersectionObserver om welke reden dan ook niet
  // vuurt voor een element (bijv. een uitzonderlijk hoog blok op een klein
  // scherm dat nooit voor >= threshold in beeld komt), wordt het element na
  // 2,5s hoe dan ook zichtbaar gemaakt. Content mag nooit permanent
  // opacity:0 blijven.
  const revealTimers = new Map();
  revealEls.forEach(el => {
    revealTimers.set(el, setTimeout(() => el.classList.add('in'), 2500));
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        clearTimeout(revealTimers.get(entry.target));
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.02 });
  revealEls.forEach(el => io.observe(el));
}

