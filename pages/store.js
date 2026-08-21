const STORE_PAGE_SIZE = 100;

let storeRowsCache = [];       // current page of store rows
let storeCurrentPage = 1;
let storeTotalCount = 0;
let storeActiveFilters = {};

function render_store() {
    return `<div class="dashboard-body">
                <div class="page-header">
                    <h1>Store Management</h1>
                    <div class="header-actions-group">
                        <button class="primary-btn" id="open-add-store-btn"><i class="fa-solid fa-plus"></i> Store</button>
                    </div>
                </div>

                <div class="stats-grid" id="store-stats-grid"></div>

                <div class="filter-bar">
                    <div class="form-group">
                        <label class="form-label">Search</label>
                        <input type="text" id="search-keyword" placeholder=" " class="form-input">
                    </div>
                    <div class="filter-actions" style="display: flex; gap: 12px; flex-shrink: 0; margin-bottom: 8px;">
                        <button class="primary-btn search-submit-btn" id="store-filter-btn" title="Search"><i class="fa-solid fa-magnifying-glass"></i></button>
                        <button class="primary-btn pdf-export-btn" id="store-pdf-export-btn" style="background-color: var(--danger);" title="Export PDF"><i class="fa-solid fa-file-pdf"></i></button>
                    </div>
                </div>

                <div class="data-card">
                    <div id="table-view-container" class="table-responsive view-container active">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Store</th>
                                    <th>Address</th>
                                    <th>Email / Tel</th>
                                    <th>URL</th>
                                </tr>
                            </thead>
                            <tbody id="store-table-body">
                                <tr><td colspan="5" class="text-muted" style="text-align:center; padding: 24px;">Loading stores...</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="pagination-container">
                        <div class="pagination-info" id="store-pagination-info">Showing 0 entries</div>
                        <ul class="pagination" id="store-pagination-list"></ul>
                    </div>
                </div>
            </div>

    <!-- Add Store Modal -->
    <div id="add-store-modal" class="modal-overlay">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Add New Store</h2>
                <button class="close-modal-btn" id="close-add-store-btn"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body">
                <form id="add-store-form" class="modal-form">
                    <div class="form-row">
                        <div class="form-group col-12" style="border: 2px dashed var(--border-color); border-radius: 8px; padding: 24px; text-align: center; color: var(--text-muted); cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100px;">
                            <i class="fa-solid fa-cloud-arrow-up" style="font-size: 1.75rem; margin-bottom: 8px;"></i>
                            <p style="margin: 0;">Drag & Drop Store Logo here or click to browse</p>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group col-12">
                            <label class="form-label">Store Name</label>
                            <input type="text" id="store-name" placeholder=" " class="form-input" required>
                            <small id="store-name-warning" class="text-muted" style="display:none; color: var(--danger); margin-top: 4px;">This store name is already taken.</small>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group col-6">
                            <label class="form-label">Email</label>
                            <input type="email" id="store-email" placeholder=" " class="form-input">
                        </div>
                        <div class="form-group col-6">
                            <label class="form-label">Contact Number</label>
                            <input type="tel" id="store-tel" placeholder=" " class="form-input">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group col-12">
                            <label class="form-label">Store URL</label>
                            <input type="text" id="store-url" placeholder=" " class="form-input">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group col-12">
                            <label class="form-label">Address</label>
                            <textarea id="store-address" placeholder=" " class="form-input" rows="3" style="resize: none;"></textarea>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="action-btn" id="cancel-add-store-btn">Cancel</button>
                <button type="submit" form="add-store-form" class="primary-btn" id="save-add-store-btn">Save Store</button>
            </div>
        </div>
    </div>
    `;
}

window.init_store = async function() {
    await renderStoreStatsGrid();

    storeCurrentPage = 1;
    storeActiveFilters = {};
    await fetchAndRenderStores();

    setupAddStoreModal();
    setupStorePdfExport();

    const filterBtn = document.getElementById('store-filter-btn');
    if (filterBtn) filterBtn.addEventListener('click', () => applyStoreFilters());
    const searchInput = document.getElementById('search-keyword');
    if (searchInput) searchInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') applyStoreFilters(); });

    if (typeof window.initializeSelect2 === 'function') window.initializeSelect2();
};

