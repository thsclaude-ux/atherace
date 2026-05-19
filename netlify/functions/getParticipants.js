const { json, handleOptions } = require("./_lib/http");
const { wrapHandler } = require("./_lib/wrap-handler");
const { verifyAdmin } = require("./_lib/verify-admin");
const { dataRoot } = require("./_lib/data-root");
const { rateLimitResponse } = require("./_lib/rate-limit");

/**
 * GET /.netlify/functions/getParticipants
 */
exports.handler = wrapHandler(async (event) => {
  const opt = handleOptions(event);
  if (opt) return opt;

  if (event.httpMethod !== "GET") {
    return json(405, { error: "Method not allowed" }, event);
  }

  const limited = await rateLimitResponse(event, "getParticipants");
  if (limited) return limited;

  const admin = await verifyAdmin(event);
  const isAdmin = admin.ok;

  try {
    const root = dataRoot();
    const [participantsSnap, winnersSnap, betsSnap] = await Promise.all([
      root.child("participants").once("value"),
      root.child("winners").once("value"),
      isAdmin ? root.child("user_bets").once("value") : Promise.resolve(null),
    ]);

    const participants = participantsSnap.val() || {};
    const bets = isAdmin && betsSnap ? betsSnap.val() || {} : {};

    const items = Object.entries(participants).map(([userId, data]) => {
      const bet = bets[userId] || {};
      const item = {
        userId,
        name: data?.name ?? bet.name ?? null,
        score: Number(data?.score) || 0,
        lastScoredAt: data?.lastScoredAt ?? null,
      };
      if (isAdmin) {
        item.rounds = bet.rounds || [];
        item.code = bet.code ?? null;
        item.phone = bet.phone ?? null;
      }
      return item;
    });

    items.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.name || "").localeCompare(b.name || "", "ar");
    });

    items.forEach((item, index) => {
      item.rank = index + 1;
    });

    const winnersData = winnersSnap.exists() ? winnersSnap.val() : null;

    return json(
      200,
      {
        items,
        count: items.length,
        winners: winnersData?.rounds ?? null,
        winnersSavedAt: winnersData?.savedAt ?? null,
      },
      event
    );
  } catch (err) {
    console.error("getParticipants:", err);
    return json(500, { error: "خطأ في الخادم" }, event);
  }
});
