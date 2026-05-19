/**
 * إنشاء أول مسؤول محلياً (بدون Netlify)
 *
 * المتطلبات: متغيرات Firebase Admin في البيئة أو ملف .env في جذر المشروع
 *
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY
 *   FIREBASE_DATABASE_URL (اختياري)
 *   FIREBASE_ADMIN_EMAIL (اختياري، افتراضي admin@risk7.com)
 *   FIREBASE_ADMIN_PASSWORD (اختياري — وإلا تُولَّد عشوائياً)
 *
 * التشغيل:
 *   node scripts/create-first-admin.mjs
 */

import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import admin from "firebase-admin";
import { createRequire } from "node:module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const require = createRequire(import.meta.url);
const { createFirstAdmin } = require("../netlify/functions/_lib/first-admin.js");

function loadDotEnv() {
  const envPath = resolve(root, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

function initFirebase() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    console.error(
      "أضف FIREBASE_PROJECT_ID و FIREBASE_CLIENT_EMAIL و FIREBASE_PRIVATE_KEY إلى .env"
    );
    process.exit(1);
  }

  const databaseURL =
    process.env.FIREBASE_DATABASE_URL ||
    `https://${projectId}-default-rtdb.firebaseio.com`;

  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    databaseURL,
  });

  return {
    auth: admin.auth(),
    rtdb: admin.database(),
  };
}

loadDotEnv();
const { auth, rtdb } = initFirebase();

const result = await createFirstAdmin({ auth, rtdb });

if (result.alreadyExists) {
  console.log(
    `يوجد ${result.adminCount} مسؤول(ين) في /admins — لا حاجة لإنشاء جديد.`
  );
  process.exit(0);
}

console.log("\n=== تم إنشاء المسؤول الأول ===\n");
console.log("البريد:", result.email);
console.log("UID:  ", result.uid);
if (result.password) {
  console.log("كلمة المرور (احفظها الآن):", result.password);
  const envPath = resolve(root, ".env.local.admin");
  const block = [
    "# أُنشئ تلقائياً — لا ترفع هذا الملف إلى Git",
    `FIREBASE_ADMIN_EMAIL=${result.email}`,
    `FIREBASE_ADMIN_PASSWORD=${result.password}`,
    "",
  ].join("\n");
  writeFileSync(envPath, block, "utf8");
  console.log("\nتمت كتابة بيانات الدخول إلى:", envPath);
} else {
  console.log("كلمة المرور: من متغير FIREBASE_ADMIN_PASSWORD في .env");
}
console.log("\nسجّل الدخول من / (لوحة المسؤول)\n");
