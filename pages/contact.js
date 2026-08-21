// pages/contact.js

const CONTACT_PAGE_SIZE = 100;

let contactRolesCache = [];
let contactStatesCache = [];
let contactRowsCache = [];       // current page of store_contact rows (with joined contact/role/state)
let contactCurrentPage = 1;
let contactTotalCount = 0;
let contactActiveFilters = {};
let contactActiveStoreId = null;
let contactEditingId = null;     // contact.id currently open in edit mode, or null

// Roles hidden from the summary stat cards (still fully usable everywhere else,
// e.g. filters, add/edit forms). Case-insensitive match on role name.
const STATS_HIDDEN_ROLES = ['admin', 'manager', 'cashier'];

// Known CSS classes already defined in styles.css for .status
const KNOWN_ROLE_CLASSES = ['admin', 'manager', 'staff', 'customer', 'supplier'];
function roleClass(name) {
    const key = (name || '').toLowerCase();
    return KNOWN_ROLE_CLASSES.includes(key) ? key : 'role-fallback';
}

function render_contact() {
    return `<div class="dashboard-body">
                <div class="page-header">
                    <h1>Contact Management</h1>
                    <div class="header-actions-group">
                        <button class="primary-btn" id="open-add-person-btn"><i class="fa-solid fa-plus"></i> Contact</button>
                    </div>
                </div>

                <div class="stats-grid" id="contact-stats-grid"></div>

                <div class="filter-bar">
                    <div class="form-group">
                        <label class="form-label">Search</label>
                        <input type="text" id="search-keyword" placeholder=" " class="form-input">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Role</label>
                        <select id="search-role" class="select2-search" style="width: 100%;">
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">State</label>
                        <select id="search-state" class="select2-search" style="width: 100%;">
                        </select>
                    </div>
                    <div class="filter-actions" style="display: flex; gap: 12px; flex-shrink: 0; margin-bottom: 8px;">
                        <button class="primary-btn search-submit-btn" id="contact-filter-btn" title="Search"><i class="fa-solid fa-magnifying-glass"></i></button>
                        <button class="primary-btn pdf-export-btn" id="contact-pdf-export-btn" style="background-color: var(--danger);" title="Export PDF"><i class="fa-solid fa-file-pdf"></i></button>
                    </div>
                </div>

                <div class="data-card">
                    <div id="table-view-container" class="table-responsive view-container active">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Name</th>
                                    <th>Address</th>
                                    <th>Email / Tel</th>
                                </tr>
                            </thead>
                            <tbody id="contact-table-body">
                                <tr><td colspan="4" class="text-muted" style="text-align:center; padding: 24px;">Loading contacts...</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="pagination-container">
                        <div class="pagination-info" id="contact-pagination-info">Showing 0 entries</div>
                        <ul class="pagination" id="contact-pagination-list"></ul>
                    </div>
                </div>
            </div>

    <!-- View / Edit Contact Modal -->
    <div id="view-person-modal" class="modal-overlay">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="view-person-modal-title">View Contact Details</h2>
                <button class="close-modal-btn" id="close-view-person-btn"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body">
                <form id="view-person-form" class="modal-form">
                    <div class="form-row">
                        <div class="form-group col-12">
                            <label class="form-label">Full Name</label>
                            <input type="text" id="view-person-name" class="form-input" readonly>
                            <small id="view-person-name-warning" class="text-muted" style="display:none; color: var(--danger); margin-top: 4px;">This name is already taken.</small>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-4">
                            <label class="form-label">Role</label>
                            <select id="view-person-role" class="select2-search" data-placeholder="Role" style="width: 100%;" disabled>
                                <option></option>
                            </select>
                        </div>
                        <div class="form-group col-4">
                            <label class="form-label">Email</label>
                            <input type="email" id="view-person-email" class="form-input" readonly>
                            <small id="view-person-email-warning" class="text-muted" style="display:none; color: var(--danger); margin-top: 4px;">This email is already taken.</small>
                        </div>
                        <div class="form-group col-4">
                            <label class="form-label">Mobile</label>
                            <input type="tel" id="view-person-mobile" class="form-input" readonly>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-12">
                            <textarea id="view-person-address" class="form-input" rows="3" readonly style="resize: none;"></textarea>
                            <label class="form-label">Address</label>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-4">
                            <label class="form-label">Postcode</label>
                            <input type="text" id="view-person-postcode" class="form-input" readonly>
                        </div>
                        <div class="form-group col-8">
                            <label class="form-label">State</label>
                            <select id="view-person-state" class="select2-search" data-placeholder="State" style="width: 100%;" disabled>
                                <option></option>
                            </select>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer" style="justify-content: space-between;">
                <button type="button" class="action-btn" style="color: var(--danger); border-color: var(--danger);" id="delete-view-person-btn"><i class="fa-solid fa-trash"></i> Delete</button>
                <div style="display: flex; gap: 12px;">
                    <button class="action-btn" id="cancel-view-person-btn">Close</button>
                    <button type="button" class="primary-btn" id="edit-view-person-btn"><i class="fa-solid fa-pen"></i> Edit</button>
                    <button type="button" class="primary-btn" id="save-view-person-btn" style="display:none;"><i class="fa-solid fa-floppy-disk"></i> Save</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Delete Blocked Modal -->
    <div id="delete-blocked-modal" class="modal-overlay">
        <div class="modal-content small-modal">
            <div class="modal-title"><i class="fa-solid fa-triangle-exclamation" style="color: var(--danger); margin-right: 8px;"></i> Cannot Delete Contact</div>
            <div class="modal-text" id="delete-blocked-text">This contact has related records and cannot be deleted.</div>
            <div class="modal-actions">
                <button class="btn-modal-no" onclick="document.getElementById('delete-blocked-modal').classList.remove('active')">OK</button>
            </div>
        </div>
    </div>

    <!-- Delete Confirm Modal -->
    <div id="delete-confirm-modal" class="modal-overlay">
        <div class="modal-content small-modal">
            <div class="modal-title"><i class="fa-solid fa-triangle-exclamation" style="color: var(--danger); margin-right: 8px;"></i> Delete Contact</div>
            <div class="modal-text">Are you sure you want to delete this contact? This cannot be undone.</div>
            <div class="modal-actions">
                <button class="btn-modal-yes" id="confirm-delete-contact-btn">YES, DELETE</button>
                <button class="btn-modal-no" onclick="document.getElementById('delete-confirm-modal').classList.remove('active')">CANCEL</button>
            </div>
        </div>
    </div>
    `;
}

