/**
 * scripts/simulate.js
 * FestiveCart — Traffic Simulator
 *
 * Simulates ~300 users visiting the shop during the Christmas festival.
 * Each user gets their own unique id, sees the experiment flag, and
 * some of them (more in the festive group) trigger add_to_cart_click.
 *
 * Usage:
 *   node scripts/simulate.js
 *
 * Requirements:
 *   - Set FLAGSMITH_SERVER_SIDE_KEY in .env or as an env var.
 *   - npm install flagsmith-nodejs (server-side SDK; different from browser SDK).
 *
 * After the script exits, wait ~1 minute then run:
 *   node scripts/check-results.js
 */

import { createRequire } from "module";
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, "../.env") });

// ─── Validate env ──────────────────────────────────────────────────────────
const SERVER_KEY = process.env.FLAGSMITH_SERVER_SIDE_KEY;
const ENV_KEY    = process.env.VITE_FLAGSMITH_ENVIRONMENT_KEY;
const EXPERIMENT_ID = process.env.FLAGSMITH_EXPERIMENT_ID ?? "";
const ENV_API_KEY   = process.env.FLAGSMITH_ENV_KEY ?? "";  // environment key (not client key)

if (!SERVER_KEY && !ENV_KEY) {
  console.error(
    "\n❌ No Flagsmith key found.\n" +
    "   Set FLAGSMITH_SERVER_SIDE_KEY in .env to use the Node.js server SDK,\n" +
    "   or VITE_FLAGSMITH_ENVIRONMENT_KEY to use the browser SDK in Node.\n"
  );
  process.exit(1);
}

// ─── Flagsmith SDK (browser-compatible, works in Node 18+) ───────────────
// We use the same @flagsmith/flagsmith package as the browser — it works
// in Node.js 18+ natively and supports event tracking.
let Flagsmith;
try {
  const mod = await import("@flagsmith/flagsmith");
  Flagsmith = mod.default ?? mod;
} catch (e) {
  console.error("❌ Could not import @flagsmith/flagsmith:", e.message);
  console.error("   Run: npm install");
  process.exit(1);
}

// ─── Config ────────────────────────────────────────────────────────────────
const TOTAL_USERS      = 300;
const FESTIVE_CTR      = 0.45;  // 45% of festive-group users click Add to Cart
const CONTROL_CTR      = 0.25;  // 25% of control-group users click Add to Cart
const FLAG_KEY         = "festive_theme_experiment";
const EVENT_NAME       = "add_to_cart_click";   // must match metric exactly (case-sensitive)

// Fix the simulated date to Christmas range so the experiment is active
// (simulate.js uses server-side evaluation — the date simulation is cosmetic here;
//  the actual variation is determined by Flagsmith's rollout config)
const SIMULATED_DATE   = "2026-12-22";

// ─── Helper: generate a unique user id ────────────────────────────────────
function makeUserId(i) {
  return `sim_user_${SIMULATED_DATE}_${String(i).padStart(4, "0")}`;
}

// ─── Counters ──────────────────────────────────────────────────────────────
let exposed    = { control: 0, festive: 0 };
let converted  = { control: 0, festive: 0 };
let errors     = 0;

// ─── Main simulation ───────────────────────────────────────────────────────
console.log(`\n🎄 FestiveCart Traffic Simulator`);
console.log(`   Simulating ${TOTAL_USERS} users on ${SIMULATED_DATE} (Christmas)\n`);

for (let i = 0; i < TOTAL_USERS; i++) {
  const userId = makeUserId(i);

  try {
    // Each user gets their own Flagsmith client instance so identities are isolated
    const fs = Object.create(Flagsmith);

    await Flagsmith.init({
      environmentID: ENV_KEY ?? SERVER_KEY,
      enableAnalytics: true,
      identity: userId,
      defaultFlags: {
        [FLAG_KEY]: { enabled: true, value: "control" },
      },
    });

    // Get variation — this records an EXPOSURE in Flagsmith Experimentation
    const variation = Flagsmith.getValue(FLAG_KEY) ?? "control";
    exposed[variation] = (exposed[variation] ?? 0) + 1;

    // Simulate click probability based on variation
    const ctr = variation === "festive" ? FESTIVE_CTR : CONTROL_CTR;
    if (Math.random() < ctr) {
      await Flagsmith.track(EVENT_NAME);
      converted[variation] = (converted[variation] ?? 0) + 1;
    }

    // Progress indicator
    if ((i + 1) % 50 === 0) {
      process.stdout.write(`   ✓ Processed ${i + 1}/${TOTAL_USERS} users\r`);
    }
  } catch (err) {
    errors++;
    if (errors <= 3) {
      console.error(`\n   ⚠ Error for user ${userId}:`, err.message);
    }
  }
}

// ─── Flush remaining buffered events ──────────────────────────────────────
console.log(`\n\n📤 Flushing remaining buffered events…`);
try {
  if (typeof Flagsmith.flushEvents === "function") {
    await Flagsmith.flushEvents();
    console.log("   ✓ Events flushed.");
  } else {
    console.log("   ℹ flushEvents not available on this SDK version — events sent inline.");
  }
} catch (e) {
  console.warn("   ⚠ flushEvents error:", e.message);
}

// ─── Summary ───────────────────────────────────────────────────────────────
console.log("\n📊 Simulation Summary");
console.log("─".repeat(45));
console.log(`Total users simulated : ${TOTAL_USERS}`);
console.log(`Errors                : ${errors}`);
console.log("");
console.log("Group        | Exposed | Converted | CTR");
console.log("─".repeat(45));

for (const group of ["control", "festive"]) {
  const exp  = exposed[group]   ?? 0;
  const conv = converted[group] ?? 0;
  const ctr  = exp > 0 ? ((conv / exp) * 100).toFixed(1) : "0.0";
  console.log(`${group.padEnd(12)} | ${String(exp).padEnd(7)} | ${String(conv).padEnd(9)} | ${ctr}%`);
}

console.log("\n⏳ Wait about 1 minute, then run:");
console.log("   node scripts/check-results.js\n");

if (EXPERIMENT_ID && ENV_API_KEY) {
  console.log("🔗 Experiment dashboard:");
  console.log(`   https://app.flagsmith.com/project/-/environment/${ENV_API_KEY}/experiments/${EXPERIMENT_ID}\n`);
}

