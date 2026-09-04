// ===== 查书助手 · 主界面逻辑 =====
(function () {
  // provinces 来自 provinces.js（同目录，全局变量）
  let provinces = window.provinces || [];

  const els = {
    input: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    chips: document.getElementById('libChips'),
    status: document.getElementById('status'),
    results: document.getElementById('results'),
  };

  let selectedCodes = [];
  let settings = null;

  function displayLibraryName(item) {
    if (!item) return '图书馆';
    const name = String(item.name || '').trim();
    return /图书馆$/.test(name) ? name : name + '图书馆';
  }

  // 初始化：读取设置
  async function init() {
    try {
      const registry = await window.desktop.getLibraries(false);
      if (Array.isArray(registry.libraries) && registry.libraries.length) provinces = registry.libraries;
      settings = await window.desktop.getSettings();
    } catch (e) {
      settings = { selectedCodes: [] };
    }
    selectedCodes = settings.selectedCodes || [];
    renderChips();
    bindEvents();
  }

  function bindEvents() {
    els.searchBtn.addEventListener('click', doSearch);
    els.settingsBtn.addEventListener('click', () => window.desktop.openSettings());
    els.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doSearch();
    });

    // 设置窗口保存后自动刷新
    window.desktop.onSettingsUpdated((s) => {
      selectedCodes = s.selectedCodes || [];
      renderChips();
    });
  }

  // 渲染已选图书馆标签
  function renderChips() {
    els.chips.innerHTML = '';
    if (selectedCodes.length === 0) {
      const hint = document.createElement('span');
      hint.className = 'empty-hint';
      hint.textContent = '请先在设置中选择图书馆';
      els.chips.appendChild(hint);
      return;
    }
    selectedCodes.forEach((code) => {
      const p = provinces.find((x) => String(x.code) === String(code));
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.textContent = p ? displayLibraryName(p) : '图书馆 ' + code;
      els.chips.appendChild(chip);
    });
  }

  // 查找图书馆名称
  function libName(code) {
    const p = provinces.find((x) => String(x.code) === String(code));
    return displayLibraryName(p);
  }

  // 状态提示
  function showStatus(type, msg) {
    els.status.hidden = !msg;
    els.status.textContent = msg || '';
    els.status.className = 'status ' + (type || 'info');
  }

  // ===== 查书 =====
  async function doSearch() {
    const query = els.input.value.trim();
    if (!query) {
      showStatus('error', '请输入书名或 ISBN');
      return;
    }
    if (selectedCodes.length === 0) {
      showStatus('error', '请先在设置中选择图书馆');
      window.desktop.openSettings();
      return;
    }

    els.searchBtn.disabled = true;
    showStatus('info', `正在查询「${query}」在 ${selectedCodes.length} 个图书馆的馆藏信息…`);
    els.results.innerHTML = '';

    try {
      const res = await window.desktop.searchBook(query, selectedCodes);
      showStatus('', '');
      if (!res || !res.ok) {
        showStatus('error', '查询失败，请稍后重试');
        return;
      }
      renderResults(res.results);
    } catch (e) {
      showStatus('error', '查询出错：' + (e && e.message ? e.message : e));
    } finally {
      els.searchBtn.disabled = false;
    }
  }

  // 归一化单条馆藏记录
  function normalizeItem(item) {
    if (!item || typeof item !== 'object') return null;
    // 跳过无实际馆藏数据的对象（如 {"msg":"nobook"}）
    if (!item.title && !item.callno && !item.curlibName) return null;

    const loanable = item.loanableCount;
    const hasCount = loanable !== null && loanable !== undefined;
    const available = hasCount ? loanable > 0 : /在馆|可借/.test(String(item.status || ''));
    const statusText = hasCount
      ? `${loanable}/${item.copycount} ${loanable > 0 ? '在馆' : '借出'}`
      : (item.status || item.checkout || '未知');

    return {
      library: item.curlibName || '',
      title: item.title || '',
      author: item.author || '',
      publisher: item.publisher || '',
      pubdate: item.pubdate || '',
      location: item.curlocalName || '未知',
      callno: item.callno || '未知',
      statusText,
      available,
      retudate: item.retudate || '',
    };
  }

  // 解析某个图书馆的返回数据 → { items: [] }
  function parseLibraryResult(data) {
    if (!data) return { items: [] };
    if (data.version === 2 && Array.isArray(data.holdings)) {
      const book = data.book || {};
      const library = data.library || {};
      return { items: data.holdings.map((item) => normalizeItem({
        title: item.title || book.title,
        author: item.author || book.author,
        publisher: item.publisher || book.publisher,
        pubdate: item.pubdate || book.pubdate,
        curlibName: item.library_name || library.name,
        curlocalName: item.location,
        callno: item.call_number,
        status: item.status,
        loanableCount: item.loanable_count,
        copycount: item.copy_count,
        retudate: item.return_date
      })).filter(Boolean) };
    }
    // 无馆藏
    if (typeof data === 'object' && data.msg === 'nobook') return { items: [] };
    if (typeof data === 'object' && data.msg === 'success' && Array.isArray(data.data)) {
      return { items: data.data.map(normalizeItem).filter(Boolean) };
    }
    if (Array.isArray(data)) {
      // 扁平数组：每条为一条馆藏记录
      const items = data.map(normalizeItem).filter(Boolean);
      return { items };
    }
    if (typeof data === 'object') {
      const item = normalizeItem(data);
      return { items: item ? [item] : [] };
    }
    return { items: [] };
  }

  // 渲染所有图书馆的结果
  function renderResults(results) {
    const groups = (results || []).filter((r) => !r.error);
    const hasAny = groups.some((r) => parseLibraryResult(r.data).items.length > 0);
    const hasError = (results || []).some((r) => r.error);

    // 每个图书馆一个分组
    (results || []).forEach((r, idx) => {
      const group = document.createElement('section');
      group.className = 'lib-group';
      group.style.animationDelay = (idx * 0.05) + 's';

      const { items } = parseLibraryResult(r.data);

      // 头部
      const head = document.createElement('div');
      head.className = 'lib-group-head';
      const h2 = document.createElement('h2');
      h2.textContent = libName(r.code);
      head.appendChild(h2);

      if (items.length > 0) {
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.textContent = '复制';
        copyBtn.addEventListener('click', () => copyGroup(copyBtn, r.code, items));
        head.appendChild(copyBtn);
      }
      group.appendChild(head);

      if (items.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'lib-group-empty';
        if (r.error) {
          empty.innerHTML = '<div class="big">⚠️</div>' + escapeHtml(r.error);
        } else {
          empty.innerHTML = '<div class="big">📚</div>该馆暂无此图书的馆藏信息';
        }
        group.appendChild(empty);
      } else {
        items.forEach((item, i) => {
          group.appendChild(renderBookItem(item, i));
        });
      }

      els.results.appendChild(group);
    });

    if (hasAny) {
      showStatus('', '');
    } else if (hasError) {
      showStatus('error', '部分或全部图书馆查询失败，请检查网络后重试');
    } else {
      showStatus('info', '所有图书馆均未查询到该图书的馆藏信息');
    }
  }

  // 渲染单条图书条目
  function renderBookItem(item, i) {
    const div = document.createElement('div');
    div.className = 'book-item';

    let meta = [];
    if (item.author) meta.push(`<span>作者：<b>${escapeHtml(item.author)}</b></span>`);
    if (item.publisher || item.pubdate) {
      const pub = [item.publisher, item.pubdate].filter(Boolean).join(' / ');
      meta.push(`<span>出版信息：<b>${escapeHtml(pub)}</b></span>`);
    }
    if (item.callno !== '未知' && item.callno) {
      meta.push(`<span>索书号：<b>${escapeHtml(item.callno)}</b></span>`);
    }

    const retu = item.retudate
      ? `<span class="retudate">预计归还：${escapeHtml(item.retudate)}</span>`
      : '';

    div.innerHTML = `
      <div class="book-title">${escapeHtml(item.title) || '（无书名信息）'}</div>
      <div class="book-meta">${meta.join('')}</div>
      <div class="holding-row">
        <span class="loc">📍 ${escapeHtml(item.location)}</span>
        <span class="status-badge ${item.available ? 'available' : 'unavailable'}">${escapeHtml(item.statusText)}</span>
        ${retu}
      </div>
    `;
    return div;
  }

  // 复制整组（某图书馆）的查询结果
  async function copyGroup(btn, code, items) {
    let text = libName(code) + '\n';
    items.forEach((item, i) => {
      if (i > 0) text += '\n';
      if (item.title) text += '书名：' + item.title + '\n';
      if (item.author) text += '作者：' + item.author + '\n';
      if (item.publisher || item.pubdate) {
        text += '出版信息：' + [item.publisher, item.pubdate].filter(Boolean).join(' / ') + '\n';
      }
      text += `所在位置：${item.location}  索书号：${item.callno}  ${item.statusText}`;
      if (item.retudate) text += '（预计归还：' + item.retudate + '）';
    });

    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = '已复制';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = '复制';
        btn.classList.remove('copied');
      }, 2000);
    } catch (e) {
      showStatus('error', '复制失败');
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  document.addEventListener('DOMContentLoaded', init);

  // 开发/测试钩子：供自动化验证渲染逻辑（不影响正常运行）
  window.__test = { parseLibraryResult, renderResults, normalizeItem, libName };
})();
