let sdStoreId = null;
let sdRolesCache = [];
let sdContactsCache = [];
let sdStaffRowsCache = [];
let sdPendingRemoveScId = null;

const SD_KNOWN_ROLE_CLASSES = ['admin', 'manager', 'staff', 'customer', 'supplier'];
function roleClassSD(name) {
    const key = (name || '').toLowerCase();
    return SD_KNOWN_ROLE_CLASSES.includes(key) ? key : 'role-fallback';
}

function render_store_details() {
    return `
        <div class="dashboard-body">
            <div class="page-header" style="margin-bottom: 24px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <a href="#" data-link="store" class="back-btn" title="Back to Stores"><i class="fa-solid fa-arrow-left"></i></a>
                    <h1 style="margin: 0;">Store Profile</h1>
                </div>
                <div style="display: flex; gap: 12px;">
                    <button class="outline-btn" id="delete-store-btn" style="color: var(--danger); border-color: var(--danger);"><i class="fa-solid fa-trash"></i> Delete Store</button>
                    <button class="primary-btn" id="save-store-btn"><i class="fa-solid fa-floppy-disk"></i> Save Changes</button>
                </div>
            </div>

            <!-- Store Details -->
            <div class="data-card" style="margin-bottom: 24px;">
                <div class="card-header">
                    <h2>Store Details</h2>
                </div>
                <div style="padding: 24px;">

                    <div style="display: flex; align-items: center; gap: 24px; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid var(--border-color);">
                        <div style="width: 100px; height: 100px; border-radius: var(--radius-md); border: 2px dashed var(--border-color); display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; flex-shrink: 0; background: #f8fafc;">
                            <img id="sd-logo-preview" src="store_logo.webp" alt="Store Logo" style="width: 100%; height: 100%; object-fit: cover;">
                            <input type="file" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer;">
                        </div>
                        <div style="flex: 1;">
                            <h3 id="sd-heading" style="margin: 0 0 6px 0; font-size: 1.1rem;">-</h3>
                            <p class="text-muted text-sm" style="margin: 0;">Store ID: <span id="sd-id-label">-</span></p>
                            <p class="text-muted text-sm" style="margin: 4px 0 0 0;">Click the logo to upload a new image.</p>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
                        <div class="form-group">
                            <label class="form-label">Store Name</label>
                            <input type="text" id="sd-name" class="form-input">
                            <small id="sd-name-warning" class="text-muted" style="display:none; color: var(--danger); margin-top: 4px;">This store name is already taken.</small>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Store URL</label>
                            <input type="text" id="sd-url" class="form-input">
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
                        <div class="form-group">
                            <label class="form-label">Store Email</label>
                            <input type="email" id="sd-email" class="form-input">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Contact Number</label>
                            <input type="tel" id="sd-tel" class="form-input">
                        </div>
                    </div>
                    <div class="form-group" style="margin-bottom: 24px;">
                        <label class="form-label">Store Address</label>
                        <textarea id="sd-address" class="form-input" rows="3"></textarea>
                    </div>
                </div>
            </div>

            <!-- Assigned Staff -->
            <div class="data-card">
                <div class="card-header">
                    <h2>Assigned Staff</h2>
                </div>
                <div style="padding: 24px; border-bottom: 1px solid var(--border-color); display: grid; grid-template-columns: 1.5fr 1fr auto; gap: 24px; align-items: end;">
                    <div class="form-group" style="margin: 0;">
                        <label class="form-label">Staff (Contact)</label>
                        <select id="sd-assign-contact" class="select2-search" data-placeholder="Select Contact" style="width: 100%;">
                            <option></option>
                        </select>
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label class="form-label">Role</label>
                        <select id="sd-assign-role" class="select2-search" data-placeholder="Select Role" style="width: 100%;">
                            <option></option>
                        </select>
                    </div>
                    <button class="primary-btn" id="sd-assign-btn" style="height: 42px; padding: 0 24px;"><i class="fa-solid fa-plus" style="margin-right: 8px;"></i> Assign</button>
                </div>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Role</th>
                                <th>Email / Mobile</th>
                                <th style="width: 60px; text-align: center;"></th>
                            </tr>
                        </thead>
                        <tbody id="sd-staff-body">
                            <tr><td colspan="4" class="text-muted" style="text-align:center; padding: 24px;">Loading staff...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Delete Store Blocked Modal -->
        <div id="sd-delete-blocked-modal" class="modal-overlay">
            <div class="modal-content small-modal">
                <div class="modal-title"><i class="fa-solid fa-triangle-exclamation" style="color: var(--danger); margin-right: 8px;"></i> Cannot Delete Store</div>
                <div class="modal-text" id="sd-delete-blocked-text">This store has related records and cannot be deleted.</div>
                <div class="modal-actions">
                    <button class="btn-modal-no" onclick="document.getElementById('sd-delete-blocked-modal').classList.remove('active')">OK</button>
                </div>
            </div>
        </div>

        <!-- Delete Store Confirm Modal -->
        <div id="sd-delete-confirm-modal" class="modal-overlay">
            <div class="modal-content small-modal">
                <div class="modal-title"><i class="fa-solid fa-triangle-exclamation" style="color: var(--danger); margin-right: 8px;"></i> Delete Store</div>
                <div class="modal-text">Are you sure you want to delete this store? This cannot be undone.</div>
                <div class="modal-actions">
                    <button class="btn-modal-yes" id="sd-confirm-delete-store-btn">YES, DELETE</button>
                    <button class="btn-modal-no" onclick="document.getElementById('sd-delete-confirm-modal').classList.remove('active')">CANCEL</button>
                </div>
            </div>
        </div>

        <!-- Remove Staff Blocked Modal -->
        <div id="sd-staff-blocked-modal" class="modal-overlay">
            <div class="modal-content small-modal">
                <div class="modal-title"><i class="fa-solid fa-triangle-exclamation" style="color: var(--danger); margin-right: 8px;"></i> Cannot Remove Staff</div>
                <div class="modal-text" id="sd-staff-blocked-text">This staff assignment has related records and cannot be removed.</div>
                <div class="modal-actions">
                    <button class="btn-modal-no" onclick="document.getElementById('sd-staff-blocked-modal').classList.remove('active')">OK</button>
                </div>
            </div>
        </div>

        <!-- Remove Staff Confirm Modal -->
        <div id="sd-staff-confirm-modal" class="modal-overlay">
            <div class="modal-content small-modal">
                <div class="modal-title"><i class="fa-solid fa-triangle-exclamation" style="color: var(--danger); margin-right: 8px;"></i> Remove Staff</div>
                <div class="modal-text">Are you sure you want to remove this staff member from the store?</div>
                <div class="modal-actions">
                    <button class="btn-modal-yes" id="sd-confirm-remove-staff-btn">YES, REMOVE</button>
                    <button class="btn-modal-no" onclick="document.getElementById('sd-staff-confirm-modal').classList.remove('active')">CANCEL</button>
                </div>
            </div>
        </div>
    `;
}

