import { getParticipants, getPublicSettings } from "./api.js";

const tbody = document.getElementById("print-tbody");
const subtitle = document.getElementById("print-subtitle");
const footer = document.getElementById("print-footer");
const demoBadge = document.getElementById("print-demo-badge");
const winnersSection = document.getElementById("print-winners-section");
const winnersGrid = document.getElementById("winners-grid");
const titleEl = document.getElementById("print-title");

document.getElementById("print-btn").addEventListener("click", () => window.print());

function escapeHtml(text) {
  const d = document.createElement("div");
  d.textContent = text;
  return d.innerHTML;
}

function renderWinners(rounds) {
  if (!Array.isArray(rounds) || !rounds.length) {
    winnersSection.classList.add("hidden");
    return;
  }
  winnersSection.classList.remove("hidden");
  winnersGrid.innerHTML = rounds
    .map(
      (n, i) =>
        `<span><small>ش${i + 1}</small><br><strong>${escapeHtml(String(n))}</strong></span>`
    )
    .join("");
}

function renderTable(items) {
  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="3">لا يوجد مشاركون</td></tr>';
    return;
  }
  tbody.innerHTML = items
    .map(
      (row) => `
    <tr>
      <td>${row.rank}</td>
      <td>${escapeHtml(row.name || "—")}</td>
      <td>${row.points}</td>
    </tr>`
    )
    .join("");
}

async function load() {
  try {
    const [settings, data] = await Promise.all([
      getPublicSettings(),
      getParticipants(),
    ]);

    if (settings.titleAr) titleEl.textContent = settings.titleAr;
    demoBadge.classList.toggle("hidden", !settings.demoMode);

    const savedAt = data.winnersSavedAt
      ? new Date(data.winnersSavedAt).toLocaleString("ar-SA")
      : null;
    subtitle.textContent = savedAt
      ? `آخر تحديث للنتائج: ${savedAt}`
      : "الجدول النهائي للمتسابقين";

    renderWinners(data.winners);
    renderTable(data.items || []);

    footer.textContent = `طُبع في ${new Date().toLocaleString("ar-SA")}${
      settings.demoMode ? " — وضع اختبار" : ""
    }`;
  } catch (err) {
    subtitle.textContent = err.message || "تعذر تحميل البيانات";
    tbody.innerHTML = `<tr><td colspan="3">${escapeHtml(err.message || "خطأ")}</td></tr>`;
  }
}

load();
