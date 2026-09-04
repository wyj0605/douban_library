const { app, BrowserWindow, Menu, ipcMain, shell, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs');

// 查书接口地址
const SEARCH_API = 'https://navy82.icu/jilin_search';
const LIBRARIES_API = 'https://navy82.icu/api/libraries';
const LIBRARY_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

let mainWindow = null;
let settingsWindow = null;

// 设置存储路径（用户数据目录下）
const SETTINGS_FILE = () => path.join(app.getPath('userData'), 'settings.json');
const LIBRARIES_FILE = () => path.join(app.getPath('userData'), 'libraries.json');

// 默认设置：默认选中黑龙江省图书馆
const DEFAULT_SETTINGS = { selectedCodes: ['1'] };

function loadSettings() {
  try {
    const raw = fs.readFileSync(SETTINGS_FILE(), 'utf-8');
    const data = JSON.parse(raw);
    return {
      selectedCodes: Array.isArray(data.selectedCodes) ? data.selectedCodes.slice(0, 2) : DEFAULT_SETTINGS.selectedCodes,
    };
  } catch (e) {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(settings) {
  const dir = path.dirname(SETTINGS_FILE());
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(SETTINGS_FILE(), JSON.stringify(settings, null, 2), 'utf-8');
}

function loadLibraryCache() {
  try {
    const data = JSON.parse(fs.readFileSync(LIBRARIES_FILE(), 'utf-8'));
    return Array.isArray(data.libraries) && data.libraries.length ? data : null;
  } catch (_e) {
    return null;
  }
}

function saveLibraryCache(data) {
  const dir = path.dirname(LIBRARIES_FILE());
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(LIBRARIES_FILE(), JSON.stringify(data, null, 2), 'utf-8');
}

async function getLibraryRegistry(force = false) {
  const cached = loadLibraryCache();
  if (!force && cached && Date.now() - Number(cached.fetchedAt || 0) < LIBRARY_CACHE_TTL_MS) {
    return { ...cached, source: 'cache' };
  }
  try {
    const headers = {};
    if (cached && cached.etag) headers['If-None-Match'] = cached.etag;
    const response = await fetchWithTimeout(LIBRARIES_API, { headers }, 15000);
    if (response.status === 304 && cached) {
      const fresh = { ...cached, fetchedAt: Date.now() };
      saveLibraryCache(fresh);
      return { ...fresh, source: 'cache' };
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const libraries = (payload.libraries || [])
      .filter((item) => item.enabled !== false)
      .map((item) => ({ code: String(item.code), name: String(item.name || '图书馆') }));
    if (!libraries.length) throw new Error('服务端图书馆列表为空');
    const data = { libraries, version: payload.version || '',
      etag: response.headers.get('etag') || '', fetchedAt: Date.now() };
    saveLibraryCache(data);
    return { ...data, source: 'server' };
  } catch (error) {
    if (cached) return { ...cached, source: 'stale-cache', warning: error.message };
    return { libraries: [], version: '', fetchedAt: 0, source: 'bundled', warning: error.message };
  }
}

// 创建主窗口
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1040,
    height: 760,
    minWidth: 720,
    minHeight: 560,
    title: '查书助手',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1e1e1e' : '#f7f7f7',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // 外部链接用系统浏览器打开
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 创建设置窗口
function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 760,
    height: 640,
    title: '设置 - 查询图书馆',
    parent: mainWindow,
    modal: false,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  settingsWindow.loadFile(path.join(__dirname, 'renderer', 'settings.html'));
  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

// macOS 原生应用菜单
function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    {
      label: '编辑',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: '显示',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: '窗口',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' },
        ] : [{ role: 'close' }]),
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ===== 查书 IPC：在主进程发起请求，避免浏览器跨域限制 =====
const REQUEST_TIMEOUT_MS = 15000; // 单次请求超时
const MAX_RETRY = 1; // 失败重试次数

async function fetchWithTimeout(url, options, timeoutMs) {
  return fetch(url, { ...options, signal: AbortSignal.timeout(timeoutMs) });
}

// 单个图书馆查询（带重试）
async function queryLibrary(code, q) {
  let lastError = null;
  for (let attempt = 0; attempt <= MAX_RETRY; attempt++) {
    try {
      const res = await fetchWithTimeout(
        SEARCH_API,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q, code: String(code), v: 2, client: 'desktop-electron' }),
        },
        REQUEST_TIMEOUT_MS
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      try {
        return { code, data: JSON.parse(text) };
      } catch (e) {
        return { code, data: null, error: '接口返回数据格式错误' };
      }
    } catch (err) {
      lastError = err;
    }
  }
  const msg = lastError && lastError.name === 'TimeoutError' ? '查询超时，请稍后重试' : '查询失败，请检查网络或稍后重试';
  return { code, data: null, error: msg };
}

ipcMain.handle('search-book', async (_event, { query, codes }) => {
  const q = String(query || '').trim();
  const list = Array.isArray(codes) ? codes.filter(Boolean) : [];

  if (!q || list.length === 0) {
    return { ok: false, error: '查询词或图书馆为空' };
  }

  // 并行查询每个图书馆
  const settled = await Promise.allSettled(list.map((code) => queryLibrary(code, q)));
  const results = settled.map((s, i) => (s.status === 'fulfilled' ? s.value : { code: list[i], data: null, error: '查询失败' }));
  return { ok: true, results };
});

// 设置读写 IPC
ipcMain.handle('get-settings', () => loadSettings());
ipcMain.handle('save-settings', (_e, settings) => {
  saveSettings(settings);
  if (mainWindow) {
    mainWindow.webContents.send('settings-updated', settings);
  }
  return { ok: true };
});

ipcMain.handle('get-libraries', async (_e, options = {}) => {
  const registry = await getLibraryRegistry(Boolean(options.force));
  if (registry.libraries.length) {
    const valid = new Set(registry.libraries.map((item) => item.code));
    const settings = loadSettings();
    const selectedCodes = settings.selectedCodes.map(String).filter((code) => valid.has(code)).slice(0, 2);
    if (selectedCodes.join(',') !== settings.selectedCodes.map(String).join(',')) {
      saveSettings({ selectedCodes });
      if (mainWindow) mainWindow.webContents.send('settings-updated', { selectedCodes });
    }
  }
  return registry;
});

// 打开设置窗口
ipcMain.handle('open-settings', () => {
  createSettingsWindow();
  return { ok: true };
});

app.whenReady().then(() => {
  buildMenu();
  createMainWindow();
  getLibraryRegistry(false).catch(() => {});

  // macOS：点击 Dock 图标时若无窗口则重建
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

// macOS：关闭所有窗口时保留应用（符合平台习惯）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
