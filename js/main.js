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
  const statusEl = document.getElementById('wizardStatus');
  const subjectInput = document.getElementById('wizardSubject');
  const liveRegion = document.getElementById('wizardLive');
  let current = 1;
  const total = steps.length;

  function currentStepEl() {
    return steps.find(s => parseInt(s.dataset.step, 10) === current);
  }

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
    if (stepNum === total) buildSummary();
    if (scrollTo) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Focus en aria-live: verplaats focus naar de nieuwe stap-titel, zodat
    // toetsenbord- en schermlezergebruikers meekrijgen dat de stap wisselde,
    // zonder dat de focus op een inmiddels verborgen knop achterblijft.
    const heading = currentStepEl() && currentStepEl().querySelector('.wizard-q');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
      if (liveRegion) liveRegion.textContent = 'Stap ' + stepNum + ' van ' + total + ': ' + heading.textContent;
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
    if (current < total) { current++; show(current, true); }
  });
  backBtn.addEventListener('click', () => {
    if (current > 1) { current--; show(current, true); }
  });

  // === Klanttype bepaalt welke diensten en velden relevant zijn ===
  // Geen auto-advance meer na een keuze: de gebruiker ziet zijn keuze eerst
  // bevestigd (rc-card krijgt direct de 'geselecteerd'-stijl) en klikt zelf op
  // 'Volgende'. Dat is voorspelbaarder op mobiel (geen onverwachte
  // schermwissel net na een tik) en betrouwbaarder voor toetsenbordgebruikers.
  const TYPE_MAP = { 'Bedrijf': 'bedrijf', 'VvE / organisatie': 'vve', 'Particulier': 'particulier' };
  const dienstWraps = Array.from(form.querySelectorAll('.radio-cards .rc-wrap'));
  const bedrijfsnaamField = document.getElementById('fieldBedrijfsnaam');
  const bedrijfsnaamInput = document.getElementById('bedrijfsnaam');
  const typeWoningField = document.getElementById('fieldTypeWoning');
  const typeWoningInput = document.getElementById('typewoning');
  const aantalLocatiesField = document.getElementById('fieldAantalLocaties');
  const aantalLocatiesInput = document.getElementById('aantal_locaties');
  const oppQ = document.getElementById('oppervlakteQ');
  const oppSub = document.getElementById('oppervlakteSub');

  function applyDynamicLabel(el, type) {
    if (!el) return;
    const val = el.getAttribute('data-q-' + type);
    if (val) el.textContent = val;
  }

  // Verborgen/irrelevante velden worden geleegd EN disabled: disabled velden
  // worden door de browser vanzelf overgeslagen bij zowel validatie als
  // verzending (ook naar Web3Forms), dus oude waarden kunnen nooit meesturen.
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

    const isParticulier = type === 'particulier';
    if (bedrijfsnaamField) bedrijfsnaamField.hidden = isParticulier;
    if (typeWoningField) typeWoningField.hidden = !isParticulier;
    if (isParticulier) { clearAndDisable(bedrijfsnaamInput); enableField(typeWoningInput); }
    else { clearAndDisable(typeWoningInput); enableField(bedrijfsnaamInput); }

    const showAantal = type === 'bedrijf' || type === 'vve';
    if (aantalLocatiesField) aantalLocatiesField.hidden = !showAantal;
    if (showAantal) enableField(aantalLocatiesInput); else clearAndDisable(aantalLocatiesInput);

    if (subjectInput) {
      const labelMap = { bedrijf: 'Bedrijf', vve: 'VvE/organisatie', particulier: 'Particulier' };
      subjectInput.value = 'Nieuwe offerteaanvraag (' + (labelMap[type] || type) + ') via de website';
    }
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
    });
  });
  // Eventueel al aangevinkt klanttype (bijv. na terug-navigeren in de browser)
  // direct toepassen, niet pas wachten op een nieuwe 'change'.
  const preChecked = form.querySelector('input[name="klanttype"]:checked');
  if (preChecked) applyKlanttype(TYPE_MAP[preChecked.value] || preChecked.value.toLowerCase());

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

  function buildSummary() {
    const dl = document.getElementById('wizardSummary');
    if (!dl) return;
    const typeRadio = form.querySelector('input[name="klanttype"]:checked');
    const rows = [
      ['Klanttype', typeRadio ? typeRadio.value : ''],
      ['Dienst', getFieldValue('dienst')],
      ['Bedrijfsnaam / VvE / woningtype', getFieldValue('bedrijfsnaam') || getFieldValue('typewoning')],
      ['Omvang', getFieldValue('oppervlakte')],
      ['Aantal locaties', getFieldValue('aantal_locaties')],
      ['Frequentie', getFieldValue('frequentie')],
      ['Gewenste datum/periode', getFieldValue('startdatum')],
      ['Toelichting', getFieldValue('bericht')],
      ['Naam', getFieldValue('naam')],
      ['E-mailadres', getFieldValue('email')],
      ['Telefoonnummer', getFieldValue('telefoon')],
      ['Plaats/postcode', getFieldValue('plaats')],
    ].filter(row => row[1]);
    dl.innerHTML = rows.map(row => `<div class="summary-row"><dt>${escapeHtml(row[0])}</dt><dd>${escapeHtml(row[1])}</dd></div>`).join('');
  }

  show(current, false);

  // Dubbel verzenden voorkomen: knop direct uitschakelen en status tonen.
  // We doen geen preventDefault op een geldige submit, zodat het formulier
  // gewoon normaal naar Web3Forms gaat; de knop blijft alleen uitgeschakeld
  // zodat een tweede klik vóór de redirect niets meer doet.
  form.addEventListener('submit', (e) => {
    if (form.dataset.submitting === '1') { e.preventDefault(); return; }
    if (!validateStep()) { e.preventDefault(); return; }
    form.dataset.submitting = '1';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Aanvraag wordt verzonden\u2026';
    if (statusEl) statusEl.textContent = 'Aanvraag wordt verzonden\u2026';
  });

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

// Kaart pas laden na klik (zie contact_info_block in generate.py) — voorkomt
// dat de Google Maps-iframe al voor toestemming/interactie wordt geladen.
document.querySelectorAll('.map-load-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const wrap = document.getElementById(btn.dataset.target);
    if (!wrap) return;
    const src = wrap.getAttribute('data-src');
    wrap.innerHTML = `<iframe src="${src}" width="100%" height="280" style="border:0; border-radius:16px;" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="BrabantSchoon op de kaart"></iframe>`;
  });
});

const revealEls = document.querySelectorAll('.reveal');
if (revealEls.length) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(el => io.observe(el));
}

