import { validateCode, checkSubmission, submitBets, getParticipants } from "./api.js";
import { showToast } from "./toast.js";
import { applyI18n, toggleLang, t } from "./i18n.js";

const ROUNDS = 7;
const HORSES = 10;
const CODE_LENGTH = 8;
const SESSION_CODE_KEY = "atherace_validated_code";
const SESSION_TOKEN_KEY = "atherace_session_token";

let currentRound = 0;
const roundSelects = [];

const sections = {
  code: document.getElementById("code-section"),
  bets: document.getElementById("bets-section"),
  success: document.getElementById("success-section"),
  already: document.getElementById("already-section"),
  ranking: document.getElementById("ranking-section"),
};

function showOnly(name) {
  Object.entries(sections).forEach(([key, el]) => {
    el.classList.toggle("hidden", key !== name);
  });
}

function normalizeCodeInput(raw) {
  return String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function getOrCreateUserId() {
  const key = "atherace_user_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

function getValidatedCode() {
  return sessionStorage.getItem(SESSION_CODE_KEY) || "";
}

function setValidatedCode(code) {
  if (code) sessionStorage.setItem(SESSION_CODE_KEY, code);
  else sessionStorage.removeItem(SESSION_CODE_KEY);
}

function setSessionToken(token) {
  if (token) sessionStorage.setItem(SESSION_TOKEN_KEY, token);
  else sessionStorage.removeItem(SESSION_TOKEN_KEY);
}

function getSessionToken() {
  return sessionStorage.getItem(SESSION_TOKEN_KEY) || "";
}

function setMessage(el, text, type) {
  el.textContent = text || "";
  el.className = "form-message";
  if (type) el.classList.add(type);
}

function buildRoundSelects() {
  const container = document.getElementById("rounds-container");
  const steps = document.getElementById("wizard-steps");
  container.innerHTML = "";
  steps.innerHTML = "";
  roundSelects.length = 0;

  for (let i = 0; i < ROUNDS; i++) {
    const step = document.createElement("span");
    step.className = "wizard-step";
    step.textContent = String(i + 1);
    steps.appendChild(step);

    const label = document.createElement("label");
    label.className = `field round-field${i === 0 ? "" : " hidden"}`;
    label.dataset.roundIndex = String(i);

    const select = document.createElement("select");
    select.required = true;
    select.dataset.round = String(i);
    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = t("chooseHorse");
    select.appendChild(empty);
    for (let h = 1; h <= HORSES; h++) {
      const opt = document.createElement("option");
      opt.value = String(h);
      opt.textContent = String(h);
      select.appendChild(opt);
    }

    const span = document.createElement("span");
    span.textContent = `${t("round")} ${i + 1}`;
    label.append(span, select);
    container.appendChild(label);
    roundSelects.push({ label, select, step });
  }
  updateWizardUi();
}

function updateWizardUi() {
  roundSelects.forEach((r, i) => {
    r.label.classList.toggle("hidden", i !== currentRound);
    r.step.classList.toggle("active", i === currentRound);
    r.step.classList.toggle("done", i < currentRound && r.select.value);
  });

  document.getElementById("prev-round-btn").classList.toggle("hidden", currentRound === 0);
  document.getElementById("next-round-btn").classList.toggle(
    "hidden",
    currentRound === ROUNDS - 1
  );
  document.getElementById("submit-bets-btn").classList.toggle(
    "hidden",
    currentRound !== ROUNDS - 1
  );
  document.getElementById("consent-field")?.classList.toggle(
    "hidden",
    currentRound !== ROUNDS - 1
  );
}

document.getElementById("prev-round-btn").addEventListener("click", () => {
  if (currentRound > 0) {
    currentRound -= 1;
    updateWizardUi();
  }
});

document.getElementById("next-round-btn").addEventListener("click", () => {
  const sel = roundSelects[currentRound].select;
  if (!sel.value) {
    showToast(`اختر رقماً للشوط ${currentRound + 1}`, "error");
    return;
  }
  if (currentRound < ROUNDS - 1) {
    currentRound += 1;
    updateWizardUi();
  }
});

document.getElementById("lang-toggle")?.addEventListener("click", () => {
  toggleLang();
  applyI18n();
  buildRoundSelects();
  document.getElementById("lang-toggle").textContent = t("lang");
});

async function showRanking() {
  showOnly("ranking");
  const tbody = document.getElementById("ranking-body");
  tbody.innerHTML = `<tr><td colspan="3">…</td></tr>`;
  try {
    const data = await getParticipants();
    tbody.innerHTML = "";
    if (!data.items.length) {
      tbody.innerHTML = `<tr><td colspan="3">لا يوجد مشاركون بعد</td></tr>`;
    } else {
      for (const row of data.items) {
        const tr = document.createElement("tr");
        if (row.rank === 1) tr.classList.add("rank-gold");
        tr.innerHTML = `
          <td>${row.rank}</td>
          <td>${row.name || "—"}</td>
          <td><strong>${row.score}</strong></td>
        `;
        tbody.appendChild(tr);
      }
    }
    const winnersEl = document.getElementById("winners-display");
    if (data.winners?.length) {
      winnersEl.textContent = `نتائج الأشواط: ${data.winners.join(" · ")}`;
    } else {
      winnersEl.textContent = "لم تُعلن النتائج بعد";
    }
  } catch (err) {
    showToast(err.message, "error");
  }
}

document.getElementById("show-ranking-btn").addEventListener("click", showRanking);
document.getElementById("goto-ranking-btn").addEventListener("click", showRanking);
document.getElementById("already-ranking-btn").addEventListener("click", showRanking);
document.getElementById("back-to-form-btn").addEventListener("click", () => showOnly("code"));

function showBetsForm(code, remaining) {
  document.getElementById("code-badge").textContent =
    `${code}${remaining != null ? ` — متبقي: ${remaining}` : ""}`;
  currentRound = 0;
  updateWizardUi();
  showOnly("bets");
}

document.getElementById("code-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = document.getElementById("code-message");
  setMessage(msg, "");
  const code = normalizeCodeInput(document.getElementById("access-code").value);
  const userId = getOrCreateUserId();

  if (code.length !== CODE_LENGTH) {
    setMessage(msg, `الكود ${CODE_LENGTH} أحرف`, "error");
    return;
  }

  const btn = document.getElementById("validate-btn");
  btn.disabled = true;
  try {
    const status = await checkSubmission(code, userId);
    if (status.alreadySubmitted) {
      showOnly("already");
      return;
    }
    const result = await validateCode(code, userId);
    if (!result.valid) {
      setMessage(msg, result.error || "كود غير صالح", "error");
      return;
    }
    if (result.sessionToken) setSessionToken(result.sessionToken);
    setValidatedCode(code);
    showToast("تم التحقق", "success");
    showBetsForm(code, result.remaining);
  } catch (err) {
    if (err.data?.alreadySubmitted) showOnly("already");
    else setMessage(msg, err.message, "error");
  } finally {
    btn.disabled = false;
  }
});

document.getElementById("bets-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = document.getElementById("bets-message");
  setMessage(msg, "");
  const code = getValidatedCode();
  if (!code) {
    showOnly("code");
    return;
  }

  const rounds = roundSelects.map((r) => Number(r.select.value));
  if (rounds.some((n) => !Number.isInteger(n) || n < 1 || n > HORSES)) {
    showToast("أكمل جميع الأشواط", "error");
    return;
  }

  const consentEl = document.getElementById("privacy-consent");
  if (!consentEl?.checked) {
    setMessage(msg, t("privacyRequired"), "error");
    return;
  }

  const btn = document.getElementById("submit-bets-btn");
  btn.disabled = true;
  try {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      setMessage(msg, "انتهت الجلسة — تحقق من الكود مجدداً", "error");
      showOnly("code");
      return;
    }

    await submitBets(
      {
        code,
        userId: getOrCreateUserId(),
        phone: document.getElementById("user-phone").value.trim() || undefined,
        name: document.getElementById("user-name").value.trim() || undefined,
        rounds,
        consentAccepted: true,
      },
      sessionToken
    );
    setValidatedCode("");
    setSessionToken("");
    showOnly("success");
    showToast(t("successSubmit"), "success");
  } catch (err) {
    if (err.status === 409) {
      setValidatedCode("");
      setSessionToken("");
      showOnly("already");
    } else {
      setMessage(msg, err.message, "error");
    }
  } finally {
    btn.disabled = false;
  }
});

async function resumeSession() {
  const code = getValidatedCode();
  if (!code) return;
  const userId = getOrCreateUserId();
  try {
    const status = await checkSubmission(code, userId);
    if (status.alreadySubmitted) {
      setValidatedCode("");
      showOnly("already");
      return;
    }
    if (status.validated) {
      if (!getSessionToken()) {
        const result = await validateCode(code, userId);
        if (result.sessionToken) setSessionToken(result.sessionToken);
      }
      showBetsForm(code);
    }
  } catch {
    setValidatedCode("");
    setSessionToken("");
  }
}

buildRoundSelects();
applyI18n();
document.getElementById("lang-toggle").textContent = t("lang");
resumeSession();
