importScripts("provinces.js", "extension-utils.js");
const API_BASE = "https://navy82.icu";
const REQUEST_TIMEOUT = 20000;
const FALLBACK_LIBRARIES = globalThis.LIBRARIES || [];

async function fetchJson(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  try {
    const response = await fetch(`${API_BASE}${path}`, { ...options, signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    if (error.name === "AbortError") throw new Error("请求超时，请稍后重试");
    throw error;
  } finally { clearTimeout(timer); }
}

async function getLibraries(refresh = false) {
  const stored = await chrome.storage.local.get(["libraryRegistry"]);
  if (!refresh && Array.isArray(stored.libraryRegistry) && stored.libraryRegistry.length) return stored.libraryRegistry;
  try {
    const data = await fetchJson("/api/libraries");
    const libraries = (data.libraries || []).map((item) => ({ code: String(item.code), name: String(item.name) }));
    if (libraries.length) { await chrome.storage.local.set({ libraryRegistry: libraries }); return libraries; }
  } catch (error) { console.warn("图书馆列表更新失败，使用离线列表:", error.message); }
  return FALLBACK_LIBRARIES;
}

async function getState(refresh = false) {
  const libraries = await getLibraries(refresh);
  const stored = await chrome.storage.local.get(null);
  let selectedLibraries = ExtensionUtils.migrateSelection(stored, libraries.map((item) => item.code));
  if (!selectedLibraries.length) selectedLibraries = [libraries[0]?.code || "1"];
  await chrome.storage.local.set({ settings: { selectedLibraries } });
  const legacyKeys = Object.keys(stored).filter((key) => stored[key] === true);
  if (legacyKeys.length) await chrome.storage.local.remove(legacyKeys);
  return { libraries, selectedLibraries };
}

async function searchOne(query, code, libraries) {
  const fallback = libraries.find((item) => item.code === code) || { code, name: `图书馆 ${code}` };
  try {
    const payload = await fetchJson("/jilin_search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query, code, v: 2, client: "browser-extension", extension_version: "1.4.0" }) });
    return ExtensionUtils.normalizeResponse(payload, fallback);
  } catch (error) {
    return { ok: false, empty: false, library: fallback, book: {}, holdings: [], error: error.message || "查询失败" };
  }
}

async function searchBooks(query, codes) {
  const state = await getState();
  const selected = ExtensionUtils.uniqueCodes(codes?.length ? codes : state.selectedLibraries, state.libraries.map((item) => item.code));
  return Promise.all(selected.map((code) => searchOne(String(query || "").trim(), code, state.libraries)));
}

async function createContextMenu() {
  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({ id: "searchBook", title: '查书助手 “%s”', contexts: ["selection"] });
}
chrome.runtime.onInstalled.addListener(() => { createContextMenu(); getState(true); });
chrome.runtime.onStartup.addListener(() => { createContextMenu(); getState(true); });
chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== "searchBook" || !info.selectionText?.trim()) return;
  const state = await getState();
  const url = new URL(chrome.runtime.getURL("search.html"));
  url.searchParams.set("query", info.selectionText.trim());
  url.searchParams.set("codes", state.selectedLibraries.join(","));
  chrome.windows.create({ url: url.href, type: "popup", width: 760, height: 720 });
});
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    if (request.action === "getExtensionState") return getState(false);
    if (request.action === "refreshLibraryRegistry") return getState(true);
    if (request.action === "searchBooks") return { results: await searchBooks(request.query, request.codes) };
    throw new Error("未知操作");
  })().then(sendResponse).catch((error) => sendResponse({ error: error.message || "操作失败" }));
  return true;
});
