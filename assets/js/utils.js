export function onReady(fn) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn);
  } else {
    fn();
  }
}

export async function loadPartial(selector, path) {
  const mount = document.querySelector(selector);
  if (!mount) return;

  const res = await fetch(path, { cache: "no-cache" });
  if (!res.ok) {
    console.warn(`[partial] gagal load: ${path} (${res.status})`);
    return;
  }
  mount.innerHTML = await res.text();
}

export async function fetchJSON(path) {
  const res = await fetch(path, { cache: "no-cache" });
  if (!res.ok) throw new Error(`Fetch gagal: ${path} (${res.status})`);
  return res.json();
}

export function escapeHTML(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function getCurrentPageName() {
  // contoh: /work.html -> work
  const p = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  return p.replace(".html", "");
}

export function qs(sel, root = document) {
  return root.querySelector(sel);
}

export function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}
