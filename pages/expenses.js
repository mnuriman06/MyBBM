// pages/expenses.js

const EXPENSES_PAGE_SIZE = 100;
const STATUS_WAITING = 1;
const STATUS_PAID = 2;
const EXPENSES_STATUS_LABELS = { [STATUS_WAITING]: 'Waiting', [STATUS_PAID]: 'Paid' };
const STATUS_CLASS = { [STATUS_WAITING]: 'pending', [STATUS_PAID]: 'completed' };

let expensesCategoriesCache = [];
let expensesSuppliersCache = [];   // store_contact rows for suppliers of the active store
let expensesRowsCache = [];
let expensesStoreUrlCache = '';
let expensesPayMethodCache = [];
let expensesCurrentPage = 1;
let expensesTotalCount = 0;
let expensesActiveFilters = {};
let expensesActiveStoreId = null;

function render_expenses() {
    return `<div class="dashboard-body">
                <div class="page-header">
                    <h1>Expenses Records</h1>
                    <div class="header-actions-group">
                        <button class="outline-btn" id="open-manage-exp-categories-btn"><i class="fa-solid fa-tags"></i> Categories</button>
                        <button class="primary-btn" id="page-add-expense-btn"><i class="fa-solid fa-plus"></i> Expenses</button>
                    </div>
                </div>

                <div class="stats-grid" id="expenses-stats-grid"></div>

                <div class="filter-bar">
                    <div class="form-group">
                        <label class="form-label" style="top: 10px; font-size: 0.7rem; color: var(--primary); font-weight: 600;">Date From</label>
                        <input type="date" id="date-from" class="form-input">
                    </div>
                    <div class="form-group">
                        <label class="form-label" style="top: 10px; font-size: 0.7rem; color: var(--primary); font-weight: 600;">Date To</label>
                        <input type="date" id="date-to" class="form-input">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Supplier</label>
                        <select id="search-supplier" class="select2-search" style="width: 100%;"></select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Category</label>
                        <select id="search-category" class="select2-search" style="width: 100%;"></select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Status</label>
                        <select id="search-status" class="select2-search" style="width: 100%;">
                            <option value="">All</option>
                            <option value="${STATUS_WAITING}">Waiting</option>
                            <option value="${STATUS_PAID}">Paid</option>
                        </select>
                    </div>
                    <div class="filter-actions" style="display: flex; gap: 12px; flex-shrink: 0;">
                        <button class="primary-btn search-submit-btn" id="expenses-filter-btn" title="Search"><i class="fa-solid fa-magnifying-glass"></i></button>
                        <button class="primary-btn pdf-export-btn" id="expenses-pdf-export-btn" style="background-color: var(--danger);" title="Export PDF"><i class="fa-solid fa-file-pdf"></i></button>
                    </div>
                </div>

                <div class="data-card">
                    <div id="table-view-container" class="table-responsive view-container active">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Ref #</th>
                                    <th>Datetime</th>
                                    <th>Supplier</th>
                                    <th class="text-right">Amount</th>
                                    <th class="text-right">Payment</th>
                                    <th class="text-right">Balance</th>
                                </tr>
                            </thead>
                            <tbody id="expenses-table-body">
                                <tr><td colspan="7" class="text-muted" style="text-align:center; padding: 24px;">Loading expenses...</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="pagination-container">
                        <div class="pagination-info" id="expenses-pagination-info">Showing 0 entries</div>
                        <ul class="pagination" id="expenses-pagination-list"></ul>
                    </div>
                </div>
            </div>

    <!-- View / Edit Expense Modal -->
    <div id="view-expense-modal" class="modal-overlay">
        <div class="modal-content" style="max-width: 1200px;">
            <div class="modal-header">
                <h2 id="view-expense-modal-title">View Expense Details</h2>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <button type="button" class="outline-btn" id="view-expense-print-btn" style="padding: 6px 14px;"><i class="fa-solid fa-print"></i> Print</button>
                    <button class="close-modal-btn" id="close-view-expense-btn"><i class="fa-solid fa-xmark"></i></button>
                </div>
            </div>
            <div class="modal-body" style="padding: 24px;">
                <form id="view-expense-form" class="modal-form">
                    <div class="form-row">
                        <div class="form-group col-6">
                            <label class="form-label">Date</label>
                            <input type="date" id="view-expense-date" class="form-input">
                        </div>
                        <div class="form-group col-6">
                            <label class="form-label">Reference #</label>
                            <input type="text" id="view-expense-ref" class="form-input" readonly disabled>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-6">
                            <label class="form-label">Supplier</label>
                            <select id="view-expense-supplier" class="select2-search" style="width: 100%;"><option></option></select>
                        </div>
                        <div class="form-group col-6">
                            <label class="form-label">Category</label>
                            <select id="view-expense-category" class="select2-search" style="width: 100%;"><option></option></select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-6">
                            <label class="form-label">Amount (RM)</label>
                            <input type="number" id="view-expense-amount" step="0.01" class="form-input">
                        </div>
                        <div class="form-group col-6">
                            <label class="form-label">Status</label>
                            <select id="view-expense-status" class="select2-search" style="width: 100%;">
                                <option value="${STATUS_WAITING}">Waiting</option>
                                <option value="${STATUS_PAID}">Paid</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-12">
                            <label class="form-label">Description / Notes</label>
                            <textarea id="view-expense-note" class="form-input" style="height: 60px; resize: none;"></textarea>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-12">
                            <label class="form-label">Attachments</label>
                            <ul id="view-expense-attachments-list" style="list-style: none; display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px;">
                                <li class="text-muted text-sm">No attachments.</li>
                            </ul>
                            <input type="file" id="view-expense-new-attachments" class="form-input" multiple accept="image/*,.pdf" style="padding: 10px; display: none;">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-12">
                            <label class="form-label" style="margin-bottom: 10px; display: block;">Payments</label>
                            <div id="view-pay-add-row" style="display: none; grid-template-columns: 1.3fr 1.3fr 1fr 1fr 1.3fr auto; gap: 10px; align-items: end; padding: 14px; background: var(--bg-main); border-radius: 8px; border: 1px dashed var(--border-color); margin-bottom: 12px;">
                                <div>
                                    <label class="form-label" style="font-size: 0.75rem; margin-bottom: 4px; display: block;">Method</label>
                                    <select id="view-pay-method" class="select2-search" style="width: 100%;"></select>
                                </div>
                                <div>
                                    <label class="form-label" style="font-size: 0.75rem; margin-bottom: 4px; display: block;">Date</label>
                                    <input type="date" id="view-pay-date" class="form-input" style="height: 38px; padding: 6px 12px; font-size: 0.9rem;">
                                </div>
                                <div>
                                    <label class="form-label" style="font-size: 0.75rem; margin-bottom: 4px; display: block;">RM Pay</label>
                                    <input type="text" id="view-pay-amount" class="form-input" style="height: 38px; padding: 6px 12px; font-size: 0.9rem;" placeholder="0.00">
                                </div>
                                <div>
                                    <label class="form-label" style="font-size: 0.75rem; margin-bottom: 4px; display: block;">Pay Ref</label>
                                    <input type="text" id="view-pay-ref" class="form-input" style="height: 38px; padding: 6px 12px; font-size: 0.9rem;" placeholder="Optional">
                                </div>
                                <div>
                                    <label class="form-label" style="font-size: 0.75rem; margin-bottom: 4px; display: block;">Note</label>
                                    <input type="text" id="view-pay-note" class="form-input" style="height: 38px; padding: 6px 12px; font-size: 0.9rem;" placeholder="Optional">
                                </div>
                                <button type="button" id="view-pay-add-btn" class="primary-btn" style="height: 38px;"><i class="fa-solid fa-plus"></i></button>
                            </div>

                            <table class="invoice-table" style="font-size: 0.85rem;">
                                <thead>
                                    <tr>
                                        <th>Date</th><th>Method</th><th>Pay Ref</th><th>Note</th>
                                        <th class="text-right">Amount (RM)</th><th class="text-right" style="width: 60px;">Action</th>
                                    </tr>
                                </thead>
                                <tbody id="view-pay-tbody">
                                    <tr><td colspan="6" class="text-muted" style="text-align:center; padding:12px;">Loading payments...</td></tr>
                                </tbody>
                            </table>

                            <div style="display: flex; justify-content: flex-end; gap: 24px; margin-top: 10px; padding: 10px 14px; background: var(--bg-main); border-radius: 6px; font-size: 0.9rem;">
                                <span class="text-muted">Amount: <strong id="view-pay-summary-amount" style="color: var(--text-main);">0.00</strong></span>
                                <span class="text-muted">Paid: <strong id="view-pay-summary-paid" style="color: var(--success);">0.00</strong></span>
                                <span class="text-muted">Balance: <strong id="view-pay-summary-balance" style="color: var(--danger);">0.00</strong></span>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer" style="justify-content: space-between;">
                <button type="button" class="action-btn" style="color: var(--danger); border-color: var(--danger);" id="delete-view-expense-btn"><i class="fa-regular fa-trash-can"></i> Delete</button>
                <div style="display: flex; gap: 12px;">
                    <button class="action-btn" id="cancel-view-expense-btn">Close</button>
                    <button type="button" class="primary-btn" id="save-view-expense-btn"><i class="fa-solid fa-floppy-disk"></i> Save</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Manage Expense Categories Modal -->
    <div id="manage-exp-categories-modal" class="modal-overlay">
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h2>Manage Expenses Categories</h2>
                <button class="close-modal-btn" id="close-manage-exp-categories-btn"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body">
                <div class="form-row" style="align-items: flex-end;">
                    <div class="form-group col-6">
                        <label class="form-label">Category Name</label>
                        <input type="text" id="new-exp-category-name" placeholder=" " class="form-input">
                    </div>
                    <div class="form-group col-3">
                        <label class="form-label">ISO Code</label>
                        <input type="text" id="new-exp-category-iso" placeholder=" " class="form-input">
                    </div>
                    <div class="form-group" style="flex: 0 0 auto;">
                        <button class="primary-btn" id="add-exp-category-btn" style="height: 46px; width: 46px; padding: 0; justify-content: center;"><i class="fa-solid fa-plus"></i></button>
                    </div>
                </div>
                <ul id="exp-category-manage-list" style="list-style: none; margin-top: 16px; display: flex; flex-direction: column; gap: 8px;"></ul>
            </div>
            <div class="modal-footer">
                <button class="action-btn" id="close-manage-exp-categories-footer-btn">Close</button>
            </div>
        </div>
    </div>

    <!-- Category Delete Blocked Modal -->
    <div id="exp-category-delete-blocked-modal" class="modal-overlay">
        <div class="modal-content small-modal">
            <div class="modal-title"><i class="fa-solid fa-triangle-exclamation" style="color: var(--danger); margin-right: 8px;"></i> Cannot Delete Category</div>
            <div class="modal-text" id="exp-category-delete-blocked-text">This category cannot be deleted.</div>
            <div class="modal-actions">
                <button class="btn-modal-no" onclick="document.getElementById('exp-category-delete-blocked-modal').classList.remove('active')">OK</button>
            </div>
        </div>
    </div>

    <!-- Category Delete Confirm Modal -->
    <div id="exp-category-delete-confirm-modal" class="modal-overlay">
        <div class="modal-content small-modal">
            <div class="modal-title"><i class="fa-solid fa-triangle-exclamation" style="color: var(--danger); margin-right: 8px;"></i> Delete Category</div>
            <div class="modal-text">Are you sure you want to delete this category? This cannot be undone.</div>
            <div class="modal-actions">
                <button class="btn-modal-yes" id="confirm-delete-exp-category-btn">YES, DELETE</button>
                <button class="btn-modal-no" onclick="document.getElementById('exp-category-delete-confirm-modal').classList.remove('active')">CANCEL</button>
            </div>
        </div>
    </div>

    <!-- Delete Confirm Modal -->
    <div id="expense-delete-confirm-modal" class="modal-overlay">
        <div class="modal-content small-modal">
            <div class="modal-title"><i class="fa-solid fa-triangle-exclamation" style="color: var(--danger); margin-right: 8px;"></i> Delete Expense</div>
            <div class="modal-text">Are you sure you want to delete this expense? This cannot be undone.</div>
            <div class="modal-actions">
                <button class="btn-modal-yes" id="confirm-delete-expense-btn">YES, DELETE</button>
                <button class="btn-modal-no" onclick="document.getElementById('expense-delete-confirm-modal').classList.remove('active')">CANCEL</button>
            </div>
        </div>
    </div>
    `;
}

