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

    // 排序：置顶在前，然后按日期倒序，同一天内按id倒序（新→旧）
    filtered.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        const dateDiff = new Date(b.date) - new Date(a.date);
        if (dateDiff !== 0) return dateDiff;
        return b.id - a.id;  // 同一天内，id大的（新发布的）在前
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
        listEl.innerHTML = pageItems.map(item => {
            // 将 desc 按段落分割渲染
            const paragraphs = item.desc.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
            // 图片 HTML（如果有图片才渲染）
            const imageHtml = item.image ? `<div class="content-image"><img src="${item.image}" alt="${item.title}"></div>` : '';
            return `
            <div class="content-item ${item.pinned ? 'pinned' : ''}" onclick="toggleExpand(this)">
                <span class="content-category ${item.category}">${item.categoryName}</span>
                <div class="content-body">
                    ${imageHtml}
                    <div class="content-title">${item.title}</div>
                    <div class="content-desc">${paragraphs}</div>
                    <div class="content-meta">
                        <span>${item.date}</span>
                    </div>
                </div>
            </div>
            `;
        }).join('');
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


// ---- 图片懒加载 ----
(function() {
    // 将 img src 改为 data-src，实现懒加载
    function initLazyLoad() {
        const images = document.querySelectorAll('.content-image img');
        
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                        }
                        observer.unobserve(img);
                    }
                });
            }, {
                rootMargin: '100px 0px'  // 提前 100px 开始加载
            });
            
            images.forEach(img => {
                if (img.src && !img.dataset.src) {
                    img.dataset.src = img.src;
                    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // 1x1 透明占位图
                }
                observer.observe(img);
            });
        } else {
            // 浏览器不支持 IntersectionObserver，直接加载
            images.forEach(img => {
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
            });
        }
    }
    
    // 页面加载完成后初始化懒加载
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLazyLoad);
    } else {
        initLazyLoad();
    }
    
    // 渲染内容后也需要重新初始化（因为 renderContentList 会重新生成 HTML）
    const originalRender = window.renderContentList;
    if (originalRender) {
        window.renderContentList = function(category, page) {
            originalRender(category, page);
            // 延迟一点等 DOM 更新
            setTimeout(initLazyLoad, 100);
        };
    }
})();
