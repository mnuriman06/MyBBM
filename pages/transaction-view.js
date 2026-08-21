// pages/transaction-view.js

const TV_STATUS_LABELS = { 1: 'Waiting', 2: 'Shipping', 3: 'Completed' };

let tvTransId = null;
let tvTrans = null;
let tvTransType = null;
let tvIsRmBearing = false;
let tvStoreProductsCache = [];
let tvShipperCache = [];
let tvTaxCache = [];
let tvPayMethodCache = [];
let tvContactsCache = [];
let tvStaffCache = [];
let tvCompanyCache = null;
let tvStoreDetailsCache = null;
let tvTellerName = '-';
let tvItems = [];
let tvPayments = [];
let tvCurrentContactId = null;

function render_transaction_view() {
    return `<div class="dashboard-body">
        <div class="page-header" style="margin-bottom: 24px;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <a href="#" data-link="transaction" class="back-btn" title="Back to Transactions"><i class="fa-solid fa-arrow-left"></i></a>
                <h1 style="margin: 0;">Transaction <span id="tv-trans-no">-</span></h1>
            </div>
            <div style="display: flex; gap: 12px;">
                <button class="outline-btn" id="tv-delete-btn" style="color: var(--danger); border-color: var(--danger);"><i class="fa-solid fa-trash"></i> Delete</button>
                <div class="tv-print-dropdown" style="position: relative; display: inline-block;">
                    <button type="button" class="outline-btn" id="tv-print-dropdown-btn">
                        <i class="fa-solid fa-print"></i> Print <i class="fa-solid fa-chevron-down" style="font-size: 0.7em; margin-left: 4px;"></i>
                    </button>
                    <div id="tv-print-dropdown-menu" style="display: none; position: absolute; top: 110%; right: 0; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); box-shadow: var(--shadow-lg); min-width: 160px; z-index: 200; overflow: hidden;">
                        <a href="#" id="tv-print-receipt-link" style="display: flex; align-items: center; gap: 8px; padding: 10px 16px; color: var(--text-main); text-decoration: none; font-size: 0.9rem;"><i class="fa-solid fa-receipt" style="width: 16px;"></i> Receipt</a>
                        <a href="#" id="tv-print-a4-link" style="display: flex; align-items: center; gap: 8px; padding: 10px 16px; color: var(--text-main); text-decoration: none; font-size: 0.9rem; border-top: 1px solid var(--border-color);"><i class="fa-solid fa-file-lines" style="width: 16px;"></i> A4</a>
                    </div>
                </div>
                <button id="tv-save-btn" class="primary-btn"><i class="fa-solid fa-floppy-disk"></i> Save Changes</button>
            </div>
        </div>

        <div class="data-card">
            <div style="padding: 24px;">

                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 24px;">
                    <div class="form-group" style="margin: 0;">
                        <label class="form-label">Type</label>
                        <input type="text" id="tv-type-display" class="form-input" readonly disabled>
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label class="form-label">Date</label>
                        <input type="text" id="tv-date-display" class="form-input" readonly disabled>
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label class="form-label">Status</label>
                        <select id="tv-status" class="select2-search" style="width: 100%;">
                            <option value="1">Waiting</option>
                            <option value="2">Shipping</option>
                            <option value="3">Completed</option>
                        </select>
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label class="form-label">Teller</label>
                        <select id="tv-teller-select" class="select2-search" style="width: 100%;"></select>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; margin-bottom: 24px;">
                    <div class="form-group" id="tv-contact-section" style="margin: 0; display: none;">
                        <label class="form-label" id="tv-contact-label">Customer</label>
                        <select id="tv-contact-select" class="select2-search" style="width: 100%;"></select>
                    </div>
                    <div id="tv-internal-note" style="display: none; align-self: center;">
                        <span class="status role-fallback">Internal transaction — no counterparty</span>
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label class="form-label">Note</label>
                        <input type="text" id="tv-note-input" class="form-input" placeholder="Add a note...">
                    </div>
                </div>

                <!-- Add Item -->
                <div style="display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 16px; align-items: end; margin-bottom: 24px; padding: 16px; background: var(--bg-main); border-radius: 8px; border: 1px dashed var(--border-color);">
                    <div class="form-group" style="margin: 0;">
                        <label class="form-label">Add New Item</label>
                        <select id="tv-add-product-select" class="select2-search" style="width: 100%;" data-placeholder="Select Product"><option></option></select>
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label class="form-label">Qty</label>
                        <input type="text" id="tv-add-qty" class="form-input" value="1">
                    </div>
                    <div class="form-group" id="tv-add-price-group" style="margin: 0;">
                        <label class="form-label">Price (RM)</label>
                        <input type="text" id="tv-add-price" class="form-input" value="0.00">
                    </div>
                    <button type="button" class="primary-btn" id="tv-add-item-btn" style="height: 46px;"><i class="fa-solid fa-plus"></i> Add</button>
                </div>

                <!-- Items -->
                <table class="data-table" style="margin-bottom: 24px;">
                    <thead><tr id="tv-items-head"></tr></thead>
                    <tbody id="tv-items-body"></tbody>
                </table>

                <!-- Summary -->
                <div id="tv-summary-section" style="display: none; margin-bottom: 24px;">
                    <div class="summary-box" style="width: 100%; min-width: 0;">
                        <div class="summary-row">
                            <span class="text-muted">Subtotal</span>
                            <span id="tv-subtotal" style="font-weight: 600;">0.00</span>
                        </div>
                        <div class="summary-row" style="font-size: 0.85rem; align-items: center;">
                            <table style="width: 100%;">
                                <tbody>
                                    <tr>
                                        <td width="15%"><span class="text-muted">Shipping</span></td>
                                        <td width="70%"><select id="tv-shipper-select" class="select2-search"></select></td>
                                        <td width="15%" style="text-align: right;"><input type="text" id="tv-shipping" class="form-input text-right" style="width: 100px; padding: 4px 8px; font-size: 0.85rem; height: auto;" value="0.00"></td>
                                    </tr>
                                    <tr>
                                        <td width="15%"><span class="text-muted">Tax</span></td>
                                        <td width="70%"><select id="tv-tax-select" class="select2-search"></select></td>
                                        <td width="15%" style="text-align: right;"><span id="tv-tax-amount" style="font-weight: 500;">0.00</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="summary-row" style="font-size: 0.85rem; align-items: center;">
                            <span class="text-muted">Discount</span>
                            <input type="text" id="tv-discount" class="form-input text-right" style="width: 100px; padding: 4px 8px; font-size: 0.85rem; height: auto; color: var(--danger);" value="0.00">
                        </div>
                        <div class="summary-row" style="font-size: 0.85rem; align-items: center;">
                            <span class="text-muted">Rounding</span>
                            <span id="tv-rounding-amount" style="font-weight: 500;">0.00</span>
                        </div>
                        <div class="summary-row total">
                            <span>Amount To Pay</span>
                            <span id="tv-grand-total">RM 0.00</span>
                        </div>
                        <div class="summary-row" style="margin-top: 12px;">
                            <span class="text-muted">Payment Received</span>
                            <span id="tv-payment-received" style="font-weight: 600; color: var(--success);">0.00</span>
                        </div>
                        <div class="summary-row">
                            <span class="text-muted">Balance Due</span>
                            <span id="tv-balance-due" style="font-weight: 600;">0.00</span>
                        </div>
                    </div>
                </div>

                <!-- Payment History -->
                <div id="tv-payment-section" style="display: none;">
                    <h3 style="font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); border-bottom: 1px solid var(--border-color); padding-bottom: 8px; margin-bottom: 16px;">Payment History</h3>

                    <div style="display: grid; grid-template-columns: 2fr 2fr 2fr 2fr 2fr 1fr; gap: 12px; margin-bottom: 8px; align-items: end; background: var(--bg-main); padding: 16px; border-radius: 8px; border: 1px dashed var(--border-color);">
                        <div>
                            <label class="form-label" style="font-size: 0.8rem; margin-bottom: 4px; display: block;">Payment Method</label>
                            <select id="tv-new-pay-method" class="select2-search" style="width: 100%;"></select>
                        </div>
                        <div>
                            <label class="form-label" style="font-size: 0.8rem; margin-bottom: 4px; display: block;">Date & Time</label>
                            <input type="datetime-local" id="tv-new-pay-date" step="1" class="form-input" style="height: 38px; padding: 6px 12px; font-size: 0.9rem;">
                        </div>
                        <div>
                            <label class="form-label" style="font-size: 0.8rem; margin-bottom: 4px; display: block;">RM Pay</label>
                            <input type="text" id="tv-new-pay-amount" class="form-input" style="height: 38px; padding: 6px 12px; font-size: 0.9rem;" placeholder="0.00">
                        </div>
                        <div>
                            <label class="form-label" style="font-size: 0.8rem; margin-bottom: 4px; display: block;">Pay Ref</label>
                            <input type="text" id="tv-new-pay-ref" class="form-input" style="height: 38px; padding: 6px 12px; font-size: 0.9rem;" placeholder="e.g. Ref-1234">
                        </div>
                        <div>
                            <label class="form-label" style="font-size: 0.8rem; margin-bottom: 4px; display: block;">Note</label>
                            <input type="text" id="tv-new-pay-note" class="form-input" style="height: 38px; padding: 6px 12px; font-size: 0.9rem;" placeholder="Optional note">
                        </div>
                        <button id="tv-add-payment-btn" class="primary-btn" style="height: 38px;"><i class="fa-solid fa-plus"></i></button>
                    </div>
                    <p id="tv-pay-balance-hint" class="text-muted text-sm" style="margin: 0 0 16px 0;"></p>

                    <table class="invoice-table" style="font-size: 0.85rem;">
                        <thead>
                            <tr>
                                <th>Date & Time</th>
                                <th>Method</th>
                                <th>Pay Ref</th>
                                <th>Note</th>
                                <th class="text-right">Amount (RM)</th>
                                <th class="text-right" style="width: 80px;">Action</th>
                            </tr>
                        </thead>
                        <tbody id="tv-payment-body"></tbody>
                    </table>
                </div>

            </div>
        </div>
    </div>

    <div class="modal-overlay" id="tv-delete-confirm-modal">
        <div class="modal-content small-modal">
            <div class="modal-title"><i class="fa-solid fa-triangle-exclamation" style="color: var(--danger); margin-right: 8px;"></i> Delete Transaction</div>
            <div class="modal-text">Are you sure you want to delete this transaction? All items and payments will be permanently removed. This cannot be undone.</div>
            <div class="modal-actions">
                <button class="btn-modal-yes" id="tv-confirm-delete-btn">YES, DELETE</button>
                <button class="btn-modal-no" onclick="document.getElementById('tv-delete-confirm-modal').classList.remove('active')">CANCEL</button>
            </div>
        </div>
    </div>`;
}

