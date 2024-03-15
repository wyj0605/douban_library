
function delete_div() {
  let div = document.getElementById("douban-hlj-lib");
  if (div) {
    div.parentNode.removeChild(div);
  } else {
    console.log("要删除的 div 元素不存在。");
  }
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
    selectedProvinceName = selectedProvince.name;
    let key = { code: response.provinceStatus };
    console.log(key);
    const isbn = /\d{13}/.exec($("#info").html())[0];
    const bookRecnoUrl = "https://www.navy81.com/jilin";
    try {
      initDivElement(selectedProvinceName, "sk");
      $.post(
        bookRecnoUrl,
        JSON.stringify({ isbn: isbn, key }),
        function (responseData) {
          if (responseData["msg"] === "nobook") {
            delete_div();
            initDivElement(selectedProvinceName,"nk");
          } else {
            delete_div();
            initDivElement(selectedProvinceName,responseData);
          }
        }
      );
    } catch (error) {
      console.error("Error:", error);
    }
  }
);

function initDivElement(selectedProvinceName, book) {
  const searchbook = "正在查询馆藏图书....";
  const nobook = "暂无此图书";

  const div = document.createElement("div");
  div.id = "douban-hlj-lib";
  div.style.padding = "15px 10px";
  div.style.backgroundColor = "#F6F6F2";
  div.style.margin = "20px auto";

  const componentTitle = document.createElement("h2");
  componentTitle.innerHTML = `<span>${selectedProvinceName}图书馆&nbsp;·&nbsp;·&nbsp;·&nbsp;·&nbsp;·&nbsp;·</span>`;
  componentTitle.style.fontSize = "15px";
  div.appendChild(componentTitle);

  let content = '';

  if (book === "sk") {
    const div1 = document.createElement("div");
    div1.style.width = "130px";
    div1.style.display = "inline-block";
    div1.innerHTML = `<i class="fas fa-info-circle text-green-500"></i> ${searchbook}`;
    content = div1;
  } else if (book === "nk") {
    const div1 = document.createElement("div");
    div1.style.width = "130px";
    div1.style.display = "inline-block";
    div1.innerHTML = `<i class="fas fa-info-circle text-green-500"></i> ${nobook}`;
    content = div1;
  } else {
    const ul = document.createElement("ul");
    ul.id = "douban-hlj-lib-list";

    book.forEach(item => {
      const li = document.createElement("li");
      li.style.borderBottom = "1px solid rgba(0,0,0,0.08)";
      li.style.margin = "12px auto";
      const stat = item.loanableCount > 0 ? "在馆" : "借出";

      const div1 = document.createElement("div");
      div1.style.width = "130px";
      div1.style.display = "inline-block";
      div1.textContent = item.curlocalName;

      const div2 = document.createElement("div");
      div2.style.width = "90px";
      div2.style.display = "inline-block";
      div2.textContent = item.callno;

      const div3 = document.createElement("div");
      div3.style.width = "60px";
      div3.style.display = "inline-block";
      div3.textContent = `${item.loanableCount}/${item.copycount} ${stat}`;

      li.appendChild(div1);
      li.appendChild(div2);
      li.appendChild(div3);
      ul.appendChild(li);
    });

    const li = document.createElement("li");
    li.style.borderBottom = "1px solid rgba(0,0,0,0.08)";
    li.style.margin = "-5px auto";
    li.style.float = "right";
    li.textContent = `豆瓣+图书馆查询助手`;
    ul.appendChild(li);

    content = ul;
  }

  div.appendChild(content);

  const element = document.querySelector(".aside");
  element.insertBefore(div, element.firstChild);
}


