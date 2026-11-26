# Hackathon Submission Checklist ✅

**Project:** FestiveCart  
**Hackathon:** Toggle Wars — Flagsmith Experimentation Hackathon  
**Track:** 01 — Test Something Real  
**Deadline:** November 29, 2026, 8:00 PM IST  

---

## ✅ Already Done (by the agent)

- [x] Vite + vanilla JS app scaffolded and running (`npm install && npm run dev`)
- [x] 10 festival themes in `src/festivals.js` (all with dates, colors, decorations)
- [x] Theme engine applies CSS variables, banner, hero, decorations, and product badges
- [x] All 10 decoration sets (SVG/CSS/emoji) — Halloween, Diwali, Christmas, New Year, Sankranti, Republic Day, Valentine's, Eid, Holi, Ganesh Chaturthi
- [x] Admin panel with festive-mode toggle, festival selector, date picker, reset, and status
- [x] Keyboard shortcut Shift+A to open/close admin panel
- [x] Flagsmith SDK integration (`@flagsmith/flagsmith` v12.4.0+)
- [x] Stable user ID in localStorage (same id for exposure + conversion)
- [x] `getExperimentVariation()` records exposures
- [x] `trackAddToCart()` tracks conversions on every Add to Cart click
- [x] `flushEvents()` registered on page hide / visibility hidden
- [x] `.env.example` and `.gitignore` (`.env` never committed)
- [x] `scripts/simulate.js` — 300 simulated users during Christmas
- [x] `scripts/check-results.js` — reads experiment results and prints win probability
- [x] README.md — setup, flags, experiment flow, adding a new festival
- [x] DEMO_SCRIPT.md — 2–3 minute video script
- [x] Code pushed to GitHub: https://github.com/aacho04/festivecart
- [x] `prefers-reduced-motion` respected (all animations suppressed)
- [x] Responsive design (mobile-friendly)

---

## 🔲 You Still Need To Do

### 1. Flagsmith Account Setup
- [ ] Log in to [app.flagsmith.com](https://app.flagsmith.com)
- [ ] Create a project (or use an existing one)
- [ ] Connect a data warehouse to your environment  
  → If not done: https://docs.flagsmith.com/experimentation/connect-a-warehouse

### 2. Run Flagsmith CLI Setup
```bash
# Check CLI version (need v2+)
flagsmith --version

# If missing, install:
npm install -g @flagsmith/cli

# Login
flagsmith login

# List projects and environments
flagsmith project list
flagsmith environment list --project <project-id>

# Bind this repo
flagsmith init --project <project-id> --environment <env-key>
```

### 3. Create the Flags
```bash
# Boolean master switch
flagsmith feature create festive_mode_enabled --enabled

# Multivariate experiment flag
flagsmith feature create festive_theme_experiment --value control --enabled
flagsmith feature variant add festive_theme_experiment --value festive --key festive --weight 0

# Verify
flagsmith feature get festive_theme_experiment --json
```

### 4. Create the Metric
```bash
echo '{"name":"Add to Cart Clicks","aggregation":"occurrence","direction":"up","definition":{"version":1,"event":"add_to_cart_click"}}' \
  | flagsmith api api/v1/environments/<env-key>/experiment-metrics/ --method POST --input -
```

### 5. Create the Experiment
```bash
# Use IDs from previous steps
echo '{
  "feature": <flag-id>,
  "name": "Festive Theme A/B Test",
  "hypothesis": "Showing the festival theme on festival dates increases the share of visitors who click Add to Cart.",
  "metrics": [{"metric": <metric-id>, "expected_direction": "increase"}],
  "experiment_rollout": {
    "enabled": true,
    "rollout_percentage": 100,
    "feature_state_value": {"type": "string", "value": "control"},
    "multivariate_feature_state_values": [
      {"multivariate_feature_option": <variation-id>, "percentage_allocation": 50}
    ]
  }
}' | flagsmith api api/v1/environments/<env-key>/experiments/ --method POST --input -
```

### 6. Add Keys to .env
```
VITE_FLAGSMITH_ENVIRONMENT_KEY=<client-side key from Flagsmith dashboard>
FLAGSMITH_API_KEY=<admin API key — never commit>
FLAGSMITH_ENV_KEY=<environment key>
FLAGSMITH_EXPERIMENT_ID=<id from step 5>
FLAGSMITH_PROJECT_ID=<project id>
```

### 7. Start the Experiment
```bash
flagsmith api api/v1/environments/<env-key>/experiments/<experiment-id>/start/ --method POST
# Confirm status is "running"
```

### 8. Run the Simulator
```bash
node scripts/simulate.js
# Wait ~1 minute
node scripts/check-results.js
```

### 9. Record the Demo Video
- Use DEMO_SCRIPT.md as your script
- 2–3 minutes
- Show: problem → app → festivals → Flagsmith dashboard → results

### 10. Submit
- [ ] Upload video to YouTube/Loom/Google Drive
- [ ] Fill in the submission form at the hackathon link
- [ ] Submit **before November 29, 2026, 8:00 PM IST** ⏰

---

## ⚠️ Notes

- Never commit `.env` or print admin API keys anywhere
- Lunar-calendar festival dates (Diwali, Holi, Eid, Ganesh Chaturthi, Makar Sankranti) are marked `// verify date` in `src/festivals.js` — update annually
- The experiment only records exposures when both `festive_mode_enabled = true` AND a festival is active on the current date

---

Good luck! 🏆