window.init_contact = async function() {
    contactActiveStoreId = await window.getActiveStoreId();
    if (!contactActiveStoreId) {
        document.getElementById('contact-table-body').innerHTML =
            `<tr><td colspan="4" class="text-muted" style="text-align:center; padding:24px;">You are not assigned to any store.</td></tr>`;
        return;
    }

    const [{ data: roles }, { data: states }] = await Promise.all([
        window.supabaseClient.from('role').select('id, name').order('name'),
        window.supabaseClient.from('state').select('id, name').order('name')
    ]);
    contactRolesCache = roles || [];
    contactStatesCache = states || [];

    // Filter selects: "All" is a real, selectable, default-selected option — not a
    // Select2 placeholder (placeholders are swallowed and never shown in the list).
    populateSelect('search-role', contactRolesCache, 'All');
    populateSelect('search-state', contactStatesCache, 'All');

    // Add/Edit form selects: required fields, so these keep the placeholder style.
    populateSelect('person-role', contactRolesCache);
    populateSelect('person-state', contactStatesCache);
    populateSelect('view-person-role', contactRolesCache);
    populateSelect('view-person-state', contactStatesCache);

    await renderContactStatsGrid(contactRolesCache);

    contactCurrentPage = 1;
    contactActiveFilters = {};
    await fetchAndRenderContacts();

    const openBtn = document.getElementById('open-add-person-btn');
    if (openBtn) openBtn.addEventListener('click', () => window.QuickAddContact.open());
    setupViewContactModal();
    setupDeleteModals();
    setupContactPdfExport();

    const filterBtn = document.getElementById('contact-filter-btn');
    if (filterBtn) filterBtn.addEventListener('click', () => applyContactFilters());
    const searchInput = document.getElementById('search-keyword');
    if (searchInput) searchInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') applyContactFilters(); });
    if (typeof jQuery !== 'undefined') {
        // "All" (value="") selects with no data-placeholder render their first
        // option normally, so plain change binding is enough here.
        $('#search-role, #search-state').on('change', () => applyContactFilters());
    }

    if (typeof window.initializeSelect2 === 'function') window.initializeSelect2();

    window.contactRolesCache = contactRolesCache; // expose for shared-modals.js refresh callback
};

