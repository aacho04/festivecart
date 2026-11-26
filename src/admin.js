/**
 * admin.js — Admin panel logic with RBAC gate.
 *
 * The gear button (⚙️) is hidden from customers by default.
 * Only authenticated admins (via rbac.js PIN flow) can see it.
 *
 * Bug fixes:
 *  - Close button: use document-level delegated listener so it always fires.
 *  - Panel is never rendered for non-admins.
 */

import { FESTIVALS } from "./festivals.js";
import { getFestiveMode, getExperimentVariation, sdkReady } from "./flagsmith-client.js";
import { isAdmin, logoutAdmin } from "./rbac.js";

/* ─── State ──────────────────────────────────────────────── */
let _simulatedDate    = null;
let _festiveOverride  = null;
let _onChangeCallback = null;

export function getEffectiveDate()       { return _simulatedDate ?? new Date(); }
export function getEffectiveFestiveMode(){ return _festiveOverride !== null ? _festiveOverride : getFestiveMode(); }
export function hasLocalOverride()       { return _festiveOverride !== null; }

/* ─── Open / close helpers (exported so rbac.js can call) ── */
export function openAdminPanel() {
  const panel   = document.getElementById("admin-panel");
  const gearBtn = document.getElementById("admin-toggle-btn");
  if (panel)   panel.hidden = false;
  if (gearBtn) gearBtn.setAttribute("aria-expanded", "true");
  updateStatusDisplay();
}

export function closeAdminPanel() {
  const panel   = document.getElementById("admin-panel");
  const gearBtn = document.getElementById("admin-toggle-btn");
  if (panel)   panel.hidden = true;
  if (gearBtn) gearBtn.setAttribute("aria-expanded", "false");
}

/* ─── Init ───────────────────────────────────────────────── */
export function initAdminPanel(onChangeCallback) {
  _onChangeCallback = onChangeCallback;

  if (!isAdmin()) return;   // ← RBAC gate: nothing wired for customers

  const panel         = document.getElementById("admin-panel");
  const toggleBtn     = document.getElementById("admin-toggle-btn");
  const festiveToggle = document.getElementById("festive-toggle");
  const overrideLabel = document.getElementById("override-label");
  const useFlagBtn    = document.getElementById("use-flagsmith-btn");
  const festivalSel   = document.getElementById("festival-select");
  const datePicker    = document.getElementById("date-picker");
  const resetBtn      = document.getElementById("reset-date-btn");

  if (!panel) return;

  // ── Close button — delegated on document so it always fires ───────
  // (Fixes the bug where the button click was swallowed)
  document.addEventListener("click", (e) => {
    if (e.target.closest("#admin-close-btn")) {
      closeAdminPanel();
    }
  });

  // ── Gear button toggle ────────────────────────────────────────────
  toggleBtn?.addEventListener("click", () => {
    panel.hidden ? openAdminPanel() : closeAdminPanel();
  });

  // ── Keyboard shortcut: Ctrl+Shift+Alt+A (matches rbac.js) ─────────
  // (rbac.js handles the shortcut; nothing extra needed here)

  // ── Populate festival dropdown ────────────────────────────────────
  FESTIVALS.forEach((f) => {
    const opt = document.createElement("option");
    opt.value = f.id;
    opt.textContent = f.name;
    festivalSel?.appendChild(opt);
  });

  // ── Set date picker to today ──────────────────────────────────────
  if (datePicker) datePicker.value = toDateInputValue(new Date());

  // ── Festive mode toggle ───────────────────────────────────────────
  updateToggleUI(getFestiveMode());

  festiveToggle?.addEventListener("click", () => {
    const current = festiveToggle.getAttribute("aria-checked") === "true";
    _festiveOverride = !current;
    updateToggleUI(_festiveOverride);
    if (overrideLabel) overrideLabel.hidden = false;
    if (useFlagBtn)    useFlagBtn.hidden    = false;
    notifyChange();
  });

  useFlagBtn?.addEventListener("click", () => {
    _festiveOverride = null;
    updateToggleUI(getFestiveMode());
    if (overrideLabel) overrideLabel.hidden = true;
    if (useFlagBtn)    useFlagBtn.hidden    = true;
    notifyChange();
  });

  function updateToggleUI(value) {
    festiveToggle?.setAttribute("aria-checked", String(value));
    festiveToggle?.classList.toggle("on", !!value);
  }

  // ── Festival selector ─────────────────────────────────────────────
  festivalSel?.addEventListener("change", () => {
    const id = festivalSel.value;
    if (!id) {
      _simulatedDate = null;
      if (datePicker) datePicker.value = toDateInputValue(new Date());
    } else {
      const festival = FESTIVALS.find((f) => f.id === id);
      if (festival) {
        _simulatedDate = new Date(festival.startDate + "T00:00:00");
        if (datePicker) datePicker.value = festival.startDate;
      }
    }
    notifyChange();
  });

  // ── Date picker ───────────────────────────────────────────────────
  datePicker?.addEventListener("input", () => {
    const v = datePicker.value;
    if (v) {
      _simulatedDate = new Date(v + "T00:00:00");
      const matched = FESTIVALS.find((f) => v >= f.startDate && v <= f.endDate);
      if (festivalSel) festivalSel.value = matched ? matched.id : "";
    }
    notifyChange();
  });

  // ── Reset to today ────────────────────────────────────────────────
  resetBtn?.addEventListener("click", () => {
    _simulatedDate = null;
    if (datePicker)  datePicker.value = toDateInputValue(new Date());
    if (festivalSel) festivalSel.value = "";
    notifyChange();
  });

  // ── Logout button ─────────────────────────────────────────────────
  const logoutBtn = document.getElementById("admin-logout-btn");
  logoutBtn?.addEventListener("click", () => {
    logoutAdmin();
    closeAdminPanel();
    if (toggleBtn) toggleBtn.style.display = "none";
    showAdminToast("👋 Logged out of admin mode");
  });

  updateStatusDisplay();
}

function notifyChange() {
  updateStatusDisplay();
  if (_onChangeCallback) _onChangeCallback();
}

export function updateStatusDisplay(activeFestival) {
  const statusEl = document.getElementById("admin-status");
  if (!statusEl) return;

  const effectiveDate = getEffectiveDate();
  const festiveOn     = getEffectiveFestiveMode();
  const variation     = getExperimentVariation();

  const dateStr = effectiveDate.toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const rows = [
    ["📅 Date",        _simulatedDate ? `${dateStr} (simulated)` : `${dateStr} (today)`],
    ["🎉 Festival",    activeFestival?.name ?? "none"],
    ["🚩 Festive mode",festiveOn
      ? (_festiveOverride !== null ? "ON (local override)" : "ON (Flagsmith)")
      : (_festiveOverride !== null ? "OFF (local override)" : "OFF (Flagsmith)")],
    ["🧪 Experiment",  sdkReady ? `variation: ${variation}` : "not connected (no env key)"],
  ];

  statusEl.innerHTML = rows
    .map(([label, val]) =>
      `<div class="status-row"><span class="status-label">${label}</span><span class="status-val">${val}</span></div>`)
    .join("");
}

function showAdminToast(msg) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("visible");
  setTimeout(() => el.classList.remove("visible"), 2500);
}

function toDateInputValue(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
