// shared-modals.js
// Shared "Add" modals usable from any page (Quick Add dropdown) AND from their
// own page (contact.js / expenses.js call into the same module instead of
// duplicating the modal markup + wiring).
//
// Each module lazily injects its modal HTML into document.body on first open,
// fetches its own lookups, wires the form once, and on save calls back into
// whichever page-level refresh functions happen to be loaded — so the list
// refreshes if you're already on that page, and silently no-ops otherwise.

window.QuickAddContact = (function () {
    let initialized = false;
    let rolesCache = [];
    let statesCache = [];
    let activeStoreId = null;

    function injectModalHtml() {
        if (document.getElementById('qa-shared-qa-shared-add-person-modal')) return;
        const div = document.createElement('div');
        div.innerHTML = `
        <div id="qa-shared-add-person-modal" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Add New Contact</h2>
                    <button class="close-modal-btn" id="qa-close-add-person-btn"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="modal-body">
                    <form id="add-person-form" class="modal-form">
                        <div class="form-row">
                            <div class="form-group col-12">
                                <label class="form-label">Full Name</label>
                                <input type="text" id="person-name" placeholder=" " class="form-input" required>
                                <small id="person-name-warning" class="text-muted" style="display:none; color: var(--danger); margin-top: 4px;">This name is already taken.</small>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group col-4">
                                <label class="form-label">Role</label>
                                <select id="person-role" class="select2-search" data-placeholder="Role" style="width: 100%;">
                                    <option></option>
                                </select>
                            </div>
                            <div class="form-group col-4">
                                <label class="form-label">Email</label>
                                <input type="email" id="person-email" placeholder=" " class="form-input" required>
                                <small id="person-email-warning" class="text-muted" style="display:none; color: var(--danger); margin-top: 4px;">This email is already taken.</small>
                            </div>
                            <div class="form-group col-4">
                                <label class="form-label">Mobile</label>
                                <input type="tel" id="person-mobile" placeholder=" " class="form-input" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group col-12">
                                <textarea id="person-address" placeholder=" " class="form-input" rows="3" required style="resize: none;"></textarea>
                                <label class="form-label">Address</label>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group col-4">
                                <label class="form-label">Postcode</label>
                                <input type="text" id="person-postcode" placeholder=" " class="form-input" required>
                            </div>
                            <div class="form-group col-8">
                                <label class="form-label">State</label>
                                <select id="person-state" class="select2-search" data-placeholder="State" style="width: 100%;">
                                    <option></option>
                                </select>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="action-btn" id="qa-cancel-add-person-btn">Cancel</button>
                    <button type="submit" form="add-person-form" class="primary-btn" id="save-add-person-btn">Save Contact</button>
                </div>
            </div>
        </div>`;
        document.body.appendChild(div.firstElementChild);
    }

    function populateSelect(id, items, allLabel) {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = (allLabel ? `<option value="">${allLabel}</option>` : '<option></option>')
            + items.map(i => `<option value="${i.id}">${i.name}</option>`).join('');
    }

    async function isContactFieldTaken(field, value, excludeContactId) {
        if (!value) return false;
        let query = window.supabaseClient.from('contact').select('id').ilike(field, value);
        if (excludeContactId) query = query.neq('id', excludeContactId);
        const { data } = await query.limit(1);
        return !!(data && data.length);
    }
    const isNameTaken = (name) => isContactFieldTaken('name', name, null);
    const isEmailTaken = (email) => isContactFieldTaken('email', email, null);

    function wireUniquenessCheck(inputId, warningId, checkFn) {
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
                const taken = await checkFn(value);
                warning.style.display = taken ? 'block' : 'none';
            }, 400);
        });
    }

    async function loadLookups() {
        activeStoreId = await window.getActiveStoreId();
        const [{ data: roles }, { data: states }] = await Promise.all([
            window.supabaseClient.from('role').select('id, name').order('name'),
            window.supabaseClient.from('state').select('id, name').order('name')
        ]);
        rolesCache = roles || [];
        statesCache = states || [];
        populateSelect('person-role', rolesCache);
        populateSelect('person-state', statesCache);
    }

    function wireForm() {
        const modal = document.getElementById('qa-shared-add-person-modal');
        const closeBtn = document.getElementById('qa-close-add-person-btn');
        const cancelBtn = document.getElementById('qa-cancel-add-person-btn');
        const form = document.getElementById('add-person-form');
        const nameWarning = document.getElementById('person-name-warning');
        const emailWarning = document.getElementById('person-email-warning');

        const close = () => modal && modal.classList.remove('active');
        if (closeBtn) closeBtn.addEventListener('click', close);
        if (cancelBtn) cancelBtn.addEventListener('click', close);
        if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

        wireUniquenessCheck('person-name', 'person-name-warning', isNameTaken);
        wireUniquenessCheck('person-email', 'person-email-warning', isEmailTaken);

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('save-add-person-btn');
            const originalText = submitBtn.innerHTML;

            const name = document.getElementById('person-name').value.trim();
            const email = document.getElementById('person-email').value.trim();
            if (!name || !email) return;

            const [nameTaken, emailTaken] = await Promise.all([isNameTaken(name), isEmailTaken(email)]);
            if (nameTaken) nameWarning.style.display = 'block';
            if (emailTaken) emailWarning.style.display = 'block';
            if (nameTaken || emailTaken) {
                document.getElementById(nameTaken ? 'person-name' : 'person-email').focus();
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

            const payload = {
                name,
                email,
                mobile: document.getElementById('person-mobile').value.trim(),
                address: document.getElementById('person-address').value.trim(),
                postcode: document.getElementById('person-postcode').value.trim(),
                state: document.getElementById('person-state').value || null,
            };
            const roleId = document.getElementById('person-role').value || null;

            const { data: newContact, error: contactErr } = await window.supabaseClient
                .from('contact').insert(payload).select('id').single();

            if (contactErr || !newContact) {
                if (contactErr && contactErr.code === '23505') {
                    nameWarning.style.display = 'block';
                } else {
                    alert('Failed to save contact.');
                }
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                return;
            }

            await window.supabaseClient.from('store_contact').insert({
                store: activeStoreId,
                contact: newContact.id,
                role: roleId
            });

            submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Saved!';
            submitBtn.style.backgroundColor = 'var(--success)';
            setTimeout(async () => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                submitBtn.style.backgroundColor = '';
                close();

                // Refresh the Contact page's own list/stats if it happens to be loaded.
                if (typeof window.renderContactStatsGrid === 'function' && typeof window.contactRolesCache !== 'undefined') {
                    await window.renderContactStatsGrid(window.contactRolesCache);
                }
                if (typeof window.fetchAndRenderContacts === 'function') {
                    await window.fetchAndRenderContacts();
                }

                // Refresh POS's contact cache + the currently-open Edit Cart Details dropdown,
                // if POS happens to be the active page, and auto-select the new contact.
                if (typeof window.refreshPosContactsCache === 'function') {
                    await window.refreshPosContactsCache(newContact.id);
                }
            }, 800);
        });
    }

    async function open() {
        injectModalHtml();

        if (!initialized) {
            await loadLookups();
            wireForm();
            initialized = true;
        } else {
            // Refresh active store scoping + reset form each time it's reopened.
            activeStoreId = await window.getActiveStoreId();
        }

        const modal = document.getElementById('qa-shared-add-person-modal');
        const form = document.getElementById('add-person-form');
        form.querySelectorAll('input, select, textarea').forEach(el => {
            el.disabled = false;
            el.value = '';
            if (typeof jQuery !== 'undefined' && el.classList.contains('select2-search')) $(el).val(null).trigger('change');
        });
        document.getElementById('person-name-warning').style.display = 'none';
        document.getElementById('person-email-warning').style.display = 'none';

        modal.classList.add('active');
        if (typeof window.initializeSelect2 === 'function') window.initializeSelect2();
        if (typeof jQuery !== 'undefined') {
            $('#person-role, #person-state').each(function () {
                if (!$(this).hasClass('select2-hidden-accessible')) {
                    $(this).select2({ width: '100%', dropdownParent: $(modal) });
                }
            });
        }
    }

    return { open };
})();


