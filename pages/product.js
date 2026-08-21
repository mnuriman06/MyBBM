const PRODUCT_PAGE_SIZE = 100;

let productCategoriesCache = [];
let productUomCache = [];
let productRowsCache = [];       // current page of product rows
let productCurrentPage = 1;
let productTotalCount = 0;
let productActiveFilters = {};

function render_product() {
    return `<div class="dashboard-body">
                <div class="page-header">
                    <h1>Product Management</h1>
                    <div class="header-actions-group">
                        <button class="outline-btn" id="open-manage-categories-btn"><i class="fa-solid fa-tags"></i> Categories</button>
                        <button class="primary-btn" id="open-add-product-btn"><i class="fa-solid fa-plus"></i> Product</button>
                    </div>
                </div>

                <div class="stats-grid" id="product-stats-grid"></div>

                <div class="filter-bar">
                    <div class="form-group">
                        <label class="form-label">Search</label>
                        <input type="text" id="search-keyword" placeholder=" " class="form-input">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Category</label>
                        <select id="search-category" class="select2-search" style="width: 100%;">
                        </select>
                    </div>
                    <div class="filter-actions" style="display: flex; gap: 12px; flex-shrink: 0; margin-bottom: 8px;">
                        <button class="primary-btn search-submit-btn" id="product-filter-btn" title="Search"><i class="fa-solid fa-magnifying-glass"></i></button>
                        <button class="primary-btn pdf-export-btn" id="product-pdf-export-btn" style="background-color: var(--danger);" title="Export PDF"><i class="fa-solid fa-file-pdf"></i></button>
                    </div>
                </div>

                <div class="data-card">
                    <div id="table-view-container" class="table-responsive view-container active">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Product</th>
                                    <th>Category</th>
                                    <th class="text-right">Cost (RM)</th>
                                    <th class="text-right">Retail (RM)</th>
                                </tr>
                            </thead>
                            <tbody id="product-table-body">
                                <tr><td colspan="5" class="text-muted" style="text-align:center; padding: 24px;">Loading products...</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="pagination-container">
                        <div class="pagination-info" id="product-pagination-info">Showing 0 entries</div>
                        <ul class="pagination" id="product-pagination-list"></ul>
                    </div>
                </div>
            </div>

    <!-- Add Product Modal -->
    <div id="add-product-modal" class="modal-overlay">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Add New Product</h2>
                <button class="close-modal-btn" id="close-add-product-btn"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body">
                <form id="add-product-form" class="modal-form">
                    <div class="form-row">
                        <div class="form-group col-12" style="border: 2px dashed var(--border-color); border-radius: 8px; padding: 24px; text-align: center; color: var(--text-muted); cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100px;">
                            <i class="fa-solid fa-cloud-arrow-up" style="font-size: 1.75rem; margin-bottom: 8px;"></i>
                            <p style="margin: 0;">Drag & Drop Product Photo here or click to browse</p>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group col-4">
                            <label class="form-label">SKU</label>
                            <input type="text" id="product-sku" placeholder=" " class="form-input" required>
                        </div>
                        <div class="form-group col-8">
                            <label class="form-label">Product Name</label>
                            <input type="text" id="product-name" placeholder=" " class="form-input" required>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group col-6">
                            <label class="form-label">Category</label>
                            <select id="product-category" class="select2-search" data-placeholder="Category" style="width: 100%;">
                                <option></option>
                            </select>
                        </div>
                        <div class="form-group col-6">
                            <label class="form-label">Unit of Measure</label>
                            <select id="product-uom" class="select2-search" data-placeholder="UOM" style="width: 100%;">
                                <option></option>
                            </select>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group col-12">
                            <label class="form-label">Stock Control</label>
                            <div style="display: flex; gap: 16px; align-items: center; height: 46px;">
                                <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-weight: 500;">
                                    <input type="radio" name="product-stock-control" value="0" checked style="width: 16px; height: 16px;"> Controlled
                                </label>
                                <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-weight: 500;">
                                    <input type="radio" name="product-stock-control" value="1" style="width: 16px; height: 16px;"> Infinite
                                </label>
                            </div>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group col-6">
                            <label class="form-label">Cost Price (RM)</label>
                            <input type="number" id="product-cost" placeholder=" " class="form-input" step="0.01">
                        </div>
                        <div class="form-group col-6">
                            <label class="form-label">Retail Price (RM)</label>
                            <input type="number" id="product-retail" placeholder=" " class="form-input" required step="0.01">
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="action-btn" id="cancel-add-product-btn">Cancel</button>
                <button type="submit" form="add-product-form" class="primary-btn" id="save-add-product-btn">Save Product</button>
            </div>
        </div>
    </div>

    <!-- View / Edit Product Modal -->
    <div id="view-product-modal" class="modal-overlay">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="view-product-modal-title">View Product Details</h2>
                <button class="close-modal-btn" id="close-view-product-btn"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body">
                <form id="view-product-form" class="modal-form">
                    <div class="form-row">
                        <div class="form-group col-4">
                            <label class="form-label">SKU</label>
                            <input type="text" id="view-product-sku" class="form-input" readonly>
                        </div>
                        <div class="form-group col-8">
                            <label class="form-label">Product Name</label>
                            <input type="text" id="view-product-name" class="form-input" readonly>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-6">
                            <label class="form-label">Category</label>
                            <select id="view-product-category" class="select2-search" data-placeholder="Category" style="width: 100%;" disabled>
                                <option></option>
                            </select>
                        </div>
                        <div class="form-group col-6">
                            <label class="form-label">Unit of Measure</label>
                            <select id="view-product-uom" class="select2-search" data-placeholder="UOM" style="width: 100%;" disabled>
                                <option></option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-12">
                            <label class="form-label">Stock Control</label>
                            <div style="display: flex; gap: 16px; align-items: center; height: 46px;">
                                <label style="display: flex; align-items: center; gap: 6px; font-weight: 500;">
                                    <input type="radio" name="view-product-stock-control" value="0" class="view-product-sc-radio" disabled style="width: 16px; height: 16px;"> Controlled
                                </label>
                                <label style="display: flex; align-items: center; gap: 6px; font-weight: 500;">
                                    <input type="radio" name="view-product-stock-control" value="1" class="view-product-sc-radio" disabled style="width: 16px; height: 16px;"> Infinite
                                </label>
                            </div>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-6">
                            <label class="form-label">Cost Price (RM)</label>
                            <input type="text" id="view-product-cost" class="form-input" readonly>
                        </div>
                        <div class="form-group col-6">
                            <label class="form-label">Retail Price (RM)</label>
                            <input type="text" id="view-product-retail" class="form-input" readonly>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer" style="justify-content: space-between;">
                <button type="button" class="action-btn" style="color: var(--danger); border-color: var(--danger);" id="delete-view-product-btn"><i class="fa-solid fa-trash"></i> Delete</button>
                <div style="display: flex; gap: 12px;">
                    <button class="action-btn" id="cancel-view-product-btn">Close</button>
                    <button type="button" class="primary-btn" id="edit-view-product-btn"><i class="fa-solid fa-pen"></i> Edit</button>
                    <button type="button" class="primary-btn" id="save-view-product-btn" style="display:none;"><i class="fa-solid fa-floppy-disk"></i> Save</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Manage Categories Modal -->
    <div id="manage-categories-modal" class="modal-overlay">
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h2>Manage Categories</h2>
                <button class="close-modal-btn" id="close-manage-categories-btn"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body">
                <div class="form-row" style="align-items: flex-end;">
                    <div class="form-group col-9">
                        <label class="form-label">Category Name</label>
                        <input type="text" id="new-category-name" placeholder=" " class="form-input">
                    </div>
                    <div class="form-group" style="flex: 0 0 auto;">
                        <button class="primary-btn" id="add-category-btn" style="height: 46px; width: 46px; padding: 0; justify-content: center;"><i class="fa-solid fa-plus"></i></button>
                    </div>
                </div>
                <ul id="category-manage-list" style="list-style: none; margin-top: 16px; display: flex; flex-direction: column; gap: 8px;"></ul>
            </div>
            <div class="modal-footer">
                <button class="action-btn" id="close-manage-categories-footer-btn">Close</button>
            </div>
        </div>
    </div>

    <!-- Delete Blocked Modal -->
    <div id="product-delete-blocked-modal" class="modal-overlay">
        <div class="modal-content small-modal">
            <div class="modal-title"><i class="fa-solid fa-triangle-exclamation" style="color: var(--danger); margin-right: 8px;"></i> Cannot Delete Product</div>
            <div class="modal-text" id="product-delete-blocked-text">This product has related records and cannot be deleted.</div>
            <div class="modal-actions">
                <button class="btn-modal-no" onclick="document.getElementById('product-delete-blocked-modal').classList.remove('active')">OK</button>
            </div>
        </div>
    </div>

    <!-- Delete Confirm Modal -->
    <div id="product-delete-confirm-modal" class="modal-overlay">
        <div class="modal-content small-modal">
            <div class="modal-title"><i class="fa-solid fa-triangle-exclamation" style="color: var(--danger); margin-right: 8px;"></i> Delete Product</div>
            <div class="modal-text">Are you sure you want to delete this product? This cannot be undone.</div>
            <div class="modal-actions">
                <button class="btn-modal-yes" id="confirm-delete-product-btn">YES, DELETE</button>
                <button class="btn-modal-no" onclick="document.getElementById('product-delete-confirm-modal').classList.remove('active')">CANCEL</button>
            </div>
        </div>
    </div>

    <!-- Category Delete Blocked Modal -->
    <div id="category-delete-blocked-modal" class="modal-overlay">
        <div class="modal-content small-modal">
            <div class="modal-title"><i class="fa-solid fa-triangle-exclamation" style="color: var(--danger); margin-right: 8px;"></i> Cannot Delete Category</div>
            <div class="modal-text" id="category-delete-blocked-text">This category has related records and cannot be deleted.</div>
            <div class="modal-actions">
                <button class="btn-modal-no" onclick="document.getElementById('category-delete-blocked-modal').classList.remove('active')">OK</button>
            </div>
        </div>
    </div>

    <!-- Category Delete Confirm Modal -->
    <div id="category-delete-confirm-modal" class="modal-overlay">
        <div class="modal-content small-modal">
            <div class="modal-title"><i class="fa-solid fa-triangle-exclamation" style="color: var(--danger); margin-right: 8px;"></i> Delete Category</div>
            <div class="modal-text">Are you sure you want to delete this category? This cannot be undone.</div>
            <div class="modal-actions">
                <button class="btn-modal-yes" id="confirm-delete-category-btn">YES, DELETE</button>
                <button class="btn-modal-no" onclick="document.getElementById('category-delete-confirm-modal').classList.remove('active')">CANCEL</button>
            </div>
        </div>
    </div>
    `;
}

