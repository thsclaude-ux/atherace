import {
  saveWinners,
  generateCode,
  listCodes,
  deleteCode,
  getParticipants,
  deleteAllParticipants,
  exportParticipants,
} from "./api.js";
import {
  watchAdminAuth,
  loginAdmin,
  logoutAdmin,
  refreshToken,
  sendAdminPasswordReset,
} from "./admin-auth.js";
import { showToast } from "./toast.js";
import { applyI18n, toggleLang, t } from "./i18n.js";
import { confirmDanger } from "./confirm-danger.js";

const ROUNDS = 7;
let session = null;
let activeTab = "winners";

const loginSection = document.getElementById("login-section");
const dashboardSection = document.getElementById("dashboard-section");
const logoutBtn = document.getElementById("logout-btn");

function showDashboard(show) {
  loginSection.classList.toggle("hidden", show);
  dashboardSection.classList.toggle("hidden", !show);
  logoutBtn.classList.toggle("hidden", !show);
}

document.getElementById("lang-toggle")?.addEventListener("click", () => {
  toggleLang();
  applyI18n();
  document.getElementById("lang-toggle").textContent = t("lang");
});

watchAdminAuth(async (s) => {
  session = s;
  if (s) {
    showDashboard(true);
    await loadActiveTab();
  } else {
    showDashboard(false);
  }
});

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await loginAdmin(
      document.getElementById("admin-email").value.trim(),
      document.getElementById("admin-password").value
    );
    showToast("تم تسجيل الدخول", "success");
  } catch (err) {
    showToast(err.message || "فشل تسجيل الدخول", "error");
  }
});

document.getElementById("forgot-password-btn")?.addEventListener("click", async () => {
  const email = document.getElementById("admin-email").value.trim();
  if (!email) {
    showToast("أدخل البريد أولاً", "error");
    return;
  }
  try {
    await sendAdminPasswordReset(email);
    showToast("تم إرسال رابط إعادة التعيين إلى بريدك", "success");
  } catch (err) {
    showToast(err.message || "تعذر إرسال البريد", "error");
  }
});

logoutBtn.addEventListener("click", () => logoutAdmin());

async function getToken() {
  if (!session?.user) return null;
  return refreshToken();
}

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    activeTab = btn.getAttribute("data-tab");
    document.querySelectorAll(".tab-btn").forEach((b) => {
      const on = b.getAttribute("data-tab") === activeTab;
      b.classList.toggle("active", on);
    });
    document.querySelectorAll(".tab-panel").forEach((panel) => {
      panel.classList.toggle("hidden", !panel.id.endsWith(activeTab));
    });
    await loadActiveTab();
  });
});

async function loadActiveTab() {
  if (!session) return;
  if (activeTab === "winners") await loadWinnersForm();
  else if (activeTab === "codes") await loadCodes();
  else if (activeTab === "participants") await loadParticipants();
}

async function loadWinnersForm() {
  const token = await getToken();
  if (!token) return;
  const meta = document.getElementById("winners-saved-meta");
  try {
    const data = await getParticipants(token);
    if (Array.isArray(data.winners) && data.winners.length === ROUNDS) {
      for (let i = 0; i < ROUNDS; i++) {
        const input = document.getElementById(`winner-${i + 1}`);
        if (input) input.value = data.winners[i];
      }
    }
    if (meta) {
      if (data.winnersSavedAt) {
        const when = new Date(data.winnersSavedAt).toLocaleString();
        meta.textContent = `${t("winnersSavedAt")} ${when}`;
        meta.classList.remove("hidden");
      } else {
        meta.textContent = t("winnersNotSaved");
        meta.classList.remove("hidden");
      }
    }
  } catch (err) {
    console.warn(err);
    if (meta) meta.classList.add("hidden");
  }
}

document.getElementById("save-winners-btn").addEventListener("click", async () => {
  const token = await getToken();
  if (!token) {
    showToast("انتهت الجلسة", "error");
    return;
  }
  const rounds = [];
  for (let i = 1; i <= ROUNDS; i++) {
    const val = document.getElementById(`winner-${i}`).value;
    if (val === "" || Number.isNaN(Number(val))) {
      showToast(`أدخل رقماً للشوط ${i}`, "error");
      return;
    }
    rounds.push(Number(val));
  }
  const btn = document.getElementById("save-winners-btn");
  btn.disabled = true;
  try {
    const result = await saveWinners(token, rounds);
    showToast(
      `تم الحفظ — ${result.participantsUpdated ?? 0} مشارك`,
      "success"
    );
    await loadWinnersForm();
  } catch (err) {
    showToast(err.message || "فشل الحفظ", "error");
  } finally {
    btn.disabled = false;
  }
});

