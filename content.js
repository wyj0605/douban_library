function delete_div() {
  let div = document.getElementById("douban-hlj-lib");
  if (div) {
    div.parentNode.removeChild(div);
  }
}
chrome.runtime.sendMessage(
  { action: "getProvinceStatus" },
  function (response) {
    const selectcode = Object.keys(response.provinceStatus);
    var  selectedProvince=[];
    for (let i = 0; i < selectcode.length; i++) {
       selectedProvince[i] = provinces.find(
        (province) => province.code === selectcode[i]
      );
    }
    selectname = selectedProvince;
    let key = { code: response.provinceStatus };
    const isbn = /\d{13}/.exec($("#info").html())[0];
    const bookRecnoUrl = "https://www.navy81.com/jilin";
    //const bookRecnoUrl = "http://127.0.0.1:8080/jilin";
    try {
      for (let i = 0; i < selectcode.length; i++) {
        initDivElement(selectedProvince[i].name, "sk");
      }
      $.post(
        bookRecnoUrl,
        JSON.stringify({ isbn: isbn, key }),
        function (responseData) {
          for (let i = 0; i < selectcode.length; i++) {
            delete_div()
          }
          for (let i = 0; i < responseData.length; i++) {
            try{
              initDivElement(selectedProvince[i].name, responseData[i]);
            }
            catch(e){
              initDivElement(selectedProvince[i].name, "nk");
            }
          }
  
        }
      );
    } catch (error) {
      console.error("Error:", error);
    }
  }
);
 
function initDivElement(selectname, book) {
  //sk 代表正在查找图书
  //nk 代表没有此图书
  const searchbook = "正在查询馆藏图书....";
  const nobook = "暂无此图书";
  const div = document.createElement("div");
  div.id = "douban-hlj-lib";
  div.style.padding = "15px 10px";
  div.style.backgroundColor = "#F6F6F2";
  div.style.marginBottom = "20px";
  div.style.borderRadius = "5px";

  const componentTitle = document.createElement("h2");
  componentTitle.innerHTML = `<b><span>${selectname}图书馆&nbsp;·&nbsp;·&nbsp;·&nbsp;·&nbsp;·&nbsp;·</span></b>`;
  componentTitle.style.fontSize = "15px";
  div.appendChild(componentTitle);
  let content = "";

  if (book === "sk") {
    const div1 = document.createElement("div");
    div1.innerHTML = `<i class="fas fa-info-circle text-green-500"></i> ${searchbook}`;
    div1.style.borderBottom = "1px solid rgba(0,0,0,0.08)";
    content = div1;
  } else if (book === "nk") {
    const div1 = document.createElement("div");
    div1.innerHTML = `<i class="fas fa-info-circle text-green-500"></i> ${nobook}`;
    div1.style.borderBottom = "1px solid rgba(0,0,0,0.08)";
    content = div1;
  } else {
    const ul = document.createElement("ul");
    ul.id = "douban-hlj-lib-list";

    book.forEach((item) => {
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
      div2.style.overflowWrap = "break-word";
      div2.textContent = item.callno;

      const div3 = document.createElement("div");
      div3.style.width = "60px";
      div3.style.display = "inline-block";
      div3.style.display.textAlign = "right";

      if (item.loanableCount !== null && item.loanableCount !== undefined) {
        div3.textContent = `${item.loanableCount}/${item.copycount} ${stat}`;
      } else {
        div3.textContent = `   ${item.status} `;
        div3.style.width = "60px";
        div3.style.display = "inline-block";
        div2.style.display.textAlign = "right";
      }
      div3.title =
        item.retudate !== null && item.retudate !== undefined
          ? `还书日期：${item.retudate} `
          : "";

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

  div.appendChild(content);
  div.appendChild(div1);
  const element = document.querySelector(".aside");
  element.insertBefore(div, element.firstChild);
}