window.init_product = async function() {
    const [{ data: categories }, { data: uoms }] = await Promise.all([
        window.supabaseClient.from('product_category').select('id, name').order('name'),
        window.supabaseClient.from('uom').select('id, name').order('name')
    ]);
    productCategoriesCache = categories || [];
    productUomCache = uoms || [];

    // Filter select: "All" is a real, default-selected option (not a placeholder).
    populateProductSelect('search-category', productCategoriesCache, 'All');

    // Add/Edit form selects: required fields, keep placeholder style.
    populateProductSelect('product-category', productCategoriesCache);
    populateProductSelect('product-uom', productUomCache);
    populateProductSelect('view-product-category', productCategoriesCache);
    populateProductSelect('view-product-uom', productUomCache);

    await renderProductStatsGrid();

    productCurrentPage = 1;
    productActiveFilters = {};
    await fetchAndRenderProducts();

    setupAddProductModal();
    setupViewProductModal();
    setupProductDeleteModals();
    setupCategoryManageModal();
    setupCategoryDeleteModals();
    setupProductPdfExport();

    const filterBtn = document.getElementById('product-filter-btn');
    if (filterBtn) filterBtn.addEventListener('click', () => applyProductFilters());
    const searchInput = document.getElementById('search-keyword');
    if (searchInput) searchInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') applyProductFilters(); });
    if (typeof jQuery !== 'undefined') {
        $('#search-category').on('change', () => applyProductFilters());
    }

    if (typeof window.initializeSelect2 === 'function') window.initializeSelect2();
};

