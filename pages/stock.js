const STOCK_PAGE_SIZE = 100;
const ACTION_TYPE_DELETE = 3;
const TABLE_REF_STORE_PRODUCT = 9;

let stockCategoriesCache = [];
let stockAllRows = [];        // all store_product rows for active store, with derived status
let stockFilteredRows = [];   // after keyword/category/status filters
let stockCurrentPage = 1;
let stockActiveFilters = {};
let stockActiveStoreId = null;
let stockCurrentContactId = null; // for action.created_by on soft-delete

const STOCK_STATUS_LABELS = {
    active: 'Active',
    best_sales: 'Best Sales',
    low_qty: 'Low Qty',
    inactive: 'Inactive'
};
const STATUS_BADGE_CLASS = {
    active: 'admin',
    best_sales: 'staff',
    low_qty: 'manager',
    inactive: 'role-fallback'
};

function render_stock() {
    return `<div class="dashboard-body">
                <div class="page-header">
                    <h1>Stock Management</h1>
                    <div class="header-actions-group">
                        <button class="primary-btn" id="open-add-stock-btn"><i class="fa-solid fa-plus"></i> Stock</button>
                    </div>
                </div>

                <div class="stats-grid" id="stock-stats-grid"></div>

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
                    <div class="form-group">
                        <label class="form-label">Status</label>
                        <select id="search-status" class="select2-search" style="width: 100%;">
                            <option value="">All</option>
                            <option value="active">${STOCK_STATUS_LABELS.active}</option>
                            <option value="best_sales">${STOCK_STATUS_LABELS.best_sales}</option>
                            <option value="low_qty">${STOCK_STATUS_LABELS.low_qty}</option>
                            <option value="inactive">${STOCK_STATUS_LABELS.inactive}</option>
                        </select>
                    </div>
                    <div class="filter-actions" style="display: flex; gap: 12px; flex-shrink: 0;">
                        <button class="primary-btn search-submit-btn" id="stock-filter-btn" title="Search"><i class="fa-solid fa-magnifying-glass"></i></button>
                        <button class="primary-btn pdf-export-btn" id="stock-pdf-export-btn" style="background-color: var(--danger);" title="Export PDF"><i class="fa-solid fa-file-pdf"></i></button>
                    </div>
                </div>

                <div class="data-card">
                    <div id="table-view-container" class="table-responsive view-container active">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>SKU</th>
                                    <th>Product Detail</th>
                                    <th>IN</th>
                                    <th>OUT</th>
                                    <th>BAL</th>
                                    <th>Category</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody id="stock-table-body">
                                <tr><td colspan="8" class="text-muted" style="text-align:center; padding: 24px;">Loading stock...</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="pagination-container">
                        <div class="pagination-info" id="stock-pagination-info">Showing 0 entries</div>
                        <ul class="pagination" id="stock-pagination-list"></ul>
                    </div>
                </div>
            </div>

    <!-- Add Stock Modal (attaches an existing product to the active store) -->
    <div id="add-stock-modal" class="modal-overlay">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Add Stock</h2>
                <button class="close-modal-btn" id="close-add-stock-btn"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body">
                <form id="add-stock-form" class="modal-form">
                    <div class="form-row">
                        <div class="form-group col-12">
                            <label class="form-label">Product</label>
                            <select id="stock-product-select" class="select2-search" data-placeholder="Select an existing product" style="width: 100%;">
                                <option></option>
                            </select>
                            <small class="text-muted" style="display:block; margin-top: 6px;">Only products not already stocked in this store are listed. New products are created on the <a href="#" data-link="product">Products</a> page.</small>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-6">
                            <label class="form-label">Initial Qty In</label>
                            <input type="number" id="stock-qty-in" placeholder=" " class="form-input" step="0.001" value="0">
                        </div>
                        <div class="form-group col-6">
                            <label class="form-label">Initial Qty Out</label>
                            <input type="number" id="stock-qty-out" placeholder=" " class="form-input" step="0.001" value="0">
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="action-btn" id="cancel-add-stock-btn">Cancel</button>
                <button type="submit" form="add-stock-form" class="primary-btn" id="save-add-stock-btn">Save Stock</button>
            </div>
        </div>
    </div>

    <!-- View / Edit Stock Modal -->
    <div id="view-stock-modal" class="modal-overlay">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="view-stock-modal-title">View Stock Details</h2>
                <button class="close-modal-btn" id="close-view-stock-btn"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body">
                <div style="display: flex; gap: 24px; align-items: center; margin-bottom: 24px;">
                    <img id="view-stock-photo" src="product_photo.webp" alt="Product" style="width: 80px; height: 80px; object-fit: cover; border-radius: 12px; border: 1px solid var(--border-color);">
                    <div style="flex-grow: 1;">
                        <h3 id="view-stock-name-display" style="margin-bottom: 4px; font-size: 1.25rem;">-</h3>
                        <p class="text-muted text-sm">SKU: <span id="view-stock-sku-display">-</span></p>
                    </div>
                    <div style="text-align: right;">
                        <p class="text-muted text-sm" style="margin-bottom: 4px;">Current Balance</p>
                        <h2 id="view-stock-bal-display" style="color: var(--primary);">-</h2>
                        <span id="view-stock-status-badge" class="status" style="margin-top: 6px; display: inline-block;">-</span>
                    </div>
                </div>

                <form id="view-stock-form" class="modal-form">
                    <div class="form-row">
                        <div class="form-group col-3">
                            <label class="form-label">SKU</label>
                            <input type="text" id="view-stock-sku" class="form-input" readonly disabled>
                        </div>
                        <div class="form-group col-9">
                            <label class="form-label">Product Name</label>
                            <input type="text" id="view-stock-name" class="form-input" readonly disabled>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-6">
                            <label class="form-label">Category</label>
                            <input type="text" id="view-stock-category" class="form-input" readonly disabled>
                        </div>
                        <div class="form-group col-6">
                            <label class="form-label">Low Qty Threshold</label>
                            <input type="text" id="view-stock-low-qty" class="form-input" readonly disabled>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-4">
                            <label class="form-label">Qty In</label>
                            <input type="number" id="view-stock-qty-in" class="form-input" readonly step="0.001">
                        </div>
                        <div class="form-group col-4">
                            <label class="form-label">Qty Out</label>
                            <input type="number" id="view-stock-qty-out" class="form-input" readonly step="0.001">
                        </div>
                        <div class="form-group col-4">
                            <label class="form-label">Qty Balance</label>
                            <input type="text" id="view-stock-qty-bal-preview" class="form-input" readonly disabled style="font-weight: 700;">
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer" style="justify-content: space-between;">
                <button type="button" class="action-btn" style="color: var(--danger); border-color: var(--danger);" id="delete-view-stock-btn"><i class="fa-solid fa-ban"></i> Mark Inactive</button>
                <div style="display: flex; gap: 12px;">
                    <button class="action-btn" id="cancel-view-stock-btn">Close</button>
                    <button type="button" class="primary-btn" id="edit-view-stock-btn"><i class="fa-solid fa-pen"></i> Edit</button>
                    <button type="button" class="primary-btn" id="save-view-stock-btn" style="display:none;"><i class="fa-solid fa-floppy-disk"></i> Save</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Mark Inactive Confirm Modal -->
    <div id="stock-inactive-confirm-modal" class="modal-overlay">
        <div class="modal-content small-modal">
            <div class="modal-title"><i class="fa-solid fa-triangle-exclamation" style="color: var(--danger); margin-right: 8px;"></i> Mark Stock Inactive</div>
            <div class="modal-text">This marks the stock line as inactive (logged, not deleted — transaction history stays intact). Continue?</div>
            <div class="modal-actions">
                <button class="btn-modal-yes" id="confirm-inactive-stock-btn">YES, MARK INACTIVE</button>
                <button class="btn-modal-no" onclick="document.getElementById('stock-inactive-confirm-modal').classList.remove('active')">CANCEL</button>
            </div>
        </div>
    </div>
    `;
}

