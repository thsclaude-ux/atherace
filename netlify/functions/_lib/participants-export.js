const { ROUNDS } = require("./scoring");

const HEADERS = [
  "الهاتف/الاسم",
  ...Array.from({ length: ROUNDS }, (_, i) => `الشوط ${i + 1}`),
  "النقاط",
  "تاريخ التقديم",
  "الكود المستخدم",
  "محاولات متبقية",
];

const CODE_COL = 1 + ROUNDS + 2;
const PHONE_COL = 0;

function formatSubmittedAt(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function participantIdentifier(bet, participant, userId) {
  const phone = bet?.phone || participant?.phone;
  const name = bet?.name || participant?.name;
  if (phone) return String(phone);
  if (name) return String(name);
  return String(userId);
}

function codeRemaining(codes, code) {
  if (!code || !codes?.[code]) return "";
  const data = codes[code];
  const maxUses = Number(data.maxUses) || 0;
  const usedCount = Number(data.usedCount) || 0;
  return String(Math.max(0, maxUses - usedCount));
}

/**
 * يدمج participants و user_bets و codes في صفوف جاهزة لـ Excel (بدون صف الرأس).
 */
function buildExportRows(participants, bets, codes) {
  const pMap = participants || {};
  const bMap = bets || {};
  const cMap = codes || {};
  const userIds = new Set([...Object.keys(pMap), ...Object.keys(bMap)]);

  const dataRows = [];
  for (const userId of userIds) {
    const p = pMap[userId] || {};
    const bet = bMap[userId] || {};
    const rounds = Array.isArray(bet.rounds) ? bet.rounds : [];
    const code = bet.code ? String(bet.code) : "";

    const row = [
      participantIdentifier(bet, p, userId),
      ...Array.from({ length: ROUNDS }, (_, i) => {
        const v = rounds[i];
        return v !== undefined && v !== null ? String(v) : "";
      }),
      String(Number(p.score) || 0),
      formatSubmittedAt(bet.submittedAt || p.registeredAt),
      code,
      codeRemaining(cMap, code),
    ];
    dataRows.push(row);
  }

  dataRows.sort((a, b) => {
    const scoreDiff = Number(b[ROUNDS + 1]) - Number(a[ROUNDS + 1]);
    if (scoreDiff !== 0) return scoreDiff;
    return String(a[0]).localeCompare(String(b[0]), "ar");
  });

  return dataRows;
}

module.exports = {
  HEADERS,
  ROUNDS,
  CODE_COL,
  PHONE_COL,
  buildExportRows,
  formatSubmittedAt,
};
