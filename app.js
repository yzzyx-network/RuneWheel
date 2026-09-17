(() => {
  const STORAGE_KEY = 'rs-activity-wheel-options-v3';
  const TAGS_STORAGE_KEY = 'rs-activity-wheel-custom-tags-v3';
  const THEME_STORAGE_KEY = 'rs-activity-wheel-theme';

  // Built-in tags (always available)
  const BUILTIN_TAGS = {
    boss: { id: 'boss', label: 'Boss', color: '#e5534b' },
    skilling: { id: 'skilling', label: 'Skilling', color: '#3fb950' },
    other: { id: 'other', label: 'Other', color: '#58a6ff' },
    afk: { id: 'afk', label: 'AFK', color: '#ffa657' },
  };

  // Palette for custom tags
  const CUSTOM_PALETTE = [
    '#d2a8ff', '#7ee787', '#ff7b72', '#79c0ff',
    '#e3b341', '#f778ba', '#39c5cf', '#a371f7',
    '#56d364', '#f0883e', '#db61a2', '#2f81f7',
  ];

  // Default starter options
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
    { id: crypto.randomUUID(), name: 'NMZ / Nightmare Zone', tag: 'afk', subs: [] },
    { id: crypto.randomUUID(), name: 'Crab / Sand crabs', tag: 'afk', subs: [] },
    { id: crypto.randomUUID(), name: 'Clue scrolls', tag: 'other', subs: [] },
    { id: crypto.randomUUID(), name: 'Questing', tag: 'other', subs: [] },
    { id: crypto.randomUUID(), name: 'PVP / Wildy', tag: 'other', subs: [] },
  ];

  const SUB_COLORS = [
    '#d2a8ff', '#a5d6ff', '#f0b429', '#7ee787',
    '#ff7b72', '#79c0ff', '#ffa657', '#d2a8ff',
  ];

  // State
  let options = loadOptions();
  let customTags = loadCustomTags(); // { id, label, color }
  let activeFilters = new Set(); // empty = show all tags
  let isSpinning = false;
  let currentRotation = 0;
  let subRotation = 0;
  let expandedId = null;
  let currentSubItems = []; // subs currently on the sub-wheel
  let currentSubParent = null; // parent option for the sub-wheel

  // DOM
  const canvas = document.getElementById('wheelCanvas');
  const ctx = canvas.getContext('2d');
  const subCanvas = document.getElementById('subWheelCanvas');
  const subCtx = subCanvas.getContext('2d');
  const subWheelWrap = document.getElementById('subWheelWrap');
  const spinBtn = document.getElementById('spinBtn');
  const spinSubBtn = document.getElementById('spinSubBtn');
  const subWheelLabel = document.getElementById('subWheelLabel');
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
  const filterBar = document.getElementById('filterBar');
  const newTagBtn = document.getElementById('newTagBtn');
  const tagModal = document.getElementById('tagModal');
  const tagForm = document.getElementById('tagForm');
  const newTagNameInput = document.getElementById('newTagName');
  const manageTagsBtn = document.getElementById('manageTagsBtn');
  const manageTagsModal = document.getElementById('manageTagsModal');
  const manageTagsList = document.getElementById('manageTagsList');

  // ---------- Storage ----------
  function loadOptions() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((o) => ({
            ...o,
            subs: Array.isArray(o.subs) ? o.subs : [],
            enabled: o.enabled !== false,
          }));
        }
      }
    } catch (_) {}
    return DEFAULT_OPTIONS.map((o) => ({
      ...o,
      id: o.id || crypto.randomUUID(),
      subs: (o.subs || []).map((s) => ({ ...s, id: s.id || crypto.randomUUID() })),
      enabled: true,
    }));
  }

  function saveOptions() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
  }

  function loadCustomTags() {
    try {
      const raw = localStorage.getItem(TAGS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) {}
    return [];
  }

  function saveCustomTags() {
    localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(customTags));
  }

  // ---------- Tag helpers ----------
  function getAllTags() {
    // Built-ins first, then custom (by creation order)
    const list = Object.values(BUILTIN_TAGS);
    customTags.forEach((t) => list.push(t));
    return list;
  }

  function getTagInfo(tagId) {
    if (BUILTIN_TAGS[tagId]) return BUILTIN_TAGS[tagId];
    const custom = customTags.find((t) => t.id === tagId);
    if (custom) return custom;
    // Fallback for unknown tags
    return { id: tagId, label: tagId, color: '#8b949e' };
  }

  function getTagColor(tagId) {
    return getTagInfo(tagId).color;
  }

  function getTagLabel(tagId) {
    return getTagInfo(tagId).label;
  }

  function slugify(name) {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 24) || 'custom';
  }

  function createCustomTag(label) {
    const clean = label.trim();
    if (!clean) return null;

    // Don't duplicate built-in labels (case-insensitive)
    const lower = clean.toLowerCase();
    for (const t of Object.values(BUILTIN_TAGS)) {
      if (t.label.toLowerCase() === lower || t.id === lower) {
        return t.id; // reuse built-in
      }
    }

    // Don't duplicate existing custom
    const existing = customTags.find(
      (t) => t.label.toLowerCase() === lower || t.id === slugify(clean)
    );
    if (existing) return existing.id;

    let id = slugify(clean);
    // Ensure unique id
    let n = 1;
    while (
      BUILTIN_TAGS[id] ||
      customTags.some((t) => t.id === id)
    ) {
      id = `${slugify(clean)}-${n++}`;
    }

    const color = CUSTOM_PALETTE[customTags.length % CUSTOM_PALETTE.length];
    customTags.push({ id, label: clean, color });
    saveCustomTags();
    return id;
  }

  function deleteCustomTag(tagId) {
    if (BUILTIN_TAGS[tagId]) return false; // cannot delete built-ins

    const count = options.filter((o) => o.tag === tagId).length;
    if (count > 0) {
      const ok = confirm(
        `"${getTagLabel(tagId)}" is used by ${count} activit${count === 1 ? 'y' : 'ies'}.\n\nDelete the tag and reassign those activities to Other?`
      );
      if (!ok) return false;
      options.forEach((o) => {
        if (o.tag === tagId) o.tag = 'other';
      });
      saveOptions();
    }

    customTags = customTags.filter((t) => t.id !== tagId);
    saveCustomTags();

    activeFilters.delete(tagId);
    if (optionTagSelect.value === tagId) optionTagSelect.value = '';
    return true;
  }

  // ---------- Filter / list helpers ----------
  const BUILTIN_TAG_ORDER = ['boss', 'skilling', 'other', 'afk'];

  function sortOptions(list) {
    return [...list].sort((a, b) => {
      const aBuiltin = BUILTIN_TAG_ORDER.indexOf(a.tag);
      const bBuiltin = BUILTIN_TAG_ORDER.indexOf(b.tag);
      const aIsBuiltin = aBuiltin >= 0;
      const bIsBuiltin = bBuiltin >= 0;

      if (aIsBuiltin && bIsBuiltin && aBuiltin !== bBuiltin) {
        return aBuiltin - bBuiltin;
      }
      if (aIsBuiltin !== bIsBuiltin) {
        return aIsBuiltin ? -1 : 1;
      }
      // Both custom (or same builtin tag): sort by tag label, then name
      if (a.tag !== b.tag) {
        return getTagLabel(a.tag).localeCompare(getTagLabel(b.tag), undefined, {
          sensitivity: 'base',
        });
      }
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });
  }

  /** Options matching current tag filters (includes disabled). */
  function getTagScopedOptions() {
    if (activeFilters.size === 0) return options;
    return options.filter((o) => activeFilters.has(o.tag));
  }

  /** List options: tag filter only (includes hidden, so they can be un-hidden). */
  function getListOptions() {
    return sortOptions(getTagScopedOptions());
  }

  /** Wheel options: tag filter AND enabled. */
  function getFilteredOptions() {
    return sortOptions(
      getTagScopedOptions().filter((o) => o.enabled !== false)
    );
  }

  // ---------- Drawing ----------
  function drawWheelOn(ctx, canvasEl, items, rotation, colorFn, isSub = false) {
    const cssSize = parseFloat(canvasEl.style.width) || (isSub ? 260 : 420);
    const center = cssSize / 2;
    const radius = center - (isSub ? 6 : 8);

    ctx.clearRect(0, 0, cssSize, cssSize);

    if (items.length === 0) {
      const isOsrs = document.body.getAttribute('data-theme') !== 'modern';
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.fillStyle = isOsrs ? '#2e2c29' : '#21262d';
      ctx.fill();
      ctx.strokeStyle = isOsrs ? '#5a5248' : '#30363d';
      ctx.lineWidth = isSub ? 3 : 4;
      ctx.stroke();
      ctx.fillStyle = isOsrs ? '#8a7d68' : '#8b949e';
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

    const isOsrs = document.body.getAttribute('data-theme') !== 'modern';
    const hubFill = isOsrs ? '#1a1612' : '#0d1117';
    const hubStroke = isSub
      ? (isOsrs ? '#c080ff' : '#d2a8ff')
      : (isOsrs ? '#e6a519' : '#f0b429');
    const hubDot = isSub
      ? (isOsrs ? '#c080ff' : '#d2a8ff')
      : (isOsrs ? '#ffcf3f' : '#f0b429');

    const hubR = isSub ? 18 : 26;
    ctx.beginPath();
    ctx.arc(center, center, hubR, 0, Math.PI * 2);
    ctx.fillStyle = hubFill;
    ctx.fill();
    ctx.strokeStyle = hubStroke;
    ctx.lineWidth = isSub ? 2.5 : 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(center, center, isSub ? 5 : 7, 0, Math.PI * 2);
    ctx.fillStyle = hubDot;
    ctx.fill();
  }

  function drawMainWheel() {
    const filtered = getFilteredOptions();
    drawWheelOn(
      ctx,
      canvas,
      filtered,
      currentRotation,
      (opt) => getTagColor(opt.tag),
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

  // ---------- UI rendering ----------
  function renderTagSelect(selectedId) {
    const tags = getAllTags();
    optionTagSelect.innerHTML =
      `<option value="" disabled ${!selectedId ? 'selected' : ''}>Tag...</option>` +
      tags
        .map(
          (t) =>
            `<option value="${t.id}" ${t.id === selectedId ? 'selected' : ''}>${escapeHtml(t.label)}</option>`
        )
        .join('');
  }

  function renderFilterBar() {
    const tags = getAllTags();
    // Only show tags that are either built-in or actually used / custom
    const usedTagIds = new Set(options.map((o) => o.tag));
    const visible = tags.filter(
      (t) => BUILTIN_TAGS[t.id] || usedTagIds.has(t.id) || customTags.some((c) => c.id === t.id)
    );

    const allActive = activeFilters.size === 0;

    filterBar.innerHTML =
      `<button class="filter-btn ${allActive ? 'active' : ''}" data-filter="all" title="Show all tags">All</button>` +
      visible
        .map((t) => {
          const on = activeFilters.has(t.id);
          const style = on
            ? `background:${t.color};border-color:${t.color};color:#1a1a1a`
            : '';
          return `<button class="filter-btn ${on ? 'active' : ''}" data-filter="${t.id}" title="${escapeHtml(t.label)} (click to toggle)" style="${style}">${escapeHtml(t.label)}</button>`;
        })
        .join('');
  }

  function tagBadgeStyle(tagId) {
    const info = getTagInfo(tagId);
    const isBuiltin = !!BUILTIN_TAGS[tagId];
    if (isBuiltin) return { className: tagId, style: '' };
    // custom — inline color
    return {
      className: 'custom',
      style: `background:${info.color}22;color:${info.color};border:1px solid ${info.color}`,
    };
  }

  function renderList() {
    const filtered = getListOptions();
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
      const isEnabled = opt.enabled !== false;
      li.className = 'option-item' + (isEnabled ? '' : ' is-hidden');
      li.dataset.id = opt.id;

      const subCount = (opt.subs || []).length;
      const isOpen = expandedId === opt.id;
      const badge = tagBadgeStyle(opt.tag);
      const color = getTagColor(opt.tag);
      const label = getTagLabel(opt.tag);
      const visTitle = isEnabled ? 'Hide from wheel' : 'Show on wheel';
      const visIcon = '👁';

      li.innerHTML = `
        <div class="option-row">
          <span class="tag-dot ${BUILTIN_TAGS[opt.tag] ? opt.tag : ''}" style="${
            !BUILTIN_TAGS[opt.tag] ? `background:${color}` : ''
          }"></span>
          <span class="name" title="${escapeHtml(opt.name)}">${escapeHtml(opt.name)}</span>
          ${subCount > 0 ? `<span class="sub-count">${subCount}</span>` : ''}
          <span class="tag-label ${badge.className}" style="${badge.style}">${escapeHtml(label)}</span>
          ${subCount > 0 && isEnabled ? `<button class="load-sub-btn" title="Load sub-wheel" data-action="load-sub" data-id="${opt.id}">🎡</button>` : ''}
          <button class="visibility-btn ${isEnabled ? '' : 'is-off'}" title="${visTitle}" data-action="toggle-visibility" data-id="${opt.id}">${visIcon}</button>
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

  function updateToggleAllBtn() {
    const btn = document.getElementById('toggleAllBtn');
    if (!btn) return;
    const scoped = getTagScopedOptions();
    if (scoped.length === 0) {
      btn.disabled = true;
      btn.textContent = 'Disable all';
      return;
    }
    btn.disabled = false;
    const allEnabled = scoped.every((o) => o.enabled !== false);
    btn.textContent = allEnabled ? 'Disable all' : 'Enable all';
  }

  function updateUI() {
    renderTagSelect(optionTagSelect.value || '');
    renderFilterBar();
    drawMainWheel();
    renderList();
    updateToggleAllBtn();
    spinBtn.disabled = getFilteredOptions().length === 0 || isSpinning;
  }

  // ---------- Spin ----------
  function normalizeAngle(a) {
    const tau = Math.PI * 2;
    return ((a % tau) + tau) % tau;
  }

  /** Index of the segment under the top pointer (-π/2) given current rotation. */
  function getIndexAtPointer(rotation, itemCount) {
    if (itemCount <= 0) return 0;
    const tau = Math.PI * 2;
    const arc = tau / itemCount;
    // Angle of pointer relative to where segment 0 starts
    const relative = normalizeAngle(-Math.PI / 2 - rotation);
    // Tiny epsilon avoids floating-point landing exactly on a boundary
    let idx = Math.floor((relative + 1e-9) / arc);
    if (idx >= itemCount) idx = 0;
    return idx;
  }

  /**
   * Compute a final rotation so segment targetIndex's center sits under the top pointer.
   * Always spins in the same direction (negative delta) with several full turns.
   */
  function computeTargetRotation(current, itemCount, targetIndex) {
    const tau = Math.PI * 2;
    const arc = tau / itemCount;
    // Segment i center is at rotation + i*arc + arc/2. Put that at the top (-π/2).
    const targetRot = -Math.PI / 2 - targetIndex * arc - arc / 2;
    // delta so current+delta ≡ targetRot (mod τ), preferring negative (consistent spin dir)
    let delta = targetRot - current;
    // Map into (-τ, 0]
    delta = delta - Math.ceil(delta / tau) * tau;
    if (Math.abs(delta) < 1e-10) delta = -tau;
    const extraSpins = 5 + Math.random() * 4;
    return current + delta - extraSpins * tau;
  }

  function animateSpin({ startRot, endRot, duration, onFrame, onDone }) {
    const startTime = performance.now();
    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }
    function frame(now) {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = easeOutCubic(t);
      const rot = startRot + (endRot - startRot) * eased;
      onFrame(rot);
      if (t < 1) requestAnimationFrame(frame);
      else onDone(endRot);
    }
    requestAnimationFrame(frame);
  }

  function setSpinning(active) {
    isSpinning = active;
    spinBtn.disabled = active || getFilteredOptions().length === 0;
    if (spinSubBtn) {
      spinSubBtn.disabled = active || currentSubItems.length === 0;
    }
  }

  function showSubWheel(parentOpt) {
    const subs = (parentOpt && parentOpt.subs) || [];
    if (subs.length === 0) {
      hideSubWheel();
      return;
    }
    currentSubParent = parentOpt;
    currentSubItems = [...subs];
    subRotation = 0;
    subWheelWrap.classList.remove('hidden');
    if (subWheelLabel) {
      subWheelLabel.textContent = parentOpt.name.length > 14
        ? parentOpt.name.slice(0, 13) + '…'
        : parentOpt.name;
    }
    if (spinSubBtn) {
      spinSubBtn.classList.remove('hidden');
      spinSubBtn.disabled = isSpinning || currentSubItems.length === 0;
    }
    // Wait a frame so layout knows the sub-wheel is visible, then size + draw
    requestAnimationFrame(() => {
      resizeCanvases();
      drawSubWheel(currentSubItems);
    });
  }

  function hideSubWheel() {
    currentSubParent = null;
    currentSubItems = [];
    subWheelWrap.classList.add('hidden');
    if (spinSubBtn) spinSubBtn.classList.add('hidden');
    resultSubLine.classList.add('hidden');
  }

  function spin() {
    const filtered = getFilteredOptions();
    if (filtered.length === 0 || isSpinning) return;

    setSpinning(true);
    resultEl.classList.add('hidden');
    resultSubLine.classList.add('hidden');
    // Keep sub-wheel if user loaded one manually; hide only when starting a full main spin
    // (will re-show if result has subs)
    hideSubWheel();

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
        // Trust the visual position under the pointer, not the pre-chosen index
        const landed = getIndexAtPointer(finalRot, filtered.length);
        handleMainResult(filtered[landed]);
      },
    });
  }

  function spinSub() {
    if (isSpinning || currentSubItems.length === 0) return;

    setSpinning(true);
    resultSubLine.classList.add('hidden');

    const randomIndex = Math.floor(Math.random() * currentSubItems.length);
    const endRotation = computeTargetRotation(
      subRotation,
      currentSubItems.length,
      randomIndex
    );
    const duration = 2800 + Math.random() * 1000;

    animateSpin({
      startRot: subRotation,
      endRot: endRotation,
      duration,
      onFrame: (rot) => {
        subRotation = rot;
        drawSubWheel(currentSubItems);
      },
      onDone: (finalRot) => {
        subRotation = finalRot;
        drawSubWheel(currentSubItems);
        const landed = getIndexAtPointer(finalRot, currentSubItems.length);
        const subSelected = currentSubItems[landed];
        // If no main result yet, show parent + sub
        if (currentSubParent) {
          resultText.textContent = currentSubParent.name;
          const info = getTagInfo(currentSubParent.tag);
          resultTag.textContent = info.label;
          if (BUILTIN_TAGS[currentSubParent.tag]) {
            resultTag.className = `result-tag ${currentSubParent.tag}`;
            resultTag.style.cssText = '';
          } else {
            resultTag.className = 'result-tag custom';
            resultTag.style.cssText = `background:${info.color}22;color:${info.color};border:1px solid ${info.color}`;
          }
          resultEl.classList.remove('hidden');
        }
        resultSubText.textContent = subSelected.name;
        resultSubLine.classList.remove('hidden');
        setSpinning(false);
      },
    });
  }

  function handleMainResult(selected) {
    resultText.textContent = selected.name;

    const info = getTagInfo(selected.tag);
    resultTag.textContent = info.label;
    if (BUILTIN_TAGS[selected.tag]) {
      resultTag.className = `result-tag ${selected.tag}`;
      resultTag.style.cssText = '';
    } else {
      resultTag.className = 'result-tag custom';
      resultTag.style.cssText = `background:${info.color}22;color:${info.color};border:1px solid ${info.color}`;
    }
    resultEl.classList.remove('hidden');
    resultSubLine.classList.add('hidden');

    const subs = selected.subs || [];
    if (subs.length === 0) {
      setSpinning(false);
      return;
    }

    showSubWheel(selected);

    // Auto-spin sub after a short pause
    setTimeout(() => {
      if (currentSubItems.length === 0) {
        setSpinning(false);
        return;
      }
      setSpinning(true);
      const subIndex = Math.floor(Math.random() * currentSubItems.length);
      const endSubRot = computeTargetRotation(
        subRotation,
        currentSubItems.length,
        subIndex
      );
      const subDuration = 2800 + Math.random() * 1000;

      animateSpin({
        startRot: subRotation,
        endRot: endSubRot,
        duration: subDuration,
        onFrame: (rot) => {
          subRotation = rot;
          drawSubWheel(currentSubItems);
        },
        onDone: (finalRot) => {
          subRotation = finalRot;
          drawSubWheel(currentSubItems);
          const landed = getIndexAtPointer(finalRot, currentSubItems.length);
          resultSubText.textContent = currentSubItems[landed].name;
          resultSubLine.classList.remove('hidden');
          setSpinning(false);
        },
      });
    }, 400);
  }

  // ---------- Events ----------
  spinBtn.addEventListener('click', spin);
  if (spinSubBtn) spinSubBtn.addEventListener('click', spinSub);

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
      enabled: true,
    });
    saveOptions();
    optionNameInput.value = '';
    optionTagSelect.selectedIndex = 0;
    updateUI();
    optionNameInput.focus();
  });

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

    if (action === 'toggle-visibility') {
      const opt = options.find((o) => o.id === id);
      if (opt) {
        opt.enabled = opt.enabled === false;
        saveOptions();
        updateUI();
      }
      return;
    }

    if (action === 'load-sub') {
      const opt = options.find((o) => o.id === id);
      if (opt && (opt.subs || []).length > 0) {
        showSubWheel(opt);
        // Reflect parent in result area (cleared sub line until they spin)
        resultText.textContent = opt.name;
        const info = getTagInfo(opt.tag);
        resultTag.textContent = info.label;
        if (BUILTIN_TAGS[opt.tag]) {
          resultTag.className = `result-tag ${opt.tag}`;
          resultTag.style.cssText = '';
        } else {
          resultTag.className = 'result-tag custom';
          resultTag.style.cssText = `background:${info.color}22;color:${info.color};border:1px solid ${info.color}`;
        }
        resultEl.classList.remove('hidden');
        resultSubLine.classList.add('hidden');
      }
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
      expandedId = parentId;
      renderList();
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

  const toggleAllBtn = document.getElementById('toggleAllBtn');
  if (toggleAllBtn) {
    toggleAllBtn.addEventListener('click', () => {
      const scoped = getTagScopedOptions();
      if (scoped.length === 0) return;
      const allEnabled = scoped.every((o) => o.enabled !== false);
      const next = !allEnabled; // only disable when everything is on; otherwise enable all
      scoped.forEach((o) => {
        o.enabled = next;
      });
      saveOptions();
      updateUI();
    });
  }

  filterBar.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    const id = btn.dataset.filter;

    if (id === 'all') {
      activeFilters.clear();
    } else if (activeFilters.has(id)) {
      activeFilters.delete(id);
    } else {
      activeFilters.add(id);
    }

    expandedId = null;
    updateUI();
  });

  // Create tag modal
  function openTagModal() {
    tagModal.classList.remove('hidden');
    newTagNameInput.value = '';
    newTagNameInput.focus();
  }

  function closeTagModal() {
    tagModal.classList.add('hidden');
  }

  newTagBtn.addEventListener('click', openTagModal);

  tagModal.addEventListener('click', (e) => {
    if (e.target.hasAttribute('data-close')) closeTagModal();
  });

  tagForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = newTagNameInput.value.trim();
    if (!name) return;
    const id = createCustomTag(name);
    closeTagModal();
    updateUI();
    optionTagSelect.value = id;
  });

  // Manage tags modal
  function renderManageTagsList() {
    const builtins = Object.values(BUILTIN_TAGS);
    const customs = customTags;

    if (builtins.length === 0 && customs.length === 0) {
      manageTagsList.innerHTML = `<li class="manage-tags-empty">No tags</li>`;
      return;
    }

    let html = '';

    builtins.forEach((t) => {
      const count = options.filter((o) => o.tag === t.id).length;
      html += `
        <li class="manage-tag-item">
          <span class="manage-tag-dot" style="background:${t.color}"></span>
          <span class="manage-tag-name">${escapeHtml(t.label)}</span>
          <span class="manage-tag-meta">${count} · built-in</span>
          <button class="manage-tag-delete" disabled title="Built-in tags cannot be deleted">Delete</button>
        </li>
      `;
    });

    if (customs.length === 0) {
      html += `<li class="manage-tags-empty" style="padding:0.8rem 0.5rem">No custom tags yet. Create one with the + button.</li>`;
    } else {
      customs.forEach((t) => {
        const count = options.filter((o) => o.tag === t.id).length;
        html += `
          <li class="manage-tag-item">
            <span class="manage-tag-dot" style="background:${t.color}"></span>
            <span class="manage-tag-name">${escapeHtml(t.label)}</span>
            <span class="manage-tag-meta">${count} activit${count === 1 ? 'y' : 'ies'}</span>
            <button class="manage-tag-delete" data-delete-tag="${t.id}" title="Delete tag">Delete</button>
          </li>
        `;
      });
    }

    manageTagsList.innerHTML = html;
  }

  function openManageTagsModal() {
    renderManageTagsList();
    manageTagsModal.classList.remove('hidden');
  }

  function closeManageTagsModal() {
    manageTagsModal.classList.add('hidden');
  }

  manageTagsBtn.addEventListener('click', openManageTagsModal);

  manageTagsModal.addEventListener('click', (e) => {
    if (e.target.hasAttribute('data-close-manage')) {
      closeManageTagsModal();
      return;
    }
    const delBtn = e.target.closest('[data-delete-tag]');
    if (delBtn) {
      const tagId = delBtn.dataset.deleteTag;
      if (deleteCustomTag(tagId)) {
        renderManageTagsList();
        updateUI();
      }
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!tagModal.classList.contains('hidden')) closeTagModal();
    if (!manageTagsModal.classList.contains('hidden')) closeManageTagsModal();
  });

  // ---------- Canvas sizing ----------
  function resizeCanvases() {
    const dpr = window.devicePixelRatio || 1;

    const mainContainer = canvas.parentElement;
    const mainSize = Math.min(420, mainContainer.clientWidth || 420);
    canvas.width = mainSize * dpr;
    canvas.height = mainSize * dpr;
    canvas.style.width = mainSize + 'px';
    canvas.style.height = mainSize + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const subContainer = subCanvas.parentElement;
    const subSize = Math.min(260, subContainer.clientWidth || 260);
    subCanvas.width = subSize * dpr;
    subCanvas.height = subSize * dpr;
    subCanvas.style.width = subSize + 'px';
    subCanvas.style.height = subSize + 'px';
    subCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    drawMainWheel();
    if (currentSubItems.length > 0 && !subWheelWrap.classList.contains('hidden')) {
      drawSubWheel(currentSubItems);
    }
  }

  window.addEventListener('resize', resizeCanvases);

  // ---------- Theme ----------
  const themeToggle = document.getElementById('themeToggle');
  const themeToggleText = document.getElementById('themeToggleText');

  function applyTheme(theme) {
    const next = theme === 'modern' ? 'modern' : 'osrs';
    document.body.setAttribute('data-theme', next);
    if (themeToggleText) {
      themeToggleText.textContent = next === 'modern' ? 'Modern' : 'OSRS';
    }
    localStorage.setItem(THEME_STORAGE_KEY, next);
    // Redraw wheels so hub colors match theme
    drawMainWheel();
    if (currentSubItems.length > 0 && !subWheelWrap.classList.contains('hidden')) {
      drawSubWheel(currentSubItems);
    }
  }

  function loadTheme() {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'modern' || saved === 'osrs') return saved;
    } catch (_) {}
    return 'osrs';
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.body.getAttribute('data-theme') || 'osrs';
      applyTheme(current === 'osrs' ? 'modern' : 'osrs');
    });
  }

  // Init
  applyTheme(loadTheme());
  resizeCanvases();
  updateUI();
})();
