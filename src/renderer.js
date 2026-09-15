const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ============================================================
// TOAST
// ============================================================
function showToast(msg, type = 'success', ms = 3000) {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(() => { t.className = 'toast'; }, ms);
}

// ============================================================
// VERSION
// ============================================================
let APP_VERSION = 'v1.0.0';
window.api.getVersion().then(v => {
  APP_VERSION = 'v' + v;
  $('#current-version-badge').textContent = APP_VERSION;
  $('#settings-version').textContent = APP_VERSION;
  $('#tel-version').textContent = APP_VERSION;
  $('#update-sub').textContent = 'Version actual: ' + APP_VERSION;
});

// ============================================================
// VIEW SWITCHING
// ============================================================
let currentView = 'mods';
let currentVersion = 'GTA Enhanced';

function switchView(view) {
  currentView = view;
  $$('.content').forEach(el => el.style.display = 'none');
  const target = $('#view-' + view);
  if (target) target.style.display = '';

  $$('.nav-card').forEach(el => el.classList.remove('active'));
  $$('.nav-footer-item').forEach(el => el.classList.remove('active'));

  if (view === 'mods') {
    const btn = document.querySelector(`.nav-card[data-version="${currentVersion}"]`);
    if (btn) btn.classList.add('active');
  } else {
    const btn = document.querySelector(`.nav-footer-item[data-view="${view}"]`);
    if (btn) btn.classList.add('active');
  }
}

$$('.nav-card').forEach(btn => {
  btn.addEventListener('click', () => {
    currentVersion = btn.dataset.version;
    switchView('mods');
    loadMods();
  });
});

$$('.nav-footer-item').forEach(btn => {
  btn.addEventListener('click', () => {
    switchView(btn.dataset.view);
  });
});

// ============================================================
// PROCESS POLLING
// ============================================================
let targetPid = null;

async function pollProcess() {
  try {
    const procs = await window.api.getProcesses();
    const found = procs.find(p => p.pid > 0);
    if (found) {
      targetPid = found.pid;
      $('#status-pill').classList.add('online');
      $('#status-dot').classList.add('online');
      $('#status-text').textContent = 'GTA V: ' + found.pid;
      $('#tel-process').textContent = 'PID: ' + found.pid;
      $('#tel-status').textContent = 'Conectado';
    } else {
      targetPid = null;
      $('#status-pill').classList.remove('online');
      $('#status-dot').classList.remove('online');
      $('#status-text').textContent = 'GTA V: Buscando...';
      $('#tel-process').textContent = 'PID: ---';
      $('#tel-status').textContent = 'Sin proceso';
    }
  } catch {}
}

setInterval(pollProcess, 2000);
pollProcess();

// ============================================================
// MODS
// ============================================================
const VERSION_META = {
  'GTA Enhanced': {
    title: 'GTA ENHANCED',
    badge: 'MOD ENGINE v4.2',
    desc: 'Inyeccion de alto rendimiento en un solo clic. Sin configuraciones complejas ni terminales.',
  },
  'GTA Legacy': {
    title: 'GTA LEGACY',
    badge: 'MOD ENGINE v3.8',
    desc: 'Mods RPF, Shaders y gestos clasicos para GTA V.',
  },
};

let totalMods = 0;

