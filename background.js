const city_info_map = {
    "1": "http://1.189.39.9:2333",

};

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

chrome.runtime.onInstalled.addListener(() => {
  
    chrome.contextMenus.create({

      id: "searchBaidu",
      title: "图书馆查询助手：%s",
      contexts: ["selection"]
    });
  });
  
// 监听右键菜单点击事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "searchLibrary" && info.selectionText) {
        chrome.storage.local.get(["getProvinceStatus"], function(items) {
            const getProvinceStatus = items.code;
            const libraryInfo = city_info_map[getProvinceStatus];

            if (libraryInfo) {
                const [province, baseUrl] = libraryInfo;
                const query = encodeURIComponent(info.selectionText);
                const url = `${baseUrl}?searchWay=title&q=${query}&searchSource=reader&scWay=dim&marcformat=&sortWay=score&sortOrder=desc&startPubdate=&endPubdate=&rows=10&hasholding=1`;
                chrome.tabs.create({ url: url });
            } else {
                console.error("Invalid library code or library not found.");
            }
        });
    }
});