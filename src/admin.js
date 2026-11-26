/**
 * admin.js — Admin panel logic with RBAC gate.
 *
 * Only visible when logged in as an Admin (via auth.js).
 * Customers never see the gear button or admin panel.
 */

import { FESTIVALS, getActiveFestival } from "./festivals.js";
import { getFestiveMode, getExperimentVariation, sdkReady } from "./flagsmith-client.js";
import { isAdmin } from "./auth.js";

/* ─── State ──────────────────────────────────────────────── */
let _simulatedDate    = null;
let _festiveOverride  = null;   // null = use Flagsmith; true/false = local override
let _onChangeCallback = null;
let _initialized      = false;

export function getEffectiveDate()        { return _simulatedDate ?? new Date(); }
export function getEffectiveFestiveMode() { return _festiveOverride !== null ? _festiveOverride : getFestiveMode(); }
export function hasLocalOverride()        { return _festiveOverride !== null; }
export function hasSimulatedDate()        { return _simulatedDate !== null; }

/* ─── Open / close helpers ───────────────────────────────── */
export function openAdminPanel() {
  if (!isAdmin()) return;
  const panel   = document.getElementById("admin-panel");
  const gearBtn = document.getElementById("admin-toggle-btn");
  if (panel)   panel.hidden = false;
  if (gearBtn) gearBtn.setAttribute("aria-expanded", "true");
  updateStatusDisplay(getEffectiveFestiveMode() ? getActiveFestival(getEffectiveDate()) : null);
}

export function closeAdminPanel() {
  const panel   = document.getElementById("admin-panel");
  const gearBtn = document.getElementById("admin-toggle-btn");
  if (panel)   panel.hidden = true;
  if (gearBtn) gearBtn.setAttribute("aria-expanded", "false");
}

/** Shows or hides the entire admin wrapper based on current user's role */
export function syncAdminVisibility() {
  const wrapper = document.getElementById("admin-panel-wrapper");
  const gearBtn = document.getElementById("admin-toggle-btn");
  const admin   = isAdmin();

  if (wrapper) wrapper.style.display = admin ? "flex" : "none";
  if (gearBtn) gearBtn.style.display = admin ? "flex" : "none";
  if (!admin)  closeAdminPanel();
}

/* ─── Init ───────────────────────────────────────────────── */
export function initAdminPanel(onChangeCallback) {
  _onChangeCallback = onChangeCallback;
  syncAdminVisibility();

  if (!isAdmin() || _initialized) return;
  _initialized = true;

  const panel         = document.getElementById("admin-panel");
  const toggleBtn     = document.getElementById("admin-toggle-btn");
  const festiveToggle = document.getElementById("festive-toggle");
  const overrideLabel = document.getElementById("override-label");
  const useFlagBtn    = document.getElementById("use-flagsmith-btn");
  const festivalSel   = document.getElementById("festival-select");
  const datePicker    = document.getElementById("date-picker");
  const resetBtn      = document.getElementById("reset-date-btn");

  if (!panel) return;

  // ── Close button (delegated so it always fires) ───────────────────
  document.addEventListener("click", (e) => {
    if (e.target.closest("#admin-close-btn")) {
      closeAdminPanel();
    }
  });

  // ── Gear button toggle ────────────────────────────────────────────
  toggleBtn?.addEventListener("click", () => {
    panel.hidden ? openAdminPanel() : closeAdminPanel();
  });

  // ── Keyboard shortcut: Shift+A (for admin only) ───────────────────
  document.addEventListener("keydown", (e) => {
    if (!isAdmin()) return;
    if (e.key === "A" && e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
      panel.hidden ? openAdminPanel() : closeAdminPanel();
    }
  });

  // ── Populate festival dropdown (only once) ────────────────────────
  if (festivalSel && festivalSel.options.length <= 1) {
    FESTIVALS.forEach((f) => {
      const opt = document.createElement("option");
      opt.value = f.id;
      opt.textContent = f.name;
      festivalSel.appendChild(opt);
    });
  }

  // ── Set date picker to today ──────────────────────────────────────
  if (datePicker) datePicker.value = toDateInputValue(new Date());

  // ── Festive mode toggle ───────────────────────────────────────────
  function updateToggleUI(value) {
    festiveToggle?.setAttribute("aria-checked", String(!!value));
    festiveToggle?.classList.toggle("on", !!value);
  }

  updateToggleUI(getEffectiveFestiveMode());

  festiveToggle?.addEventListener("click", () => {
    const current = festiveToggle.getAttribute("aria-checked") === "true";
    _festiveOverride = !current;
    updateToggleUI(_festiveOverride);
    if (overrideLabel) overrideLabel.hidden = false;
    if (useFlagBtn)    useFlagBtn.hidden    = false;
    notifyChange();
  });

  // ── "Use Flagsmith value" button ──────────────────────────────────
  useFlagBtn?.addEventListener("click", () => {
    _festiveOverride = null;
    const flagVal = getFestiveMode();
    updateToggleUI(flagVal);
    if (overrideLabel) overrideLabel.hidden = true;
    if (useFlagBtn)    useFlagBtn.hidden    = true;
    notifyChange();
  });

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

  // ── Logout button inside admin panel ──────────────────────────────
  document.getElementById("admin-logout-btn")?.addEventListener("click", () => {
    window.dispatchEvent(new CustomEvent("fc-logout"));
  });

  updateStatusDisplay(getEffectiveFestiveMode() ? getActiveFestival(getEffectiveDate()) : null);
}

function notifyChange() {
  const active = getEffectiveFestiveMode() ? getActiveFestival(getEffectiveDate()) : null;
  updateStatusDisplay(active);
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
    ["🚩 Festive mode", festiveOn
      ? (_festiveOverride !== null ? "ON (local override)" : "ON (Flagsmith)")
      : (_festiveOverride !== null ? "OFF (local override)" : "OFF (Flagsmith)")],
    ["🧪 Experiment",  sdkReady ? `variation: ${variation}` : "not connected (no env key)"],
  ];

  statusEl.innerHTML = rows
    .map(([label, val]) =>
      `<div class="status-row"><span class="status-label">${label}</span><span class="status-val">${val}</span></div>`)
    .join("");
}

function toDateInputValue(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