function populateSelect(id, items, allLabel) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = (allLabel ? `<option value="">${allLabel}</option>` : '<option></option>')
        + items.map(i => `<option value="${i.id}">${i.name}</option>`).join('');
}

async function renderContactStatsGrid(roles) {
    const grid = document.getElementById('contact-stats-grid');
    if (!grid) return;

    // Admin / Manager / Cashier are internal staff roles and are intentionally
    // left out of this customer/supplier-facing summary.
    const visibleRoles = roles.filter(r => !STATS_HIDDEN_ROLES.includes((r.name || '').toLowerCase()));

    if (!visibleRoles.length) {
        grid.innerHTML = '';
        return;
    }

    grid.style.gridTemplateColumns = `repeat(${visibleRoles.length}, 1fr)`;
    grid.innerHTML = visibleRoles.map(r => `
        <div class="stat-card">
            <div class="stat-icon" style="background-color: #eef2ff; color: var(--primary);"><i class="fa-solid fa-user"></i></div>
            <div class="stat-details">
                <p>${r.name.toUpperCase()}</p>
                <h3 id="stat-role-${r.id}">-</h3>
            </div>
        </div>
    `).join('');

    // Fetch per-role counts for this store (head count queries, cheap)
    await Promise.all(visibleRoles.map(async (role) => {
        const { count } = await window.supabaseClient
            .from('store_contact')
            .select('id', { count: 'exact', head: true })
            .eq('store', contactActiveStoreId)
            .eq('role', role.id);
        const el = document.getElementById(`stat-role-${role.id}`);
        if (el) el.textContent = count ?? 0;
    }));
}

// 1. Remove 'async' and add 'storeId' as the first parameter
function buildContactQuery(storeId, { forCount } = {}) {
    
    let query = window.supabaseClient
        .from('store_contact')
        .select(`
            id,
            role (id, name),
            contact!inner (
                id, 
                name, 
                email, 
                mobile, 
                address, 
                postcode,
                state (id, name)
            )
        `, { count: forCount ? 'exact' : null })
        .eq('store', storeId); // Scoped to the passed storeId

    // Apply Filters
    if (contactActiveFilters.keyword) {
        query = query.ilike('contact.name', `%${contactActiveFilters.keyword}%`);
    }
    if (contactActiveFilters.role) {
        query = query.eq('role.id', contactActiveFilters.role);
    }
    if (contactActiveFilters.state) {
        query = query.eq('contact.state.id', contactActiveFilters.state);
    }

    return query;
}

// --- Server-side paginated fetch ---
async function fetchAndRenderContacts() {
    const from = (contactCurrentPage - 1) * CONTACT_PAGE_SIZE;
    const to = from + CONTACT_PAGE_SIZE - 1;

    // 1. Fetch the store ID asynchronously first
    const storeId = await window.getActiveStoreId();
    if (!storeId) return; // Failsafe

    // 2. Pass it to the synchronous builder, chain .range(), and await the execution
    const { data, error, count } = await buildContactQuery(storeId).range(from, to);

    if (error) {
        document.getElementById('contact-table-body').innerHTML =
            `<tr><td colspan="4" class="text-muted" style="text-align:center; padding:24px;">Failed to load contacts.</td></tr>`;
        return;
    }

    const rows = (data || []).filter(r => r.contact);
    contactRowsCache = rows;
    contactTotalCount = count ?? rows.length;

    renderContactTable(rows, from);
    renderContactPagination();

    const shownFrom = rows.length ? from + 1 : 0;
    const shownTo = from + rows.length;
    const info = document.getElementById('contact-pagination-info');
    if (info) info.textContent = `Showing ${shownFrom} to ${shownTo} of ${contactTotalCount} entries`;
}

