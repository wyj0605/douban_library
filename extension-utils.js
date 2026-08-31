(function (root) {
  "use strict";
  const MAX_LIBRARIES = 2;
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
      library: { code: String(library.code || ""), name: library.name || "图书馆" },
      book: { title: book.title || holdings[0]?.title || "", author: book.author || holdings[0]?.author || "", publisher: book.publisher || holdings[0]?.publisher || "", pubdate: book.pubdate || holdings[0]?.pubdate || "", isbn: payload?.isbn || book.isbn || "" },
      holdings: holdings.map((item) => ({ location: item.location || "馆藏地点未标注", callNumber: item.call_number || "未知", status: item.status || (item.available ? "在馆" : "未知"), available: item.available === true || Number(item.loanable_count) > 0, loanableCount: Number.isFinite(Number(item.loanable_count)) ? Number(item.loanable_count) : null, copyCount: Number.isFinite(Number(item.copy_count)) ? Number(item.copy_count) : null, returnDate: item.return_date || "" }))
    };
  }
  root.ExtensionUtils = { MAX_LIBRARIES, uniqueCodes, migrateSelection, extractIsbn, normalizeResponse };
})(globalThis);
