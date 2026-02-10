// 获取URL参数中的查询词
function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// 关闭窗口
document.getElementById('closeBtn').addEventListener('click', function() {
    window.close();
});

// 执行搜索
async function searchBook() {
    const query = getQueryParam('query');
    console.log('搜索查询:', query);
    if (!query) {
        document.getElementById('error').textContent = '请输入书名或ISBN';
        document.getElementById('error').style.display = 'block';
        document.getElementById('loading').style.display = 'none';
        return;
    }

    try {
        // 从URL参数中读取code值
        let code = getQueryParam('code');
        console.log('从URL参数读取的code值:', code);

        // 如果URL参数中没有code值，尝试从chrome.storage.local中读取
        if (!code) {
            try {
                // 使用Promise包装chrome.storage.local.get，使其可以使用await
                const items = await new Promise((resolve) => {
                    chrome.storage.local.get(null, function(items) {
                        resolve(items);
                    });
                });
                console.log('从chrome.storage.local读取的数据:', items);

                // 获取所有选中的图书馆代码
                const selectedLibraries = Object.keys(items).filter(key => items[key]);
                console.log('选中的图书馆代码:', selectedLibraries);

                // 如果有选中的图书馆，使用第一个作为code值
                if (selectedLibraries.length > 0) {
                    code = selectedLibraries[0];
                    console.log('使用第一个选中的图书馆代码:', code);
                } else {
                    // 如果没有选中的图书馆，使用默认值"1"
                    code = "1";
                    console.log('没有选中的图书馆，使用默认code值:', code);
                }
            } catch (e) {
                console.error('读取chrome.storage.local失败:', e);
                // 读取失败时使用默认值"1"
                code = "1";
                console.log('读取chrome.storage.local失败，使用默认code值:', code);
            }
        }

        console.log('最终使用的code值:', code);
        await performSearch(query, code);
    } catch (error) {
        console.error('搜索过程中发生错误:', error);
        document.getElementById('error').textContent = '暂无此图书信息';
        document.getElementById('error').style.display = 'block';
        document.getElementById('loading').style.display = 'none';
    }
}

