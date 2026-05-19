/**
 * فحص دخان سريع على موقع منشور (staging أو prod).
 *   SITE_URL=https://your-site.netlify.app node scripts/smoke-remote.mjs
 */
const base = process.env.SITE_URL?.replace(/\/$/, "");
if (!base) {
  console.error("SITE_URL مطلوب");
  process.exit(1);
}

const checks = [
  {
    name: "health",
    url: `${base}/.netlify/functions/health`,
    expect: (r, body) => r.status === 200 && body.ok === true,
  },
  {
    name: "participant page",
    url: `${base}/participant.html`,
    expect: (r) => r.status === 200 && r.headers.get("content-type")?.includes("text/html"),
  },
  {
    name: "privacy page",
    url: `${base}/privacy.html`,
    expect: (r, _b, text) =>
      r.status === 200 && (text.includes("سياسة") || text.includes("Privacy")),
  },
  {
    name: "getParticipants API",
    url: `${base}/.netlify/functions/getParticipants`,
    expect: (r, body) => r.status === 200 && Array.isArray(body.items),
  },
  {
    name: "validateCode rejects bad code",
    url: `${base}/.netlify/functions/validateCode?code=INVALID0&userId=smoke-test`,
    expect: (r) => r.status === 400 || r.status === 404,
  },
];

let failed = false;

for (const c of checks) {
  try {
    const res = await fetch(c.url, { headers: { Accept: "application/json, text/html" } });
    const text = await res.text();
    let body = {};
    try {
      body = JSON.parse(text);
    } catch {
      /* html */
    }
    const ok = c.expect(res, body, text);
    console.log(ok ? `OK  ${c.name}` : `FAIL ${c.name} (${res.status})`);
    if (!ok) failed = true;
  } catch (err) {
    console.log(`FAIL ${c.name} — ${err.message}`);
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