window.init_store_details = async function() {
    sdStoreId = localStorage.getItem('view_store_id');
    if (!sdStoreId) {
        navigateTo('store');
        return;
    }

    const { data: store, error } = await window.supabaseClient
        .from('store')
        .select('id, name, url, email, tel, address, logo')
        .eq('id', sdStoreId)
        .maybeSingle();

    if (error || !store) {
        alert('Store not found.');
        navigateTo('store');
        return;
    }

    populateStoreDetailsForm(store);

    const [{ data: roles }, { data: contacts }] = await Promise.all([
        window.supabaseClient.from('role').select('id, name').order('name'),
        window.supabaseClient.from('contact').select('id, name, email, mobile').order('name')
    ]);
    sdRolesCache = roles || [];
    sdContactsCache = contacts || [];

    populateSdSelect('sd-assign-role', sdRolesCache);

    await fetchAndRenderStaff();

    wireSaveStoreButton();
    wireDeleteStoreButton();
    wireAssignStaffButton();
    wireRemoveStaffConfirm();

    if (typeof window.initializeSelect2 === 'function') window.initializeSelect2();
};

function populateStoreDetailsForm(store) {
    document.getElementById('sd-heading').textContent = store.name || '-';
    document.getElementById('sd-id-label').textContent = store.id;
    document.getElementById('sd-logo-preview').src = store.logo || 'store_logo.webp';
    document.getElementById('sd-name').value = store.name || '';
    document.getElementById('sd-url').value = store.url || '';
    document.getElementById('sd-email').value = store.email || '';
    document.getElementById('sd-tel').value = store.tel || '';
    document.getElementById('sd-address').value = store.address || '';
}

function populateSdSelect(id, items) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '<option></option>' + items.map(i => `<option value="${i.id}">${i.name}</option>`).join('');
}

// --- Uniqueness check (store name) ---
async function isStoreNameTakenSD(name, excludeId) {
    if (!name) return false;
    let query = window.supabaseClient.from('store').select('id').ilike('name', name);
    if (excludeId) query = query.neq('id', excludeId);
    const { data } = await query.limit(1);
    return !!(data && data.length);
}

