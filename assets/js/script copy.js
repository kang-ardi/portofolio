/* ===============================
   Partials: Header & Footer
   =============================== */
async function injectPartial(targetId, url) {
  const el = document.getElementById(targetId);
  if (!el) return;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Gagal memuat ${url} (${res.status})`);
  el.innerHTML = await res.text();
}

function setActiveNav() {
  // Ambil path terakhir. Bisa "work" atau "work.html" atau kosong
  let current = (location.pathname.split("/").pop() || "index.html").toLowerCase();

  // Kalau current tidak mengandung ".html", anggap itu nama halaman dan tambahkan ".html"
  // KECUALI jika itu "index" atau kosong
  if (!current.includes(".")) {
    current = current === "" ? "index.html" : `${current}.html`;
  }

  const links = document.querySelectorAll("header nav a, header #mobileMenu a");

  const normalizeToFile = (href) => {
    try {
      const u = new URL(href, location.href);
      return (u.pathname.split("/").pop() || "index.html").toLowerCase();
    } catch {
      return (href || "")
        .split("#")[0]
        .split("?")[0]
        .split("/")
        .pop()
        .toLowerCase();
    }
  };

  links.forEach((a) => {
    a.classList.remove("active");
    const file = normalizeToFile(a.getAttribute("href"));
    if (file === current) a.classList.add("active");
  });

  // DEBUG sementara
  console.log("[active] currentFile:", current);
  console.log("[active] links found:", links.length);
  console.log("[active] actives:", document.querySelectorAll("header a.active").length);
}

function setYear() {
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
}

/* ===============================
   Navbar Mobile
   =============================== */
window.initNavbar = function initNavbar() {
  const btn = document.getElementById("btnMenu");
  const menu = document.getElementById("mobileMenu");
  const overlay = document.getElementById("navOverlay");
  if (!btn || !menu || !overlay) return;

  const open = () => {
    btn.setAttribute("aria-expanded", "true");
    menu.hidden = false;

    // next tick agar transition .is-open jalan
    requestAnimationFrame(() => menu.classList.add("is-open"));

    overlay.hidden = false;
    document.body.classList.add("nav-open");
  };

  const close = () => {
    btn.setAttribute("aria-expanded", "false");
    menu.classList.remove("is-open");

    // tunggu animasi, baru hidden
    setTimeout(() => {
      menu.hidden = true;
    }, 260);

    overlay.hidden = true;
    document.body.classList.remove("nav-open");
  };

  const toggle = () => {
    const expanded = btn.getAttribute("aria-expanded") === "true";
    expanded ? close() : open();
  };

  // Hindari double-binding jika init dipanggil lebih dari sekali
  if (btn.dataset.bound === "1") return;
  btn.dataset.bound = "1";

  btn.addEventListener("click", toggle);
  overlay.addEventListener("click", close);

  // Close saat klik link di mobile menu
  menu.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (a) close();
  });

  // Close pakai ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && btn.getAttribute("aria-expanded") === "true") {
      close();
    }
  });
};

/* ===============================
   Boot: inject all
   =============================== */
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await injectPartial("siteHeader", "assets/partials/header.html");
    await injectPartial("siteFooter", "assets/partials/footer.html");

    setActiveNav();
    setYear();
    window.initNavbar();

    // (Optional) init fitur halaman jika ada
    if (window.initWorkGrid) window.initWorkGrid();
  } catch (err) {
    console.error(err);
  }
});

/* ==================================================
   OPTIONAL: Work grid + Modal (tetap boleh dipakai)
   ================================================== */

/* Render Work Grid from proyek.json
   - akan jalan hanya jika halaman punya #workGrid
*/
window.initWorkGrid = function initWorkGrid() {
  const grid = document.getElementById("workGrid");
  if (!grid) return;

  const DATA_URL = "assets/js/data/proyek.json";
  const IMG_BASE = "assets/img/";

  const escapeHtml = (s) =>
    String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const toCardHtml = (item) => {
    const title = item.title || "Untitled";
    const slug = item.slug || "";
    const id = String(item.id ?? "");
    const skills = Array.isArray(item.skill) ? item.skill : [];
    const images = Array.isArray(item.image) ? item.image : [];
    const firstImg = images[0] ? (IMG_BASE + encodeURIComponent(images[0])) : "";

    const tagsHtml = skills.map((sk) => `<span class="tag">${escapeHtml(sk)}</span>`).join("");

    return `
      <article class="work-card card" data-id="${escapeHtml(id)}">
        ${
          firstImg
            ? `<img class="thumb" src="${firstImg}" alt="${escapeHtml(title)}" loading="lazy">`
            : `<div class="thumb" style="display:flex;align-items:center;justify-content:center;color:var(--muted);">No image</div>`
        }
        <div class="work-body">
          <h2 class="work-title">${escapeHtml(title)}</h2>
          <div class="work-meta">${slug}</div>
          <div class="tags">${tagsHtml}</div>
          <div class="work-actions">
            <a class="btn primary js-project-detail" href="#" data-proyek-id="${escapeHtml(id)}">Details</a>
          </div>
        </div>
      </article>
    `;
  };

  (async function loadAndRender() {
    try {
      const res = await fetch(DATA_URL, { cache: "no-store" });
      if (!res.ok) throw new Error("Fetch gagal: " + res.status);
      const json = await res.json();

      const items = (json.proyek || [])
        .map((wrapper) => {
          const key = Object.keys(wrapper || {})[0];
          return key ? wrapper[key] : null;
        })
        .filter(Boolean)
        .sort((a, b) => (a.id || 0) - (b.id || 0));

      grid.innerHTML = items.map(toCardHtml).join("");
    } catch (err) {
      console.error(err);
      grid.innerHTML = `
        <div class="panel">
          <b>Gagal memuat data proyek.</b>
          <p class="lead" style="margin-top:8px;">
            Jika Anda test via <code>file://</code>, gunakan Live Server.
          </p>
        </div>
      `;
    }
  })();
  
};

// ===============================
// Project Modal from proyek.json
// ===============================
(function () {
  const DATA_URL = "assets/js/data/proyek.json";
  const IMG_BASE = "assets/img/"; // pastikan file gambar ada di sini

  let proyekMapById = null;
  let modalInstance = null;

  const elTitle = () => document.getElementById("pmTitle");
  const elIndicators = () => document.getElementById("pmIndicators");
  const elSlides = () => document.getElementById("pmSlides");
  const elSkills = () => document.getElementById("pmSkills");
  const elDesc = () => document.getElementById("pmDesc");

  async function loadProyekData() {
    if (proyekMapById) return proyekMapById;

    const res = await fetch(DATA_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("Gagal memuat proyek.json");

    const json = await res.json();

    // Struktur Anda: { proyek: [ { "PJK...": {id,title,...} }, ... ] }
    const map = new Map();
    (json.proyek || []).forEach((wrapper) => {
      const key = Object.keys(wrapper || {})[0];
      const item = key ? wrapper[key] : null;
      if (item && typeof item.id !== "undefined") {
        map.set(String(item.id), item);
      }
    });

    proyekMapById = map;
    return proyekMapById;
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function renderModal(item) {
    // Title
    elTitle().textContent = item.title || "Detail Proyek";

    // Skills pills (selaras tag Anda)
    elSkills().innerHTML = (item.skill || [])
      .map((sk) => `<span class="tag">${escapeHtml(sk)}</span>`)
      .join("");

    // Description (boleh HTML? Anda pakai <p> di slug, tapi description plain text)
    // Jika Anda ingin description mendukung HTML, ganti ke innerHTML dengan sanitasi.
    elDesc().textContent = item.description || "";

    // Carousel
    const images = Array.isArray(item.image) ? item.image : [];
    const indicators = [];
    const slides = [];

    images.forEach((filename, idx) => {
      const active = idx === 0 ? "active" : "";
      indicators.push(`
        <button type="button"
          data-bs-target="#pmCarousel"
          data-bs-slide-to="${idx}"
          class="${active}"
          aria-current="${idx === 0 ? "true" : "false"}"
          aria-label="Slide ${idx + 1}">
        </button>
      `);

      slides.push(`
        <div class="carousel-item ${active}">
          <img src="${IMG_BASE + encodeURIComponent(filename)}"
               alt="${escapeHtml(item.title || "Project")} - ${idx + 1}"
               loading="lazy">
        </div>
      `);
    });

    // Fallback jika tidak ada gambar
    if (images.length === 0) {
      indicators.length = 0;
      slides.push(`
        <div class="carousel-item active">
          <div style="padding:18px;color:var(--muted);text-align:center;">
            Tidak ada gambar untuk proyek ini.
          </div>
        </div>
      `);
    }

    elIndicators().innerHTML = indicators.join("");
    elSlides().innerHTML = slides.join("");

    // Sembunyikan kontrol jika cuma 1 gambar
    const prevBtn = document.querySelector('#pmCarousel .carousel-control-prev');
    const nextBtn = document.querySelector('#pmCarousel .carousel-control-next');
    const showControls = images.length > 1;
    if (prevBtn) prevBtn.style.display = showControls ? "" : "none";
    if (nextBtn) nextBtn.style.display = showControls ? "" : "none";
  }

  async function openProjectModalById(id) {
    const map = await loadProyekData();
    const item = map.get(String(id));
    if (!item) {
      console.warn("Proyek tidak ditemukan untuk id:", id);
      return;
    }

    renderModal(item);

    const modalEl = document.getElementById("projectModal");
    if (!modalEl) {
      console.error("Elemen modal #projectModal tidak ditemukan.");
      return;
    }

    // Bootstrap Modal instance
    modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl, {
      backdrop: true,  // klik luar = close
      keyboard: true
    });
    modalInstance.show();
  }

  // Event delegation: tombol detail
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".js-project-detail");
    if (!btn) return;

    e.preventDefault();
    const id = btn.getAttribute("data-proyek-id");
    if (!id) return;

    try {
      await openProjectModalById(id);
    } catch (err) {
      console.error(err);
    }
  });
})();

async function setProjectCount() {
  const el = document.getElementById("projectCount");
  if (!el) return;

  try {
    const res = await fetch("assets/js/data/proyek.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    // Struktur: { proyek: [ { "PJK2025-0001": {...} }, { "PJK2025-0002": {...} }, ... ] }
    const count = Array.isArray(data?.proyek) ? data.proyek.length : 0;

    el.textContent = count;
  } catch (err) {
    console.warn("[projectCount] gagal load proyek.json:", err);
    // fallback: biarkan angka default (0) atau isi manual jika Anda mau
  }
}

document.addEventListener("DOMContentLoaded", setProjectCount);