window.init_expenses = async function() {
    expensesActiveStoreId = await window.getActiveStoreId();
    if (!expensesActiveStoreId) {
        document.getElementById('expenses-table-body').innerHTML =
            `<tr><td colspan="7" class="text-muted" style="text-align:center; padding:24px;">You are not assigned to any store.</td></tr>`;
        return;
    }

    const [{ data: categories }, { data: suppliers }, { data: storeRow }, { data: payMethods }] = await Promise.all([
        window.supabaseClient.from('expenses_category').select('id, name, iso, is_deletable').order('name'),
        window.supabaseClient
            .from('store_contact')
            .select('id, contact (id, name), role!inner (name)')
            .eq('store', expensesActiveStoreId)
            .ilike('role.name', 'supplier'),
        window.supabaseClient.from('store').select('id, url').eq('id', expensesActiveStoreId).maybeSingle(),
        window.supabaseClient.from('pay_method').select('id, name').order('name')
    ]);
    expensesCategoriesCache = categories || [];
    expensesSuppliersCache = (suppliers || []).filter(s => s.contact);
    expensesStoreUrlCache = storeRow?.url || '';
    expensesPayMethodCache = payMethods || [];

    populateExpensesSelect('search-category', visibleExpensesCategories(), 'All');
    populateExpensesSelect('expense-category', visibleExpensesCategories());
    populateExpensesSelect('view-expense-category', visibleExpensesCategories());

    populateExpensesSupplierSelect('search-supplier', 'All');
    populateExpensesSupplierSelect('expense-supplier');
    populateExpensesSupplierSelect('view-expense-supplier');

    // Default date range: current month
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    document.getElementById('date-from').value = toDateInputValue(firstDay);
    document.getElementById('date-to').value = toDateInputValue(lastDay);

    expensesCurrentPage = 1;
    readExpensesFiltersFromUI();
    await fetchAndRenderExpenses();

    const openBtn = document.getElementById('page-add-expense-btn');
    if (openBtn) openBtn.addEventListener('click', () => window.QuickAddExpense.open());
    setupViewExpenseModal();
    setupExpenseDeleteModal();
    setupExpCategoryManageModal();
    setupExpCategoryDeleteModal();
    setupExpensesPdfExport();

    const filterBtn = document.getElementById('expenses-filter-btn');
    if (filterBtn) filterBtn.addEventListener('click', () => { expensesCurrentPage = 1; readExpensesFiltersFromUI(); fetchAndRenderExpenses(); });
    if (typeof jQuery !== 'undefined') {
        $('#search-supplier, #search-category, #search-status').on('change', () => { expensesCurrentPage = 1; readExpensesFiltersFromUI(); fetchAndRenderExpenses(); });
    }

    if (typeof window.initializeSelect2 === 'function') window.initializeSelect2();
};

