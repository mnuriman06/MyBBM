// pages/transaction.js

const SHOW_SUBMIT_TO_BUKKU = false;

const TRANS_PAGE_SIZE = 100;
const TRANS_STATUS_LABELS = { 1: 'Waiting', 2: 'Shipping', 3: 'Completed' };
const TRANS_STATUS_CLASS = { 1: 'pending', 2: 'manager', 3: 'completed' };
const TRANS_TYPE_BADGE_CLASS = {
    'Purchase': 'customer', 'Sales': 'staff', 'Stock Up': 'admin',
    'Return': 'supplier', 'Stock In': 'admin', 'Stock Out': 'role-fallback'
};

let transTypesCache = [];
let transContactsCache = [];   // store_contact rows (customer/supplier) for the active store
let transAllRows = [];         // all rows matching current filters (unpaginated), with computed totals
let transCurrentPage = 1;
let transActiveFilters = {};
let transActiveStoreId = null;

function render_transaction() {
    return `<div class="dashboard-body">
                <div class="page-header">
                    <h1>Transaction Records</h1>
                    <div class="header-actions-group">
                        <button class="primary-btn" onclick="navigateTo('pos')"><i class="fa-solid fa-plus"></i> Transaction</button>
                    </div>
                </div>

                <div class="stats-grid" id="trans-stats-grid"></div>

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
                        <label class="form-label">Status</label>
                        <select id="search-status" class="select2-search" style="width: 100%;">
                            <option value="">All</option>
                            <option value="1">Waiting</option>
                            <option value="2">Shipping</option>
                            <option value="3">Completed</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Type</label>
                        <select id="search-type" class="select2-search" style="width: 100%;"></select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Contact</label>
                        <select id="search-contact" class="select2-search" style="width: 100%;"></select>
                    </div>
                    <div class="filter-actions" style="display: flex; gap: 12px; flex-shrink: 0;">
                        <button class="primary-btn search-submit-btn" id="trans-filter-btn" title="Search"><i class="fa-solid fa-magnifying-glass"></i></button>
                        <button class="primary-btn pdf-export-btn" id="trans-pdf-export-btn" style="background-color: var(--danger);" title="Export PDF"><i class="fa-solid fa-file-pdf"></i></button>
                        <button class="primary-btn" style="display: ${SHOW_SUBMIT_TO_BUKKU ? 'block' : 'none'};" id="trans-bukku-sync-btn" style="background-color:#0284c7;" title="Submit selected to Bukku" disabled>
                            <i class="fa-solid fa-cloud-arrow-up"></i> Submit to Bukku
                        </button>
                    </div>
                </div>

                <div class="data-card">
                    <div id="table-view-container" class="table-responsive view-container active">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th><input type="checkbox" id="trans-select-all"> #</th>
                                    <th>Trans No</th>
                                    <th>Status</th>
                                    <th>Contact</th>
                                    <th class="text-right">Amount</th>
                                    <th class="text-right">Payment RM</th>
                                    <th class="text-right">Bal RM</th>
                                </tr>
                            </thead>
                            <tbody id="trans-table-body">
                                <tr><td colspan="7" class="text-muted" style="text-align:center; padding: 24px;">Loading transactions...</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="pagination-container">
                        <div class="pagination-info" id="trans-pagination-info">Showing 0 entries</div>
                        <ul class="pagination" id="trans-pagination-list"></ul>
                    </div>
                </div>
            </div>`;
}

