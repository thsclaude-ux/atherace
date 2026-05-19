import { getParticipants, getPublicSettings } from "./api.js";
import { showToast } from "./toast.js";
import { watchResultsUpdates } from "./realtime.js";

const POLL_MS = 60_000;
const tbody = document.getElementById("ranking-body");
const lastUpdated = document.getElementById("last-updated");
const errorEl = document.getElementById("ranking-error");
const demoBanner = document.getElementById("demo-banner");

let demoMode = false;
let stopRealtime = () => {};

function formatTime(date) {
  return date.toLocaleTimeString("ar-SA", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function renderRows(items) {
  if (!items.length) {
    tbody.innerHTML =
      '<tr><td colspan="3" class="hint">لا يوجد مشاركون بعد</td></tr>';
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

function escapeHtml(text) {
  const d = document.createElement("div");
  d.textContent = text;
  return d.innerHTML;
}

function showError(message) {
  errorEl.textContent = message;
  errorEl.classList.toggle("hidden", !message);
}

async function refreshRanking() {
  try {
    const data = await getParticipants();
    renderRows(data.items || []);
    lastUpdated.textContent = `آخر تحديث: ${formatTime(new Date())}`;
    showError("");
  } catch (err) {
    showError(err.message || "تعذر تحميل الترتيب");
  }
}

async function init() {
  try {
    const settings = await getPublicSettings();
    demoMode = settings.demoMode === true;
    if (demoBanner) demoBanner.classList.toggle("hidden", !demoMode);
  } catch {
    /* ignore */
  }

  await refreshRanking();

  stopRealtime = watchResultsUpdates(demoMode, async () => {
    await refreshRanking();
    showToast("تم تحديث الترتيب", "info");
  });

  setInterval(refreshRanking, POLL_MS);
}

init();