window.init_stock = async function() {
    stockActiveStoreId = await window.getActiveStoreId();
    if (!stockActiveStoreId) {
        document.getElementById('stock-table-body').innerHTML =
            `<tr><td colspan="8" class="text-muted" style="text-align:center; padding:24px;">You are not assigned to any store.</td></tr>`;
        return;
    }

    await resolveCurrentContactId();

    const { data: categories } = await window.supabaseClient.from('product_category').select('id, name').order('name');
    stockCategoriesCache = categories || [];
    populateStockSelect('search-category', stockCategoriesCache, 'All');

    stockCurrentPage = 1;
    stockActiveFilters = {};
    await fetchAndComputeStock();
    applyStockFiltersAndRender();

    setupAddStockModal();
    setupViewStockModal();
    setupInactiveModal();
    setupStockPdfExport();

    const filterBtn = document.getElementById('stock-filter-btn');
    if (filterBtn) filterBtn.addEventListener('click', () => { stockCurrentPage = 1; readStockFiltersFromUI(); applyStockFiltersAndRender(); });
    const searchInput = document.getElementById('search-keyword');
    if (searchInput) searchInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') { stockCurrentPage = 1; readStockFiltersFromUI(); applyStockFiltersAndRender(); } });
    if (typeof jQuery !== 'undefined') {
        $('#search-category, #search-status').on('change', () => { stockCurrentPage = 1; readStockFiltersFromUI(); applyStockFiltersAndRender(); });
    }

    if (typeof window.initializeSelect2 === 'function') window.initializeSelect2();
};

