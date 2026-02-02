// assets/js/projects.js
import { fetchJSON, qs, qsa, escapeHTML } from "./utils.js";
import { initI18n } from "./i18n.js";

const JSON_PATH = "assets/js/data/proyek.json";

const SELECTORS = {
  grid: "#workGrid",
  count: "#projectCount",
  modal: "#projectModal",
  pmTitle: "#pmTitle",
  pmIndicators: "#pmIndicators",
  pmSlides: "#pmSlides",
  pmSkills: "#pmSkills",
  pmDesc: "#pmDesc",
};

let cachedProjects = null;
let bsModal = null;

export function initProjects() {
  const needs =
    qs(SELECTORS.grid) ||
    qs(SELECTORS.count) ||
    qs(SELECTORS.modal);

  if (!needs) return;

  bootstrapProjects();
}

async function bootstrapProjects() {
  try {
    const data = await fetchJSON(JSON_PATH);
    const projects = normalizeProjects(data);
    cachedProjects = projects;

    updateProjectCount(projects);
    renderProjectsGrid(projects);
    initProjectModal(projects);

    // Hydrate i18n node setelah render
    initI18n();

  } catch (err) {
    console.error("[projects] gagal init:", err);
  }
}

/* =========================
 * NORMALIZE DATA
 * ========================= */
function normalizeProjects(json) {
  const arr = Array.isArray(json?.proyek) ? json.proyek : [];
  const out = [];

  for (const item of arr) {
    if (!item || typeof item !== "object") continue;
    const key = Object.keys(item)[0];
    const val = item[key];
    if (!val) continue;

    out.push({
      code: key,
      id: Number(val.id),

      title: val.title || { id: "", en: "" },
      slug: val.slug || { id: "", en: "" },
      description: val.description || { id: "", en: "" },

      skill: Array.isArray(val.skill) ? val.skill : [],
      image: Array.isArray(val.image) ? val.image : [],
    });
  }

  return out;
}

/* =========================
 * COUNTER
 * ========================= */
function updateProjectCount(projects) {
  const el = qs(SELECTORS.count);
  if (!el) return;
  el.textContent = String(projects.length);
}

/* =========================
 * GRID RENDER
 * ========================= */
function renderProjectsGrid(projects) {
  const grid = qs(SELECTORS.grid);
  if (!grid) return;

  grid.innerHTML = "";

  const html = projects.map(projectCardHTML).join("");
  grid.insertAdjacentHTML("beforeend", html);
}

function projectCardHTML(p) {
  const thumb = p.image?.[0] ? `assets/img/${p.image[0]}` : "";
  const skills = (p.skill || [])
    .map((s) => `<span class="tag">${escapeHTML(s)}</span>`)
    .join("");

  return `
    <article class="work-card">
      ${thumb ? `
        <img
          class="thumb"
          src="${thumb}"
          alt="${escapeHTML(p.title.id)}"
          loading="lazy"
        >
      ` : ""}

      <div class="work-body">
        <h3
          class="work-title"
          data-i18n-id="${escapeHTML(p.title.id)}"
          data-i18n-en="${escapeHTML(p.title.en)}"
        ></h3>

        <div
          class="work-meta"
          style="text-align:justify;"
          data-i18n-id="${escapeHTML(p.slug.id)}"
          data-i18n-en="${escapeHTML(p.slug.en)}"
          data-i18n-html="true"
        ></div>

        <div class="tags">${skills}</div>

        <div class="work-actions">
          <button
            type="button"
            class="btn primary js-project-detail"
            data-project-id="${p.id}"
            data-bs-toggle="modal"
            data-bs-target="#projectModal"
            data-i18n-id="Rincian"
            data-i18n-en="Details"
          >
          </button>
        </div>
      </div>
    </article>
  `;
}

/* =========================
 * MODAL
 * ========================= */
function initProjectModal(projects) {
  const modalEl = qs(SELECTORS.modal);
  if (!modalEl) return;

  if (!window.bootstrap?.Modal) {
    console.warn("[projects] Bootstrap Modal tidak tersedia.");
    return;
  }

  bsModal = window.bootstrap.Modal.getOrCreateInstance(modalEl, {
    backdrop: true,
    keyboard: true,
    focus: true,
  });

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-project-id]");
    if (!btn) return;

    const id = Number(btn.getAttribute("data-project-id"));
    const p = projects.find((x) => x.id === id);
    if (!p) return;

    fillModal(p);
    initI18n(); // re-hydrate modal
  });

  modalEl.addEventListener("hidden.bs.modal", resetModal);
}

function fillModal(p) {
  const titleEl = qs(SELECTORS.pmTitle);
  const skillsEl = qs(SELECTORS.pmSkills);
  const descEl = qs(SELECTORS.pmDesc);

  if (titleEl) {
    titleEl.innerHTML = `
      <span
        data-i18n-id="${escapeHTML(p.title.id)}"
        data-i18n-en="${escapeHTML(p.title.en)}"
      ></span>
    `;
  }

  if (skillsEl) {
    skillsEl.innerHTML = (p.skill || [])
      .map((s) => `<span class="badge">${escapeHTML(s)}</span>`)
      .join("");
  }

  if (descEl) {
    descEl.innerHTML = `
      <div
        data-i18n-id="${escapeHTML(p.description.id)}"
        data-i18n-en="${escapeHTML(p.description.en)}"
        data-i18n-html="true"
      ></div>
    `;
  }

  renderCarousel(p);
}

function renderCarousel(p) {
  const indEl = qs(SELECTORS.pmIndicators);
  const slidesEl = qs(SELECTORS.pmSlides);
  if (!indEl || !slidesEl) return;

  indEl.innerHTML = "";
  slidesEl.innerHTML = "";

  (p.image || []).forEach((file, idx) => {
    const active = idx === 0 ? "active" : "";

    indEl.insertAdjacentHTML(
      "beforeend",
      `<button type="button" data-bs-target="#pmCarousel" data-bs-slide-to="${idx}" class="${active}"></button>`
    );

    slidesEl.insertAdjacentHTML(
      "beforeend",
      `
      <div class="carousel-item ${active}">
        <img
          src="assets/img/${file}"
          class="d-block w-100"
          alt="${escapeHTML(p.title.id)} - ${idx + 1}"
          loading="lazy"
        >
      </div>
    `
    );
  });

  if (window.bootstrap?.Carousel) {
    const carouselEl = qs("#pmCarousel");
    if (carouselEl) {
      window.bootstrap.Carousel.getOrCreateInstance(carouselEl, {
        interval: false,
        ride: false,
        touch: true,
      }).to(0);
    }
  }
}

function resetModal() {
  qsa([
    SELECTORS.pmIndicators,
    SELECTORS.pmSlides,
    SELECTORS.pmSkills,
    SELECTORS.pmDesc,
  ].join(",")).forEach((el) => el.innerHTML = "");
}
