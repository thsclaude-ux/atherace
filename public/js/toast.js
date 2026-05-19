const container = document.createElement("div");
container.id = "toast-container";
container.className = "toast-container";
container.setAttribute("aria-live", "polite");
document.body.appendChild(container);

const DURATION_MS = 4200;

/**
 * @param {"success"|"error"|"info"} type
 * @param {string} message
 */
export function showToast(message, type = "info") {
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.setAttribute("role", "status");
  el.textContent = message;
  container.appendChild(el);

  requestAnimationFrame(() => el.classList.add("toast-visible"));

  const hide = () => {
    el.classList.remove("toast-visible");
    el.classList.add("toast-hide");
    el.addEventListener("transitionend", () => el.remove(), { once: true });
    setTimeout(() => el.remove(), 400);
  };

  const timer = setTimeout(hide, DURATION_MS);
  el.addEventListener("click", () => {
    clearTimeout(timer);
    hide();
  });
}