async function resolveCurrentContactId() {
    const currentContactId = await window.getCurrentContactId();
    if (currentContactId) {
        stockCurrentContactId = currentContactId;
        return;
    }
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) return;
    const { data } = await window.supabaseClient.from('contact').select('id').eq('user_id', user.id).maybeSingle();
    stockCurrentContactId = data?.id || null;
}

function populateStockSelect(id, items, allLabel) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = (allLabel ? `<option value="">${allLabel}</option>` : '<option></option>')
        + items.map(i => `<option value="${i.id}">${i.name}</option>`).join('');
}

// --- Fetch all store_product rows for the active store + compute derived status ---
async function fetchAndComputeStock() {
    const tbody = document.getElementById('stock-table-body');

    const { data: spRows, error } = await window.supabaseClient
        .from('store_product')
        .select(`
            id, qty_in, qty_out, qty_bal,
            product ( id, sku, name, photo, low_qty, stock_control, category ( id, name ) )
        `)
        .eq('store', stockActiveStoreId);

    if (error) {
        if (tbody) tbody.innerHTML = `<tr><td colspan="8" class="text-muted" style="text-align:center; padding:24px;">Failed to load stock.</td></tr>`;
        return;
    }

    const rows = (spRows || []).filter(r => r.product);
    const spIds = rows.map(r => r.id);

    // Fetch DELETE-type action logs for these store_product rows in one query
    let deletedIds = new Set();
    if (spIds.length) {
        const { data: actionRows } = await window.supabaseClient
            .from('action')
            .select('table_ref_id')
            .eq('type', ACTION_TYPE_DELETE)
            .eq('table_ref', TABLE_REF_STORE_PRODUCT)
            .in('table_ref_id', spIds);
        deletedIds = new Set((actionRows || []).map(a => a.table_ref_id));
    }

    stockAllRows = rows.map(r => {
        const qtyOut = Number(r.qty_out) || 0;
        const qtyBal = Number(r.qty_bal) || 0;
        const lowQty = Number(r.product.low_qty) || 0;
        const isInfinite = r.product.stock_control === 1;

        let status;
        if (deletedIds.has(r.id)) status = 'inactive';
        else if (isInfinite) status = 'active'; // never low_qty / best_sales for infinite stock
        else if (qtyBal <= lowQty) status = 'low_qty';
        else if (qtyOut >= 10) status = 'best_sales';
        else status = 'active';

        return { ...r, _status: status, _isInfinite: isInfinite };
    });
}