window.init_transaction_view = async function() {
    tvTransId = localStorage.getItem('view_trans_id');
    if (!tvTransId) { navigateTo('transaction'); return; }

    const activeStoreId = await window.getActiveStoreId();
    tvCurrentContactId = await window.getCurrentContactId();

    const [{ data: trans, error }, { data: storeProducts }, { data: taxes }, { data: payMethods }, { data: contacts }, { data: shippers }, { data: company }, { data: storeDetails }] = await Promise.all([
        window.supabaseClient.from('trans').select(`
            id, trans_no, date, rm_discount, type, status, note,
            trans_type (id, name, iso, ope_rm, ope_qty),
            contact_sc:store_contact!trans_contact_fkey (id, contact (id, name)),
            teller_sc:store_contact!trans_teller_fkey (id, contact (id, name)),
            trans_product (id, store_product, qty_order, price_final),
            trans_ship (id, amount, shipper),
            trans_tax (id, tax, amount),
            trans_payment (id, pay_ref, date, rm_pay, note, pay_method (id, name))
        `).eq('id', tvTransId).maybeSingle(),
        window.supabaseClient.from('store_product').select('id, qty_bal, product (id, sku, name, price_cost, price_retail, stock_control, uom (id, name, iso))').eq('store', activeStoreId),
        window.supabaseClient.from('tax').select('id, name, percentage').order('name'),
        window.supabaseClient.from('pay_method').select('id, name').order('name'),
        
        window.supabaseClient.from('store_contact').select('id, contact (id, name), role (name)').eq('store', activeStoreId),
        window.supabaseClient.from('shipper').select('id, name').order('name'),
        window.supabaseClient.from('company').select('id, name, ssm, tel, email, web, address, state (id, name)').limit(1).maybeSingle(),
        window.supabaseClient.from('store').select('id, name, url, email, tel, address').eq('id', activeStoreId).maybeSingle()
    ]);

    if (error || !trans) {
        alert('Transaction not found.');
        navigateTo('transaction');
        return;
    }

    tvTrans = trans;
    tvTransType = trans.trans_type;
    tvIsRmBearing = !!(tvTransType?.ope_rm && tvTransType.ope_rm.trim());
    tvStoreProductsCache = (storeProducts || []).filter(sp => sp.product);
    tvShipperCache = shippers || [];
    tvTaxCache = taxes || [];
    tvPayMethodCache = payMethods || [];
    const allStoreContacts = (contacts || []).filter(c => c.contact);
    tvContactsCache = allStoreContacts.filter(c => ['customer', 'supplier'].includes((c.role?.name || '').toLowerCase()));
    tvStaffCache = allStoreContacts.filter(c => ['admin', 'manager', 'cashier'].includes((c.role?.name || '').toLowerCase()));
    tvShipperCache = shippers || [];
    tvCompanyCache = company || null;
    tvStoreDetailsCache = storeDetails || null;
    tvTellerName = trans.teller_sc?.contact?.name || '-';

    tvItems = (trans.trans_product || []).map(tp => {
        const sp = tvStoreProductsCache.find(s => s.id === tp.store_product);
        return {
            id: tp.id,
            store_product_id: tp.store_product,
            name: sp?.product?.name || '(deleted product)',
            sku: sp?.product?.sku || '',
            uom: sp?.product?.uom?.iso || '',
            price: Number(tp.price_final) || 0,
            qty: Number(tp.qty_order) || 0,
            stock_control: sp?.product?.stock_control ?? 0
        };
    });
    tvPayments = trans.trans_payment || [];

    populateHeader();
    populateContactSection();
    renderItems();
    renderSummarySection();
    renderPaymentSection();

    wireHeaderControls();
    wireItemControls();
    wireSummaryControls();
    wirePaymentControls();
    wireDeleteFlow();
    wireSaveButton();
    wirePrintDropdown();

    if (typeof window.initializeSelect2 === 'function') window.initializeSelect2();
};