function toDateInputValue(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

// Category id 1 ("Gaji dan Upah") is reserved for Salary records and must not
// appear in the expenses Category filter or Add/View Expense category fields.
const EXPENSES_HIDDEN_CATEGORY_ID = 1;
function visibleExpensesCategories() {
    return expensesCategoriesCache.filter(c => c.id !== EXPENSES_HIDDEN_CATEGORY_ID);
}

function populateExpensesSelect(id, items, allLabel) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = (allLabel ? `<option value="">${allLabel}</option>` : '<option></option>')
        + items.map(i => `<option value="${i.id}">${i.name}</option>`).join('');
}

function populateExpensesSupplierSelect(id, allLabel) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = (allLabel ? `<option value="">${allLabel}</option>` : '<option></option>')
        + expensesSuppliersCache.map(s => `<option value="${s.id}">${s.contact.name}</option>`).join('');
}

async function renderExpensesStatsGrid() {
    const grid = document.getElementById('expenses-stats-grid');
    if (!grid) return;

    grid.style.gridTemplateColumns = `repeat(4, 1fr)`;
    grid.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon" style="background-color: var(--danger-bg); color: var(--danger);"><i class="fa-solid fa-money-bill-wave"></i></div>
            <div class="stat-details"><p>TOTAL RM</p><h3 id="stat-exp-total">-</h3></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background-color: var(--info-bg); color: var(--info);"><i class="fa-solid fa-file-invoice"></i></div>
            <div class="stat-details"><p>TOTAL BILLS</p><h3 id="stat-exp-count">-</h3></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background-color: var(--warning-bg); color: var(--warning);"><i class="fa-solid fa-clock-rotate-left"></i></div>
            <div class="stat-details"><p>WAITING</p><h3 id="stat-exp-waiting">-</h3></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background-color: var(--success-bg); color: var(--success);"><i class="fa-solid fa-circle-check"></i></div>
            <div class="stat-details"><p>PAID</p><h3 id="stat-exp-paid">-</h3></div>
        </div>
    `;

    // Stats reflect the *current filters* except status (so Waiting/Paid stay meaningful side by side).
    const supplierIds = expensesSuppliersCache.map(s => s.id);
    if (!supplierIds.length) {
        ['stat-exp-total', 'stat-exp-count', 'stat-exp-waiting', 'stat-exp-paid'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = id === 'stat-exp-count' ? '0' : 'RM 0.00';
        });
        return;
    }

    let query = window.supabaseClient.from('expenses').select('amount, status').in('supplier', supplierIds);
    query = applyExpensesDateAndBaseFilters(query, { includeStatus: false });
    const { data } = await query;

    const rows = data || [];
    const total = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const waiting = rows.filter(r => r.status === STATUS_WAITING).reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const paid = rows.filter(r => r.status === STATUS_PAID).reduce((s, r) => s + (Number(r.amount) || 0), 0);

    document.getElementById('stat-exp-total').textContent = `RM ${total.toFixed(2)}`;
    document.getElementById('stat-exp-count').textContent = rows.length;
    document.getElementById('stat-exp-waiting').textContent = `RM ${waiting.toFixed(2)}`;
    document.getElementById('stat-exp-paid').textContent = `RM ${paid.toFixed(2)}`;
}

function readExpensesFiltersFromUI() {
    expensesActiveFilters = {
        dateFrom: document.getElementById('date-from')?.value || '',
        dateTo: document.getElementById('date-to')?.value || '',
        supplier: document.getElementById('search-supplier')?.value || '',
        category: document.getElementById('search-category')?.value || '',
        status: document.getElementById('search-status')?.value || ''
    };
}

// Shared filter application (date range + category + supplier), status applied separately
// so the stats grid can show Waiting/Paid side by side under the same date/category/supplier filters.
function applyExpensesDateAndBaseFilters(query, { includeStatus }) {
    if (expensesActiveFilters.dateFrom) query = query.gte('date', expensesActiveFilters.dateFrom + 'T00:00:00');
    if (expensesActiveFilters.dateTo) query = query.lte('date', expensesActiveFilters.dateTo + 'T23:59:59');
    if (expensesActiveFilters.category) query = query.eq('category', expensesActiveFilters.category);
    if (expensesActiveFilters.supplier) query = query.eq('supplier', expensesActiveFilters.supplier);
    if (includeStatus && expensesActiveFilters.status) query = query.eq('status', expensesActiveFilters.status);
    return query;
}

function buildExpensesQuery({ forCount }) {
    const supplierIds = expensesSuppliersCache.map(s => s.id);
    let query = window.supabaseClient
        .from('expenses')
        .select(`
            id, exp_no, status, amount, note, date,
            category (id, name),
            supplier ( id, contact ( id, name ) ),
            expenses_payment ( rm_pay )
        `, { count: forCount ? 'exact' : null })
        .in('supplier', supplierIds.length ? supplierIds : [-1]);

    query = applyExpensesDateAndBaseFilters(query, { includeStatus: true });
    return query.order('date', { ascending: false });
}

async function fetchAndRenderExpenses() {
    const from = (expensesCurrentPage - 1) * EXPENSES_PAGE_SIZE;
    const to = from + EXPENSES_PAGE_SIZE - 1;

    const { data, error, count } = await buildExpensesQuery({ forCount: true }).range(from, to);

    if (error) {
        document.getElementById('expenses-table-body').innerHTML =
            `<tr><td colspan="7" class="text-muted" style="text-align:center; padding:24px;">Failed to load expenses.</td></tr>`;
        return;
    }

    const rows = (data || []).filter(r => r.supplier);
    expensesRowsCache = rows;
    expensesTotalCount = count ?? rows.length;

    renderExpensesTable(rows, from);
    renderExpensesPagination();
    await renderExpensesStatsGrid();

    const shownFrom = rows.length ? from + 1 : 0;
    const shownTo = from + rows.length;
    const info = document.getElementById('expenses-pagination-info');
    if (info) info.textContent = `Showing ${shownFrom} to ${shownTo} of ${expensesTotalCount} entries`;
}

function renderExpensesPagination() {
    const list = document.getElementById('expenses-pagination-list');
    if (!list) return;

    const totalPages = Math.max(1, Math.ceil(expensesTotalCount / EXPENSES_PAGE_SIZE));

    let html = `<li><button class="page-btn ${expensesCurrentPage === 1 ? 'disabled' : ''}" id="expenses-page-prev"><i class="fa-solid fa-chevron-left"></i></button></li>`;
    for (let p = 1; p <= totalPages; p++) {
        html += `<li><button class="page-btn ${p === expensesCurrentPage ? 'active' : ''}" data-page="${p}">${p}</button></li>`;
    }
    html += `<li><button class="page-btn ${expensesCurrentPage === totalPages ? 'disabled' : ''}" id="expenses-page-next"><i class="fa-solid fa-chevron-right"></i></button></li>`;
    list.innerHTML = html;

    list.querySelectorAll('.page-btn[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
            expensesCurrentPage = parseInt(btn.getAttribute('data-page'), 10);
            fetchAndRenderExpenses();
        });
    });
    const prevBtn = document.getElementById('expenses-page-prev');
    const nextBtn = document.getElementById('expenses-page-next');
    if (prevBtn) prevBtn.addEventListener('click', () => {
        if (expensesCurrentPage > 1) { expensesCurrentPage--; fetchAndRenderExpenses(); }
    });
    if (nextBtn) nextBtn.addEventListener('click', () => {
        if (expensesCurrentPage < totalPages) { expensesCurrentPage++; fetchAndRenderExpenses(); }
    });
}

function formatExpenseDatetime(iso) {
    if (!iso) return '-';
    return window.formatDateTime(iso);
}

function renderExpensesTable(rows, offset) {
    const tbody = document.getElementById('expenses-table-body');
    if (!tbody) return;

    if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-muted" style="text-align:center; padding:24px;">No expenses found.</td></tr>`;
        return;
    }

    tbody.innerHTML = rows.map((r, i) => {
        const paid = (r.expenses_payment || []).reduce((s, p) => s + (Number(p.rm_pay) || 0), 0);
        const amount = Number(r.amount || 0);
        const balance = amount - paid;
        return `
        <tr>
            <td>${offset + i + 1}</td>
            <td>
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <a href="#" class="font-mono view-expense-link" data-exp-id="${r.id}" style="color: #2563eb; font-weight: 600; text-decoration: none;">${r.exp_no || '-'}</a>
                    <div style="display: flex; gap: 6px;">
                        <span class="status ${STATUS_CLASS[r.status]}" style="font-size: 0.7em; padding: 2px 6px;">${EXPENSES_STATUS_LABELS[r.status] || '-'}</span>
                        ${r.category?.name ? `<span class="status role-fallback" style="font-size: 0.7em; padding: 2px 6px;">${r.category.name}</span>` : ''}
                    </div>
                </div>
            </td>
            <td>${formatExpenseDatetime(r.date)}</td>
            <td>${r.supplier?.contact?.name || '-'}</td>
            <td class="text-right" style="font-weight: 500;">RM ${amount.toFixed(2)}</td>
            <td class="text-right" style="font-weight: 500; color: var(--success);">RM ${paid.toFixed(2)}</td>
            <td class="text-right" style="font-weight: 600; ${balance > 0 ? 'color: var(--danger);' : ''}">RM ${balance.toFixed(2)}</td>
        </tr>
    `;
    }).join('');

    tbody.querySelectorAll('.view-expense-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            openViewExpenseModalById(link.getAttribute('data-exp-id'));
        });
    });
}

