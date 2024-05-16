import provinces from './provinces.mjs';

document.addEventListener("DOMContentLoaded", function () {
    const provinceList = document.getElementById("provinceList");
    const OPEN_OPTIONS_BTN_ID = 'openOptions';

    document.getElementById(OPEN_OPTIONS_BTN_ID).addEventListener('click', openOptionsPage);

<<<<<<< HEAD
    getProvinceStatusAndRender(provinceList);
=======
    // Render initially
    renderProvinceListItems(provinceList);

    // Listen for changes in province selection from the backend
    chrome.storage.local.onChanged.addListener(function(changes, areaName) {
        renderProvinceListItems(provinceList);
    });
>>>>>>> 1268ba49b69ac996089da43260f0487fb8c9bc9d
});

function openOptionsPage() {
    chrome.tabs.create({url: 'options.html'});
}

<<<<<<< HEAD
function getProvinceStatusAndRender(provinceList) {
    chrome.runtime.sendMessage(
        { action: "getProvinceStatus" },
        function (response) {
            const selectedProvinceCode = Object.keys(response.provinceStatus)[0];
            const selectedProvince = provinces.find(
                (province) => province.code === selectedProvinceCode
            );
            const selectedProvinceName = selectedProvince ? selectedProvince.name : "请先选择";

            renderProvinceListItem(selectedProvinceName, provinceList);
        }
    );
}

function renderProvinceListItem(selectedProvinceName, provinceList) {
    const item = document.createElement("div");
    item.innerHTML = `
        <p><i class="far fa-lg fa-check-circle text-green-500"  title="已选择"></i>   ${selectedProvinceName}图书馆</p>
    `;
    provinceList.appendChild(item);
=======
function renderProvinceListItems(provinceList) {
    chrome.storage.local.get(null, function(items) {
        provinceList.innerHTML = ""; // Clear previous items
        const selectedProvinceCodes = Object.keys(items);
        selectedProvinceCodes.slice(0, 2).forEach(function(code) {
            const selectedProvince = provinces.find(function(province) {
                return province.code === code;
            });
            if (selectedProvince) {
                const item = document.createElement("div");
                item.innerHTML = `
                    <p><i class="far fa-lg fa-check-circle text-green-500" title="已选择"></i>   ${selectedProvince.name}图书馆</p>
                `;
                provinceList.appendChild(item);
            }
        });
    });
>>>>>>> 1268ba49b69ac996089da43260f0487fb8c9bc9d
}
