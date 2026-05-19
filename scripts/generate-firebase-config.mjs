/**
 * يولّد public/js/firebase-config.generated.js من متغيرات البيئة أو .env
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const outPath = join(root, "public/js/firebase-config.generated.js");
const deployMode = process.argv.includes("--deploy");
const DEFAULT_PROJECT = "atherace-109b8";

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

loadDotEnv();

const keys = {
  apiKey: "FIREBASE_WEB_API_KEY",
  authDomain: "FIREBASE_WEB_AUTH_DOMAIN",
  projectId: "FIREBASE_WEB_PROJECT_ID",
  databaseURL: "FIREBASE_WEB_DATABASE_URL",
  storageBucket: "FIREBASE_WEB_STORAGE_BUCKET",
  messagingSenderId: "FIREBASE_WEB_MESSAGING_SENDER_ID",
  appId: "FIREBASE_WEB_APP_ID",
  measurementId: "FIREBASE_WEB_MEASUREMENT_ID",
};

const requiredWeb = [
  "FIREBASE_WEB_API_KEY",
  "FIREBASE_WEB_AUTH_DOMAIN",
  "FIREBASE_WEB_PROJECT_ID",
  "FIREBASE_WEB_APP_ID",
];

const config = {};
const missing = [];
for (const [field, envKey] of Object.entries(keys)) {
  const val = process.env[envKey]?.trim();
  if (val) config[field] = val;
  else if (requiredWeb.includes(envKey)) missing.push(envKey);
}

const isNetlifyBuild =
  process.env.NETLIFY === "true" || process.env.CONTEXT === "production";

if (missing.length && (isNetlifyBuild || deployMode)) {
  console.error(
    "[build] متغيرات Firebase Web ناقصة:\n  - " + missing.join("\n  - ")
  );
  if (deployMode && !existsSync(resolve(root, ".env"))) {
    console.error(
      "[build] أنشئ ملف .env في جذر المشروع (انسخ من .env.example واملأ القيم)."
    );
  }
  process.exit(1);
}

mkdirSync(dirname(outPath), { recursive: true });

const body = missing.length
  ? `// لم تُضبط متغيرات FIREBASE_WEB_* — استخدم firebase-config.local.js للتطوير
export const firebaseConfig = null;
`
  : `// مُولَّد تلقائياً — لا تعدّل يدوياً
export const firebaseConfig = ${JSON.stringify(config, null, 2)};
`;

writeFileSync(outPath, body, "utf8");
console.log(
  missing.length
    ? "[build] firebase-config.generated.js (فارغ — تطوير محلي)"
    : "[build] firebase-config.generated.js OK"
);

export { DEFAULT_PROJECT };
