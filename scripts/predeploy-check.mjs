/**
 * فحص قبل النشر: node scripts/predeploy-check.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const required = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "CREATE_ADMIN_SECRET",
  "ALLOWED_ORIGIN",
  "SESSION_SIGNING_SECRET",
];

const webKeys = [
  "FIREBASE_WEB_API_KEY",
  "FIREBASE_WEB_AUTH_DOMAIN",
  "FIREBASE_WEB_PROJECT_ID",
];

let failed = false;

for (const key of required) {
  if (!process.env[key]?.trim()) {
    console.error(`[predeploy] ناقص: ${key}`);
    failed = true;
  }
}

for (const key of webKeys) {
  if (!process.env[key]?.trim()) {
    console.error(`[predeploy] ناقص (ويب): ${key}`);
    failed = true;
  }
}

const generated = join(root, "public/js/firebase-config.generated.js");
if (!existsSync(generated)) {
  console.error("[predeploy] شغّل npm run build أولاً");
  failed = true;
} else if (readFileSync(generated, "utf8").includes("null")) {
  console.error("[predeploy] firebase-config.generated.js غير مكتمل");
  failed = true;
}

if (failed) process.exit(1);
console.log("[predeploy] OK");
