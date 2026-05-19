/**
 * اختبار محلي لتنسيق صفوف التصدير (بدون Firebase).
 * التشغيل: node scripts/test-export-participants.mjs
 */
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const XLSX = require("xlsx-js-style");
const {
  HEADERS,
  buildExportRows,
} = require("../netlify/functions/_lib/participants-export.js");

const participants = {
  u1: { name: "أحمد", score: 12, registeredAt: "2026-05-18T07:30:00.000Z" },
  u2: { name: null, score: 5, registeredAt: "2026-05-18T08:00:00.000Z" },
};

const bets = {
  u1: {
    phone: "0512345678",
    rounds: [3, 5, 1, 7, 2, 8, 4],
    code: "ABC12345",
    submittedAt: "2026-05-18T07:30:00.000Z",
  },
  u2: {
    name: "سارة",
    rounds: [1, 2, 3, 4, 5, 6, 7],
    code: "XYZ98765",
    submittedAt: "2026-05-18T08:15:00.000Z",
  },
  u3: {
    phone: "0598765432",
    rounds: [10, 9, 8, 7, 6, 5, 4],
    code: "ABC12345",
    submittedAt: "2026-05-18T09:00:00.000Z",
  },
};

const codes = {
  ABC12345: { maxUses: 10, usedCount: 2 },
  XYZ98765: { maxUses: 5, usedCount: 5 },
};

const rows = buildExportRows(participants, bets, codes);
if (rows.length !== 3) {
  console.error("FAIL: expected 3 data rows, got", rows.length);
  process.exit(1);
}

if (rows[0][0] !== "0512345678") {
  console.error("FAIL: first row phone mismatch", rows[0][0]);
  process.exit(1);
}

if (rows[0][1] !== "3" || rows[0][7] !== "4") {
  console.error("FAIL: round columns mismatch", rows[0].slice(1, 8));
  process.exit(1);
}

const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...rows]);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "المشاركون");
const outPath = join(__dirname, "test-participants-export.xlsx");
writeFileSync(outPath, XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));

console.log("OK: export row shape validated.");
console.log("Wrote sample file:", outPath);
console.log("Open in Excel/LibreOffice and verify Arabic headers and phone text.");
