const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");

setGlobalOptions({ region: "us-central1", maxInstances: 20 });

const routes = {
  bootstrapAdmin: () => require("../../netlify/functions/bootstrapAdmin").handler,
  checkSubmission: () => require("../../netlify/functions/checkSubmission").handler,
  createFirstAdmin: () => require("../../netlify/functions/createFirstAdmin").handler,
  deleteAllParticipants: () => require("../../netlify/functions/deleteAllParticipants").handler,
  deleteCode: () => require("../../netlify/functions/deleteCode").handler,
  exportParticipants: () => require("../../netlify/functions/exportParticipants").handler,
  generateCode: () => require("../../netlify/functions/generateCode").handler,
  getParticipants: () => require("../../netlify/functions/getParticipants").handler,
  health: () => require("../../netlify/functions/health").handler,
  listCodes: () => require("../../netlify/functions/listCodes").handler,
  saveWinners: () => require("../../netlify/functions/saveWinners").handler,
  submitBets: () => require("../../netlify/functions/submitBets").handler,
  validateCode: () => require("../../netlify/functions/validateCode").handler,
};

function toNetlifyEvent(req) {
  const url = new URL(req.url, `https://${req.headers.host || "localhost"}`);
  const query = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  return {
    httpMethod: req.method,
    path: url.pathname,
    headers: req.headers,
    queryStringParameters: Object.keys(query).length ? query : null,
    body:
      req.method === "GET" || req.method === "HEAD"
        ? null
        : typeof req.body === "string"
          ? req.body
          : req.body
            ? JSON.stringify(req.body)
            : null,
    isBase64Encoded: false,
  };
}

function sendNetlifyResponse(res, result) {
  res.status(result.statusCode || 200);
  for (const [key, value] of Object.entries(result.headers || {})) {
    res.setHeader(key, value);
  }
  if (result.isBase64Encoded && result.body) {
    res.send(Buffer.from(result.body, "base64"));
    return;
  }
  res.send(result.body ?? "");
}

exports.api = onRequest({ cors: false }, async (req, res) => {
  const segments = req.path.split("/").filter(Boolean);
  const fnName = segments[segments.length - 1];

  const getHandler = routes[fnName];
  if (!getHandler) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  try {
    const handler = getHandler();
    const event = toNetlifyEvent(req);
    const result = await handler(event, {});
    sendNetlifyResponse(res, result);
  } catch (err) {
    console.error(`[api/${fnName}]`, err);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});