// --- exp_no generation: EXP-{year}-{next sequence in that year} ---
async function generateExpNo(forDate) {
    const year = new Date(forDate).getFullYear();
    const urlPart = (expensesStoreUrlCache || 'STORE').toString().trim();
    const prefix = `EXP-${urlPart}-${year}-`;

    const { data } = await window.supabaseClient
        .from('expenses')
        .select('exp_no')
        .ilike('exp_no', `${prefix}%`)
        .order('exp_no', { ascending: false })
        .limit(1);

    let nextSeq = 1;
    if (data && data.length && data[0].exp_no) {
        const match = data[0].exp_no.match(/(\d+)$/);
        if (match) nextSeq = parseInt(match[1], 10) + 1;
    }
    return `${prefix}${String(nextSeq).padStart(3, '0')}`;
}

const MEDIA_BUCKET = 'media';
const TABLE_REF_EXPENSES = 3;

// Uploads a FileList to Storage under expenses/{expenseId}/, then inserts matching `media` rows.
// Best-effort: individual file failures are collected and reported, not thrown, so one bad file
// doesn't roll back an otherwise-successful expense save.
async function uploadExpenseAttachments(expenseId, fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return { failures: [] };

    const failures = [];

    for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `expenses/${expenseId}/${Date.now()}-${safeName}`;

        const { error: uploadErr } = await window.supabaseClient.storage
            .from(MEDIA_BUCKET)
            .upload(path, file, { cacheControl: '3600', upsert: false });

        if (uploadErr) {
            failures.push({ name: file.name, error: uploadErr.message });
            continue;
        }

        const { error: mediaErr } = await window.supabaseClient.from('media').insert({
            table_ref: TABLE_REF_EXPENSES,
            table_ref_id: expenseId,
            path,
            file_name: file.name,
            created_by: await window.getCurrentContactId() // <-- was stockCurrentContactId
        });

        if (mediaErr) failures.push({ name: file.name, error: mediaErr.message });
    }

    return { failures };
}

// Deletes both the Storage object and its `media` row. Best-effort on the storage
// side — if the object is already gone (e.g. manually removed from the bucket),
// we still remove the DB row so the UI doesn't keep showing a dead link.
async function deleteExpenseAttachment(mediaId, path) {
    await window.supabaseClient.storage.from(MEDIA_BUCKET).remove([path]);
    const { error } = await window.supabaseClient.from('media').delete().eq('id', mediaId);
    return { error };
}

// --- View / Edit modal ---
function openViewExpenseModalById(expId) {
    const row = expensesRowsCache.find(r => String(r.id) === String(expId));
    if (!row) return;
    populateViewExpenseModal(row);
    renderViewExpenseAttachments(row.id);

    document.getElementById('view-expense-new-attachments').style.display = 'block';
    document.getElementById('view-pay-add-row').style.display = 'grid';

    populateExpensesPayMethodSelect('view-pay-method');
    document.getElementById('view-pay-date').value = toDateInputValue(new Date());
    if (typeof jQuery !== 'undefined') $('#view-pay-method').trigger('change');
    renderViewExpensePayments(row.id, row.amount);

    document.getElementById('view-expense-modal').classList.add('active');
}