function populateHeader() {
    document.getElementById('tv-trans-no').textContent = tvTrans.trans_no || '-';
    const typeDisplay = document.getElementById('tv-type-display');
    if (typeDisplay) typeDisplay.value = tvTransType?.name || '-';
    const dateDisplay = document.getElementById('tv-date-display');
    if (dateDisplay) dateDisplay.value = tvTrans.date ? window.formatDateTime(tvTrans.date) : '-';

    const statusSel = document.getElementById('tv-status');
    statusSel.value = String(tvTrans.status || 1);
    if (typeof jQuery !== 'undefined') $(statusSel).trigger('change');

    const tellerSel = document.getElementById('tv-teller-select');
    if (tellerSel) {
        tellerSel.innerHTML = '<option value=""></option>' +
            tvStaffCache.map(s => `<option value="${s.id}">${s.contact.name}</option>`).join('');
        tellerSel.value = tvTrans.teller_sc?.id || '';
        if (typeof jQuery !== 'undefined') $(tellerSel).trigger('change');
    }

    const noteInput = document.getElementById('tv-note-input');
    if (noteInput) noteInput.value = tvTrans.note || '';
}

function populateContactSection() {
    const contactSection = document.getElementById('tv-contact-section');
    const internalNote = document.getElementById('tv-internal-note');
    const typeName = tvTransType?.name;

    if (typeName === 'Purchase' || typeName === 'Sales') {
        contactSection.style.display = 'flex';
        document.getElementById('tv-contact-label').textContent = typeName === 'Purchase' ? 'Supplier' : 'Customer';

        const sel = document.getElementById('tv-contact-select');
        const relevantContacts = tvContactsCache.filter(c =>
            (typeName === 'Purchase' && (c.role?.name || '').toLowerCase() === 'supplier') ||
            (typeName === 'Sales' && (c.role?.name || '').toLowerCase() === 'customer')
        );
        // Null contact on a Sales trans means walk-in — show that instead of a blank option.
        const emptyLabel = typeName === 'Sales' ? 'Cash Customer' : 'Select supplier...';
        sel.innerHTML = `<option value="">${emptyLabel}</option>` +
            relevantContacts.map(c => `<option value="${c.id}">${c.contact.name}</option>`).join('');
        sel.value = tvTrans.contact_sc?.id || '';
        if (typeof jQuery !== 'undefined') $(sel).trigger('change');
    } else {
        internalNote.style.display = 'flex';
    }
}

// --- Items ---
function renderItems() {
    const tbody = document.getElementById('tv-items-body');
    const head = document.getElementById('tv-items-head');

    if (!tvIsRmBearing) {
        head.innerHTML = `<th style="width: 70%;">Item</th><th class="text-right" style="width: 15%;">Qty</th><th class="text-right" style="width: 15%;">Action</th>`;
    } else {
        head.innerHTML = `<th style="width: 40%;">Item</th><th class="text-right" style="width: 15%;">Qty</th><th class="text-right" style="width: 15%;">Unit Price (RM)</th><th class="text-right" style="width: 15%;">Total (RM)</th><th class="text-right" style="width: 15%;">Action</th>`;
    }

    if (!tvItems.length) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-muted" style="text-align:center; padding:16px;">No items yet. Use the form above to add one.</td></tr>`;
        return;
    }

    tbody.innerHTML = tvItems.map((item, idx) => {
        const label = `${item.name || '(unknown product)'}${item.sku ? ` <span class="text-muted text-sm font-mono">(${item.sku})</span>` : ''}`;
        if (!tvIsRmBearing) {
            return `
                <tr data-idx="${idx}">
                    <td>${label}</td>
                    <td class="text-right"><input type="text" class="form-input item-qty-input text-right" style="width: 90px; padding: 6px 8px; display: inline-block;" value="${item.qty}"></td>
                    <td class="text-right"><button type="button" class="outline-btn item-delete-btn" style="display: inline-flex; padding: 6px 12px; color: var(--danger); border-color: var(--danger);"><i class="fa-solid fa-trash"></i></button></td>
                </tr>
            `;
        }
        return `
            <tr data-idx="${idx}">
                <td>${label}</td>
                <td class="text-right"><input type="text" class="form-input item-qty-input text-right" style="width: 90px; padding: 6px 8px; display: inline-block;" value="${item.qty}"></td>
                <td class="text-right"><input type="text" class="form-input item-price-input text-right" style="width: 100px; padding: 6px 8px; display: inline-block;" value="${item.price.toFixed(2)}"></td>
                <td class="text-right" style="font-weight: 600;"><span class="item-row-total">${tvLineTotal(item)}</span></td>
                <td class="text-right"><button type="button" class="outline-btn item-delete-btn" style="display: inline-flex; padding: 6px 12px; color: var(--danger); border-color: var(--danger);"><i class="fa-solid fa-trash"></i></button></td>
            </tr>
        `;
    }).join('');

    wireItemRowListeners();
}

// Editable qty/price cells wired per row — clamps outbound qty against stock,
// same as the add-item form, and recomputes that row's total + the summary live.
function wireItemRowListeners() {
    document.querySelectorAll('#tv-items-body tr[data-idx]').forEach(row => {
        const idx = parseInt(row.getAttribute('data-idx'), 10);
        const item = tvItems[idx];
        const qtyInput = row.querySelector('.item-qty-input');
        const priceInput = row.querySelector('.item-price-input');
        const totalSpan = row.querySelector('.item-row-total');
        const deleteBtn = row.querySelector('.item-delete-btn');

        if (qtyInput) {
            const applyQty = () => {
                let qty = parseFloat(qtyInput.value) || 0;
                if (qty <= 0) qty = item.qty;

                const isOutbound = tvOpeQtySign() === '-' && item.stock_control !== 1;
                const sp = tvStoreProductsCache.find(s => String(s.id) === String(item.store_product_id));
                const available = Number(sp?.qty_bal) || 0;
                if (isOutbound && qty > available) {
                    alert(`Only ${available.toFixed(0)} unit(s) of "${item.name}" available.`);
                    qty = available > 0 ? available : item.qty;
                }

                item.qty = qty;
                qtyInput.value = qty;
                if (totalSpan) totalSpan.textContent = tvLineTotal(item);
                renderSummarySection();
            };
            qtyInput.addEventListener('change', applyQty);
            qtyInput.addEventListener('blur', applyQty);
        }

        if (priceInput) {
            const applyPrice = () => {
                const price = parseFloat(priceInput.value) || 0;
                item.price = price;
                priceInput.value = price.toFixed(2);
                if (totalSpan) totalSpan.textContent = tvLineTotal(item);
                renderSummarySection();
            };
            priceInput.addEventListener('change', applyPrice);
            priceInput.addEventListener('blur', applyPrice);
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                tvItems.splice(idx, 1);
                renderItems();
                renderSummarySection();
                refreshTvAddProductOptions();
            });
        }
    });
}

