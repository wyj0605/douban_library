import provinces from './provinces.mjs';

document.addEventListener("DOMContentLoaded", function () {
    const provinceList = document.getElementById("provinceList");
    const OPEN_OPTIONS_BTN_ID = 'openOptions';

    document.getElementById(OPEN_OPTIONS_BTN_ID).addEventListener('click', openOptionsPage);

    getProvinceStatusAndRender(provinceList);
});

function openOptionsPage() {
    chrome.tabs.create({url: 'options.html'});
}

function getProvinceStatusAndRender(provinceList) {
    chrome.runtime.sendMessage(
        { action: "getProvinceStatus" },
        function (response) {
            const selectedProvinceCode = Object.keys(response.provinceStatus)[0];
            const selectedProvince = provinces.find(
                (province) => province.code === selectedProvinceCode
            );
            const selectedProvinceName = selectedProvince ? selectedProvince.name : "请先选择图书馆";

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
}
