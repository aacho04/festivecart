/**
 * main.js — FestiveCart entry point
 *
 * Fixes in this version:
 *  1. Category filtering — clicking a category card/nav shows only those products
 *  2. Admin panel close button — delegated listener in admin.js always fires
 *  3. RBAC — gear button hidden; admin login modal via Ctrl+Shift+Alt+A or ?admin=1
 */

import { PRODUCTS, CATEGORIES } from "./products.js";
import { FESTIVALS, getActiveFestival } from "./festivals.js";
import { applyFestivalTheme, applyNormalTheme, updateProductBadges } from "./theme.js";
import {
  initFlagsmith, getFestiveMode, getExperimentVariation,
  trackAddToCart, flushEvents, getUserId,
} from "./flagsmith-client.js";
import {
  initAdminPanel, getEffectiveDate, getEffectiveFestiveMode,
  updateStatusDisplay, openAdminPanel,
} from "./admin.js";
import { initRbac } from "./rbac.js";

/* ─── Active category filter state ──────────────────────── */
let _activeCategory = "all";   // matches CATEGORIES[n].id

/* ─── Cart state ──────────────────────────────────────────── */
let cart = [];

function getCartCount() { return cart.reduce((s, i) => s + i.qty, 0); }
function getCartTotal() { return cart.reduce((s, i) => s + i.product.price * i.qty, 0); }

function addToCart(product) {
  const existing = cart.find(i => i.product.id === product.id);
  if (existing) existing.qty++;
  else cart.push({ product, qty: 1 });
  updateCartUI();
  renderCartPanel();
  showToast(`✓ ${product.name} added to cart`);
  trackAddToCart();
}

function removeFromCart(productId) {
  cart = cart.filter(i => i.product.id !== productId);
  updateCartUI();
  renderCartPanel();
}

function updateCartUI() {
  const count = getCartCount();
  const countEl      = document.getElementById("cart-count");
  const panelCountEl = document.getElementById("cart-panel-count");
  if (countEl)      countEl.textContent = count;
  if (panelCountEl) panelCountEl.textContent = `(${count} item${count !== 1 ? "s" : ""})`;
  const btn = document.getElementById("cart-btn");
  if (btn) btn.setAttribute("aria-label", `Cart (${count} items)`);
}

function renderCartPanel() {
  const itemsEl    = document.getElementById("cart-items");
  const footerEl   = document.getElementById("cart-footer");
  const subtotalEl = document.getElementById("cart-subtotal");
  const grandEl    = document.getElementById("cart-grand");
  if (!itemsEl) return;

  if (cart.length === 0) {
    itemsEl.innerHTML = `
      <div class="cart-empty">
        <span class="cart-empty-icon">🛒</span>
        <p>Your cart is empty</p>
        <p class="cart-empty-sub">Add items to get started</p>
      </div>`;
    if (footerEl) footerEl.hidden = true;
    return;
  }

  itemsEl.innerHTML = cart.map(({ product, qty }) => `
    <div class="cart-item">
      <img class="cart-item-img" src="${product.image}" alt="${product.name}"
           onerror="this.style.background='#f5f5f5';this.src=''" />
      <div class="cart-item-info">
        <div class="cart-item-name">${product.name}</div>
        <div class="cart-item-price">
          ₹${(product.price * qty).toLocaleString("en-IN")}
          <span style="font-size:.75rem;color:#888;font-weight:400"> × ${qty}</span>
        </div>
        <button class="cart-item-remove" data-id="${product.id}">Remove</button>
      </div>
    </div>`).join("");

  itemsEl.querySelectorAll(".cart-item-remove").forEach(btn => {
    btn.addEventListener("click", () => removeFromCart(Number(btn.dataset.id)));
  });

  const total = getCartTotal();
  if (subtotalEl) subtotalEl.textContent = `₹${total.toLocaleString("en-IN")}`;
  if (grandEl)    grandEl.textContent    = `₹${total.toLocaleString("en-IN")}`;
  if (footerEl)   footerEl.hidden = false;
}

/* ─── Cart sidebar open/close ─────────────────────────────── */
function initCart() {
  const cartBtn  = document.getElementById("cart-btn");
  const overlay  = document.getElementById("cart-overlay");
  const closeBtn = document.getElementById("cart-close-btn");

  cartBtn?.addEventListener("click", () => openCart());
  closeBtn?.addEventListener("click", closeCart);

  // Click backdrop to close
  overlay?.addEventListener("click", e => { if (e.target === overlay) closeCart(); });

  // Escape key to close
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && overlay && !overlay.hidden) closeCart();
  });

  function openCart() {
    if (!overlay) return;
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    renderCartPanel();
  }

  function closeCart() {
    if (!overlay) return;
    overlay.hidden = true;
    document.body.style.overflow = "";
  }

  // Expose closeCart globally for Buy Now
  window._closeCart = closeCart;
  window._openCart  = openCart;
}

/* ─── Toast ───────────────────────────────────────────────── */
let _toastTimer;
function showToast(msg) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("visible");
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove("visible"), 2500);
}

