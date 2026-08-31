const list = document.getElementById("provinceList");
const search = document.getElementById("librarySearch");
const onlySelected = document.getElementById("onlySelected");
const count = document.getElementById("selectedCount");
const notice = document.getElementById("notice");
let libraries = [], selected = [];
async function load(refresh = false) {
  const state = await chrome.runtime.sendMessage({ action: refresh ? "refreshLibraryRegistry" : "getExtensionState" });
  if (state.error) throw new Error(state.error);
  libraries = state.libraries; selected = state.selectedLibraries; render();
}
function render() {
  const keyword = search.value.trim().toLowerCase();
  const filtered = libraries.filter((item) => (!keyword || item.name.toLowerCase().includes(keyword) || item.code.includes(keyword)) && (!onlySelected.checked || selected.includes(item.code)));
  list.replaceChildren(...filtered.map((item) => {
    const label = document.createElement("label"); label.className = "library-option";
    const input = document.createElement("input"); input.type = "checkbox"; input.checked = selected.includes(item.code); input.disabled = selected.length >= 2 && !input.checked;
    const name = document.createElement("span"); name.textContent = item.name;
    input.addEventListener("change", async () => {
      if (input.checked) selected = [...selected, item.code].slice(0, 2); else selected = selected.filter((value) => value !== item.code);
      await chrome.storage.local.set({ settings: { selectedLibraries: selected } }); notice.textContent = "已自动保存"; render(); setTimeout(() => notice.textContent = "", 1200);
    }); label.append(input, name); return label;
  }));
  count.textContent = `已选择 ${selected.length}/2`;
}
search.addEventListener("input", render); onlySelected.addEventListener("change", render);
document.getElementById("resetSelection").addEventListener("click", async () => { selected = [libraries[0]?.code || "1"]; await chrome.storage.local.set({ settings: { selectedLibraries: selected } }); notice.textContent = "已恢复默认图书馆"; render(); });
document.getElementById("refreshLibraries").addEventListener("click", () => load(true));
load().catch((error) => { notice.textContent = `加载失败：${error.message}`; });
