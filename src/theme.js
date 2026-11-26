/**
 * theme.js
 * Theme engine — applies or removes festival themes by updating CSS variables
 * and injecting decorations. No DOM structure changes happen here; only
 * CSS custom properties and content strings are mutated.
 */

import { renderDecorations } from "./decorations.js";

/** Normal (default) theme colors */
const NORMAL_THEME = {
  primary: "#4F46E5",
  secondary: "#7C3AED",
  accent: "#10B981",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  text: "#1E293B",
  textMuted: "#64748B",
  buttonText: "#FFFFFF",
};

const NORMAL_HERO = {
  headline: "Everything you need, delivered with joy.",
  sub: "Free delivery on orders above ₹499. Shop thousands of products.",
};

/** Applies CSS variables from a color map to :root */
function applyColors(colors) {
  const root = document.documentElement;
  root.style.setProperty("--color-primary", colors.primary);
  root.style.setProperty("--color-secondary", colors.secondary);
  root.style.setProperty("--color-accent", colors.accent ?? colors.secondary);
  root.style.setProperty("--color-background", colors.background);
  root.style.setProperty("--color-surface", colors.surface);
  root.style.setProperty("--color-text", colors.text);
  root.style.setProperty("--color-text-muted", colors.textMuted);
  root.style.setProperty("--color-button-text", colors.buttonText ?? "#FFFFFF");
}

/** Updates text content of an element safely */
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

/**
 * Applies a festival theme to the page.
 * @param {object} festival - Festival config object from festivals.js
 */
export function applyFestivalTheme(festival) {
  applyColors(festival.colors);

  // Banner
  const banner = document.getElementById("festival-banner");
  if (banner) {
    banner.textContent = festival.bannerMessage;
    banner.hidden = false;
    banner.classList.add("active");
  }

  // Hero
  setText("hero-headline", festival.heroHeadline);
  setText("hero-sub", festival.heroSub);

  // Offer badge
  const badge = document.getElementById("offer-badge");
  if (badge) {
    badge.textContent = festival.offerText;
    badge.hidden = false;
  }

  // Decorations
  renderDecorations(festival.decoration);

  // Body class (for festival-specific global styles)
  document.body.className = `festival-${festival.id}`;
  document.body.dataset.festivalId = festival.id;
}

/**
 * Resets the page to the normal (non-festive) theme.
 */
export function applyNormalTheme() {
  applyColors(NORMAL_THEME);

  const banner = document.getElementById("festival-banner");
  if (banner) {
    banner.textContent = "";
    banner.hidden = true;
    banner.classList.remove("active");
  }

  setText("hero-headline", NORMAL_HERO.headline);
  setText("hero-sub", NORMAL_HERO.sub);

  const badge = document.getElementById("offer-badge");
  if (badge) badge.hidden = true;

  renderDecorations(null);

  document.body.className = "";
  document.body.dataset.festivalId = "";
}

/**
 * Updates product cards with the festival's product badge,
 * or removes badges when festive mode is off.
 * @param {object|null} festival
 */
export function updateProductBadges(festival) {
  const badges = document.querySelectorAll(".product-badge");
  badges.forEach((badge) => {
    if (festival?.productBadge) {
      badge.textContent = festival.productBadge;
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }
  });
}