function tvOpeQtySign() {
    return tvTransType?.ope_qty ? tvTransType.ope_qty.trim() : '';
}

// Rebuilds the Add Item dropdown to only show products not already on the list.
function refreshTvAddProductOptions() {
    const productSelect = document.getElementById('tv-add-product-select');
    if (!productSelect) return;

    const usedIds = new Set(tvItems.map(i => String(i.store_product_id)));
    const available = tvStoreProductsCache.filter(sp => !usedIds.has(String(sp.id)));

    const currentVal = productSelect.value;
    productSelect.innerHTML = '<option></option>' + available.map(sp =>
        `<option value="${sp.id}">${sp.product.name} (${sp.product.sku || 'no SKU'})</option>`
    ).join('');

    // Keep the current selection only if it's still eligible (e.g. after a failed add attempt)
    productSelect.value = available.some(sp => String(sp.id) === currentVal) ? currentVal : '';
    if (typeof jQuery !== 'undefined') $(productSelect).trigger('change.select2');
}

function wireItemControls() {
    const productSelect = document.getElementById('tv-add-product-select');
    const qtyInput = document.getElementById('tv-add-qty');
    const priceInput = document.getElementById('tv-add-price');
    const priceGroup = document.getElementById('tv-add-price-group');
    const addBtn = document.getElementById('tv-add-item-btn');

    refreshTvAddProductOptions();

    if (priceGroup) priceGroup.style.display = tvIsRmBearing ? 'flex' : 'none';

    if (typeof jQuery !== 'undefined') {
        $(productSelect).on('change', function() {
            const sp = tvStoreProductsCache.find(s => String(s.id) === this.value);
            if (sp && tvIsRmBearing) {
                const defaultPrice = tvTransType?.name === 'Purchase' ? sp.product.price_cost : sp.product.price_retail;
                priceInput.value = (Number(defaultPrice) || 0).toFixed(2);
            }
        });
    }

    addBtn.addEventListener('click', () => {
        const spId = productSelect.value;
        if (!spId) { alert('Please select an item.'); return; }
        const sp = tvStoreProductsCache.find(s => String(s.id) === spId);
        if (!sp) return;

        const qty = parseFloat(qtyInput.value) || 0;
        if (qty <= 0) { alert('Please enter a valid quantity.'); return; }

        const isInfinite = sp.product.stock_control === 1;
        const isOutbound = tvOpeQtySign() === '-' && !isInfinite;
        const available = Number(sp.qty_bal) || 0;
        if (isOutbound && qty > available) {
            alert(`Only ${available.toFixed(0)} unit(s) of "${sp.product.name}" available.`);
            return;
        }

        const price = tvIsRmBearing ? (parseFloat(priceInput.value) || 0) : 0;

        tvItems.push({ id: null, store_product_id: sp.id, name: sp.product.name, sku: sp.product.sku, price, qty, stock_control: sp.product.stock_control ?? 0 });

        productSelect.value = '';
        qtyInput.value = '1';
        priceInput.value = '0.00';

        renderItems();
        renderSummarySection();
        refreshTvAddProductOptions();
    });

    if (typeof window.initializeSelect2 === 'function') window.initializeSelect2();
}

// --- Summary ---
function computeTvBalance() {
    const subtotal = tvRound2(tvItems.reduce((s, i) => s + tvLineTotal(i), 0));
    const shipping = tvRound2(parseFloat(document.getElementById('tv-shipping')?.value) || 0);
    const taxSelId = document.getElementById('tv-tax-select')?.value || '';
    const taxRecord = tvTaxCache.find(t => String(t.id) === taxSelId);
    const taxAmount = tvRound2(taxRecord ? subtotal * (Number(taxRecord.percentage) || 0) : 0);
    const discount = tvRound2(parseFloat(document.getElementById('tv-discount')?.value) || 0);
    const preRoundTotal = tvRound2(subtotal + shipping + taxAmount - discount);
    const { rounded: grandTotal } = window.computeBnmRounding(preRoundTotal);
    const paid = tvRound2(tvPayments.reduce((s, p) => s + (Number(p.rm_pay) || 0), 0));
    return grandTotal - paid;
}

function renderSummarySection() {
    const summarySection = document.getElementById('tv-summary-section');
    const paymentSection = document.getElementById('tv-payment-section');

    if (!tvIsRmBearing) {
        summarySection.style.display = 'none';
        paymentSection.style.display = 'none';
        return;
    }
    summarySection.style.display = 'block';
    paymentSection.style.display = 'block';

    const subtotal = tvRound2(tvItems.reduce((s, i) => s + tvLineTotal(i), 0));
    const shipping = tvRound2(parseFloat(document.getElementById('tv-shipping')?.value) || 0);
    const taxSelId = document.getElementById('tv-tax-select')?.value || '';
    const taxRecord = tvTaxCache.find(t => String(t.id) === taxSelId);
    const taxAmount = tvRound2(taxRecord ? subtotal * (Number(taxRecord.percentage) || 0) : 0);
    const discount = tvRound2(parseFloat(document.getElementById('tv-discount')?.value) || 0);
    const preRoundTotal = tvRound2(subtotal + shipping + taxAmount - discount);
    const { rounded: grandTotal, rounding } = window.computeBnmRounding(preRoundTotal);
    const paid = tvRound2(tvPayments.reduce((s, p) => s + (Number(p.rm_pay) || 0), 0));
    const balance = tvRound2(grandTotal - paid);

    document.getElementById('tv-subtotal').textContent = subtotal.toFixed(2);
    document.getElementById('tv-tax-amount').textContent = taxAmount.toFixed(2);
    const roundingEl = document.getElementById('tv-rounding-amount');
    if (roundingEl) roundingEl.textContent = (rounding >= 0 ? '+' : '') + rounding.toFixed(2);
    document.getElementById('tv-grand-total').textContent = 'RM ' + grandTotal.toFixed(2);
    document.getElementById('tv-payment-received').textContent = paid.toFixed(2);
    const balEl = document.getElementById('tv-balance-due');
    balEl.textContent = balance.toFixed(2);
    balEl.style.color = balance > 0 ? 'var(--danger)' : 'var(--success)';

    updateTvPaymentAvailability(balance);
}

function updateTvPaymentAvailability(balance) {
    const amountInput = document.getElementById('tv-new-pay-amount');
    const addBtn = document.getElementById('tv-add-payment-btn');
    const hint = document.getElementById('tv-pay-balance-hint');
    if (!amountInput || !addBtn) return;

    const clampedBalance = Math.max(0, balance);
    amountInput.max = clampedBalance.toFixed(2);
    const fullyPaid = balance <= 0.0001;
    addBtn.disabled = fullyPaid;
    amountInput.disabled = fullyPaid;
    if (hint) hint.textContent = fullyPaid ? 'This transaction is fully paid.' : `Outstanding balance: RM ${clampedBalance.toFixed(2)}`;
}