function populateViewExpenseModal(row) {
    document.getElementById('view-expense-date').value = row.date ? row.date.slice(0, 10) : '';
    document.getElementById('view-expense-ref').value = row.exp_no || '';
    document.getElementById('view-expense-amount').value = Number(row.amount || 0).toFixed(2);
    document.getElementById('view-expense-note').value = row.note || '';

    const supplierSel = document.getElementById('view-expense-supplier');
    if (supplierSel) {
        supplierSel.disabled = false;
        supplierSel.value = row.supplier?.id || '';
        if (typeof jQuery !== 'undefined') $(supplierSel).prop('disabled', false).trigger('change.select2');
    }
    const categorySel = document.getElementById('view-expense-category');
    if (categorySel) {
        categorySel.disabled = false;
        categorySel.value = row.category?.id || '';
        if (typeof jQuery !== 'undefined') $(categorySel).prop('disabled', false).trigger('change.select2');
    }
    const statusSel = document.getElementById('view-expense-status');
    if (statusSel) {
        statusSel.disabled = false;
        statusSel.value = row.status || STATUS_WAITING;
        if (typeof jQuery !== 'undefined') $(statusSel).prop('disabled', false).trigger('change.select2');
    }

    document.getElementById('view-expense-modal').dataset.expId = row.id;
}

function updateViewPaySummary(amount) {
    const paid = viewExpensePaymentsCache.reduce((s, p) => s + (Number(p.rm_pay) || 0), 0);
    document.getElementById('view-pay-summary-amount').textContent = Number(amount || 0).toFixed(2);
    document.getElementById('view-pay-summary-paid').textContent = paid.toFixed(2);
    document.getElementById('view-pay-summary-balance').textContent = (Number(amount || 0) - paid).toFixed(2);
}

function setupViewExpenseModal() {
    const modal = document.getElementById('view-expense-modal');
    const closeBtn = document.getElementById('close-view-expense-btn');
    const cancelBtn = document.getElementById('cancel-view-expense-btn');
    const saveBtn = document.getElementById('save-view-expense-btn');
    const deleteBtn = document.getElementById('delete-view-expense-btn');
    const amountInput = document.getElementById('view-expense-amount');

    const close = () => modal && modal.classList.remove('active');

    if (closeBtn) closeBtn.addEventListener('click', close);
    if (cancelBtn) cancelBtn.addEventListener('click', close);
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

    if (amountInput) {
        amountInput.addEventListener('input', () => {
            updateViewPaySummary(parseFloat(amountInput.value) || 0);
        });
    }

    wireViewPayForm();

    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const expId = modal.dataset.expId;

            const dateVal = document.getElementById('view-expense-date').value;
            const supplierId = document.getElementById('view-expense-supplier').value;
            if (!dateVal || !supplierId) {
                alert('Date and Supplier are required.');
                return;
            }

            saveBtn.disabled = true;
            const originalHtml = saveBtn.innerHTML;
            saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

            const payload = {
                date: dateVal,
                supplier: supplierId,
                category: document.getElementById('view-expense-category').value || null,
                amount: parseFloat(document.getElementById('view-expense-amount').value) || 0,
                status: parseInt(document.getElementById('view-expense-status').value, 10) || STATUS_WAITING,
                note: document.getElementById('view-expense-note').value.trim(),
            };

            const { error } = await window.supabaseClient.from('expenses').update(payload).eq('id', expId);

            if (error) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = originalHtml;
                alert('Failed to save changes.');
                return;
            }

            // Upload any newly-selected files, then refresh the attachments list
            const newFilesInput = document.getElementById('view-expense-new-attachments');
            const { failures } = await uploadExpenseAttachments(expId, newFilesInput.files);
            newFilesInput.value = '';

            saveBtn.disabled = false;
            saveBtn.innerHTML = originalHtml;

            if (failures.length) {
                alert(`Changes saved, but ${failures.length} attachment(s) failed to upload:\n` +
                    failures.map(f => `- ${f.name}: ${f.error}`).join('\n'));
            }

            close();
            await fetchAndRenderExpenses();
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            close();
            document.getElementById('expense-delete-confirm-modal').dataset.expId = modal.dataset.expId;
            document.getElementById('expense-delete-confirm-modal').classList.add('active');
        });
    }

    const printBtn = document.getElementById('view-expense-print-btn');
    if (printBtn) {
        printBtn.addEventListener('click', async () => {
            const expId = modal.dataset.expId;
            const row = expensesRowsCache.find(r => String(r.id) === String(expId));
            if (!row) return;

            printBtn.disabled = true;
            const originalHtml = printBtn.innerHTML;
            printBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

            const [{ data: company }, { data: store }] = await Promise.all([
                window.supabaseClient.from('company').select('id, name, ssm, tel, email, web, address, state (id, name)').limit(1).maybeSingle(),
                window.supabaseClient.from('store').select('id, name, url, email, tel, address').eq('id', expensesActiveStoreId).maybeSingle()
            ]);

            const payments = await fetchExpensePayments(expId);
            const html = buildExpenseA4Html(row, payments, company, store);

            printBtn.disabled = false;
            printBtn.innerHTML = originalHtml;

            openExpensePrintWindow(html, 'Expense ' + (row.exp_no || ''));
        });
    }
}

function setupExpenseDeleteModal() {
    const confirmBtn = document.getElementById('confirm-delete-expense-btn');
    if (!confirmBtn) return;
    confirmBtn.addEventListener('click', async () => {
        const confirmModal = document.getElementById('expense-delete-confirm-modal');
        const expId = confirmModal.dataset.expId;

        confirmBtn.disabled = true;
        const originalHtml = confirmBtn.innerHTML;
        confirmBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Deleting...';

        const { error } = await window.supabaseClient.from('expenses').delete().eq('id', expId);

        confirmBtn.disabled = false;
        confirmBtn.innerHTML = originalHtml;
        confirmModal.classList.remove('active');

        if (error) {
            alert('Failed to delete expense.');
            return;
        }

        await fetchAndRenderExpenses();
    });
}

async function renderViewExpenseAttachments(expenseId) {
    const list = document.getElementById('view-expense-attachments-list');
    if (!list) return;

    const { data, error } = await window.supabaseClient
        .from('media')
        .select('id, path, file_name, note')
        .eq('table_ref', TABLE_REF_EXPENSES)
        .eq('table_ref_id', expenseId)
        .order('id');

    if (error || !data || !data.length) {
        list.innerHTML = `<li class="text-muted text-sm">No attachments.</li>`;
        return;
    }

    list.innerHTML = data.map(m => {
        const { data: urlData } = window.supabaseClient.storage.from(MEDIA_BUCKET).getPublicUrl(m.path);
        return `
            <li data-media-id="${m.id}" data-media-path="${m.path}" style="display: flex; align-items: center; gap: 8px; padding: 6px 10px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-main);">
                <i class="fa-solid fa-paperclip text-muted"></i>
                <a href="${urlData.publicUrl}" target="_blank" rel="noopener" style="color: #2563eb; text-decoration: none; flex: 1; font-size: 0.9rem;">${m.file_name || m.path.split('/').pop()}</a>
                <button type="button" class="icon-action delete attachment-delete-btn" title="Delete attachment"><i class="fa-solid fa-trash"></i></button>
            </li>
        `;
    }).join('');

    list.querySelectorAll('.attachment-delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const li = btn.closest('li');
            const mediaId = li.getAttribute('data-media-id');
            const path = li.getAttribute('data-media-path');

            if (!confirm('Delete this attachment? This cannot be undone.')) return;

            btn.disabled = true;
            const { error: delErr } = await deleteExpenseAttachment(mediaId, path);
            btn.disabled = false;

            if (delErr) {
                alert('Failed to delete attachment.');
                return;
            }

            li.remove();
            if (!list.children.length) {
                list.innerHTML = `<li class="text-muted text-sm">No attachments.</li>`;
            }
        });
    });
}

