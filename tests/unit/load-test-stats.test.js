const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

describe("load-test stats", () => {
  it("percentile p95", () => {
    const sorted = [10, 20, 30, 40, 50, 100, 200, 500, 1000, 2000];
    assert.equal(percentile(sorted, 50), 50);
    assert.ok(percentile(sorted, 95) >= 1000);
  });
});