// 执行实际的搜索请求
async function performSearch(query, code) {
    const bookRecnoUrl = "https://navy82.icu/jilin_search";
    const requestData = { isbn: query, code: code };
    console.log('发送请求到:', bookRecnoUrl);
    console.log('请求参数:', requestData);

    try {
        // 发送请求到查书接口
        const response = await fetch(bookRecnoUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        console.log('请求响应状态:', response.status);

        if (!response.ok) {
            throw new Error(`网络请求失败，状态码: ${response.status}`);
        }

        const responseData = await response.json();
        console.log('响应数据:', responseData);
        displayResult(query, responseData, [code]);
    } catch (error) {
        console.error('发送请求时发生错误:', error);
        throw error;
    }
}

// 显示搜索结果
function displayResult(query, responseData, selectcode) {
    const resultDiv = document.getElementById('result');
    const loadingDiv = document.getElementById('loading');

    loadingDiv.style.display = 'none';
    resultDiv.style.display = 'block';

    let html = ``;

    if (!responseData || (Array.isArray(responseData) && responseData.length === 0)) {
        html += '<div class="book-item"><h3>暂无此图书</h3></div>';
    } else {
        // 检查responseData的格式
        if (Array.isArray(responseData)) {
            // 如果是数组，遍历每个图书馆的结果
            responseData.forEach((data, index) => {
                // 图书馆名称
                html += `<div class="book-item">`;

                if (Array.isArray(data)) {
                    // 如果data是数组，遍历每本书的信息
                    data.forEach(item => {
                        // 显示图书馆名称
                        const libraryName = item.curlibName || selectcode[index] || '图书馆';
                        html += `<button class="copy-btn" data-library="${libraryName}"><i class="fas fa-copy"></i>复制</button>
                            <h3>${libraryName}</h3>
                            <div class="library-info">`;

                        // 显示图书基本信息
                        if (item.title) {
                            html += `<div class="library-item">
                                <p><span><strong>书名:</strong> ${item.title}</span></p>
                            </div>`;
                        }
                        if (item.author) {
                            html += `<div class="library-item">
                                <p><span><strong>作者:</strong> ${item.author}</span></p>
                            </div>`;
                        }
                        if (item.publisher || item.pubdate) {
                            const pubInfo = [];
                            if (item.publisher) pubInfo.push(item.publisher);
                            if (item.pubdate) pubInfo.push(item.pubdate);
                            if (pubInfo.length > 0) {
                                html += `<div class="library-item">
                                    <p><span><strong>出版信息:</strong> ${pubInfo.join(' / ')}</span></p>
                                </div>`;
                            }
                        }

                        // 显示馆藏信息
                        const stat = item.loanableCount > 0 ? '在馆' : '借出';
                        const statusClass = item.loanableCount > 0 ? 'available' : 'unavailable';
                        const statusText = item.loanableCount !== null && item.loanableCount !== undefined ? 
                            `${item.loanableCount}/${item.copycount} ${stat}` : item.status || '未知';
                        
                        // 优化所在位置的显示
                        let locationText = item.curlocalName || '未知';
                        // 如果位置信息太长，添加换行
                        if (locationText.length > 30) {
                            locationText = locationText.replace(/([,，])/g, '$1\n');
                        }
                        
                        html += `<div class="library-item">
                            <p>
                                <span style="white-space: pre-line;">所在位置：${locationText}</span>
                                <span class="callno">索书号：${item.callno || '未知'}</span>
                                <span class="status ${statusClass}">${statusText}</span>
                            </p>
                        </div>`;

                        html += `</div>`;
                    });
                } else if (typeof data === 'object') {
                    // 如果data是对象，显示其详细信息
                    const libraryName = data.curlibName || selectcode[index] || '图书馆';
                    html += `<button class="copy-btn" data-library="${libraryName}"><i class="fas fa-copy"></i>复制</button>
                        <h3>${libraryName}</h3>
                        <div class="library-info">`;

                    // 显示图书基本信息
                    if (data.title) {
                        html += `<div class="library-item">
                            <p><span><strong>书名:</strong> ${data.title}</span></p>
                        </div>`;
                    }
                    if (data.author) {
                        html += `<div class="library-item">
                            <p><span><strong>作者:</strong> ${data.author}</span></p>
                        </div>`;
                    }
                    if (data.publisher || data.pubdate) {
                        const pubInfo = [];
                        if (data.publisher) pubInfo.push(data.publisher);
                        if (data.pubdate) pubInfo.push(data.pubdate);
                        if (pubInfo.length > 0) {
                            html += `<div class="library-item">
                                <p><span><strong>出版信息:</strong> ${pubInfo.join(' / ')}</span></p>
                            </div>`;
                        }
                    }

                    // 显示馆藏信息
                    const stat = data.loanableCount > 0 ? '在馆' : '借出';
                    const statusClass = data.loanableCount > 0 ? 'available' : 'unavailable';
                    const statusText = data.loanableCount !== null && data.loanableCount !== undefined ? 
                        `${data.loanableCount}/${data.copycount} ${stat}` : data.status || '未知';
                    
                    // 优化所在位置的显示
                    let locationText = data.curlocalName || '未知';
                    // 如果位置信息太长，添加换行
                    if (locationText.length > 30) {
                        locationText = locationText.replace(/([,，])/g, '$1\n');
                    }
                    
                    html += `<div class="library-item">
                        <p>
                            <span style="white-space: pre-line;">所在位置：${locationText}</span>
                            <span class="callno">索书号：${data.callno || '未知'}</span>
                            <span class="status ${statusClass}">${statusText}</span>
                        </p>
                    </div>`;

                    html += `</div>`;
                } else {
                    // 如果data是其他类型，直接显示
                    html += `<h3>${selectcode[index] || '图书馆'}</h3>
                        <div class="library-info">
                            <div class="library-item">
                                <p>${data}</p>
                            </div>
                        </div>`;
                }

                html += `</div>`;
            });
        } else if (typeof responseData === 'object') {
            // 如果是对象，直接显示其详细信息
            const libraryName = responseData.curlibName || selectcode[0] || '图书馆';
            html += `<div class="book-item">
                            <button class="copy-btn" data-library="${libraryName}"><i class="fas fa-copy"></i>复制</button>
                            <h3>${libraryName}</h3>
                            <div class="library-info">`;

            // 显示图书基本信息
            if (responseData.title) {
                html += `<div class="library-item">
                    <p><span><strong>书名：</strong> ${responseData.title}</span></p>
                </div>`;
            }
            if (responseData.author) {
                html += `<div class="library-item">
                    <p><span><strong>作者：</strong> ${responseData.author}</span></p>
                </div>`;
            }
            if (responseData.publisher || responseData.pubdate) {
                const pubInfo = [];
                if (responseData.publisher) pubInfo.push(responseData.publisher);
                if (responseData.pubdate) pubInfo.push(responseData.pubdate);
                if (pubInfo.length > 0) {
                    html += `<div class="library-item">
                        <p><span><strong>出版信息：</strong> ${pubInfo.join(' / ')}</span></p>
                    </div>`;
                }
            }

            // 显示馆藏信息
            const stat = responseData.loanableCount > 0 ? '在馆' : '借出';
            const statusClass = responseData.loanableCount > 0 ? 'available' : 'unavailable';
            const statusText = responseData.loanableCount !== null && responseData.loanableCount !== undefined ? 
                `${responseData.loanableCount}/${responseData.copycount} ${stat}` : responseData.status || '未知';
            
            // 优化所在位置的显示
            let locationText = responseData.curlocalName || '未知';
            // 如果位置信息太长，添加换行
            if (locationText.length > 30) {
                locationText = locationText.replace(/([,，])/g, '$1\n');
            }
            
            html += `<div class="library-item">
                <p>
                    <span style="white-space: pre-line;">所在位置：${locationText}</span>
                    <span class="callno">${responseData.callno || '未知'}</span>
                    <span class="status ${statusClass}">${statusText}</span>
                </p>
            </div>`;

            html += `</div></div>`;
        } else {
            // 如果是其他类型，直接显示
            html += `<div class="book-item"><h3>${responseData}</h3></div>`;
        }
    }

    resultDiv.innerHTML = html;
    
    // 添加复制按钮事件监听器
    setTimeout(() => {
        const copyButtons = document.querySelectorAll('.copy-btn');
        copyButtons.forEach(button => {
            button.addEventListener('click', function() {
                // 获取当前图书项
                const bookItem = this.closest('.book-item');
                if (bookItem) {
                    // 提取图书项中的所有文本内容
                    let copyText = '';
                    
                    // 提取图书馆名称
                    const h3 = bookItem.querySelector('h3');
                    if (h3) {
                        copyText += h3.textContent.trim() + '\n';
                    }
                    
                    // 提取图书基本信息和馆藏信息
                    const libraryItems = bookItem.querySelectorAll('.library-item');
                    libraryItems.forEach(item => {
                        const p = item.querySelector('p');
                        if (p) {
                            // 获取所有span元素
                            const spans = p.querySelectorAll('span');
                            if (spans.length > 0) {
                                // 提取每个span的文本内容
                                let text = '';
                                spans.forEach((span, index) => {
                                    const spanText = span.textContent.trim();
                                    if (spanText) {
                                        text += spanText;
                                        // 如果不是最后一个span，添加分隔符
                                        if (index < spans.length - 1) {
                                            text += ' ';
                                        }
                                    }
                                });
                                copyText += text + '\n';
                            } else {
                                // 如果没有span元素，直接提取文本
                                let text = p.textContent.trim();
                                copyText += text + '\n';
                            }
                        }
                    });
                    
                    // 复制到剪贴板
                    navigator.clipboard.writeText(copyText).then(() => {
                        // 显示复制成功状态
                        this.innerHTML = '<i class="fas fa-check"></i>已复制';
                        this.classList.add('copied');
                        
                        // 2秒后恢复原样
                        setTimeout(() => {
                            this.innerHTML = '<i class="fas fa-copy"></i>复制';
                            this.classList.remove('copied');
                        }, 2000);
                    }).catch(err => {
                        console.error('复制失败:', err);
                    });
                }
            });
        });
    }, 100);
}

// 页面加载完成后执行搜索
window.onload = searchBook;