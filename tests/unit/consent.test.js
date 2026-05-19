const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { withEnv } = require("../helpers/env");
const {
  validateSubmissionConsent,
  getPrivacyVersion,
} = require("../../netlify/functions/_lib/consent");

describe("consent", () => {
  it("rejects missing consent", () => {
    const result = validateSubmissionConsent({});
    assert.equal(result.error, "يجب الموافقة على سياسة الخصوصية قبل الإرسال");
  });

  it("rejects false consent", () => {
    const result = validateSubmissionConsent({ consentAccepted: false });
    assert.ok(result.error);
  });

  it("accepts explicit true consent", () => {
    const result = validateSubmissionConsent({ consentAccepted: true });
    assert.ok(result.consentAt);
    assert.ok(result.privacyVersion);
  });

  it("uses PRIVACY_POLICY_VERSION from env", () => {
    withEnv({ PRIVACY_POLICY_VERSION: "2027-01-01" }, () => {
      assert.equal(getPrivacyVersion(), "2027-01-01");
      const result = validateSubmissionConsent({ consentAccepted: true });
      assert.equal(result.privacyVersion, "2027-01-01");
    });
  });
});
