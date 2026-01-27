import { getCurrentPageName, qsa, qs } from "./utils.js";

export function initNav() {
  wireHamburger();
  applyActiveLink();
}

function wireHamburger() {
  const btn = qs("#btnMenu");
  const menu = qs("#mobileMenu");
  const overlay = qs("#navOverlay");

  // Jika halaman tertentu tidak punya header/menu (atau belum dimuat), aman.
  if (!btn || !menu || !overlay) return;

  const open = () => {
    document.body.classList.add("nav-open");
    btn.setAttribute("aria-expanded", "true");

    // tampilkan menu + overlay
    menu.hidden = false;
    overlay.hidden = false;

    // trigger animasi (CSS Anda pakai .is-open)
    requestAnimationFrame(() => menu.classList.add("is-open"));
  };

  const close = () => {
    document.body.classList.remove("nav-open");
    btn.setAttribute("aria-expanded", "false");

    // animasi keluar
    menu.classList.remove("is-open");

    // tunggu transisi selesai sebelum hidden
    window.setTimeout(() => {
      menu.hidden = true;
      overlay.hidden = true;
    }, 200);
  };

  const toggle = () => {
    const isOpen = btn.getAttribute("aria-expanded") === "true";
    isOpen ? close() : open();
  };

  btn.addEventListener("click", toggle);
  overlay.addEventListener("click", close);

  // ESC untuk tutup
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && btn.getAttribute("aria-expanded") === "true") close();
  });

  // Klik item menu => tutup (mobile UX)
  qsa("#mobileMenu a").forEach((a) => a.addEventListener("click", close));
}

function applyActiveLink() {
  const current = getCurrentPageName(); // index, about, work, skills, contact

  // Semua link di header (desktop + mobile)
  const links = qsa("header a[href]");

  // Normalisasi target: index.html => index, about.html => about, dst
  links.forEach((a) => {
    const href = (a.getAttribute("href") || "").toLowerCase();
    if (!href.endsWith(".html")) return;

    const page = href.split("/").pop().replace(".html", "");
    a.classList.toggle("active", page === current);
  });
}
