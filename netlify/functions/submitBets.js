const { json, handleOptions, parseBody } = require("./_lib/http");
const { wrapHandler } = require("./_lib/wrap-handler");
const { dataRoot } = require("./_lib/data-root");
const { normalizeCode, CODE_LENGTH } = require("./_lib/codes");
const { ROUNDS } = require("./_lib/scoring");
const { rateLimitResponse } = require("./_lib/rate-limit");
const {
  extractSessionToken,
  verifySessionToken,
} = require("./_lib/session-token");
const { validateSubmissionConsent } = require("./_lib/consent");

const MIN_HORSE = 1;
const MAX_HORSE = 10;

function validateBetRounds(rounds) {
  if (!Array.isArray(rounds) || rounds.length !== ROUNDS) {
    return { error: "يجب اختيار 7 أشواط" };
  }
  const normalized = [];
  for (let i = 0; i < ROUNDS; i++) {
    const n = Number(rounds[i]);
    if (!Number.isInteger(n) || n < MIN_HORSE || n > MAX_HORSE) {
      return {
        error: `الشوط ${i + 1}: اختر رقماً بين ${MIN_HORSE} و ${MAX_HORSE}`,
      };
    }
    normalized.push(n);
  }
  return { normalized };
}

/**
 * POST /.netlify/functions/submitBets
 * Body: { code, userId, rounds, name?, phone?, consentAccepted: true }
 * Authorization: Bearer <sessionToken> من validateCode
 */
exports.handler = wrapHandler(async (event) => {
  const opt = handleOptions(event);
  if (opt) return opt;

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" }, event);
  }

  const limited = await rateLimitResponse(event, "submitBets");
  if (limited) return limited;

  const body = parseBody(event);
  if (body === null) return json(400, { error: "JSON غير صالح" }, event);

  const code = normalizeCode(body.code);
  if (!code || code.length !== CODE_LENGTH) {
    return json(400, { error: `الكود يجب أن يكون ${CODE_LENGTH} أحرفاً` }, event);
  }

  const userId = String(body.userId ?? "").trim();
  if (!userId || userId.length > 128) {
    return json(400, { error: "معرف المستخدم مطلوب" }, event);
  }

  const limitedUser = await rateLimitResponse(event, "submitBets", userId);
  if (limitedUser) return limitedUser;

  const token = extractSessionToken(event, body);
  const session = verifySessionToken(token);
  if (!session || session.userId !== userId || session.code !== code) {
    return json(
      403,
      { error: "جلسة غير صالحة — تحقق من الكود مجدداً" },
      event
    );
  }

  const roundResult = validateBetRounds(body.rounds);
  if (roundResult.error) return json(400, { error: roundResult.error }, event);
  const rounds = roundResult.normalized;

  const name = String(body.name ?? "").trim().slice(0, 80) || null;
  const phone = String(body.phone ?? "").trim().slice(0, 20) || null;

  const consent = validateSubmissionConsent(body);
  if (consent.error) return json(400, { error: consent.error }, event);

  try {
    const root = dataRoot();
    const codeRef = root.child(`codes/${code}`);
    const userBetRef = root.child(`user_bets/${userId}`);

    const [codeSnap, userBetSnap] = await Promise.all([
      codeRef.once("value"),
      userBetRef.once("value"),
    ]);

    if (!codeSnap.exists()) {
      return json(404, { error: "الكود غير موجود" }, event);
    }

    if (userBetSnap.exists()) {
      return json(
        409,
        {
          error: "لقد قدّمت ترشيحاتك مسبقاً",
          alreadySubmitted: true,
        },
        event
      );
    }

    const codeData = codeSnap.val();
    const usedBy = codeData.usedBy || {};
    const sessionRow = usedBy[userId];

    if (!sessionRow?.validatedAt) {
      return json(403, { error: "يجب التحقق من الكود أولاً" }, event);
    }

    if (sessionRow.submitted) {
      return json(
        409,
        {
          error: "قدّمت ترشيحاتك لهذا الكود مسبقاً",
          alreadySubmitted: true,
        },
        event
      );
    }

    const submittedAt = new Date().toISOString();
    const betRecord = {
      code,
      userId,
      rounds,
      name,
      phone,
      submittedAt,
      consentAt: consent.consentAt,
      privacyVersion: consent.privacyVersion,
    };

    const tx = await codeRef.child(`usedBy/${userId}`).transaction((current) => {
      if (!current?.validatedAt || current.submitted) return;
      return { ...current, submitted: true, submittedAt };
    });

    if (!tx.committed) {
      return json(
        409,
        {
          error: "قدّمت ترشيحاتك لهذا الكود مسبقاً",
          alreadySubmitted: true,
        },
        event
      );
    }

    await root.update({
      [`user_bets/${userId}`]: betRecord,
      [`participants/${userId}`]: {
        userId,
        name: name || phone || null,
        score: 0,
        registeredAt: submittedAt,
      },
    });

    return json(
      201,
      {
        success: true,
        userId,
        code,
        message: "تم حفظ ترشيحاتك بنجاح",
      },
      event
    );
  } catch (err) {
    console.error("submitBets:", err);
    return json(500, { error: "خطأ في الخادم" }, event);
  }
});
