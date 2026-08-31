(function () {
  "use strict";
  const loading = document.getElementById("loading");
  const result = document.getElementById("result");
  const errorBox = document.getElementById("error");
  document.getElementById("closeBtn").addEventListener("click", () => window.close());
  async function run() {
    const params = new URLSearchParams(location.search);
    const query = (params.get("query") || "").trim();
    const codes = (params.get("codes") || params.get("code") || "").split(",").filter(Boolean);
    if (!query) { loading.hidden = true; errorBox.textContent = "请输入书名或 ISBN"; errorBox.style.display = "block"; return; }
    try {
      const response = await chrome.runtime.sendMessage({ action: "searchBooks", query, codes });
      if (response.error) throw new Error(response.error);
      loading.style.display = "none"; result.style.display = "block"; result.classList.add("dl-results");
      result.replaceChildren(...response.results.map((item) => ResultUI.card(item)));
    } catch (error) {
      loading.style.display = "none"; errorBox.style.display = "block"; errorBox.textContent = `查询失败：${error.message}`;
      const retry = document.createElement("button"); retry.type = "button"; retry.className = "close-btn"; retry.textContent = "重试";
      retry.addEventListener("click", () => { errorBox.style.display = "none"; retry.remove(); loading.style.display = "flex"; run(); });
      errorBox.after(retry);
    }
  }
  run();
})();