function populateProductSelect(id, items, allLabel) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = (allLabel ? `<option value="">${allLabel}</option>` : '<option></option>')
        + items.map(i => `<option value="${i.id}">${i.name}</option>`).join('');
}

async function renderProductStatsGrid() {
    const grid = document.getElementById('product-stats-grid');
    if (!grid) return;

    grid.style.gridTemplateColumns = `repeat(3, 1fr)`;
    grid.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon" style="background-color: #eef2ff; color: var(--primary);"><i class="fa-solid fa-boxes-stacked"></i></div>
            <div class="stat-details">
                <p>TOTAL PRODUCTS</p>
                <h3 id="stat-product-total">-</h3>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background-color: var(--info-bg); color: var(--info);"><i class="fa-solid fa-tags"></i></div>
            <div class="stat-details">
                <p>TOTAL CATEGORIES</p>
                <h3 id="stat-product-categories">-</h3>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background-color: var(--success-bg); color: var(--success);"><i class="fa-solid fa-shop"></i></div>
            <div class="stat-details">
                <p>TOTAL STORE LISTINGS</p>
                <h3 id="stat-product-listings">-</h3>
            </div>
        </div>
    `;

    const [{ count: productCount }, { count: categoryCount }, { count: listingCount }] = await Promise.all([
        window.supabaseClient.from('product').select('id', { count: 'exact', head: true }),
        window.supabaseClient.from('product_category').select('id', { count: 'exact', head: true }),
        window.supabaseClient.from('store_product').select('id', { count: 'exact', head: true })
    ]);

    const totalEl = document.getElementById('stat-product-total');
    const catEl = document.getElementById('stat-product-categories');
    const listingEl = document.getElementById('stat-product-listings');
    if (totalEl) totalEl.textContent = productCount ?? 0;
    if (catEl) catEl.textContent = categoryCount ?? 0;
    if (listingEl) listingEl.textContent = listingCount ?? 0;
}

// Not scoped to any single store — lists every product in the system.
function buildProductQuery({ forCount } = {}) {
    let query = window.supabaseClient
        .from('product')
        .select('id, sku, name, price_cost, price_retail, photo, stock_control, category (id, name), uom (id, name)', { count: forCount ? 'exact' : null });

    if (productActiveFilters.keyword) {
        const kw = productActiveFilters.keyword;
        query = query.or(`name.ilike.%${kw}%,sku.ilike.%${kw}%`);
    }
    if (productActiveFilters.category) {
        query = query.eq('category', productActiveFilters.category);
    }

    return query.order('stock_control', { ascending: false }).order('name');
}

async function fetchAndRenderProducts() {
    const from = (productCurrentPage - 1) * PRODUCT_PAGE_SIZE;
    const to = from + PRODUCT_PAGE_SIZE - 1;

    const { data, error, count } = await buildProductQuery({ forCount: true }).range(from, to);

    if (error) {
        document.getElementById('product-table-body').innerHTML =
            `<tr><td colspan="5" class="text-muted" style="text-align:center; padding:24px;">Failed to load products.</td></tr>`;
        return;
    }

    const rows = data || [];
    productRowsCache = rows;
    productTotalCount = count ?? rows.length;

    renderProductTable(rows, from);
    renderProductPagination();

    const shownFrom = rows.length ? from + 1 : 0;
    const shownTo = from + rows.length;
    const info = document.getElementById('product-pagination-info');
    if (info) info.textContent = `Showing ${shownFrom} to ${shownTo} of ${productTotalCount} entries`;
}

function renderProductPagination() {
    const list = document.getElementById('product-pagination-list');
    if (!list) return;

    const totalPages = Math.max(1, Math.ceil(productTotalCount / PRODUCT_PAGE_SIZE));

    let html = `<li><button class="page-btn ${productCurrentPage === 1 ? 'disabled' : ''}" id="product-page-prev"><i class="fa-solid fa-chevron-left"></i></button></li>`;
    for (let p = 1; p <= totalPages; p++) {
        html += `<li><button class="page-btn ${p === productCurrentPage ? 'active' : ''}" data-page="${p}">${p}</button></li>`;
    }
    html += `<li><button class="page-btn ${productCurrentPage === totalPages ? 'disabled' : ''}" id="product-page-next"><i class="fa-solid fa-chevron-right"></i></button></li>`;
    list.innerHTML = html;

    list.querySelectorAll('.page-btn[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
            productCurrentPage = parseInt(btn.getAttribute('data-page'), 10);
            fetchAndRenderProducts();
        });
    });
    const prevBtn = document.getElementById('product-page-prev');
    const nextBtn = document.getElementById('product-page-next');
    if (prevBtn) prevBtn.addEventListener('click', () => {
        if (productCurrentPage > 1) { productCurrentPage--; fetchAndRenderProducts(); }
    });
    if (nextBtn) nextBtn.addEventListener('click', () => {
        if (productCurrentPage < totalPages) { productCurrentPage++; fetchAndRenderProducts(); }
    });
}

function renderProductTable(rows, offset) {
    const tbody = document.getElementById('product-table-body');
    if (!tbody) return;

    if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-muted" style="text-align:center; padding:24px;">No products found.</td></tr>`;
        return;
    }

    tbody.innerHTML = rows.map((p, i) => `
        <tr>
            <td>${offset + i + 1}</td>
            <td>
                <div class="product-detail" style="display: flex; align-items: center; gap: 12px;">
                    <img src="${p.photo || 'product_photo.webp'}" alt="${p.name || 'Product'}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-color); flex-shrink: 0;">
                    <div style="display: flex; flex-direction: column;">
                        <a href="#" class="view-product-link" data-product-id="${p.id}" style="color:#2563eb; font-weight:600; text-decoration:none;">${p.name || '-'}</a>
                        <span class="text-muted text-sm font-mono">${p.sku || '-'}</span>
                    </div>
                </div>
            </td>
            <td>${p.category?.name ? `<span class="status role-fallback">${p.category.name}</span>` : '-'}</td>
            <td class="text-right">${p.price_cost != null ? Number(p.price_cost).toFixed(2) : '-'}</td>
            <td class="text-right" style="font-weight: 600; color: var(--primary);">${p.price_retail != null ? Number(p.price_retail).toFixed(2) : '-'}</td>
        </tr>
    `).join('');

    tbody.querySelectorAll('.view-product-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            openViewProductModalById(link.getAttribute('data-product-id'));
        });
    });
}

