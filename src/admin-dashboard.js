/**
 * admin-dashboard.js — Dedicated Admin Portal
 *
 * Admins do NOT see the customer shopping page.
 * Instead they get a full management console:
 *   - Live store overview (products, orders, active festival, Flagsmith status)
 *   - Products CRUD (add product, toggle in-stock, delete, reset defaults)
 *   - Festive Theme & Flagsmith Controls (broadcasts to all open customer tabs)
 *   - Payment Methods & Delivery Settings (UPI/Card/Netbanking/COD toggles)
 *   - Customer Orders management
 */

import { FESTIVALS, getActiveFestival } from "./festivals.js";
import { CATEGORIES } from "./products.js";
import { getFestiveMode, getExperimentVariation, sdkReady } from "./flagsmith-client.js";
import { getCurrentUser } from "./auth.js";
import {
  getProducts, addProduct, toggleProductStock, deleteProduct, resetProducts,
  getThemeSettings, setThemeSettings,
  getPaymentSettings, setPaymentSettings,
  getOrders, updateOrderStatus,
} from "./store.js";

let _activeTab = "products";
let _wired = false;

export function renderAdminDashboard() {
  const root = document.getElementById("admin-dashboard");
  if (!root) return;

  const user     = getCurrentUser();
  const products = getProducts();
  const theme    = getThemeSettings();
  const payments = getPaymentSettings();
  const orders   = getOrders();

  const effectiveDate  = theme.simulatedDate ? new Date(theme.simulatedDate + "T00:00:00") : new Date();
  const festiveOn      = theme.festiveOverride !== null ? theme.festiveOverride : getFestiveMode();
  const activeFestival = festiveOn ? getActiveFestival(effectiveDate) : null;
  const revenue        = orders.reduce((s, o) => s + (o.total || 0), 0);

  root.innerHTML = `
    <header class="adm-topbar">
      <div class="adm-brand">
        <span class="adm-brand-icon">🛠️</span>
        <div>
          <strong>FestiveCart Admin Console</strong>
          <small>Changes sync live to all open customer tabs</small>
        </div>
      </div>
      <div class="adm-user-bar">
        <span class="adm-user-pill">👤 ${user?.name ?? "Admin"} (ADMIN)</span>
        <button class="adm-logout-btn" id="adm-logout-btn">Logout</button>
      </div>
    </header>

    <div class="adm-layout">
      <!-- Sidebar -->
      <aside class="adm-sidebar">
        <button class="adm-nav-btn ${_activeTab === "products" ? "active" : ""}" data-tab="products">📦 Products (${products.length})</button>
        <button class="adm-nav-btn ${_activeTab === "theme" ? "active" : ""}" data-tab="theme">🎉 Festive &amp; Flags</button>
        <button class="adm-nav-btn ${_activeTab === "payments" ? "active" : ""}" data-tab="payments">💳 Payments &amp; Store</button>
        <button class="adm-nav-btn ${_activeTab === "orders" ? "active" : ""}" data-tab="orders">🧾 Orders (${orders.length})</button>
      </aside>

      <!-- Main content -->
      <main class="adm-main">
        <!-- KPI Strip -->
        <section class="adm-kpis">
          <div class="adm-kpi"><span>Total Products</span><strong>${products.length}</strong></div>
          <div class="adm-kpi"><span>Active Festival</span><strong>${activeFestival?.name ?? "Normal Theme"}</strong></div>
          <div class="adm-kpi"><span>Festive Mode</span><strong>${festiveOn ? "ON" : "OFF"} ${theme.festiveOverride !== null ? "(Override)" : "(Flagsmith)"}</strong></div>
          <div class="adm-kpi"><span>Orders / Revenue</span><strong>${orders.length} · ₹${revenue.toLocaleString("en-IN")}</strong></div>
        </section>

        ${_activeTab === "products" ? renderProductsTab(products) : ""}
        ${_activeTab === "theme"    ? renderThemeTab(theme, activeFestival) : ""}
        ${_activeTab === "payments" ? renderPaymentsTab(payments) : ""}
        ${_activeTab === "orders"   ? renderOrdersTab(orders) : ""}
      </main>
    </div>
  `;

  wireAdminEvents(root);
}

