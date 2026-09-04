const { contextBridge, ipcRenderer } = require('electron');

// 通过 contextBridge 向渲染进程暴露安全的 API
contextBridge.exposeInMainWorld('desktop', {
  // 查书：query 为书名或 ISBN，codes 为图书馆代码数组
  searchBook: (query, codes) => ipcRenderer.invoke('search-book', { query, codes }),

  // 设置
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  getLibraries: (force = false) => ipcRenderer.invoke('get-libraries', { force }),

  // 打开设置窗口
  openSettings: () => ipcRenderer.invoke('open-settings'),

  // 设置更新通知（主窗口监听）
  onSettingsUpdated: (callback) => {
    ipcRenderer.on('settings-updated', (_e, settings) => callback(settings));
  },

  platform: process.platform,
});
