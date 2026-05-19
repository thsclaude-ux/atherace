/**
 * اختبار حمل خفيف عبر fetch (بدون k6).
 *
 *   set LOAD_TEST_BASE_URL=https://your-staging.netlify.app
 *   npm run load-test
 *
 *   npm run load-test -- --duration=60 --concurrency=25
 */
import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";

function parseArgs() {
  const opts = {
    base: process.env.LOAD_TEST_BASE_URL?.replace(/\/$/, "") || "",
    duration: Number(process.env.LOAD_TEST_DURATION || 30),
    concurrency: Number(process.env.LOAD_TEST_CONCURRENCY || 15),
  };
  for (let i = 2; i < process.argv.length; i++) {
    const a = process.argv[i];
    if (a.startsWith("--base=")) opts.base = a.slice(7).replace(/\/$/, "");
    else if (a.startsWith("--duration=")) opts.duration = Number(a.slice(11));
    else if (a.startsWith("--concurrency=")) opts.concurrency = Number(a.slice(14));
  }
  return opts;
}

const SCENARIOS = [
  {
    name: "health",
    weight: 1,
    path: () => "/.netlify/functions/health",
  },
  {
    name: "getParticipants",
    weight: 3,
    path: () => "/.netlify/functions/getParticipants",
  },
  {
    name: "checkSubmission",
    weight: 2,
    path: () =>
      `/.netlify/functions/checkSubmission?code=LOADTEST1&userId=${randomUUID()}`,
  },
  {
    name: "validateCode",
    weight: 2,
    path: () =>
      `/.netlify/functions/validateCode?code=LOADTEST1&userId=${randomUUID()}`,
  },
];

function pickScenario() {
  const total = SCENARIOS.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const s of SCENARIOS) {
    r -= s.weight;
    if (r <= 0) return s;
  }
  return SCENARIOS[0];
}

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

async function oneRequest(base) {
  const scenario = pickScenario();
  const url = `${base}${scenario.path()}`;
  const start = performance.now();
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    const ms = performance.now() - start;
    return {
      scenario: scenario.name,
      status: res.status,
      ms,
      ok: res.status < 500,
    };
  } catch (err) {
    return {
      scenario: scenario.name,
      status: 0,
      ms: performance.now() - start,
      ok: false,
      error: err.message,
    };
  }
}

async function worker(base, endAt, stats) {
  while (Date.now() < endAt) {
    const r = await oneRequest(base);
    stats.total += 1;
    if (!r.ok) stats.errors5xx += 1;
    if (r.status === 429) stats.rateLimited += 1;
    if (r.status >= 400 && r.status < 500 && r.status !== 429) stats.client4xx += 1;
    stats.latencies.push(r.ms);
    const bucket = stats.byScenario[r.scenario] || {
      total: 0,
      errors5xx: 0,
      rateLimited: 0,
    };
    bucket.total += 1;
    if (!r.ok) bucket.errors5xx += 1;
    if (r.status === 429) bucket.rateLimited += 1;
    stats.byScenario[r.scenario] = bucket;
  }
}

async function main() {
  const { base, duration, concurrency } = parseArgs();
  if (!base) {
    console.error(
      "حدّد عنوان الموقع:\n  LOAD_TEST_BASE_URL=https://staging.example.netlify.app npm run load-test"
    );
    process.exit(1);
  }

  console.log(`[load-test] ${base}`);
  console.log(`[load-test] duration=${duration}s concurrency=${concurrency}`);

  const stats = {
    total: 0,
    errors5xx: 0,
    rateLimited: 0,
    client4xx: 0,
    latencies: [],
    byScenario: {},
  };

  const endAt = Date.now() + duration * 1000;
  const workers = Array.from({ length: concurrency }, () =>
    worker(base, endAt, stats)
  );
  await Promise.all(workers);

  const sorted = [...stats.latencies].sort((a, b) => a - b);
  const p50 = percentile(sorted, 50);
  const p95 = percentile(sorted, 95);
  const p99 = percentile(sorted, 99);
  const errRate = stats.total ? (stats.errors5xx / stats.total) * 100 : 0;

  console.log("\n--- النتائج ---");
  console.log(`طلبات: ${stats.total}`);
  console.log(`أخطاء 5xx: ${stats.errors5xx} (${errRate.toFixed(2)}%)`);
  console.log(`429 Rate limit: ${stats.rateLimited}`);
  console.log(`4xx أخرى: ${stats.client4xx}`);
  console.log(`زمن الاستجابة ms — p50: ${p50.toFixed(0)}  p95: ${p95.toFixed(0)}  p99: ${p99.toFixed(0)}`);

  for (const [name, b] of Object.entries(stats.byScenario)) {
    console.log(
      `  ${name}: ${b.total} req, 5xx=${b.errors5xx}, 429=${b.rateLimited}`
    );
  }

  const thresholds = {
    max5xxPercent: 1,
    maxP95Ms: 2000,
  };

  let pass = true;
  if (errRate > thresholds.max5xxPercent) {
    console.error(`\nFAIL: نسبة 5xx > ${thresholds.max5xxPercent}%`);
    pass = false;
  }
  if (p95 > thresholds.maxP95Ms) {
    console.error(`\nFAIL: p95 > ${thresholds.maxP95Ms}ms`);
    pass = false;
  }
  if (pass) console.log("\nPASS: ضمن العتبات المستهدفة");
  process.exit(pass ? 0 : 1);
}

main();