async function renderStockStatsGrid() {
    const grid = document.getElementById('stock-stats-grid');
    if (!grid) return;

    const total = stockAllRows.length;
    const bestSales = stockAllRows.filter(r => r._status === 'best_sales').length;
    const lowQty = stockAllRows.filter(r => r._status === 'low_qty').length;
    const inactive = stockAllRows.filter(r => r._status === 'inactive').length;

    grid.style.gridTemplateColumns = `repeat(4, 1fr)`;
    grid.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon" style="background-color: var(--info-bg); color: var(--info);"><i class="fa-solid fa-boxes-stacked"></i></div>
            <div class="stat-details"><p>TOTAL STOCK</p><h3>${total}</h3></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background-color: #e0f2fe; color: #0284c7;"><i class="fa-solid fa-chart-line"></i></div>
            <div class="stat-details"><p>BEST SALES</p><h3>${bestSales}</h3></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background-color: var(--danger-bg); color: var(--danger);"><i class="fa-solid fa-triangle-exclamation"></i></div>
            <div class="stat-details"><p>LOW QTY</p><h3>${lowQty}</h3></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background-color: #f1f5f9; color: #64748b;"><i class="fa-solid fa-ban"></i></div>
            <div class="stat-details"><p>INACTIVE</p><h3>${inactive}</h3></div>
        </div>
    `;
}

function readStockFiltersFromUI() {
    stockActiveFilters = {
        keyword: document.getElementById('search-keyword')?.value.trim().toLowerCase() || '',
        category: document.getElementById('search-category')?.value || '',
        status: document.getElementById('search-status')?.value || ''
    };
}

function applyStockFiltersAndRender() {
    stockFilteredRows = stockAllRows.filter(r => {
        const p = r.product;
        if (stockActiveFilters.keyword) {
            const kw = stockActiveFilters.keyword;
            const matches = (p.name || '').toLowerCase().includes(kw) || (p.sku || '').toLowerCase().includes(kw);
            if (!matches) return false;
        }
        if (stockActiveFilters.category && String(p.category?.id) !== String(stockActiveFilters.category)) return false;
        if (stockActiveFilters.status && r._status !== stockActiveFilters.status) return false;
        return true;
    });

    // Infinite-stock products float to the top
    stockFilteredRows.sort((a, b) => (b._isInfinite ? 1 : 0) - (a._isInfinite ? 1 : 0));

    renderStockStatsGrid();
    renderStockTable();
    renderStockPagination();
}

function renderStockTable() {
    const tbody = document.getElementById('stock-table-body');
    if (!tbody) return;

    const totalPages = Math.max(1, Math.ceil(stockFilteredRows.length / STOCK_PAGE_SIZE));
    if (stockCurrentPage > totalPages) stockCurrentPage = totalPages;

    const from = (stockCurrentPage - 1) * STOCK_PAGE_SIZE;
    const pageRows = stockFilteredRows.slice(from, from + STOCK_PAGE_SIZE);

    if (!pageRows.length) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-muted" style="text-align:center; padding:24px;">No stock found.</td></tr>`;
    } else {
        tbody.innerHTML = pageRows.map((r, i) => {
            const p = r.product;
            const isInfinite = r._isInfinite;
            return `
                <tr>
                    <td>${from + i + 1}</td>
                    <td><a href="#" class="view-stock-link font-mono text-sm" data-sp-id="${r.id}" style="color: #2563eb; font-weight: 600; text-decoration: none;">${p.sku || '-'}</a></td>
                    <td>
                        <div class="product-detail" style="display: flex; align-items: center; gap: 12px;">
                            <img src="${p.photo || 'product_photo.webp'}" alt="${p.name || ''}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-color);">
                            <div class="product-info" style="display: flex; flex-direction: column;">
                                <strong>${p.name || '-'}</strong>
                            </div>
                        </div>
                    </td>
                    <td>${isInfinite ? '<span class="text-muted">—</span>' : `<span style="font-weight: 500; color: var(--success);">${Number(r.qty_in || 0).toFixed(3)}</span>`}</td>
                    <td>${isInfinite ? '<span class="text-muted">—</span>' : `<span style="font-weight: 500; color: var(--danger);">${Number(r.qty_out || 0).toFixed(3)}</span>`}</td>
                    <td>${isInfinite ? `<span class="status" style="background-color: var(--info-bg); color: var(--info);"><i class="fa-solid fa-infinity"></i></span>` : `<span style="font-weight: 600;">${Number(r.qty_bal || 0).toFixed(3)}</span>`}</td>
                    <td>${p.category?.name ? `<span class="status role-fallback">${p.category.name}</span>` : '-'}</td>
                    <td><span class="status ${STATUS_BADGE_CLASS[r._status]}">${STOCK_STATUS_LABELS[r._status]}</span></td>
                </tr>
            `;
        }).join('');
    }

    tbody.querySelectorAll('.view-stock-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            openViewStockModalById(link.getAttribute('data-sp-id'));
        });
    });

    const shownFrom = pageRows.length ? from + 1 : 0;
    const shownTo = from + pageRows.length;
    const info = document.getElementById('stock-pagination-info');
    if (info) info.textContent = `Showing ${shownFrom} to ${shownTo} of ${stockFilteredRows.length} entries`;
}

