const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  randomCode,
  normalizeCode,
  CODE_LENGTH,
} = require("../../netlify/functions/_lib/codes");

describe("codes", () => {
  it("normalizeCode trims and uppercases", () => {
    assert.equal(normalizeCode("  ab12-34  "), "AB1234");
  });

  it("normalizeCode strips invalid characters", () => {
    assert.equal(normalizeCode("ab!@#12"), "AB12");
  });

  it("randomCode has correct length and charset", () => {
    const code = randomCode();
    assert.equal(code.length, CODE_LENGTH);
    assert.match(code, /^[A-Z0-9]+$/);
  });

  it("randomCode generates varied codes", () => {
    const set = new Set(Array.from({ length: 20 }, () => randomCode()));
    assert.ok(set.size > 1);
  });
});