function wireSummaryControls() {
    if (!tvIsRmBearing) return;

    const shipVal = (tvTrans.trans_ship || []).reduce((s, sh) => s + (Number(sh.amount) || 0), 0);
    document.getElementById('tv-shipping').value = shipVal.toFixed(2);

    document.getElementById('tv-discount').value = (Number(tvTrans.rm_discount) || 0).toFixed(2);

    const shipperSel = document.getElementById('tv-shipper-select');
    if (shipperSel) {
        shipperSel.innerHTML = tvShipperCache.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        const existingShip = (tvTrans.trans_ship || [])[0];
        shipperSel.value = existingShip?.shipper ? String(existingShip.shipper) : '';
        if (typeof jQuery !== 'undefined') $(shipperSel).trigger('change');
    }

    const taxSel = document.getElementById('tv-tax-select');
    taxSel.innerHTML = tvTaxCache.map(t => `<option value="${t.id}">${t.name} (${(Number(t.percentage) * 100).toFixed(0)}%)</option>`).join('');
    const existingTax = (tvTrans.trans_tax || [])[0];
    if (existingTax) taxSel.value = String(existingTax.tax);
    if (typeof jQuery !== 'undefined') $(taxSel).trigger('change');

    ['tv-shipping', 'tv-discount'].forEach(id => {
        const el = document.getElementById(id);
        el.addEventListener('input', renderSummarySection);
        el.addEventListener('blur', () => { el.value = (parseFloat(el.value) || 0).toFixed(2); renderSummarySection(); });
    });
    if (typeof jQuery !== 'undefined') $(taxSel).on('change', renderSummarySection);

    renderSummarySection();
}

// --- Payments ---
function renderPaymentSection() {
    if (!tvIsRmBearing) return;
    const tbody = document.getElementById('tv-payment-body');
    if (!tvPayments.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-muted" style="text-align:center; padding:16px;">No payments recorded.</td></tr>`;
        return;
    }
    tbody.innerHTML = tvPayments.map(p => `
        <tr data-pay-id="${p.id}">
            <td>${p.date ? window.formatDateTime(p.date) : '-'}</td>
            <td>${p.pay_method?.name || '-'}</td>
            <td class="font-mono">${p.pay_ref || '-'}</td>
            <td>${p.note || '-'}</td>
            <td class="text-right" style="font-weight: 600; color: var(--success);">${Number(p.rm_pay || 0).toFixed(2)}</td>
            <td class="text-right"><button type="button" class="outline-btn tv-delete-payment-btn" style="display: inline-flex; color: var(--danger); border-color: var(--danger); padding: 4px 10px;" title="Delete payment"><i class="fa-solid fa-trash"></i></button></td>
        </tr>
    `).join('');

    tbody.querySelectorAll('.tv-delete-payment-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const payId = btn.closest('tr').getAttribute('data-pay-id');
            if (!confirm('Delete this payment? This cannot be undone.')) return;
            const { error } = await window.supabaseClient.from('trans_payment').delete().eq('id', payId);
            if (error) { alert('Failed to delete payment.'); return; }
            tvPayments = tvPayments.filter(p => String(p.id) !== String(payId));
            renderPaymentSection();
            renderSummarySection();
        });
    });
}

function wirePaymentControls() {
    if (!tvIsRmBearing) return;

    const methodSel = document.getElementById('tv-new-pay-method');
    methodSel.innerHTML = tvPayMethodCache.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
    document.getElementById('tv-new-pay-date').value = window.toDatetimeLocalInput(window.formatDateTime(new Date()));

    const addBtn = document.getElementById('tv-add-payment-btn');
    addBtn.addEventListener('click', async () => {
        const balance = computeTvBalance();
        if (balance <= 0.0001) { alert('This transaction is already fully paid.'); return; }

        const methodId = methodSel.value;
        const dateVal = window.fromDatetimeLocalInput(document.getElementById('tv-new-pay-date').value);
        const amount = parseFloat(document.getElementById('tv-new-pay-amount').value);
        const ref = document.getElementById('tv-new-pay-ref').value.trim();
        const note = document.getElementById('tv-new-pay-note').value.trim();

        if (isNaN(amount) || amount < 0) { alert('Please enter a valid payment amount.'); return; }
        if (amount > balance + 0.001) { alert(`Amount cannot exceed the outstanding balance of RM ${balance.toFixed(2)}.`); return; }

        addBtn.disabled = true;
        const tellerScId = await resolveTellerScId();

        const { data, error } = await window.supabaseClient.from('trans_payment').insert({
            trans: tvTransId,
            pay_method: methodId || null,
            date: dateVal,
            rm_pay: amount,
            pay_ref: ref || null,
            note: note || null,
            teller: tellerScId,
            payer: tvTrans.contact_sc?.id || null
        }).select('id, pay_ref, date, rm_pay, note, pay_method (id, name)').single();

        if (error) {
            alert('Failed to record payment.');
            addBtn.disabled = false;
            return;
        }

        tvPayments.push(data);
        document.getElementById('tv-new-pay-amount').value = '';
        document.getElementById('tv-new-pay-ref').value = '';
        document.getElementById('tv-new-pay-note').value = '';
        document.getElementById('tv-new-pay-date').value = window.toDatetimeLocalInput(window.formatDateTime(new Date()));
        renderPaymentSection();
        renderSummarySection();
    });
}

async function resolveTellerScId() {
    const activeStoreId = await window.getActiveStoreId();
    const { data } = await window.supabaseClient
        .from('store_contact')
        .select('id')
        .eq('store', activeStoreId)
        .eq('contact', tvCurrentContactId)
        .maybeSingle();
    return data?.id || null;
}

function wireHeaderControls() {
    // Status is saved as part of the main Save action; no immediate side effects needed here.
}