function renderStockPagination() {
    const list = document.getElementById('stock-pagination-list');
    if (!list) return;

    const totalPages = Math.max(1, Math.ceil(stockFilteredRows.length / STOCK_PAGE_SIZE));

    let html = `<li><button class="page-btn ${stockCurrentPage === 1 ? 'disabled' : ''}" id="stock-page-prev"><i class="fa-solid fa-chevron-left"></i></button></li>`;
    for (let p = 1; p <= totalPages; p++) {
        html += `<li><button class="page-btn ${p === stockCurrentPage ? 'active' : ''}" data-page="${p}">${p}</button></li>`;
    }
    html += `<li><button class="page-btn ${stockCurrentPage === totalPages ? 'disabled' : ''}" id="stock-page-next"><i class="fa-solid fa-chevron-right"></i></button></li>`;
    list.innerHTML = html;

    list.querySelectorAll('.page-btn[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
            stockCurrentPage = parseInt(btn.getAttribute('data-page'), 10);
            renderStockTable();
            renderStockPagination();
        });
    });
    const prevBtn = document.getElementById('stock-page-prev');
    const nextBtn = document.getElementById('stock-page-next');
    if (prevBtn) prevBtn.addEventListener('click', () => {
        if (stockCurrentPage > 1) { stockCurrentPage--; renderStockTable(); renderStockPagination(); }
    });
    if (nextBtn) nextBtn.addEventListener('click', () => {
        if (stockCurrentPage < totalPages) { stockCurrentPage++; renderStockTable(); renderStockPagination(); }
    });
}

// --- View / Edit modal ---
function openViewStockModalById(spId) {
    const row = stockAllRows.find(r => String(r.id) === String(spId));
    if (!row) return;
    populateViewStockModal(row);
    setViewStockModalEditable(false);
    const modal = document.getElementById('view-stock-modal');
    if (modal) modal.classList.add('active');
}

function populateViewStockModal(row) {
    const p = row.product;
    const isInfinite = p.stock_control === 1;

    document.getElementById('view-stock-photo').src = p.photo || 'product_photo.webp';
    document.getElementById('view-stock-name-display').textContent = p.name || '-';
    document.getElementById('view-stock-sku-display').textContent = p.sku || '-';
    document.getElementById('view-stock-bal-display').textContent = isInfinite ? '∞' : Number(row.qty_bal || 0).toFixed(3);

    const badge = document.getElementById('view-stock-status-badge');
    badge.textContent = STOCK_STATUS_LABELS[row._status];
    badge.className = `status ${STATUS_BADGE_CLASS[row._status]}`;

    document.getElementById('view-stock-sku').value = p.sku || '';
    document.getElementById('view-stock-name').value = p.name || '';
    document.getElementById('view-stock-category').value = p.category?.name || '-';
    document.getElementById('view-stock-low-qty').value = Number(p.low_qty || 0).toFixed(3);
    document.getElementById('view-stock-qty-in').value = Number(row.qty_in || 0).toFixed(3);
    document.getElementById('view-stock-qty-out').value = Number(row.qty_out || 0).toFixed(3);
    document.getElementById('view-stock-qty-bal-preview').value = Number(row.qty_bal || 0).toFixed(3);

    // Toggle visibility of qty/threshold fields for infinite-stock products
    ['view-stock-qty-in', 'view-stock-qty-out', 'view-stock-qty-bal-preview', 'view-stock-low-qty'].forEach(id => {
        const group = document.getElementById(id)?.closest('.form-group');
        if (group) group.style.display = isInfinite ? 'none' : 'flex';
    });

    document.getElementById('view-stock-modal').dataset.spId = row.id;

    // Toggle Mark Inactive <-> Reactivate based on current status
    const deleteBtn = document.getElementById('delete-view-stock-btn');
    if (deleteBtn) {
        if (row._status === 'inactive') {
            deleteBtn.innerHTML = '<i class="fa-solid fa-rotate-left"></i> Reactivate';
            deleteBtn.dataset.mode = 'reactivate';
            deleteBtn.style.color = 'var(--success)';
            deleteBtn.style.borderColor = 'var(--success)';
        } else {
            deleteBtn.innerHTML = '<i class="fa-solid fa-ban"></i> Mark Inactive';
            deleteBtn.dataset.mode = 'deactivate';
            deleteBtn.style.color = 'var(--danger)';
            deleteBtn.style.borderColor = 'var(--danger)';
        }
        deleteBtn.style.display = 'inline-flex';
    }
}

