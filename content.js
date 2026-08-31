(async function () {
  "use strict";
  const info = document.querySelector("#info")?.textContent || "";
  const isbn = ExtensionUtils.extractIsbn(info);
  if (!isbn) return;
  const anchor = document.querySelector("#info")?.parentElement || document.querySelector("#interest_sectl") || document.body;
  const root = document.createElement("div"); root.id = "douban-library-results"; root.className = "dl-results dl-results--douban";
  root.append(Object.assign(document.createElement("p"), { className: "dl-loading", textContent: "正在查询馆藏…" }));
  anchor.insertAdjacentElement("afterend", root);
  try {
    const state = await chrome.runtime.sendMessage({ action: "getExtensionState" });
    if (state.error) throw new Error(state.error);
    const response = await chrome.runtime.sendMessage({ action: "searchBooks", query: isbn, codes: state.selectedLibraries });
    if (response.error) throw new Error(response.error);
    root.replaceChildren(...response.results.map((result) => ResultUI.card(result, true)));
  } catch (error) {
    const message = document.createElement("p"); message.className = "dl-error"; message.textContent = `馆藏查询失败：${error.message}`; root.replaceChildren(message);
  }
})();