// --- Save ---
function wireSaveButton() {
    const saveBtn = document.getElementById('tv-save-btn');
    if (!saveBtn) return;

    saveBtn.addEventListener('click', async () => {
        const originalHtml = saveBtn.innerHTML;
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

        try {
            const status = parseInt(document.getElementById('tv-status').value, 10);
            let contactScId = null;
            if (tvTransType?.name === 'Purchase' || tvTransType?.name === 'Sales') {
                contactScId = document.getElementById('tv-contact-select').value || null;
            }
            const discount = tvIsRmBearing ? (parseFloat(document.getElementById('tv-discount').value) || 0) : 0;
            const shipping = tvIsRmBearing ? (parseFloat(document.getElementById('tv-shipping').value) || 0) : 0;
            const shipperSelId = tvIsRmBearing ? (document.getElementById('tv-shipper-select').value || null) : null;
            const taxSelId = tvIsRmBearing ? (document.getElementById('tv-tax-select').value || null) : null;

            const tellerScId = document.getElementById('tv-teller-select').value || null;
            const noteVal = document.getElementById('tv-note-input').value.trim();

            // compute rounding to persist
            let roundingToSave = 0;
            if (tvIsRmBearing) {
                const subtotal = tvRound2(tvItems.reduce((s, i) => s + tvLineTotal(i), 0));
                const taxSelIdForCalc = document.getElementById('tv-tax-select').value || '';
                const taxRecordForCalc = tvTaxCache.find(t => String(t.id) === taxSelIdForCalc);
                const taxAmountForCalc = tvRound2(taxRecordForCalc ? subtotal * (Number(taxRecordForCalc.percentage) || 0) : 0);
                const preRound = tvRound2(subtotal + shipping + taxAmountForCalc - discount);
                roundingToSave = window.computeBnmRounding(preRound).rounding;
            }

            const { error: transErr } = await window.supabaseClient.from('trans').update({
                status, contact: contactScId, teller: tellerScId, rm_discount: discount, rounding: roundingToSave, note: noteVal || null
            }).eq('id', tvTransId);
            if (transErr) throw transErr;

            const oldItems = (tvTrans.trans_product || []).map(tp => {
                const sp = tvStoreProductsCache.find(s => s.id === tp.store_product);
                return { store_product: tp.store_product, qty_order: tp.qty_order, stock_control: sp?.product?.stock_control ?? 0 };
            });

            await window.supabaseClient.from('trans_product').delete().eq('trans', tvTransId);
            const validItems = tvItems.filter(i => i.store_product_id && i.qty);
            if (validItems.length) {
                const { error: itemsErr } = await window.supabaseClient.from('trans_product').insert(
                    validItems.map(i => ({ trans: tvTransId, store_product: i.store_product_id, qty_order: i.qty, price_final: tvIsRmBearing ? i.price : 0 }))
                );
                if (itemsErr) throw itemsErr;
            }

            await window.applyStockMovement(tvTransType, oldItems, -1);
            await window.applyStockMovement(tvTransType, validItems.map(i => ({
                store_product: i.store_product_id, qty_order: i.qty, stock_control: i.stock_control
            })), 1);

            if (tvIsRmBearing) {
                await window.supabaseClient.from('trans_ship').delete().eq('trans', tvTransId);
                if (shipperSelId) {
                    await window.supabaseClient.from('trans_ship').insert({ trans: tvTransId, amount: shipping, status: 1, shipper: shipperSelId });
                }
                await window.supabaseClient.from('trans_tax').delete().eq('trans', tvTransId);
                if (taxSelId) {
                    const taxRecord = tvTaxCache.find(t => String(t.id) === taxSelId);
                    const subtotal = tvRound2(validItems.reduce((s, i) => s + tvLineTotal(i), 0));;
                    // No /100 — percentage is a fraction, same convention as pos.js.
                    const amount = tvRound2(subtotal * (Number(taxRecord?.percentage) || 0));
                    await window.supabaseClient.from('trans_tax').insert({ trans: tvTransId, tax: taxSelId, amount });
                }
            }

            saveBtn.innerHTML = '<i class="fa-solid fa-check"></i> Saved!';
            saveBtn.style.backgroundColor = 'var(--success)';
            setTimeout(() => {
                saveBtn.disabled = false;
                saveBtn.innerHTML = originalHtml;
                saveBtn.style.backgroundColor = '';
            }, 1200);
        } catch (err) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalHtml;
            alert('Failed to save transaction: ' + (err.message || 'unknown error'));
        }
    });
}

// --- Delete ---
function wireDeleteFlow() {
    const deleteBtn = document.getElementById('tv-delete-btn');
    if (deleteBtn) deleteBtn.addEventListener('click', () => document.getElementById('tv-delete-confirm-modal').classList.add('active'));

    const confirmBtn = document.getElementById('tv-confirm-delete-btn');
    if (!confirmBtn) return;
    confirmBtn.addEventListener('click', async () => {
        const modal = document.getElementById('tv-delete-confirm-modal');
        confirmBtn.disabled = true;
        const originalHtml = confirmBtn.innerHTML;
        confirmBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Deleting...';

        // Void in Bukku first (no-op if never synced) so the two systems don't drift.
        const { data: voidResult, error: voidErr } = await window.supabaseClient.functions.invoke('void-bukku-invoice', {
            body: { transId: tvTransId, action: 'void' }
        });
        if (voidErr || voidResult?.ok === false) {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = originalHtml;
            const detail = voidResult?.error || voidErr?.message || 'Unknown error';
            alert('Could not void the linked Bukku invoice, so this transaction was not deleted.\n\n' +
                'Bukku said: ' + detail + '\n\n' +
                'If this is because the invoice was already validated to MyInvois, you will need ' +
                'to cancel it directly in MyInvois/Bukku before it can be removed here — please ' +
                'note the exact error above so we can confirm and hard-code this rule.');
            return; // hard stop — do not proceed to local delete
        }

        const oldItemsForReversal = (tvTrans.trans_product || []).map(tp => {
            const sp = tvStoreProductsCache.find(s => s.id === tp.store_product);
            return { store_product: tp.store_product, qty_order: tp.qty_order, stock_control: sp?.product?.stock_control ?? 0 };
        });
        await window.applyStockMovement(tvTransType, oldItemsForReversal, -1);

        await window.supabaseClient.from('trans_payment').delete().eq('trans', tvTransId);
        await window.supabaseClient.from('trans_product').delete().eq('trans', tvTransId);
        await window.supabaseClient.from('trans_ship').delete().eq('trans', tvTransId);
        await window.supabaseClient.from('trans_tax').delete().eq('trans', tvTransId);
        const { error } = await window.supabaseClient.from('trans').delete().eq('id', tvTransId);

        confirmBtn.disabled = false;
        confirmBtn.innerHTML = originalHtml;
        modal.classList.remove('active');

        if (error) { alert('Failed to delete transaction.'); return; }

        localStorage.removeItem('view_trans_id');
        navigateTo('transaction');
    });
}

// --- Print dropdown ---
function wirePrintDropdown() {
    const btn = document.getElementById('tv-print-dropdown-btn');
    const menu = document.getElementById('tv-print-dropdown-menu');
    const receiptLink = document.getElementById('tv-print-receipt-link');
    const a4Link = document.getElementById('tv-print-a4-link');
    if (!btn || !menu) return;

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    });
    document.addEventListener('click', (e) => {
        if (!menu.contains(e.target) && e.target !== btn) menu.style.display = 'none';
    });

    if (receiptLink) receiptLink.addEventListener('click', (e) => {
        e.preventDefault();
        menu.style.display = 'none';
        openPrintWindow(buildReceiptHtml(), 'Receipt');
    });
    if (a4Link) a4Link.addEventListener('click', (e) => {
        e.preventDefault();
        menu.style.display = 'none';
        openPrintWindow(buildA4Html(), 'Transaction');
    });
}