function setViewStockModalEditable(editable) {
    const title = document.getElementById('view-stock-modal-title');
    const editBtn = document.getElementById('edit-view-stock-btn');
    const saveBtn = document.getElementById('save-view-stock-btn');

    document.getElementById('view-stock-qty-in').readOnly = !editable;
    document.getElementById('view-stock-qty-out').readOnly = !editable;

    title.textContent = editable ? 'Edit Stock Quantities' : 'View Stock Details';
    editBtn.style.display = editable ? 'none' : 'inline-flex';
    saveBtn.style.display = editable ? 'inline-flex' : 'none';

    if (editable) {
        const qtyInEl = document.getElementById('view-stock-qty-in');
        const qtyOutEl = document.getElementById('view-stock-qty-out');
        const previewBal = () => {
            const bal = (parseFloat(qtyInEl.value) || 0) - (parseFloat(qtyOutEl.value) || 0);
            document.getElementById('view-stock-qty-bal-preview').value = bal.toFixed(3);
        };
        qtyInEl.oninput = previewBal;
        qtyOutEl.oninput = previewBal;
        previewBal();
    }
}

function setupViewStockModal() {
    const modal = document.getElementById('view-stock-modal');
    const closeBtn = document.getElementById('close-view-stock-btn');
    const cancelBtn = document.getElementById('cancel-view-stock-btn');
    const editBtn = document.getElementById('edit-view-stock-btn');
    const saveBtn = document.getElementById('save-view-stock-btn');
    const deleteBtn = document.getElementById('delete-view-stock-btn');

    const close = () => modal && modal.classList.remove('active');

    if (closeBtn) closeBtn.addEventListener('click', close);
    if (cancelBtn) cancelBtn.addEventListener('click', close);
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    if (editBtn) editBtn.addEventListener('click', () => setViewStockModalEditable(true));

    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const spId = modal.dataset.spId;
            const qtyIn = Math.round((parseFloat(document.getElementById('view-stock-qty-in').value) || 0) * 1000) / 1000;
            const qtyOut = Math.round((parseFloat(document.getElementById('view-stock-qty-out').value) || 0) * 1000) / 1000;
            const qtyBal = Math.round((qtyIn - qtyOut) * 1000) / 1000;

            saveBtn.disabled = true;
            const originalHtml = saveBtn.innerHTML;
            saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

            const { error } = await window.supabaseClient
                .from('store_product')
                .update({ qty_in: qtyIn, qty_out: qtyOut, qty_bal: qtyBal })
                .eq('id', spId);

            saveBtn.disabled = false;
            saveBtn.innerHTML = originalHtml;

            if (error) {
                alert('Failed to save stock quantities.');
                return;
            }

            close();
            await fetchAndComputeStock();
            applyStockFiltersAndRender();
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            const mode = deleteBtn.dataset.mode || 'deactivate';
            const confirmModal = document.getElementById('stock-inactive-confirm-modal');
            const titleEl = confirmModal.querySelector('.modal-title');
            const textEl = confirmModal.querySelector('.modal-text');
            const yesBtn = document.getElementById('confirm-inactive-stock-btn');

            if (mode === 'reactivate') {
                titleEl.innerHTML = '<i class="fa-solid fa-rotate-left" style="color: var(--success); margin-right: 8px;"></i> Reactivate Stock';
                textEl.textContent = 'This removes the inactive log for this stock line, making it active again. Continue?';
                yesBtn.textContent = 'YES, REACTIVATE';
                yesBtn.style.backgroundColor = 'var(--success)';
            } else {
                titleEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation" style="color: var(--danger); margin-right: 8px;"></i> Mark Stock Inactive';
                textEl.textContent = 'This marks the stock line as inactive (logged, not deleted — transaction history stays intact). Continue?';
                yesBtn.textContent = 'YES, MARK INACTIVE';
                yesBtn.style.backgroundColor = '';
            }

            confirmModal.dataset.mode = mode;
            confirmModal.classList.add('active');
        });
    }
}