function applyProductFilters() {
    productCurrentPage = 1;
    productActiveFilters = {
        keyword: document.getElementById('search-keyword')?.value.trim() || '',
        category: document.getElementById('search-category')?.value || ''
    };
    fetchAndRenderProducts();
}

// --- View / Edit modal ---
function openViewProductModalById(productId) {
    const row = productRowsCache.find(r => String(r.id) === String(productId));
    if (!row) return;
    populateViewProductModal(row);
    setViewProductModalEditable(false);
    const modal = document.getElementById('view-product-modal');
    if (modal) modal.classList.add('active');
}

function populateViewProductModal(row) {
    document.getElementById('view-product-sku').value = row.sku || '';
    document.getElementById('view-product-name').value = row.name || '';
    document.getElementById('view-product-cost').value = row.price_cost != null ? Number(row.price_cost).toFixed(2) : '';
    document.getElementById('view-product-retail').value = row.price_retail != null ? Number(row.price_retail).toFixed(2) : '';

    const scVal = String(row.stock_control ?? 0);
    document.querySelectorAll('.view-product-sc-radio').forEach(r => { r.checked = (r.value === scVal); });

    const catSel = document.getElementById('view-product-category');
    if (catSel) {
        catSel.value = row.category?.id || '';
        if (typeof jQuery !== 'undefined') $(catSel).trigger('change');
    }
    const uomSel = document.getElementById('view-product-uom');
    if (uomSel) {
        uomSel.value = row.uom?.id || '';
        if (typeof jQuery !== 'undefined') $(uomSel).trigger('change');
    }

    document.getElementById('view-product-modal').dataset.productId = row.id;
}