window.QuickAddExpense = (function () {
    let initialized = false;
    let categoriesCache = [];
    let suppliersCache = [];
    let payMethodCache = [];
    let activeStoreId = null;
    let stagedPayments = [];

    function injectModalHtml() {
        if (document.getElementById('qa-shared-add-expense-modal')) return;
        const div = document.createElement('div');
        div.innerHTML = `
    <div id="qa-shared-add-expense-modal" class="modal-overlay">
        <div class="modal-content" style="max-width: 1200px;">
            <div class="modal-header">
                <h2>Add New Expense</h2>
                <button class="close-modal-btn" id="qa-close-add-expense-btn"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body">
                <form id="add-expense-form" class="modal-form">
                    <div class="form-row">
                        <div class="form-group col-6">
                            <label class="form-label" style="top: 10px; font-size: 0.7rem; color: var(--primary); font-weight: 600;">Date</label>
                            <input type="date" id="expense-date" class="form-input" required>
                        </div>
                        <div class="form-group col-6">
                            <label class="form-label">Reference #</label>
                            <input type="text" id="expense-ref-preview" class="form-input" readonly disabled placeholder="Auto-generated on save">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-6">
                            <label class="form-label">Supplier</label>
                            <select id="expense-supplier" class="select2-search" data-placeholder="Supplier" style="width: 100%;"><option></option></select>
                        </div>
                        <div class="form-group col-6">
                            <label class="form-label">Category</label>
                            <select id="expense-category" class="select2-search" data-placeholder="Category" style="width: 100%;"><option></option></select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-6">
                            <label class="form-label">Amount (RM)</label>
                            <input type="number" id="expense-amount" step="0.01" class="form-input" placeholder=" " required>
                        </div>
                        <div class="form-group col-6">
                            <label class="form-label">Status</label>
                            <select id="expense-status" class="select2-search" data-placeholder="Status" style="width: 100%;">
                                <option value="1" selected>Waiting</option>
                                <option value="2">Paid</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-12">
                            <textarea id="expense-note" class="form-input" placeholder=" " style="height: 80px; resize: none;"></textarea>
                            <label class="form-label">Description / Notes</label>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-12">
                            <label class="form-label">Attachments</label>
                            <input type="file" id="expense-attachments" class="form-input" multiple accept="image/*,.pdf" style="padding: 10px;">
                            <small class="text-muted" style="display:block; margin-top: 6px;">You can select multiple files (receipts, invoices, etc.).</small>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-12">
                            <label class="form-label" style="margin-bottom: 10px; display: block;">Payments</label>
                            <div style="display: grid; grid-template-columns: 1.3fr 1.3fr 1fr 1fr 1.3fr auto; gap: 10px; align-items: end; padding: 14px; background: var(--bg-main); border-radius: 8px; border: 1px dashed var(--border-color); margin-bottom: 12px;">
                                <div>
                                    <label class="form-label" style="font-size: 0.75rem; margin-bottom: 4px; display: block;">Method</label>
                                    <select id="add-pay-method" class="select2-search" style="width: 100%;"></select>
                                </div>
                                <div>
                                    <label class="form-label" style="font-size: 0.75rem; margin-bottom: 4px; display: block;">Date</label>
                                    <input type="date" id="add-pay-date" class="form-input" style="height: 38px; padding: 6px 12px; font-size: 0.9rem;">
                                </div>
                                <div>
                                    <label class="form-label" style="font-size: 0.75rem; margin-bottom: 4px; display: block;">RM Pay</label>
                                    <input type="text" id="add-pay-amount" class="form-input" style="height: 38px; padding: 6px 12px; font-size: 0.9rem;" placeholder="0.00">
                                </div>
                                <div>
                                    <label class="form-label" style="font-size: 0.75rem; margin-bottom: 4px; display: block;">Pay Ref</label>
                                    <input type="text" id="add-pay-ref" class="form-input" style="height: 38px; padding: 6px 12px; font-size: 0.9rem;" placeholder="Optional">
                                </div>
                                <div>
                                    <label class="form-label" style="font-size: 0.75rem; margin-bottom: 4px; display: block;">Note</label>
                                    <input type="text" id="add-pay-note" class="form-input" style="height: 38px; padding: 6px 12px; font-size: 0.9rem;" placeholder="Optional">
                                </div>
                                <button type="button" id="add-pay-stage-btn" class="primary-btn" style="height: 38px;"><i class="fa-solid fa-plus"></i></button>
                            </div>

                            <table class="invoice-table" style="font-size: 0.85rem;" id="add-pay-table">
                                <thead>
                                    <tr>
                                        <th>Date</th><th>Method</th><th>Pay Ref</th><th>Note</th>
                                        <th class="text-right">Amount (RM)</th><th class="text-right" style="width: 60px;">Action</th>
                                    </tr>
                                </thead>
                                <tbody id="add-pay-tbody">
                                    <tr><td colspan="6" class="text-muted" style="text-align:center; padding:12px;">No payments added yet.</td></tr>
                                </tbody>
                            </table>

                            <div style="display: flex; justify-content: flex-end; gap: 24px; margin-top: 10px; padding: 10px 14px; background: var(--bg-main); border-radius: 6px; font-size: 0.9rem;">
                                <span class="text-muted">Amount: <strong id="add-pay-summary-amount" style="color: var(--text-main);">0.00</strong></span>
                                <span class="text-muted">Paid: <strong id="add-pay-summary-paid" style="color: var(--success);">0.00</strong></span>
                                <span class="text-muted">Balance: <strong id="add-pay-summary-balance" style="color: var(--danger);">0.00</strong></span>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="action-btn" id="qa-cancel-add-expense-btn">Cancel</button>
                <button type="submit" form="add-expense-form" class="primary-btn" id="save-add-expense-btn">Save Expense</button>
            </div>
        </div>
    </div>`;
        document.body.appendChild(div.firstElementChild);
    }

    function populateSelect(id, items, allLabel) {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = (allLabel ? `<option value="">${allLabel}</option>` : '<option></option>')
            + items.map(i => `<option value="${i.id}">${i.name}</option>`).join('');
    }

    function toDateInputValue(d) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    async function generateExpNo(forDate) {
        const year = new Date(forDate).getFullYear();
        const { data: storeRow } = await window.supabaseClient.from('store').select('url').eq('id', activeStoreId).maybeSingle();
        const urlPart = (storeRow?.url || 'STORE').toString().trim();
        const prefix = `EXP-${urlPart}-${year}-`;

        const { data } = await window.supabaseClient
            .from('expenses').select('exp_no')
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

    async function uploadAttachments(expenseId, fileList) {
        const files = Array.from(fileList || []);
        if (!files.length) return { failures: [] };
        const failures = [];
        for (const file of files) {
            const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const path = `expenses/${expenseId}/${Date.now()}-${safeName}`;
            const { error: uploadErr } = await window.supabaseClient.storage
                .from('media').upload(path, file, { cacheControl: '3600', upsert: false });
            if (uploadErr) { failures.push({ name: file.name, error: uploadErr.message }); continue; }
            const { error: mediaErr } = await window.supabaseClient.from('media').insert({
                table_ref: 3, // expenses
                table_ref_id: expenseId,
                path,
                file_name: file.name,
                created_by: await window.getCurrentContactId()
            });
            if (mediaErr) failures.push({ name: file.name, error: mediaErr.message });
        }
        return { failures };
    }

    async function loadLookups() {
        activeStoreId = await window.getActiveStoreId();
        const [{ data: categories }, { data: suppliers }, { data: payMethods }] = await Promise.all([
            window.supabaseClient.from('expenses_category').select('id, name, iso, is_deletable').order('name'),
            window.supabaseClient
                .from('store_contact')
                .select('id, contact (id, name), role!inner (name)')
                .eq('store', activeStoreId)
                .ilike('role.name', 'supplier'),
            window.supabaseClient.from('pay_method').select('id, name').order('name')
        ]);
        categoriesCache = categories || [];
        suppliersCache = (suppliers || []).filter(s => s.contact);
        payMethodCache = payMethods || [];

        populateSelect('expense-category', categoriesCache);
        populateSelect('expense-supplier', suppliersCache.map(s => ({ id: s.id, name: s.contact.name })));
        populateSelect('add-pay-method', payMethodCache);
    }

    function renderStagedTable() {
        const tbody = document.getElementById('add-pay-tbody');
        if (!tbody) return;
        if (!stagedPayments.length) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-muted" style="text-align:center; padding:12px;">No payments added yet.</td></tr>`;
        } else {
            tbody.innerHTML = stagedPayments.map((p, idx) => {
                const methodName = payMethodCache.find(m => String(m.id) === String(p.pay_method))?.name || '-';
                return `
                    <tr>
                        <td>${p.date ? window.formatDateOnly(p.date) : '-'}</td>
                        <td>${methodName}</td>
                        <td>${p.pay_ref || '-'}</td>
                        <td>${p.note || '-'}</td>
                        <td class="text-right" style="font-weight:600; color: var(--success);">${Number(p.rm_pay || 0).toFixed(2)}</td>
                        <td class="text-right"><button type="button" class="icon-action delete qa-pay-remove-btn" data-idx="${idx}"><i class="fa-solid fa-trash"></i></button></td>
                    </tr>`;
            }).join('');
        }
        tbody.querySelectorAll('.qa-pay-remove-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                stagedPayments.splice(parseInt(btn.getAttribute('data-idx'), 10), 1);
                renderStagedTable();
                updatePaySummary();
            });
        });
    }

    function updatePaySummary() {
        const amount = parseFloat(document.getElementById('expense-amount')?.value) || 0;
        const paid = stagedPayments.reduce((s, p) => s + (Number(p.rm_pay) || 0), 0);
        document.getElementById('add-pay-summary-amount').textContent = amount.toFixed(2);
        document.getElementById('add-pay-summary-paid').textContent = paid.toFixed(2);
        document.getElementById('add-pay-summary-balance').textContent = (amount - paid).toFixed(2);
    }

    async function resolveTellerScId() {
        const contactId = await window.getCurrentContactId();
        const { data } = await window.supabaseClient
            .from('store_contact')
            .select('id')
            .eq('store', activeStoreId)
            .eq('contact', contactId)
            .maybeSingle();
        return data?.id || null;
    }

    function wireStageForm() {
        const stageBtn = document.getElementById('add-pay-stage-btn');
        if (!stageBtn) return;
        stageBtn.addEventListener('click', () => {
            const methodId = document.getElementById('add-pay-method').value;
            const dateVal = document.getElementById('add-pay-date').value;
            const amount = parseFloat(document.getElementById('add-pay-amount').value);
            const ref = document.getElementById('add-pay-ref').value.trim();
            const note = document.getElementById('add-pay-note').value.trim();

            if (isNaN(amount) || amount <= 0) { alert('Please enter a valid payment amount.'); return; }

            const expenseAmount = parseFloat(document.getElementById('expense-amount').value) || 0;
            const alreadyStaged = stagedPayments.reduce((s, p) => s + (Number(p.rm_pay) || 0), 0);
            const balance = expenseAmount - alreadyStaged;

            if (amount > balance + 0.001) {
                alert(`Amount cannot exceed the outstanding balance of RM ${Math.max(0, balance).toFixed(2)}.`);
                return;
            }

            stagedPayments.push({
                pay_method: methodId || null,
                date: dateVal || toDateInputValue(new Date()),
                rm_pay: amount,
                pay_ref: ref || null,
                note: note || null
            });

            document.getElementById('add-pay-amount').value = '';
            document.getElementById('add-pay-ref').value = '';
            document.getElementById('add-pay-note').value = '';

            renderStagedTable();
            updatePaySummary();
        });

        document.getElementById('expense-amount').addEventListener('input', updatePaySummary);
    }

    function wireForm() {
        const modal = document.getElementById('qa-shared-add-expense-modal');
        const closeBtn = document.getElementById('qa-close-add-expense-btn');
        const cancelBtn = document.getElementById('qa-cancel-add-expense-btn');
        const form = document.getElementById('add-expense-form');
        const dateInput = document.getElementById('expense-date');
        const refPreview = document.getElementById('expense-ref-preview');

        const close = () => modal && modal.classList.remove('active');
        if (closeBtn) closeBtn.addEventListener('click', close);
        if (cancelBtn) cancelBtn.addEventListener('click', close);
        if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

        dateInput.addEventListener('change', async () => {
            if (dateInput.value) refPreview.value = await generateExpNo(dateInput.value);
        });

        wireStageForm();

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('save-add-expense-btn');
            const originalText = submitBtn.innerHTML;

            const dateVal = dateInput.value;
            const supplierId = document.getElementById('expense-supplier').value;
            const categoryId = document.getElementById('expense-category').value;
            const amount = parseFloat(document.getElementById('expense-amount').value);

            if (!dateVal || !supplierId || isNaN(amount)) {
                alert('Date, Supplier, and Amount are required.');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

            const basePayload = {
                date: dateVal,
                supplier: supplierId,
                category: categoryId || null,
                amount,
                status: parseInt(document.getElementById('expense-status').value, 10) || 1,
                note: document.getElementById('expense-note').value.trim(),
            };

            const MAX_ATTEMPTS = 3;
            let error = null, inserted = null;
            for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
                const expNo = await generateExpNo(dateVal);
                const { data, error: insertErr } = await window.supabaseClient
                    .from('expenses')
                    .insert({ ...basePayload, exp_no: expNo })
                    .select('id')
                    .single();

                if (!insertErr) { inserted = data; error = null; break; }
                if (insertErr.code === '23505' && attempt < MAX_ATTEMPTS) continue;
                error = insertErr;
                break;
            }

            if (error) {
                alert(error.code === '23505'
                    ? 'Could not generate a unique reference number, please try saving again.'
                    : 'Failed to save expense.');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                return;
            }

            if (stagedPayments.length) {
                const tellerScId = await resolveTellerScId();
                const { error: payErr } = await window.supabaseClient.from('expenses_payment').insert(
                    stagedPayments.map(p => ({
                        expenses: inserted.id,
                        pay_method: p.pay_method,
                        date: p.date,
                        rm_pay: p.rm_pay,
                        pay_ref: p.pay_ref,
                        note: p.note,
                        teller: tellerScId
                    }))
                );
                if (payErr) alert('Expense saved, but one or more payments failed to save: ' + payErr.message);
            }

            const fileInput = document.getElementById('expense-attachments');
            const { failures } = await uploadAttachments(inserted.id, fileInput.files);
            if (failures.length) {
                alert(`Expense saved, but ${failures.length} attachment(s) failed to upload:\n` +
                    failures.map(f => `- ${f.name}: ${f.error}`).join('\n'));
            }

            submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Saved!';
            submitBtn.style.backgroundColor = 'var(--success)';
            setTimeout(async () => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                submitBtn.style.backgroundColor = '';
                close();

                // Refresh the Expenses page's own list if it happens to be loaded.
                if (typeof window.fetchAndRenderExpenses === 'function') {
                    if (typeof window.expensesCurrentPage !== 'undefined') window.expensesCurrentPage = 1;
                    await window.fetchAndRenderExpenses();
                }
            }, 800);
        });
    }

    async function open() {
        injectModalHtml();

        if (!initialized) {
            await loadLookups();
            wireForm();
            initialized = true;
        } else {
            activeStoreId = await window.getActiveStoreId();
            await loadLookups(); // categories/suppliers/pay methods can change between opens
        }

        const modal = document.getElementById('qa-shared-add-expense-modal');
        const form = document.getElementById('add-expense-form');
        form.querySelectorAll('input, select, textarea').forEach(el => {
            if (el.id !== 'expense-status') el.value = '';
            if (typeof jQuery !== 'undefined' && el.classList.contains('select2-search')) $(el).val(null).trigger('change');
        });
        document.getElementById('expense-attachments').value = '';

        stagedPayments = [];
        document.getElementById('add-pay-date').value = toDateInputValue(new Date());
        renderStagedTable();
        updatePaySummary();

        const todayStr = toDateInputValue(new Date());
        document.getElementById('expense-date').value = todayStr;
        const refPreview = document.getElementById('expense-ref-preview');
        refPreview.value = 'Generating...';
        refPreview.value = await generateExpNo(todayStr);

        modal.classList.add('active');
        if (typeof window.initializeSelect2 === 'function') window.initializeSelect2();
        if (typeof jQuery !== 'undefined') {
            $('#expense-supplier, #expense-category, #expense-status, #add-pay-method').each(function () {
                if (!$(this).hasClass('select2-hidden-accessible')) {
                    $(this).select2({ width: '100%', dropdownParent: $(modal) });
                }
            });
        }
    }

    return { open };
})();