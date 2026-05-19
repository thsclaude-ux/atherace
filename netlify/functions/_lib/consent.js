const DEFAULT_PRIVACY_VERSION = "2026-05-18";

function getPrivacyVersion() {
  return process.env.PRIVACY_POLICY_VERSION?.trim() || DEFAULT_PRIVACY_VERSION;
}

/**
 * @returns {{ error: string } | { consentAt: string, privacyVersion: string }}
 */
function validateSubmissionConsent(body) {
  if (body?.consentAccepted !== true) {
    return { error: "يجب الموافقة على سياسة الخصوصية قبل الإرسال" };
  }
  return {
    consentAt: new Date().toISOString(),
    privacyVersion: getPrivacyVersion(),
  };
}

module.exports = {
  validateSubmissionConsent,
  getPrivacyVersion,
  DEFAULT_PRIVACY_VERSION,
};
