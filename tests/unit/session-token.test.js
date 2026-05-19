const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { withEnv } = require("../helpers/env");
const {
  createSessionToken,
  verifySessionToken,
  extractSessionToken,
} = require("../../netlify/functions/_lib/session-token");

describe("session-token", () => {
  it("creates and verifies token", () => {
    withEnv({ SESSION_SIGNING_SECRET: "test-secret-key-32chars-min!!" }, () => {
      const token = createSessionToken({ userId: "u1", code: "ABCD1234" });
      assert.ok(token);
      const payload = verifySessionToken(token);
      assert.deepEqual(payload, { userId: "u1", code: "ABCD1234" });
    });
  });

  it("rejects tampered token", () => {
    withEnv({ SESSION_SIGNING_SECRET: "test-secret-key-32chars-min!!" }, () => {
      const token = createSessionToken({ userId: "u1", code: "ABCD1234" });
      const bad = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");
      assert.equal(verifySessionToken(bad), null);
    });
  });

  it("extractSessionToken from Authorization header", () => {
    const event = {
      headers: { authorization: "Bearer my.jwt.token" },
    };
    assert.equal(extractSessionToken(event, null), "my.jwt.token");
  });

  it("extractSessionToken from body fallback", () => {
    const event = { headers: {} };
    assert.equal(
      extractSessionToken(event, { sessionToken: "from-body" }),
      "from-body"
    );
  });

  it("returns null without secret", () => {
    withEnv(
      { SESSION_SIGNING_SECRET: undefined, CREATE_ADMIN_SECRET: undefined },
      () => {
        assert.equal(createSessionToken({ userId: "u", code: "X" }), null);
      }
    );
  });
});
