const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { withEnv } = require("../helpers/env");
const {
  guardCreateAdminRequest,
} = require("../../netlify/functions/_lib/guard-create-admin");

function baseEvent(overrides = {}) {
  return {
    httpMethod: "POST",
    headers: {},
    queryStringParameters: null,
    body: null,
    ...overrides,
  };
}

describe("guardCreateAdminRequest", () => {
  it("rejects missing CREATE_ADMIN_SECRET on server", () => {
    withEnv({ CREATE_ADMIN_SECRET: undefined }, () => {
      const result = guardCreateAdminRequest(baseEvent());
      assert.equal(result.status, 503);
    });
  });

  it("rejects secret in query string", () => {
    withEnv({ CREATE_ADMIN_SECRET: "secret123" }, () => {
      const result = guardCreateAdminRequest(
        baseEvent({ queryStringParameters: { secret: "secret123" } })
      );
      assert.equal(result.status, 400);
    });
  });

  it("accepts valid header secret", () => {
    withEnv({ CREATE_ADMIN_SECRET: "secret123" }, () => {
      const result = guardCreateAdminRequest(
        baseEvent({
          headers: { "x-create-admin-secret": "secret123" },
        })
      );
      assert.equal(result, null);
    });
  });

  it("rejects wrong secret", () => {
    withEnv({ CREATE_ADMIN_SECRET: "secret123" }, () => {
      const result = guardCreateAdminRequest(
        baseEvent({
          headers: { "x-create-admin-secret": "wrong" },
        })
      );
      assert.equal(result.status, 403);
    });
  });

  it("enforces CREATE_ADMIN_ALLOWED_IP", () => {
    withEnv(
      {
        CREATE_ADMIN_SECRET: "secret123",
        CREATE_ADMIN_ALLOWED_IP: "203.0.113.10",
      },
      () => {
        const ok = guardCreateAdminRequest(
          baseEvent({
            headers: {
              "x-create-admin-secret": "secret123",
              "x-nf-client-connection-ip": "203.0.113.10",
            },
          })
        );
        assert.equal(ok, null);

        const bad = guardCreateAdminRequest(
          baseEvent({
            headers: {
              "x-create-admin-secret": "secret123",
              "x-nf-client-connection-ip": "198.51.100.1",
            },
          })
        );
        assert.equal(bad.status, 403);
      }
    );
  });
});