function setViewProductModalEditable(editable) {
    const title = document.getElementById('view-product-modal-title');
    const editBtn = document.getElementById('edit-view-product-btn');
    const saveBtn = document.getElementById('save-view-product-btn');

    ['view-product-sku', 'view-product-name', 'view-product-cost', 'view-product-retail'].forEach(id => {
        document.getElementById(id).readOnly = !editable;
    });
    document.querySelectorAll('.view-product-sc-radio').forEach(r => { r.disabled = !editable; });
    ['view-product-category', 'view-product-uom'].forEach(id => {
        const el = document.getElementById(id);
        el.disabled = !editable;
        if (typeof jQuery !== 'undefined') $(el).prop('disabled', !editable).trigger('change.select2');
    });

    title.textContent = editable ? 'Edit Product Details' : 'View Product Details';
    editBtn.style.display = editable ? 'none' : 'inline-flex';
    saveBtn.style.display = editable ? 'inline-flex' : 'none';
}

function setupViewProductModal() {
    const modal = document.getElementById('view-product-modal');
    const closeBtn = document.getElementById('close-view-product-btn');
    const cancelBtn = document.getElementById('cancel-view-product-btn');
    const editBtn = document.getElementById('edit-view-product-btn');
    const saveBtn = document.getElementById('save-view-product-btn');
    const deleteBtn = document.getElementById('delete-view-product-btn');

    const close = () => modal && modal.classList.remove('active');

    if (closeBtn) closeBtn.addEventListener('click', close);
    if (cancelBtn) cancelBtn.addEventListener('click', close);
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    if (editBtn) editBtn.addEventListener('click', () => setViewProductModalEditable(true));

    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const productId = modal.dataset.productId;
            const name = document.getElementById('view-product-name').value.trim();
            const sku = document.getElementById('view-product-sku').value.trim();
            if (!name || !sku) { alert('SKU and Name are required.'); return; }

            saveBtn.disabled = true;
            const originalHtml = saveBtn.innerHTML;
            saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

            const payload = {
                sku,
                name,
                category: document.getElementById('view-product-category').value || null,
                uom: document.getElementById('view-product-uom').value || null,
                price_cost: parseFloat(document.getElementById('view-product-cost').value) || 0,
                price_retail: parseFloat(document.getElementById('view-product-retail').value) || 0,
                stock_control: parseInt(document.querySelector('input[name="view-product-stock-control"]:checked')?.value ?? '0', 10),
            };

            const { error } = await window.supabaseClient.from('product').update(payload).eq('id', productId);

            saveBtn.disabled = false;
            saveBtn.innerHTML = originalHtml;

            if (error) {
                alert('Failed to save changes.');
                return;
            }

            close();
            await renderProductStatsGrid();
            await fetchAndRenderProducts();
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            const productId = modal.dataset.productId;
            close();
            requestDeleteProduct(productId);
        });
    }
}

