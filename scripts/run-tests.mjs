/**
 * تشغيل اختبارات الوحدة (متوافق Windows/Linux).
 */
import { globSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const files = globSync("tests/unit/**/*.test.js", { cwd: root });

if (!files.length) {
  console.error("No test files found");
  process.exit(1);
}

const paths = files.map((f) => join(root, f));
const result = spawnSync(process.execPath, ["--test", ...paths], {
  stdio: "inherit",
  cwd: root,
});

process.exit(result.status ?? 1);
