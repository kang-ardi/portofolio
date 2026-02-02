import { loadPartial, onReady } from "./utils.js";
import { initNav } from "./nav.js";
import { initI18n } from "./i18n.js";
import { initProjects } from "./projects.js";

onReady(async () => {
  // 1) Load partial header/footer dulu (penting supaya elemen nav sudah ada sebelum init)
  await loadPartial("#siteHeader", "assets/partials/header.html");
  await loadPartial("#siteFooter", "assets/partials/footer.html");

  // 2) Init modul
  initNav();
  initI18n();
  initProjects(); // aman: hanya jalan jika elemen terkait ada di halaman
});
