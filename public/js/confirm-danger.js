import { t, getLang } from "./i18n.js";

let mounted = false;

function mountModal() {
  if (mounted) return;

  const modal = document.createElement("div");
  modal.id = "danger-modal";
  modal.className = "modal hidden";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "danger-modal-title");

  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.setAttribute("data-dismiss", "danger");

  const card = document.createElement("div");
  card.className = "modal-card";

  const title = document.createElement("h2");
  title.id = "danger-modal-title";
  title.className = "modal-title";

  const message = document.createElement("p");
  message.id = "danger-modal-message";
  message.className = "modal-message hint";

  const label = document.createElement("label");
  label.className = "field";
  const prompt = document.createElement("span");
  prompt.id = "danger-modal-prompt";
  const input = document.createElement("input");
  input.type = "text";
  input.id = "danger-modal-input";
  input.autocomplete = "off";
  input.spellcheck = false;
  label.append(prompt, input);

  const actions = document.createElement("div");
  actions.className = "modal-actions";

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "btn btn-ghost";
  cancelBtn.id = "danger-modal-cancel";
  cancelBtn.setAttribute("data-dismiss", "danger");

  const confirmBtn = document.createElement("button");
  confirmBtn.type = "button";
  confirmBtn.className = "btn btn-danger";
  confirmBtn.id = "danger-modal-confirm";
  confirmBtn.disabled = true;

  actions.append(cancelBtn, confirmBtn);
  card.append(title, message, label, actions);
  modal.append(backdrop, card);
  document.body.appendChild(modal);
  mounted = true;
}

function defaultConfirmWord() {
  return getLang() === "en" ? "DELETE" : "حذف";
}

/**
 * @param {{ title: string, message: string, confirmWord?: string }} opts
 * @returns {Promise<boolean>}
 */
export function confirmDanger(opts) {
  mountModal();
  const modal = document.getElementById("danger-modal");
  const input = document.getElementById("danger-modal-input");
  const confirmBtn = document.getElementById("danger-modal-confirm");
  const cancelBtn = document.getElementById("danger-modal-cancel");
  const word = opts.confirmWord || defaultConfirmWord();

  document.getElementById("danger-modal-title").textContent = opts.title;
  document.getElementById("danger-modal-message").textContent = opts.message;
  document.getElementById("danger-modal-prompt").textContent = t("dangerTypeWord", { word });
  cancelBtn.textContent = t("cancel");
  confirmBtn.textContent = t("dangerConfirm");

  input.value = "";
  confirmBtn.disabled = true;
  modal.classList.remove("hidden");
  input.focus();

  return new Promise((resolve) => {
    const dismissEls = modal.querySelectorAll('[data-dismiss="danger"]');

    function close(result) {
      modal.classList.add("hidden");
      input.removeEventListener("input", onInput);
      confirmBtn.removeEventListener("click", onConfirm);
      cancelBtn.removeEventListener("click", onCancel);
      dismissEls.forEach((el) => el.removeEventListener("click", onCancel));
      resolve(result);
    }

    function onInput() {
      confirmBtn.disabled = input.value.trim() !== word;
    }

    function onConfirm() {
      if (input.value.trim() === word) close(true);
    }

    function onCancel() {
      close(false);
    }

    input.addEventListener("input", onInput);
    confirmBtn.addEventListener("click", onConfirm);
    cancelBtn.addEventListener("click", onCancel);
    dismissEls.forEach((el) => el.addEventListener("click", onCancel));
  });
}
