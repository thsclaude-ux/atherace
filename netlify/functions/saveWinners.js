const { json, handleOptions, parseBody } = require("./_lib/http");
const { wrapHandler } = require("./_lib/wrap-handler");
const { verifyAdmin, requireWriteAdmin } = require("./_lib/verify-admin");
const { dataRoot } = require("./_lib/data-root");
const { calculateScore, validateWinnerRounds } = require("./_lib/scoring");

/**
 * POST /.netlify/functions/saveWinners
 * Body: { rounds: [n1..n7] }
 */
exports.handler = wrapHandler(async (event) => {
  const opt = handleOptions(event);
  if (opt) return opt;

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" }, event);
  }

  const admin = requireWriteAdmin(await verifyAdmin(event));
  if (!admin.ok) return json(admin.status, { error: admin.error }, event);

  const body = parseBody(event);
  if (body === null) return json(400, { error: "JSON غير صالح" }, event);

  const roundsInput = Array.isArray(body.rounds) ? body.rounds : body;
  const roundError = validateWinnerRounds(roundsInput);
  if (roundError) return json(400, { error: roundError }, event);

  const winners = roundsInput.map((n) => Number(n));
  const savedAt = new Date().toISOString();

  try {
    const root = dataRoot();
    const userBetsSnap = await root.child("user_bets").once("value");
    const updates = {
      winners: { rounds: winners, savedAt, savedBy: admin.uid },
    };

    let scoredCount = 0;

    userBetsSnap.forEach((child) => {
      const userId = child.key;
      const betData = child.val() || {};
      const bets = betData.rounds || [];
      const score = calculateScore(bets, winners);
      const existingName = betData.name || betData.phone || null;

      updates[`participants/${userId}/score`] = score;
      updates[`participants/${userId}/userId`] = userId;
      updates[`participants/${userId}/lastScoredAt`] = savedAt;
      if (existingName) {
        updates[`participants/${userId}/name`] = existingName;
      }
      scoredCount += 1;
    });

    await root.update(updates);

    return json(
      200,
      {
        success: true,
        winners: { rounds: winners, savedAt },
        participantsUpdated: scoredCount,
      },
      event
    );
  } catch (err) {
    console.error("saveWinners:", err);
    return json(500, { error: "خطأ في الخادم" }, event);
  }
});
