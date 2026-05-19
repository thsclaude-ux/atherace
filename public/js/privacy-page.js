import { applyI18n, toggleLang, getLang, t } from "./i18n.js";

function syncLangBlocks() {
  const lang = getLang();
  document.querySelectorAll("[data-lang-block]").forEach((el) => {
    el.classList.toggle("hidden", el.getAttribute("data-lang-block") !== lang);
  });
}

document.getElementById("lang-toggle")?.addEventListener("click", () => {
  toggleLang();
  applyI18n();
  syncLangBlocks();
  document.getElementById("lang-toggle").textContent = t("lang");
});

applyI18n();
syncLangBlocks();
document.getElementById("lang-toggle").textContent = t("lang");
