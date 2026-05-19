const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { withEnv } = require("../helpers/env");
const { getEnvironment } = require("../../netlify/functions/_lib/monitoring");

describe("monitoring", () => {
  it("getEnvironment prefers APP_ENV", () => {
    withEnv(
      {
        APP_ENV: "staging",
        CONTEXT: "production",
      },
      () => {
        assert.equal(getEnvironment(), "staging");
      }
    );
  });

  it("getEnvironment falls back to CONTEXT", () => {
    withEnv(
      {
        APP_ENV: undefined,
        CONTEXT: "deploy-preview",
        NETLIFY_CONTEXT: undefined,
      },
      () => {
        assert.equal(getEnvironment(), "deploy-preview");
      }
    );
  });
});
