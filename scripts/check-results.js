/**
 * scripts/check-results.js
 * Fetches experiment results from the Flagsmith API and prints them.
 *
 * Usage (run ~1 minute after simulate.js):
 *   node scripts/check-results.js
 *
 * Required env vars (in .env):
 *   FLAGSMITH_API_KEY       — your admin API key (never commit this)
 *   FLAGSMITH_ENV_KEY       — environment key (e.g. B7mHk...)
 *   FLAGSMITH_EXPERIMENT_ID — the numeric experiment id
 */

import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, "../.env") });

const API_KEY       = process.env.FLAGSMITH_API_KEY;
const ENV_KEY       = process.env.FLAGSMITH_ENV_KEY;
const EXPERIMENT_ID = process.env.FLAGSMITH_EXPERIMENT_ID;
const PROJECT_ID    = process.env.FLAGSMITH_PROJECT_ID;

if (!API_KEY || !ENV_KEY || !EXPERIMENT_ID) {
  console.error(
    "\n❌ Missing env vars. Set in .env:\n" +
    "   FLAGSMITH_API_KEY, FLAGSMITH_ENV_KEY, FLAGSMITH_EXPERIMENT_ID\n"
  );
  process.exit(1);
}

const BASE = "https://api.flagsmith.com";
const HEADERS = {
  "Authorization": `Token ${API_KEY}`,
  "Content-Type": "application/json",
};

async function api(path, method = "GET", body) {
  const res = await fetch(`${BASE}/${path}`, {
    method,
    headers: HEADERS,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  }
  return res.json().catch(() => ({}));
}

console.log("\n🔄 Triggering results refresh…");
try {
  await api(
    `api/v1/environments/${ENV_KEY}/experiments/${EXPERIMENT_ID}/results/refresh/`,
    "POST"
  );
  console.log("   ✓ Refresh triggered (rate-limited: once every 5 minutes).");
} catch (e) {
  if (e.message.includes("429") || e.message.includes("rate")) {
    console.warn("   ⚠ Rate limited — using last cached results.");
  } else {
    console.warn("   ⚠ Refresh error:", e.message);
  }
}

console.log("\n📈 Fetching experiment results…");
const data = await api(
  `api/v1/environments/${ENV_KEY}/experiments/${EXPERIMENT_ID}/results/`
);

if (!data || !data.metrics) {
  console.log("   ℹ No results yet — the experiment may still be processing.");
  console.log("   Try again in a few minutes.");
  process.exit(0);
}

console.log("\n📊 Experiment Results");
console.log("═".repeat(55));
console.log(`Status     : ${data.status ?? "—"}`);
console.log(`Created    : ${data.created_at ?? "—"}`);

if (data.metrics?.length) {
  for (const metric of data.metrics) {
    console.log(`\nMetric: ${metric.name ?? metric.metric}`);
    console.log("─".repeat(45));
    if (metric.variations?.length) {
      for (const v of metric.variations) {
        const prob = v.win_probability != null
          ? `${(v.win_probability * 100).toFixed(1)}%`
          : "—";
        console.log(
          `  ${(v.variation_key ?? v.name ?? "?").padEnd(12)} | ` +
          `Conversions: ${String(v.conversions ?? 0).padEnd(5)} | ` +
          `Win prob: ${prob}`
        );
      }
    }
  }
} else {
  console.log("   No metric data yet.");
}

const dashboard = "https://app.flagsmith.com";
const projectSlug = PROJECT_ID ?? "-";
console.log(`\n🔗 View in dashboard:`);
console.log(`   ${dashboard}/project/${projectSlug}/environment/${ENV_KEY}/experiments/${EXPERIMENT_ID}\n`);
