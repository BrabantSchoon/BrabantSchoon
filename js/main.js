// Mobiel menu werkt volledig via CSS (checkbox-methode), geen JS nodig.

// Offerte-wizard
(function () {
  const form = document.getElementById('offerteWizard');
  if (!form) return;

  const steps = Array.from(form.querySelectorAll('.wizard-step'));
  const stepLabels = Array.from(form.querySelectorAll('.wp-step'));
  const fill = document.getElementById('wizardFill');
  const backBtn = document.getElementById('wizardBack');
  const nextBtn = document.getElementById('wizardNext');
  const submitBtn = document.getElementById('wizardSubmit');
  let current = 1;
  const total = steps.length;

  function show(stepNum, scrollTo) {
    steps.forEach(s => { s.hidden = parseInt(s.dataset.step, 10) !== stepNum; });
    stepLabels.forEach((el, i) => {
      el.classList.toggle('active', i + 1 === stepNum);
      el.classList.toggle('done', i + 1 < stepNum);
    });
    fill.style.width = (stepNum / total * 100) + '%';
    backBtn.hidden = stepNum === 1;
    nextBtn.hidden = stepNum === total;
    submitBtn.hidden = stepNum !== total;
    if (scrollTo) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function currentStepEl() {
    return steps.find(s => parseInt(s.dataset.step, 10) === current);
  }

  function validateStep() {
    const el = currentStepEl();
    const requiredFields = el.querySelectorAll('[required]');
    for (const field of requiredFields) {
      if (field.type === 'radio') {
        const group = el.querySelectorAll(`input[name="${field.name}"]`);
        const anyChecked = Array.from(group).some(r => r.checked);
        if (!anyChecked) { field.reportValidity ? field.reportValidity() : null; return false; }
      } else if (!field.checkValidity()) {
        field.reportValidity();
        return false;
      }
    }
    return true;
  }

  nextBtn.addEventListener('click', () => {
    if (!validateStep()) return;
    if (current < total) { current++; show(current, true); }
  });
  backBtn.addEventListener('click', () => {
    if (current > 1) { current--; show(current, true); }
  });

  // Automatisch doorgaan bij het kiezen van een kaartje (alleen bij keuzestappen, niet bij tekstvelden)
  const autoAdvanceSteps = [1, 2, 3];
  steps.forEach(stepEl => {
    const stepNum = parseInt(stepEl.dataset.step, 10);
    if (!autoAdvanceSteps.includes(stepNum)) return;
    stepEl.querySelectorAll('input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', () => {
        if (current !== stepNum) return;
        setTimeout(() => {
          if (current < total) { current++; show(current, true); }
        }, 350);
      });
    });
  });

  show(current, false);

  // Vaste onderbalk (Bel direct / Vrijblijvende offerte) verbergen zolang de wizard zelf in beeld is
  const ctaBar = document.querySelector('.mobile-cta-bar');
  if (ctaBar && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        ctaBar.style.display = entry.isIntersecting ? 'none' : '';
      });
    }, { threshold: 0.15 });
    io.observe(form);
  }
})();

// Voor/na-sleepbalk
const csRange = document.getElementById('csRange');
const csClip = document.getElementById('csBeforeClip');
const csHandle = document.getElementById('csHandle');
if (csRange && csClip && csHandle) {
  const updateSlider = (v) => {
    csClip.style.clipPath = `inset(0 ${100 - v}% 0 0)`;
    csHandle.style.left = v + '%';
  };
  updateSlider(50);
  csRange.addEventListener('input', (e) => updateSlider(e.target.value));
}

const revealEls = document.querySelectorAll('.reveal');
if (revealEls.length) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(el => io.observe(el));
}