// --- Manage Expense Categories modal ---
function setupExpCategoryManageModal() {
    const modal = document.getElementById('manage-exp-categories-modal');
    const openBtn = document.getElementById('open-manage-exp-categories-btn');
    const closeBtn = document.getElementById('close-manage-exp-categories-btn');
    const footerCloseBtn = document.getElementById('close-manage-exp-categories-footer-btn');
    const addBtn = document.getElementById('add-exp-category-btn');
    const newNameInput = document.getElementById('new-exp-category-name');

    const close = () => modal && modal.classList.remove('active');
    const open = async () => {
        if (!modal) return;
        newNameInput.value = '';
        document.getElementById('new-exp-category-iso').value = ''; // add this
        await renderExpCategoryManageList();
        modal.classList.add('active');
    };

    if (openBtn) openBtn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (footerCloseBtn) footerCloseBtn.addEventListener('click', close);
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

    if (addBtn) {
        addBtn.addEventListener('click', async () => {
            const name = newNameInput.value.trim();
            const iso = document.getElementById('new-exp-category-iso').value.trim();
            if (!name) return;

            addBtn.disabled = true;
            const { error } = await window.supabaseClient.from('expenses_category').insert({ name, iso: iso || null });
            addBtn.disabled = false;

            if (error) {
                alert('Failed to add category.');
                return;
            }

            newNameInput.value = '';
            document.getElementById('new-exp-category-iso').value = ''; // add this
            await refreshExpCategoryData();
            await renderExpCategoryManageList();
        });
    }
}

async function refreshExpCategoryData() {
    const { data: categories } = await window.supabaseClient.from('expenses_category').select('id, name, iso, is_deletable').order('name');
    expensesCategoriesCache = categories || [];

    const currentSearchVal = document.getElementById('search-category')?.value || '';
    populateExpensesSelect('search-category', visibleExpensesCategories(), 'All');
    if (document.getElementById('search-category')) document.getElementById('search-category').value = currentSearchVal;

    populateExpensesSelect('expense-category', visibleExpensesCategories());
    populateExpensesSelect('view-expense-category', visibleExpensesCategories());
    if (typeof window.initializeSelect2 === 'function') window.initializeSelect2();

    await fetchAndRenderExpenses();
}

async function renderExpCategoryManageList() {
    const list = document.getElementById('exp-category-manage-list');
    if (!list) return;

    if (!expensesCategoriesCache.length) {
        list.innerHTML = `<li class="text-muted text-sm" style="text-align:center; padding: 16px 0;">No categories yet.</li>`;
        return;
    }

    list.innerHTML = expensesCategoriesCache.map(c => {
        const isDeletable = c.is_deletable !== 0;
        return `
        <li data-category-id="${c.id}" style="display: flex; align-items: center; gap: 8px; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-main);">
            <div class="exp-category-display-wrap" style="flex: 1; display: flex; flex-direction: column;">
                <span class="exp-category-display-name" style="font-weight: 500;">${c.name}${!isDeletable ? ' <span class=\"text-muted text-sm\">(system)</span>' : ''}</span>
                <span class="exp-category-display-iso text-muted text-sm">${c.iso || '-'}</span>
            </div>
            <input type="text" class="form-input exp-category-edit-name" value="${c.name}" placeholder="Name" style="flex: 1; display: none; height: 34px; padding: 0 10px;">
            <input type="text" class="form-input exp-category-edit-iso" value="${c.iso || ''}" placeholder="ISO" style="width: 90px; display: none; height: 34px; padding: 0 10px;">
            <button class="icon-action exp-category-edit-btn" title="Edit"><i class="fa-solid fa-pen"></i></button>
            <button class="icon-action exp-category-save-btn" title="Save" style="display:none;"><i class="fa-solid fa-check"></i></button>
            <button class="icon-action delete exp-category-delete-btn" title="${isDeletable ? 'Delete' : 'This category cannot be deleted'}" ${isDeletable ? '' : 'disabled style="opacity:0.4; cursor:not-allowed;"'}><i class="fa-solid fa-trash"></i></button>
        </li>
    `;
    }).join('');

    list.querySelectorAll('li').forEach(li => {
        const catId = li.getAttribute('data-category-id');
        const cat = expensesCategoriesCache.find(c => String(c.id) === String(catId));
        const displayWrap = li.querySelector('.exp-category-display-wrap');
        const editNameInput = li.querySelector('.exp-category-edit-name');
        const editIsoInput = li.querySelector('.exp-category-edit-iso');
        const editBtn = li.querySelector('.exp-category-edit-btn');
        const saveBtn = li.querySelector('.exp-category-save-btn');
        const deleteBtn = li.querySelector('.exp-category-delete-btn');

        editBtn.addEventListener('click', () => {
            displayWrap.style.display = 'none';
            editNameInput.style.display = 'block';
            editIsoInput.style.display = 'block';
            editBtn.style.display = 'none';
            saveBtn.style.display = 'inline-flex';
            editNameInput.focus();
        });

        saveBtn.addEventListener('click', async () => {
            const newName = editNameInput.value.trim();
            const newIso = editIsoInput.value.trim();
            if (!newName) return;

            saveBtn.disabled = true;
            const { error } = await window.supabaseClient
                .from('expenses_category')
                .update({ name: newName, iso: newIso || null })
                .eq('id', catId);
            saveBtn.disabled = false;

            if (error) {
                alert('Failed to update category.');
                return;
            }

            await refreshExpCategoryData();
            await renderExpCategoryManageList();
        });

        if (deleteBtn && !deleteBtn.disabled) {
            deleteBtn.addEventListener('click', () => requestDeleteExpCategory(catId, cat));
        }
    });
}

// --- Category delete: is_deletable check, then dependency check, then confirm, then delete ---
let pendingDeleteExpCategoryId = null;

async function requestDeleteExpCategory(categoryId, cat) {
    if (cat && cat.is_deletable === 0) {
        document.getElementById('exp-category-delete-blocked-text').textContent =
            `This category is marked as non-deletable and cannot be removed.`;
        document.getElementById('exp-category-delete-blocked-modal').classList.add('active');
        return;
    }

    pendingDeleteExpCategoryId = categoryId;

    const { count } = await window.supabaseClient
        .from('expenses')
        .select('id', { count: 'exact', head: true })
        .eq('category', categoryId);

    if (count > 0) {
        document.getElementById('exp-category-delete-blocked-text').textContent =
            `This category cannot be deleted because ${count} expense(s) still use it. Please reassign those expenses first.`;
        document.getElementById('exp-category-delete-blocked-modal').classList.add('active');
        return;
    }

    document.getElementById('exp-category-delete-confirm-modal').classList.add('active');
}

