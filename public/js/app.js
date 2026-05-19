import {
  getPublicSettings,
  validateCode,
  getCodeBetStatus,
  submitUserBet,
} from "./api.js";

const ROUNDS = 7;
const HORSES = 10;
const CODE_LENGTH = 8;
const SESSION_CODE_KEY = "atherace_validated_code";

const codeSection = document.getElementById("code-section");
const betsSection = document.getElementById("bets-section");
const successSection = document.getElementById("success-section");
const alreadySection = document.getElementById("already-section");

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

function showOnly(section) {
  [codeSection, betsSection, successSection, alreadySection].forEach((el) => {
    el.classList.toggle("hidden", el !== section);
  });
}

function setMessage(el, text, type) {
  el.textContent = text || "";
  el.className = "form-message";
  if (type) el.classList.add(type);
}

function buildRoundSelects() {
  const container = document.getElementById("rounds-container");
  container.innerHTML = "";
  const placeholder = "— اختر —";

  for (let i = 1; i <= ROUNDS; i++) {
    const label = document.createElement("label");
    label.className = "field";
    const select = document.createElement("select");
    select.name = `round-${i}`;
    select.dataset.round = String(i - 1);
    select.required = true;

    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = placeholder;
    select.appendChild(empty);

    for (let h = 1; h <= HORSES; h++) {
      const opt = document.createElement("option");
      opt.value = String(h);
      opt.textContent = String(h);
      select.appendChild(opt);
    }

    const span = document.createElement("span");
    span.textContent = `الشوط ${i}`;
    label.append(span, select);
    container.appendChild(label);
  }
}

function getValidatedCode() {
  return sessionStorage.getItem(SESSION_CODE_KEY) || "";
}

function setValidatedCode(code) {
  if (code) sessionStorage.setItem(SESSION_CODE_KEY, code);
  else sessionStorage.removeItem(SESSION_CODE_KEY);
}

async function resumeSessionIfAny() {
  const code = getValidatedCode();
  if (!code) return;

  try {
    const status = await getCodeBetStatus(code);
    if (status.alreadySubmitted) {
      setValidatedCode("");
      showOnly(alreadySection);
      return;
    }
    if (status.validated) {
      showBetsForm(code, status.remainingAttempts);
    }
  } catch {
    setValidatedCode("");
  }
}

function showBetsForm(code, remainingAttempts) {
  document.getElementById("code-badge").textContent = `الكود: ${code}${
    remainingAttempts != null ? ` — محاولات متبقية: ${remainingAttempts}` : ""
  }`;
  showOnly(betsSection);
}

async function loadSettings() {
  try {
    const settings = await getPublicSettings();
    if (settings.titleAr) {
      document.getElementById("site-title").textContent = settings.titleAr;
    }
    const demoBanner = document.getElementById("demo-banner");
    if (demoBanner) demoBanner.classList.toggle("hidden", !settings.demoMode);
    if (settings.submissionsOpen === false) {
      setMessage(
        document.getElementById("code-message"),
        "التسجيل مغلق حالياً",
        "error"
      );
      document.getElementById("validate-btn").disabled = true;
    }
  } catch (e) {
    console.warn("Could not load settings", e);
  }
}

document.getElementById("code-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = document.getElementById("code-message");
  setMessage(msg, "");

  const code = normalizeCodeInput(document.getElementById("access-code").value);
  if (code.length !== CODE_LENGTH) {
    setMessage(msg, `الكود يجب أن يكون ${CODE_LENGTH} أحرفاً`, "error");
    return;
  }

  const btn = document.getElementById("validate-btn");
  btn.disabled = true;

  try {
    const status = await getCodeBetStatus(code);
    if (status.alreadySubmitted) {
      setMessage(msg, "تم تقديم ترشيحات لهذا الكود مسبقاً", "error");
      showOnly(alreadySection);
      return;
    }

    const result = await validateCode(code);
    if (!result.valid) {
      setMessage(msg, result.error || "الكود غير صالح", "error");
      return;
    }

    setValidatedCode(code);
    setMessage(msg, "تم التحقق بنجاح", "success");
    showBetsForm(code, result.remainingAttempts);
  } catch (err) {
    if (err.status === 403 && err.message?.includes("مسبقاً")) {
      showOnly(alreadySection);
    }
    setMessage(msg, err.message || "فشل التحقق من الكود", "error");
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
    setMessage(msg, "يجب التحقق من الكود أولاً", "error");
    showOnly(codeSection);
    return;
  }

  const selects = [...document.querySelectorAll("#rounds-container select[data-round]")];
  const rounds = selects.map((s) => Number(s.value));
  if (rounds.some((n) => !Number.isInteger(n) || n < 1 || n > HORSES)) {
    setMessage(msg, "يرجى اختيار رقم خيل لكل شوط", "error");
    return;
  }

  const btn = document.getElementById("submit-bets-btn");
  btn.disabled = true;

  try {
    const status = await getCodeBetStatus(code);
    if (status.alreadySubmitted) {
      setValidatedCode("");
      showOnly(alreadySection);
      return;
    }

    await submitUserBet({
      code,
      userId: getOrCreateUserId(),
      phone: document.getElementById("user-phone").value.trim() || undefined,
      name: document.getElementById("user-name").value.trim() || undefined,
      rounds,
    });

    setValidatedCode("");
    showOnly(successSection);
  } catch (err) {
    if (err.status === 409) {
      setValidatedCode("");
      showOnly(alreadySection);
      return;
    }
    setMessage(msg, err.message || "فشل حفظ الترشيحات", "error");
  } finally {
    btn.disabled = false;
  }
});

buildRoundSelects();
loadSettings();
resumeSessionIfAny();
