/**
 * admin.js
 * Admin / Demo panel logic.
 * Provides local overrides for festive mode, simulated date, and festival selection.
 * Clearly labelled as a demo/admin tool — not shown in production without interaction.
 */

import { FESTIVALS } from "./festivals.js";
import { getFestiveMode, getExperimentVariation, sdkReady } from "./flagsmith-client.js";

/* ─── State ───────────────────────────────────────────────────────────────── */
let _simulatedDate = null;      // null → use real date
let _festiveOverride = null;    // null → use Flagsmith value; true/false → local override
let _onChangeCallback = null;   // called whenever state changes

/* ─── Accessors ──────────────────────────────────────────────────────────── */

/** Returns the date the app should use (simulated or real today) */
export function getEffectiveDate() {
  return _simulatedDate ?? new Date();
}

/** Returns effective festive mode (override or Flagsmith) */
export function getEffectiveFestiveMode() {
  if (_festiveOverride !== null) return _festiveOverride;
  return getFestiveMode();
}

/** Returns whether we're using a local override */
export function hasLocalOverride() {
  return _festiveOverride !== null;
}

/* ─── Init ───────────────────────────────────────────────────────────────── */

export function initAdminPanel(onChangeCallback) {
  _onChangeCallback = onChangeCallback;

  const panel         = document.getElementById("admin-panel");
  const toggleBtn     = document.getElementById("admin-toggle-btn");
  const closeBtn      = document.getElementById("admin-close-btn");
  const festiveToggle = document.getElementById("festive-toggle");
  const overrideLabel = document.getElementById("override-label");
  const useFlagBtn    = document.getElementById("use-flagsmith-btn");
  const festivalSel   = document.getElementById("festival-select");
  const datePicker    = document.getElementById("date-picker");
  const resetBtn      = document.getElementById("reset-date-btn");

  if (!panel) return; // Safety guard

  // ── Populate festival dropdown ─────────────────────────────────────────
  FESTIVALS.forEach((f) => {
    const opt = document.createElement("option");
    opt.value = f.id;
    opt.textContent = f.name;
    festivalSel.appendChild(opt);
  });

  // ── Set date picker to today ───────────────────────────────────────────
  datePicker.value = toDateInputValue(new Date());

  // ── Panel open/close ───────────────────────────────────────────────────
  function openPanel() {
    panel.hidden = false;
    toggleBtn.setAttribute("aria-expanded", "true");
    updateStatusDisplay();
  }

  function closePanel() {
    panel.hidden = true;
    toggleBtn.setAttribute("aria-expanded", "false");
  }

  toggleBtn.addEventListener("click", () => {
    panel.hidden ? openPanel() : closePanel();
  });

  closeBtn.addEventListener("click", closePanel);

  // Keyboard shortcut: Shift+A
  document.addEventListener("keydown", (e) => {
    if (e.key === "A" && e.shiftKey && !e.ctrlKey && !e.metaKey) {
      // Don't fire when typing in an input
      if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "SELECT") return;
      panel.hidden ? openPanel() : closePanel();
    }
  });

  // ── Festive mode toggle ────────────────────────────────────────────────
  // Reflect current Flagsmith value initially
  updateToggleUI(getFestiveMode());

  festiveToggle.addEventListener("click", () => {
    const current = festiveToggle.getAttribute("aria-checked") === "true";
    _festiveOverride = !current;
    updateToggleUI(_festiveOverride);
    overrideLabel.hidden = false;
    useFlagBtn.hidden = false;
    notifyChange();
  });

  useFlagBtn.addEventListener("click", () => {
    _festiveOverride = null;
    updateToggleUI(getFestiveMode());
    overrideLabel.hidden = true;
    useFlagBtn.hidden = true;
    notifyChange();
  });

  function updateToggleUI(value) {
    festiveToggle.setAttribute("aria-checked", String(value));
    festiveToggle.classList.toggle("on", value);
  }

  // ── Festival selector ──────────────────────────────────────────────────
  festivalSel.addEventListener("change", () => {
    const id = festivalSel.value;
    if (!id) {
      _simulatedDate = null;
      datePicker.value = toDateInputValue(new Date());
    } else {
      const festival = FESTIVALS.find((f) => f.id === id);
      if (festival) {
        _simulatedDate = new Date(festival.startDate + "T00:00:00");
        datePicker.value = festival.startDate;
      }
    }
    notifyChange();
  });

  // ── Date picker ────────────────────────────────────────────────────────
  datePicker.addEventListener("input", () => {
    const v = datePicker.value;
    if (v) {
      _simulatedDate = new Date(v + "T00:00:00");
      // Sync festival selector
      const matched = FESTIVALS.find(
        (f) => v >= f.startDate && v <= f.endDate
      );
      festivalSel.value = matched ? matched.id : "";
    }
    notifyChange();
  });

  // ── Reset to today ─────────────────────────────────────────────────────
  resetBtn.addEventListener("click", () => {
    _simulatedDate = null;
    datePicker.value = toDateInputValue(new Date());
    festivalSel.value = "";
    notifyChange();
  });

  // ── Initial status update ──────────────────────────────────────────────
  updateStatusDisplay();
}

/** Call after any state change to refresh the status line and trigger re-render */
function notifyChange() {
  updateStatusDisplay();
  if (_onChangeCallback) _onChangeCallback();
}

/** Updates the admin status text block */
export function updateStatusDisplay(activeFestival) {
  const statusEl = document.getElementById("admin-status");
  if (!statusEl) return;

  const effectiveDate = getEffectiveDate();
  const festiveOn = getEffectiveFestiveMode();
  const variation = getExperimentVariation();

  const dateStr = effectiveDate.toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const rows = [
    ["📅 Date",       _simulatedDate ? `${dateStr} (simulated)` : `${dateStr} (today)`],
    ["🎉 Festival",   activeFestival?.name ?? "none"],
    ["🚩 Festive mode", festiveOn
      ? (_festiveOverride !== null ? "ON (local override)" : "ON (Flagsmith)")
      : (_festiveOverride !== null ? "OFF (local override)" : "OFF (Flagsmith)")],
    ["🧪 Experiment",  sdkReady
      ? `variation: ${variation}`
      : "not connected (no env key)"],
  ];

  statusEl.innerHTML = rows
    .map(([label, val]) => `<div class="status-row"><span class="status-label">${label}</span><span class="status-val">${val}</span></div>`)
    .join("");
}

/* ─── Utility ─────────────────────────────────────────────────────────────── */
function toDateInputValue(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