// --- Product delete: dependency check, then confirm, then delete ---
let pendingDeleteProductId = null;

async function requestDeleteProduct(productId) {
    pendingDeleteProductId = productId;

    const { count } = await window.supabaseClient
        .from('store_product')
        .select('id', { count: 'exact', head: true })
        .eq('product', productId);

    if (count > 0) {
        document.getElementById('product-delete-blocked-text').textContent =
            `This product cannot be deleted because it is listed in ${count} store(s). Please remove those listings first.`;
        document.getElementById('product-delete-blocked-modal').classList.add('active');
        return;
    }

    document.getElementById('product-delete-confirm-modal').classList.add('active');
}

function setupProductDeleteModals() {
    const confirmBtn = document.getElementById('confirm-delete-product-btn');
    if (!confirmBtn) return;
    confirmBtn.addEventListener('click', async () => {
        const modal = document.getElementById('product-delete-confirm-modal');
        confirmBtn.disabled = true;
        const originalHtml = confirmBtn.innerHTML;
        confirmBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Deleting...';

        const { error } = await window.supabaseClient.from('product').delete().eq('id', pendingDeleteProductId);

        confirmBtn.disabled = false;
        confirmBtn.innerHTML = originalHtml;
        modal.classList.remove('active');

        if (error) {
            alert('Failed to delete product.');
            return;
        }

        await renderProductStatsGrid();
        await fetchAndRenderProducts();
    });
}

// --- Add product modal ---
function setupAddProductModal() {
    const modal = document.getElementById('add-product-modal');
    const openBtn = document.getElementById('open-add-product-btn');
    const closeBtn = document.getElementById('close-add-product-btn');
    const cancelBtn = document.getElementById('cancel-add-product-btn');
    const form = document.getElementById('add-product-form');

    const close = () => modal && modal.classList.remove('active');
    const open = () => {
        if (!modal) return;
        form.querySelectorAll('input, select').forEach(el => {
            if (el.type === 'radio') return; // handled separately below
            el.value = '';
            if (typeof jQuery !== 'undefined' && el.classList.contains('select2-search')) $(el).val(null).trigger('change');
        });
        const controlledRadio = form.querySelector('input[name="product-stock-control"][value="0"]');
        if (controlledRadio) controlledRadio.checked = true;
        modal.classList.add('active');
    };

    if (openBtn) openBtn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (cancelBtn) cancelBtn.addEventListener('click', close);
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('save-add-product-btn');
            const originalText = submitBtn.innerHTML;

            const sku = document.getElementById('product-sku').value.trim();
            const name = document.getElementById('product-name').value.trim();
            if (!sku || !name) return;

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

            const payload = {
                sku,
                name,
                category: document.getElementById('product-category').value || null,
                uom: document.getElementById('product-uom').value || null,
                price_cost: parseFloat(document.getElementById('product-cost').value) || 0,
                price_retail: parseFloat(document.getElementById('product-retail').value) || 0,
                stock_control: parseInt(document.querySelector('input[name="product-stock-control"]:checked')?.value ?? '0', 10),
            };

            const { error } = await window.supabaseClient.from('product').insert(payload);

            if (error) {
                alert('Failed to save product.');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                return;
            }

            submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Saved!';
            submitBtn.style.backgroundColor = 'var(--success)';
            setTimeout(async () => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                submitBtn.style.backgroundColor = '';
                close();
                await renderProductStatsGrid();
                productCurrentPage = 1;
                await fetchAndRenderProducts();
            }, 800);
        });
    }
}