function renderContactPagination() {
    const list = document.getElementById('contact-pagination-list');
    if (!list) return;

    const totalPages = Math.max(1, Math.ceil(contactTotalCount / CONTACT_PAGE_SIZE));

    let html = `<li><button class="page-btn ${contactCurrentPage === 1 ? 'disabled' : ''}" id="contact-page-prev"><i class="fa-solid fa-chevron-left"></i></button></li>`;
    for (let p = 1; p <= totalPages; p++) {
        html += `<li><button class="page-btn ${p === contactCurrentPage ? 'active' : ''}" data-page="${p}">${p}</button></li>`;
    }
    html += `<li><button class="page-btn ${contactCurrentPage === totalPages ? 'disabled' : ''}" id="contact-page-next"><i class="fa-solid fa-chevron-right"></i></button></li>`;
    list.innerHTML = html;

    list.querySelectorAll('.page-btn[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
            contactCurrentPage = parseInt(btn.getAttribute('data-page'), 10);
            fetchAndRenderContacts();
        });
    });
    const prevBtn = document.getElementById('contact-page-prev');
    const nextBtn = document.getElementById('contact-page-next');
    if (prevBtn) prevBtn.addEventListener('click', () => {
        if (contactCurrentPage > 1) { contactCurrentPage--; fetchAndRenderContacts(); }
    });
    if (nextBtn) nextBtn.addEventListener('click', () => {
        if (contactCurrentPage < totalPages) { contactCurrentPage++; fetchAndRenderContacts(); }
    });
}

