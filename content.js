function delete_div() {
  let div = document.getElementById("douban-hlj-lib");
  if (div) {
    div.parentNode.removeChild(div);
  }
}

chrome.runtime.sendMessage(
  { action: "getProvinceStatus" },
  function (response) {
    const selectcode = Object.keys(response.provinceStatus || {}).filter(
      (code) => response.provinceStatus[code] === true && provinces.some((province) => province.code === code)
    );
    var selectedProvince = [];
    for (let i = 0; i < selectcode.length; i++) {
      selectedProvince[i] = provinces.find(
        (province) => province.code === selectcode[i]
      );
    }
    selectname = selectedProvince;
    let key = { code: response.provinceStatus };
    const infoText = $("#info").text() || "";
    const isbnMatch = infoText.match(/(?:97[89][\d\s-]{10,16}|\b\d{9}[\dXx]\b)/);
    const isbn = isbnMatch ? isbnMatch[0].replace(/[^0-9Xx]/g, "") : "";
    // const bookRecnoUrl = "https://www.navy81.icu/jilin";
    const bookRecnoUrl = "https://navy82.icu/jilin";
    try {
      if (!isbn || selectcode.length === 0) {
        return;
      }
      for (let i = 0; i < selectcode.length; i++) {
        initDivElement(selectedProvince[i].name, "sk");
      }
      $.post(
        bookRecnoUrl,
        JSON.stringify({
          isbn: isbn,
          key,
          client: "browser-extension",
          extension_version: "1.3.2"
        }),
        function (responseData) {
          for (let i = 0; i < selectcode.length; i++) {
            delete_div();
          }
          for (let i = 0; i < responseData.length; i++) {
            try {
              initDivElement(selectedProvince[i].name, responseData[i]);
            } catch (e) {
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
function donwload() {
  html2canvas(document.querySelector("#douban-hlj-lib")).then((canvas) => {
    document.body.appendChild(canvas);
  });
}
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
  div.style.position = "relative";

  const componentTitle = document.createElement("h2");
  const libraryTitle = /图书馆$/.test(selectname) ? selectname : `${selectname}图书馆`;
  componentTitle.innerHTML = `<b><span>${libraryTitle}&nbsp;·&nbsp;·&nbsp;·&nbsp;·&nbsp;·&nbsp;·</span></b>`;
  componentTitle.style.fontSize = "15px";
  div.appendChild(componentTitle);
  
  // 添加复制按钮
  const copyBtn = document.createElement("button");
  copyBtn.innerHTML = '<i class="fas fa-copy"></i> 复制';
  copyBtn.style.position = "absolute";
  copyBtn.style.top = "10px";
  copyBtn.style.right = "10px";
  copyBtn.style.padding = "3px 11px";
  copyBtn.style.backgroundColor = "#f0f0f0";
  copyBtn.style.border = "1px solid #ddd";
  copyBtn.style.borderRadius = "4px";
  copyBtn.style.fontSize = "12px";
  copyBtn.style.cursor = "pointer";
  copyBtn.style.zIndex = "10";
  copyBtn.onclick = function() {
    // 获取显示框的所有文本内容
    let copyText = libraryTitle + '\n';
    
    if (book === "sk") {
      copyText += document.title.replace(' (豆瓣)','') + '\n';
      copyText += searchbook;
    } else if (book === "nk") {
      copyText += document.title.replace(' (豆瓣)','') + '\n';
      copyText += nobook;
    } else {
      const firstBook = Array.isArray(book) && book.length ? book[0] : {};
      copyText += `书名：${firstBook.title || document.title.replace(' (豆瓣)', '')}\n`;
      if (firstBook.author) copyText += `作者：${firstBook.author}\n`;
      if (firstBook.publisher || firstBook.pubdate) {
        copyText += `出版信息：${[firstBook.publisher, firstBook.pubdate].filter(Boolean).join(' / ')}\n`;
      }
      if (firstBook.isbn) copyText += `ISBN：${firstBook.isbn}\n`;

      book.forEach((item) => {
        const stat = item.status || (item.loanableCount > 0 ? "在馆" : "借出");
        const curlocalName = item.curlocalName || item.curlibName || '馆藏地点未标注';
        const callno = item.callno || '未知';
        const statusText = item.loanableCount !== null && item.loanableCount !== undefined ? 
          `${item.loanableCount}/${item.copycount} ${stat}` : item.status || '未知';
        copyText += `${curlocalName} ${callno} ${statusText}\n`;
      });
    }
    
    // 复制到剪贴板
    navigator.clipboard.writeText(copyText).then(() => {
      // 显示复制成功状态
      copyBtn.innerHTML = '<i class="fas fa-check"></i> 已复制';
      copyBtn.style.backgroundColor = "#4CAF50";
      copyBtn.style.color = "white";
      copyBtn.style.borderColor = "#4CAF50";
      
      // 2秒后恢复原样
      setTimeout(() => {
        copyBtn.innerHTML = '<i class="fas fa-copy"></i> 复制';
        copyBtn.style.backgroundColor = "#f0f0f0";
        copyBtn.style.color = "";
        copyBtn.style.borderColor = "#ddd";
      }, 2000);
    }).catch(err => {
      console.error('复制失败:', err);
    });
  };
  div.appendChild(copyBtn);
  
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
    const firstBook = Array.isArray(book) && book.length ? book[0] : {};
    const metadata = document.createElement("div");
    metadata.style.padding = "10px 0 12px";
    metadata.style.marginBottom = "4px";
    metadata.style.borderBottom = "1px solid rgba(0,0,0,0.12)";
    metadata.style.fontSize = "14px";
    metadata.style.lineHeight = "1.65";

    const metadataRows = [
      ["书名", firstBook.title || document.title.replace(' (豆瓣)', '')],
      ["作者", firstBook.author],
      ["出版社", firstBook.publisher],
      ["出版时间", firstBook.pubdate],
      ["ISBN", firstBook.isbn]
    ].filter(([, value]) => value);
    metadataRows.forEach(([label, value]) => {
      const row = document.createElement("div");
      const labelNode = document.createElement("strong");
      labelNode.textContent = `${label}：`;
      row.appendChild(labelNode);
      row.appendChild(document.createTextNode(String(value)));
      metadata.appendChild(row);
    });

    const ul = document.createElement("ul");
    ul.id = "douban-hlj-lib-list";
    ul.style.margin = "0";
    ul.style.padding = "0";
    ul.style.listStyle = "none";

    book.forEach((item) => {
      const li = document.createElement("li");
      li.style.borderBottom = "1px solid rgba(0,0,0,0.08)";
      li.style.padding = "11px 0";
      li.style.margin = "0";
      const stat = item.status || (item.loanableCount > 0 ? "在馆" : "借出");

      const div1 = document.createElement("div");
      div1.style.fontSize = "14px";
      div1.style.fontWeight = "600";
      div1.style.marginBottom = "5px";
      div1.style.overflowWrap = "anywhere";
      div1.textContent = item.curlocalName || item.curlibName || "馆藏地点未标注";

      const detailRow = document.createElement("div");
      detailRow.style.display = "flex";
      detailRow.style.alignItems = "center";
      detailRow.style.justifyContent = "space-between";
      detailRow.style.gap = "10px";

      const div2 = document.createElement("div");
      div2.style.minWidth = "0";
      div2.style.fontFamily = "ui-monospace, SFMono-Regular, Menlo, monospace";
      div2.style.fontSize = "13px";
      div2.style.whiteSpace = "nowrap";
      div2.style.overflow = "hidden";
      div2.style.textOverflow = "ellipsis";
      div2.title = item.callno || "索书号未知";
      div2.textContent = `索书号：${item.callno || "未知"}`;

      const div3 = document.createElement("div");
      div3.style.flex = "0 0 auto";
      div3.style.fontSize = "13px";
      div3.style.fontWeight = "600";
      div3.style.color = item.loanableCount > 0 ? "#16823b" : "#9b3d32";

      if (item.loanableCount !== null && item.loanableCount !== undefined) {
        div3.textContent = `${item.loanableCount}/${item.copycount} ${stat}`;
      } else {
        div3.textContent = item.status || "未知";
      }
      div3.title =
        item.retudate !== null && item.retudate !== undefined
          ? `还书日期：${item.retudate} `
          : "";

      li.appendChild(div1);
      detailRow.appendChild(div2);
      detailRow.appendChild(div3);
      li.appendChild(detailRow);
      ul.appendChild(li);
    });
    const contentWrapper = document.createElement("div");
    contentWrapper.appendChild(metadata);
    contentWrapper.appendChild(ul);
    content = contentWrapper;
  }
  const div1 = document.createElement("div");
  div1.style.textAlign = "right";

  div1.innerHTML = `<a href="https://github.com/wyj0605" target="_blank">豆瓣+图书馆查询助手</a>`;
  div.appendChild(content);
  div.appendChild(div1);
  const element = document.querySelector(".aside");
  element.insertBefore(div, element.firstChild);
}
