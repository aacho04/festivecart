/**
 * rbac.js — Role-Based Access Control for FestiveCart
 *
 * The admin panel is INVISIBLE to customers by default.
 * To activate admin mode:
 *   • Press Ctrl + Shift + Alt + A  (secret shortcut)
 *   • OR visit the page with ?admin=1 in the URL (dev convenience)
 *
 * Once activated, an Admin Login modal appears asking for a PIN.
 * Default PIN: 4321  (change ADMIN_PIN below for your deployment)
 *
 * Admin session is stored in sessionStorage — clears when tab closes.
 * Admin keys are NEVER sent to Flagsmith or any server.
 */

const ADMIN_PIN     = "4321";
const SESSION_KEY   = "fc_admin_session";

/** Is the current tab admin-authenticated? */
export function isAdmin() {
  return sessionStorage.getItem(SESSION_KEY) === "true";
}

/** Verify PIN and start session. Returns true on success. */
export function loginAdmin(pin) {
  if (pin === ADMIN_PIN) {
    sessionStorage.setItem(SESSION_KEY, "true");
    return true;
  }
  return false;
}

/** End admin session */
export function logoutAdmin() {
  sessionStorage.removeItem(SESSION_KEY);
}

/**
 * Injects the admin login modal into the DOM and wires it up.
 * @param {Function} onAuthSuccess  — called when login succeeds
 */
export function initRbac(onAuthSuccess) {
  // ── Create modal ──────────────────────────────────────────────────
  const modal = document.createElement("div");
  modal.id = "admin-login-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", "Admin login");
  modal.hidden = true;
  modal.innerHTML = `
    <div class="admin-login-box">
      <div class="admin-login-header">
        <span class="admin-login-icon">🔐</span>
        <h2 class="admin-login-title">Admin Access</h2>
        <p class="admin-login-sub">This area is restricted to FestiveCart administrators.</p>
      </div>
      <div class="admin-login-body">
        <label class="admin-login-label" for="admin-pin-input">Enter Admin PIN</label>
        <input
          id="admin-pin-input"
          type="password"
          inputmode="numeric"
          maxlength="8"
          placeholder="••••"
          class="admin-pin-input"
          autocomplete="off"
        />
        <p class="admin-pin-error" id="admin-pin-error" hidden>Incorrect PIN. Try again.</p>
        <button class="admin-login-btn" id="admin-login-submit">Unlock Admin Panel</button>
        <button class="admin-login-cancel" id="admin-login-cancel">Cancel</button>
      </div>
      <p class="admin-login-hint">💡 Demo PIN: <strong>4321</strong></p>
    </div>`;
  document.body.appendChild(modal);

  // ── Gear button (hidden until admin is logged in) ─────────────────
  const gearBtn = document.getElementById("admin-toggle-btn");
  if (gearBtn) {
    // Always hidden for customers; shown only after auth
    gearBtn.style.display = isAdmin() ? "flex" : "none";
  }

  // ── Show modal ────────────────────────────────────────────────────
  function showLoginModal() {
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    setTimeout(() => document.getElementById("admin-pin-input")?.focus(), 50);
  }

  function hideLoginModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
    const input = document.getElementById("admin-pin-input");
    if (input) { input.value = ""; }
    const err = document.getElementById("admin-pin-error");
    if (err) err.hidden = true;
  }

  // ── Submit ────────────────────────────────────────────────────────
  function attemptLogin() {
    const pin   = document.getElementById("admin-pin-input")?.value ?? "";
    const error = document.getElementById("admin-pin-error");
    if (loginAdmin(pin)) {
      hideLoginModal();
      if (gearBtn) gearBtn.style.display = "flex";
      onAuthSuccess();
    } else {
      if (error) {
        error.hidden = false;
        error.textContent = "Incorrect PIN. Try again.";
      }
      const input = document.getElementById("admin-pin-input");
      if (input) { input.value = ""; input.focus(); }
    }
  }

  document.getElementById("admin-login-submit")
    ?.addEventListener("click", attemptLogin);

  document.getElementById("admin-pin-input")
    ?.addEventListener("keydown", (e) => { if (e.key === "Enter") attemptLogin(); });

  document.getElementById("admin-login-cancel")
    ?.addEventListener("click", hideLoginModal);

  // Click outside to close
  modal.addEventListener("click", (e) => { if (e.target === modal) hideLoginModal(); });

  // ── Secret trigger: Ctrl + Shift + Alt + A ────────────────────────
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.altKey && e.key.toUpperCase() === "A") {
      e.preventDefault();
      if (isAdmin()) {
        // Already logged in — just toggle panel
        const panel = document.getElementById("admin-panel");
        const gear  = document.getElementById("admin-toggle-btn");
        if (panel) {
          panel.hidden = !panel.hidden;
          gear?.setAttribute("aria-expanded", String(!panel.hidden));
        }
      } else {
        showLoginModal();
      }
    }
  });

  // ── URL param convenience (dev mode) ?admin=1 ─────────────────────
  if (new URLSearchParams(window.location.search).get("admin") === "1" && !isAdmin()) {
    showLoginModal();
  }

  // ── If already logged in from this session, re-show gear ──────────
  if (isAdmin() && gearBtn) {
    gearBtn.style.display = "flex";
  }
}
