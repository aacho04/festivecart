/**
 * main.js — FestiveCart entry point
 *
 * Role-based routing (RBAC):
 *  - Not logged in → Login Page (#login-page)
 *  - Customer      → Shopping Storefront (#app-shell), admin hidden
 *  - Admin         → Dedicated Admin Console (#admin-dashboard), storefront hidden
 *
 * All Admin changes (products, festive theme, payment methods) persist in
 * localStorage and sync live across every open browser tab via store.js.
 */

import { CATEGORIES } from "./products.js";
import { getActiveFestival } from "./festivals.js";
import { applyFestivalTheme, applyNormalTheme, updateProductBadges } from "./theme.js";
import {
  initFlagsmith, getFestiveMode, getExperimentVariation,
  trackAddToCart, flushEvents, getUserId, sdkReady,
} from "./flagsmith-client.js";
import { getCurrentUser, isLoggedIn, isAdmin, login, loginDemoRole, logout } from "./auth.js";
import { injectCheckoutModal, openCheckout } from "./checkout.js";
import { renderAdminDashboard } from "./admin-dashboard.js";
import {
  getProducts, getThemeSettings, getPaymentSettings, subscribeStore,
} from "./store.js";

/* ─── Active category filter state ──────────────────────── */
let _activeCategory = "all";

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
  const count        = getCartCount();
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

/* ─── Cart sidebar & Checkout ─────────────────────────────── */
let _cartWired = false;
function initCart() {
  if (_cartWired) return;
  _cartWired = true;

  const cartBtn     = document.getElementById("cart-btn");
  const overlay     = document.getElementById("cart-overlay");
  const closeBtn    = document.getElementById("cart-close-btn");
  const checkoutBtn = document.getElementById("checkout-start-btn");

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

  cartBtn?.addEventListener("click", openCart);
  closeBtn?.addEventListener("click", closeCart);
  overlay?.addEventListener("click", e => { if (e.target === overlay) closeCart(); });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && overlay && !overlay.hidden) closeCart();
  });

  checkoutBtn?.addEventListener("click", () => {
    if (cart.length === 0) {
      showToast("Your cart is empty!");
      return;
    }
    closeCart();
    openCheckout(cart);
  });

  window.addEventListener("order-placed", () => {
    cart = [];
    updateCartUI();
    renderCartPanel();
    showToast("🎉 Order confirmed! Thank you for shopping with FestiveCart.");
  });

  window._openCart  = openCart;
  window._closeCart = closeCart;
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

/* ─── Category nav & cards ────────────────────────────────── */
let _catsWired = false;
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

  if (!_catsWired) {
    list.addEventListener("click", e => {
      const link = e.target.closest(".cat-nav-link");
      if (!link) return;
      e.preventDefault();
      const cat = link.dataset.cat;
      setActiveCategory(cat);
      list.querySelectorAll(".cat-nav-link").forEach(a => a.classList.remove("active"));
      link.classList.add("active");
      document.querySelectorAll(".cat-card").forEach(c => {
        c.classList.toggle("active", c.dataset.cat === cat);
      });
    });
  }
}

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

  if (!_catsWired) {
    _catsWired = true;
    grid.addEventListener("click", e => {
      const card = e.target.closest(".cat-card");
      if (!card) return;
      const cat = card.dataset.cat;
      setActiveCategory(cat);
      grid.querySelectorAll(".cat-card").forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      document.querySelectorAll(".cat-nav-link").forEach(a => {
        a.classList.toggle("active", a.dataset.cat === cat);
      });
      document.getElementById("main")?.scrollIntoView({ behavior: "smooth" });
    });

    grid.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        const card = e.target.closest(".cat-card");
        if (card) card.click();
      }
    });
  }
}

function setActiveCategory(cat) {
  _activeCategory = cat;
  applyCustomerView();

  const title = document.getElementById("products-section-title");
  if (title) {
    const found = CATEGORIES.find(c => c.id === cat);
    title.textContent = cat === "all"
      ? "Featured Products"
      : `${found?.icon ?? ""} ${found?.label ?? cat}`;
  }
}