window.init_transaction = async function() {
    transActiveStoreId = await window.getActiveStoreId();
    if (!transActiveStoreId) {
        document.getElementById('trans-table-body').innerHTML =
            `<tr><td colspan="7" class="text-muted" style="text-align:center; padding:24px;">You are not assigned to any store.</td></tr>`;
        return;
    }

    const [{ data: types }, { data: contacts }] = await Promise.all([
        window.supabaseClient.from('trans_type').select('id, name, iso, ope_rm, ope_qty').order('id'),
        window.supabaseClient
            .from('store_contact')
            .select('id, contact (id, name), role (name)')
            .eq('store', transActiveStoreId)
    ]);
    transTypesCache = types || [];
    transContactsCache = (contacts || []).filter(c => c.contact &&
        ['customer', 'supplier'].includes((c.role?.name || '').toLowerCase()));

    populateTransSelect('search-type', transTypesCache, 'All');
    populateTransContactSelect('search-contact', 'All');

    // Default date range: current month
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    document.getElementById('date-from').value = toTransDateInput(firstDay);
    document.getElementById('date-to').value = toTransDateInput(lastDay);

    transCurrentPage = 1;
    readTransFiltersFromUI();
    await fetchAndRenderTrans();

    setupTransPdfExport();

    const filterBtn = document.getElementById('trans-filter-btn');
    if (filterBtn) filterBtn.addEventListener('click', () => { transCurrentPage = 1; readTransFiltersFromUI(); fetchAndRenderTrans(); });
    if (typeof jQuery !== 'undefined') {
        $('#search-status, #search-type, #search-contact').on('change', () => { transCurrentPage = 1; readTransFiltersFromUI(); fetchAndRenderTrans(); });

        // Cash Customer is Sales-only: selecting it forces & locks the Type filter.
        const salesType = transTypesCache.find(t => t.name === 'Sales');
        $('#search-contact').on('change', function() {
            const typeSel = $('#search-type');
            if (this.value === 'cash_customer') {
                if (salesType) {
                    typeSel.val(String(salesType.id)).trigger('change.select2');
                }
                typeSel.prop('disabled', true).trigger('change.select2');
            } else {
                typeSel.prop('disabled', false).trigger('change.select2');
            }
        });
    }

    if (typeof window.initializeSelect2 === 'function') window.initializeSelect2();

    function updateBukkuSyncBtnState() {
        const checked = document.querySelectorAll('.trans-row-select:checked');
        document.getElementById('trans-bukku-sync-btn').disabled = checked.length === 0;
    }

    document.getElementById('trans-select-all')?.addEventListener('change', (e) => {
        document.querySelectorAll('.trans-row-select:not(:disabled)').forEach(cb => cb.checked = e.target.checked);
        updateBukkuSyncBtnState();
    });

    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('trans-row-select')) updateBukkuSyncBtnState();
    });

    document.getElementById('trans-bukku-sync-btn')?.addEventListener('click', async () => {
        const btn = document.getElementById('trans-bukku-sync-btn');
        const transIds = Array.from(document.querySelectorAll('.trans-row-select:checked'))
            .map(cb => parseInt(cb.getAttribute('data-trans-id'), 10));
        if (!transIds.length) return;

        const originalHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';

        const { data, error } = await window.supabaseClient.functions.invoke('sync-to-bukku', {
            body: { transIds }
        });

        btn.innerHTML = originalHtml;

        if (error) {
            alert('Failed to submit to Bukku: ' + error.message);
            return;
        }

        const failures = (data?.results || []).filter(r => !r.ok);
        if (failures.length) {
            alert(`${data.results.length - failures.length} succeeded, ${failures.length} failed:\n` +
                failures.map(f => `Trans #${f.transId}: ${f.error}`).join('\n'));
        }

        await fetchAndRenderTrans(); // refresh badges
    });
};

function toTransDateInput(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function populateTransSelect(id, items, allLabel) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = (allLabel ? `<option value="">${allLabel}</option>` : '<option></option>')
        + items.map(i => `<option value="${i.id}">${i.name}</option>`).join('');
}

function populateTransContactSelect(id, allLabel) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = (allLabel ? `<option value="">${allLabel}</option>` : '<option></option>')
        + `<option value="cash_customer">Cash Customer</option>`
        + transContactsCache.map(c => `<option value="${c.id}">${c.contact.name}</option>`).join('');
}

function readTransFiltersFromUI() {
    transActiveFilters = {
        dateFrom: document.getElementById('date-from')?.value || '',
        dateTo: document.getElementById('date-to')?.value || '',
        status: document.getElementById('search-status')?.value || '',
        type: document.getElementById('search-type')?.value || '',
        contact: document.getElementById('search-contact')?.value || ''
    };
}

function isRmBearing(transType) {
    return !!(transType && transType.ope_rm && transType.ope_rm.trim());
}

function computeTransTotals(row) {
    const round2 = n => Math.round((n + Number.EPSILON) * 100) / 100;

    const subtotal = round2((row.trans_product || []).reduce((s, tp) => s + (Number(tp.qty_order) || 0) * (Number(tp.price_final) || 0), 0));
    const shipping = round2((row.trans_ship || []).reduce((s, sh) => s + (Number(sh.amount) || 0), 0));
    const tax = round2((row.trans_tax || []).reduce((s, tx) => s + (Number(tx.amount) || 0), 0));
    const discount = round2(Number(row.rm_discount) || 0);
    const rounding = round2(Number(row.rounding) || 0);
    const amount = round2(subtotal + shipping + tax - discount + rounding);
    const paid = round2((row.trans_payment || []).reduce((s, p) => s + (Number(p.rm_pay) || 0), 0));
    const qty = (row.trans_product || []).reduce((s, tp) => s + (Number(tp.qty_order) || 0), 0);
    return { subtotal, shipping, tax, discount, rounding, amount, paid, balance: round2(amount - paid), qty };
}

