function showErrorMessage(selectedProvinceName) {
  let div = document.createElement("div");
  div.id = "douban-hlj-lib";
  div.style.padding = "15px 10px";
  div.style.backgroundColor = "#F6F6F2";
  div.style.margin = "20px auto";
  let componentTitle = document.createElement("h2");
  componentTitle.innerHTML =
    "<span>" +
    selectedProvinceName +
    "图书馆&nbsp;·&nbsp;·&nbsp;·&nbsp;·&nbsp;·&nbsp;·</span>";
  componentTitle.style.fontSize = "15px";
  div.append(componentTitle);
  let div1 = document.createElement("div");
  div1.style.width = "130px";
  div1.style.display = "inline-block";
  div1.innerHTML = `<i class="fas fa-info-circle text-green-500"></i> 暂无此图书信息`;
  div.append(div1);

  let element = document.querySelector(".aside");

  element.insertBefore(div, element.firstChild);
}
chrome.runtime.sendMessage(
  { action: "getProvinceStatus" },
  function (response) {
    console.log("Received province status:", response.provinceStatus);

    // 确定选择的省份信息
    const selectedProvinceCode = Object.keys(response.provinceStatus)[0]; // 假设只有一个省份被选择
    const selectedProvince = provinces.find(
      (province) => province.code === selectedProvinceCode
    );
    //  const selectedProvinceName = selectedProvinceprovinces.js
    //    ? selectedProvince.name
    //    : "未知省份"; // 如果未找到匹配的省份信息，则使用默认值

    selectedProvinceName = selectedProvince.name;
    let key = { code: response.provinceStatus };
    console.log(key);
    const isbn = /\d{13}/.exec($("#info").html())[0];
    const bookRecnoUrl = "https://www.navy81.com/jilin";

    try {
      $.post(
        bookRecnoUrl,
        JSON.stringify({ isbn: isbn, key }),
        function (responseData) {
          if (responseData["msg"] === "没有此图书") {
            showErrorMessage(selectedProvinceName);
          } else {
            initDivElement(responseData, selectedProvinceName);
          }
        }
      );
    } catch (error) {
      console.error("Error:", error);
    }
  }
);

function initDivElement(book, selectedProvinceName) {
  let div = document.createElement("div");
  div.id = "douban-hlj-lib";
  div.style.padding = "15px 10px";
  div.style.backgroundColor = "#F6F6F2";
  div.style.margin = "20px auto";
  let componentTitle = document.createElement("h2");
  componentTitle.innerHTML =
    "<span>" +
    selectedProvinceName +
    "图书馆&nbsp;·&nbsp;·&nbsp;·&nbsp;·&nbsp;·&nbsp;·</span>";
  componentTitle.style.fontSize = "15px";
  div.append(componentTitle);
  let ul = document.createElement("ul");
  ul.id = "douban-hlj-lib-list";

  div.append(ul);

  for (let i = 0; i < book.length; i++) {
    let li = document.createElement("li");
    li.style.borderBottom = "1px solid rgba(0,0,0,0.08)";
    li.style.margin = "12px auto";
    let stat = book[i]["loanableCount"] > 0 ? "在馆" : "借出";

    // li.innerHTML = `<div style="width:120px;display: inline-block;"> ${book[i]["curlocalName"]}</div>
    //      <div style="width:90px;display: inline-block;">${book[i]["callno"]} </div>
    //      <div style="width:50px;display: inline-block;">${stat} ${book[i]["loanableCount"]}/${book[i]["copycount"]}</div>`;
    //    li.innerHTML = ` ${book[i]["馆藏地"]}
    //           ${book[i]["索书号"]}
    //           ${book[i]["书刊状态"]} `
    // <div style="width:50px;display: inline-block;">${stat} ${book[i]["loanableCount"]}/${book[i]["copycount"]}</div>`;
    let div1 = document.createElement("div");
    div1.style.width = "130px";
    div1.style.display = "inline-block";
    div1.textContent = book[i]["curlocalName"];

    let div2 = document.createElement("div");
    div2.style.width = "90px";
    div2.style.display = "inline-block";
    div2.textContent = book[i]["callno"];

    let div3 = document.createElement("div");
    div3.style.width = "60px";
    div3.style.display = "inline-block";
    //div3.textContent = `${book[i]["state"]}`;
    div3.textContent = `${book[i]["loanableCount"]}/${book[i]["copycount"]} ${stat}`;

    li.appendChild(div1);
    li.appendChild(div2);
    li.appendChild(div3);

    ul.appendChild(li);
  }
  let li = document.createElement("li");
  li.style.borderBottom = "1px solid rgba(0,0,0,0.08)";
  li.style.margin = "-5px auto";
  li.style.float="right";
  li.textContent = `豆瓣+图书馆查询助手©无理数`;
  ul.appendChild(li);

  let element = document.querySelector(".aside");

  element.insertBefore(div, element.firstChild);
}