function wireStoreNameCheckSD(inputId, warningId, getExcludeId) {
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
            const taken = await isStoreNameTakenSD(value, getExcludeId ? getExcludeId() : null);
            warning.style.display = taken ? 'block' : 'none';
        }, 400);
    });
}

// --- Save store details ---
function wireSaveStoreButton() {
    const saveBtn = document.getElementById('save-store-btn');
    if (!saveBtn) return;

    wireStoreNameCheckSD('sd-name', 'sd-name-warning', () => parseInt(sdStoreId, 10));

    saveBtn.addEventListener('click', async () => {
        const name = document.getElementById('sd-name').value.trim();
        if (!name) { alert('Store name is required.'); return; }

        const taken = await isStoreNameTakenSD(name, sdStoreId);
        if (taken) {
            document.getElementById('sd-name-warning').style.display = 'block';
            return;
        }
        document.getElementById('sd-name-warning').style.display = 'none';

        const originalHtml = saveBtn.innerHTML;
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

        const payload = {
            name,
            url: document.getElementById('sd-url').value.trim(),
            email: document.getElementById('sd-email').value.trim(),
            tel: document.getElementById('sd-tel').value.trim(),
            address: document.getElementById('sd-address').value.trim(),
        };

        const { error } = await window.supabaseClient.from('store').update(payload).eq('id', sdStoreId);

        saveBtn.disabled = false;

        if (error) {
            saveBtn.innerHTML = originalHtml;
            if (error.code === '23505') {
                document.getElementById('sd-name-warning').style.display = 'block';
            } else {
                alert('Failed to save store.');
            }
            return;
        }

        document.getElementById('sd-heading').textContent = name;
        saveBtn.innerHTML = '<i class="fa-solid fa-check"></i> Saved!';
        saveBtn.style.backgroundColor = 'var(--success)';
        setTimeout(() => {
            saveBtn.innerHTML = originalHtml;
            saveBtn.style.backgroundColor = '';
        }, 1200);
    });
}

// --- Delete store: dependency check, then confirm, then delete ---
function wireDeleteStoreButton() {
    const deleteBtn = document.getElementById('delete-store-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            const [staffLinks, productLinks, transLinks] = await Promise.all([
                window.supabaseClient.from('store_contact').select('id', { count: 'exact', head: true }).eq('store', sdStoreId),
                window.supabaseClient.from('store_product').select('id', { count: 'exact', head: true }).eq('store', sdStoreId),
                window.supabaseClient.from('trans').select('id', { count: 'exact', head: true }).eq('store', sdStoreId)
            ]);

            const totalRefs = (staffLinks.count || 0) + (productLinks.count || 0) + (transLinks.count || 0);

            if (totalRefs > 0) {
                const parts = [];
                if (staffLinks.count) parts.push(`${staffLinks.count} staff assignment(s)`);
                if (productLinks.count) parts.push(`${productLinks.count} product listing(s)`);
                if (transLinks.count) parts.push(`${transLinks.count} transaction(s)`);
                document.getElementById('sd-delete-blocked-text').textContent =
                    `This store cannot be deleted because it is linked to: ${parts.join(', ')}. Please reassign or remove those records first.`;
                document.getElementById('sd-delete-blocked-modal').classList.add('active');
                return;
            }

            document.getElementById('sd-delete-confirm-modal').classList.add('active');
        });
    }

    const confirmBtn = document.getElementById('sd-confirm-delete-store-btn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', async () => {
            const modal = document.getElementById('sd-delete-confirm-modal');
            confirmBtn.disabled = true;
            const originalHtml = confirmBtn.innerHTML;
            confirmBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Deleting...';

            const { error } = await window.supabaseClient.from('store').delete().eq('id', sdStoreId);

            confirmBtn.disabled = false;
            confirmBtn.innerHTML = originalHtml;
            modal.classList.remove('active');

            if (error) {
                alert('Failed to delete store.');
                return;
            }

            localStorage.removeItem('view_store_id');
            navigateTo('store');
        });
    }
}

