/**
 * بوابة Go-Live — فحوصات آلية + قائمة يدوية.
 *
 *   npm test && npm run build && npm run check:deploy
 *   SITE_URL=https://prod.netlify.app node scripts/go-live-check.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const siteUrl = process.env.SITE_URL?.replace(/\/$/, "");

const results = [];

function record(name, pass, detail = "") {
  results.push({ name, pass, detail });
  const mark = pass ? "✓" : "✗";
  console.log(`${mark} ${name}${detail ? ` — ${detail}` : ""}`);
}

async function main() {
  console.log("=== بوابة Go-Live — فحوصات آلية ===\n");

  const testRun = spawnSync(process.execPath, ["scripts/run-tests.mjs"], {
    cwd: root,
    stdio: "pipe",
    encoding: "utf8",
  });
  record("اختبارات الوحدة (npm test)", testRun.status === 0);

  const buildRun = spawnSync(process.execPath, ["scripts/generate-firebase-config.mjs"], {
    cwd: root,
    stdio: "pipe",
    encoding: "utf8",
  });
  record("بناء firebase-config", buildRun.status === 0);

  const predeployRun = spawnSync(process.execPath, ["scripts/predeploy-check.mjs"], {
    cwd: root,
    stdio: "pipe",
    encoding: "utf8",
    env: process.env,
  });
  record(
    "متغيرات الإنتاج (check:deploy)",
    predeployRun.status === 0,
    predeployRun.status !== 0 ? "املأ .env أو متغيرات Netlify" : ""
  );

  const privacyPath = join(root, "public/privacy.html");
  if (existsSync(privacyPath)) {
    const html = readFileSync(privacyPath, "utf8");
    const hasPlaceholder = html.includes("privacy@example.com");
    record(
      "بريد الخصوصية مُحدَّث",
      !hasPlaceholder,
      hasPlaceholder ? "استبدل privacy@example.com" : ""
    );
  }

  const netlifyToml = join(root, "netlify.toml");
  if (existsSync(netlifyToml)) {
    const toml = readFileSync(netlifyToml, "utf8");
    record("netlify.toml يتضمن build", toml.includes("npm run build"));
    record("netlify.toml يتضمن health/CSP", toml.includes("Content-Security-Policy"));
  }

  if (siteUrl) {
    console.log(`\n--- فحص عن بُعد: ${siteUrl} ---\n`);
    const smoke = spawnSync(
      process.execPath,
      ["scripts/smoke-remote.mjs"],
      {
        cwd: root,
        stdio: "pipe",
        encoding: "utf8",
        env: { ...process.env, SITE_URL: siteUrl },
      }
    );
    record("فحص الدخان (smoke-remote)", smoke.status === 0);
    if (smoke.status !== 0 && smoke.stderr) console.error(smoke.stderr);
  } else {
    console.log("\n(تخطّي فحص بُعد — عيّن SITE_URL لاختبار staging/prod)\n");
  }

  const failed = results.filter((r) => !r.pass).length;
  console.log(`\n=== آلياً: ${results.length - failed}/${results.length} ناجح ===\n`);

  console.log("=== قائمة يدوية (UAT) — أكّد قبل الإطلاق ===");
  const manual = [
    "تسجيل دخول المسؤول يعمل",
    "إنشاء كود واستخدامه من صفحة المشارك",
    "ترشيح كامل + موافقة الخصوصية + ظهور في الترتيب",
    "حفظ نتائج الفائزين وحساب النقاط",
    "تصدير Excel من لوحة المسؤول",
    "نسخة RTDB: npm run backup:rtdb",
    "UptimeRobot على /health",
    "Sentry DSN مفعّل (إن وُجد)",
    "CREATE_ADMIN_SECRET قوي وcreateFirstAdmin مُقيَّد",
  ];
  manual.forEach((item, i) => console.log(`  [ ] ${i + 1}. ${item}`));

  console.log("\nراجع docs/GO-LIVE.md للتفاصيل.\n");

  if (failed > 0) process.exit(1);
}

main();
