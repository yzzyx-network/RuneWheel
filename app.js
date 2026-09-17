(() => {
  const STORAGE_KEY = 'rs-activity-wheel-options-v2';

  // Default starter options (some with sub-options)
  const DEFAULT_OPTIONS = [
    { id: crypto.randomUUID(), name: 'Zulrah', tag: 'boss', subs: [] },
    { id: crypto.randomUUID(), name: 'Vorkath', tag: 'boss', subs: [] },
    { id: crypto.randomUUID(), name: 'Chambers of Xeric', tag: 'boss', subs: [] },
    { id: crypto.randomUUID(), name: 'Theatre of Blood', tag: 'boss', subs: [] },
    { id: crypto.randomUUID(), name: 'Tombs of Amascut', tag: 'boss', subs: [] },
    {
      id: crypto.randomUUID(),
      name: 'Runecrafting',
      tag: 'skilling',
      subs: [
        { id: crypto.randomUUID(), name: 'Blood runes' },
        { id: crypto.randomUUID(), name: 'Soul runes' },
        { id: crypto.randomUUID(), name: 'Wrath runes' },
        { id: crypto.randomUUID(), name: 'Nature runes' },
        { id: crypto.randomUUID(), name: 'Law runes' },
        { id: crypto.randomUUID(), name: 'Death runes' },
      ],
    },
    {
      id: crypto.randomUUID(),
      name: 'Slayer',
      tag: 'skilling',
      subs: [
        { id: crypto.randomUUID(), name: 'Konar' },
        { id: crypto.randomUUID(), name: 'Nieve / Steve' },
        { id: crypto.randomUUID(), name: 'Duradel' },
        { id: crypto.randomUUID(), name: 'Krystilia (Wildy)' },
      ],
    },
    { id: crypto.randomUUID(), name: 'Agility (Rooftops)', tag: 'skilling', subs: [] },
    { id: crypto.randomUUID(), name: 'Farming runs', tag: 'skilling', subs: [] },
    { id: crypto.randomUUID(), name: 'Hunter (Bird houses)', tag: 'skilling', subs: [] },
    { id: crypto.randomUUID(), name: 'Mining (Motherlode)', tag: 'skilling', subs: [] },
    { id: crypto.randomUUID(), name: 'Clue scrolls', tag: 'other', subs: [] },
    { id: crypto.randomUUID(), name: 'Questing', tag: 'other', subs: [] },
    { id: crypto.randomUUID(), name: 'PVP / Wildy', tag: 'other', subs: [] },
  ];

  const TAG_COLORS = {
    boss: '#e5534b',
    skilling: '#3fb950',
    other: '#58a6ff',
  };

  const TAG_LABELS = {
    boss: 'Boss',
    skilling: 'Skilling',
    other: 'Other',
  };

  const SUB_COLORS = [
    '#d2a8ff', '#a5d6ff', '#f0b429', '#7ee787',
    '#ff7b72', '#79c0ff', '#ffa657', '#d2a8ff',
  ];

  // State
  let options = loadOptions();
  let currentFilter = 'all';
  let isSpinning = false;
  let currentRotation = 0;
  let subRotation = 0;
  let expandedId = null; // which option's subs panel is open

  // DOM
  const canvas = document.getElementById('wheelCanvas');
  const ctx = canvas.getContext('2d');
  const subCanvas = document.getElementById('subWheelCanvas');
  const subCtx = subCanvas.getContext('2d');
  const subWheelWrap = document.getElementById('subWheelWrap');
  const spinBtn = document.getElementById('spinBtn');
  const resultEl = document.getElementById('result');
  const resultText = document.getElementById('resultText');
  const resultTag = document.getElementById('resultTag');
  const resultSubLine = document.getElementById('resultSubLine');
  const resultSubText = document.getElementById('resultSubText');
  const addForm = document.getElementById('addForm');
  const optionNameInput = document.getElementById('optionName');
  const optionTagSelect = document.getElementById('optionTag');
  const optionsList = document.getElementById('optionsList');
  const clearBtn = document.getElementById('clearBtn');
  const filterBtns = document.querySelectorAll('.filter-btn');

  function loadOptions() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure every option has a subs array
          return parsed.map((o) => ({
            ...o,
            subs: Array.isArray(o.subs) ? o.subs : [],
          }));
        }
      }
    } catch (_) {}
    return DEFAULT_OPTIONS.map((o) => ({ ...o, subs: [...(o.subs || [])] }));
  }

  function saveOptions() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
  }

  function getFilteredOptions() {
    if (currentFilter === 'all') return options;
    return options.filter((o) => o.tag === currentFilter);
  }

  // ---------- Drawing ----------
  function drawWheelOn(ctx, canvasEl, items, rotation, colorFn, isSub = false) {
    const dpr = window.devicePixelRatio || 1;
    // Use CSS size for logical drawing
    const cssSize = parseFloat(canvasEl.style.width) || (isSub ? 260 : 420);
    const center = cssSize / 2;
    const radius = center - (isSub ? 6 : 8);

    ctx.clearRect(0, 0, cssSize, cssSize);

    if (items.length === 0) {
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#21262d';
      ctx.fill();
      ctx.strokeStyle = '#30363d';
      ctx.lineWidth = isSub ? 3 : 4;
      ctx.stroke();
      ctx.fillStyle = '#8b949e';
      ctx.font = `${isSub ? 13 : 16}px Roboto, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isSub ? 'No subs' : 'Add options!', center, center);
      return;
    }

    const arc = (Math.PI * 2) / items.length;

    items.forEach((item, i) => {
      const start = rotation + i * arc;
      const end = start + arc;

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, start, end);
      ctx.closePath();

      const baseColor = colorFn(item, i);
      ctx.fillStyle = i % 2 === 0 ? baseColor : adjustBrightness(baseColor, -18);
      ctx.fill();

      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Label
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(start + arc / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      const fontSize = Math.min(isSub ? 12 : 14, (isSub ? 160 : 280) / items.length);
      ctx.font = `bold ${fontSize}px Roboto, sans-serif`;
      ctx.shadowColor = 'rgba(0,0,0,0.7)';
      ctx.shadowBlur = 3;

      const maxChars = Math.max(6, Math.floor((isSub ? 18 : 26) - items.length * 0.5));
      let label = item.name;
      if (label.length > maxChars) label = label.slice(0, maxChars - 1) + '…';
      ctx.fillText(label, radius - (isSub ? 10 : 14), 0);
      ctx.restore();
    });

    // Center hub
    const hubR = isSub ? 18 : 26;
    ctx.beginPath();
    ctx.arc(center, center, hubR, 0, Math.PI * 2);
    ctx.fillStyle = '#0d1117';
    ctx.fill();
    ctx.strokeStyle = isSub ? '#d2a8ff' : '#f0b429';
    ctx.lineWidth = isSub ? 2.5 : 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(center, center, isSub ? 5 : 7, 0, Math.PI * 2);
    ctx.fillStyle = isSub ? '#d2a8ff' : '#f0b429';
    ctx.fill();
  }

  function drawMainWheel() {
    const filtered = getFilteredOptions();
    drawWheelOn(
      ctx,
      canvas,
      filtered,
      currentRotation,
      (opt) => TAG_COLORS[opt.tag] || '#58a6ff',
      false
    );
  }

  function drawSubWheel(subs) {
    drawWheelOn(
      subCtx,
      subCanvas,
      subs,
      subRotation,
      (_, i) => SUB_COLORS[i % SUB_COLORS.length],
      true
    );
  }

  function adjustBrightness(hex, amount) {
    const num = parseInt(hex.slice(1), 16);
    let r = (num >> 16) + amount;
    let g = ((num >> 8) & 0xff) + amount;
    let b = (num & 0xff) + amount;
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }

  // ---------- List rendering ----------
  function renderList() {
    const filtered = getFilteredOptions();
    optionsList.innerHTML = '';

    if (filtered.length === 0) {
      optionsList.innerHTML = `<li class="empty-state">${
        options.length === 0
          ? 'No options yet. Add some above!'
          : 'No options match this filter.'
      }</li>`;
      return;
    }

    filtered.forEach((opt) => {
      const li = document.createElement('li');
      li.className = 'option-item';
      li.dataset.id = opt.id;

      const subCount = (opt.subs || []).length;
      const isOpen = expandedId === opt.id;

      li.innerHTML = `
        <div class="option-row">
          <span class="tag-dot ${opt.tag}"></span>
          <span class="name" title="${escapeHtml(opt.name)}">${escapeHtml(opt.name)}</span>
          ${subCount > 0 ? `<span class="sub-count">${subCount}</span>` : ''}
          <span class="tag-label ${opt.tag}">${TAG_LABELS[opt.tag]}</span>
          <button class="expand-btn ${isOpen ? 'open' : ''}" title="Sub-options" data-action="expand" data-id="${opt.id}">
            ${isOpen ? '▾' : '▸'}
          </button>
          <button class="remove-btn" title="Remove" data-action="remove" data-id="${opt.id}">×</button>
        </div>
        <div class="subs-panel ${isOpen ? 'open' : ''}" data-id="${opt.id}">
          ${renderSubsPanel(opt)}
        </div>
      `;
      optionsList.appendChild(li);
    });
  }

  function renderSubsPanel(opt) {
    const subs = opt.subs || [];
    let html = '';

    if (subs.length === 0) {
      html += `<p class="subs-empty">No sub-options yet</p>`;
    } else {
      html += `<ul class="subs-list">`;
      subs.forEach((s) => {
        html += `
          <li class="sub-item">
            <span class="sub-name">${escapeHtml(s.name)}</span>
            <button class="sub-remove" data-action="remove-sub" data-parent="${opt.id}" data-sub="${s.id}" title="Remove">×</button>
          </li>
        `;
      });
      html += `</ul>`;
    }

    html += `
      <form class="sub-add-form" data-parent="${opt.id}">
        <input type="text" placeholder="Add sub-option..." maxlength="40" required autocomplete="off">
        <button type="submit">Add</button>
      </form>
    `;
    return html;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function updateUI() {
    drawMainWheel();
    renderList();
    spinBtn.disabled = getFilteredOptions().length === 0 || isSpinning;
  }

  // ---------- Spin logic ----------
  function animateSpin({
    startRot,
    endRot,
    duration,
    onFrame,
    onDone,
  }) {
    const startTime = performance.now();
    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }
    function frame(now) {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = easeOutCubic(t);
      const rot = startRot + (endRot - startRot) * eased;
      onFrame(rot);
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        onDone(endRot);
      }
    }
    requestAnimationFrame(frame);
  }

  function computeTargetRotation(current, itemCount, targetIndex) {
    const segmentAngle = (Math.PI * 2) / itemCount;
    const targetMiddle = -Math.PI / 2;
    const targetRotation =
      targetMiddle - targetIndex * segmentAngle - segmentAngle / 2;

    let delta = targetRotation - (current % (Math.PI * 2));
    while (delta > 0) delta -= Math.PI * 2;
    const extraSpins = 5 + Math.random() * 4;
    delta -= extraSpins * Math.PI * 2;
    return current + delta;
  }

  function spin() {
    const filtered = getFilteredOptions();
    if (filtered.length === 0 || isSpinning) return;

    isSpinning = true;
    spinBtn.disabled = true;
    resultEl.classList.add('hidden');
    resultSubLine.classList.add('hidden');
    subWheelWrap.classList.add('hidden');

    const randomIndex = Math.floor(Math.random() * filtered.length);
    const endRotation = computeTargetRotation(
      currentRotation,
      filtered.length,
      randomIndex
    );
    const duration = 4200 + Math.random() * 1200;

    animateSpin({
      startRot: currentRotation,
      endRot: endRotation,
      duration,
      onFrame: (rot) => {
        currentRotation = rot;
        drawMainWheel();
      },
      onDone: (finalRot) => {
        currentRotation = finalRot;
        drawMainWheel();
        const selected = filtered[randomIndex];
        handleMainResult(selected);
      },
    });
  }

  function handleMainResult(selected) {
    // Show main result immediately
    resultText.textContent = selected.name;
    resultTag.textContent = TAG_LABELS[selected.tag];
    resultTag.className = `result-tag ${selected.tag}`;
    resultEl.classList.remove('hidden');
    resultSubLine.classList.add('hidden');

    const subs = selected.subs || [];
    if (subs.length === 0) {
      isSpinning = false;
      spinBtn.disabled = false;
      return;
    }

    // Show & spin sub-wheel
    subWheelWrap.classList.remove('hidden');
    subRotation = 0;
    drawSubWheel(subs);

    // Small pause then spin sub
    setTimeout(() => {
      const subIndex = Math.floor(Math.random() * subs.length);
      const endSubRot = computeTargetRotation(subRotation, subs.length, subIndex);
      const subDuration = 2800 + Math.random() * 1000;

      animateSpin({
        startRot: subRotation,
        endRot: endSubRot,
        duration: subDuration,
        onFrame: (rot) => {
          subRotation = rot;
          drawSubWheel(subs);
        },
        onDone: (finalRot) => {
          subRotation = finalRot;
          drawSubWheel(subs);
          const subSelected = subs[subIndex];
          resultSubText.textContent = subSelected.name;
          resultSubLine.classList.remove('hidden');
          isSpinning = false;
          spinBtn.disabled = false;
        },
      });
    }, 400);
  }

  // ---------- Event listeners ----------
  spinBtn.addEventListener('click', spin);

  addForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = optionNameInput.value.trim();
    const tag = optionTagSelect.value;
    if (!name || !tag) return;

    options.push({
      id: crypto.randomUUID(),
      name,
      tag,
      subs: [],
    });
    saveOptions();
    optionNameInput.value = '';
    optionTagSelect.selectedIndex = 0;
    updateUI();
    optionNameInput.focus();
  });

  // Delegate clicks inside options list
  optionsList.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    const id = btn.dataset.id;

    if (action === 'remove') {
      options = options.filter((o) => o.id !== id);
      if (expandedId === id) expandedId = null;
      saveOptions();
      updateUI();
      return;
    }

    if (action === 'expand') {
      expandedId = expandedId === id ? null : id;
      renderList();
      return;
    }

    if (action === 'remove-sub') {
      const parentId = btn.dataset.parent;
      const subId = btn.dataset.sub;
      const parent = options.find((o) => o.id === parentId);
      if (parent) {
        parent.subs = (parent.subs || []).filter((s) => s.id !== subId);
        saveOptions();
        renderList();
      }
    }
  });

  // Delegate sub-option form submits
  optionsList.addEventListener('submit', (e) => {
    const form = e.target.closest('.sub-add-form');
    if (!form) return;
    e.preventDefault();

    const parentId = form.dataset.parent;
    const input = form.querySelector('input');
    const name = input.value.trim();
    if (!name) return;

    const parent = options.find((o) => o.id === parentId);
    if (parent) {
      if (!parent.subs) parent.subs = [];
      parent.subs.push({ id: crypto.randomUUID(), name });
      saveOptions();
      input.value = '';
      // Keep panel open
      expandedId = parentId;
      renderList();
      // Re-focus the new input
      const newInput = optionsList.querySelector(
        `.sub-add-form[data-parent="${parentId}"] input`
      );
      if (newInput) newInput.focus();
    }
  });

  clearBtn.addEventListener('click', () => {
    if (options.length === 0) return;
    if (!confirm('Remove all options? This cannot be undone.')) return;
    options = [];
    expandedId = null;
    saveOptions();
    subWheelWrap.classList.add('hidden');
    updateUI();
  });

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      expandedId = null;
      updateUI();
    });
  });

  // ---------- Canvas sizing ----------
  function resizeCanvases() {
    const dpr = window.devicePixelRatio || 1;

    // Main
    const mainContainer = canvas.parentElement;
    const mainSize = Math.min(420, mainContainer.clientWidth || 420);
    canvas.width = mainSize * dpr;
    canvas.height = mainSize * dpr;
    canvas.style.width = mainSize + 'px';
    canvas.style.height = mainSize + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Sub
    const subContainer = subCanvas.parentElement;
    const subSize = Math.min(260, subContainer.clientWidth || 260);
    subCanvas.width = subSize * dpr;
    subCanvas.height = subSize * dpr;
    subCanvas.style.width = subSize + 'px';
    subCanvas.style.height = subSize + 'px';
    subCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    drawMainWheel();
    // Only redraw sub if visible
    if (!subWheelWrap.classList.contains('hidden')) {
      // We don't keep the last subs list globally, so just leave it;
      // next spin will redraw properly.
    }
  }

  window.addEventListener('resize', resizeCanvases);

  // Init
  resizeCanvases();
  updateUI();
})();
