/**
 * تشغيل فحص الدخان + اختبار الحمل على عنوان واحد.
 *
 *   node scripts/run-remote-checks.mjs https://your-site.netlify.app
 *   node scripts/run-remote-checks.mjs https://your-site.netlify.app --load-duration=45
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const flags = Object.fromEntries(
  process.argv
    .slice(2)
    .filter((a) => a.startsWith("--"))
    .map((a) => {
      const [k, v] = a.replace(/^--/, "").split("=");
      return [k, v ?? "true"];
    })
);

const siteUrl = (args[0] || process.env.SITE_URL || "").replace(/\/$/, "");
if (!siteUrl) {
  console.error("الاستخدام: node scripts/run-remote-checks.mjs <SITE_URL>");
  console.error("  مثال: node scripts/run-remote-checks.mjs https://develop--mysite.netlify.app");
  process.exit(1);
}

const duration = flags["load-duration"] || process.env.LOAD_TEST_DURATION || "30";
const concurrency = flags.concurrency || process.env.LOAD_TEST_CONCURRENCY || "15";

console.log(`\n=== فحوصات بُعد: ${siteUrl} ===\n`);

const smoke = spawnSync(process.execPath, ["scripts/smoke-remote.mjs"], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, SITE_URL: siteUrl },
});

if (smoke.status !== 0) {
  console.error("\n[run-remote] فشل فحص الدخان — راجع الأعلى");
  process.exit(smoke.status ?? 1);
}

console.log("\n=== اختبار الحمل ===\n");

const load = spawnSync(process.execPath, ["scripts/load-test.mjs"], {
  cwd: root,
  stdio: "inherit",
  env: {
    ...process.env,
    LOAD_TEST_BASE_URL: siteUrl,
    LOAD_TEST_DURATION: String(duration),
    LOAD_TEST_CONCURRENCY: String(concurrency),
  },
});

process.exit(load.status ?? 1);