function setupExpCategoryDeleteModal() {
    const confirmBtn = document.getElementById('confirm-delete-exp-category-btn');
    if (!confirmBtn) return;
    confirmBtn.addEventListener('click', async () => {
        const modal = document.getElementById('exp-category-delete-confirm-modal');
        confirmBtn.disabled = true;
        const originalHtml = confirmBtn.innerHTML;
        confirmBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Deleting...';

        const { error } = await window.supabaseClient.from('expenses_category').delete().eq('id', pendingDeleteExpCategoryId);

        confirmBtn.disabled = false;
        confirmBtn.innerHTML = originalHtml;
        modal.classList.remove('active');

        if (error) {
            alert('Failed to delete category.');
            return;
        }

        await refreshExpCategoryData();
        await renderExpCategoryManageList();
    });
}

async function resolveExpensesTellerScId() {
    const contactId = await window.getCurrentContactId();
    const { data } = await window.supabaseClient
        .from('store_contact')
        .select('id')
        .eq('store', expensesActiveStoreId)
        .eq('contact', contactId)
        .maybeSingle();
    return data?.id || null;
}

function populateExpensesPayMethodSelect(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = expensesPayMethodCache.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
}

async function fetchExpensePayments(expenseId) {
    const { data, error } = await window.supabaseClient
        .from('expenses_payment')
        .select('id, ref_no, pay_ref, date, rm_pay, note, pay_method (id, name)')
        .eq('expenses', expenseId)
        .order('date', { ascending: false });
    return error ? [] : (data || []);
}

let viewExpensePaymentsCache = [];

async function renderViewExpensePayments(expenseId, amount) {
    viewExpensePaymentsCache = await fetchExpensePayments(expenseId);
    const tbody = document.getElementById('view-pay-tbody');
    if (!tbody) return;

    if (!viewExpensePaymentsCache.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-muted" style="text-align:center; padding:12px;">No payments recorded.</td></tr>`;
    } else {
        tbody.innerHTML = viewExpensePaymentsCache.map(p => `
            <tr data-pay-id="${p.id}">
                <td>${p.date ? window.formatDateOnly(p.date) : '-'}</td>
                <td>${p.pay_method?.name || '-'}</td>
                <td>${p.pay_ref || '-'}</td>
                <td>${p.note || '-'}</td>
                <td class="text-right" style="font-weight:600; color: var(--success);">${Number(p.rm_pay || 0).toFixed(2)}</td>
                <td class="text-right"><button type="button" class="icon-action delete view-pay-remove-btn"><i class="fa-solid fa-trash"></i></button></td>
            </tr>
        `).join('');
    }

    tbody.querySelectorAll('.view-pay-remove-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const payId = btn.closest('tr').getAttribute('data-pay-id');
            if (!confirm('Delete this payment? This cannot be undone.')) return;
            const { error } = await window.supabaseClient.from('expenses_payment').delete().eq('id', payId);
            if (error) { alert('Failed to delete payment.'); return; }
            await renderViewExpensePayments(expenseId, amount);
        });
    });

    updateViewPaySummary(amount);
}

function wireViewPayForm() {
    const addBtn = document.getElementById('view-pay-add-btn');
    if (!addBtn) return;

    addBtn.addEventListener('click', async () => {
        const modal = document.getElementById('view-expense-modal');
        const expId = modal.dataset.expId;
        const methodId = document.getElementById('view-pay-method').value;
        const dateVal = document.getElementById('view-pay-date').value;
        const amount = parseFloat(document.getElementById('view-pay-amount').value);
        const ref = document.getElementById('view-pay-ref').value.trim();
        const note = document.getElementById('view-pay-note').value.trim();

        if (isNaN(amount) || amount <= 0) { alert('Please enter a valid payment amount.'); return; }

        const expenseAmount = parseFloat(document.getElementById('view-expense-amount').value) || 0;
        const alreadyPaid = viewExpensePaymentsCache.reduce((s, p) => s + (Number(p.rm_pay) || 0), 0);
        const balance = expenseAmount - alreadyPaid;

        if (amount > balance + 0.001) {
            alert(`Amount cannot exceed the outstanding balance of RM ${Math.max(0, balance).toFixed(2)}.`);
            return;
        }

        addBtn.disabled = true;
        const tellerScId = await resolveExpensesTellerScId();

        const { error } = await window.supabaseClient.from('expenses_payment').insert({
            expenses: expId,
            pay_method: methodId || null,
            date: dateVal || toDateInputValue(new Date()),
            rm_pay: amount,
            pay_ref: ref || null,
            note: note || null,
            teller: tellerScId
        });

        addBtn.disabled = false;

        if (error) { alert('Failed to record payment.'); return; }

        document.getElementById('view-pay-amount').value = '';
        document.getElementById('view-pay-ref').value = '';
        document.getElementById('view-pay-note').value = '';

        await renderViewExpensePayments(expId, expenseAmount);
    });
}