// --- Manage Categories modal ---
function setupCategoryManageModal() {
    const modal = document.getElementById('manage-categories-modal');
    const openBtn = document.getElementById('open-manage-categories-btn');
    const closeBtn = document.getElementById('close-manage-categories-btn');
    const footerCloseBtn = document.getElementById('close-manage-categories-footer-btn');
    const addBtn = document.getElementById('add-category-btn');
    const newNameInput = document.getElementById('new-category-name');

    const close = () => modal && modal.classList.remove('active');
    const open = async () => {
        if (!modal) return;
        newNameInput.value = '';
        await renderCategoryManageList();
        modal.classList.add('active');
    };

    if (openBtn) openBtn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (footerCloseBtn) footerCloseBtn.addEventListener('click', close);
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

    if (addBtn) {
        addBtn.addEventListener('click', async () => {
            const name = newNameInput.value.trim();
            if (!name) return;

            addBtn.disabled = true;
            const { error } = await window.supabaseClient.from('product_category').insert({ name });
            addBtn.disabled = false;

            if (error) {
                alert('Failed to add category.');
                return;
            }

            newNameInput.value = '';
            await refreshCategoryData();
            await renderCategoryManageList();
        });
    }
}

async function refreshCategoryData() {
    const { data: categories } = await window.supabaseClient.from('product_category').select('id, name').order('name');
    productCategoriesCache = categories || [];

    const currentSearchVal = document.getElementById('search-category')?.value || '';
    populateProductSelect('search-category', productCategoriesCache, 'All');
    if (document.getElementById('search-category')) document.getElementById('search-category').value = currentSearchVal;

    populateProductSelect('product-category', productCategoriesCache);
    populateProductSelect('view-product-category', productCategoriesCache);
    if (typeof window.initializeSelect2 === 'function') window.initializeSelect2();

    await renderProductStatsGrid();
}

async function renderCategoryManageList() {
    const list = document.getElementById('category-manage-list');
    if (!list) return;

    if (!productCategoriesCache.length) {
        list.innerHTML = `<li class="text-muted text-sm" style="text-align:center; padding: 16px 0;">No categories yet.</li>`;
        return;
    }

    list.innerHTML = productCategoriesCache.map(c => `
        <li data-category-id="${c.id}" style="display: flex; align-items: center; gap: 8px; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-main);">
            <span class="category-display-name" style="flex: 1; font-weight: 500;">${c.name}</span>
            <input type="text" class="form-input category-edit-input" value="${c.name}" style="flex: 1; display: none; height: 34px; padding: 0 10px;">
            <button class="icon-action category-edit-btn" title="Edit"><i class="fa-solid fa-pen"></i></button>
            <button class="icon-action category-save-btn" title="Save" style="display:none;"><i class="fa-solid fa-check"></i></button>
            <button class="icon-action delete category-delete-btn" title="Delete"><i class="fa-solid fa-trash"></i></button>
        </li>
    `).join('');

    list.querySelectorAll('li').forEach(li => {
        const catId = li.getAttribute('data-category-id');
        const displaySpan = li.querySelector('.category-display-name');
        const editInput = li.querySelector('.category-edit-input');
        const editBtn = li.querySelector('.category-edit-btn');
        const saveBtn = li.querySelector('.category-save-btn');
        const deleteBtn = li.querySelector('.category-delete-btn');

        editBtn.addEventListener('click', () => {
            displaySpan.style.display = 'none';
            editInput.style.display = 'block';
            editBtn.style.display = 'none';
            saveBtn.style.display = 'inline-flex';
            editInput.focus();
        });

        saveBtn.addEventListener('click', async () => {
            const newName = editInput.value.trim();
            if (!newName) return;

            saveBtn.disabled = true;
            const { error } = await window.supabaseClient.from('product_category').update({ name: newName }).eq('id', catId);
            saveBtn.disabled = false;

            if (error) {
                alert('Failed to update category.');
                return;
            }

            await refreshCategoryData();
            await renderCategoryManageList();
        });

        deleteBtn.addEventListener('click', () => requestDeleteCategory(catId));
    });
}

