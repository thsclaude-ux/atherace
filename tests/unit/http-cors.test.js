const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { withEnv } = require("../helpers/env");
const {
  resolveCorsOrigin,
  json,
  handleOptions,
} = require("../../netlify/functions/_lib/http");

describe("http CORS", () => {
  it("allows localhost when ALLOWED_ORIGIN unset", () => {
    withEnv({ ALLOWED_ORIGIN: undefined, ALLOWED_ORIGINS: undefined }, () => {
      const event = { headers: { origin: "http://localhost:8888" } };
      assert.equal(resolveCorsOrigin(event), "http://localhost:8888");
    });
  });

  it("rejects unknown origin when allowlist set", () => {
    withEnv(
      { ALLOWED_ORIGIN: "https://prod.example.com", ALLOWED_ORIGINS: undefined },
      () => {
        const event = { headers: { origin: "https://evil.com" } };
        assert.equal(resolveCorsOrigin(event), null);
      }
    );
  });

  it("allows matching production origin", () => {
    withEnv(
      { ALLOWED_ORIGIN: "https://prod.example.com", ALLOWED_ORIGINS: undefined },
      () => {
        const event = { headers: { origin: "https://prod.example.com" } };
        assert.equal(resolveCorsOrigin(event), "https://prod.example.com");
      }
    );
  });

  it("json includes Allow-Origin for allowed request", () => {
    withEnv({ ALLOWED_ORIGIN: "https://prod.example.com" }, () => {
      const event = { headers: { origin: "https://prod.example.com" } };
      const res = json(200, { ok: true }, event);
      assert.equal(
        res.headers["Access-Control-Allow-Origin"],
        "https://prod.example.com"
      );
    });
  });

  it("handleOptions returns 204", () => {
    withEnv({ ALLOWED_ORIGIN: "https://prod.example.com" }, () => {
      const event = {
        httpMethod: "OPTIONS",
        headers: { origin: "https://prod.example.com" },
      };
      const res = handleOptions(event);
      assert.equal(res.statusCode, 204);
    });
  });
});
