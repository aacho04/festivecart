/**
 * flagsmith-client.js
 * Wraps the Flagsmith SDK (@flagsmith/flagsmith v12.6.0+) initialization
 * and experiment helpers.
 *
 * Experiment flag: festive_theme_experiment
 *   - control  → normal theme
 *   - festive  → festival theme
 *
 * Boolean flag: festive_mode_enabled
 *   - true  → festive mode on
 *   - false → festive mode off
 */

let flagsmith = null;

/** Stable user id — generated once and persisted in localStorage */
export function getUserId() {
  const KEY = "festivecart_uid";
  let uid = localStorage.getItem(KEY);
  if (!uid) {
    uid = "user_" + Math.random().toString(36).slice(2, 11) + "_" + Date.now();
    localStorage.setItem(KEY, uid);
  }
  return uid;
}

/** Whether the SDK has been successfully initialised */
let sdkReady = false;

/**
 * Initialises the Flagsmith SDK with events enabled.
 * Returns true if init succeeded, false if the env key is missing or init fails.
 */
export async function initFlagsmith() {
  const envKey = import.meta.env.VITE_FLAGSMITH_ENVIRONMENT_KEY;
  if (!envKey || envKey === "your_client_side_environment_key_here") {
    console.info(
      "[FestiveCart] VITE_FLAGSMITH_ENVIRONMENT_KEY not set — running with defaults."
    );
    return false;
  }

  try {
    const mod = await import("@flagsmith/flagsmith");
    flagsmith = mod.default ?? mod;

    await flagsmith.init({
      environmentID: envKey,
      enableEvents: true,
      identity: getUserId(),
      defaultFlags: {
        festive_mode_enabled: { enabled: true, value: null },
        festive_theme_experiment: { enabled: true, value: "control" },
      },
    });

    sdkReady = true;
    console.info("[FestiveCart] Flagsmith SDK ready. User:", getUserId());
    return true;
  } catch (err) {
    console.warn("[FestiveCart] Flagsmith init failed:", err.message);
    return false;
  }
}

/** Returns true if festive_mode_enabled flag is on */
export function getFestiveMode() {
  if (!sdkReady || !flagsmith) return true;
  return flagsmith.hasFeature("festive_mode_enabled");
}

/**
 * Returns the experiment variation: "control" | "festive"
 * Uses getExperimentFlag() so Flagsmith records a $flag_exposure event
 * for the identified user.
 */
export function getExperimentVariation() {
  if (!sdkReady || !flagsmith) return "control";
  const flag = flagsmith.getExperimentFlag("festive_theme_experiment");
  return String(flag?.value ?? "control");
}

/**
 * Tracks the add_to_cart_click conversion event.
 * Event name is case-sensitive and matches the Flagsmith metric exactly.
 */
export function trackAddToCart() {
  if (!sdkReady || !flagsmith) return;
  try {
    flagsmith.trackEvent("add_to_cart_click");
  } catch (err) {
    console.warn("[FestiveCart] trackEvent failed:", err.message);
  }
}

/**
 * Flushes any buffered analytics events before the page unloads.
 */
export async function flushEvents() {
  if (!sdkReady || !flagsmith) return;
  try {
    await flagsmith.flushEvents();
  } catch (_) {
    // Best-effort on unload
  }
}

export function getFlagsmithInstance() {
  return flagsmith;
}

export { sdkReady };
