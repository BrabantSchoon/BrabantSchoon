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

  function show(stepNum) {
    steps.forEach(s => { s.hidden = parseInt(s.dataset.step, 10) !== stepNum; });
    stepLabels.forEach((el, i) => {
      el.classList.toggle('active', i + 1 === stepNum);
      el.classList.toggle('done', i + 1 < stepNum);
    });
    fill.style.width = (stepNum / total * 100) + '%';
    backBtn.hidden = stepNum === 1;
    nextBtn.hidden = stepNum === total;
    submitBtn.hidden = stepNum !== total;
    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
    if (current < total) { current++; show(current); }
  });
  backBtn.addEventListener('click', () => {
    if (current > 1) { current--; show(current); }
  });

  show(current);
})();

// Voor/na-sleepbalk
const csRange = document.getElementById('csRange');
const csClip = document.getElementById('csAfterClip');
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
