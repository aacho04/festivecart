/**
 * main.js
 * FestiveCart — entry point.
 *
 * Boot order:
 *  1. Render product grid immediately (no flash of empty content)
 *  2. Init Flagsmith SDK (async — may take a few hundred ms)
 *  3. Apply theme based on flags
 *  4. Wire up admin panel, cart, and event tracking
 *  5. Register beforeunload handler to flush events
 */

import { PRODUCTS } from "./products.js";
import { FESTIVALS, getActiveFestival } from "./festivals.js";
import { applyFestivalTheme, applyNormalTheme, updateProductBadges } from "./theme.js";
import {
  initFlagsmith,
  getFestiveMode,
  getExperimentVariation,
  trackAddToCart,
  flushEvents,
  getUserId,
} from "./flagsmith-client.js";
import { initAdminPanel, getEffectiveDate, getEffectiveFestiveMode, updateStatusDisplay } from "./admin.js";

/* ─── Cart state ──────────────────────────────────────────────────────────── */
let cartCount = 0;

function addToCart(productId) {
  cartCount++;
  updateCartUI();
  showToast("Added to cart! 🛒");

  // Track conversion event for Flagsmith Experimentation
  trackAddToCart();
}

function updateCartUI() {
  const countEl = document.getElementById("cart-count");
  const btn = document.getElementById("cart-btn");
  if (countEl) countEl.textContent = cartCount;
  if (btn) btn.setAttribute("aria-label", `Cart (${cartCount} item${cartCount !== 1 ? "s" : ""})`);
}

/* ─── Toast notification ──────────────────────────────────────────────────── */
let toastTimer = null;
function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2500);
}

/* ─── Product grid ────────────────────────────────────────────────────────── */
function renderProducts(festival) {
  const grid = document.getElementById("product-grid");
  if (!grid) return;

  grid.innerHTML = PRODUCTS.map((p) => {
    const discount = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
    const stars = "★".repeat(Math.floor(p.rating)) + (p.rating % 1 >= 0.5 ? "½" : "");

    return `
      <article class="product-card" role="listitem" data-id="${p.id}">
        <div class="product-badge-wrap">
          <span class="product-badge" hidden>${festival?.productBadge ?? ""}</span>
          <span class="product-discount-badge">${discount}% off</span>
        </div>
        <div class="product-emoji" aria-label="${p.name}">${p.emoji}</div>
        <div class="product-info">
          <span class="product-category">${p.category}</span>
          <h3 class="product-name">${p.name}</h3>
          <div class="product-rating" aria-label="${p.rating} out of 5 stars">
            <span class="stars" aria-hidden="true">${stars}</span>
            <span class="review-count">(${p.reviews.toLocaleString("en-IN")})</span>
          </div>
          <div class="product-price-row">
            <span class="product-price">₹${p.price.toLocaleString("en-IN")}</span>
            <span class="product-original-price">₹${p.originalPrice.toLocaleString("en-IN")}</span>
          </div>
        </div>
        <button
          class="btn btn-primary btn-add-to-cart"
          data-product-id="${p.id}"
          aria-label="Add ${p.name} to cart"
        >
          Add to cart
        </button>
      </article>`;
  }).join("");

  // Wire up Add to Cart buttons
  grid.querySelectorAll(".btn-add-to-cart").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = Number(e.currentTarget.dataset.productId);
      addToCart(id);
      // Brief visual feedback
      btn.textContent = "✓ Added!";
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = "Add to cart";
        btn.disabled = false;
      }, 1200);
    });
  });

  // Set festival badges
  updateProductBadges(festival);
}

/* ─── Theme orchestrator ──────────────────────────────────────────────────── */
let _lastFestival = null;

function applyTheme() {
  const date = getEffectiveDate();
  const festiveOn = getEffectiveFestiveMode();
  const variation = getExperimentVariation(); // records exposure in Flagsmith

  const activeFestival = festiveOn ? getActiveFestival(date) : null;
  _lastFestival = activeFestival;

  if (activeFestival && variation === "festive") {
    applyFestivalTheme(activeFestival);
  } else {
    applyNormalTheme();
  }

  renderProducts(activeFestival && variation === "festive" ? activeFestival : null);
  updateStatusDisplay(activeFestival);

  // Update experiment info in footer
  const expEl = document.getElementById("footer-experiment");
  if (expEl) {
    expEl.textContent = `🧪 Experiment variation: ${variation} | User: ${getUserId().slice(0, 12)}…`;
  }
}

/* ─── Shop Now button ─────────────────────────────────────────────────────── */
function initHeroButton() {
  const btn = document.getElementById("shop-now-btn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    document.getElementById("main")?.scrollIntoView({ behavior: "smooth" });
  });
}

/* ─── Flush events before page unload ────────────────────────────────────── */
function registerUnloadFlush() {
  // 'pagehide' fires reliably on mobile and in bfcache scenarios
  window.addEventListener("pagehide", flushEvents, { once: true });
  // 'visibilitychange' catches tab switching
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushEvents();
  });
}

/* ─── BOOT ────────────────────────────────────────────────────────────────── */
async function boot() {
  // 1. Render products immediately (no flash)
  renderProducts(null);
  initHeroButton();

  // 2. Init Flagsmith (non-blocking — apply defaults while waiting)
  applyNormalTheme(); // show normal theme immediately

  const flagsmithOk = await initFlagsmith();

  // 3. Apply theme once flags are loaded
  applyTheme();

  // 4. Init admin panel (re-renders on every admin interaction)
  initAdminPanel(() => applyTheme());

  // 5. Register unload flush
  registerUnloadFlush();

  if (!flagsmithOk) {
    console.info(
      "[FestiveCart] Tip: add VITE_FLAGSMITH_ENVIRONMENT_KEY to .env to enable Flagsmith flags."
    );
  }

  // Dev helper: log user id for simulator
  console.info("[FestiveCart] User ID:", getUserId());
}

boot().catch(console.error);
