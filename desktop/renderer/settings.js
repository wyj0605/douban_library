// ===== 设置窗口 · 选择查询图书馆 =====
(function () {
  let provinces = window.provinces || [];
  const MAX = 2;

  const grid = document.getElementById('libGrid');
  const countEl = document.getElementById('selectedCount');

  let selectedCodes = [];

  // 渲染所有图书馆选项
  function render() {
    grid.innerHTML = '';

    provinces.forEach((p) => {
      const label = document.createElement('label');
      label.className = 'lib-option';
      const code = String(p.code);
      const isChecked = selectedCodes.includes(code);

      if (isChecked) label.classList.add('checked');
      // 已选满 2 个时禁用未选项
      if (!isChecked && selectedCodes.length >= MAX) label.classList.add('disabled');

      label.innerHTML = `
        <input type="checkbox" data-code="${code}" ${isChecked ? 'checked' : ''} ${!isChecked && selectedCodes.length >= MAX ? 'disabled' : ''}>
        <span class="lib-name">${p.name}</span>
        <span class="check-mark">✓</span>
      `;

      label.addEventListener('click', (e) => {
        if (e.target.tagName === 'INPUT') return; // checkbox 自身触发 change
        const box = label.querySelector('input');
        if (box.disabled) return;
        box.checked = !box.checked;
        box.dispatchEvent(new Event('change'));
      });

      const box = label.querySelector('input');
      box.addEventListener('change', () => {
        if (box.checked && selectedCodes.length >= MAX) {
          box.checked = false;
          return;
        }
        if (box.checked) {
          selectedCodes.push(code);
        } else {
          selectedCodes = selectedCodes.filter((c) => c !== code);
        }
        save();
        render();
      });

      grid.appendChild(label);
    });

    updateCount();
  }

  function updateCount() {
    countEl.textContent = `已选择 ${selectedCodes.length} / ${MAX} 个图书馆`;
  }

  // 保存设置（自动触发主窗口刷新）
  async function save() {
    await window.desktop.saveSettings({ selectedCodes });
  }

  async function init() {
    try {
      const registry = await window.desktop.getLibraries(false);
      if (Array.isArray(registry.libraries) && registry.libraries.length) provinces = registry.libraries;
      const s = await window.desktop.getSettings();
      const valid = new Set(provinces.map((item) => String(item.code)));
      selectedCodes = (s.selectedCodes || []).map(String).filter((code) => valid.has(code)).slice(0, MAX);
    } catch (e) {
      selectedCodes = [];
    }
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
