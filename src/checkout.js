/**
 * checkout.js — 3-step checkout modal
 *
 * Step 1: Delivery Address
 * Step 2: Payment Method
 * Step 3: Order Confirmation
 */

import { getCurrentUser } from "./auth.js";
import { getPaymentSettings, addOrder } from "./store.js";

/** Inject the checkout modal HTML into the DOM */
export function injectCheckoutModal() {
  const el = document.createElement("div");
  el.innerHTML = `
    <!-- Checkout Modal -->
    <div class="checkout-overlay" id="checkout-overlay" hidden role="dialog" aria-modal="true" aria-label="Checkout">
      <div class="checkout-panel">

        <!-- Header -->
        <div class="checkout-header">
          <div class="checkout-logo">🛒 FestiveCart <span class="checkout-secure">🔒 Secure Checkout</span></div>
          <button class="checkout-close-btn" id="checkout-close-btn" aria-label="Close checkout">✕</button>
        </div>

        <!-- Progress bar -->
        <div class="checkout-progress">
          <div class="checkout-step" data-step="1">
            <div class="step-dot active" id="dot-1">1</div>
            <span>Address</span>
          </div>
          <div class="checkout-step-line"></div>
          <div class="checkout-step" data-step="2">
            <div class="step-dot" id="dot-2">2</div>
            <span>Payment</span>
          </div>
          <div class="checkout-step-line"></div>
          <div class="checkout-step" data-step="3">
            <div class="step-dot" id="dot-3">3</div>
            <span>Confirmation</span>
          </div>
        </div>

        <!-- Step bodies -->
        <div class="checkout-body" id="checkout-body">
          <!-- Rendered by JS -->
        </div>
      </div>
    </div>`;
  document.body.appendChild(el.firstElementChild);
}

let _cart = [];
let _currentStep = 1;
let _address = {};
let _payment = "upi";
let _orderId = "";

/** Opens the checkout modal with the current cart */
export function openCheckout(cart) {
  _cart = cart;
  _currentStep = 1;
  _address = {};
  _orderId = "";

  const overlay = document.getElementById("checkout-overlay");
  if (!overlay) return;
  overlay.hidden = false;
  document.body.style.overflow = "hidden";
  renderStep(1);

  // Wire close
  document.getElementById("checkout-close-btn")?.addEventListener("click", closeCheckout, { once: true });
  overlay.addEventListener("click", e => { if (e.target === overlay) closeCheckout(); });
}

function closeCheckout() {
  const overlay = document.getElementById("checkout-overlay");
  if (overlay) overlay.hidden = true;
  document.body.style.overflow = "";
}

function setDots(step) {
  [1, 2, 3].forEach(n => {
    const dot = document.getElementById(`dot-${n}`);
    if (!dot) return;
    dot.className = "step-dot" + (n < step ? " done" : n === step ? " active" : "");
    dot.textContent = n < step ? "✓" : String(n);
  });
}

