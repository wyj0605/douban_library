chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {



    if (request.action === "getProvinceStatus") {
        // 读取存储的省份状态数据
        chrome.storage.local.get(null, function(items) {
            // 发送存储的省份状态数据给content.js
            sendResponse({ provinceStatus: items });
        });
        // 返回true以确保sendResponse异步调用
        return true;
    }
}); 

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === 'plugin_started') {
      // 插件开始运行时设置徽章
      chrome.browserAction.setBadgeText({ text: 'ON' });
      chrome.browserAction.setBadgeBackgroundColor({ color: '#00FF00' });
    } else if (message.action === 'plugin_stopped') {
      // 插件停止运行时清除徽章
      chrome.browserAction.setBadgeText({ text: '' });
    }
  });