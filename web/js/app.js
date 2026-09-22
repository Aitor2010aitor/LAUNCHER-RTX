// ============================================================
// RTX GTA LAUNCHER - Template JS
// Reemplaza con tu nuevo JS
// La logica del launcher (injection, scripts, updates) ya esta
// en main.js / preload.js. Aqui va solo la UI.
// ============================================================
const $ = (sel) => document.querySelector(sel);
const DOM = {};

function cacheDom() {
  DOM.toast = $('#toast');
  DOM.statusPill = $('#status-pill');
  DOM.statusDot = $('#status-dot');
  DOM.statusText = $('#status-text');
  DOM.telProcess = $('#tel-process');
  DOM.telDlls = $('#tel-dlls');
  DOM.telStatus = $('#tel-status');
  DOM.telVersion = $('#tel-version');
  DOM.pageTitle = $('#page-title');
  DOM.versionBadge = $('#version-badge');
  DOM.pageDesc = $('#page-desc');
  DOM.modsGrid = $('#mods-grid');
  DOM.updateOverlay = $('#update-overlay');
}

function showToast(msg, type = 'success', ms = 3000) {
  DOM.toast.textContent = msg;
  DOM.toast.className = 'toast show ' + type;
  setTimeout(() => { DOM.toast.className = 'toast'; }, ms);
}

// Titlebar
$('#btn-minimize')?.addEventListener('click', () => window.api.minimize());
$('#btn-maximize')?.addEventListener('click', () => window.api.maximize());
$('#btn-close')?.addEventListener('click', () => window.api.close());

// Init
cacheDom();