function renderStep(step) {
  _currentStep = step;
  setDots(step);
  const body = document.getElementById("checkout-body");
  if (!body) return;

  const user = getCurrentUser();
  const total = _cart.reduce((s, i) => s + i.product.price * i.qty, 0);
  const totalFmt = `₹${total.toLocaleString("en-IN")}`;

  if (step === 1) {
    body.innerHTML = `
      <div class="checkout-step-content">
        <h3 class="checkout-step-title">📦 Delivery Address</h3>
        <div class="co-form">
          <div class="co-row-2">
            <div class="co-field">
              <label>Full Name *</label>
              <input id="co-name" type="text" placeholder="Priya Sharma" value="${user?.name ?? ""}" />
            </div>
            <div class="co-field">
              <label>Phone *</label>
              <input id="co-phone" type="tel" placeholder="9876543210" maxlength="10" />
            </div>
          </div>
          <div class="co-field">
            <label>Address Line 1 *</label>
            <input id="co-addr1" type="text" placeholder="House no, Building, Street" />
          </div>
          <div class="co-field">
            <label>Address Line 2</label>
            <input id="co-addr2" type="text" placeholder="Area, Landmark (optional)" />
          </div>
          <div class="co-row-3">
            <div class="co-field">
              <label>City *</label>
              <input id="co-city" type="text" placeholder="Mumbai" />
            </div>
            <div class="co-field">
              <label>State *</label>
              <select id="co-state">
                <option value="">State</option>
                ${["Andhra Pradesh","Delhi","Gujarat","Karnataka","Kerala","Maharashtra","Rajasthan","Tamil Nadu","Telangana","Uttar Pradesh","West Bengal"].map(s => `<option>${s}</option>`).join("")}
              </select>
            </div>
            <div class="co-field">
              <label>Pincode *</label>
              <input id="co-pin" type="text" placeholder="400001" maxlength="6" />
            </div>
          </div>
        </div>

        <!-- Order summary mini -->
        <div class="co-summary">
          <div class="co-summary-title">Order Summary (${_cart.reduce((s,i)=>s+i.qty,0)} items)</div>
          ${_cart.map(({product, qty}) => `
            <div class="co-summary-item">
              <span>${product.name} × ${qty}</span>
              <span>₹${(product.price * qty).toLocaleString("en-IN")}</span>
            </div>`).join("")}
          <div class="co-summary-total"><strong>Total</strong><strong>${totalFmt}</strong></div>
        </div>

        <button class="checkout-action-btn" id="co-next-1">Continue to Payment →</button>
      </div>`;

    document.getElementById("co-next-1")?.addEventListener("click", () => {
      const name  = document.getElementById("co-name")?.value.trim();
      const phone = document.getElementById("co-phone")?.value.trim();
      const addr1 = document.getElementById("co-addr1")?.value.trim();
      const city  = document.getElementById("co-city")?.value.trim();
      const state = document.getElementById("co-state")?.value;
      const pin   = document.getElementById("co-pin")?.value.trim();

      if (!name || !phone || !addr1 || !city || !state || !pin) {
        showCoError("Please fill in all required fields.");
        return;
      }
      if (!/^\d{10}$/.test(phone)) { showCoError("Enter a valid 10-digit phone number."); return; }
      if (!/^\d{6}$/.test(pin))    { showCoError("Enter a valid 6-digit pincode."); return; }

      _address = { name, phone, addr1, addr2: document.getElementById("co-addr2")?.value.trim(), city, state, pin };
      renderStep(2);
    });
  }

  else if (step === 2) {
    const paySettings = getPaymentSettings();
    const allMethods = [
      { key: "upi",        icon: "📱", title: "UPI", sub: "Google Pay, PhonePe, Paytm" },
      { key: "card",       icon: "💳", title: "Credit / Debit Card", sub: "Visa, Mastercard, RuPay" },
      { key: "netbanking", icon: "🏦", title: "Net Banking", sub: "All major banks supported" },
      { key: "cod",        icon: "💵", title: "Cash on Delivery", sub: "Pay when you receive" },
    ];
    const enabledMethods = allMethods.filter((m) => paySettings[m.key]);
    if (!enabledMethods.some((m) => m.key === _payment)) {
      _payment = enabledMethods[0]?.key ?? "";
    }

    body.innerHTML = `
      <div class="checkout-step-content">
        <h3 class="checkout-step-title">💳 Payment Method</h3>

        <div class="payment-options">
          ${enabledMethods.length === 0
            ? `<p class="co-error-msg">⚠️ All payment methods are currently disabled by Admin.</p>`
            : enabledMethods.map((m) => `
              <label class="payment-option ${_payment === m.key ? "selected" : ""}">
                <input type="radio" name="payment" value="${m.key}" ${_payment === m.key ? "checked" : ""} />
                <span class="pay-opt-icon">${m.icon}</span>
                <div>
                  <strong>${m.title}</strong>
                  <span>${m.sub}</span>
                </div>
              </label>
            `).join("")}
        </div>

        <div class="co-pay-summary">
          <div class="co-pay-row"><span>Subtotal</span><span>${totalFmt}</span></div>
          <div class="co-pay-row green"><span>Delivery</span><span>FREE</span></div>
          <div class="co-pay-row total"><span>Amount Payable</span><strong>${totalFmt}</strong></div>
        </div>

        <div class="co-btn-row">
          <button class="checkout-back-btn" id="co-back-2">← Back</button>
          <button class="checkout-action-btn" id="co-pay-btn" ${enabledMethods.length === 0 ? "disabled" : ""}>
            ${_payment === "cod" ? "Place Order 🎉" : `Pay ${totalFmt} →`}
          </button>
        </div>
      </div>`;

    // Update selected styles & pay button text on radio change
    body.querySelectorAll('input[name="payment"]').forEach(radio => {
      radio.addEventListener("change", () => {
        _payment = radio.value;
        body.querySelectorAll(".payment-option").forEach(o => o.classList.remove("selected"));
        radio.closest(".payment-option")?.classList.add("selected");
        const payBtn = document.getElementById("co-pay-btn");
        if (payBtn) payBtn.textContent = _payment === "cod" ? "Place Order 🎉" : `Pay ${totalFmt} →`;
      });
    });

    document.getElementById("co-back-2")?.addEventListener("click", () => renderStep(1));
    document.getElementById("co-pay-btn")?.addEventListener("click", () => {
      // Simulate payment processing
      const btn = document.getElementById("co-pay-btn");
      if (btn) { btn.textContent = "Processing…"; btn.disabled = true; }
      setTimeout(() => {
        _orderId = "FC" + Date.now().toString().slice(-8).toUpperCase();
        addOrder({
          orderId: _orderId,
          customerName: _address.name,
          city: _address.city,
          itemCount: _cart.reduce((s, i) => s + i.qty, 0),
          paymentMethod: { upi: "UPI", card: "Card", netbanking: "Net Banking", cod: "Cash on Delivery" }[_payment] ?? _payment,
          total,
        });
        renderStep(3);
      }, 1000);
    });
  }

  else if (step === 3) {
    const eta = new Date();
    eta.setDate(eta.getDate() + 3);
    const etaStr = eta.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

    body.innerHTML = `
      <div class="checkout-step-content checkout-success">
        <div class="success-animation">
          <div class="success-circle">✓</div>
        </div>
        <h2 class="success-title">Order Placed Successfully! 🎉</h2>
        <p class="success-sub">Thank you, <strong>${_address.name}</strong>! Your order is confirmed.</p>

        <div class="order-details-box">
          <div class="order-detail-row">
            <span>Order ID</span><strong>#${_orderId}</strong>
          </div>
          <div class="order-detail-row">
            <span>Delivery to</span>
            <strong>${_address.addr1}, ${_address.city}, ${_address.state} - ${_address.pin}</strong>
          </div>
          <div class="order-detail-row">
            <span>Estimated delivery</span>
            <strong class="green">${etaStr}</strong>
          </div>
          <div class="order-detail-row">
            <span>Payment</span>
            <strong>${{ upi: "UPI", card: "Card", netbanking: "Net Banking", cod: "Cash on Delivery" }[_payment]}</strong>
          </div>
          <div class="order-detail-row total">
            <span>Amount</span>
            <strong>₹${_cart.reduce((s,i)=>s+i.product.price*i.qty,0).toLocaleString("en-IN")}</strong>
          </div>
        </div>

        <p class="order-email-note">📧 Confirmation sent to <strong>${getCurrentUser()?.email ?? "your email"}</strong></p>
        <button class="checkout-action-btn" id="co-continue-btn">Continue Shopping →</button>
      </div>`;

    document.getElementById("co-continue-btn")?.addEventListener("click", () => {
      closeCheckout();
      // Signal cart to clear
      window.dispatchEvent(new CustomEvent("order-placed"));
    });
  }
}

function showCoError(msg) {
  let err = document.getElementById("co-error-msg");
  if (!err) {
    err = document.createElement("p");
    err.id = "co-error-msg";
    err.className = "co-error-msg";
    document.getElementById("checkout-body")?.prepend(err);
  }
  err.textContent = "⚠️ " + msg;
  err.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

