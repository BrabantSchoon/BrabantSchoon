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

// Prijscalculator (indicatie, realtime, geen submit)
(function() {
  const calc = document.getElementById('calculator');
  if (!calc) return;

  // Configuratie: eenvoudig hier aan te passen zodra echte tarieven bekend zijn.
  const CONFIG = {
    baseRatePerM2PerVisit: 0.11,   // basisprijs per m² per schoonmaakbeurt
    minMonthly: 150,               // ondergrens per maand
    rangeSpread: 0.16,             // 16% marge onder/boven het middelpunt
    minutesPerM2: 0.9               // geschatte tijd (minuten) per m² per beurt
  };

  let typeFactor = 1.0;
  let freqPerMonth = 8.66;
  let extrasTotal = 0;

  const typeButtons = calc.querySelectorAll('#calcType .calc-card');
  const freqButtons = calc.querySelectorAll('#calcFreq .calc-card');
  const timeButtons = calc.querySelectorAll('#calcTime .calc-card');
  const m2Range = document.getElementById('calcM2Range');
  const m2Number = document.getElementById('calcM2Number');
  const extraChecks = calc.querySelectorAll('#calcExtra input[type="checkbox"]');
  const priceRangeEl = document.getElementById('calcPriceRange');
  const priceInzetEl = document.getElementById('calcPriceInzet');
  const mobilePriceEl = document.getElementById('calcMobilePrice');

  function selectCard(buttons, btn) {
    buttons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }

  typeButtons.forEach(btn => btn.addEventListener('click', () => {
    selectCard(typeButtons, btn);
    typeFactor = parseFloat(btn.dataset.value);
    calculate();
  }));
  freqButtons.forEach(btn => btn.addEventListener('click', () => {
    selectCard(freqButtons, btn);
    freqPerMonth = parseFloat(btn.dataset.value);
    calculate();
  }));
  timeButtons.forEach(btn => btn.addEventListener('click', () => selectCard(timeButtons, btn)));

  function syncM2(value) {
    value = Math.max(10, Math.min(20000, parseInt(value) || 0));
    m2Range.value = Math.min(2000, value);
    m2Number.value = value;
    calculate();
  }
  if (m2Range) m2Range.addEventListener('input', e => syncM2(e.target.value));
  if (m2Number) m2Number.addEventListener('input', e => syncM2(e.target.value));

  extraChecks.forEach(chk => chk.addEventListener('change', () => {
    extrasTotal = Array.from(extraChecks).filter(c => c.checked).reduce((sum, c) => sum + parseFloat(c.dataset.value || 0), 0);
    calculate();
  }));

  function formatEuro(n) {
    return '\u20ac' + Math.round(n).toLocaleString('nl-NL');
  }

  function calculate() {
    const m2 = parseInt(m2Number.value) || 250;
    const base = m2 * CONFIG.baseRatePerM2PerVisit * freqPerMonth * typeFactor;
    let monthly = Math.max(CONFIG.minMonthly, base) + extrasTotal;

    const low = monthly * (1 - CONFIG.rangeSpread);
    const high = monthly * (1 + CONFIG.rangeSpread);
    const rangeText = formatEuro(low) + ' \u2013 ' + formatEuro(high);

    if (priceRangeEl) priceRangeEl.textContent = rangeText;
    if (mobilePriceEl) mobilePriceEl.textContent = rangeText + ' / mnd';

    const minutesPerVisit = m2 * CONFIG.minutesPerM2 * typeFactor;
    const hoursPerVisit = Math.max(0.5, minutesPerVisit / 60);
    if (priceInzetEl) {
      const inzetTextNode = priceInzetEl.querySelector('.calc-inzet-text');
      if (inzetTextNode) {
        inzetTextNode.textContent = `Geschatte inzet: ~${hoursPerVisit.toFixed(1)} uur per bezoek`;
      }
    }
  }

  calculate();

  // Mobiele sticky-balk: opent/scrollt naar de prijskaart
  const mobileBtn = document.getElementById('calcMobileBtn');
  const priceCard = document.getElementById('calcPriceCard');
  if (mobileBtn && priceCard) {
    mobileBtn.addEventListener('click', () => {
      priceCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      priceCard.classList.add('calc-price-flash');
      setTimeout(() => priceCard.classList.remove('calc-price-flash'), 900);
    });
  }
})();
