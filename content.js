function delete_div() {
  let div = document.getElementById("douban-hlj-lib");
  if (div) {
    div.parentNode.removeChild(div);
  }
}
chrome.runtime.sendMessage(
  { action: "getProvinceStatus" },
  function (response) {
    const selectcode = Object.keys(response.provinceStatus)[0];
    const selectedProvince = provinces.find(
      (province) => province.code === selectcode
    );
    selectname = selectedProvince.name;
    let key = { code: response.provinceStatus };
    console.log(key);
    const isbn = /\d{13}/.exec($("#info").html())[0];
    const bookRecnoUrl = "https://www.navy81.com/jilin";
    //const bookRecnoUrl = "http://127.0.0.1:8080/jilin";
    try {
      initDivElement(selectname, "sk");
      $.post(
        bookRecnoUrl,
        JSON.stringify({ isbn: isbn, key }),
        function (responseData) {
          if (responseData["msg"] === "nobook") {
            delete_div();
            initDivElement(selectname, "nk");
          } else {
            delete_div();
            initDivElement(selectname, responseData);
          }
        }
      );
    } catch (error) {
      console.error("Error:", error);
    }
  }
);


function initDivElement(selectname, book) {
  const styles = { padding: "15px 10px", backgroundColor: "#F6F6F2", marginBottom: "20px", borderRadius: "5px", componentTitle: { fontSize: "15px" }, infoCircle: { color: "green" } };
  const messages = { sk: "正在查询馆藏图书....", nk: "暂无此图书" };

  const div = document.createElement("div");
  div.id = "douban-hlj-lib";
  Object.assign(div.style, styles);

  const componentTitle = document.createElement("h2");
  componentTitle.innerHTML = `<b><span>${selectname}图书馆&nbsp;·&nbsp;·&nbsp;·&nbsp;·&nbsp;·&nbsp;·</span></b>`;
  Object.assign(componentTitle.style, styles.componentTitle);
  div.appendChild(componentTitle);

  let content;

  if (book === "sk" || book === "nk") {
    const div1 = document.createElement("div");
    div1.innerHTML = `<i class="fas fa-info-circle text-green-500"></i> ${messages[book]}`;
    div1.style.borderBottom = "1px solid rgba(0,0,0,0.08)";
    content = div1;
  } else {
    const ul = document.createElement("ul");
    ul.id = "douban-hlj-lib-list";

    book.forEach(item => {
      const li = document.createElement("li");
      li.style.borderBottom = "1px solid rgba(0,0,0,0.08)";
      li.style.margin = "12px auto";

      const stat = item.loanableCount > 0 ? "在馆" : "借出";
      const createDiv = (width, text, textAlign) => {
        const div = document.createElement("div");
        Object.assign(div.style, { width, display: "inline-block", textAlign });
        div.textContent = text;
        return div;
      };

      const div1 = createDiv("130px", item.curlocalName);
      const div2 = createDiv("90px", item.callno);
      const div3 = createDiv("60px", item.loanableCount !== null && item.loanableCount !== undefined ? `${item.loanableCount}/${item.copycount} ${stat}` : `   ${item.status}`, "right");
      div3.title = item.retudate !== null && item.retudate !== undefined ? `还书日期：${item.retudate} ` : "";

      li.appendChild(div1);
      li.appendChild(div2);
      li.appendChild(div3);
      ul.appendChild(li);
    });

    content = ul;
  }

  const div1 = document.createElement("div");
  div1.style.textAlign = "right";
  div1.innerHTML = `<a href="https://www.navy81.com/" target="_blank">豆瓣+图书馆查询助手</a>`;

  div.appendChild(ul);
  div.appendChild(div1);
  const element = document.querySelector(".aside");
  element.insertBefore(div, element.firstChild);
}
