/**
 * scripts/simulate.js
 * FestiveCart — Traffic Simulator
 *
 * Simulates 300 users visiting the shop during the Christmas festival range
 * (2026-12-22). Each user gets a unique identifier, evaluates
 * `festive_theme_experiment` via getExperimentFlag() (recording exposure),
 * and some trigger `add_to_cart_click` (higher CTR for `festive`).
 *
 * Usage:
 *   node scripts/simulate.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createFlagsmithInstance } from "@flagsmith/flagsmith";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "../.env");

// Load .env without external dependencies
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (key && !(key in process.env)) {
      process.env[key] = val;
    }
  }
}

const ENV_KEY = process.env.VITE_FLAGSMITH_ENVIRONMENT_KEY || process.env.FLAGSMITH_ENV_KEY;
if (!ENV_KEY || ENV_KEY === "your_client_side_environment_key_here") {
  console.error("❌ VITE_FLAGSMITH_ENVIRONMENT_KEY not set in .env");
  process.exit(1);
}

const TOTAL_USERS    = 300;
const BATCH_SIZE     = 15;
const FESTIVE_CTR    = 0.45;
const CONTROL_CTR    = 0.25;
const FLAG_KEY       = "festive_theme_experiment";
const EVENT_NAME     = "add_to_cart_click";
const SIMULATED_DATE = "2026-12-22"; // Christmas range

const exposed   = { control: 0, festive: 0 };
const converted = { control: 0, festive: 0 };
let errors = 0;

function makeUserId(i) {
  return `sim_${SIMULATED_DATE}_${Date.now()}_${String(i).padStart(4, "0")}`;
}

async function simulateUser(i) {
  const userId = makeUserId(i);
  const client = createFlagsmithInstance();
  try {
    await client.init({
      environmentID: ENV_KEY,
      fetch: globalThis.fetch,
      enableEvents: true,
      identity: userId,
      defaultFlags: {
        festive_mode_enabled: { enabled: true, value: null },
        [FLAG_KEY]: { enabled: true, value: "control" },
      },
    });

    const flag = client.getExperimentFlag(FLAG_KEY);
    const variation = String(flag?.value ?? "control");
    exposed[variation] = (exposed[variation] ?? 0) + 1;

    const ctr = variation === "festive" ? FESTIVE_CTR : CONTROL_CTR;
    if (Math.random() < ctr) {
      client.trackEvent(EVENT_NAME);
      converted[variation] = (converted[variation] ?? 0) + 1;
    }

    await client.flushEvents();
    await client.close(3000);
  } catch (err) {
    errors++;
    if (errors <= 3) {
      console.error(`\n   ⚠ Error for ${userId}:`, err.message);
    }
  }
}

console.log(`\n🎄 FestiveCart Traffic Simulator`);
console.log(`   Simulating ${TOTAL_USERS} users on ${SIMULATED_DATE} (Christmas)\n`);

for (let start = 0; start < TOTAL_USERS; start += BATCH_SIZE) {
  const batch = [];
  for (let i = start; i < Math.min(start + BATCH_SIZE, TOTAL_USERS); i++) {
    batch.push(simulateUser(i));
  }
  await Promise.all(batch);
  process.stdout.write(`   ✓ Processed ${Math.min(start + BATCH_SIZE, TOTAL_USERS)}/${TOTAL_USERS} users\r`);
}

console.log("\n\n📊 Simulation Summary");
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

console.log("\n🔗 Experiment dashboard:");
console.log("   https://app.flagsmith.com/project/56662/environment/DabqqdUmK9XKUF4GqvhqEi/experiments/707\n");
