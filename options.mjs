const list = document.getElementById("provinceList");
const search = document.getElementById("librarySearch");
const onlySelected = document.getElementById("onlySelected");
const count = document.getElementById("selectedCount");
const notice = document.getElementById("notice");
let libraries = [], selected = [];
const CAPITAL_CITIES = ["哈尔滨", "长春", "沈阳", "石家庄", "太原", "济南", "郑州", "南京", "杭州", "合肥", "福州", "南昌", "武汉", "长沙", "广州", "海口", "成都", "贵阳", "昆明", "西安", "兰州", "西宁", "呼和浩特", "南宁", "拉萨", "银川", "乌鲁木齐"];
const PROVINCIAL_CODES = new Set(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "13", "41", "42", "45", "57", "58", "59", "60", "61", "62", "74", "75", "76", "77", "78", "83", "84", "85", "86", "87", "88"]);
const collator = new Intl.Collator("zh-CN");
function libraryGroup(item) {
  const name = item.name || "";
  if (PROVINCIAL_CODES.has(String(item.code)) || /省图书馆$|自治区图书馆$/.test(name)) return 0;
  if (CAPITAL_CITIES.some((city) => name.startsWith(city))) return 1;
  return 2;
}
async function load(refresh = false) {
  const state = await chrome.runtime.sendMessage({ action: refresh ? "refreshLibraryRegistry" : "getExtensionState" });
  if (state.error) throw new Error(state.error);
  libraries = state.libraries; selected = state.selectedLibraries; render();
}
function render() {
  const keyword = search.value.trim().toLowerCase();
  const filtered = libraries.filter((item) => (!keyword || item.name.toLowerCase().includes(keyword) || item.code.includes(keyword)) && (!onlySelected.checked || selected.includes(item.code)))
    .sort((a, b) => libraryGroup(a) - libraryGroup(b) || collator.compare(a.name, b.name));
  const nodes = [];
  let previousGroup = -1;
  filtered.forEach((item) => {
    const group = libraryGroup(item);
    if (group !== previousGroup) {
      const heading = document.createElement("h2"); heading.className = "library-group"; heading.textContent = ["省级图书馆", "省会城市图书馆", "其他城市图书馆"][group]; nodes.push(heading); previousGroup = group;
    }
    const label = document.createElement("label"); label.className = "library-option";
    const input = document.createElement("input"); input.type = "checkbox"; input.checked = selected.includes(item.code); input.disabled = selected.length >= 2 && !input.checked;
    const name = document.createElement("span"); name.textContent = item.name;
    input.addEventListener("change", async () => {
      if (input.checked) selected = [...selected, item.code].slice(0, 2); else selected = selected.filter((value) => value !== item.code);
      await chrome.storage.local.set({ settings: { selectedLibraries: selected } }); notice.textContent = "已自动保存"; render(); setTimeout(() => notice.textContent = "", 1200);
    }); label.append(input, name); nodes.push(label);
  });
  list.replaceChildren(...nodes);
  count.textContent = `已选择 ${selected.length}/2`;
}
search.addEventListener("input", render); onlySelected.addEventListener("change", render);
document.getElementById("resetSelection").addEventListener("click", async () => { selected = [libraries[0]?.code || "1"]; await chrome.storage.local.set({ settings: { selectedLibraries: selected } }); notice.textContent = "已恢复默认图书馆"; render(); });
document.getElementById("refreshLibraries").addEventListener("click", () => load(true));
load().catch((error) => { notice.textContent = `加载失败：${error.message}`; });