function renderProductsTab(products) {
  const catOptions = CATEGORIES.filter((c) => c.id !== "all")
    .map((c) => `<option value="${c.id}" data-label="${c.label}">${c.icon} ${c.label}</option>`)
    .join("");

  return `
    <div class="adm-grid-2">
      <!-- Add Product Form -->
      <section class="adm-card">
        <h3>➕ Add New Product</h3>
        <form id="adm-add-product-form" class="adm-form">
          <label>Product Name *
            <input id="adm-p-name" type="text" placeholder="e.g. Boat Rockerz 450" required />
          </label>
          <div class="adm-form-row">
            <label>Category *
              <select id="adm-p-cat">${catOptions}</select>
            </label>
            <label>Badge
              <input id="adm-p-badge" type="text" placeholder="e.g. Hot Deal" />
            </label>
          </div>
          <div class="adm-form-row">
            <label>Selling Price (₹) *
              <input id="adm-p-price" type="number" min="1" placeholder="1499" required />
            </label>
            <label>Original MRP (₹) *
              <input id="adm-p-mrp" type="number" min="1" placeholder="2999" required />
            </label>
          </div>
          <label>Image URL (optional — defaults to curated photo)
            <input id="adm-p-img" type="url" placeholder="https://images.unsplash.com/..." />
          </label>
          <label>Short Description
            <input id="adm-p-desc" type="text" placeholder="Wireless Bluetooth headphones with 15hr playback" />
          </label>
          <button type="submit" class="adm-btn-primary">Add Product to Store →</button>
        </form>
      </section>

      <!-- Product Catalogue Table -->
      <section class="adm-card">
        <div class="adm-card-head">
          <h3>📦 Store Catalogue (${products.length})</h3>
          <button class="adm-btn-ghost" id="adm-reset-products">↺ Reset Defaults</button>
        </div>
        <div class="adm-table-wrap">
          <table class="adm-table">
            <thead>
              <tr><th>Product</th><th>Category</th><th>Price</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              ${products.map((p) => `
                <tr>
                  <td class="adm-prod-cell">
                    <img src="${p.image}" alt="${p.name}" onerror="this.style.display='none'" />
                    <span>${p.name}</span>
                  </td>
                  <td>${p.category}</td>
                  <td>₹${Number(p.price).toLocaleString("en-IN")}</td>
                  <td>
                    <span class="adm-status-pill ${p.inStock === false ? "off" : "on"}">
                      ${p.inStock === false ? "Out of Stock" : "In Stock"}
                    </span>
                  </td>
                  <td class="adm-actions-cell">
                    <button class="adm-btn-xs" data-toggle-stock="${p.id}">
                      ${p.inStock === false ? "Enable" : "Disable"}
                    </button>
                    <button class="adm-btn-xs danger" data-delete-prod="${p.id}">Delete</button>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `;
}

function renderThemeTab(theme, activeFestival) {
  const festiveOn = theme.festiveOverride !== null ? theme.festiveOverride : getFestiveMode();
  const variation = getExperimentVariation();

  return `
    <section class="adm-card">
      <h3>🎉 Festive Theme &amp; Flagsmith Controls</h3>
      <p class="adm-muted">Changes here immediately update all open Customer store tabs.</p>

      <div class="adm-controls-grid">
        <div class="adm-control-item">
          <div>
            <strong>Festive Mode Master Switch</strong>
            <small>${theme.festiveOverride !== null ? "Local Admin Override active" : "Using Flagsmith value"}</small>
          </div>
          <div class="adm-inline-btns">
            <button id="adm-toggle-festive" class="toggle-switch ${festiveOn ? "on" : ""}" role="switch" aria-checked="${festiveOn}">
              <span class="toggle-thumb"></span>
            </button>
            ${theme.festiveOverride !== null ? `<button class="adm-btn-ghost" id="adm-use-flagsmith">↩ Use Flagsmith value</button>` : ""}
          </div>
        </div>

        <div class="adm-control-item">
          <div>
            <strong>Simulate Festival</strong>
            <small>Jump to any festival's start date</small>
          </div>
          <select id="adm-festival-select" class="adm-select">
            <option value="">— Real date (today) —</option>
            ${FESTIVALS.map((f) => {
              const selected = theme.simulatedDate && theme.simulatedDate >= f.startDate && theme.simulatedDate <= f.endDate;
              return `<option value="${f.id}" ${selected ? "selected" : ""}>${f.name} (${f.startDate})</option>`;
            }).join("")}
          </select>
        </div>

        <div class="adm-control-item">
          <div>
            <strong>Simulate Custom Date</strong>
            <small>Current: ${theme.simulatedDate ?? "Today"}</small>
          </div>
          <div class="adm-inline-btns">
            <input type="date" id="adm-date-picker" class="adm-input" value="${theme.simulatedDate ?? ""}" />
            <button class="adm-btn-ghost" id="adm-reset-date">Reset to Today</button>
          </div>
        </div>

        <div class="adm-control-item">
          <div>
            <strong>Experiment Variation Preview</strong>
            <small>Flagsmith SDK: ${sdkReady ? `connected (${variation})` : "not connected (no env key)"}</small>
          </div>
          <select id="adm-variation-select" class="adm-select">
            <option value="" ${!theme.variationOverride ? "selected" : ""}>Auto (Flagsmith / Festive on preview)</option>
            <option value="festive" ${theme.variationOverride === "festive" ? "selected" : ""}>Force "festive" theme</option>
            <option value="control" ${theme.variationOverride === "control" ? "selected" : ""}>Force "control" (normal theme)</option>
          </select>
        </div>
      </div>

      <div class="adm-theme-preview">
        <strong>Active Customer View:</strong>
        <span>${activeFestival ? `${activeFestival.name} — "${activeFestival.bannerMessage}"` : "Normal Store Theme (no active festival)"}</span>
      </div>
    </section>
  `;
}

function renderPaymentsTab(payments) {
  const methods = [
    { key: "upi",        label: "📱 UPI (Google Pay, PhonePe, Paytm)" },
    { key: "card",       label: "💳 Credit / Debit Card" },
    { key: "netbanking", label: "🏦 Net Banking" },
    { key: "cod",        label: "💵 Cash on Delivery (COD)" },
  ];

  return `
    <section class="adm-card">
      <h3>💳 Payment Methods &amp; Delivery Settings</h3>
      <p class="adm-muted">Disable or enable checkout payment methods globally for all customers.</p>

      <div class="adm-controls-grid">
        ${methods.map((m) => `
          <div class="adm-control-item">
            <strong>${m.label}</strong>
            <button class="toggle-switch ${payments[m.key] ? "on" : ""}" data-pay-toggle="${m.key}" role="switch" aria-checked="${payments[m.key]}">
              <span class="toggle-thumb"></span>
            </button>
          </div>
        `).join("")}

        <div class="adm-control-item">
          <div>
            <strong>Free Delivery Threshold (₹)</strong>
            <small>Shown in top bar across customer store</small>
          </div>
          <div class="adm-inline-btns">
            <input type="number" id="adm-delivery-threshold" class="adm-input" min="0" value="${payments.freeDeliveryThreshold}" style="width:110px" />
            <button class="adm-btn-primary" id="adm-save-delivery">Save</button>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderOrdersTab(orders) {
  if (orders.length === 0) {
    return `
      <section class="adm-card">
        <h3>🧾 Customer Orders</h3>
        <p class="adm-muted" style="padding:2rem 0;text-align:center;">
          No orders placed yet. Orders placed by customers in Checkout appear here in real time.
        </p>
      </section>
    `;
  }

  return `
    <section class="adm-card">
      <h3>🧾 Customer Orders (${orders.length})</h3>
      <div class="adm-table-wrap">
        <table class="adm-table">
          <thead>
            <tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Payment</th><th>Total</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${orders.map((o) => `
              <tr>
                <td><strong>#${o.orderId}</strong></td>
                <td>${o.customerName}<br><small>${o.city ?? ""}</small></td>
                <td>${o.itemCount} item(s)</td>
                <td>${o.paymentMethod}</td>
                <td><strong>₹${Number(o.total).toLocaleString("en-IN")}</strong></td>
                <td>
                  <select class="adm-select" data-order-status="${o.orderId}">
                    ${["Processing", "Shipped", "Delivered", "Cancelled"].map((s) =>
                      `<option value="${s}" ${o.status === s ? "selected" : ""}>${s}</option>`
                    ).join("")}
                  </select>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function wireAdminEvents(root) {
  if (_wired) return;
  _wired = true;

  root.addEventListener("click", (e) => {
    const tabBtn = e.target.closest("[data-tab]");
    if (tabBtn) {
      _activeTab = tabBtn.dataset.tab;
      renderAdminDashboard();
      return;
    }

    if (e.target.closest("#adm-logout-btn")) {
      window.dispatchEvent(new CustomEvent("fc-logout"));
      return;
    }

    const stockBtn = e.target.closest("[data-toggle-stock]");
    if (stockBtn) {
      toggleProductStock(Number(stockBtn.dataset.toggleStock));
      return;
    }

    const delBtn = e.target.closest("[data-delete-prod]");
    if (delBtn) {
      deleteProduct(Number(delBtn.dataset.deleteProd));
      return;
    }

    if (e.target.closest("#adm-reset-products")) {
      resetProducts();
      return;
    }

    if (e.target.closest("#adm-toggle-festive")) {
      const theme = getThemeSettings();
      const current = theme.festiveOverride !== null ? theme.festiveOverride : getFestiveMode();
      setThemeSettings({ festiveOverride: !current });
      return;
    }

    if (e.target.closest("#adm-use-flagsmith")) {
      setThemeSettings({ festiveOverride: null });
      return;
    }

    if (e.target.closest("#adm-reset-date")) {
      setThemeSettings({ simulatedDate: null });
      return;
    }

    const payToggle = e.target.closest("[data-pay-toggle]");
    if (payToggle) {
      const key = payToggle.dataset.payToggle;
      const current = getPaymentSettings();
      setPaymentSettings({ [key]: !current[key] });
      return;
    }

    if (e.target.closest("#adm-save-delivery")) {
      const val = Number(document.getElementById("adm-delivery-threshold")?.value ?? 499);
      setPaymentSettings({ freeDeliveryThreshold: Math.max(0, val) });
      return;
    }
  });

  root.addEventListener("change", (e) => {
    if (e.target.id === "adm-festival-select") {
      const id = e.target.value;
      const fest = FESTIVALS.find((f) => f.id === id);
      setThemeSettings({ simulatedDate: fest ? fest.startDate : null });
    } else if (e.target.id === "adm-date-picker") {
      setThemeSettings({ simulatedDate: e.target.value || null });
    } else if (e.target.id === "adm-variation-select") {
      setThemeSettings({ variationOverride: e.target.value || null });
    } else if (e.target.dataset.orderStatus) {
      updateOrderStatus(e.target.dataset.orderStatus, e.target.value);
    }
  });

  root.addEventListener("submit", (e) => {
    if (e.target.id !== "adm-add-product-form") return;
    e.preventDefault();

    const name  = document.getElementById("adm-p-name")?.value.trim();
    const catEl = document.getElementById("adm-p-cat");
    const catId = catEl?.value ?? "electronics";
    const catLabel = catEl?.options[catEl.selectedIndex]?.dataset.label ?? "Electronics";
    const badge = document.getElementById("adm-p-badge")?.value.trim() || "New Arrival";
    const price = Number(document.getElementById("adm-p-price")?.value);
    const mrp   = Number(document.getElementById("adm-p-mrp")?.value);
    const img   = document.getElementById("adm-p-img")?.value.trim()
      || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=85";
    const desc  = document.getElementById("adm-p-desc")?.value.trim() || "Premium quality product";

    if (!name || !price || !mrp) return;

    addProduct({
      name,
      category: catLabel,
      categoryId: catId,
      badge,
      price,
      originalPrice: Math.max(price, mrp),
      image: img,
      description: desc,
    });
  });
}

