let sentry = null;
let initAttempted = false;

function getEnvironment() {
  return (
    process.env.APP_ENV?.trim() ||
    process.env.CONTEXT?.trim() ||
    process.env.NETLIFY_CONTEXT?.trim() ||
    process.env.NODE_ENV ||
    "development"
  );
}

function initMonitoring() {
  if (initAttempted) return;
  initAttempted = true;

  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return;

  try {
    const Sentry = require("@sentry/node");
    Sentry.init({
      dsn,
      environment: getEnvironment(),
      release: process.env.COMMIT_REF || process.env.NETLIFY_COMMIT || undefined,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0),
    });
    sentry = Sentry;
  } catch (err) {
    console.warn("[monitoring] Sentry unavailable:", err.message);
  }
}

function functionNameFromEvent(event) {
  const path = event?.path || "";
  const match = path.match(/\/\.netlify\/functions\/([^/]+)/);
  return match ? match[1] : "unknown";
}

function captureException(err, event) {
  initMonitoring();
  if (!sentry || !err) return;

  sentry.withScope((scope) => {
    scope.setTag("function", functionNameFromEvent(event));
    scope.setTag("environment", getEnvironment());
    if (event?.httpMethod) {
      scope.setContext("request", {
        method: event.httpMethod,
        path: event.path,
      });
    }
    sentry.captureException(err);
  });
}

async function flushMonitoring(timeoutMs = 2000) {
  if (!sentry) return;
  try {
    await sentry.close(timeoutMs);
  } catch {
    /* ignore */
  }
}

module.exports = {
  initMonitoring,
  captureException,
  flushMonitoring,
  getEnvironment,
};