// --- Category delete: dependency check, then confirm, then delete ---
let pendingDeleteCategoryId = null;

async function requestDeleteCategory(categoryId) {
    pendingDeleteCategoryId = categoryId;

    const { count } = await window.supabaseClient
        .from('product')
        .select('id', { count: 'exact', head: true })
        .eq('category', categoryId);

    if (count > 0) {
        document.getElementById('category-delete-blocked-text').textContent =
            `This category cannot be deleted because ${count} product(s) still use it. Please reassign those products first.`;
        document.getElementById('category-delete-blocked-modal').classList.add('active');
        return;
    }

    document.getElementById('category-delete-confirm-modal').classList.add('active');
}

function setupCategoryDeleteModals() {
    const confirmBtn = document.getElementById('confirm-delete-category-btn');
    if (!confirmBtn) return;
    confirmBtn.addEventListener('click', async () => {
        const modal = document.getElementById('category-delete-confirm-modal');
        confirmBtn.disabled = true;
        const originalHtml = confirmBtn.innerHTML;
        confirmBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Deleting...';

        const { error } = await window.supabaseClient.from('product_category').delete().eq('id', pendingDeleteCategoryId);

        confirmBtn.disabled = false;
        confirmBtn.innerHTML = originalHtml;
        modal.classList.remove('active');

        if (error) {
            alert('Failed to delete category.');
            return;
        }

        await refreshCategoryData();
        await renderCategoryManageList();
    });
}

// --- PDF Export ---
function setupProductPdfExport() {
    const btn = document.getElementById('product-pdf-export-btn');
    if (!btn) return;
    btn.addEventListener('click', generateProductsPdf);
}

function buildActiveProductFilterRows() {
    const category = productCategoriesCache.find(c => String(c.id) === String(productActiveFilters.category));
    return [
        ['Search Keyword', productActiveFilters.keyword || 'All'],
        ['Category', productActiveFilters.category ? (category ? category.name : productActiveFilters.category) : 'All']
    ];
}

async function generateProductsPdf() {
    const btn = document.getElementById('product-pdf-export-btn');
    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert('PDF library not loaded. Please add jsPDF + jspdf-autotable to index.html.');
        return;
    }

    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    try {
        const { data: allRows, error } = await buildProductQuery({ forCount: false });

        if (error) {
            alert('Failed to load products for export.');
            return;
        }

        const rows = allRows || [];
        if (!rows.length) {
            alert('No products match the current filters.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
        const marginLeft = 40;
        let y = 44;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(15);
        doc.text('ADVRetail', marginLeft, y);
        y += 18;

        y += 8;
        doc.setDrawColor(226, 232, 240);
        doc.line(marginLeft, y, doc.internal.pageSize.getWidth() - marginLeft, y);
        y += 20;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(20);
        doc.text('Product List', marginLeft, y);
        y += 12;

        const filterRows = buildActiveProductFilterRows();
        doc.autoTable({
            body: filterRows,
            startY: y + 8,
            margin: { left: marginLeft, right: marginLeft },
            theme: 'grid',
            styles: { fontSize: 8.5, cellPadding: 5, lineColor: [203, 213, 225], lineWidth: 0.75 },
            columnStyles: {
                0: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 100 },
                1: { textColor: 60 }
            },
            tableWidth: 320
        });

        const filterTableEndY = doc.lastAutoTable.finalY;

        const tableRows = rows.map(p => [
            p.sku || '-',
            p.name || '-',
            p.category?.name || '-',
            p.uom?.name || '-',
            p.price_cost != null ? Number(p.price_cost).toFixed(2) : '-',
            p.price_retail != null ? Number(p.price_retail).toFixed(2) : '-'
        ]);

        doc.autoTable({
            head: [['SKU', 'Name', 'Category', 'UOM', 'Cost (RM)', 'Retail (RM)']],
            body: tableRows,
            startY: filterTableEndY + 16,
            margin: { left: marginLeft, right: marginLeft },
            theme: 'grid',
            styles: { fontSize: 8.5, cellPadding: 6, lineColor: [203, 213, 225], lineWidth: 0.75 },
            headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold', lineColor: [99, 102, 241], lineWidth: 0.75 },
            alternateRowStyles: { fillColor: [248, 250, 252] }
        });

        const dateStamp = new Date().toISOString().slice(0, 10);
        doc.save(`Products_${dateStamp}.pdf`);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
    }
}