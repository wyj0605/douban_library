// 创建右键菜单
chrome.runtime.onInstalled.addListener(function() {
    chrome.contextMenus.create({
        id: "searchBook",
        title: '查书助手 "%s"',
        contexts: ["selection"]
    });
});

// 监听右键菜单点击
chrome.contextMenus.onClicked.addListener(function(info, tab) {
    if (info.menuItemId === "searchBook") {
        const selectedText = info.selectionText;
        console.log('右键查书，选中的文本:', selectedText);

        // 先读取 chrome.storage.local 中的 code 值
        chrome.storage.local.get(null, function(items) {
            console.log('从 chrome.storage.local 读取的数据:', items);

            // 如果有选中的图书馆，使用第一个作为 code 值
            const selectcode = Object.keys(items);
            let code = "1"; // 默认值

            if (selectcode.length > 0) {
                code = selectcode[0]; // 使用第一个选中的图书馆代码
                console.log('使用的 code 值:', code);
            }

            // 打开弹出网页，自动等待返回结果
            const popupUrl = chrome.runtime.getURL(`search.html?query=${encodeURIComponent(selectedText)}&code=${encodeURIComponent(code)}`);
            chrome.windows.create({
                url: popupUrl,
                type: "popup",
                width: 700,
                height: 600
            });
        });
    }
});

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