async function renderStoreStatsGrid() {
    const grid = document.getElementById('store-stats-grid');
    if (!grid) return;

    grid.style.gridTemplateColumns = `repeat(3, 1fr)`;
    grid.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon" style="background-color: #eef2ff; color: var(--primary);"><i class="fa-solid fa-shop"></i></div>
            <div class="stat-details">
                <p>TOTAL STORES</p>
                <h3 id="stat-store-total">-</h3>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background-color: var(--info-bg); color: var(--info);"><i class="fa-solid fa-users"></i></div>
            <div class="stat-details">
                <p>TOTAL STAFF ASSIGNED</p>
                <h3 id="stat-store-staff">-</h3>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background-color: var(--success-bg); color: var(--success);"><i class="fa-solid fa-boxes-stacked"></i></div>
            <div class="stat-details">
                <p>TOTAL PRODUCT LISTINGS</p>
                <h3 id="stat-store-products">-</h3>
            </div>
        </div>
    `;

    const [{ count: storeCount }, { count: staffCount }, { count: productCount }] = await Promise.all([
        window.supabaseClient.from('store').select('id', { count: 'exact', head: true }),
        window.supabaseClient.from('store_contact').select('id', { count: 'exact', head: true }),
        window.supabaseClient.from('store_product').select('id', { count: 'exact', head: true })
    ]);

    const totalEl = document.getElementById('stat-store-total');
    const staffEl = document.getElementById('stat-store-staff');
    const productsEl = document.getElementById('stat-store-products');
    if (totalEl) totalEl.textContent = storeCount ?? 0;
    if (staffEl) staffEl.textContent = staffCount ?? 0;
    if (productsEl) productsEl.textContent = productCount ?? 0;
}

// Not scoped to any single store — this page lists every store in the system.
function buildStoreQuery({ forCount } = {}) {
    let query = window.supabaseClient
        .from('store')
        .select('id, name, url, email, tel, address, logo', { count: forCount ? 'exact' : null });

    if (storeActiveFilters.keyword) {
        const kw = storeActiveFilters.keyword;
        query = query.or(`name.ilike.%${kw}%,email.ilike.%${kw}%,address.ilike.%${kw}%`);
    }

    return query.order('name');
}

async function fetchAndRenderStores() {
    const from = (storeCurrentPage - 1) * STORE_PAGE_SIZE;
    const to = from + STORE_PAGE_SIZE - 1;

    const { data, error, count } = await buildStoreQuery({ forCount: true }).range(from, to);

    if (error) {
        document.getElementById('store-table-body').innerHTML =
            `<tr><td colspan="5" class="text-muted" style="text-align:center; padding:24px;">Failed to load stores.</td></tr>`;
        return;
    }

    const rows = data || [];
    storeRowsCache = rows;
    storeTotalCount = count ?? rows.length;

    renderStoreTable(rows, from);
    renderStorePagination();

    const shownFrom = rows.length ? from + 1 : 0;
    const shownTo = from + rows.length;
    const info = document.getElementById('store-pagination-info');
    if (info) info.textContent = `Showing ${shownFrom} to ${shownTo} of ${storeTotalCount} entries`;
}

function renderStorePagination() {
    const list = document.getElementById('store-pagination-list');
    if (!list) return;

    const totalPages = Math.max(1, Math.ceil(storeTotalCount / STORE_PAGE_SIZE));

    let html = `<li><button class="page-btn ${storeCurrentPage === 1 ? 'disabled' : ''}" id="store-page-prev"><i class="fa-solid fa-chevron-left"></i></button></li>`;
    for (let p = 1; p <= totalPages; p++) {
        html += `<li><button class="page-btn ${p === storeCurrentPage ? 'active' : ''}" data-page="${p}">${p}</button></li>`;
    }
    html += `<li><button class="page-btn ${storeCurrentPage === totalPages ? 'disabled' : ''}" id="store-page-next"><i class="fa-solid fa-chevron-right"></i></button></li>`;
    list.innerHTML = html;

    list.querySelectorAll('.page-btn[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
            storeCurrentPage = parseInt(btn.getAttribute('data-page'), 10);
            fetchAndRenderStores();
        });
    });
    const prevBtn = document.getElementById('store-page-prev');
    const nextBtn = document.getElementById('store-page-next');
    if (prevBtn) prevBtn.addEventListener('click', () => {
        if (storeCurrentPage > 1) { storeCurrentPage--; fetchAndRenderStores(); }
    });
    if (nextBtn) nextBtn.addEventListener('click', () => {
        if (storeCurrentPage < totalPages) { storeCurrentPage++; fetchAndRenderStores(); }
    });
}

function renderStoreTable(rows, offset) {
    const tbody = document.getElementById('store-table-body');
    if (!tbody) return;

    if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-muted" style="text-align:center; padding:24px;">No stores found.</td></tr>`;
        return;
    }

    tbody.innerHTML = rows.map((s, i) => `
        <tr>
            <td>${offset + i + 1}</td>
            <td>
                <div class="person-detail" style="flex-direction: row; align-items: center; gap: 10px;">
                    <img src="${s.logo || 'store_logo.webp'}" alt="${s.name || 'Store'}" style="width: 36px; height: 36px; border-radius: 8px; object-fit: cover; border: 1px solid var(--border-color); flex-shrink: 0;">
                    <a href="#" class="view-store-link" data-store-id="${s.id}" style="color:#2563eb; font-weight:600; text-decoration:none;">${s.name || '-'}</a>
                </div>
            </td>
            <td>
                <div class="person-detail">
                    <span>${s.address || '-'}</span>
                </div>
            </td>
            <td>
                <div class="contact-detail">
                    <span>${s.email || '-'}</span>
                    <span class="text-muted">${s.tel || '-'}</span>
                </div>
            </td>
            <td>
                <span class="text-muted text-sm">${s.url || '-'}</span>
            </td>
        </tr>
    `).join('');

    tbody.querySelectorAll('.view-store-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.setItem('view_store_id', link.getAttribute('data-store-id'));
            navigateTo('store-details');
        });
    });
}