async function loadMods() {
  const meta = VERSION_META[currentVersion] || VERSION_META['GTA Enhanced'];
  $('#page-title').textContent = meta.title;
  $('#version-badge').textContent = meta.badge;
  $('#page-desc').textContent = meta.desc;

  const mods = await window.api.scanMods();
  const grid = $('#mods-grid');
  const empty = $('#empty-state');
  grid.innerHTML = '';

  const list = mods[currentVersion] || [];
  totalMods = list.length;
  $('#tel-dlls').textContent = 'DLLs: ' + totalMods;

  if (list.length === 0) {
    empty.style.display = '';
    return;
  }
  empty.style.display = 'none';

  for (const mod of list) {
    const accent = mod.badgeColor === 'red' ? 'red-accent' : 'cyan-accent';
    const iconBg = mod.badgeColor === 'red' ? 'red' : '';
    const card = document.createElement('div');
    card.className = 'mod-card ' + accent;
    card.innerHTML = `
      <div class="mod-card-header">
        <div class="mod-icon ${iconBg}">
          <span class="material-symbols-outlined">${mod.icon || 'bolt'}</span>
        </div>
        <span class="mod-badge ${mod.badgeColor || 'cyan'}">${mod.badge || 'MOD'}</span>
      </div>
      <div class="mod-name">${mod.name}</div>
      <div class="mod-desc">${mod.description || 'Mod para ' + currentVersion}</div>
      <div class="mod-meta">
        <span class="mod-meta-item">
          <span class="material-symbols-outlined">deployed_code</span>
          ${mod.dllName}
        </span>
        <span class="mod-meta-item amber">
          <span class="material-symbols-outlined">keyboard</span>
          ${mod.key}
        </span>
      </div>
      <button class="btn-inject primary btn-inject-mod" data-dll="${mod.dllPath.replace(/\\/g, '\\\\')}">
        <span class="material-symbols-outlined">send</span>
        INYECTAR AHORA
      </button>
    `;
    grid.appendChild(card);
  }

  $$('.btn-inject-mod').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!targetPid) {
        showToast('No se detecto GTA V', 'error');
        return;
      }
      btn.classList.add('injecting');
      btn.disabled = true;
      btn.innerHTML = '<span class="material-symbols-outlined">sync</span> INYECTANDO...';

      try {
        const dllPath = btn.dataset.dll.replace(/\\\\/g, '\\');
        const res = await window.api.injectDLL(dllPath, targetPid);
        if (res.success) {
          showToast(res.message, 'success');
        } else {
          showToast(res.message, 'error');
        }
      } catch (e) {
        showToast('Error: ' + e.message, 'error');
      }

      btn.classList.remove('injecting');
      btn.disabled = false;
      btn.innerHTML = '<span class="material-symbols-outlined">send</span> INYECTAR AHORA';
    });
  });
}

// ============================================================
// SETTINGS - mods path
// ============================================================
window.api.getVersion().then(() => {
  $('#settings-mods-path').textContent = './mods (carpeta del launcher)';
});

// ============================================================
// AUTO-UPDATER
// ============================================================
let updateInfo = null;

$('#btn-check-update')?.addEventListener('click', () => {
  window.api.checkForUpdates();
  showToast('Buscando actualizaciones...', 'success');
});

$('#btn-install-update')?.addEventListener('click', () => {
  window.api.installUpdate();
});

window.api.onUpdateChecking(() => {
  showToast('Verificando actualizaciones...', 'success');
});

window.api.onUpdateAvailable((data) => {
  updateInfo = data;
  showToast('Actualizacion v' + data.version + ' disponible', 'success');
  const sub = $('#update-sub');
  if (sub) sub.textContent = 'Nueva version: v' + data.version;
});

window.api.onUpdateNotAvailable(() => {
  showToast('Ya tienes la ultima version', 'success');
});

window.api.onUpdateProgress((data) => {
  const prog = $('#update-progress');
  if (prog) prog.style.display = '';
  const fill = $('#progress-fill');
  const pct = $('#progress-percent');
  const txt = $('#progress-text');
  if (fill) fill.style.width = data.percent + '%';
  if (pct) pct.textContent = data.percent + '%';
  if (txt) txt.textContent = 'Descargando... ' + Math.round(data.transferred / 1024 / 1024) + 'MB / ' + Math.round(data.total / 1024 / 1024) + 'MB';
});

window.api.onUpdateDownloaded((data) => {
  const prog = $('#update-progress');
  if (prog) prog.style.display = 'none';
  const ready = $('#update-ready');
  if (ready) ready.style.display = '';
  const ver = $('#ready-version');
  if (ver) ver.textContent = 'Version ' + data.version + ' descargada exitosamente';
  showToast('Actualizacion lista para instalar', 'success');
});

window.api.onUpdateError((data) => {
  showToast('Error de actualizacion: ' + data.message, 'error');
});

// ============================================================
// TITLEBAR BUTTONS
// ============================================================
$('#btn-minimize').addEventListener('click', () => window.api.minimize());
$('#btn-maximize').addEventListener('click', () => window.api.maximize());
$('#btn-close').addEventListener('click', () => window.api.close());

// ============================================================
// INIT
// ============================================================
loadMods();