/* ─── Deal countdown timer ────────────────────────────────── */
let _timerStarted = false;
function startDealTimer() {
  if (_timerStarted) return;
  _timerStarted = true;
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

/* ─── Product grid (reads live from store.js) ────────────── */
function renderProducts(festival) {
  const grid = document.getElementById("product-grid");
  if (!grid) return;

  const allProducts = getProducts().filter((p) => p.inStock !== false);
  const filtered = _activeCategory === "all"
    ? allProducts
    : allProducts.filter(p => p.categoryId === _activeCategory);

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
               aria-label="${p.name}, ₹${Number(p.price).toLocaleString("en-IN")}">
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
          <p class="product-desc">${p.description ?? ""}</p>
          <div class="product-rating">
            <span class="rating-pill">★ ${p.rating ?? 4.5}</span>
            <span class="review-count">${(p.reviews ?? 1).toLocaleString("en-IN")} ratings</span>
          </div>
          <div class="product-price-row">
            <span class="product-price">₹${Number(p.price).toLocaleString("en-IN")}</span>
            <span class="product-original-price">₹${Number(p.originalPrice).toLocaleString("en-IN")}</span>
            <span class="product-discount-pct">${discount}% off</span>
          </div>
          <div class="product-delivery">${p.delivery ?? "🚚 Free delivery"}</div>
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

  grid.querySelectorAll(".btn-add-to-cart").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const product = getProducts().find(p => p.id === Number(btn.dataset.productId));
      if (!product) return;
      addToCart(product);
      btn.textContent = "✓ Added!";
      btn.disabled = true;
      setTimeout(() => { btn.innerHTML = "🛒 Add to Cart"; btn.disabled = false; }, 1300);
    });
  });

  grid.querySelectorAll(".btn-buy-now").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const product = getProducts().find(p => p.id === Number(btn.dataset.productId));
      if (!product) return;
      addToCart(product);
      openCheckout(cart);
    });
  });

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

/* ─── Customer View (reads shared store + Flagsmith) ──────── */
function applyCustomerView() {
  const theme     = getThemeSettings();
  const payments  = getPaymentSettings();
  const date      = theme.simulatedDate ? new Date(theme.simulatedDate + "T00:00:00") : new Date();
  const festiveOn = theme.festiveOverride !== null ? theme.festiveOverride : getFestiveMode();
  const variation = theme.variationOverride ?? (sdkReady ? getExperimentVariation() : (theme.simulatedDate ? "festive" : "control"));

  const activeFestival = festiveOn ? getActiveFestival(date) : null;
  const showFestive    = !!(activeFestival && variation === "festive");

  showFestive ? applyFestivalTheme(activeFestival) : applyNormalTheme();

  // Update delivery threshold in topbar
  const topbarLeft = document.querySelector(".topbar-left");
  if (topbarLeft) {
    topbarLeft.innerHTML = `🇮🇳 India's favourite festive shop &nbsp;|&nbsp; Free delivery on orders above <strong>₹${payments.freeDeliveryThreshold}</strong>`;
  }

  const heroVisual = document.getElementById("hero-visual");
  if (heroVisual) heroVisual.textContent = showFestive ? (HERO_VISUALS[activeFestival.id] ?? "🎉") : "🛒";

  const heroTag = document.getElementById("hero-tag");
  if (heroTag) heroTag.textContent = showFestive ? `🎉 ${activeFestival.name} Sale` : "🔥 Deals of the Day";

  renderProducts(showFestive ? activeFestival : null);

  const expEl = document.getElementById("footer-experiment");
  if (expEl) expEl.textContent = `🧪 Experiment variation: ${variation} · User: ${getUserId().slice(0, 14)}…`;
}

