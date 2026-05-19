const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { withEnvAsync } = require("../helpers/env");
const { handler } = require("../../netlify/functions/createFirstAdmin");

describe("createFirstAdmin handler", () => {
  it("rejects GET", async () => {
    await withEnvAsync({ CREATE_ADMIN_SECRET: "s" }, async () => {
      const res = await handler({
        httpMethod: "GET",
        headers: {},
        queryStringParameters: null,
        body: null,
      });
      assert.equal(res.statusCode, 405);
      const body = JSON.parse(res.body);
      assert.match(body.error, /POST/);
    });
  });

  it("rejects POST without secret header", async () => {
    await withEnvAsync({ CREATE_ADMIN_SECRET: "s" }, async () => {
      const res = await handler({
        httpMethod: "POST",
        headers: {},
        queryStringParameters: null,
        body: null,
      });
      assert.equal(res.statusCode, 403);
    });
  });
});