function openPrintWindow(html, title) {
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

// --- Shared totals helper ---
function computeTvPrintTotals() {
    const subtotal = tvRound2(tvItems.reduce((s, i) => s + tvLineTotal(i), 0));
    const shipping = tvIsRmBearing ? tvRound2(parseFloat(document.getElementById('tv-shipping')?.value) || 0) : 0;
    const taxSelId = tvIsRmBearing ? (document.getElementById('tv-tax-select')?.value || '') : '';
    const taxRecord = tvTaxCache.find(t => String(t.id) === taxSelId);
    const taxAmount = tvRound2(taxRecord ? subtotal * (Number(taxRecord.percentage) || 0) : 0);
    const discount = tvIsRmBearing ? tvRound2(parseFloat(document.getElementById('tv-discount')?.value) || 0) : 0;
    const preRoundTotal = tvRound2(subtotal + shipping + taxAmount - discount);
    const { rounded: grandTotal, rounding } = tvIsRmBearing
        ? window.computeBnmRounding(preRoundTotal)
        : { rounded: preRoundTotal, rounding: 0 };
    const paid = tvRound2(tvPayments.reduce((s, p) => s + (Number(p.rm_pay) || 0), 0));
    return { subtotal, shipping, taxAmount, discount, rounding, grandTotal, paid, balance: tvRound2(grandTotal - paid) };
}

function tvRound2(n) {
    return Math.round((n + Number.EPSILON) * 100) / 100;
}

function tvLineTotal(item) {
    return tvRound2(item.qty * item.price);
}

function tvFormatDMY(dateStr) {
    const d = dateStr ? new Date(dateStr) : new Date();
    if (isNaN(d.getTime())) return '-';
    const pad = n => String(n).padStart(2, '0');
    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
}

function tvFormatTime12(dateStr) {
    const d = dateStr ? new Date(dateStr) : new Date();
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function tvBuyerLabel() {
    if (tvTrans.contact_sc?.contact?.name) return tvTrans.contact_sc.contact.name.toUpperCase();
    return 'Cash Customer';
}

function tvPaymentMethodSummary() {
    // Returns per-payment lines instead of grouping purely by method, so each
    // payment's note (if any) can be shown alongside its amount on the receipt.
    return tvPayments.map(p => ({
        method: p.pay_method?.name || 'Other',
        amount: Number(p.rm_pay) || 0,
        note: p.note || ''
    }));
}

function tvEscape(str) {
    return (str || '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// --- Receipt (small format) ---
function buildReceiptHtml() {
    const company = tvCompanyCache;
    const store = tvStoreDetailsCache;
    const totals = computeTvPrintTotals();
    const paymentLines = tvPaymentMethodSummary();

    const itemsRows = tvItems.map(i => `
        <tr>
            <td colspan="3" style="padding-top: 6px; font-weight: 600;">${tvEscape(i.name)}<br><span style="font-size: 11px; color: #555;">${tvEscape(i.sku)}</span></td>
        </tr>
        <tr>
            <td style="padding-bottom: 6px;">${i.qty.toFixed(3)}</td>
            <td class="text-right" style="padding-bottom: 6px;">${i.price.toFixed(2)}</td>
            <td class="text-right" style="padding-bottom: 6px;">${(i.qty * i.price).toFixed(2)}</td>
        </tr>
    `).join('');

    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Receipt</title>
<style>
    @page { size: 80mm auto; margin: 4mm; }
    * { box-sizing: border-box; }
    body { font-family: 'Courier New', monospace; font-size: 12px; width: 72mm; margin: 0 auto; color: #000; }
    .center { text-align: center; }
    .bold { font-weight: 700; }
    .divider { border-top: 1px dashed #000; margin: 8px 0; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 0; vertical-align: top; }
    .text-right { text-align: right; }
    .totals-row td { padding: 2px 0; }
    .grand td { font-weight: 700; font-size: 13px; padding-top: 4px; }
    .pay-note { font-size: 10.5px; color: #333; font-style: italic; }
</style>
</head>
<body>
    <div class="center bold" style="font-size: 14px;">${tvEscape(company?.name || 'COMPANY NAME')}</div>
    ${company?.ssm ? `<div class="center">[ ${tvEscape(company.ssm)} ]</div>` : ''}
    <div class="center">${tvEscape(company?.address || '').replace(/\n/g, '<br>')}</div>
    ${company?.tel ? `<div class="center">${tvEscape(company.tel)}</div>` : ''}
    <div class="center">${[company?.tel, company?.email].filter(Boolean).map(tvEscape).join(' | ')}</div>

    <div class="divider"></div>

    <div class="bold center">${tvEscape((tvTransType?.name || '').toUpperCase())}</div>
    <div class="center">${tvEscape(tvTrans.trans_no || '')}</div>
    <div class="center">${tvEscape(tvBuyerLabel())}</div>

    <div class="divider"></div>

    <table>
        <thead>
            <tr class="bold"><td>QTY</td><td class="text-right">PRICE [RM]</td><td class="text-right">TOTAL [RM]</td></tr>
        </thead>
        <tbody>${itemsRows}</tbody>
    </table>

    <div class="divider"></div>

    <table>
        <tr class="totals-row"><td colspan="2">SUBTOTAL [RM]</td><td class="text-right">${totals.subtotal.toFixed(2)}</td></tr>
        <tr class="totals-row"><td colspan="2">SHIPPING [RM]</td><td class="text-right">${totals.shipping.toFixed(2)}</td></tr>
        <tr class="totals-row"><td colspan="2">TAX [RM]</td><td class="text-right">${totals.taxAmount.toFixed(2)}</td></tr>
        <tr class="totals-row"><td colspan="2">DISCOUNT [RM]</td><td class="text-right">${totals.discount.toFixed(2)}</td></tr>
        <tr class="totals-row"><td colspan="2">ROUNDING [RM]</td><td class="text-right">${totals.rounding.toFixed(2)}</td></tr>
        <tr class="totals-row bold"><td colspan="2">AMOUNT TO PAY [RM]</td><td class="text-right">${totals.grandTotal.toFixed(2)}</td></tr>
        <tr class="totals-row"><td colspan="3" style="padding-top:6px;">AMT RECEIVED [RM]</td></tr>
        ${paymentLines.map(p => `
            <tr class="totals-row"><td colspan="2">*** Method: ${tvEscape(p.method)}</td><td class="text-right">${p.amount.toFixed(2)}</td></tr>
            ${p.note ? `<tr class="totals-row"><td colspan="3" class="pay-note">Note: ${tvEscape(p.note)}</td></tr>` : ''}
        `).join('')}
        <tr class="totals-row bold"><td colspan="2">BALANCE [RM]</td><td class="text-right">${Math.max(0, totals.balance).toFixed(2)}</td></tr>
    </table>

    <div class="divider"></div>

    <div class="center">${tvEscape((window.currentUserProfile?.name || tvTellerName || '-').toUpperCase())} ${tvEscape((store?.name || '').toUpperCase())} ${new Date().getFullYear()}</div>
    <div class="center">${tvFormatDMY(new Date())} ${tvFormatTime12(new Date())}</div>

    <div class="divider"></div>
    <div class="center bold">-- Thank You --</div>
</body></html>`;
}

// --- A4 format ---
function buildA4Html() {
    const company = tvCompanyCache;
    const store = tvStoreDetailsCache;
    const totals = computeTvPrintTotals();

    const itemsRows = tvItems.map(i => `
        <tr>
            <td>${tvEscape(i.name)}<br><span style="font-size: 11px; color: #666;">${tvEscape(i.sku)}</span></td>
            <td class="text-right">${i.qty.toFixed(3)}${i.uom ? ' ' + tvEscape(i.uom) : ''}</td>
            <td class="text-right">${i.price.toFixed(2)}</td>
            <td class="text-right">${(i.qty * i.price).toFixed(2)}</td>
        </tr>
    `).join('');

    const paymentRows = tvPayments.map(p => `
        <tr>
            <td>${tvFormatDMY(p.date)}</td>
            <td>${tvEscape((p.pay_method?.name || '-').toUpperCase())}</td>
            <td>${tvEscape(p.pay_ref || '-')}</td>
            <td>${tvEscape(p.note || '-')}</td>
            <td class="text-right">${Number(p.rm_pay || 0).toFixed(2)}</td>
        </tr>
    `).join('');

    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Transaction</title>
<style>
    @page { size: A4; margin: 15mm; }
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #111; }
    .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
    .header h1 { font-size: 18px; margin: 0 0 4px 0; }
    .header p { margin: 2px 0; color: #333; font-size: 12px; }
    .type-label { text-align: right; font-size: 20px; font-weight: 700; letter-spacing: 1px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 20px 0; }
    .info-grid .box p { margin: 3px 0; }
    .info-grid .box-title { font-weight: 700; font-size: 11px; text-transform: uppercase; color: #666; margin-bottom: 6px; }

    /* items table — back to original bottom-border-only style */
    table.items { width: 100%; border-collapse: collapse; margin-top: 10px; }
    table.items th, table.items td { border-bottom: 1px solid #ddd; padding: 8px; text-align: left; }
    table.items th { background: #f5f5f5; font-size: 11px; text-transform: uppercase; }
    table.items td.text-right, table.items th.text-right { text-align: right; }

    /* trans-details — new table, full borders, more compact */
    table.trans-details { width: 100%; border-collapse: collapse; margin: 10px 0 20px 0; }
    table.trans-details th, table.trans-details td { border: 1px solid #ccc; padding: 5px 8px; text-align: left; font-size: 12px; }
    table.trans-details th { background: #f5f5f5; font-size: 11px; text-transform: uppercase; }

    /* payments table — same as before, keep bottom-border style consistent with items */
    table.payments { width: 100%; border-collapse: collapse; margin-top: 8px; }
    table.payments th, table.payments td { border-bottom: 1px solid #eee; padding: 6px 8px; text-align: left; font-size: 12px; }
    table.payments th { background: #f5f5f5; text-transform: uppercase; }
    table.payments tfoot td { font-weight: 700; background: #f9f9f9; border-top: 1px solid #ddd; }
    table.payments td.text-right, table.payments th.text-right { text-align: right; }

    .text-right { text-align: right; }
    .totals-box { width: 280px; margin-left: auto; margin-top: 10px; }
    .totals-box .row { display: flex; justify-content: space-between; padding: 4px 8px; }
    .totals-box .grand { border-top: 2px solid #111; font-weight: 700; font-size: 15px; }

    .signoff { margin-top: 30px; font-size: 12px; color: #444; }
    .signoff .print-date { border-top: 1px dashed #999; padding-top: 10px; }
    .signoff .signature-line { margin: 40px 0 6px 0; border-top: 1px solid #333; width: 260px; }
    .signoff .signature-label { font-size: 11px; color: #666; margin-bottom: 20px; }

    .payment-section { margin-top: 30px; }
    .payment-section h3 { font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #ddd; padding-bottom: 6px; }}
</style>
</head>
<body>
    <div class="header">
        <div>
            <h1>${tvEscape(company?.name || 'COMPANY NAME')}</h1>
            ${company?.ssm ? `<p>[ ${tvEscape(company.ssm)} ]</p>` : ''}
            <p>${tvEscape(company?.address || '').replace(/\n/g, '<br>')}</p>
            ${company?.tel ? `<p>Tel : ${tvEscape(company.tel)}</p>` : ''}
            <p>${[company?.tel, company?.email].filter(Boolean).map(tvEscape).join(' | ')}</p>
        </div>
        <div class="type-label">${tvEscape((tvTransType?.name || '').toUpperCase())}</div>
    </div>

    <div class="info-grid">
        <div class="box">
            <div class="box-title">Buyer</div>
            <p><strong>${tvEscape(tvBuyerLabel())}</strong></p>
            <p>-</p>
        </div>
        <div class="box">
            <div class="box-title">Store</div>
            <p><strong>${tvEscape((store?.name || '').toUpperCase())}</strong></p>
            <p>${tvEscape(store?.address || '').replace(/\n/g, '<br>')}</p>
        </div>
    </div>

    <table class="trans-details">
        <thead>
            <tr><th>Trans No</th><th>Date</th><th>Status</th><th>Teller</th><th>Note</th></tr>
        </thead>
        <tbody>
            <tr>
                <td>${tvEscape(tvTrans.trans_no || '')}</td>
                <td>${tvFormatDMY(tvTrans.date)}</td>
                <td>${tvEscape((TV_STATUS_LABELS[tvTrans.status] || '').toUpperCase())}</td>
                <td>${tvEscape((tvTellerName.slice(0, 10) + '...' || '-').toUpperCase())}</td>
                <td>${tvEscape(tvTrans.note || 'NONE')}</td>
            </tr>
        </tbody>
    </table>

    <table class="items">
        <thead>
            <tr><th>Product</th><th class="text-right">Qty</th><th class="text-right">Price [RM]</th><th class="text-right">Total [RM]</th></tr>
        </thead>
        <tbody>${itemsRows}</tbody>
    </table>

    <div class="totals-box">
        <div class="row"><span>Sub Total [RM]</span><span>${totals.subtotal.toFixed(2)}</span></div>
        <div class="row"><span>Shipping [RM]</span><span>${totals.shipping.toFixed(2)}</span></div>
        <div class="row"><span>Tax [RM]</span><span>${totals.taxAmount.toFixed(2)}</span></div>
        <div class="row"><span>Discount [RM]</span><span>${totals.discount.toFixed(2)}</span></div>
        <div class="row"><span>Rounding [RM]</span><span>${totals.rounding.toFixed(2)}</span></div>
        <div class="row grand"><span>Amount To Pay [RM]</span><span>${totals.grandTotal.toFixed(2)}</span></div>
    </div>

    <div class="signoff">
        <div class="print-date">Print Date : ${tvFormatDMY(new Date())}</div>
        <div class="signature-line"></div>
        <div class="signature-label">${tvEscape(tvBuyerLabel())}</div>
        <div>I received all items above in good condition</div>
    </div>

    <div class="payment-section">
        <h3>Payment Information</h3>
        <table class="payments">
            <thead><tr><th>Date</th><th>Method</th><th>Pay Ref</th><th>Note</th><th class="text-right">RM</th></tr></thead>
            <tbody>${paymentRows || '<tr><td colspan="5">No payments recorded.</td></tr>'}</tbody>
            <tfoot>
                <tr><td colspan="4" class="text-right">Total Payment [RM]</td><td class="text-right">${totals.paid.toFixed(2)}</td></tr>
                <tr><td colspan="4" class="text-right">Balance [RM]</td><td class="text-right">${Math.max(0, totals.balance).toFixed(2)}</td></tr>
            </tfoot>
        </table>
    </div>
</body></html>`;
}