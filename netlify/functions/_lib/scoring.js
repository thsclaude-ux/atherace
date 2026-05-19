const ROUNDS = 7;

/**
 * نقطة واحدة لكل شوط يطابق فيه توقع المشارك النتيجة الرسمية.
 */
function calculateScore(bets, winners) {
  if (!Array.isArray(bets) || !Array.isArray(winners)) return 0;
  let score = 0;
  for (let i = 0; i < ROUNDS; i++) {
    const bet = Number(bets[i]);
    const win = Number(winners[i]);
    if (!Number.isNaN(bet) && !Number.isNaN(win) && bet === win) {
      score += 1;
    }
  }
  return score;
}

function validateWinnerRounds(rounds) {
  if (!Array.isArray(rounds) || rounds.length !== ROUNDS) {
    return "يجب إرسال 7 أرقام لنتائج الأشواط";
  }
  const normalized = [];
  for (let i = 0; i < ROUNDS; i++) {
    const n = Number(rounds[i]);
    if (!Number.isFinite(n)) return `الشوط ${i + 1} يجب أن يكون رقماً`;
    normalized.push(n);
  }
  return null;
}

module.exports = { calculateScore, validateWinnerRounds, ROUNDS };
