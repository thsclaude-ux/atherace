const { json, handleOptions } = require("./_lib/http");
const { wrapHandler } = require("./_lib/wrap-handler");
const { verifyAdmin } = require("./_lib/verify-admin");
const { dataRoot } = require("./_lib/data-root");

/**
 * GET /.netlify/functions/listCodes — مسؤول فقط
 */
exports.handler = async (event) => {
  const opt = handleOptions(event);
  if (opt) return opt;

  if (event.httpMethod !== "GET") {
    return json(405, { error: "Method not allowed" }, event);
  }

  const admin = await verifyAdmin(event);
  if (!admin.ok) return json(admin.status, { error: admin.error }, event);

  try {
    const snap = await dataRoot().child("codes").once("value");
    const val = snap.val() || {};

    const items = Object.entries(val).map(([code, data]) => {
      const maxUses = Number(data?.maxUses) || 0;
      const usedCount = Number(data?.usedCount) || 0;
      return {
        code,
        maxUses,
        usedCount,
        remaining: Math.max(0, maxUses - usedCount),
        createdAt: data?.createdAt ?? null,
      };
    });

    items.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    return json(200, { items, count: items.length }, event);
  } catch (err) {
    console.error("listCodes:", err);
    return json(500, { error: "خطأ في الخادم" }, event);
  }
};