function expEscape(str) {
    return (str || '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function expFormatDMY(dateStr) {
    const d = dateStr ? new Date(dateStr) : new Date();
    if (isNaN(d.getTime())) return '-';
    const pad = n => String(n).padStart(2, '0');
    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
}

function openExpensePrintWindow(html, title) {
    const printWindow = window.open('', '_blank', 'width=850,height=1000');
    if (!printWindow) {
        alert('Please allow pop-ups to print.');
        return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.document.title = title;

    const doPrint = () => {
        printWindow.focus();
        printWindow.print();
    };
    if (printWindow.document.readyState === 'complete') {
        setTimeout(doPrint, 200);
    } else {
        printWindow.onload = () => setTimeout(doPrint, 200);
    }
}

function buildExpenseA4Html(row, payments, company, store) {
    const amount = Number(row.amount || 0);
    const paid = payments.reduce((s, p) => s + (Number(p.rm_pay) || 0), 0);
    const balance = amount - paid;

    const paymentRows = payments.map(p => `
        <tr>
            <td>${expFormatDMY(p.date)}</td>
            <td>${expEscape((p.pay_method?.name || '-').toUpperCase())}</td>
            <td>${expEscape(p.pay_ref || '-')}</td>
            <td class="text-right">${Number(p.rm_pay || 0).toFixed(2)}</td>
        </tr>
    `).join('');

    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Expense</title>
<style>
    @page { size: A4; margin: 15mm; }
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #111; }
    .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
    .header h1 { font-size: 18px; margin: 0 0 4px 0; }
    .header p { margin: 2px 0; color: #333; font-size: 12px; }
    .type-label { text-align: right; font-size: 20px; font-weight: 700; letter-spacing: 1px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 20px 0; }
    .info-grid .box-title { font-weight: 700; font-size: 11px; text-transform: uppercase; color: #666; margin-bottom: 6px; }
    table.trans-details { width: 100%; border-collapse: collapse; margin: 10px 0 20px 0; }
    table.trans-details th, table.trans-details td { border: 1px solid #ccc; padding: 5px 8px; text-align: left; font-size: 12px; }
    table.trans-details th { background: #f5f5f5; font-size: 11px; text-transform: uppercase; }
    .totals-box { width: 280px; margin-left: auto; margin-top: 10px; }
    .totals-box .row { display: flex; justify-content: space-between; padding: 4px 8px; }
    .totals-box .grand { border-top: 2px solid #111; font-weight: 700; font-size: 15px; }
    .payment-section { margin-top: 30px; }
    .payment-section h3 { font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #ddd; padding-bottom: 6px; }
    table.payments { width: 100%; border-collapse: collapse; margin-top: 8px; }
    table.payments th, table.payments td { border-bottom: 1px solid #eee; padding: 6px 8px; text-align: left; font-size: 12px; }
    table.payments th { background: #f5f5f5; text-transform: uppercase; }
    table.payments tfoot td { font-weight: 700; background: #f9f9f9; border-top: 1px solid #ddd; }
    table.payments td.text-right, table.payments th.text-right { text-align: right; }
    .signoff { margin-top: 30px; font-size: 12px; color: #444; }
    .signoff .print-date { border-top: 1px dashed #999; padding-top: 10px; }
</style>
</head>
<body>
    <div class="header">
        <div>
            <h1>${expEscape(company?.name || 'COMPANY NAME')}</h1>
            ${company?.ssm ? `<p>[ ${expEscape(company.ssm)} ]</p>` : ''}
            <p>${expEscape(company?.address || '').replace(/\n/g, '<br>')}</p>
            <p>${[company?.tel, company?.email].filter(Boolean).map(expEscape).join(' | ')}</p>
        </div>
        <div class="type-label">EXPENSE</div>
    </div>

    <div class="info-grid">
        <div class="box">
            <div class="box-title">Supplier</div>
            <p><strong>${expEscape(row.supplier?.contact?.name || '-')}</strong></p>
        </div>
        <div class="box">
            <div class="box-title">Store</div>
            <p><strong>${expEscape((store?.name || '').toUpperCase())}</strong></p>
            <p>${expEscape(store?.address || '').replace(/\n/g, '<br>')}</p>
        </div>
    </div>

    <table class="trans-details">
        <thead>
            <tr><th>Ref #</th><th>Date</th><th>Status</th><th>Category</th></tr>
        </thead>
        <tbody>
            <tr>
                <td>${expEscape(row.exp_no || '')}</td>
                <td>${expFormatDMY(row.date)}</td>
                <td>${expEscape((EXPENSES_STATUS_LABELS[row.status] || '').toUpperCase())}</td>
                <td>${expEscape(row.category?.name || '-')}</td>
            </tr>
        </tbody>
    </table>

    ${row.note ? `<p><strong>Note:</strong> ${expEscape(row.note)}</p>` : ''}

    <div class="totals-box">
        <div class="row grand"><span>Amount [RM]</span><span>${amount.toFixed(2)}</span></div>
    </div>

    <div class="payment-section">
        <h3>Payment Information</h3>
        <table class="payments">
            <thead><tr><th>Date</th><th>Method</th><th>Ref</th><th class="text-right">RM</th></tr></thead>
            <tbody>${paymentRows || '<tr><td colspan="4">No payments recorded.</td></tr>'}</tbody>
            <tfoot>
                <tr><td colspan="3" class="text-right">Total Payment [RM]</td><td class="text-right">${paid.toFixed(2)}</td></tr>
                <tr><td colspan="3" class="text-right">Balance [RM]</td><td class="text-right">${Math.max(0, balance).toFixed(2)}</td></tr>
            </tfoot>
        </table>
    </div>

    <div class="signoff">
        <div class="print-date">Print Date : ${expFormatDMY(new Date())}</div>
    </div>
</body></html>`;
}

// --- PDF Export ---
function setupExpensesPdfExport() {
    const btn = document.getElementById('expenses-pdf-export-btn');
    if (!btn) return;
    btn.addEventListener('click', generateExpensesPdf);
}

function buildActiveExpensesFilterRows() {
    const supplier = expensesSuppliersCache.find(s => String(s.id) === String(expensesActiveFilters.supplier));
    const category = expensesCategoriesCache.find(c => String(c.id) === String(expensesActiveFilters.category));
    return [
        ['Date From', expensesActiveFilters.dateFrom || 'All'],
        ['Date To', expensesActiveFilters.dateTo || 'All'],
        ['Supplier', expensesActiveFilters.supplier ? (supplier ? supplier.contact.name : expensesActiveFilters.supplier) : 'All'],
        ['Category', expensesActiveFilters.category ? (category ? category.name : expensesActiveFilters.category) : 'All'],
        ['Status', expensesActiveFilters.status ? EXPENSES_STATUS_LABELS[expensesActiveFilters.status] : 'All']
    ];
}

async function generateExpensesPdf() {
    const btn = document.getElementById('expenses-pdf-export-btn');
    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert('PDF library not loaded. Please add jsPDF + jspdf-autotable to index.html.');
        return;
    }

    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    try {
        const { data: allRows, error } = await buildExpensesQuery({ forCount: false });

        if (error) {
            alert('Failed to load expenses for export.');
            return;
        }

        const rows = (allRows || []).filter(r => r.supplier);
        if (!rows.length) {
            alert('No expenses match the current filters.');
            return;
        }

        const { data: store } = await window.supabaseClient.from('store').select('name, address, tel, email').eq('id', expensesActiveStoreId).maybeSingle();

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
        doc.text('Expenses List', marginLeft, y);
        y += 12;

        const filterRows = buildActiveExpensesFilterRows();
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

        const tableRows = rows.map(r => {
            const paid = (r.expenses_payment || []).reduce((s, p) => s + (Number(p.rm_pay) || 0), 0);
            const amount = Number(r.amount || 0);
            const balance = amount - paid;
            return [
                r.exp_no || '-',
                formatExpenseDatetime(r.date),
                r.supplier?.contact?.name || '-',
                r.category?.name || '-',
                EXPENSES_STATUS_LABELS[r.status] || '-',
                amount.toFixed(2),
                paid.toFixed(2),
                balance.toFixed(2)
            ];
        });

        doc.autoTable({
            head: [['Ref #', 'Date', 'Supplier', 'Category', 'Status', 'Amount (RM)', 'Payment (RM)', 'Balance (RM)']],
            body: tableRows,
            startY: filterTableEndY + 16,
            margin: { left: marginLeft, right: marginLeft },
            theme: 'grid',
            styles: { fontSize: 8.5, cellPadding: 6, lineColor: [203, 213, 225], lineWidth: 0.75 },
            headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold', lineColor: [99, 102, 241], lineWidth: 0.75 },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            columnStyles: {
                5: { halign: 'right' },
                6: { halign: 'right' },
                7: { halign: 'right' }
            },
            didParseCell: (data) => {
                if ([5, 6, 7].includes(data.column.index)) {
                    data.cell.styles.halign = 'right';
                }
            }
        });

        const dateStamp = new Date().toISOString().slice(0, 10);
        doc.save(`Expenses_${dateStamp}.pdf`);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
    }
}