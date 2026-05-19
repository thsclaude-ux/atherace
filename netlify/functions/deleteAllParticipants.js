const { json, handleOptions } = require("./_lib/http");
const { wrapHandler } = require("./_lib/wrap-handler");
const { verifyAdmin, requireWriteAdmin } = require("./_lib/verify-admin");
const { dataRoot } = require("./_lib/data-root");

/**
 * POST /.netlify/functions/deleteAllParticipants
 */
exports.handler = async (event) => {
  const opt = handleOptions(event);
  if (opt) return opt;

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" }, event);
  }

  const admin = requireWriteAdmin(await verifyAdmin(event));
  if (!admin.ok) return json(admin.status, { error: admin.error }, event);

  try {
    const root = dataRoot();
    const [participantsSnap, betsSnap] = await Promise.all([
      root.child("participants").once("value"),
      root.child("user_bets").once("value"),
    ]);

    const participantCount = participantsSnap.numChildren();
    const betsCount = betsSnap.numChildren();

    if (participantCount === 0 && betsCount === 0) {
      return json(
        200,
        {
          success: true,
          message: "لا يوجد مشاركون للمسح",
          removed: 0,
        },
        event
      );
    }

    await root.update({
      participants: null,
      user_bets: null,
      winners: null,
    });

    const codesSnap = await root.child("codes").once("value");
    const codeUpdates = {};
    codesSnap.forEach((child) => {
      const data = child.val() || {};
      codeUpdates[`codes/${child.key}/usedBy`] = null;
      codeUpdates[`codes/${child.key}/usedCount`] = 0;
    });
    if (Object.keys(codeUpdates).length) {
      await root.update(codeUpdates);
    }

    return json(
      200,
      {
        success: true,
        message: "تم مسح جميع بيانات المشاركين",
        removed: Math.max(participantCount, betsCount),
      },
      event
    );
  } catch (err) {
    console.error("deleteAllParticipants:", err);
    return json(500, { error: "خطأ في الخادم" }, event);
  }
};