document.getElementById("generate-code-btn").addEventListener("click", async () => {
  const token = await getToken();
  if (!token) return;
  const maxUses = parseInt(document.getElementById("max-uses").value, 10);
  if (!Number.isInteger(maxUses) || maxUses < 1) {
    showToast("أدخل maxUses صالحاً", "error");
    return;
  }
  const btn = document.getElementById("generate-code-btn");
  btn.disabled = true;
  try {
    const result = await generateCode(token, maxUses);
    document.getElementById("generated-code-value").textContent = result.code;
    document.getElementById("generated-code-box").classList.remove("hidden");
    showToast("تم إنشاء الكود", "success");
  } catch (err) {
    showToast(err.message || "فشل الإنشاء", "error");
  } finally {
    btn.disabled = false;
  }
});

document.getElementById("refresh-codes-btn").addEventListener("click", loadCodes);

async function loadCodes() {
  const token = await getToken();
  const tbody = document.getElementById("codes-tbody");
  tbody.innerHTML = `<tr><td colspan="6">…</td></tr>`;
  if (!token) return;
  try {
    const { items } = await listCodes(token);
    tbody.innerHTML = "";
    if (!items.length) {
      tbody.innerHTML = `<tr><td colspan="6">لا توجد أكواد</td></tr>`;
      return;
    }
    for (const row of items) {
      const tr = document.createElement("tr");
      const created = row.createdAt
        ? new Date(row.createdAt).toLocaleString()
        : "—";
      tr.innerHTML = `
        <td><code class="code-cell">${esc(row.code)}</code></td>
        <td>${row.maxUses}</td>
        <td>${row.usedCount}</td>
        <td>${row.remaining}</td>
        <td>${esc(created)}</td>
        <td><button type="button" class="btn btn-danger btn-sm" data-code="${esc(row.code)}">حذف</button></td>
      `;
      tbody.appendChild(tr);
    }
    tbody.querySelectorAll("[data-code]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          await deleteCode(token, btn.getAttribute("data-code"));
          showToast("تم الحذف", "success");
          await loadCodes();
        } catch (err) {
          showToast(err.message, "error");
        }
      });
    });
  } catch (err) {
    showToast(err.message, "error");
  }
}

document.getElementById("refresh-participants-btn").addEventListener("click", loadParticipants);

async function clearAllParticipants() {
  const token = await getToken();
  if (!token) {
    showToast("يجب تسجيل الدخول كمسؤول", "error");
    return;
  }
  const ok = await confirmDanger({
    title: t("clearAllTitle"),
    message: t("clearAllMessage"),
  });
  if (!ok) return;
  try {
    await deleteAllParticipants(token);
    showToast("تم المسح", "success");
    await loadParticipants();
  } catch (err) {
    showToast(err.message, "error");
  }
}

document.getElementById("clear-all-btn")?.addEventListener("click", clearAllParticipants);
document
  .getElementById("clear-all-participants-btn")
  ?.addEventListener("click", clearAllParticipants);

async function downloadParticipantsExcel() {
  const token = await getToken();
  if (!token) {
    showToast("يجب تسجيل الدخول كمسؤول", "error");
    return;
  }

  const btn =
    document.getElementById("export-excel-btn") ||
    document.getElementById("export-csv-btn");
  if (btn) btn.disabled = true;

  try {
    const blob = await exportParticipants(token);
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `participants_export_${stamp}.xlsx`;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast("تم تصدير ملف Excel بنجاح", "success");
  } catch (err) {
    showToast(err.message || "فشل التصدير", "error");
  } finally {
    if (btn) btn.disabled = false;
  }
}

document.getElementById("export-excel-btn")?.addEventListener(
  "click",
  downloadParticipantsExcel
);
document.getElementById("export-csv-btn")?.addEventListener(
  "click",
  downloadParticipantsExcel
);

async function loadParticipants() {
  const token = await getToken();
  const tbody = document.getElementById("participants-tbody");
  tbody.innerHTML = `<tr><td colspan="4">…</td></tr>`;
  if (!token) return;
  try {
    const { items } = await getParticipants(token);
    tbody.innerHTML = "";
    if (!items.length) {
      tbody.innerHTML = `<tr><td colspan="4">لا يوجد مشاركون</td></tr>`;
      return;
    }
    for (const row of items) {
      const tr = document.createElement("tr");
      const preds = (row.rounds || []).join(" · ") || "—";
      tr.innerHTML = `
        <td>${esc(row.name || row.userId)}</td>
        <td class="rounds-cell">${esc(preds)}</td>
        <td><strong>${row.score}</strong></td>
        <td>${row.rank}</td>
      `;
      tbody.appendChild(tr);
    }
  } catch (err) {
    showToast(err.message, "error");
  }
}

function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

applyI18n();
document.getElementById("lang-toggle").textContent = t("lang");