// Prijscalculator UI: koppelt de interface aan de losstaande rekenengine (pricing-engine.js).
// Deze functie toont UITSLUITEND customer.priceLow/priceHigh en de urenindicatie op de pagina.
// Het volledige interne kostenoverzicht (internal.*) gaat alleen naar het verborgen e-mailveld.
(function() {
  const calc = document.getElementById('calculator');
  if (!calc || typeof calculatePricing !== 'function') return;

  let currentJobType = 'periodiek';
  let currentTypeKey = 'office';
  let currentFreqKey = null; // null = nog geen handmatige keuze, volgt het advies
  let extraPctTotal = 0;
  let verhuisExtraPctTotal = 0;
  let panNietLeeg = false;
  let opleveringType = 'nieuwbouw';
  let lastLow = 0, lastHigh = 0;

  const jobTypeButtons = calc.querySelectorAll('#calcJobType .calc-card');
  const jobGroupBlocks = calc.querySelectorAll('[data-job-group]');
  const typeButtons = calc.querySelectorAll('#calcType .calc-card');
  const freqButtons = calc.querySelectorAll('#calcFreq .calc-card');
  const verhuisTypeButtons = calc.querySelectorAll('#calcVerhuisType .calc-card');
  const opleveringTypeButtons = calc.querySelectorAll('#calcOpleveringType .calc-card');
  const pandLeegButtons = calc.querySelectorAll('#calcPandLeeg .calc-card');
  const verhuisExtraChecks = calc.querySelectorAll('#calcVerhuisExtra input[type="checkbox"]');
  const m2Range = document.getElementById('calcM2Range');
  const m2Number = document.getElementById('calcM2Number');
  const extraChecks = calc.querySelectorAll('#calcExtra input[type="checkbox"]');
  const priceLowEl = document.getElementById('calcPriceLow');
  const priceHighEl = document.getElementById('calcPriceHigh');
  const priceHeaderEl = document.getElementById('calcPriceHeader');
  const priceSubEl = document.getElementById('calcPriceSub');
  const priceHoursBlock = document.getElementById('calcPriceHours');
  const hoursVisitEl = document.getElementById('calcHoursVisit');
  const hoursMonthEl = document.getElementById('calcHoursMonth');
  const mobilePriceEl = document.getElementById('calcMobilePrice');
  const modalPriceEl = document.getElementById('calcModalPrice');
  const modalPriceSuffixEl = document.getElementById('calcModalPriceSuffix');
  const modalPriceField = document.getElementById('calcModalPriceField');
  const modalDetailsField = document.getElementById('calcModalDetailsField');
  const modalInternalField = document.getElementById('calcModalInternalField');
  const freqExplainEl = document.getElementById('calcFreqExplain');
  const plaatsInput = document.getElementById('calcPlaats');
  const plaatsListbox = document.getElementById('calcPlaatsListbox');
  const plaatsNote = document.getElementById('calcPlaatsNote');
  const sumJobType = document.getElementById('calcSumJobType');
  const sumType = document.getElementById('calcSumType');
  const sumM2 = document.getElementById('calcSumM2');
  const sumPlaats = document.getElementById('calcSumPlaats');
  const sumFreq = document.getElementById('calcSumFreq');
  const sumFreqWrap = document.getElementById('calcSumFreqWrap');
  const sumExtras = document.getElementById('calcSumExtras');

  const JOB_TYPE_LABELS = {
    periodiek: 'Periodieke schoonmaak', oplevering: 'Opleveringsschoonmaak',
    verhuis: 'Verhuisschoonmaak', dieptereiniging: 'Eenmalige dieptereiniging'
  };

  function selectCard(buttons, btn) {
    buttons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }

  function applyJobTypeVisibility() {
    jobGroupBlocks.forEach(block => {
      const groups = block.dataset.jobGroup.split(' ');
      block.hidden = !groups.includes(currentJobType);
    });
  }

  jobTypeButtons.forEach(btn => btn.addEventListener('click', () => {
    selectCard(jobTypeButtons, btn);
    currentJobType = btn.dataset.job;
    applyJobTypeVisibility();
    calculate();
  }));
  applyJobTypeVisibility();

  verhuisTypeButtons.forEach(btn => btn.addEventListener('click', () => { selectCard(verhuisTypeButtons, btn); calculate(); }));
  opleveringTypeButtons.forEach(btn => btn.addEventListener('click', () => {
    selectCard(opleveringTypeButtons, btn);
    opleveringType = btn.dataset.value;
    calculate();
  }));
  pandLeegButtons.forEach(btn => btn.addEventListener('click', () => {
    selectCard(pandLeegButtons, btn);
    panNietLeeg = btn.dataset.value === 'nee';
    calculate();
  }));
  verhuisExtraChecks.forEach(chk => chk.addEventListener('change', () => {
    verhuisExtraPctTotal = Array.from(verhuisExtraChecks).filter(c => c.checked).reduce((sum, c) => sum + parseFloat(c.dataset.pct || 0), 0);
    calculate();
  }));

  // Verwijdert alle 'Aanbevolen'-badges en zet er \u00e9\u00e9n op de meegegeven freqKey
  function markRecommended(freqKey) {
    freqButtons.forEach(b => {
      const existingBadge = b.querySelector('.calc-badge');
      if (existingBadge) existingBadge.remove();
      if (b.dataset.freqKey === freqKey) {
        const badge = document.createElement('em');
        badge.className = 'calc-badge';
        badge.textContent = 'Aanbevolen';
        b.appendChild(badge);
      }
    });
  }

  typeButtons.forEach(btn => btn.addEventListener('click', () => {
    selectCard(typeButtons, btn);
    currentTypeKey = btn.dataset.typeKey;
    calculate();
  }));
  freqButtons.forEach(btn => btn.addEventListener('click', () => {
    selectCard(freqButtons, btn);
    currentFreqKey = btn.dataset.freqKey; // vanaf nu een bewuste, handmatige keuze
    calculate();
  }));

  function syncM2(value) {
    value = Math.max(10, Math.min(20000, parseInt(value) || 0));
    m2Range.value = Math.min(2000, value);
    m2Number.value = value;
    calculate();
  }
  if (m2Range) m2Range.addEventListener('input', e => syncM2(e.target.value));
  if (m2Number) m2Number.addEventListener('input', e => syncM2(e.target.value));

  // Locatie-autocomplete: eigen implementatie (geen native <datalist>, dat gaf in
  // combinatie met autocomplete="off" een bekend browserprobleem waarbij de
  // suggestielijst niet opende).
  (function setupPlaatsAutocomplete() {
    if (!plaatsInput || !plaatsListbox) return;
    const cityData = window.CALC_CITIES_DATA || { all: [], kern: [] };
    let activeIndex = -1;
    let currentMatches = [];

    function normalize(s) { return (s || '').toLowerCase().trim(); }

    function closeList() {
      plaatsListbox.hidden = true;
      plaatsListbox.innerHTML = '';
      plaatsInput.setAttribute('aria-expanded', 'false');
      activeIndex = -1;
    }

    function renderMatches(matches) {
      currentMatches = matches;
      activeIndex = -1;
      if (!matches.length) { closeList(); return; }
      plaatsListbox.innerHTML = matches.map((city, i) =>
        `<li role="option" id="calcPlaatsOpt${i}" data-index="${i}">${city}</li>`
      ).join('');
      plaatsListbox.hidden = false;
      plaatsInput.setAttribute('aria-expanded', 'true');
    }

    function updateActiveDescendant() {
      Array.from(plaatsListbox.children).forEach((li, i) => {
        li.classList.toggle('active', i === activeIndex);
      });
      if (activeIndex >= 0) {
        plaatsInput.setAttribute('aria-activedescendant', `calcPlaatsOpt${activeIndex}`);
      } else {
        plaatsInput.removeAttribute('aria-activedescendant');
      }
    }

    function checkWerkgebied(value) {
      if (!plaatsNote) return;
      const inKern = cityData.kern.some(c => normalize(c) === normalize(value));
      const noteText = plaatsNote.querySelector('span') || plaatsNote;
      if (!value) {
        plaatsNote.classList.remove('calc-note-warning');
        noteText.textContent = 'Wij zijn actief in heel Noord-Brabant.';
      } else if (inKern) {
        plaatsNote.classList.remove('calc-note-warning');
        noteText.textContent = 'Dit ligt in ons vaste werkgebied.';
      } else {
        plaatsNote.classList.add('calc-note-warning');
        noteText.textContent = 'Dit ligt buiten ons kerngebied \u2014 voor grotere opdrachten rijden we ook hier graag naartoe.';
      }
    }

    plaatsInput.addEventListener('input', () => {
      const query = normalize(plaatsInput.value);
      const matches = query
        ? cityData.all.filter(c => normalize(c).includes(query)).slice(0, 8)
        : cityData.all.slice(0, 8);
      renderMatches(matches);
      checkWerkgebied(plaatsInput.value);
      calculate();
    });

    plaatsInput.addEventListener('focus', () => {
      if (!plaatsInput.value) renderMatches(cityData.all.slice(0, 8));
    });

    plaatsInput.addEventListener('keydown', (e) => {
      if (plaatsListbox.hidden && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        renderMatches(cityData.all.filter(c => normalize(c).includes(normalize(plaatsInput.value))).slice(0, 8));
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIndex = Math.min(activeIndex + 1, currentMatches.length - 1);
        updateActiveDescendant();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIndex = Math.max(activeIndex - 1, 0);
        updateActiveDescendant();
      } else if (e.key === 'Enter') {
        if (activeIndex >= 0 && currentMatches[activeIndex]) {
          e.preventDefault();
          plaatsInput.value = currentMatches[activeIndex];
          checkWerkgebied(plaatsInput.value);
          closeList();
          calculate();
        }
      } else if (e.key === 'Escape') {
        closeList();
      }
    });

    plaatsListbox.addEventListener('mousedown', (e) => {
      const li = e.target.closest('li');
      if (!li) return;
      e.preventDefault(); // voorkomt blur vóór de klik verwerkt is
      plaatsInput.value = li.textContent;
      checkWerkgebied(plaatsInput.value);
      closeList();
      calculate();
    });

    document.addEventListener('click', (e) => {
      if (!plaatsInput.contains(e.target) && !plaatsListbox.contains(e.target)) closeList();
    });

    checkWerkgebied(plaatsInput.value);
  })();

  extraChecks.forEach(chk => chk.addEventListener('change', () => {
    extraPctTotal = Array.from(extraChecks).filter(c => c.checked).reduce((sum, c) => sum + parseFloat(c.dataset.pct || 0), 0);
    calculate();
  }));

  function formatEuro(n) {
    return '\u20ac' + Math.round(n).toLocaleString('nl-NL');
  }

  // Vloeiende telanimatie van het ene bedrag naar het andere (easing, geen abrupte sprong)
  function animateValue(el, from, to, duration) {
    if (!el) return;
    const startTime = performance.now();
    function step(now) {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const value = from + (to - from) * eased;
      el.textContent = formatEuro(value);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function calculate() {
    const parsedM2 = parseInt(m2Number.value, 10);
    const m2 = Number.isFinite(parsedM2) && parsedM2 > 0 ? parsedM2 : 250;
    const plaats = plaatsInput ? plaatsInput.value : '';
    let low, high, result;

    if (currentJobType === 'periodiek') {
      // Dynamische frequentie-aanbeveling: zolang de bezoeker nog niets handmatig koos,
      // volgt de selectie automatisch het advies bij wijziging van pandtype/oppervlakte.
      const recommendation = typeof getRecommendedFrequency === 'function'
        ? getRecommendedFrequency(currentTypeKey, m2)
        : { freqKey: 'weekly2', label: '2x per week', explanation: '' };

      markRecommended(recommendation.freqKey);
      if (freqExplainEl) {
        const textSpan = freqExplainEl.querySelector('span');
        if (textSpan) textSpan.textContent = recommendation.explanation;
      }
      if (currentFreqKey === null) {
        const recBtn = calc.querySelector(`#calcFreq .calc-card[data-freq-key="${recommendation.freqKey}"]`);
        if (recBtn) selectCard(freqButtons, recBtn);
      }
      const activeFreqKey = currentFreqKey || recommendation.freqKey;

      result = calculatePricing({
        surfaceM2: m2, propertyType: currentTypeKey, frequencyKey: activeFreqKey,
        extraServicesSurchargePercentage: extraPctTotal
      });
      low = result.customer.priceLow; high = result.customer.priceHigh;

      if (priceHeaderEl) priceHeaderEl.textContent = 'Uw prijsindicatie';
      if (priceSubEl) priceSubEl.textContent = 'per maand, excl. btw';
      if (priceHoursBlock) priceHoursBlock.hidden = false;
      if (hoursVisitEl) hoursVisitEl.textContent = result.customer.estimatedLaborHoursPerVisit.toFixed(1).replace('.', ',');
      if (hoursMonthEl) hoursMonthEl.textContent = Math.round(result.customer.estimatedLaborHoursPerMonth);
      if (modalPriceSuffixEl) modalPriceSuffixEl.textContent = ' per maand';
      if (mobilePriceEl) mobilePriceEl.textContent = formatEuro(low) + ' \u2013 ' + formatEuro(high) + ' / mnd';
    } else {
      // Eenmalige opdrachten: oplevering, verhuis, dieptereiniging
      const oneTimeInput = { surfaceM2: m2 };
      if (currentJobType === 'oplevering') {
        oneTimeInput.opleveringType = opleveringType;
      } else if (currentJobType === 'verhuis') {
        oneTimeInput.panNietLeeg = panNietLeeg;
        oneTimeInput.extraServicesSurchargePercentage = verhuisExtraPctTotal;
      }
      result = typeof calculateOneTimePricing === 'function'
        ? calculateOneTimePricing(currentJobType, oneTimeInput)
        : { customer: { priceLow: 145, priceHigh: 195, estimatedLaborHours: 2 }, internal: {} };
      low = result.customer.priceLow; high = result.customer.priceHigh;

      if (priceHeaderEl) priceHeaderEl.textContent = 'Uw eenmalige prijsindicatie';
      if (priceSubEl) priceSubEl.textContent = 'eenmalig, excl. btw';
      if (priceHoursBlock) priceHoursBlock.hidden = true;
      if (modalPriceSuffixEl) modalPriceSuffixEl.textContent = ' (eenmalig)';
      if (mobilePriceEl) mobilePriceEl.textContent = formatEuro(low) + ' \u2013 ' + formatEuro(high);
    }

    animateValue(priceLowEl, lastLow || low, low, 450);
    animateValue(priceHighEl, lastHigh || high, high, 450);
    lastLow = low; lastHigh = high;

    const rangeText = formatEuro(low) + ' \u2013 ' + formatEuro(high);
    if (modalPriceEl) modalPriceEl.textContent = rangeText;
    if (modalPriceField) modalPriceField.value = rangeText + (currentJobType === 'periodiek' ? ' per maand (indicatief)' : ' eenmalig (indicatief)');

    // Live selectie-samenvatting boven de offerteknop
    const typeLabel = currentJobType === 'verhuis'
      ? (calc.querySelector('#calcVerhuisType .calc-card.active')?.dataset.label || '')
      : (calc.querySelector('#calcType .calc-card.active')?.dataset.label || '');
    const freqLabel = calc.querySelector('#calcFreq .calc-card.active')?.dataset.label || '';
    const activeExtraChecks = currentJobType === 'verhuis' ? verhuisExtraChecks : extraChecks;
    const extrasChecked = currentJobType === 'periodiek' || currentJobType === 'verhuis'
      ? Array.from(activeExtraChecks).filter(c => c.checked).map(c => c.closest('label').textContent.trim())
      : [];

    if (sumJobType) sumJobType.textContent = JOB_TYPE_LABELS[currentJobType];
    if (sumType) sumType.textContent = typeLabel;
    if (sumM2) sumM2.textContent = m2.toLocaleString('nl-NL') + ' m\u00b2';
    if (sumPlaats) sumPlaats.textContent = plaats || '\u2013';
    if (sumFreqWrap) sumFreqWrap.hidden = currentJobType !== 'periodiek';
    if (sumFreq) sumFreq.textContent = freqLabel;
    if (sumExtras) sumExtras.textContent = extrasChecked.length ? extrasChecked.join(', ') : '';

    // Klantgegevens voor in de offerte-e-mail (zichtbaar voor jou, niet op de pagina)
    if (modalDetailsField) {
      let extraInfo = '';
      if (currentJobType === 'oplevering') extraInfo = ` | Type oplevering: ${opleveringType}`;
      else if (currentJobType === 'verhuis') extraInfo = ` | Pand leeg: ${panNietLeeg ? 'Nee' : 'Ja'}`;
      modalDetailsField.value = `Opdrachttype: ${JOB_TYPE_LABELS[currentJobType]} | Type: ${typeLabel} | Oppervlakte: ${m2} m² | ${currentJobType === 'periodiek' ? 'Frequentie: ' + freqLabel + ' | ' : ''}Extra diensten: ${extrasChecked.join(', ') || 'geen'}${extraInfo} | Plaats: ${plaats}`;
    }

    // Interne kostprijs-uitsplitsing, UITSLUITEND naar het verborgen e-mailveld -
    // nooit gerenderd in de zichtbare pagina, dus niet zichtbaar voor een bezoeker.
    if (modalInternalField) {
      const i = result.internal;
      if (currentJobType === 'periodiek') {
        modalInternalField.value =
          `[INTERN - niet voor klant] Uren/bezoek: ${i.estimatedLaborHoursPerVisit.toFixed(2)} | ` +
          `Uren/maand: ${i.estimatedLaborHoursPerMonth.toFixed(1)} | ` +
          `Zzp-tarief: ${formatEuro(i.contractorHourlyRate)}/u | ` +
          `Loonkosten: ${formatEuro(i.laborCost)} | Materiaal: ${formatEuro(i.materialCost)} | ` +
          `Reiskosten: ${formatEuro(i.travelCost)} | Overhead: ${formatEuro(i.overheadCost)} | ` +
          `Kostprijs totaal: ${formatEuro(i.totalCostPrice)} | Winstmarge: ${formatEuro(i.profitMarginAmount)} | ` +
          `Extra diensten: ${formatEuro(i.extraServicesAmount)} | Verkoopprijs (midden): ${formatEuro(i.customerMonthlyPrice)}`;
      } else {
        modalInternalField.value =
          `[INTERN - niet voor klant, eenmalig] Uren: ${(i.estimatedLaborHours || 0).toFixed(2)} | ` +
          `Loonkosten: ${formatEuro(i.laborCost || 0)} | Materiaal: ${formatEuro(i.materialCost || 0)} | ` +
          `Reiskosten: ${formatEuro(i.travelCost || 0)} | Overhead: ${formatEuro(i.overheadCost || 0)} | ` +
          `Kostprijs totaal: ${formatEuro(i.totalCostPrice || 0)} | Winstmarge: ${formatEuro(i.profitMarginAmount || 0)} | ` +
          `Totaalprijs (midden): ${formatEuro(i.totalPrice || 0)}`;
      }
    }
  }

  calculate();

  // Mobiele sticky-balk: scrollt naar de prijskaart
  const mobileBtn = document.getElementById('calcMobileBtn');
  const priceCard = document.getElementById('calcPriceCard');
  if (mobileBtn && priceCard) {
    mobileBtn.addEventListener('click', () => {
      priceCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      priceCard.classList.add('calc-price-flash');
      setTimeout(() => priceCard.classList.remove('calc-price-flash'), 900);
    });
  }

  // Offerte-modal openen/sluiten
  const modalOverlay = document.getElementById('calcModalOverlay');
  const openModalBtn = document.getElementById('calcOpenModal');
  const closeModalBtn = document.getElementById('calcModalClose');
  function openModal() {
    calculate();
    modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }
  if (openModalBtn) openModalBtn.addEventListener('click', openModal);
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  if (modalOverlay) modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  // Tijdstip-keuze binnen de modal
  const modalTimeButtons = document.querySelectorAll('#calcModalTime .calc-card');
  const modalTimeField = document.getElementById('calcModalTimeField');
  modalTimeButtons.forEach(btn => btn.addEventListener('click', () => {
    selectCard(modalTimeButtons, btn);
    if (modalTimeField) modalTimeField.value = btn.dataset.label;
  }));
})();
