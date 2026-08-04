/* ========================================
   矽壤组织 - 主逻辑
   内容渲染 / 分类筛选 / 分页
   ======================================== */

// ---- 渲染内容列表 ----
function renderContentList(category, page) {
    const listEl = document.getElementById('contentList');
    const paginationEl = document.getElementById('pagination');

    if (!listEl) return;

    // 筛选数据
    let filtered = contentData;
    if (category !== 'all') {
        filtered = contentData.filter(item => item.category === category);
    }

    // 排序：置顶在前，然后按日期倒序
    filtered.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.date) - new Date(a.date);
    });

    // 分页
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
    const currentPage = Math.min(Math.max(page, 1), totalPages);
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = Math.min(start + ITEMS_PER_PAGE, totalItems);
    const pageItems = filtered.slice(start, end);

    // 渲染列表
    if (pageItems.length === 0) {
        listEl.innerHTML = '<div class="empty-state">暂无内容</div>';
    } else {
        listEl.innerHTML = pageItems.map(item => `
            <div class="content-item ${item.pinned ? 'pinned' : ''}" onclick="toggleExpand(this)">
                <span class="content-category ${item.category}">${item.categoryName}</span>
                <div class="content-body">
                    <div class="content-title">${item.title}</div>
                    ${item.image ? '<img src="' + item.image + '" class="content-image" alt="' + item.title + '">' : ''}
                    <div class="content-desc">${item.desc}</div>
                    <div class="content-meta">
                        <span>${item.date}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 渲染分页
    if (paginationEl && totalPages > 1) {
        renderPagination(paginationEl, currentPage, totalPages, category);
    } else if (paginationEl) {
        paginationEl.innerHTML = '';
    }
}

// ---- 展开/收起内容 ----
function toggleExpand(element) {
    element.classList.toggle('expanded');
}

// ---- 渲染分页 ----
function renderPagination(el, current, total, category) {
    let html = '';

    // 上一页
    html += `<button class="page-btn ${current === 1 ? 'disabled' : ''}" 
        ${current === 1 ? '' : `onclick="renderContentList('${category}', ${current - 1})"`}>&lt;</button>`;

    // 页码
    const maxButtons = 5;
    let startPage = Math.max(1, current - Math.floor(maxButtons / 2));
    let endPage = Math.min(total, startPage + maxButtons - 1);

    if (endPage - startPage < maxButtons - 1) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="page-btn ${i === current ? 'active' : ''}" 
            onclick="renderContentList('${category}', ${i})">${i}</button>`;
    }

    // 下一页
    html += `<button class="page-btn ${current === total ? 'disabled' : ''}" 
        ${current === total ? '' : `onclick="renderContentList('${category}', ${current + 1})"`}>&gt;</button>`;

    // 页码信息
    html += `<span class="page-info">${current} / ${total}</span>`;

    el.innerHTML = html;
}

// ---- 分类筛选按钮事件（首页）----
document.addEventListener('DOMContentLoaded', function() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    if (filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                filterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                const category = this.dataset.category;
                renderContentList(category, 1);
            });
        });
    }
});