/* ─── Category nav (top horizontal bar) ──────────────────── */
function renderCategoryNav() {
  const list = document.getElementById("cat-nav-list");
  if (!list) return;

  list.innerHTML = CATEGORIES.map((c, i) => `
    <li>
      <a href="#"
         class="cat-nav-link ${i === 0 ? "active" : ""}"
         data-cat="${c.id}"
         aria-label="Filter by ${c.label}">
        <span class="cat-nav-icon">${c.icon}</span>
        <span>${c.label}</span>
      </a>
    </li>`).join("");

  // Filter on click
  list.addEventListener("click", e => {
    const link = e.target.closest(".cat-nav-link");
    if (!link) return;
    e.preventDefault();
    const cat = link.dataset.cat;
    setActiveCategory(cat);

    // Update active styling
    list.querySelectorAll(".cat-nav-link").forEach(a => a.classList.remove("active"));
    link.classList.add("active");
  });
}

/* ─── Category cards (the icon grid below hero) ──────────── */
function renderCategoryCards() {
  const grid = document.getElementById("cat-cards-grid");
  if (!grid) return;

  grid.innerHTML = CATEGORIES.map((c, i) => `
    <div class="cat-card ${i === 0 ? "active" : ""}"
         role="button" tabindex="0"
         aria-label="Show ${c.label}"
         data-cat="${c.id}">
      <div class="cat-card-icon">${c.icon}</div>
      <div class="cat-card-label">${c.label}</div>
    </div>`).join("");

  // Filter on click
  grid.addEventListener("click", e => {
    const card = e.target.closest(".cat-card");
    if (!card) return;
    const cat = card.dataset.cat;
    setActiveCategory(cat);

    // Sync card highlight
    grid.querySelectorAll(".cat-card").forEach(c => c.classList.remove("active"));
    card.classList.add("active");

    // Sync nav bar too
    document.querySelectorAll(".cat-nav-link").forEach(a => {
      a.classList.toggle("active", a.dataset.cat === cat);
    });

    // Smooth scroll to products
    document.getElementById("main")?.scrollIntoView({ behavior: "smooth" });
  });

  // Keyboard support
  grid.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") {
      const card = e.target.closest(".cat-card");
      if (card) card.click();
    }
  });
}

/** Sets the active category and re-renders the product grid */
function setActiveCategory(cat) {
  _activeCategory = cat;
  applyTheme();      // re-renders products with the new filter

  // Update section title
  const title = document.getElementById("products-section-title");
  if (title) {
    const found = CATEGORIES.find(c => c.id === cat);
    title.textContent = cat === "all"
      ? "Featured Products"
      : `${found?.icon ?? ""} ${found?.label ?? cat}`;
  }
}

/* ─── Deal countdown timer ────────────────────────────────── */
function startDealTimer() {
  const hEl = document.getElementById("timer-h");
  const mEl = document.getElementById("timer-m");
  const sEl = document.getElementById("timer-s");
  if (!hEl || !mEl || !sEl) return;

  function tick() {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 0);
    let diff = Math.max(0, Math.floor((end - now) / 1000));
    const h = Math.floor(diff / 3600); diff %= 3600;
    const m = Math.floor(diff / 60);
    const s = diff % 60;
    hEl.textContent = String(h).padStart(2, "0");
    mEl.textContent = String(m).padStart(2, "0");
    sEl.textContent = String(s).padStart(2, "0");
  }
  tick();
  setInterval(tick, 1000);
}

