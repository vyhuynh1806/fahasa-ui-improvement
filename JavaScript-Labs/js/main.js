// 1. Dây cờ trang trí phía trên cùng
const bunting = document.getElementById('bunting');
if (bunting) {
    const colors = ['#8bd16f', '#ffc15a', '#ff9a5c'];
    for (let i = 0; i < 40; i++) {
        const flag = document.createElement('i');
        flag.style.background = colors[i % colors.length];
        flag.style.animationDelay = (i % 5) * -0.4 + 's';
        bunting.appendChild(flag);
    }
}

// 2. Tab "Điều mình đã học" (chỉ có ở trang chủ)
const tabs = document.querySelectorAll('.tabs button');
const panels = document.querySelectorAll('#note p');
tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
        tabs.forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
        panels.forEach((p) => { p.hidden = p.dataset.p !== tab.dataset.t; });
    });
});

// 3. Trang Lab: tự tạo thẻ Exercise từ cấu hình window.LAB
if (window.LAB) {
    const { num, count, file = '', files = {}, titles = {} } = window.LAB;
    const grid = document.getElementById('exGrid');
    for (let i = 1; i <= count; i++) {
        const id = String(i).padStart(2, '0');
        const card = document.createElement('a');
        card.className = 'ex-card';
        card.href = 'Exercise' + id + '/' + (files[i] || file.replace('{id}', id));
        card.innerHTML = '<b>' + num + '.' + i + '</b><span>Exercise ' + id + '</span><em>' + (titles[i] || 'Mở bài làm') + '</em>';
        grid.appendChild(card);
    }
}
