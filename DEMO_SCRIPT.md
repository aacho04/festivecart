# FestiveCart — Demo Video Script 🎬
**Duration: ~2–3 minutes**
**Track: Toggle Wars — Flagsmith Experimentation Hackathon, Track 01**

---

## SCENE 1 — The Problem (0:00–0:25)

**[Screen: Show a typical e-commerce site with a generic homepage]**

> "Every festival in India — Diwali, Christmas, Holi, Eid — online shops have to manually redesign their entire website. That means new CSS, new banners, new copy, new images — and then undo it all when the festival ends. It's slow, error-prone, and you have no idea if the festive theme is actually helping sales."

> "What if the shop could change itself automatically — and you could *prove* the festive theme works?"

---

## SCENE 2 — Introducing FestiveCart (0:25–0:50)

**[Screen: Open http://localhost:5173 — normal theme shows first]**

> "This is FestiveCart — a small online shop built with Vite and vanilla JavaScript. Right now it's showing the normal theme — clean, neutral, professional."

**[Click the ⚙️ Admin Panel button]**

> "Let me open the Admin Panel — a demo tool that lets us preview any festival without touching the code."

**[Select "Diwali 🪔" from the festival dropdown]**

> "Pick Diwali…"

**[Theme instantly switches — gold colors, navy background, animated diyas appear, rangoli border, sparkles float up]**

> "…and instantly, the entire shop transforms. Gold and deep navy — the colors of Diwali. Animated diyas with flickering flames at the bottom. A rangoli pattern border. Floating sparkles. The hero headline changes. The offer badge appears. The product cards get festival badges."

> "All from a single config file — no code changes."

---

## SCENE 3 — Touring the Festivals (0:50–1:20)

**[Quickly cycle through 3–4 festivals in the dropdown, 10–15 seconds each]**

**Christmas:**
> "Christmas — red and green, falling snowflakes, Santa in the corner, a decorated tree, twinkling stars."

**New Year:**
> "New Year — midnight black and gold, fireworks bursting, confetti raining down."

**Holi:**
> "Holi — every colour imaginable, animated colour splashes all over the page."

**Republic Day:**
> "Republic Day — tricolor stripes, a spinning Ashoka chakra in the background, the Indian flag."

> "10 festivals. 10 completely different themes. Zero manual work. And adding a new festival? Just one object in `festivals.js`. No other file changes."

---

## SCENE 4 — Flagsmith Flags (1:20–1:50)

**[Screen: Switch to Flagsmith dashboard — show festive_mode_enabled flag]**

> "The whole thing is controlled by Flagsmith. This boolean flag — `festive_mode_enabled` — is the master switch. When I turn it off…"

**[Toggle the flag OFF in Flagsmith, then show the Admin Panel → 'Use Flagsmith value']**

> "…every user immediately sees the normal theme, regardless of the festival."

> "And this multivariate flag — `festive_theme_experiment` — is the A/B test. 50% of users get the `control` variation — normal theme. The other 50% get the `festive` variation — the full festival theme."

---

## SCENE 5 — The Experiment (1:50–2:30)

**[Screen: Show Flagsmith Experimentation → Experiment details]**

> "Here's the experiment. Hypothesis: showing the festival theme on festival dates increases the share of visitors who click Add to Cart."

> "The metric is `add_to_cart_click`. Every time a user in the festive group clicks Add to Cart, that's a conversion. Every time a user in the control group clicks, that's a control conversion."

**[Run simulate.js or show the output]**

> "To generate test data, I ran a simulator — 300 users, each with their own stable ID, visiting during Christmas. The festive group had a 45% click rate; the control group had 25%."

**[Screen: Show check-results.js output or the Flagsmith results dashboard]**

> "One minute later — the results. The festive variation is winning. Win probability: [X]%. That's statistically significant evidence that the festival theme is driving more clicks."

> "In a real shop, that's the data you need to justify the investment in every future festival theme."

---

## SCENE 6 — Wrap-up (2:30–2:50)

**[Screen: Back to FestiveCart — Diwali theme]**

> "FestiveCart shows three things:"
> "One — festival themes can be fully automated from a config file."
> "Two — Flagsmith gives you a kill switch so you can turn it off instantly if something goes wrong."
> "Three — Flagsmith Experimentation gives you the data to prove it's worth it."

> "The whole project: Vite, vanilla JavaScript, plain CSS, inline SVG decorations — no external images, works fully offline. One `npm install`, one `.env` file."

> "Thanks for watching!"

---

## Recording Tips

- Record at 1080p, 60fps if possible
- Use the Admin Panel's festival selector to switch themes smoothly on camera
- Show the status line in the Admin Panel — it shows the variation and Flagsmith source
- Keep the terminal visible when running simulate.js for drama
- Trim silence between scenes

---

**Submission deadline: November 29, 2026, 8:00 PM IST**
