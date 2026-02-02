// assets/js/i18n.js
import { qs, qsa } from "./utils.js";

const STORAGE_KEY = "site_lang";
const DEFAULT_LANG = "id";

let lang = DEFAULT_LANG;

export function initI18n() {
  lang = loadLangFromStorageOrHtml();

  // Sinkron html[lang]
  document.documentElement.setAttribute("lang", lang);

  // Hydrate node bilingual (ID + EN) sekali saja
  hydrateI18nNodes();

  // Apply attribute-based translation sesuai lang
  applyAttrTranslations();

  // Wire toggle
  wireLangToggle();

  // Set UI toggle state
  reflectToggleUI();
}

function loadLangFromStorageOrHtml() {
  const saved = (localStorage.getItem(STORAGE_KEY) || "").toLowerCase();
  if (saved === "en") return "en";
  if (saved === "id") return "id";

  const htmlLang = (document.documentElement.getAttribute("lang") || "").toLowerCase();
  return htmlLang === "en" ? "en" : "id";
}

function setLang(next) {
  lang = next === "en" ? "en" : "id";
  localStorage.setItem(STORAGE_KEY, lang);
  document.documentElement.setAttribute("lang", lang);

  // Untuk node yang pakai attribute (placeholder/title/aria-label) perlu di-apply ulang
  applyAttrTranslations();

  reflectToggleUI();
}

function wireLangToggle() {
  const wrap = qs("#langToggle");
  if (!wrap) return;

  wrap.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-lang]");
    if (!btn) return;
    e.preventDefault();

    const next = (btn.getAttribute("data-lang") || "").toLowerCase();
    if (next !== "id" && next !== "en") return;
    if (next === lang) return;

    setLang(next);
  });
}

function reflectToggleUI() {
  const wrap = qs("#langToggle");
  if (!wrap) return;

  const btnId = qs('[data-lang="id"]', wrap);
  const btnEn = qs('[data-lang="en"]', wrap);
  if (!btnId || !btnEn) return;

  btnId.classList.toggle("is-active", lang === "id");
  btnEn.classList.toggle("is-active", lang === "en");
}

/**
 * Membuat DOM bilingual otomatis:
 * Elemen yang punya data-i18n-id & data-i18n-en akan diisi:
 * <span class="i18n-id">...</span><span class="i18n-en">...</span>
 *
 * Idempotent: aman dipanggil berkali-kali.
 */
function hydrateI18nNodes() {
  qsa("[data-i18n-id][data-i18n-en]").forEach((el) => {
    if (el.dataset.i18nHydrated === "1") return;

    const idText = el.getAttribute("data-i18n-id") || "";
    const enText = el.getAttribute("data-i18n-en") || "";

    // Untuk translate attribute tertentu (placeholder/title/aria-label)
    const attr = el.getAttribute("data-i18n-attr");
    if (attr) {
      el.dataset.i18nHydrated = "1";
      // nilai attr akan diterapkan oleh applyAttrTranslations()
      return;
    }

    // Jika elemen sudah punya konten manual, jangan overwrite.
    const hasMeaningfulContent = el.childNodes.length > 0 && el.textContent.trim().length > 0;
    if (!hasMeaningfulContent) {
      // NOTE: pakai innerHTML agar bisa style/linebreak, dan aman via escapeHtml
      const allowHtml = el.getAttribute("data-i18n-html") === "true";

      el.innerHTML =
        `<span class="i18n-id">${
          allowHtml ? idText : escapeHtml(idText)
        }</span>` +
        `<span class="i18n-en">${
          allowHtml ? enText : escapeHtml(enText)
        }</span>`;

    }

    el.dataset.i18nHydrated = "1";
  });
}

function applyAttrTranslations() {
  qsa("[data-i18n-attr][data-i18n-id][data-i18n-en]").forEach((el) => {
    const attr = el.getAttribute("data-i18n-attr");
    if (!attr) return;

    const idText = el.getAttribute("data-i18n-id") || "";
    const enText = el.getAttribute("data-i18n-en") || "";
    el.setAttribute(attr, lang === "en" ? enText : idText);
  });
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function getLang() {
  return lang;
}
