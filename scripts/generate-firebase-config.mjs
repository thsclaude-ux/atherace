/**
 * يولّد public/js/firebase-config.generated.js من متغيرات Netlify عند البناء.
 * محلياً: npm run build (اختياري) أو استخدم firebase-config.local.js
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "../public/js/firebase-config.generated.js");

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

const config = {};
const missing = [];
for (const [field, envKey] of Object.entries(keys)) {
  const val = process.env[envKey]?.trim();
  if (val) config[field] = val;
  else missing.push(envKey);
}

const isNetlifyBuild =
  process.env.NETLIFY === "true" || process.env.CONTEXT === "production";

if (missing.length && isNetlifyBuild) {
  console.error(
    "[build] متغيرات Firebase Web ناقصة على Netlify:\n  - " +
      missing.join("\n  - ")
  );
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
