import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const context = { globalThis: {} };
vm.runInNewContext(fs.readFileSync(new URL("../extension-utils.js", import.meta.url), "utf8"), context);
const U = context.globalThis.ExtensionUtils;
test("提取 ISBN-13 与 ISBN-10", () => {
  assert.equal(U.extractIsbn("ISBN: 978-7-02-019762-0"), "9787020197620");
  assert.equal(U.extractIsbn("ISBN 7-101-00000-X"), "710100000X");
});
test("旧版 63 布尔设置迁移到云南 86，并限制两个馆", () => {
  assert.deepEqual([...U.migrateSelection({ "63": true, "85": true }, ["85", "86"])], ["86", "85"]);
  assert.deepEqual([...U.migrateSelection({ settings: { selectedLibraries: ["63"] } }, ["63", "86"])], ["63"]);
});
test("结构化响应保留真实馆藏状态和元数据", () => {
  const value = U.normalizeResponse({ ok: true, isbn: "9787020197620", library: { code: "85", name: "海南省图书馆" }, holdings: [{ title: "咸的玩笑", author: "刘震云著", publisher: "人民文学出版社", pubdate: "2026", status: "锁定", location: "文学区", call_number: "I247", loanable_count: 0, copy_count: 1 }] });
  assert.equal(value.book.author, "刘震云著"); assert.equal(value.holdings[0].status, "锁定"); assert.equal(value.empty, false);
});
test("空结果可稳定识别", () => { assert.equal(U.normalizeResponse({ ok: true, holdings: [] }, { code: "1", name: "黑龙江省图书馆" }).empty, true); });
test("图书馆显示名称统一包含省市行政区", () => {
  assert.equal(U.normalizeLibraryName("5", "浙江图书馆"), "浙江省图书馆");
  assert.equal(U.normalizeLibraryName("20", "广州图书馆"), "广州市图书馆");
  assert.equal(U.normalizeLibraryName("77", "首都图书馆"), "北京市首都图书馆");
  assert.equal(U.normalizeLibraryName("85", "海南省图书馆"), "海南省图书馆");
});
