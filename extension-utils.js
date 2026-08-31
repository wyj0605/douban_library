(function (root) {
  "use strict";
  const MAX_LIBRARIES = 2;
  const LIBRARY_DISPLAY_NAMES = {
    "3": "湖南省图书馆", "5": "浙江省图书馆", "12": "成都市图书馆", "16": "杭州市图书馆",
    "20": "广州市图书馆", "22": "武汉市图书馆", "25": "绍兴市图书馆", "29": "长沙市图书馆",
    "35": "东莞市图书馆", "37": "深圳市图书馆", "38": "上海市浦东图书馆", "41": "重庆市图书馆",
    "45": "江苏省南京图书馆", "58": "上海市图书馆", "67": "烟台市图书馆", "69": "苏州市图书馆",
    "75": "天津市图书馆", "77": "北京市首都图书馆", "79": "南京市金陵图书馆", "82": "宁波市图书馆"
  };
  function normalizeLibraryName(code, name) {
    const normalizedCode = String(code || "");
    if (LIBRARY_DISPLAY_NAMES[normalizedCode]) return LIBRARY_DISPLAY_NAMES[normalizedCode];
    const value = String(name || "图书馆").trim();
    return /图书馆$/.test(value) ? value : `${value}图书馆`;
  }
  function uniqueCodes(codes, validCodes) {
    const valid = validCodes ? new Set(validCodes.map(String)) : null;
    return [...new Set((codes || []).map(String))].filter((code) => !valid || valid.has(code)).slice(0, MAX_LIBRARIES);
  }
  function migrateSelection(data, validCodes) {
    const modern = data && data.settings && Array.isArray(data.settings.selectedLibraries);
    const stored = modern ? data.settings.selectedLibraries : Object.keys(data || {}).filter((key) => data[key] === true);
    const migrated = stored.map((code) => String(code) === "63" && !modern ? "86" : String(code));
    return uniqueCodes(migrated, validCodes);
  }
  function extractIsbn(text) {
    const matches = String(text || "").match(/(?:97[89][\d\s-]{10,16}|\b\d[\d\s-]{7,14}[\dXx]\b)/g) || [];
    for (const match of matches) {
      const value = match.replace(/[^0-9Xx]/g, "");
      if (value.length === 10 || value.length === 13) return value.toUpperCase();
    }
    return "";
  }
  function normalizeResponse(payload, fallback) {
    const library = payload?.library || fallback || {};
    const book = payload?.book || {};
    const holdings = Array.isArray(payload?.holdings) ? payload.holdings : [];
    return {
      ok: Boolean(payload?.ok), empty: !payload?.ok || holdings.length === 0,
      library: { code: String(library.code || ""), name: normalizeLibraryName(library.code, library.name) },
      book: { title: book.title || holdings[0]?.title || "", author: book.author || holdings[0]?.author || "", publisher: book.publisher || holdings[0]?.publisher || "", pubdate: book.pubdate || holdings[0]?.pubdate || "", isbn: payload?.isbn || book.isbn || "" },
      holdings: holdings.map((item) => {
        const hasLoanableCount = item.loanable_count !== null && item.loanable_count !== undefined && item.loanable_count !== "";
        const hasCopyCount = item.copy_count !== null && item.copy_count !== undefined && item.copy_count !== "";
        const loanableCount = hasLoanableCount && Number.isFinite(Number(item.loanable_count)) ? Number(item.loanable_count) : null;
        const copyCount = hasCopyCount && Number.isFinite(Number(item.copy_count)) ? Number(item.copy_count) : null;
        const available = item.available === true || (loanableCount !== null && loanableCount > 0);
        const status = item.status || (available ? "在馆" : loanableCount === 0 ? "借出" : "状态未提供");
        return { location: item.location || "馆藏地点未标注", callNumber: item.call_number || "未知", status, available, loanableCount, copyCount, returnDate: item.return_date || "" };
      })
    };
  }
  root.ExtensionUtils = { MAX_LIBRARIES, uniqueCodes, migrateSelection, extractIsbn, normalizeLibraryName, normalizeResponse };
})(globalThis);
