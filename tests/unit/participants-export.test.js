const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  buildExportRows,
  formatSubmittedAt,
} = require("../../netlify/functions/_lib/participants-export");

const participants = {
  u1: { name: "أحمد", score: 12, registeredAt: "2026-05-18T07:30:00.000Z" },
  u2: { score: 5, registeredAt: "2026-05-18T08:00:00.000Z" },
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

describe("participants-export", () => {
  it("buildExportRows merges all user ids", () => {
    const rows = buildExportRows(participants, bets, codes);
    assert.equal(rows.length, 3);
  });

  it("buildExportRows sorts by score descending", () => {
    const rows = buildExportRows(participants, bets, codes);
    assert.equal(rows[0][0], "0512345678");
    assert.equal(rows[0][8], "12");
  });

  it("buildExportRows includes round columns", () => {
    const rows = buildExportRows(participants, bets, codes);
    assert.equal(rows[0][1], "3");
    assert.equal(rows[0][7], "4");
  });

  it("codeRemaining in export row", () => {
    const rows = buildExportRows(participants, bets, codes);
    const abcRow = rows.find((r) => r[10] === "ABC12345");
    assert.equal(abcRow[11], "8");
    const xyzRow = rows.find((r) => r[10] === "XYZ98765");
    assert.equal(xyzRow[11], "0");
  });

  it("formatSubmittedAt formats ISO date", () => {
    const s = formatSubmittedAt("2026-05-18T07:30:00.000Z");
    assert.match(s, /^2026-05-18 \d{2}:\d{2}$/);
  });
});