// --- Assigned staff table ---
async function fetchAndRenderStaff() {
    const { data, error } = await window.supabaseClient
        .from('store_contact')
        .select('id, role (id, name), contact (id, name, email, mobile)')
        .eq('store', sdStoreId);

    const tbody = document.getElementById('sd-staff-body');
    if (error) {
        if (tbody) tbody.innerHTML = `<tr><td colspan="4" class="text-muted" style="text-align:center; padding:24px;">Failed to load staff.</td></tr>`;
        return;
    }

    sdStaffRowsCache = (data || []).filter(r => r.contact);

    if (!sdStaffRowsCache.length) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-muted" style="text-align:center; padding:24px;">No staff assigned yet.</td></tr>`;
    } else {
        tbody.innerHTML = sdStaffRowsCache.map(r => `
            <tr>
                <td><strong>${r.contact.name || '-'}</strong></td>
                <td><span class="status ${roleClassSD(r.role?.name)}">${r.role?.name || '-'}</span></td>
                <td>
                    <div class="contact-detail">
                        <span>${r.contact.email || '-'}</span>
                        <span class="text-muted">${r.contact.mobile || '-'}</span>
                    </div>
                </td>
                <td style="text-align: center;">
                    <button class="icon-action delete sd-remove-staff-btn" data-sc-id="${r.id}" title="Remove Staff"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }

    tbody.querySelectorAll('.sd-remove-staff-btn').forEach(btn => {
        btn.addEventListener('click', () => requestRemoveStaff(btn.getAttribute('data-sc-id')));
    });

    // Refresh the assign dropdown to exclude contacts already assigned to this store
    const assignedIds = new Set(sdStaffRowsCache.map(r => r.contact.id));
    const availableContacts = sdContactsCache.filter(c => !assignedIds.has(c.id));
    populateSdSelect('sd-assign-contact', availableContacts);
    if (typeof jQuery !== 'undefined') $('#sd-assign-contact').trigger('change');
}

// --- Assign staff ---
function wireAssignStaffButton() {
    const btn = document.getElementById('sd-assign-btn');
    if (!btn) return;
    btn.addEventListener('click', async () => {
        const contactId = document.getElementById('sd-assign-contact').value;
        const roleId = document.getElementById('sd-assign-role').value;

        if (!contactId) { alert('Please select a staff contact.'); return; }
        if (!roleId) { alert('Please select a role.'); return; }

        const originalHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

        const { error } = await window.supabaseClient.from('store_contact').insert({
            store: sdStoreId,
            contact: contactId,
            role: roleId
        });

        btn.disabled = false;
        btn.innerHTML = originalHtml;

        if (error) {
            alert('Failed to assign staff.');
            return;
        }

        document.getElementById('sd-assign-role').value = '';
        if (typeof jQuery !== 'undefined') $('#sd-assign-role').trigger('change');

        await fetchAndRenderStaff();
        if (typeof window.initializeSelect2 === 'function') window.initializeSelect2();
    });
}

// --- Remove staff: dependency check, then confirm, then delete ---
async function requestRemoveStaff(scId) {
    sdPendingRemoveScId = scId;

    const [transAsContact, transAsTeller, paymentsAsPayor, paymentsAsTeller, expensesAsSupplier] = await Promise.all([
        window.supabaseClient.from('trans').select('id', { count: 'exact', head: true }).eq('contact', scId),
        window.supabaseClient.from('trans').select('id', { count: 'exact', head: true }).eq('teller', scId),
        window.supabaseClient.from('trans_payment').select('id', { count: 'exact', head: true }).eq('payer', scId),
        window.supabaseClient.from('trans_payment').select('id', { count: 'exact', head: true }).eq('teller', scId),
        window.supabaseClient.from('expenses').select('id', { count: 'exact', head: true }).eq('supplier', scId)
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

        document.getElementById('sd-staff-blocked-text').textContent =
            `This staff assignment cannot be removed because it is linked to: ${parts.join(', ')}. Please reassign or remove those records first.`;
        document.getElementById('sd-staff-blocked-modal').classList.add('active');
        return;
    }

    document.getElementById('sd-staff-confirm-modal').classList.add('active');
}

function wireRemoveStaffConfirm() {
    const confirmBtn = document.getElementById('sd-confirm-remove-staff-btn');
    if (!confirmBtn) return;
    confirmBtn.addEventListener('click', async () => {
        const modal = document.getElementById('sd-staff-confirm-modal');
        confirmBtn.disabled = true;
        const originalHtml = confirmBtn.innerHTML;
        confirmBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Removing...';

        const { error } = await window.supabaseClient.from('store_contact').delete().eq('id', sdPendingRemoveScId);

        confirmBtn.disabled = false;
        confirmBtn.innerHTML = originalHtml;
        modal.classList.remove('active');

        if (error) {
            alert('Failed to remove staff.');
            return;
        }

        await fetchAndRenderStaff();
        if (typeof window.initializeSelect2 === 'function') window.initializeSelect2();
    });
}