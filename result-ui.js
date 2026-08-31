(function (root) {
  "use strict";
  const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = String(text); return node; };
  function resultText(result, compact = false) {
    const lines = [result.library.name];
    const b = result.book || {};
    if (!compact) [["书名", b.title], ["作者", b.author], ["出版社", b.publisher], ["出版时间", b.pubdate], ["ISBN", b.isbn]].forEach(([k, v]) => { if (v) lines.push(`${k}：${v}`); });
    result.holdings.forEach((h) => lines.push(`${h.location}｜索书号：${h.callNumber}｜${h.status}${h.returnDate ? `｜应还：${h.returnDate}` : ""}`));
    return lines.join("\n");
  }
  function card(result, compact = false) {
    const box = el("section", compact ? "dl-card dl-card--compact" : "dl-card");
    const head = el("div", "dl-card__head"); head.append(el("h2", "dl-card__title", result.library.name));
    const copy = el("button", "dl-copy", "复制"); copy.type = "button";
    copy.addEventListener("click", async () => { try { await navigator.clipboard.writeText(resultText(result, compact)); copy.textContent = "已复制"; setTimeout(() => copy.textContent = "复制", 1400); } catch { copy.textContent = "复制失败"; } });
    head.append(copy); box.append(head);
    if (result.error) { box.append(el("p", "dl-error", `查询失败：${result.error}`)); return box; }
    if (result.empty) { box.append(el("p", "dl-empty", "暂无此图书馆藏")); return box; }
    if (!compact) {
      const meta = el("dl", "dl-meta");
      [["书名", result.book.title], ["作者", result.book.author], ["出版社", result.book.publisher], ["出版时间", result.book.pubdate], ["ISBN", result.book.isbn]].forEach(([label, value]) => {
        if (!value) return; meta.append(el("dt", "", label), el("dd", "", value));
      }); box.append(meta);
    }
    const list = el("div", "dl-holdings");
    result.holdings.forEach((h) => {
      const row = el("article", "dl-holding");
      const top = el("div", "dl-holding__top"); top.append(el("strong", "", h.location), el("span", h.available ? "dl-status is-ok" : "dl-status", h.status));
      const detail = el("div", "dl-holding__detail"); detail.append(el("span", "", `索书号：${h.callNumber}`));
      if (h.loanableCount !== null && h.copyCount !== null) detail.append(el("span", "", `${h.loanableCount}/${h.copyCount} 可借`));
      if (h.returnDate) detail.append(el("span", "", `应还：${h.returnDate}`));
      row.append(top, detail); list.append(row);
    }); box.append(list); return box;
  }
  root.ResultUI = { card, resultText };
})(globalThis);
