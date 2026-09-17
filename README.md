# RuneScape Activity Wheel

A polished, browser-based **spinning wheel** for picking your next RuneScape activity — bosses, skilling, AFK tasks, and anything else you add.

No install, no backend. Open it in a browser and spin.

> **Disclaimer:** Shamelessly vibecoded for personal use. Expect quirks, feel free to report bugs, it's been working great for me though!

---

## Features

### Main wheel

- Canvas-based wheel with smooth ease-out animation
- Segments colored by tag
- Result always matches the segment under the top pointer

### Sub-wheels

- Attach secondary options to any activity (e.g. **Runecrafting → Blood runes, Soul runes, …**)
- Sub-wheel auto-spins after the main wheel lands on an activity that has subs
- Load a sub-wheel anytime with **🎡** without spinning the main wheel
- **SPIN SUB** spins the sub-wheel on its own

### Options & tags

| Built-in tags | Purpose |
| --- | --- |
| **Boss** | PvM / raids |
| **Skilling** | Training skills |
| **Other** | Misc activities |
| **AFK** | Low-attention tasks |

- Create **custom tags** with **+** next to the tag dropdown
- Manage / delete custom tags with **⚙** (built-ins cannot be deleted)
- Activities sorted by tag, then alphabetically within each tag

### Filters

- **Multi-select** tag filters (e.g. Boss + Skilling, exclude AFK)
- **All** clears the filter and shows everything

### Visibility

- **👁** on each row hides that activity from the wheel (stays in the list, greyed out)
- Click again to show it
- **Enable all / Disable all** applies only to activities in the *current tag filter*

### Themes

- **OSRS** — stone panels, gold trim, classic game UI feel
- **Modern** — clean dark UI
- Toggle in the top-right; preference is saved

### Persistence

Everything is stored in **localStorage** in your browser:

- Activities & sub-options
- Custom tags
- Theme preference
- Visibility (enabled / hidden) state

---

## Quick start

### Option A — Single file

1. Open `wheel.html` in any modern browser
2. That’s it — CSS and JS are inlined

### Option B — Multi-file (for development)

1. Serve the folder (or open `index.html` with the other files beside it):

```bash
# from the project directory
python3 -m http.server 8000
# then visit http://localhost:8000
```

| File | Role |
| --- | --- |
| `index.html` | Structure |
| `styles.css` | OSRS + Modern themes |
| `app.js` | Wheel logic, tags, storage |
| `wheel.html` | Standalone all-in-one build |

---

## How to use

1. **Add activities** — name + tag → **Add**
2. **Optional subs** — expand an activity with **▸**, add sub-options
3. **Filter** — click one or more tag buttons
4. **Hide** activities you don’t want in the pool with **👁**
5. **SPIN** — main wheel picks an activity; sub-wheel follows if needed
6. **?** (top-left) — full in-app help

---

## Tech

- Vanilla **HTML / CSS / JS** (no frameworks)
- **Canvas 2D** for both wheels
- **localStorage** for persistence
- Responsive layout; works on desktop and mobile-sized viewports

---

## Project layout

```
.
├── index.html      # App shell
├── styles.css      # Themes & layout
├── app.js          # Logic
├── wheel.html      # Self-contained single-file version
└── README.md
```

---

## License

Use freely for personal or community RuneScape tools. Not affiliated with Jagex.