/* ─── Auth / Role UI routing ──────────────────────────────── */
function updateHeaderUser() {
  const user = getCurrentUser();
  if (!user) return;
  const avatarEl = document.getElementById("hdr-user-avatar");
  const nameEl   = document.getElementById("hdr-user-name");
  const roleEl   = document.getElementById("hdr-user-role");
  if (avatarEl) avatarEl.textContent = user.avatar;
  if (nameEl)   nameEl.textContent   = user.name;
  if (roleEl) {
    roleEl.textContent = user.role.toUpperCase();
    roleEl.className   = `hdr-user-role role-${user.role}`;
  }
}

function showAppForCurrentUser() {
  const loginPage      = document.getElementById("login-page");
  const appShell       = document.getElementById("app-shell");
  const adminDashboard = document.getElementById("admin-dashboard");
  const legacyWrapper  = document.getElementById("admin-panel-wrapper");

  // Always hide the legacy floating panel
  if (legacyWrapper) legacyWrapper.style.display = "none";

  if (!isLoggedIn()) {
    if (loginPage)      loginPage.hidden      = false;
    if (appShell)       appShell.hidden       = true;
    if (adminDashboard) adminDashboard.hidden = true;
    applyNormalTheme();
    return;
  }

  if (loginPage) loginPage.hidden = true;

  if (isAdmin()) {
    // Admin sees ONLY the Admin Dashboard (not the customer shop)
    if (appShell)       appShell.hidden       = true;
    if (adminDashboard) adminDashboard.hidden = false;
    applyNormalTheme();
    renderAdminDashboard();
  } else {
    // Customer sees ONLY the shopping storefront
    if (adminDashboard) adminDashboard.hidden = true;
    if (appShell)       appShell.hidden       = false;
    updateHeaderUser();
    applyCustomerView();
  }
}

function initLoginPage() {
  const form    = document.getElementById("login-form");
  const emailEl = document.getElementById("login-email");
  const passEl  = document.getElementById("login-password");
  const errEl   = document.getElementById("login-error");

  async function doLogin(email, password) {
    const res = await login(email, password);
    if (!res.success) {
      if (errEl) { errEl.textContent = res.error; errEl.hidden = false; }
      return;
    }
    if (errEl) errEl.hidden = true;
    showAppForCurrentUser();
    showToast(`Welcome, ${res.user.name} (${res.user.role})!`);
  }

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    doLogin(emailEl?.value ?? "", passEl?.value ?? "");
  });

  document.getElementById("demo-customer-btn")?.addEventListener("click", () => {
    const res = loginDemoRole("customer");
    if (res.success) {
      if (errEl) errEl.hidden = true;
      showAppForCurrentUser();
      showToast(`Welcome, ${res.user.name} (${res.user.role})!`);
    }
  });

  document.getElementById("demo-admin-btn")?.addEventListener("click", () => {
    const res = loginDemoRole("admin");
    if (res.success) {
      if (errEl) errEl.hidden = true;
      showAppForCurrentUser();
      showToast(`Welcome, ${res.user.name} (${res.user.role})!`);
    }
  });

  function handleLogout() {
    logout();
    cart = [];
    updateCartUI();
    showAppForCurrentUser();
  }

  document.getElementById("hdr-logout-btn")?.addEventListener("click", handleLogout);
  window.addEventListener("fc-logout", handleLogout);
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
  renderCategoryNav();
  renderCategoryCards();
  startDealTimer();
  initCart();
  injectCheckoutModal();
  initHeroBtn();
  initLoginPage();

  // Sync changes across all open tabs (Admin -> Customer, Customer Orders -> Admin)
  subscribeStore(() => {
    if (!isLoggedIn()) return;
    if (isAdmin()) renderAdminDashboard();
    else applyCustomerView();
  });

  showAppForCurrentUser();

  await initFlagsmith();
  if (isLoggedIn()) {
    if (isAdmin()) renderAdminDashboard();
    else applyCustomerView();
  }

  registerFlush();
}

boot().catch(console.error);
