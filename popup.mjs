const list = document.getElementById("provinceList");
async function render() {
  const state = await chrome.runtime.sendMessage({ action: "getExtensionState" });
  if (state.error) { list.textContent = `读取失败：${state.error}`; return; }
  const selected = state.selectedLibraries.map((code) => state.libraries.find((item) => item.code === code)).filter(Boolean);
  list.replaceChildren(...selected.map((item) => { const p = document.createElement("p"); p.className = "selected-library"; p.textContent = `✓ ${item.name}`; return p; }));
  if (!selected.length) list.textContent = "尚未选择图书馆";
}
document.getElementById("openOptions").addEventListener("click", () => chrome.runtime.openOptionsPage());
chrome.storage.onChanged.addListener(render); render();
