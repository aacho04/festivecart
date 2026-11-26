/**
 * flagsmith-client.js
 * Wraps the Flagsmith SDK initialization and experiment helpers.
 *
 * Experiment flag: festive_theme_experiment
 *   - control  → normal theme
 *   - festive  → festival theme
 *
 * Boolean flag: festive_mode_enabled
 *   - true  → festive mode on
 *   - false → festive mode off
 *
 * The client-side environment key is loaded from VITE_FLAGSMITH_ENVIRONMENT_KEY
 * (defined in .env — never committed to source control).
 *
 * When the env key is absent (e.g. during local dev without .env), Flagsmith
 * initialization is skipped and the app falls back to default values, so the
 * UI still works without any configuration.
 */

// Guard: in environments without a bundler (e.g., simulate.js runs in Node
// and imports its own SDK separately), this module is used only in the browser.
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
 * Initialises the Flagsmith SDK.
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
    // Dynamic import keeps the bundle clean; Vite tree-shakes unused SDK code.
    const mod = await import("@flagsmith/flagsmith");
    flagsmith = mod.default ?? mod;

    await flagsmith.init({
      environmentID: envKey,
      // enableAnalytics must be true to send experiment events
      enableAnalytics: true,
      // Identify the user so exposures and conversions are joined by identity
      identity: getUserId(),
      // Default flag values — used as fallback when Flagsmith is unreachable
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
  if (!sdkReady || !flagsmith) return true; // default ON
  return flagsmith.hasFeature("festive_mode_enabled");
}

/**
 * Returns the experiment variation: "control" | "festive"
 * This call records an exposure in Flagsmith Experimentation.
 */
export function getExperimentVariation() {
  if (!sdkReady || !flagsmith) return "control";
  // getValue on a multivariate flag returns the winning variation's value
  // and records an exposure for this identity automatically.
  const val = flagsmith.getValue("festive_theme_experiment");
  return val ?? "control";
}

/**
 * Tracks the add_to_cart_click conversion event.
 * The event name MUST match the metric definition in Flagsmith exactly.
 */
export async function trackAddToCart() {
  if (!sdkReady || !flagsmith) return;
  try {
    await flagsmith.track("add_to_cart_click");
    console.debug("[FestiveCart] Tracked: add_to_cart_click");
  } catch (err) {
    console.warn("[FestiveCart] Track event failed:", err.message);
  }
}

/**
 * Flushes any buffered analytics events before the page unloads.
 * Call on 'beforeunload' or 'visibilitychange' (hidden).
 */
export async function flushEvents() {
  if (!sdkReady || !flagsmith) return;
  try {
    if (typeof flagsmith.flushEvents === "function") {
      await flagsmith.flushEvents();
    }
  } catch (_) {
    // Best-effort on unload
  }
}

/** Returns the raw flagsmith instance (for admin panel introspection) */
export function getFlagsmithInstance() {
  return flagsmith;
}

export { sdkReady };