function buildTransQuery() {
    let q = window.supabaseClient
        .from('trans')
        .select(`
            id, trans_no, date, rm_discount, rounding, type, status, bukku_invoice_id,
            trans_type (id, name, iso, ope_rm, ope_qty),
            contact_sc:store_contact!trans_contact_fkey (id, contact (id, name, mobile, address)),
            trans_product (qty_order, price_final),
            trans_ship (amount),
            trans_tax (amount),
            trans_payment (rm_pay)
        `)
        .eq('store', transActiveStoreId);

    if (transActiveFilters.dateFrom) q = q.gte('date', transActiveFilters.dateFrom + 'T00:00:00');
    if (transActiveFilters.dateTo) q = q.lte('date', transActiveFilters.dateTo + 'T23:59:59');
    if (transActiveFilters.status) q = q.eq('status', transActiveFilters.status);

    if (transActiveFilters.contact === 'cash_customer') {
        // Cash Customer = Sales transactions with no linked contact.
        const salesType = transTypesCache.find(t => t.name === 'Sales');
        if (salesType) q = q.eq('type', salesType.id);
        q = q.is('contact', null);
    } else {
        if (transActiveFilters.type) q = q.eq('type', transActiveFilters.type);
        if (transActiveFilters.contact) q = q.eq('contact', transActiveFilters.contact);
    }

    return q.order('date', { ascending: false });
}

