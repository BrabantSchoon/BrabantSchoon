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

// Prijscalculator: echte rekenengine met configureerbare variabelen.
// Alle instelbare waarden staan hier bovenaan gebundeld (equivalent van een los config-bestand),
// zodat je later zonder in de rest van de logica te zoeken de tarieven kunt aanpassen.
(function() {
  const calc = document.getElementById('calculator');
  if (!calc) return;

  const PRICING_CONFIG = {
    zzpHourlyRate: 30,
    profitMargin: 35,            // percentage
    travelCostPerVisit: 12.50,
    materialCostPerVisit: 8.50,
    minimumMonthlyPrice: 250,
    rangeSpread: 10               // percentage, prijsbandbreedte rondom de berekende prijs
  };

  let currentNorm = 55;           // minuten per 100 m², afhankelijk van pandtype
  let currentFreq = 8;            // bezoeken per maand
  let extraPctTotal = 0;          // som van percentage-toeslagen voor extra diensten
  let lastLow = 0, lastHigh = 0;

  const typeButtons = calc.querySelectorAll('#calcType .calc-card');
  const freqButtons = calc.querySelectorAll('#calcFreq .calc-card');
  const m2Range = document.getElementById('calcM2Range');
  const m2Number = document.getElementById('calcM2Number');
  const extraChecks = calc.querySelectorAll('#calcExtra input[type="checkbox"]:not(#calcOplevering)');
  const priceLowEl = document.getElementById('calcPriceLow');
  const priceHighEl = document.getElementById('calcPriceHigh');
  const hoursVisitEl = document.getElementById('calcHoursVisit');
  const hoursMonthEl = document.getElementById('calcHoursMonth');
  const mobilePriceEl = document.getElementById('calcMobilePrice');
  const modalPriceEl = document.getElementById('calcModalPrice');
  const modalPriceField = document.getElementById('calcModalPriceField');
  const modalDetailsField = document.getElementById('calcModalDetailsField');

  function selectCard(buttons, btn) {
    buttons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }

  typeButtons.forEach(btn => btn.addEventListener('click', () => {
    selectCard(typeButtons, btn);
    currentNorm = parseFloat(btn.dataset.norm);
    calculate();
  }));
  freqButtons.forEach(btn => btn.addEventListener('click', () => {
    selectCard(freqButtons, btn);
    currentFreq = parseFloat(btn.dataset.value);
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
    const m2 = parseInt(m2Number.value) || 250;

    // 1. Benodigde uren per bezoek en per maand
    const minutesPerVisit = (m2 / 100) * currentNorm;
    const hoursPerVisit = minutesPerVisit / 60;
    const hoursPerMonth = hoursPerVisit * currentFreq;

    // 2. Loonkosten
    const laborCost = hoursPerMonth * PRICING_CONFIG.zzpHourlyRate;
    // 3. Materiaalkosten (per bezoek)
    const materialCost = PRICING_CONFIG.materialCostPerVisit * currentFreq;
    // 4. Reiskosten (per bezoek)
    const travelCost = PRICING_CONFIG.travelCostPerVisit * currentFreq;

    // 5. Subtotaal + marge
    const subtotal = laborCost + materialCost + travelCost;
    let monthly = subtotal * (1 + PRICING_CONFIG.profitMargin / 100);

    // 6. Extra diensten (percentage-toeslag op het basisbedrag)
    monthly = monthly * (1 + extraPctTotal / 100);

    // 7. Ondergrens
    monthly = Math.max(PRICING_CONFIG.minimumMonthlyPrice, monthly);

    // 8. Bandbreedte
    const low = monthly * (1 - PRICING_CONFIG.rangeSpread / 100);
    const high = monthly * (1 + PRICING_CONFIG.rangeSpread / 100);

    animateValue(priceLowEl, lastLow || low, low, 450);
    animateValue(priceHighEl, lastHigh || high, high, 450);
    lastLow = low; lastHigh = high;

    const rangeText = formatEuro(low) + ' \u2013 ' + formatEuro(high);
    if (mobilePriceEl) mobilePriceEl.textContent = rangeText + ' / mnd';
    if (modalPriceEl) modalPriceEl.textContent = rangeText;
    if (modalPriceField) modalPriceField.value = rangeText + ' per maand (indicatief)';

    if (hoursVisitEl) hoursVisitEl.textContent = hoursPerVisit.toFixed(1).replace('.', ',');
    if (hoursMonthEl) hoursMonthEl.textContent = Math.round(hoursPerMonth);

    // Details voor in de offerte-e-mail
    if (modalDetailsField) {
      const typeLabel = calc.querySelector('#calcType .calc-card.active')?.dataset.label || '';
      const freqLabel = calc.querySelector('#calcFreq .calc-card.active')?.dataset.label || '';
      const extras = Array.from(extraChecks).filter(c => c.checked).map(c => c.closest('label').textContent.trim()).join(', ') || 'geen';
      const oplevering = document.getElementById('calcOplevering')?.checked ? 'Ja' : 'Nee';
      const plaats = document.getElementById('calcPlaats')?.value || '';
      modalDetailsField.value = `Type: ${typeLabel} | Oppervlakte: ${m2} m² | Frequentie: ${freqLabel} | Extra diensten: ${extras} | Opleveringsschoonmaak: ${oplevering} | Plaats: ${plaats}`;
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
  const modalTimeButtons = calc.parentElement ? document.querySelectorAll('#calcModalTime .calc-card') : [];
  const modalTimeField = document.getElementById('calcModalTimeField');
  modalTimeButtons.forEach(btn => btn.addEventListener('click', () => {
    selectCard(modalTimeButtons, btn);
    if (modalTimeField) modalTimeField.value = btn.dataset.label;
  }));
})();
