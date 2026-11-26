# FestiveCart 🛒🎉

> **Toggle Wars: The Flagsmith Experimentation Hackathon — Track 01: Test Something Real**

FestiveCart is a small online shop whose look **changes automatically with the festival of the day**. Flagsmith controls whether festive themes are active, and **Flagsmith Experimentation runs an A/B test** to prove that a festive theme gets more "Add to Cart" clicks than the normal theme.

---

## ✨ What It Does

| Problem | Solution |
|---|---|
| Shops manually redesign their site for every festival — slow and error-prone | A single config file drives all 10 festival themes automatically |
| You can't tell if the festive theme actually increases sales | Flagsmith Experimentation A/B tests festive vs. normal and shows win probability |
| Switching themes mid-dev is risky | An Admin Panel lets you preview any festival theme instantly, with no code changes |

---

## 🚀 Quick Start

```bash
# 1. Clone
git clone https://github.com/aacho04/festivecart.git
cd festivecart

# 2. Install
npm install

# 3. Add your Flagsmith client key (safe to expose in front-end)
cp .env.example .env
# Edit .env → set VITE_FLAGSMITH_ENVIRONMENT_KEY=<your key>

# 4. Run
npm run dev
# → http://localhost:5173
```

The app works with **default values even without a Flagsmith key** — the festive themes and admin panel are fully functional offline.

---

## 🏗 Project Structure

```
festivecart/
├── index.html              # App shell
├── src/
│   ├── festivals.js        # 🗂  All 10 festival configs — add new ones here
│   ├── theme.js            # 🎨  Applies/removes festival themes (CSS vars)
│   ├── decorations.js      # 🎊  Festival-specific inline SVG decorations
│   ├── flagsmith-client.js # 🚩  Flagsmith SDK wrapper (init, flags, events)
│   ├── admin.js            # ⚙️   Admin/demo panel logic
│   ├── main.js             # 🚀  App entry point
│   ├── products.js         # 🛍  Fake product catalogue
│   └── style.css           # 💅  Design system (CSS variables)
├── scripts/
│   ├── simulate.js         # 🤖  Traffic simulator (300 users)
│   └── check-results.js    # 📊  Reads experiment results from API
├── .env.example            # Safe template for environment variables
├── .gitignore
├── vite.config.js
└── package.json
```

---

## 🏮 Festival Themes

| Festival | Dates (2026-27) | Theme | Decorations |
|---|---|---|---|
| 🎃 Halloween | Oct 29–31 | Orange & black | Pumpkins, flying bats, spooky moon |
| 🪔 Diwali | Nov 6–10 ⚠️ | Gold & navy | Flickering diyas, rangoli, sparkles |
| 🎄 Christmas | Dec 20–26 | Red & green | Santa, snowflakes, decorated tree, stars |
| 🎆 New Year | Dec 30–Jan 2 | Black & gold | Fireworks, confetti, banner |
| 🪁 Makar Sankranti | Jan 13–15 ⚠️ | Sky blue & yellow | Colorful kites, clouds |
| 🇮🇳 Republic Day | Jan 24–26 | Tricolor | Ashoka chakra, tricolor stripes |
| 💕 Valentine's Day | Feb 12–14 | Pink & red | Floating hearts, roses |
| 🌙 Eid al-Fitr | Mar 9–11 ⚠️ | Green & gold | Crescent, stars, lanterns, mosque |
| 🎨 Holi | Mar 21–23 ⚠️ | Multicolor | Color splashes, pichkari |
| 🐘 Ganesh Chaturthi | Sep 4–14 ⚠️ | Marigold & red | Lotus, modak, garland |

> ⚠️ Lunar-calendar festivals — verify and update dates in `src/festivals.js` each year.

---

## 🧩 How the Flags Work

### Flag 1: `festive_mode_enabled` (Boolean)

The master on/off switch. When **OFF**, no one sees a festive theme — regardless of the experiment.

### Flag 2: `festive_theme_experiment` (Multivariate)

