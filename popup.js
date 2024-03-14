document.addEventListener('DOMContentLoaded', function() {
    const provinceList = document.getElementById('provinceList');

    const provinces = [
        {"code":"11","name":"北京市"},{"code":"12","name":"天津市"},{"code":"13","name":"河北省"},{"code":"14","name":"山西省"},
        {"code":"21","name":"辽宁省"},{"code":"22","name":"吉林省"},{"code":"31","name":"上海市"},{"code":"32","name":"江苏省"},
        {"code":"33","name":"浙江省"},{"code":"34","name":"安徽省"},{"code":"35","name":"福建省"},{"code":"36","name":"江西省"},{"code":"37","name":"山东省"},
        {"code":"41","name":"河南省"},{"code":"42","name":"湖北省"},{"code":"43","name":"湖南省"},{"code":"44","name":"广东省"},
        {"code":"46","name":"海南省"},{"code":"50","name":"重庆市"},{"code":"51","name":"四川省"},{"code":"52","name":"贵州省"},{"code":"53","name":"云南省"}
        ,{"code":"61","name":"陕西省"},{"code":"62","name":"甘肃省"},{"code":"63","name":"青海省"},{"code":"23","name":"黑龙江省"},{"code":"54","name":"西藏自治区"},
        {"code":"15","name":"内蒙古自治区"},{"code":"64","name":"宁夏回族自治区"},{"code":"65","name":"新疆维吾尔自治区"},{"code":"45","name":"广西壮族自治区"},
    ];


      
    // 遍历省份数据，生成划动开关列表项
    provinces.forEach(function(province) {

        const item = document.createElement('div');
        item.classList.add('item');
        item.innerHTML = `
            <div class="ui toggle checkbox">
                <input type="checkbox" name="${province.code}">
                <label>${province.name}</label>
            </div>
        `;
        provinceList.appendChild(item);
    });

    // 添加划动开关的行为逻辑
    const checkboxes = document.querySelectorAll('.ui.toggle.checkbox');
    checkboxes.forEach(function(checkbox) {
        checkbox.addEventListener('change', function() {
            const isChecked = checkbox.querySelector('input').checked;
            const label = checkbox.querySelector('label').textContent;
            chrome.storage.sync.set({ [label]: isChecked });
            if (isChecked) {
                
                console.log(`${isChecked} 已启用`);
                alert(`${isChecked} 已启用`)
                // 在这里执行特定的动作
            } else {
                console.log(`${isChecked} 已关闭`);
                // 在这里执行特定的动作
            }
        });
    });
});
