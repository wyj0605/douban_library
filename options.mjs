import provinces from "./provinces.mjs";

document.addEventListener("DOMContentLoaded", function () {
  const provinceList = document.getElementById("provinceList");
  const checkboxes = [];
  let selectedCount = 0;

  // Clear all data in chrome.storage.local
  chrome.storage.local.clear();

  // Event listener for checkbox changes
  function handleCheckboxChange() {
    const isChecked = this.checked;
    const code = this.getAttribute("name");

    if (isChecked) {
      selectedCount++;
    } else {
      selectedCount--;
      // Remove the province from storage if unchecked
      chrome.storage.local.remove(code, function () {
        console.log(`Removed ${code} from storage.`);
      });
    }

    if (selectedCount >= 2) {
      // Disable other checkboxes if two provinces are selected
      checkboxes.forEach(function (checkbox) {
        if (!checkbox.checked) {
          checkbox.disabled = true;
        }
      });
    } else {
      // Enable all checkboxes if less than two provinces are selected
      checkboxes.forEach(function (checkbox) {
        checkbox.disabled = false;
      });
    }

    // Update storage with the selected province status
    chrome.storage.local.set({ [code]: isChecked }, function () {
      console.log(`Province ${code} status saved.`);
    });
  }

  // Render checkboxes for provinces
  provinces.forEach(function (province) {
    const item = document.createElement("div");
    item.classList.add("flex", "items-center", "py-1");
    item.innerHTML = `
        <label class="flex items-center cursor-pointer">
            <input type="checkbox" name="${province.code}" class="form-checkbox mr-2 checked:bg-gray-900 checked:border-transparent checked:ring-2 checked:ring-offset-2 checked:ring-blue-500 h-6 w-6 ">
            <span>${province.name}</span>
        </label>
    `;
    provinceList.appendChild(item);
    const checkbox = item.querySelector(".form-checkbox");
    checkboxes.push(checkbox);
    checkbox.addEventListener("change", handleCheckboxChange);
  });
});
