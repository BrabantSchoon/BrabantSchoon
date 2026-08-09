// Mobiel menu werkt volledig via CSS (checkbox-methode), geen JS nodig.

// Pakketkaarten (particuliere detailpagina's): "Bekijk wat inbegrepen is"
// klapt alleen de onderdelenlijst van die kaart open/dicht — geen nieuwe
// pagina, geen popup. Binnen dezelfde .pakket-grid staat maar 1 kaart
// tegelijk open. Puur een hidden-toggle, geen IntersectionObserver erbij
// betrokken — de inhoud is dus altijd betrouwbaar beschikbaar.
// Zelfstandige initialisatiefunctie, veilig aangeroepen na DOMContentLoaded
// en in een try/catch: een eventuele fout elders in dit bestand mag nooit
// verhinderen dat de pakketknoppen werken.
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
      const grid = btn.closest('.pakket-grid');
      if (grid && !expanded) {
        grid.querySelectorAll('.pakket-toggle[aria-expanded="true"]').forEach(other => {
          if (other === btn) return;
          setPakketToggleState(other, false);
          const otherTarget = document.getElementById(other.getAttribute('aria-controls'));
          if (otherTarget) otherTarget.hidden = true;
        });
      }
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
    const requiresDienst = stepEl.getAttribute('data-requires-dienst');
    if (requiresDienst && currentDienstSlug() !== requiresDienst) return false;
    return true;
  }
  function applicableSteps() {
    return steps.filter(stepApplies).map(s => parseInt(s.dataset.step, 10));
  }

  function show(stepNum, scrollTo) {
    steps.forEach(s => { s.hidden = parseInt(s.dataset.step, 10) !== stepNum; });
    // Robuustheid: bij het openen van de pakket- of extra's-stap altijd opnieuw
    // uitlezen welke dienst nu daadwerkelijk gekozen is en de pakketten/extra's
    // daarop afstemmen — nooit alleen vertrouwen op het change-event van de
    // vorige stap (dat kan gemist zijn bij terugnavigeren, voorinvullen via
    // URL-parameters, of een programmatische wijziging).
    if (stepNum === 3 || stepNum === 4) applyDienst(currentDienstSlug());
    const appl = applicableSteps();
    const idx = appl.indexOf(stepNum);
    const pos = idx === -1 ? 1 : idx + 1;
    const totalAppl = appl.length || 1;
    fill.style.width = (pos / totalAppl * 100) + '%';
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
  const dienstWraps = Array.from(form.querySelectorAll('#offerteWizard .wizard-step[data-step="2"] .rc-wrap'));
  const bedrijfsnaamField = document.getElementById('fieldBedrijfsnaam');
  const bedrijfsnaamInput = document.getElementById('bedrijfsnaam');
  const aantalLocatiesField = document.getElementById('fieldAantalLocaties');
  const aantalLocatiesInput = document.getElementById('aantal_locaties');
  const oppQ = document.getElementById('oppervlakteQ');
  const oppSub = document.getElementById('oppervlakteSub');
  const toelichtingQ = document.getElementById('toelichtingQ');

  // Particuliere stap-3/4-elementen (pakket + extra werkzaamheden), gefilterd op dienst-slug
  const pakketWraps = Array.from(form.querySelectorAll('.wizard-step[data-step="3"] .rc-wrap'));
  const extraCheckboxLabels = Array.from(form.querySelectorAll('#extraCheckboxes .cb-card[data-dienst-for]'));
  const extraAndersCheck = document.getElementById('extraAndersCheck');
  const extraAndersWrap = document.getElementById('extraAndersWrap');
  const extraAndersInput = document.getElementById('extra_anders');
  const extraOptiesField = document.getElementById('extraOptiesField');
  const pakketNaamField = document.getElementById('pakketNaamField');

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
      if (extraAndersCheck) extraAndersCheck.checked = false;
      if (extraAndersWrap) extraAndersWrap.hidden = true;
      clearAndDisable(extraAndersInput);
      syncExtraOptiesField();
      if (pakketNaamField) pakketNaamField.value = '';
      ['typewoning', 'woonoppervlakte_m2', 'slaapkamers', 'badkamers', 'toiletten'].forEach(n => {
        const f = form.querySelector(`[name="${n}"]`);
        if (f) f.value = '';
      });
      form.querySelectorAll('input[name="bewoond_leeg"], input[name="vervuilingsgraad"], input[name="frequentie_particulier"]').forEach(r => { r.checked = false; });
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
    syncExtraOptiesField();
    syncPakketNaamField();
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
    });
  });

  form.querySelectorAll('input[name="dienst"]').forEach(radio => {
    radio.addEventListener('change', () => {
      if (!radio.checked) return;
      const wrap = radio.closest('.rc-wrap');
      const slug = wrap ? (wrap.getAttribute('data-dienst-slug') || '') : '';
      if (slug) applyDienst(slug);
    });
  });

  form.querySelectorAll('input[name="pakket"]').forEach(radio => {
    radio.addEventListener('change', syncPakketNaamField);
  });

  extraCheckboxLabels.forEach(label => {
    const cb = label.querySelector('input');
    if (!cb) return;
    cb.addEventListener('change', () => {
      label.classList.toggle('cb-checked', cb.checked);
      syncExtraOptiesField();
    });
  });
  if (extraAndersCheck) {
    extraAndersCheck.addEventListener('change', () => {
      const checked = extraAndersCheck.checked;
      if (extraAndersWrap) extraAndersWrap.hidden = !checked;
      if (checked) enableField(extraAndersInput); else clearAndDisable(extraAndersInput);
    });
  }

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
      const dienstWrap = Array.from(form.querySelectorAll('.wizard-step[data-step="2"] .rc-wrap[data-dienst-slug]'))
        .find(w => w.getAttribute('data-dienst-slug') === requestedDienstSlug);
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
      const pakketRadio = Array.from(form.querySelectorAll('.wizard-step[data-step="3"] input[name="pakket"][data-pakket-id]'))
        .find(r => r.getAttribute('data-pakket-id') === requestedPakketId);
      if (pakketRadio && !pakketRadio.disabled) {
        pakketRadio.checked = true;
        syncPakketNaamField();
        pakketOk = true;
        pakketLabel = pakketRadio.value;
      }
    }

    // Alleen bij een VOLLEDIG geldige combinatie (type + dienst + pakket)
    // springen we door naar de eerstvolgende relevante vraag en tonen we de
    // compacte "Uw keuze"-samenvatting. Bij een onvolledige of ongeldige
    // combinatie doorloopt de bezoeker gewoon de normale wizard vanaf stap 1
    // (route A) — de eventueel wel geldige eerdere keuzes (bijv. alleen het
    // klanttype) blijven dan gewoon aangevinkt staan.
    if (typeOk && dienstOk && pakketOk) {
      if (preselectBox && preselectText) {
        preselectText.textContent = dienstLabel + ' \u2014 ' + pakketLabel;
        preselectBox.hidden = false;
      }
      const appl = applicableSteps();
      startStep = appl.indexOf(3) > -1 && appl.indexOf(3) < appl.length - 1 ? appl[appl.indexOf(3) + 1] : (appl[0] || 1);
    }
  } catch (e) { /* URLSearchParams niet beschikbaar: gewoon geen voorselectie */ }

  if (preselectChangeBtn) {
    preselectChangeBtn.addEventListener('click', () => {
      if (preselectBox) preselectBox.hidden = true;
      current = 2;
      show(2, true);
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

  function buildSummary() {
    const dl = document.getElementById('wizardSummary');
    if (!dl) return;
    const typeRadio = form.querySelector('input[name="klanttype"]:checked');
    const isParticulier = typeRadio && TYPE_MAP[typeRadio.value] === 'particulier';
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
        ['Woonoppervlakte', getFieldValue('woonoppervlakte_m2') ? getFieldValue('woonoppervlakte_m2') + ' m\u00b2' : ''],
        ['Slaapkamers', getFieldValue('slaapkamers')],
        ['Badkamers', getFieldValue('badkamers')],
        ['Toiletten', getFieldValue('toiletten')],
        ['Bewoond of leeg', getFieldValue('bewoond_leeg')],
        ['Staat van de woning', getFieldValue('vervuilingsgraad')],
        ['Gewenste frequentie', getFieldValue('frequentie_particulier')]
      );
    } else {
      rows.push(
        ['Bedrijfsnaam / VvE', getFieldValue('bedrijfsnaam')],
        ['Omvang', getFieldValue('oppervlakte')],
        ['Aantal locaties', getFieldValue('aantal_locaties')],
        ['Frequentie', getFieldValue('frequentie')]
      );
    }
    rows.push(
      ['Gewenste datum/periode', getFieldValue('startdatum')],
      ['Omschrijving', getFieldValue('bericht')],
      ['Naam', getFieldValue('naam')],
      ['E-mailadres', getFieldValue('email')],
      ['Telefoonnummer', getFieldValue('telefoon')],
      ['Plaats/postcode', getFieldValue('plaats')]
    );
    const filtered = rows.filter(row => row[1]);
    dl.innerHTML = filtered.map(row => `<div class="summary-row"><dt>${escapeHtml(row[0])}</dt><dd>${escapeHtml(row[1])}</dd></div>`).join('');
  }

  current = startStep;
  show(current, false);

  // Dubbel verzenden voorkomen: knop direct uitschakelen en status tonen.
  // We doen geen preventDefault op een geldige submit, zodat het formulier
  // gewoon normaal naar Web3Forms gaat; de knop blijft alleen uitgeschakeld
  // zodat een tweede klik vóór de redirect niets meer doet.
  form.addEventListener('submit', (e) => {
    if (form.dataset.submitting === '1') { e.preventDefault(); return; }
    if (!validateStep()) { e.preventDefault(); return; }
    syncPakketNaamField();
    syncExtraOptiesField();
    form.dataset.submitting = '1';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Aanvraag wordt verzonden\u2026';
    if (statusEl) statusEl.textContent = 'Aanvraag wordt verzonden\u2026';
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
    wrap.innerHTML = `<iframe src="${src}" width="100%" height="280" style="border:0; border-radius:16px;" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="BrabantSchoon op de kaart"></iframe>`;
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

