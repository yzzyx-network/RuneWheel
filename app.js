(() => {
  const STORAGE_KEY = 'rs-activity-wheel-options';

  // Default starter options
  const DEFAULT_OPTIONS = [
    { id: crypto.randomUUID(), name: 'Zulrah', tag: 'boss' },
    { id: crypto.randomUUID(), name: 'Vorkath', tag: 'boss' },
    { id: crypto.randomUUID(), name: 'Chambers of Xeric', tag: 'boss' },
    { id: crypto.randomUUID(), name: 'Theatre of Blood', tag: 'boss' },
    { id: crypto.randomUUID(), name: 'Tombs of Amascut', tag: 'boss' },
    { id: crypto.randomUUID(), name: 'Agility (Rooftops)', tag: 'skilling' },
    { id: crypto.randomUUID(), name: 'Slayer', tag: 'skilling' },
    { id: crypto.randomUUID(), name: 'Farming runs', tag: 'skilling' },
    { id: crypto.randomUUID(), name: 'Hunter (Bird houses)', tag: 'skilling' },
    { id: crypto.randomUUID(), name: 'Mining (Motherlode)', tag: 'skilling' },
    { id: crypto.randomUUID(), name: 'Clue scrolls', tag: 'other' },
    { id: crypto.randomUUID(), name: 'Questing', tag: 'other' },
    { id: crypto.randomUUID(), name: 'PVP / Wildy', tag: 'other' },
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

  // State
  let options = loadOptions();
  let currentFilter = 'all';
  let isSpinning = false;
  let currentRotation = 0;

  // DOM
  const canvas = document.getElementById('wheelCanvas');
  const ctx = canvas.getContext('2d');
  const spinBtn = document.getElementById('spinBtn');
  const resultEl = document.getElementById('result');
  const resultText = document.getElementById('resultText');
  const resultTag = document.getElementById('resultTag');
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
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return [...DEFAULT_OPTIONS];
  }

  function saveOptions() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
  }

  function getFilteredOptions() {
    if (currentFilter === 'all') return options;
    return options.filter((o) => o.tag === currentFilter);
  }

  function drawWheel() {
    const filtered = getFilteredOptions();
    const size = canvas.width;
    const center = size / 2;
    const radius = center - 8;

    ctx.clearRect(0, 0, size, size);

    if (filtered.length === 0) {
      // Empty state
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#21262d';
      ctx.fill();
      ctx.strokeStyle = '#30363d';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = '#8b949e';
      ctx.font = '16px Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Add some options!', center, center);
      return;
    }

    const arc = (Math.PI * 2) / filtered.length;

    filtered.forEach((opt, i) => {
      const start = currentRotation + i * arc;
      const end = start + arc;

      // Segment
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, start, end);
      ctx.closePath();

      const baseColor = TAG_COLORS[opt.tag] || '#58a6ff';
      // Slightly alternate brightness for readability
      ctx.fillStyle = i % 2 === 0 ? baseColor : adjustBrightness(baseColor, -18);
      ctx.fill();

      // Border
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(start + arc / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.min(14, 280 / filtered.length)}px Roboto, sans-serif`;
      ctx.shadowColor = 'rgba(0,0,0,0.7)';
      ctx.shadowBlur = 3;

      const maxChars = Math.max(8, Math.floor(28 - filtered.length * 0.6));
      let label = opt.name;
      if (label.length > maxChars) label = label.slice(0, maxChars - 1) + '…';
      ctx.fillText(label, radius - 14, 0);
      ctx.restore();
    });

    // Center circle
    ctx.beginPath();
    ctx.arc(center, center, 28, 0, Math.PI * 2);
    ctx.fillStyle = '#0d1117';
    ctx.fill();
    ctx.strokeStyle = '#f0b429';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(center, center, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#f0b429';
    ctx.fill();
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
      li.innerHTML = `
        <span class="tag-dot ${opt.tag}"></span>
        <span class="name" title="${escapeHtml(opt.name)}">${escapeHtml(opt.name)}</span>
        <span class="tag-label ${opt.tag}">${TAG_LABELS[opt.tag]}</span>
        <button class="remove-btn" title="Remove" data-id="${opt.id}">×</button>
      `;
      optionsList.appendChild(li);
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function updateUI() {
    drawWheel();
    renderList();
    spinBtn.disabled = getFilteredOptions().length === 0 || isSpinning;
  }

  // Spin logic
  function spin() {
    const filtered = getFilteredOptions();
    if (filtered.length === 0 || isSpinning) return;

    isSpinning = true;
    spinBtn.disabled = true;
    resultEl.classList.add('hidden');

    const segmentAngle = (Math.PI * 2) / filtered.length;
    // Random number of full spins + random landing
    const extraSpins = 5 + Math.random() * 4; // 5–9 full rotations
    const randomIndex = Math.floor(Math.random() * filtered.length);
    // We want the pointer (top = -PI/2 relative to standard) to land in the middle of the segment
    // Current rotation is absolute; pointer is at top (angle 0 in our visual = -PI/2 from positive x)
    // Segments are drawn starting from currentRotation
    // To land on index i, we need the middle of segment i to be at the top (angle -PI/2 from positive x, or 3PI/2)
    // Top is angle = -Math.PI/2 in standard math coords
    const targetMiddle = -Math.PI / 2; // pointer direction
    // middle of segment i under currentRotation: currentRotation + i*arc + arc/2
    // We want finalRotation + i*arc + arc/2 ≡ targetMiddle  (mod 2PI)
    // finalRotation ≡ targetMiddle - i*arc - arc/2
    const targetRotation =
      targetMiddle - randomIndex * segmentAngle - segmentAngle / 2;

    // Normalize so we always spin forward a good amount
    let delta = targetRotation - (currentRotation % (Math.PI * 2));
    // Make delta negative-ish then add full spins so we spin clockwise-ish visually? 
    // Actually canvas rotates positive = counterclockwise. For a wheel, either is fine.
    // Ensure we always add positive extra spins
    while (delta > 0) delta -= Math.PI * 2;
    delta -= extraSpins * Math.PI * 2;

    const startRotation = currentRotation;
    const endRotation = startRotation + delta;
    const duration = 4500 + Math.random() * 1500; // 4.5–6s
    const startTime = performance.now();

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function animate(now) {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(t);
      currentRotation = startRotation + (endRotation - startRotation) * eased;
      drawWheel();

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        currentRotation = endRotation;
        // Snap precisely
        const selected = filtered[randomIndex];
        showResult(selected);
        isSpinning = false;
        spinBtn.disabled = false;
        drawWheel();
      }
    }

    requestAnimationFrame(animate);
  }

  function showResult(opt) {
    resultText.textContent = opt.name;
    resultTag.textContent = TAG_LABELS[opt.tag];
    resultTag.className = `result-tag ${opt.tag}`;
    resultEl.classList.remove('hidden');
  }

  // Event listeners
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
    });
    saveOptions();
    optionNameInput.value = '';
    optionTagSelect.selectedIndex = 0;
    updateUI();
    optionNameInput.focus();
  });

  optionsList.addEventListener('click', (e) => {
    const btn = e.target.closest('.remove-btn');
    if (!btn) return;
    const id = btn.dataset.id;
    options = options.filter((o) => o.id !== id);
    saveOptions();
    updateUI();
  });

  clearBtn.addEventListener('click', () => {
    if (options.length === 0) return;
    if (!confirm('Remove all options? This cannot be undone.')) return;
    options = [];
    saveOptions();
    updateUI();
  });

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      updateUI();
    });
  });

  // Handle resize for crisp canvas on high-DPI / responsive
  function resizeCanvas() {
    const container = canvas.parentElement;
    const maxSize = Math.min(500, container.clientWidth || 500);
    // Keep internal resolution high for sharpness
    const dpr = window.devicePixelRatio || 1;
    canvas.width = maxSize * dpr;
    canvas.height = maxSize * dpr;
    canvas.style.width = maxSize + 'px';
    canvas.style.height = maxSize + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Redraw after resize (currentRotation stays)
    drawWheel();
  }

  window.addEventListener('resize', () => {
    resizeCanvas();
  });

  // Init
  resizeCanvas();
  updateUI();
})();
