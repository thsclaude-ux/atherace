const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { withEnvAsync } = require("../helpers/env");
const { handler } = require("../../netlify/functions/health");

describe("health handler", () => {
  it("rejects non-GET", async () => {
    const res = await handler({
      httpMethod: "POST",
      headers: {},
      path: "/.netlify/functions/health",
    });
    assert.equal(res.statusCode, 405);
  });

  it("returns 503 when Firebase env missing", async () => {
    await withEnvAsync(
      {
        FIREBASE_PROJECT_ID: undefined,
        FIREBASE_CLIENT_EMAIL: undefined,
        FIREBASE_PRIVATE_KEY: undefined,
      },
      async () => {
        const res = await handler({
          httpMethod: "GET",
          headers: {},
          path: "/.netlify/functions/health",
        });
        assert.equal(res.statusCode, 503);
        const body = JSON.parse(res.body);
        assert.equal(body.ok, false);
      }
    );
  });
});