// --- Mark inactive: insert an action log row (type=3 DELETE, table_ref=9 store_product) ---
function setupInactiveModal() {
    const confirmBtn = document.getElementById('confirm-inactive-stock-btn');
    if (!confirmBtn) return;
    confirmBtn.addEventListener('click', async () => {
        const viewModal = document.getElementById('view-stock-modal');
        const confirmModal = document.getElementById('stock-inactive-confirm-modal');
        const spId = viewModal.dataset.spId;
        const mode = confirmModal.dataset.mode || 'deactivate';

        confirmBtn.disabled = true;
        const originalHtml = confirmBtn.innerHTML;
        confirmBtn.innerHTML = mode === 'reactivate'
            ? '<i class="fa-solid fa-spinner fa-spin"></i> Reactivating...'
            : '<i class="fa-solid fa-spinner fa-spin"></i> Marking...';

        let error;
        if (mode === 'reactivate') {
            // Delete every DELETE-type log row for this stock line so no stale
            // entries linger to re-trigger "inactive" status later.
            ({ error } = await window.supabaseClient
                .from('action')
                .delete()
                .eq('type', ACTION_TYPE_DELETE)
                .eq('table_ref', TABLE_REF_STORE_PRODUCT)
                .eq('table_ref_id', spId));
        } else {
            ({ error } = await window.supabaseClient.from('action').insert({
                created_by: stockCurrentContactId,
                type: ACTION_TYPE_DELETE,
                table_ref: TABLE_REF_STORE_PRODUCT,
                table_ref_id: spId
            }));
        }

        confirmBtn.disabled = false;
        confirmBtn.innerHTML = originalHtml;
        confirmBtn.style.backgroundColor = '';
        confirmModal.classList.remove('active');

        if (error) {
            alert(mode === 'reactivate' ? 'Failed to reactivate stock.' : 'Failed to mark stock inactive.');
            return;
        }

        viewModal.classList.remove('active');
        await fetchAndComputeStock();
        applyStockFiltersAndRender();
    });
}

// --- Add Stock modal (attach an existing, not-yet-stocked product to this store) ---
function setupAddStockModal() {
    const modal = document.getElementById('add-stock-modal');
    const openBtn = document.getElementById('open-add-stock-btn');
    const closeBtn = document.getElementById('close-add-stock-btn');
    const cancelBtn = document.getElementById('cancel-add-stock-btn');
    const form = document.getElementById('add-stock-form');
    const productSelect = document.getElementById('stock-product-select');

    const close = () => modal && modal.classList.remove('active');
    const open = async () => {
        if (!modal) return;
        document.getElementById('stock-qty-in').value = 0;
        document.getElementById('stock-qty-out').value = 0;

        const { data: allProducts } = await window.supabaseClient.from('product').select('id, sku, name, stock_control').order('name');
        const stockedIds = new Set(stockAllRows.map(r => r.product.id));
        const available = (allProducts || []).filter(p => !stockedIds.has(p.id));

        productSelect.innerHTML = '<option></option>' + available.map(p => `<option value="${p.id}" data-stock-control="${p.stock_control ?? 0}">${p.name} (${p.sku || 'no SKU'})</option>`).join('');
        if (typeof jQuery !== 'undefined') $(productSelect).val(null).trigger('change');

        toggleAddStockQtyFields(false); // hidden until a product is chosen, or shown as controlled by default

        modal.classList.add('active');
        if (typeof window.initializeSelect2 === 'function') window.initializeSelect2();
    };

    if (typeof jQuery !== 'undefined') {
        $(productSelect).on('change', function() {
            const opt = productSelect.options[productSelect.selectedIndex];
            const isInfinite = opt && opt.getAttribute('data-stock-control') === '1';
            toggleAddStockQtyFields(isInfinite);
        });
    }

    if (openBtn) openBtn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (cancelBtn) cancelBtn.addEventListener('click', close);
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('save-add-stock-btn');
            const originalText = submitBtn.innerHTML;

            const productId = productSelect.value;
            if (!productId) { alert('Please select a product.'); return; }

            const selectedOpt = productSelect.options[productSelect.selectedIndex];
            const isInfinite = selectedOpt && selectedOpt.getAttribute('data-stock-control') === '1';

            const qtyIn = isInfinite ? 0 : Math.round((parseFloat(document.getElementById('stock-qty-in').value) || 0) * 1000) / 1000;
            const qtyOut = isInfinite ? 0 : Math.round((parseFloat(document.getElementById('stock-qty-out').value) || 0) * 1000) / 1000;

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

            const { error } = await window.supabaseClient.from('store_product').insert({
                store: stockActiveStoreId,
                product: productId,
                qty_in: qtyIn,
                qty_out: qtyOut,
                qty_bal: isInfinite ? 0 : Math.round((qtyIn - qtyOut) * 1000) / 1000
            });

            if (error) {
                alert('Failed to add stock.');
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
                await fetchAndComputeStock();
                stockCurrentPage = 1;
                applyStockFiltersAndRender();
            }, 800);
        });
    }
}