| Variation key | Value | What the user sees |
|---|---|---|
| *(default)* | `control` | Normal shop theme |
| `festive` | `festive` | Festival theme for today's active festival |

Both flags must be **ON** (and a festival must be active on today's date) for the festive theme to appear.

---

## 🧪 How the Experiment Works

```
User visits FestiveCart
  │
  ├─ festive_mode_enabled = false? → Normal theme, no exposure recorded
  │
  └─ festive_mode_enabled = true?
       │
       ├─ No active festival today? → Normal theme, no exposure recorded
       │
       └─ Festival active!
            │
            ├─ getExperimentVariation() ← Records EXPOSURE in Flagsmith
            │
            ├─ variation = "control" → Normal theme
            │
            └─ variation = "festive" → Festival theme applied
                                           │
                                           └─ User clicks "Add to Cart"
                                                   │
                                                   └─ track("add_to_cart_click") ← Records CONVERSION
```

**Hypothesis**: Showing the festival theme on festival dates increases the share of visitors who click "Add to Cart".

**Metric**: `add_to_cart_click` (occurrence, direction: up)

**Split**: 50% control / 50% festive

---

## ➕ Adding a New Festival

Open `src/festivals.js` and add one object to the `FESTIVALS` array:

```js
{
  id: "pongal",
  name: "Pongal 🌾",
  startDate: "2027-01-14",
  endDate: "2027-01-17",
  colors: {
    primary: "#FF8C00",
    secondary: "#228B22",
    accent: "#FFD700",
    background: "#FFFDE7",
    surface: "#FFFFFF",
    text: "#1A1A1A",
    textMuted: "#555555",
    buttonText: "#FFFFFF",
  },
  bannerMessage: "🌾 Happy Pongal! Sweet deals on every product!",
  heroHeadline: "Pongalo Pongal! 🌾",
  heroSub: "Celebrate the harvest with the best prices of the season.",
  offerText: "🌾 14% off — use PONGAL27",
  decoration: "ganesh-chaturthi",  // reuse nearest decoration, or add a new one
  productBadge: "🌾 Pongal Pick",
},
```

**That's it.** No other file needs to change. The theme engine picks it up automatically.

To add custom decorations, export a new function from `src/decorations.js` and add its key to `DECORATION_MAP`.

---

## 🤖 Traffic Simulator

Simulates 300 users during Christmas (so the experiment is active) and sends events to Flagsmith:

```bash
# Add to .env first:
# FLAGSMITH_SERVER_SIDE_KEY=ser.your_key_here
# FLAGSMITH_EXPERIMENT_ID=123
# FLAGSMITH_ENV_KEY=B7mHk...
# FLAGSMITH_API_KEY=your_admin_key

node scripts/simulate.js

# Wait ~1 minute, then:
node scripts/check-results.js
```

---

## 🔐 Key Management

| Variable | Where used | Safe to commit? |
|---|---|---|
| `VITE_FLAGSMITH_ENVIRONMENT_KEY` | Browser SDK, Vite | ✅ Client-side key — safe |
| `FLAGSMITH_SERVER_SIDE_KEY` | simulate.js | ❌ Server only |
| `FLAGSMITH_API_KEY` | check-results.js | ❌ Admin key — never commit |

All secrets go in `.env` (gitignored). See `.env.example` for the template.

---

## 🛠 Admin Panel

Press **Shift+A** or click the ⚙️ button (bottom-right) to open the Admin/Demo Panel:

- **Festive mode toggle** — override Flagsmith's value locally for instant preview
- **Festival selector** — jump to any of the 10 festival themes instantly
- **Date picker** — simulate any date; theme updates in real time
- **Reset to today** — go back to real date
- **Status line** — shows active festival, Flagsmith source, and experiment variation

---

## 🏆 Hackathon Submission

Built for **Toggle Wars: The Flagsmith Experimentation Hackathon**  
Track: **01 — Test Something Real**  
Deadline: **Nov 29, 2026, 8:00 PM IST**

---

## 📄 License

MIT

