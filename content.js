window.onload = function () {
  const isbn = /\d{13}/.exec($("#info").html())[0];
  const bookRecnoUrl = "https://www.navy81.com/wechat_public";
  try {
    $.post(
      bookRecnoUrl,
      JSON.stringify({ isbn: isbn }),
      function (responseData) {
        initDivElement(responseData);
      }
    );
  } catch (error) {
    console.error("Error:", error);
  }
};

function initDivElement(book) {
  let div = document.createElement("div");
  div.id = "douban-hlj-lib";
  div.style.padding = "18px 16px";
  div.style.backgroundColor = "#F6F6F2";
  div.style.margin = "20px auto";
  let componentTitle = document.createElement("h2");
  componentTitle.innerHTML =
    "<span>黑龙江省图书馆&nbsp;·&nbsp;·&nbsp;·&nbsp;·&nbsp;·&nbsp;·</span>";
  componentTitle.style.fontSize = "15px";
  div.append(componentTitle);
  let ul = document.createElement("ul");
  ul.id = "douban-hlj-lib-list";

  div.append(ul);

  for (let i = 0; i < book.length; i++) {
    let li = document.createElement("li");
    li.style.borderBottom = "1px solid rgba(0,0,0,0.08)";
    li.style.margin = "10px auto";
    let stat = book[i]["loanableCount"] > 0 ? "在馆" : "借出";

    // li.innerHTML = `<div style="width:120px;display: inline-block;"> ${book[i]["curlocalName"]}</div>
    //      <div style="width:90px;display: inline-block;">${book[i]["callno"]} </div>
    //      <div style="width:50px;display: inline-block;">${stat} ${book[i]["loanableCount"]}/${book[i]["copycount"]}</div>`;
//    li.innerHTML = ` ${book[i]["馆藏地"]}
//           ${book[i]["索书号"]} 
//           ${book[i]["书刊状态"]} `
         // <div style="width:50px;display: inline-block;">${stat} ${book[i]["loanableCount"]}/${book[i]["copycount"]}</div>`;
         let div1 = document.createElement("div");
         div1.style.width = "120px";
         div1.style.display = "inline-block";
         div1.textContent = book[i]["curlocalName"];
     
     
         let div2 = document.createElement("div");
         div2.style.width = "90px";
         div2.style.display = "inline-block";
         div2.textContent = book[i]["callno"];
     
     
         let div3 = document.createElement("div");
         div3.style.width = "50px";
         div3.style.display = "inline-block";
         div3.textContent = `${stat}${book[i]["loanableCount"]}/${book[i]["copycount"]}`;
     
     
         li.appendChild(div1);
         li.appendChild(div2);
         li.appendChild(div3);
     
         ul.appendChild(li);
  }

  let element = document.querySelector(".aside");

  element.insertBefore(div, element.firstChild);
}