function applyStoreFilters() {
    storeCurrentPage = 1;
    storeActiveFilters = {
        keyword: document.getElementById('search-keyword')?.value.trim() || ''
    };
    fetchAndRenderStores();
}

// --- Uniqueness check (store name) ---
async function isStoreNameTaken(name, excludeId) {
    if (!name) return false;
    let query = window.supabaseClient.from('store').select('id').ilike('name', name);
    if (excludeId) query = query.neq('id', excludeId);
    const { data } = await query.limit(1);
    return !!(data && data.length);
}

function wireStoreNameCheck(inputId, warningId, getExcludeId) {
    const input = document.getElementById(inputId);
    const warning = document.getElementById(warningId);
    if (!input || !warning) return;
    let debounceTimer;
    input.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        warning.style.display = 'none';
        debounceTimer = setTimeout(async () => {
            const value = input.value.trim();
            if (!value) return;
            const taken = await isStoreNameTaken(value, getExcludeId ? getExcludeId() : null);
            warning.style.display = taken ? 'block' : 'none';
        }, 400);
    });
}

// --- Add store modal ---
function setupAddStoreModal() {
    const modal = document.getElementById('add-store-modal');
    const openBtn = document.getElementById('open-add-store-btn');
    const closeBtn = document.getElementById('close-add-store-btn');
    const cancelBtn = document.getElementById('cancel-add-store-btn');
    const form = document.getElementById('add-store-form');
    const nameWarning = document.getElementById('store-name-warning');

    const close = () => modal && modal.classList.remove('active');
    const open = () => {
        if (!modal) return;
        form.querySelectorAll('input, textarea').forEach(el => { el.value = ''; });
        nameWarning.style.display = 'none';
        modal.classList.add('active');
    };

    if (openBtn) openBtn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (cancelBtn) cancelBtn.addEventListener('click', close);
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

    wireStoreNameCheck('store-name', 'store-name-warning', () => null);

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('save-add-store-btn');
            const originalText = submitBtn.innerHTML;

            const name = document.getElementById('store-name').value.trim();
            if (!name) return;

            const nameTaken = await isStoreNameTaken(name, null);
            if (nameTaken) {
                nameWarning.style.display = 'block';
                document.getElementById('store-name').focus();
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

            const payload = {
                name,
                email: document.getElementById('store-email').value.trim(),
                tel: document.getElementById('store-tel').value.trim(),
                url: document.getElementById('store-url').value.trim(),
                address: document.getElementById('store-address').value.trim(),
            };

            const { error } = await window.supabaseClient.from('store').insert(payload);

            if (error) {
                if (error.code === '23505') {
                    nameWarning.style.display = 'block';
                } else {
                    alert('Failed to save store.');
                }
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
                await renderStoreStatsGrid();
                storeCurrentPage = 1;
                await fetchAndRenderStores();
            }, 800);
        });
    }
}

// --- PDF Export ---
// Requires jsPDF + jspdf-autotable, loaded via CDN in index.html.
function setupStorePdfExport() {
    const btn = document.getElementById('store-pdf-export-btn');
    if (!btn) return;
    btn.addEventListener('click', generateStoresPdf);
}

function buildActiveStoreFilterRows() {
    return [
        ['Search Keyword', storeActiveFilters.keyword || 'All']
    ];
}

async function generateStoresPdf() {
    const btn = document.getElementById('store-pdf-export-btn');
    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert('PDF library not loaded. Please add jsPDF + jspdf-autotable to index.html.');
        return;
    }

    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    try {
        const { data: allRows, error } = await buildStoreQuery({ forCount: false });

        if (error) {
            alert('Failed to load stores for export.');
            return;
        }

        const rows = allRows || [];
        if (!rows.length) {
            alert('No stores match the current filters.');
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

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(90);
        y += 8;
        doc.setDrawColor(226, 232, 240);
        doc.line(marginLeft, y, doc.internal.pageSize.getWidth() - marginLeft, y);
        y += 20;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(20);
        doc.text('Store List', marginLeft, y);
        y += 12;

        const filterRows = buildActiveStoreFilterRows();
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

        const tableRows = rows.map(s => [
            s.name || '-',
            s.address || '-',
            s.tel || '-',
            s.email || '-',
            s.url || '-'
        ]);

        doc.autoTable({
            head: [['Name', 'Address', 'Tel', 'Email', 'URL']],
            body: tableRows,
            startY: filterTableEndY + 16,
            margin: { left: marginLeft, right: marginLeft },
            theme: 'grid',
            styles: { fontSize: 8.5, cellPadding: 6, lineColor: [203, 213, 225], lineWidth: 0.75 },
            headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold', lineColor: [99, 102, 241], lineWidth: 0.75 },
            alternateRowStyles: { fillColor: [248, 250, 252] }
        });

        const dateStamp = new Date().toISOString().slice(0, 10);
        doc.save(`Stores_${dateStamp}.pdf`);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
    }
}