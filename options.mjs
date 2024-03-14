import provinces from "./provinces.mjs";

document.addEventListener("DOMContentLoaded", function () {
  const provinceList = document.getElementById("provinceList");
  // 遍历省份数据，生成划动开关列表项
  provinces.forEach(function (province) {
    const item = document.createElement("div");
    item.classList.add("flex", "items-center", "py-1");
    item.innerHTML = `
            <label class="flex items-center cursor-pointer">
                <input type="checkbox" name="${province.code}" class="form-checkbox mr-2 checked:bg-gray-900 checked:border-transparent checked:ring-2 checked:ring-offset-2 checked:ring-blue-500 h-4 w-4 ">
                <span>${province.name}</span>
            </label>
        `;
    provinceList.appendChild(item);
  });

  // 添加划动开关的行为逻辑
  const checkboxes = document.querySelectorAll(".form-checkbox");
  checkboxes.forEach(function (checkbox) {
    checkbox.addEventListener("change", function () {
      const isChecked = checkbox.checked;
      const code = checkbox.getAttribute("name");

      // 如果选中了该省份，则取消其他省份的选中状态，并保存当前省份状态到 Chrome 存储中
      if (isChecked) {
        checkboxes.forEach(function (otherCheckbox) {
          if (otherCheckbox !== checkbox) {
            otherCheckbox.checked = false;
            const otherCode = otherCheckbox.getAttribute("name");
            chrome.storage.local.remove(otherCode, function () {
              console.log(`Removed ${otherCode} from storage.`);
            });
          }
        });
        const provinceStatus = {};
        provinceStatus[code] = true;
        chrome.storage.local.set(provinceStatus, function () {
          console.log(`Province ${code} status saved.`);
        });
      } else {
        // 如果取消选中当前省份，则清除该省份在 Chrome 存储中的信息
        chrome.storage.local.remove(code, function () {
          console.log(`Removed ${code} from storage.`);
        });
      }
    });
  });

  // 读取之前保存的省份状态，并将选中状态应用到划动开关列表中
  chrome.storage.local.get(null, function (items) {
    for (const code in items) {
      const isChecked = items[code];
      if (isChecked) {
        const selectedCheckbox = Array.from(checkboxes).find(
          (checkbox) => checkbox.getAttribute("name") === code
        );
        if (selectedCheckbox) {
          selectedCheckbox.checked = true;
        }
      }
    }
  });
});
