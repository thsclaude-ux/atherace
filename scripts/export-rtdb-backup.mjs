/**
 * نسخة احتياطية JSON من Firebase RTDB (محلياً أو قبل الحدث).
 *
 *   node scripts/export-rtdb-backup.mjs
 *   node scripts/export-rtdb-backup.mjs --out backups/custom.json
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import admin from "firebase-admin";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

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

function parseArgs() {
  const args = process.argv.slice(2);
  let out = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--out" && args[i + 1]) {
      out = resolve(root, args[++i]);
    }
  }
  return { out };
}

function initFirebase() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const databaseURL =
    process.env.FIREBASE_DATABASE_URL ||
    (projectId ? `https://${projectId}-default-rtdb.firebaseio.com` : null);

  if (!projectId || !clientEmail || !privateKey) {
    console.error("أضف FIREBASE_* إلى .env");
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    databaseURL,
  });
  return admin.database();
}

function timestamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

loadDotEnv();
const { out: outArg } = parseArgs();
const db = initFirebase();

const snap = await db.ref("/").once("value");
const data = snap.val() || {};

const backupDir = resolve(root, "backups");
mkdirSync(backupDir, { recursive: true });
const outPath = outArg || resolve(backupDir, `rtdb_${timestamp()}.json`);

writeFileSync(outPath, JSON.stringify(data, null, 2), "utf8");

const keys = Object.keys(data);
console.log("OK: RTDB backup written to", outPath);
console.log("Top-level keys:", keys.length ? keys.join(", ") : "(empty)");

process.exit(0);
