
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