async function fetchAndRenderTrans() {
    const tbody = document.getElementById('trans-table-body');
    const { data, error } = await buildTransQuery();

    if (error) {
        if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="text-muted" style="text-align:center; padding:24px;">Failed to load transactions.</td></tr>`;
        return;
    }

    transAllRows = (data || []).map(r => ({ ...r, _totals: computeTransTotals(r) }));

    renderTransStatsGrid();
    renderTransTable();
    renderTransPagination();
}

function renderTransStatsGrid() {
    const grid = document.getElementById('trans-stats-grid');
    if (!grid) return;

    const byTypeName = name => transAllRows.filter(r => r.trans_type?.name === name);
    const sumAmount = rows => rows.reduce((s, r) => s + r._totals.amount, 0);

    const salesRows = byTypeName('Sales');
    const totalPayment = salesRows.reduce((s, r) => s + r._totals.paid, 0);
    const totalBalance = salesRows.reduce((s, r) => s + r._totals.balance, 0);

    const totalSales = sumAmount(salesRows);
    const totalPurchase = sumAmount(byTypeName('Purchase'));

    grid.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon" style="background-color: #f1f5f9; color: #64748b;"><i class="fa-solid fa-cart-arrow-down"></i></div>
            <div class="stat-details"><p>TOTAL PURCHASE</p><h3>RM ${totalPurchase.toFixed(2)}</h3></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background-color: var(--info-bg); color: var(--info);"><i class="fa-solid fa-cart-shopping"></i></div>
            <div class="stat-details"><p>TOTAL SALES</p><h3>RM ${totalSales.toFixed(2)}</h3></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background-color: var(--success-bg); color: var(--success);"><i class="fa-solid fa-money-bill-wave"></i></div>
            <div class="stat-details"><p>TOTAL PAYMENT</p><h3>RM ${totalPayment.toFixed(2)}</h3></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background-color: var(--danger-bg); color: var(--danger);"><i class="fa-solid fa-scale-unbalanced"></i></div>
            <div class="stat-details"><p>TOTAL BALANCE</p><h3>RM ${totalBalance.toFixed(2)}</h3></div>
        </div>
    `;
}

function renderTransTable() {
    const tbody = document.getElementById('trans-table-body');
    if (!tbody) return;

    const totalPages = Math.max(1, Math.ceil(transAllRows.length / TRANS_PAGE_SIZE));
    if (transCurrentPage > totalPages) transCurrentPage = totalPages;

    const from = (transCurrentPage - 1) * TRANS_PAGE_SIZE;
    const pageRows = transAllRows.slice(from, from + TRANS_PAGE_SIZE);

    if (!pageRows.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-muted" style="text-align:center; padding:24px;">No transactions found.</td></tr>`;
    } else {
        tbody.innerHTML = pageRows.map((r, i) => {
            const t = r._totals;
            const rmBearing = isRmBearing(r.trans_type);
            const typeName = r.trans_type?.name || '-';
            const badgeClass = TRANS_TYPE_BADGE_CLASS[typeName] || 'role-fallback';
            const dateStr = r.date ? window.formatDateTime(r.date) : '-';
            const contactName = r.contact_sc?.contact?.name || (typeName === 'Sales' ? 'Cash Customer' : (rmBearing ? '-' : 'Internal'));
            const isB2C = !r.contact_sc?.contact; // trans.contact IS NULL
            const isSubmitted = r.bukku_invoice_id; // trans.contact IS NULL
            const isSales = typeName === "Sales";
            let checkboxInput = '';
            let bukkuBadge = '';
            if (!SHOW_SUBMIT_TO_BUKKU) {
                checkboxInput = '';
                bukkuBadge = '';
            } else {
                checkboxInput = isSales && !isB2C && !isSubmitted ? `<input type="checkbox" class="trans-row-select" data-trans-id="${r.id}">` : '';
                bukkuBadge = r.bukku_invoice_id
                    ? `<span class="status completed" style="font-size: 0.5rem; padding: 4px 4px;"><i class="fa-solid fa-check"></i></span>`
                    : !isSales ? ''
                    : (isB2C ? '<span class="status" style="background-color: var(--info-bg); font-size: 0.5rem; padding: 4px 4px;"><i class="fa-solid fa-x"></i></span>'
                    : '<span class="status pending" style="font-size: 0.5rem; padding: 4px 4px;"><i class="fa-solid fa-exclamation"></i></span>');
            }

            return `
                <tr>
                    <td>${checkboxInput} ${from + i + 1}</td>
                    <td>
                        <div style="display: flex; flex-direction: column; gap: 4px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <a href="#" class="view-trans-link font-mono" data-trans-id="${r.id}" style="color: #2563eb; font-weight: 600; text-decoration: none;">${r.trans_no || '-'}</a>
                                <span class="status ${badgeClass}" style="font-size: 0.7em; padding: 2px 6px;">${typeName}</span>
                            </div>
                            <small class="text-muted">${dateStr} ${bukkuBadge}</small>
                        </div>
                    </td>
                    <td><span class="status ${TRANS_STATUS_CLASS[r.status]}">${TRANS_STATUS_LABELS[r.status] || '-'}</span></td>
                    <td>${contactName}</td>
                    <td class="text-right">${rmBearing ? `<span style="font-weight: 500;">RM ${t.amount.toFixed(2)}</span>` : `<span class="text-muted">${t.qty.toFixed(3)} qty</span>`}</td>
                    <td class="text-right">${rmBearing ? `<span style="font-weight: 500; color: var(--success);">RM ${t.paid.toFixed(2)}</span>` : '-'}</td>
                    <td class="text-right">${rmBearing ? `<span style="font-weight: 600; ${t.balance > 0 ? 'color: var(--danger);' : ''}">RM ${t.balance.toFixed(2)}</span>` : '-'}</td>
                </tr>
            `;
        }).join('');
    }

    tbody.querySelectorAll('.view-trans-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.setItem('view_trans_id', link.getAttribute('data-trans-id'));
            navigateTo('transaction-view');
        });
    });

    const shownFrom = pageRows.length ? from + 1 : 0;
    const shownTo = from + pageRows.length;
    const info = document.getElementById('trans-pagination-info');
    if (info) info.textContent = `Showing ${shownFrom} to ${shownTo} of ${transAllRows.length} entries`;
}