/* ─── Product grid ────────────────────────────────────────── */
function renderProducts(festival) {
  const grid = document.getElementById("product-grid");
  if (!grid) return;

  // Filter by active category
  const filtered = _activeCategory === "all"
    ? PRODUCTS
    : PRODUCTS.filter(p => p.categoryId === _activeCategory);

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="no-products">
        <div class="no-products-icon">🔍</div>
        <h3>No products in this category yet</h3>
        <p>Check back soon or browse all products.</p>
        <button class="btn btn-primary" onclick="document.querySelector('[data-cat=all]')?.click()">
          View All Products
        </button>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const discount = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
    const festBadge = festival?.productBadge
      ? `<span class="badge badge-festival">${festival.productBadge}</span>`
      : "";
    return `
      <article class="product-card" role="listitem" data-id="${p.id}" tabindex="0"
               aria-label="${p.name}, ₹${p.price.toLocaleString("en-IN")}">
        <div class="product-img-wrap">
          <img
            class="product-img"
            src="${p.image}"
            alt="${p.name}"
            loading="lazy"
            onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\\'product-img-fallback\\'>📦</div>'"
          />
          <div class="product-badges">
            <span class="badge badge-discount">${discount}% off</span>
            ${p.badge ? `<span class="badge badge-seller">${p.badge}</span>` : ""}
            ${festBadge}
          </div>
          <button class="wishlist-btn" aria-label="Wishlist ${p.name}" data-id="${p.id}">🤍</button>
        </div>

        <div class="product-info">
          <span class="product-category">${p.category}</span>
          <h3 class="product-name">${p.name}</h3>
          <p class="product-desc">${p.description}</p>
          <div class="product-rating">
            <span class="rating-pill">★ ${p.rating}</span>
            <span class="review-count">${p.reviews.toLocaleString("en-IN")} ratings</span>
          </div>
          <div class="product-price-row">
            <span class="product-price">₹${p.price.toLocaleString("en-IN")}</span>
            <span class="product-original-price">₹${p.originalPrice.toLocaleString("en-IN")}</span>
            <span class="product-discount-pct">${discount}% off</span>
          </div>
          <div class="product-delivery">${p.delivery}</div>
        </div>

        <div class="product-card-actions">
          <button class="btn-add-to-cart" data-product-id="${p.id}"
                  aria-label="Add ${p.name} to cart">
            🛒 Add to Cart
          </button>
          <button class="btn-buy-now" data-product-id="${p.id}"
                  aria-label="Buy ${p.name} now">
            ⚡ Buy Now
          </button>
        </div>
      </article>`;
  }).join("");

  // ── Wire Add to Cart ──────────────────────────────────────
  grid.querySelectorAll(".btn-add-to-cart").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const product = PRODUCTS.find(p => p.id === Number(btn.dataset.productId));
      if (!product) return;
      addToCart(product);
      btn.textContent = "✓ Added!";
      btn.disabled = true;
      setTimeout(() => { btn.innerHTML = "🛒 Add to Cart"; btn.disabled = false; }, 1300);
    });
  });

  // ── Wire Buy Now ──────────────────────────────────────────
  grid.querySelectorAll(".btn-buy-now").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const product = PRODUCTS.find(p => p.id === Number(btn.dataset.productId));
      if (!product) return;
      addToCart(product);
      window._openCart?.();
    });
  });

  // ── Wire Wishlist ─────────────────────────────────────────
  grid.querySelectorAll(".wishlist-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      btn.classList.toggle("active");
      btn.textContent = btn.classList.contains("active") ? "❤️" : "🤍";
      showToast(btn.classList.contains("active") ? "Added to Wishlist ❤️" : "Removed from Wishlist");
    });
  });

  updateProductBadges(festival);
}

/* ─── Hero visual per festival ────────────────────────────── */
const HERO_VISUALS = {
  halloween:"🎃", diwali:"🪔", christmas:"🎄", "new-year":"🎆",
  "makar-sankranti":"🪁", "republic-day":"🇮🇳", valentines:"💕",
  eid:"🌙", holi:"🎨", "ganesh-chaturthi":"🐘",
};

/* ─── Theme orchestrator ──────────────────────────────────── */
function applyTheme() {
  const date      = getEffectiveDate();
  const festiveOn = getEffectiveFestiveMode();
  const variation = getExperimentVariation();

  const activeFestival = festiveOn ? getActiveFestival(date) : null;
  const showFestive    = !!(activeFestival && variation === "festive");

  showFestive ? applyFestivalTheme(activeFestival) : applyNormalTheme();

  const heroVisual = document.getElementById("hero-visual");
  if (heroVisual) heroVisual.textContent = showFestive ? (HERO_VISUALS[activeFestival.id] ?? "🎉") : "🛒";

  const heroTag = document.getElementById("hero-tag");
  if (heroTag) heroTag.textContent = showFestive ? `🎉 ${activeFestival.name} Sale` : "🔥 Deals of the Day";

  renderProducts(showFestive ? activeFestival : null);
  updateStatusDisplay(activeFestival);

  const expEl = document.getElementById("footer-experiment");
  if (expEl) expEl.textContent = `🧪 Experiment variation: ${variation} · User: ${getUserId().slice(0, 14)}…`;
}

/* ─── Shop Now button ─────────────────────────────────────── */
function initHeroBtn() {
  document.getElementById("shop-now-btn")
    ?.addEventListener("click", () =>
      document.getElementById("main")?.scrollIntoView({ behavior: "smooth" }));
}

/* ─── Flush on unload ─────────────────────────────────────── */
function registerFlush() {
  window.addEventListener("pagehide", flushEvents, { once: true });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushEvents();
  });
}

/* ─── BOOT ────────────────────────────────────────────────── */
async function boot() {
  // 1. Render UI immediately (no blank flash)
  renderCategoryNav();
  renderCategoryCards();
  startDealTimer();
  applyNormalTheme();
  renderProducts(null);
  initCart();
  initHeroBtn();

  // 2. Init RBAC — sets up admin login modal & gear button visibility
  initRbac(() => {
    // Called after successful admin login
    initAdminPanel(() => applyTheme());
    openAdminPanel();
  });

  // 3. Load Flagsmith (non-blocking)
  await initFlagsmith();

  // 4. Apply theme with real flag values
  applyTheme();

  // 5. Init admin panel IF already authenticated from this session
  initAdminPanel(() => applyTheme());

  registerFlush();

  console.info("[FestiveCart] Ready. User:", getUserId());
  console.info("[FestiveCart] Admin access: Ctrl+Shift+Alt+A or ?admin=1");
}

boot().catch(console.error);
