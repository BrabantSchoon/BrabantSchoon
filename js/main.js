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
  const autoAdvanceSteps = [1, 2, 3, 4];
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

  // Toon 'Bedrijfsnaam' of 'Type woning' in de laatste stap, afhankelijk van het gekozen klanttype
  const bedrijfsnaamField = document.getElementById('fieldBedrijfsnaam');
  const typeWoningField = document.getElementById('fieldTypeWoning');
  if (bedrijfsnaamField && typeWoningField) {
    form.querySelectorAll('input[name="klanttype"]').forEach(radio => {
      radio.addEventListener('change', () => {
        const isParticulier = radio.value === 'Particulier' && radio.checked;
        if (radio.checked) {
          bedrijfsnaamField.hidden = isParticulier;
          typeWoningField.hidden = !isParticulier;
        }
      });
    });
  }

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

const revealEls = document.querySelectorAll('.reveal');
if (revealEls.length) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(el => io.observe(el));
}