function renderContactTable(rows, offset) {
    const tbody = document.getElementById('contact-table-body');
    if (!tbody) return;

    if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-muted" style="text-align:center; padding:24px;">No contacts found.</td></tr>`;
        return;
    }

    tbody.innerHTML = rows.map((r, i) => {
        const c = r.contact || {};
        return `
            <tr>
                <td>${offset + i + 1}</td>
                <td>
                    <div class="person-detail">
                        <a href="#" class="view-contact-link" data-sc-id="${r.id}" style="color:#2563eb; font-weight:600; text-decoration:none;">${c.name || '-'}</a>
                        <span class="status ${roleClass(r.role?.name)}" style="width: fit-content; margin-top: 2px;">${r.role?.name || '-'}</span>
                    </div>
                </td>
                <td>
                    <div class="person-detail">
                        <span>${c.address || '-'}</span>
                    </div>
                </td>
                <td>
                    <div class="contact-detail">
                        <span>${c.email || '-'}</span>
                        <span class="text-muted">${c.mobile || '-'}</span>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    tbody.querySelectorAll('.view-contact-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            openViewContactModalById(link.getAttribute('data-sc-id'));
        });
    });
}

function applyContactFilters() {
    contactCurrentPage = 1;
    contactActiveFilters = {
        keyword: document.getElementById('search-keyword')?.value.trim() || '',
        role: document.getElementById('search-role')?.value || '',
        state: document.getElementById('search-state')?.value || ''
    };
    fetchAndRenderContacts();
}

// --- Uniqueness checks (name AND email must both be unique) ---
async function isContactFieldTaken(field, value, excludeContactId) {
    if (!value) return false;
    let query = window.supabaseClient.from('contact').select('id').ilike(field, value);
    if (excludeContactId) query = query.neq('id', excludeContactId);
    const { data } = await query.limit(1);
    return !!(data && data.length);
}
const isContactNameTaken = (name, excludeId) => isContactFieldTaken('name', name, excludeId);
const isContactEmailTaken = (email, excludeId) => isContactFieldTaken('email', email, excludeId);

function wireUniquenessCheck(inputId, warningId, checkFn, getExcludeId) {
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
            const taken = await checkFn(value, getExcludeId ? getExcludeId() : null);
            warning.style.display = taken ? 'block' : 'none';
        }, 400);
    });
}

// --- View / Edit modal ---
function openViewContactModalById(storeContactId) {
    const row = contactRowsCache.find(r => String(r.id) === String(storeContactId));
    if (!row) return;
    contactEditingId = null;
    populateViewModal(row);
    setViewModalEditable(false);
    const modal = document.getElementById('view-person-modal');
    if (modal) modal.classList.add('active');
}

function populateViewModal(row) {
    const c = row.contact || {};
    document.getElementById('view-person-name').value = c.name || '';
    document.getElementById('view-person-email').value = c.email || '';
    document.getElementById('view-person-mobile').value = c.mobile || '';
    document.getElementById('view-person-address').value = c.address || '';
    document.getElementById('view-person-postcode').value = c.postcode || '';

    const roleSel = document.getElementById('view-person-role');
    if (roleSel) {
        roleSel.value = row.role?.id || '';
        if (typeof jQuery !== 'undefined') $(roleSel).trigger('change');
    }
    const stateSel = document.getElementById('view-person-state');
    if (stateSel) {
        stateSel.value = c.state?.id || '';
        if (typeof jQuery !== 'undefined') $(stateSel).trigger('change');
    }

    document.getElementById('view-person-modal').dataset.scId = row.id;
    document.getElementById('view-person-modal').dataset.contactId = c.id;
}

function setViewModalEditable(editable) {
    const modal = document.getElementById('view-person-modal');
    const title = document.getElementById('view-person-modal-title');
    const editBtn = document.getElementById('edit-view-person-btn');
    const saveBtn = document.getElementById('save-view-person-btn');
    const nameWarning = document.getElementById('view-person-name-warning');
    const emailWarning = document.getElementById('view-person-email-warning');

    ['view-person-name', 'view-person-email', 'view-person-mobile', 'view-person-address', 'view-person-postcode'].forEach(id => {
        document.getElementById(id).readOnly = !editable;
    });
    ['view-person-role', 'view-person-state'].forEach(id => {
        const el = document.getElementById(id);
        el.disabled = !editable;
        if (typeof jQuery !== 'undefined') $(el).prop('disabled', !editable).trigger('change.select2');
    });

    title.textContent = editable ? 'Edit Contact Details' : 'View Contact Details';
    editBtn.style.display = editable ? 'none' : 'inline-flex';
    saveBtn.style.display = editable ? 'inline-flex' : 'none';
    if (!editable) {
        nameWarning.style.display = 'none';
        emailWarning.style.display = 'none';
    }
}

function setupViewContactModal() {
    const modal = document.getElementById('view-person-modal');
    const closeBtn = document.getElementById('close-view-person-btn');
    const cancelBtn = document.getElementById('cancel-view-person-btn');
    const editBtn = document.getElementById('edit-view-person-btn');
    const saveBtn = document.getElementById('save-view-person-btn');
    const deleteBtn = document.getElementById('delete-view-person-btn');

    const close = () => modal && modal.classList.remove('active');

    if (closeBtn) closeBtn.addEventListener('click', close);
    if (cancelBtn) cancelBtn.addEventListener('click', close);
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

    if (editBtn) editBtn.addEventListener('click', () => setViewModalEditable(true));

    wireUniquenessCheck('view-person-name', 'view-person-name-warning', isContactNameTaken, () => parseInt(modal.dataset.contactId, 10));
    wireUniquenessCheck('view-person-email', 'view-person-email-warning', isContactEmailTaken, () => parseInt(modal.dataset.contactId, 10));

    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const contactId = parseInt(modal.dataset.contactId, 10);
            const scId = modal.dataset.scId;
            const name = document.getElementById('view-person-name').value.trim();
            const email = document.getElementById('view-person-email').value.trim();

            if (!name) { alert('Name is required.'); return; }
            if (!email) { alert('Email is required.'); return; }

            const [nameTaken, emailTaken] = await Promise.all([
                isContactNameTaken(name, contactId),
                isContactEmailTaken(email, contactId)
            ]);
            if (nameTaken) document.getElementById('view-person-name-warning').style.display = 'block';
            if (emailTaken) document.getElementById('view-person-email-warning').style.display = 'block';
            if (nameTaken || emailTaken) return;

            saveBtn.disabled = true;
            const originalHtml = saveBtn.innerHTML;
            saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

            const payload = {
                name,
                email,
                mobile: document.getElementById('view-person-mobile').value.trim(),
                address: document.getElementById('view-person-address').value.trim(),
                postcode: document.getElementById('view-person-postcode').value.trim(),
                state: document.getElementById('view-person-state').value || null,
            };
            const roleId = document.getElementById('view-person-role').value || null;

            const { error: contactErr } = await window.supabaseClient.from('contact').update(payload).eq('id', contactId);
            const { error: scErr } = await window.supabaseClient.from('store_contact').update({ role: roleId }).eq('id', scId);

            saveBtn.disabled = false;
            saveBtn.innerHTML = originalHtml;

            if (contactErr || scErr) {
                // 23505 = unique_violation — most likely the `contact.name` UNIQUE
                // constraint caught a race condition our pre-check missed.
                if (contactErr && contactErr.code === '23505') {
                    document.getElementById('view-person-name-warning').style.display = 'block';
                } else {
                    alert('Failed to save changes.');
                }
                return;
            }

            close();
            await renderContactStatsGrid(contactRolesCache);
            await fetchAndRenderContacts();
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            const contactId = parseInt(modal.dataset.contactId, 10);
            const scId = modal.dataset.scId;
            close();
            requestDeleteContact(contactId, scId);
        });
    }
}

// --- Delete flow: dependency check, then confirm, then delete ---
let pendingDeleteContactId = null;
let pendingDeleteStoreContactId = null;

async function requestDeleteContact(contactId, storeContactId) {
    pendingDeleteContactId = contactId;
    pendingDeleteStoreContactId = storeContactId;

    // A contact participates in transactions/expenses/payments through their store_contact rows,
    // so gather ALL store_contact ids for this contact (across stores) before checking.
    const { data: scRows } = await window.supabaseClient
        .from('store_contact')
        .select('id')
        .eq('contact', contactId);
    const scIds = (scRows || []).map(r => r.id);

    if (scIds.length === 0) {
        openDeleteConfirm();
        return;
    }

    const [transAsContact, transAsTeller, paymentsAsPayor, paymentsAsTeller, expensesAsSupplier] = await Promise.all([
        window.supabaseClient.from('trans').select('id', { count: 'exact', head: true }).in('contact', scIds),
        window.supabaseClient.from('trans').select('id', { count: 'exact', head: true }).in('teller', scIds),
        window.supabaseClient.from('trans_payment').select('id', { count: 'exact', head: true }).in('payer', scIds),
        window.supabaseClient.from('trans_payment').select('id', { count: 'exact', head: true }).in('teller', scIds),
        window.supabaseClient.from('expenses').select('id', { count: 'exact', head: true }).in('supplier', scIds)
    ]);

    const totalRefs = (transAsContact.count || 0) + (transAsTeller.count || 0) +
        (paymentsAsPayor.count || 0) + (paymentsAsTeller.count || 0) + (expensesAsSupplier.count || 0);

    if (totalRefs > 0) {
        const parts = [];
        if (transAsContact.count) parts.push(`${transAsContact.count} transaction(s) as contact`);
        if (transAsTeller.count) parts.push(`${transAsTeller.count} transaction(s) as teller`);
        if (paymentsAsPayor.count) parts.push(`${paymentsAsPayor.count} payment(s) as payer`);
        if (paymentsAsTeller.count) parts.push(`${paymentsAsTeller.count} payment(s) as teller`);
        if (expensesAsSupplier.count) parts.push(`${expensesAsSupplier.count} expense(s) as supplier`);

        document.getElementById('delete-blocked-text').textContent =
            `This contact cannot be deleted because they are linked to: ${parts.join(', ')}. Please reassign or remove those records first.`;
        document.getElementById('delete-blocked-modal').classList.add('active');
        return;
    }

    openDeleteConfirm();
}

function openDeleteConfirm() {
    document.getElementById('delete-confirm-modal').classList.add('active');
}

function setupDeleteModals() {
    const confirmBtn = document.getElementById('confirm-delete-contact-btn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', async () => {
            const confirmModal = document.getElementById('delete-confirm-modal');
            confirmBtn.disabled = true;
            const originalHtml = confirmBtn.innerHTML;
            confirmBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Deleting...';

            // Remove store_contact link(s) first, then the contact row itself
            await window.supabaseClient.from('store_contact').delete().eq('contact', pendingDeleteContactId);
            const { error } = await window.supabaseClient.from('contact').delete().eq('id', pendingDeleteContactId);

            confirmBtn.disabled = false;
            confirmBtn.innerHTML = originalHtml;
            confirmModal.classList.remove('active');

            if (error) {
                alert('Failed to delete contact.');
                return;
            }

            document.getElementById('view-person-modal')?.classList.remove('active');
            await renderContactStatsGrid(contactRolesCache);
            await fetchAndRenderContacts();
        });
    }
}

// --- PDF Export ---
// Requires jsPDF + jspdf-autotable, loaded via CDN in index.html:
//   <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
//   <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js"></script>
function setupContactPdfExport() {
    const btn = document.getElementById('contact-pdf-export-btn');
    if (!btn) return;
    btn.addEventListener('click', generateContactsPdf);
}

// Returns [[label, value], ...] rows for the bordered "selected filters" table in the PDF.
function buildActiveContactFilterRows() {
    const rows = [];

    rows.push(['Search Keyword', contactActiveFilters.keyword || 'All']);

    const role = contactRolesCache.find(r => String(r.id) === String(contactActiveFilters.role));
    rows.push(['Role', contactActiveFilters.role ? (role ? role.name : contactActiveFilters.role) : 'All']);

    const state = contactStatesCache.find(s => String(s.id) === String(contactActiveFilters.state));
    rows.push(['State', contactActiveFilters.state ? (state ? state.name : contactActiveFilters.state) : 'All']);

    return rows;
}

async function generateContactsPdf() {
    const btn = document.getElementById('contact-pdf-export-btn');
    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert('PDF library not loaded. Please add jsPDF + jspdf-autotable to index.html.');
        return;
    }

    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    try {
        const storeId = await window.getActiveStoreId();
        const [{ data: store }, { data: allRows, error }] = await Promise.all([
            window.supabaseClient.from('store').select('name, address, tel, email').eq('id', contactActiveStoreId).maybeSingle(),
            buildContactQuery(storeId, { forCount: false })
        ]);

        if (error) {
            alert('Failed to load contacts for export.');
            return;
        }

        const rows = (allRows || []).filter(r => r.contact);
        if (!rows.length) {
            alert('No contacts match the current filters.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
        const marginLeft = 40;
        let y = 44;

        // Store header
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

        // Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(20);
        doc.text('Contact List', marginLeft, y);
        y += 12;

        // Selected filters — simple bordered table (label / value rows)
        const filterRows = buildActiveContactFilterRows();
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
            const c = r.contact || {};
            return [
                c.name || '-',
                r.role?.name || '-',
                c.address || '-',
                c.state?.name || '-',
                c.mobile || '-',
                c.email || '-'
            ];
        });

        // Contact list — bordered on all sides
        doc.autoTable({
            head: [['Name', 'Role', 'Address', 'State', 'Tel', 'Email']],
            body: tableRows,
            startY: filterTableEndY + 16,
            margin: { left: marginLeft, right: marginLeft },
            theme: 'grid',
            styles: { fontSize: 8.5, cellPadding: 6, lineColor: [203, 213, 225], lineWidth: 0.75 },
            headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold', lineColor: [99, 102, 241], lineWidth: 0.75 },
            alternateRowStyles: { fillColor: [248, 250, 252] }
        });

        const dateStamp = new Date().toISOString().slice(0, 10);
        doc.save(`Contacts_${dateStamp}.pdf`);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
    }
}