function toggleAddStockQtyFields(isInfinite) {
    const qtyInGroup = document.getElementById('stock-qty-in')?.closest('.form-group');
    const qtyOutGroup = document.getElementById('stock-qty-out')?.closest('.form-group');
    if (qtyInGroup) qtyInGroup.style.display = isInfinite ? 'none' : 'flex';
    if (qtyOutGroup) qtyOutGroup.style.display = isInfinite ? 'none' : 'flex';
}

// --- PDF Export ---
function setupStockPdfExport() {
    const btn = document.getElementById('stock-pdf-export-btn');
    if (!btn) return;
    btn.addEventListener('click', generateStockPdf);
}

function buildActiveStockFilterRows() {
    const category = stockCategoriesCache.find(c => String(c.id) === String(stockActiveFilters.category));
    return [
        ['Search Keyword', stockActiveFilters.keyword || 'All'],
        ['Category', stockActiveFilters.category ? (category ? category.name : stockActiveFilters.category) : 'All'],
        ['Status', stockActiveFilters.status ? STOCK_STATUS_LABELS[stockActiveFilters.status] : 'All']
    ];
}

async function generateStockPdf() {
    const btn = document.getElementById('stock-pdf-export-btn');
    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert('PDF library not loaded. Please add jsPDF + jspdf-autotable to index.html.');
        return;
    }

    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    try {
        if (!stockFilteredRows.length) {
            alert('No stock rows match the current filters.');
            return;
        }

        const { data: store } = await window.supabaseClient.from('store').select('name, address, tel, email').eq('id', stockActiveStoreId).maybeSingle();

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
        const marginLeft = 40;
        let y = 44;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(15);
        doc.text(store?.name || 'ADVRetail', marginLeft, y);
        y += 18;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(90);
        if (store?.address) { doc.text(store.address, marginLeft, y); y += 13; }
        const contactLine = [store?.tel, store?.email].filter(Boolean).join('   |   ');
        if (contactLine) { doc.text(contactLine, marginLeft, y); y += 13; }

        y += 8;
        doc.setDrawColor(226, 232, 240);
        doc.line(marginLeft, y, doc.internal.pageSize.getWidth() - marginLeft, y);
        y += 20;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(20);
        doc.text('Stock List', marginLeft, y);
        y += 12;

        const filterRows = buildActiveStockFilterRows();
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

        const tableRows = stockFilteredRows.map(r => [
            r.product.sku || '-',
            r.product.name || '-',
            r.product.category?.name || '-',
            Number(r.qty_in || 0).toFixed(3),
            Number(r.qty_out || 0).toFixed(3),
            Number(r.qty_bal || 0).toFixed(3),
            STOCK_STATUS_LABELS[r._status]
        ]);

        doc.autoTable({
            head: [['SKU', 'Name', 'Category', 'IN', 'OUT', 'BAL', 'Status']],
            body: tableRows,
            startY: filterTableEndY + 16,
            margin: { left: marginLeft, right: marginLeft },
            theme: 'grid',
            styles: { fontSize: 8.5, cellPadding: 6, lineColor: [203, 213, 225], lineWidth: 0.75 },
            headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold', lineColor: [99, 102, 241], lineWidth: 0.75 },
            alternateRowStyles: { fillColor: [248, 250, 252] }
        });

        const dateStamp = new Date().toISOString().slice(0, 10);
        doc.save(`Stock_${dateStamp}.pdf`);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
    }
}