function renderTransPagination() {
    const list = document.getElementById('trans-pagination-list');
    if (!list) return;

    const totalPages = Math.max(1, Math.ceil(transAllRows.length / TRANS_PAGE_SIZE));

    let html = `<li><button class="page-btn ${transCurrentPage === 1 ? 'disabled' : ''}" id="trans-page-prev"><i class="fa-solid fa-chevron-left"></i></button></li>`;
    for (let p = 1; p <= totalPages; p++) {
        html += `<li><button class="page-btn ${p === transCurrentPage ? 'active' : ''}" data-page="${p}">${p}</button></li>`;
    }
    html += `<li><button class="page-btn ${transCurrentPage === totalPages ? 'disabled' : ''}" id="trans-page-next"><i class="fa-solid fa-chevron-right"></i></button></li>`;
    list.innerHTML = html;

    list.querySelectorAll('.page-btn[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
            transCurrentPage = parseInt(btn.getAttribute('data-page'), 10);
            renderTransTable();
            renderTransPagination();
        });
    });
    const prevBtn = document.getElementById('trans-page-prev');
    const nextBtn = document.getElementById('trans-page-next');
    if (prevBtn) prevBtn.addEventListener('click', () => { if (transCurrentPage > 1) { transCurrentPage--; renderTransTable(); renderTransPagination(); } });
    if (nextBtn) nextBtn.addEventListener('click', () => { if (transCurrentPage < totalPages) { transCurrentPage++; renderTransTable(); renderTransPagination(); } });
}

// --- PDF Export ---
function setupTransPdfExport() {
    const btn = document.getElementById('trans-pdf-export-btn');
    if (!btn) return;
    btn.addEventListener('click', generateTransPdf);
}

function buildActiveTransFilterRows() {
    const type = transTypesCache.find(t => String(t.id) === String(transActiveFilters.type));
    const contact = transContactsCache.find(c => String(c.id) === String(transActiveFilters.contact));
    const contactLabel = transActiveFilters.contact === 'cash_customer'
        ? 'Cash Customer'
        : (transActiveFilters.contact ? (contact ? contact.contact.name : transActiveFilters.contact) : 'All');
    return [
        ['Date From', transActiveFilters.dateFrom || 'All'],
        ['Date To', transActiveFilters.dateTo || 'All'],
        ['Status', transActiveFilters.status ? TRANS_STATUS_LABELS[transActiveFilters.status] : 'All'],
        ['Type', transActiveFilters.contact === 'cash_customer' ? 'Sales' : (transActiveFilters.type ? (type ? type.name : transActiveFilters.type) : 'All')],
        ['Contact', contactLabel]
    ];
}

async function generateTransPdf() {
    const btn = document.getElementById('trans-pdf-export-btn');
    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert('PDF library not loaded. Please add jsPDF + jspdf-autotable to index.html.');
        return;
    }

    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    try {
        if (!transAllRows.length) {
            alert('No transactions match the current filters.');
            return;
        }

        const { data: store } = await window.supabaseClient.from('store').select('name, address, tel, email').eq('id', transActiveStoreId).maybeSingle();

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
        doc.text('Transaction List', marginLeft, y);
        y += 12;

        const filterRows = buildActiveTransFilterRows();
        doc.autoTable({
            body: filterRows,
            startY: y + 8,
            margin: { left: marginLeft, right: marginLeft },
            theme: 'grid',
            styles: { fontSize: 8.5, cellPadding: 5, lineColor: [203, 213, 225], lineWidth: 0.75 },
            columnStyles: { 0: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 100 }, 1: { textColor: 60 } },
            tableWidth: 320
        });

        const filterTableEndY = doc.lastAutoTable.finalY;

        const tableRows = transAllRows.map(r => {
            const t = r._totals;
            const rmBearing = isRmBearing(r.trans_type);
            return [
                r.trans_no || '-',
                r.trans_type?.name || '-',
                TRANS_STATUS_LABELS[r.status] || '-',
                r.contact_sc?.contact?.name || (r.trans_type?.name === 'Sales' ? 'Cash Customer' : (rmBearing ? '-' : 'Internal')),
                rmBearing ? t.amount.toFixed(2) : `${t.qty.toFixed(3)} qty`,
                rmBearing ? t.paid.toFixed(2) : '-',
                rmBearing ? t.balance.toFixed(2) : '-'
            ];
        });

        doc.autoTable({
            head: [['Trans No', 'Type', 'Status', 'Contact', 'Amount', 'Payment RM', 'Bal RM']],
            body: tableRows,
            startY: filterTableEndY + 16,
            margin: { left: marginLeft, right: marginLeft },
            theme: 'grid',
            styles: { fontSize: 8.5, cellPadding: 6, lineColor: [203, 213, 225], lineWidth: 0.75 },
            headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold', lineColor: [99, 102, 241], lineWidth: 0.75 },
            alternateRowStyles: { fillColor: [248, 250, 252] }
        });

        const dateStamp = new Date().toISOString().slice(0, 10);
        doc.save(`Transactions_${dateStamp}.pdf`);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
    }
}