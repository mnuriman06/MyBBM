// pages/pos.js
const POS_STATUS_LABELS = { 1: 'Waiting', 2: 'Shipping', 3: 'Completed' };

let posActiveStoreId = null;
let posCurrentContactId = null;
let posProductsCache = [];      // store_product rows joined product + category
let posCategoriesCache = [];
let posTransTypesCache = [];
let posContactsCache = [];      // store_contact rows (customer/supplier) for active store
let posShipperCache = [];
let posTaxCache = [];
let posPayMethodCache = [];
let posStoreUrlCache = '';

let posCart = [];                // [{ store_product_id, name, sku, price, qty, photo }]
let posMeta = {
    contactScId: null,
    contactLabel: 'Cash Customer',
    typeId: null,
    typeName: 'Sales',
    date: '',      // 'YYYY-MM-DD HH:MM:SS'
    note: ''
};

function render_pos() {
    return `
    <div class="pos-layout">
        <main class="pos-main">
            <header class="pos-header" style="padding: 16px 24px; background-color: var(--bg-card); border-bottom: 1px solid var(--border-color); display: flex; align-items: center; gap: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); height: 72px;">
                <a href="#" data-link="transaction" class="back-btn" title="Back to Transactions" style="flex-shrink: 0;">
                    <i class="fa-solid fa-arrow-left"></i>
                </a>
                <div style="flex: 0 0 220px; flex-shrink: 0;">
                    <select id="pos-category-selector" class="select2-search" data-placeholder="Category" style="width: 100%;">
                        <option value="">All Categories</option>
                    </select>
                </div>
                <div class="pos-search" style="flex: 1; margin: 0;">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" id="pos-product-search-input" placeholder="Product name or SKU">
                </div>
                <button type="button" id="pos-today-sales-btn" class="outline-btn" style="flex-shrink: 0; white-space: nowrap;">
                    <i class="fa-solid fa-receipt"></i> Today Sales
                </button>
            </header>

            <div class="pos-grid-container">
                <div class="pos-grid" id="pos-product-grid">
                    <p class="text-muted" style="grid-column: 1 / -1; text-align: center; padding: 40px;">Loading products...</p>
                </div>
            </div>
        </main>

        <aside class="pos-cart-pane">
            <div class="cart-header" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 20px 24px; border-bottom: 1px solid var(--border-color);">
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; flex: 1;">
                    <h3 style="margin: 0; font-size: 1rem; font-weight: 700; color: var(--text-dark); display: flex; align-items: center; gap: 8px; white-space: nowrap;">
                        <i class="fa-solid fa-cart-shopping" style="color: var(--primary);"></i> ORDER CART
                    </h3>
                    <span id="pos-badge-customer" style="background-color: var(--warning-bg); color: var(--warning); padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 600; white-space: nowrap; max-width: 140px; overflow: hidden; text-overflow: ellipsis;" title="Cash Customer">Cash Customer</span>
                    <span id="pos-badge-type" style="background-color: var(--warning-bg); color: var(--warning); padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 600; white-space: nowrap; text-transform: uppercase;">SALES</span>
                    <span id="pos-badge-date" style="background-color: var(--warning-bg); color: var(--warning); padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 600; white-space: nowrap;">-</span>
                </div>
                <button id="pos-edit-cart-meta" style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1rem; padding: 4px; transition: var(--transition); flex-shrink: 0;" title="Edit details">
                    <i class="fa-solid fa-pencil"></i>
                </button>
            </div>

            <div class="cart-items" id="pos-cart-items">
                <p class="text-muted text-sm" style="text-align:center; padding: 24px;">Cart is empty. Tap a product to add it.</p>
            </div>

            <div class="cart-footer">
                <div class="summary-row text-muted" style="align-items: center;">
                    <span>Subtotal</span>
                    <div style="display: flex; align-items: center; justify-content: flex-end; gap: 6px; width: 196px;">
                        <span id="pos-subtotal" style="font-weight: 600; color: var(--text-dark); width: 70px; text-align: right;">0.00</span>
                    </div>
                </div>
                <div class="summary-row text-muted" style="align-items: center; gap: 8px;">
                    <table style="width: 100%;">
                        <tbody>
                            <tr>
                                <td width="15%"><span class="text-muted">Shipping</span></td>
                                <td width="70%"><select id="pos-shipper-select" class="select2-search" data-placeholder="Shipper" style="width: 100%; font-size: 0.8rem;"></select></td>
                                <td width="15%" style="text-align: right;"><input type="text" id="pos-shipping-amount" class="editable-amount" value="0.00" style="width: 70px; text-align: right;"></td>
                            </tr>
                            <tr>
                                <td width="15%"><span class="text-muted">Tax</span></td>
                                <td width="70%"><select id="pos-tax-select" class="select2-search" data-placeholder="Tax" style="width: 100%; font-size: 0.8rem;"></select></td>
                                <td width="15%" style="text-align: right;"><span id="pos-tax-amount" style="font-weight: 600; color: var(--text-dark); width: 70px; text-align: right;">0.00</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="summary-row text-muted" style="align-items: center; gap: 8px;">
                    <span style="flex-shrink: 0;">Discount</span>
                    <div style="display: flex; align-items: center; justify-content: flex-end; gap: 6px; width: 196px;">
                        <input type="text" id="pos-discount-amount" class="editable-amount" value="0.00" style="width: 70px; text-align: right; color: var(--danger);">
                    </div>
                </div>
                <div class="summary-row text-muted" style="align-items: center;">
                    <span>Rounding</span>
                    <div style="display: flex; align-items: center; justify-content: flex-end; gap: 6px; width: 196px;">
                        <span id="pos-rounding-amount" style="font-weight: 600; color: var(--text-dark); width: 70px; text-align: right;">0.00</span>
                    </div>
                </div>
                <div class="summary-row total">
                    <span>AMOUNT TO PAY</span>
                    <span id="pos-total-to-pay">RM 0.00</span>
                </div>

                <div style="display: flex; gap: 12px; margin-top: 12px; padding-bottom: 0;">
                    <button class="hold-btn" style="color: var(--danger); border-color: var(--danger); margin: 0; flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 0 16px;" onclick="document.getElementById('cancelModal').classList.add('active')" title="Cancel Transaction">
                        <i class="fa-solid fa-xmark"></i> CANCEL
                    </button>
                    <button class="pay-btn" style="margin: 0; flex: 1;" onclick="openCheckoutModal()">
                        <i class="fa-solid fa-credit-card"></i> Pay / Checkout
                    </button>
                </div>
            </div>
        </aside>
    </div>

    <!-- Cancel Modal -->
    <div class="modal-overlay" id="cancelModal">
        <div class="modal-content small-modal">
            <div class="modal-title"><i class="fa-solid fa-triangle-exclamation" style="color: var(--danger); margin-right: 8px;"></i> Warning</div>
            <div class="modal-text">Are you sure to cancel this transaction?<br>All data will be lost.</div>
            <div class="modal-actions">
                <button class="btn-modal-yes" onclick="resetPosPage()">YES</button>
                <button class="btn-modal-no" onclick="document.getElementById('cancelModal').classList.remove('active')">NO</button>
            </div>
        </div>
    </div>

    <!-- Edit Cart Metadata Modal -->
    <div class="modal-overlay" id="pos-meta-modal">
        <div class="modal-content" style="max-width: 450px; width: 100%; border-radius: var(--radius-lg); padding: 0; background-color: var(--bg-card); overflow: hidden; display: flex; flex-direction: column;">
            <div class="modal-header" style="padding: 20px 24px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                <h3 style="margin: 0; font-size: 1.1rem; font-weight: 600; color: var(--text-main);">Edit Order Cart Details</h3>
                <button type="button" id="pos-close-modal" class="close-modal-btn" style="background: none; border: none; font-size: 1.25rem; color: var(--text-muted); cursor: pointer;"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body" style="padding: 24px; display: flex; flex-direction: column; gap: 16px;">
                <div class="form-group" style="width: 100%;">
                    <label class="form-label" style="font-weight: 600; font-size: 0.85rem; margin-bottom: 4px;">Trans Type</label>
                    <select id="pos-trans-type" class="select2-search" data-placeholder="Select Type" style="width: 100%;"></select>
                </div>

                <div class="form-group" id="pos-contact-group" style="width: 100%;">
                    <label class="form-label" style="font-weight: 600; font-size: 0.85rem; margin-bottom: 4px;" id="pos-contact-label">Choose Contact</label>
                    <select id="pos-customer" class="select2-search" style="width: 100%;"></select>
                </div>

                <div class="form-group" style="width: 100%;">
                    <label class="form-label" style="font-weight: 600; font-size: 0.85rem; margin-bottom: 4px;">Trans Date</label>
                    <input type="datetime-local" id="pos-date" step="1" class="form-input" style="height: 38px; padding: 6px 12px; font-size: 0.95rem;">
                </div>

                <div class="form-group" style="width: 100%;">
                    <label class="form-label" style="font-weight: 600; font-size: 0.85rem; margin-bottom: 4px;">Short Note</label>
                    <input type="text" id="pos-note" class="form-input" placeholder="Add note here..." style="height: 38px; padding: 6px 12px; font-size: 0.95rem;">
                </div>
            </div>
            <div class="modal-footer" style="padding: 16px 24px; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 12px; background: var(--bg-main);">
                <button type="button" id="pos-cancel-modal" class="btn-modal-no" style="padding: 10px 20px; font-size: 0.9rem; font-weight: 600; border-radius: 6px; cursor: pointer; border: 1px solid var(--border-color); background: white; color: var(--text-muted); display: inline-flex; align-items: center; justify-content: center; height: 38px;">Cancel</button>
                <button type="button" id="pos-save-modal" class="btn-modal-yes" style="padding: 10px 20px; font-size: 0.9rem; font-weight: 600; border-radius: 6px; cursor: pointer; background: var(--primary); color: white; border: none; display: inline-flex; align-items: center; justify-content: center; height: 38px;">Save Changes</button>
            </div>
        </div>
    </div>

    <!-- Today Sales Modal -->
    <div class="modal-overlay" id="pos-today-sales-modal">
        <div class="modal-content" style="max-width: 640px; width: 100%;">
            <div class="modal-header">
                <h2 style="margin: 0; font-size: 1.1rem; font-weight: 600; display: flex; align-items: center; gap: 10px;">
                    <i class="fa-solid fa-receipt" style="color: var(--primary);"></i> Today Sales
                    <span id="pos-today-sales-date-badge" class="status role-fallback" style="font-size: 0.75rem;">-</span>
                </h2>
                <button type="button" id="pos-close-today-sales-btn" class="close-modal-btn"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body" style="max-height: 60vh; overflow-y: auto;">
                <table class="invoice-table" style="font-size: 0.9rem;">
                    <thead>
                        <tr>
                            <th>Ref #</th>
                            <th class="text-right" style="width: 110px;">Action</th>
                        </tr>
                    </thead>
                    <tbody id="pos-today-sales-tbody">
                        <tr><td colspan="2" class="text-muted" style="text-align:center; padding:16px;">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
            <div class="modal-footer">
                <button type="button" class="action-btn" id="pos-today-sales-footer-close-btn">Close</button>
            </div>
        </div>
    </div>

    <!-- Checkout Modal -->
    <div class="modal-overlay" id="checkoutModal">
        <div class="modal-content" style="max-width: 450px; width: 100%; border-radius: var(--radius-lg); padding: 0; background-color: var(--bg-card); overflow: hidden; display: flex; flex-direction: column;">
            <div class="modal-header" style="padding: 20px 24px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                <h3 style="margin: 0; font-size: 1.1rem; font-weight: 600; color: var(--text-main); display: flex; align-items: center; gap: 8px;">
                    <i class="fa-solid fa-credit-card" style="color: var(--primary);"></i> Checkout Payment
                </h3>
                <button type="button" id="checkout-close-modal" class="close-modal-btn" style="background: none; border: none; font-size: 1.25rem; color: var(--text-muted); cursor: pointer;"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body" style="padding: 24px; display: flex; flex-direction: column; gap: 16px;">
                <div class="form-group" style="width: 100%;">
                    <label class="form-label" style="font-weight: 600; font-size: 0.85rem; margin-bottom: 4px;">Payment Method</label>
                    <select id="checkout-payment-method" class="select2-search" data-placeholder="Select Payment Method" style="width: 100%;"></select>
                </div>

                <div class="form-group" style="width: 100%;">
                    <label class="form-label" style="font-weight: 600; font-size: 0.85rem; margin-bottom: 4px;">Amount to Pay</label>
                    <div style="display: flex; align-items: center; width: 100%;">
                        <span style="background-color: var(--bg-main); border: 1px solid var(--border-color); border-right: none; padding: 10px 14px; border-radius: var(--radius-md) 0 0 var(--radius-md); font-weight: 600; font-size: 0.95rem; color: var(--text-muted); min-width: 45px; text-align: center;">RM</span>
                        <input type="text" id="checkout-amount-to-pay" class="form-input" disabled style="border-top-left-radius: 0; border-bottom-left-radius: 0; flex: 1; background-color: var(--bg-main); opacity: 0.85; font-weight: 600;">
                    </div>
                </div>

                <div class="form-group" style="width: 100%;">
                    <label class="form-label" style="font-weight: 600; font-size: 0.85rem; margin-bottom: 4px;">Amount Received</label>
                    <div style="display: flex; align-items: center; width: 100%;">
                        <span style="background-color: var(--bg-main); border: 1px solid var(--border-color); border-right: none; padding: 10px 14px; border-radius: var(--radius-md) 0 0 var(--radius-md); font-weight: 600; font-size: 0.95rem; color: var(--text-muted); min-width: 45px; text-align: center;">RM</span>
                        <input type="text" id="checkout-amount-received" class="form-input" placeholder="0.00" style="border-top-left-radius: 0; border-bottom-left-radius: 0; flex: 1; font-weight: 600;">
                    </div>
                </div>

                <div class="form-group" style="width: 100%;">
                    <label class="form-label" style="font-weight: 600; font-size: 0.85rem; margin-bottom: 4px;">Balance</label>
                    <div style="display: flex; align-items: center; width: 100%;">
                        <span style="background-color: var(--bg-main); border: 1px solid var(--border-color); border-right: none; padding: 10px 14px; border-radius: var(--radius-md) 0 0 var(--radius-md); font-weight: 600; font-size: 0.95rem; color: var(--text-muted); min-width: 45px; text-align: center;">RM</span>
                        <input type="text" id="checkout-balance" class="form-input" disabled style="border-top-left-radius: 0; border-bottom-left-radius: 0; flex: 1; background-color: var(--bg-main); opacity: 0.85; font-weight: 600;">
                    </div>
                </div>

                <div class="form-group" style="width: 100%;">
                    <label class="form-label" style="font-weight: 600; font-size: 0.85rem; margin-bottom: 4px;">Note</label>
                    <input type="text" id="checkout-note" class="form-input" placeholder="Optional note for this payment">
                </div>
            </div>
            <div class="modal-footer" style="padding: 16px 24px; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 12px; background: var(--bg-main);">
                <button type="button" id="checkout-cancel-btn" class="btn-modal-no" style="padding: 10px 20px; font-size: 0.9rem; font-weight: 600; border-radius: 6px; cursor: pointer; border: 1px solid var(--border-color); background: white; color: var(--text-muted); display: inline-flex; align-items: center; justify-content: center; height: 38px;">Cancel</button>
                <button type="button" id="checkout-submit-btn" class="btn-modal-yes" style="padding: 10px 20px; font-size: 0.9rem; font-weight: 600; border-radius: 6px; cursor: pointer; background: var(--primary); color: white; border: none; display: inline-flex; align-items: center; justify-content: center; height: 38px; min-width: 120px;">Confirm Payment</button>
            </div>
        </div>
    </div>
    `;
}

window.init_pos = async function() {
    posActiveStoreId = await window.getActiveStoreId();
    posCurrentContactId = await window.getCurrentContactId();

    if (!posActiveStoreId) {
        document.getElementById('pos-product-grid').innerHTML =
            `<p class="text-muted" style="grid-column: 1 / -1; text-align:center; padding:40px;">You are not assigned to any store.</p>`;
        return;
    }

    const [{ data: storeProducts }, { data: categories }, { data: types }, { data: contacts }, { data: shippers }, { data: taxes }, { data: payMethods }, { data: storeRow }] = await Promise.all([
        window.supabaseClient.from('store_product').select('id, qty_bal, product (id, sku, name, photo, price_retail, stock_control, category (id, name))').eq('store', posActiveStoreId),
        window.supabaseClient.from('product_category').select('id, name').order('name'),
        window.supabaseClient.from('trans_type').select('id, name, iso, ope_rm, ope_qty').order('id'),
        window.supabaseClient.from('store_contact').select('id, contact (id, name), role (name)').eq('store', posActiveStoreId),
        window.supabaseClient.from('shipper').select('id, name').order('name'),
        window.supabaseClient.from('tax').select('id, name, percentage').order('name'),
        window.supabaseClient.from('pay_method').select('id, name').order('name'),
        window.supabaseClient.from('store').select('id, url').eq('id', posActiveStoreId).maybeSingle()
    ]);
    
    posProductsCache = (storeProducts || []).filter(sp => sp.product);
    posCategoriesCache = categories || [];
    posTransTypesCache = types || [];
    posContactsCache = (contacts || []).filter(c => c.contact &&
        ['customer', 'supplier'].includes((c.role?.name || '').toLowerCase()));
    posShipperCache = shippers || [];
    posTaxCache = taxes || [];
    posPayMethodCache = payMethods || [];
    posStoreUrlCache = storeRow?.url || '';

    const salesType = posTransTypesCache.find(t => t.name === 'Sales') || posTransTypesCache[0];
    posMeta = {
        contactScId: null,
        contactLabel: 'Cash Customer',
        typeId: salesType?.id || null,
        typeName: salesType?.name || '',
        date: window.formatDateTime(new Date()),
        note: ''
    };
    posCart = [];

    populatePosCategorySelector();
    populatePosShipperSelect();
    populatePosTaxSelect();
    populatePosPayMethodSelect();
    renderPosProductGrid();
    renderPosCart();
    updatePosBadges();

    wirePosProductFilters();
    wirePosCartMetaModal();
    wirePosCartSummaryInputs();
    wirePosCheckoutModal();
    wirePosTodaySalesModal();

    if (typeof window.initializeSelect2 === 'function') window.initializeSelect2();
};

function populatePosCategorySelector() {
    const sel = document.getElementById('pos-category-selector');
    if (!sel) return;
    sel.innerHTML = '<option value="">All Categories</option>' +
        posCategoriesCache.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    // Default to Hot Items (category id 1), if it exists in this store's categories.
    const hasHotItems = posCategoriesCache.some(c => String(c.id) === '1');
    sel.value = hasHotItems ? '1' : '';
    if (typeof jQuery !== 'undefined') $(sel).trigger('change');
}

function populatePosShipperSelect() {
    const sel = document.getElementById('pos-shipper-select');
    if (!sel) return;
    sel.innerHTML = posShipperCache.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    sel.value = '1';
    if (typeof jQuery !== 'undefined') $(sel).trigger('change');
}

function populatePosTaxSelect() {
    const sel = document.getElementById('pos-tax-select');
    if (!sel) return;
    sel.innerHTML = posTaxCache.map(t => `<option value="${t.id}">${t.name} (${(Number(t.percentage) * 100).toFixed(0)}%)</option>`).join('');
    sel.value = '1';
    if (typeof jQuery !== 'undefined') $(sel).trigger('change');
}

function populatePosPayMethodSelect() {
    const sel = document.getElementById('checkout-payment-method');
    if (!sel) return;
    sel.innerHTML = posPayMethodCache.map(m => `<option value="${m.id}">${m.name}</option>`).join('');

    // Default to Cash, if available.
    const cashMethod = posPayMethodCache.find(m => (m.name || '').toLowerCase() === 'cash');
    if (cashMethod) sel.value = String(cashMethod.id);
}

// --- Product grid ---
function renderPosProductGrid() {
    const grid = document.getElementById('pos-product-grid');
    if (!grid) return;

    const categoryId = document.getElementById('pos-category-selector')?.value || '';
    const keyword = (document.getElementById('pos-product-search-input')?.value || '').toLowerCase().trim();

    const rows = posProductsCache.filter(sp => {
        const p = sp.product;
        if (categoryId && String(p.category?.id) !== categoryId) return false;
        if (keyword) {
            const matches = (p.name || '').toLowerCase().includes(keyword) || (p.sku || '').toLowerCase().includes(keyword);
            if (!matches) return false;
        }
        return true;
    });

    if (!rows.length) {
        grid.innerHTML = `<p class="text-muted" style="grid-column: 1 / -1; text-align:center; padding:40px;">No products found.</p>`;
        return;
    }

    grid.innerHTML = rows.map(sp => {
        const p = sp.product;
        const isInfinite = p.stock_control === 1;
        const bal = Number(sp.qty_bal) || 0;
        const lowClass = bal <= 5 ? 'low' : '';
        const stockBadge = isInfinite
            ? `<div class="pos-product-stock" style="background-color: var(--info-bg); color: var(--info);">Stock: <i class="fa-solid fa-infinity"></i></div>`
            : `<div class="pos-product-stock ${lowClass}">Stock: ${bal.toFixed(0)}</div>`;
        return `
            <div class="pos-product" data-sp-id="${sp.id}">
                <img src="${p.photo || 'product_photo.webp'}" alt="${p.name || ''}" class="pos-product-img">
                ${stockBadge}
                <h4>${p.name || '-'}</h4>
                <span class="sku">${p.sku || '-'}</span>
                <div class="price-row">
                    <span class="price">RM ${Number(p.price_retail || 0).toFixed(2)}</span>
                    <button class="add-to-cart-btn" data-sp-id="${sp.id}"><i class="fa-solid fa-plus"></i></button>
                </div>
            </div>
        `;
    }).join('');

    grid.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', () => addToCart(btn.getAttribute('data-sp-id')));
    });
}

function wirePosProductFilters() {
    const categorySel = document.getElementById('pos-category-selector');
    const searchInput = document.getElementById('pos-product-search-input');
    const barcodeBtn = document.getElementById('pos-barcode-btn');

    if (categorySel && typeof jQuery !== 'undefined') {
        $(categorySel).on('change', () => renderPosProductGrid());
    } else if (categorySel) {
        categorySel.addEventListener('change', () => renderPosProductGrid());
    }
    if (searchInput) searchInput.addEventListener('input', () => renderPosProductGrid());
}

function currentPosOpeQtySign() {
    const type = posTransTypesCache.find(t => String(t.id) === String(posMeta.typeId));
    return type?.ope_qty ? type.ope_qty.trim() : '';
}

function addToCart(spId) {
    const sp = posProductsCache.find(r => String(r.id) === String(spId));
    if (!sp) return;

    const isInfinite = sp.product.stock_control === 1;
    const isOutbound = currentPosOpeQtySign() === '-' && !isInfinite;
    const available = Number(sp.qty_bal) || 0;

    const existing = posCart.find(item => String(item.store_product_id) === String(spId));
    if (existing) {
        const nextQty = existing.qty + 1;
        if (isOutbound && nextQty > available) {
            alert(`Only ${available.toFixed(0)} unit(s) of "${sp.product.name}" available.`);
            return;
        }
        existing.qty = nextQty;
    } else {
        if (isOutbound && available <= 0) {
            alert(`"${sp.product.name}" is out of stock.`);
            return;
        }
        posCart.push({
            store_product_id: sp.id,
            name: sp.product.name,
            sku: sp.product.sku,
            price: Number(sp.product.price_retail) || 0,
            qty: 1,
            photo: sp.product.photo || 'product_photo.webp',
            available, // stashed for the +/- controls in renderPosCart
            isInfinite
        });
    }
    renderPosCart();
}

function renderPosCart() {
    const container = document.getElementById('pos-cart-items');
    if (!container) return;

    if (!posCart.length) {
        container.innerHTML = `<p class="text-muted text-sm" style="text-align:center; padding: 24px;">Cart is empty. Tap a product to add it.</p>`;
    } else {
        container.innerHTML = posCart.map((item, idx) => `
            <div class="cart-item" data-idx="${idx}">
                <img src="${item.photo}" alt="${item.name}">
                <div class="cart-item-info">
                    <h5>${item.name}</h5>
                    <div style="display: flex; align-items: center; gap: 4px;">
                        <span class="text-muted" style="font-size: 0.75rem;">RM</span>
                        <input type="text" class="cart-item-price-input" value="${item.price.toFixed(2)}" style="width: 64px; border: 1px solid; border-radius: 4px; padding: 2px 4px; font-weight: 700; color: var(--primary); font-size: 0.8rem; background: transparent;">
                    </div>
                </div>
                <div class="cart-qty-controls">
                    <button class="qty-btn cart-qty-minus"><i class="fa-solid fa-minus"></i></button>
                    <input type="text" class="qty-input" value="${item.qty.toFixed(3)}">
                    <button class="qty-btn cart-qty-plus"><i class="fa-solid fa-plus"></i></button>
                </div>
                <div style="font-weight: 700; color: var(--primary); font-size: 0.85rem; text-align: right; min-width: 70px; display: flex; align-items: center; justify-content: flex-end;">${(item.qty * item.price).toFixed(2)}</div>
                <button class="cart-remove-btn" title="Remove Item"><i class="fa-solid fa-xmark"></i></button>
            </div>
        `).join('');

        // Inside renderPosCart(), replace the per-row listener block with clamped versions:
        container.querySelectorAll('.cart-item').forEach(row => {
            const idx = parseInt(row.getAttribute('data-idx'), 10);
            const isInfinite = posCart[idx].isInfinite;
            const isOutbound = currentPosOpeQtySign() === '-' && !isInfinite;
            const available = posCart[idx].available ?? Infinity;

            row.querySelector('.cart-qty-minus').addEventListener('click', () => {
                posCart[idx].qty = Math.max(0.001, posCart[idx].qty - 1);
                renderPosCart();
            });
            row.querySelector('.cart-qty-plus').addEventListener('click', () => {
                const next = posCart[idx].qty + 1;
                if (isOutbound && next > available) {
                    alert(`Only ${available.toFixed(0)} unit(s) available.`);
                    return;
                }
                posCart[idx].qty = next;
                renderPosCart();
            });

            const qtyInput = row.querySelector('.qty-input');
            qtyInput.addEventListener('blur', () => {
                let val = Math.max(0.001, parseFloat(qtyInput.value) || 0);
                if (isOutbound && val > available) {
                    alert(`Only ${available.toFixed(0)} unit(s) available.`);
                    val = available > 0 ? available : val;
                }
                val = parseFloat(val.toFixed(3));
                posCart[idx].qty = val;
                renderPosCart();
            });
            qtyInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') qtyInput.blur(); });

            const priceInput = row.querySelector('.cart-item-price-input');
            priceInput.addEventListener('blur', () => {
                const val = parseFloat(Math.max(0, parseFloat(priceInput.value) || 0).toFixed(2));
                posCart[idx].price = val;
                renderPosCart();
            });
            priceInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') priceInput.blur(); });

            row.querySelector('.cart-remove-btn').addEventListener('click', () => {
                posCart.splice(idx, 1);
                renderPosCart();
            });
        });
    }

    renderPosSummary();
}

function computePosSubtotal() {
    return posCart.reduce((s, i) => s + i.qty * i.price, 0);
}

function renderPosSummary() {
    const round2 = n => Math.round((n + Number.EPSILON) * 100) / 100;

    const subtotal = round2(computePosSubtotal());
    const shipping = round2(parseFloat(document.getElementById('pos-shipping-amount')?.value) || 0);

    const taxSelId = document.getElementById('pos-tax-select')?.value || '';
    const taxRecord = posTaxCache.find(t => String(t.id) === taxSelId);
    const taxAmount = round2(taxRecord ? subtotal * (Number(taxRecord.percentage) || 0) : 0);

    const discount = round2(parseFloat(document.getElementById('pos-discount-amount')?.value) || 0);
    const preRoundTotal = round2(subtotal + shipping + taxAmount - discount);

    const { rounded, rounding } = window.computeBnmRounding(preRoundTotal);

    const subtotalEl = document.getElementById('pos-subtotal');
    const taxAmountEl = document.getElementById('pos-tax-amount');
    const roundingEl = document.getElementById('pos-rounding-amount');
    const totalEl = document.getElementById('pos-total-to-pay');
    if (subtotalEl) subtotalEl.textContent = subtotal.toFixed(2);
    if (taxAmountEl) taxAmountEl.textContent = taxAmount.toFixed(2);
    if (roundingEl) roundingEl.textContent = (rounding >= 0 ? '+' : '') + rounding.toFixed(2);
    if (totalEl) totalEl.textContent = 'RM ' + rounded.toFixed(2);
}

function wirePosCartSummaryInputs() {
    const shippingInput = document.getElementById('pos-shipping-amount');
    const discountInput = document.getElementById('pos-discount-amount');
    const taxSel = document.getElementById('pos-tax-select');

    [shippingInput, discountInput].forEach(input => {
        if (!input) return;
        input.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9.]/g, '');
            renderPosSummary();
        });
        input.addEventListener('focus', function() { this.select(); });
        input.addEventListener('blur', function() {
            this.value = (parseFloat(this.value) || 0).toFixed(2);
            renderPosSummary();
        });
    });

    if (typeof jQuery !== 'undefined') {
        $(taxSel).on('change', renderPosSummary);
    } else if (taxSel) {
        taxSel.addEventListener('change', renderPosSummary);
    }
}

// --- Cart meta (contact / type / date / note) ---
function updatePosBadges() {
    const customerBadge = document.getElementById('pos-badge-customer');
    const typeBadge = document.getElementById('pos-badge-type');
    const dateBadge = document.getElementById('pos-badge-date');

    if (customerBadge) {
        customerBadge.textContent = posMeta.contactLabel;
        customerBadge.setAttribute('title', posMeta.contactLabel);
    }
    if (typeBadge) typeBadge.textContent = (posMeta.typeName || '-').toUpperCase();
    if (dateBadge) dateBadge.textContent = posMeta.date;
}

function populatePosContactSelectForType(typeName) {
    const group = document.getElementById('pos-contact-group');
    const label = document.getElementById('pos-contact-label');
    const sel = document.getElementById('pos-customer');
    if (!sel || !group) return;

    // Only Purchase (supplier) and Sales (customer) carry a real counterparty — trans.contact
    // stays null for Stock Up / Return / Stock In / Stock Out per the schema.
    if (typeName === 'Sales' || typeName === 'Purchase') {
        group.style.display = 'block';
        label.textContent = typeName === 'Purchase' ? 'Choose Supplier' : 'Choose Contact';
        const roleWanted = typeName === 'Purchase' ? 'supplier' : 'customer';
        const relevant = posContactsCache.filter(c => (c.role?.name || '').toLowerCase() === roleWanted);
        // "Cash Customer" (null contact) is always the uppermost option for Sales.
        const emptyLabel = typeName === 'Sales' ? 'Cash Customer' : '';
        sel.innerHTML = (typeName === 'Sales' ? `<option value="">Cash Customer</option>` : '') +
            relevant.map(c => `<option value="${c.id}">${c.contact.name}</option>`).join('');
        sel.value = posMeta.typeName === typeName ? (posMeta.contactScId || '') : '';
    } else {
        group.style.display = 'none';
        sel.innerHTML = '<option value=""></option>';
    }
    if (typeof jQuery !== 'undefined') $(sel).trigger('change');
}

// Called by shared-modals.js (Quick Add Contact) after a new contact is saved,
// so the POS page's cached contact list and the open Edit Cart Details modal's
// dropdown reflect it immediately — without requiring a page reload.
window.refreshPosContactsCache = async function(newlyCreatedContactId) {
    if (!posActiveStoreId) return; // POS page isn't the active page / not initialized

    const { data: contacts } = await window.supabaseClient
        .from('store_contact')
        .select('id, contact (id, name), role (name)')
        .eq('store', posActiveStoreId);

    posContactsCache = (contacts || []).filter(c => c.contact &&
        ['customer', 'supplier'].includes((c.role?.name || '').toLowerCase()));

    // If the Edit Cart Details modal is currently open, re-render its dropdown
    // for whatever trans type is selected, and select the new contact.
    const modal = document.getElementById('pos-meta-modal');
    if (modal && modal.classList.contains('active')) {
        const typeSel = document.getElementById('pos-trans-type');
        const type = posTransTypesCache.find(t => String(t.id) === typeSel.value);
        populatePosContactSelectForType(type?.name || '');

        if (newlyCreatedContactId) {
            const sel = document.getElementById('pos-customer');
            const newScRow = posContactsCache.find(c => String(c.contact.id) === String(newlyCreatedContactId));
            if (sel && newScRow) {
                sel.value = String(newScRow.id);
                if (typeof jQuery !== 'undefined') $(sel).trigger('change.select2');
            }
        }
    }
};

function wirePosCartMetaModal() {
    const editBtn = document.getElementById('pos-edit-cart-meta');
    const modal = document.getElementById('pos-meta-modal');
    const closeBtn = document.getElementById('pos-close-modal');
    const cancelBtn = document.getElementById('pos-cancel-modal');
    const saveBtn = document.getElementById('pos-save-modal');
    const typeSel = document.getElementById('pos-trans-type');
    const dateInput = document.getElementById('pos-date');
    const noteInput = document.getElementById('pos-note');

    typeSel.innerHTML = posTransTypesCache.map(t => `<option value="${t.id}">${t.name}</option>`).join('');

    // Contact select only ever gets populated through this handler — never called
    // directly on modal open — so choosing/confirming a trans type is always the
    // trigger, per the "force the choice" requirement.
    if (typeof jQuery !== 'undefined') {
        $(typeSel).on('change', function() {
            const type = posTransTypesCache.find(t => String(t.id) === this.value);
            populatePosContactSelectForType(type?.name || '');
        });
    }

    const openModal = () => {
        typeSel.value = posMeta.typeId || '';
        dateInput.value = window.toDatetimeLocalInput(posMeta.date);
        noteInput.value = posMeta.note || '';
        modal.classList.add('active');
        if (typeof jQuery !== 'undefined') {
            $(typeSel).select2({ dropdownParent: $(modal) });
            $('#pos-customer').select2({ dropdownParent: $(modal) });
            // Fires the change handler above, which populates contact — this is the
            // one and only path that populates it, whether it's the default Sales
            // value or a value the user just changed.
            $(typeSel).trigger('change');
        }
    };
    const closeModal = () => modal.classList.remove('active');

    if (editBtn) editBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const typeId = typeSel.value;
            const type = posTransTypesCache.find(t => String(t.id) === typeId);
            const contactSel = document.getElementById('pos-customer');
            const contactId = contactSel.value || null;
            const contactLabel = contactId
                ? (contactSel.options[contactSel.selectedIndex]?.text || 'Cash Customer')
                : 'Cash Customer';

            posMeta = {
                contactScId: contactId,
                contactLabel,
                typeId: type?.id || null,
                typeName: type?.name || '',
                date: window.fromDatetimeLocalInput(dateInput.value),
                note: noteInput.value.trim()
            };

            updatePosBadges();
            renderPosCart(); // re-check cart quantities against the (possibly new) transaction type's stock direction
            closeModal();
        });
    }
}

// --- Checkout ---
function wirePosCheckoutModal() {
    const checkoutModal = document.getElementById('checkoutModal');
    const closeBtn = document.getElementById('checkout-close-modal');
    const cancelBtn = document.getElementById('checkout-cancel-btn');
    const submitBtn = document.getElementById('checkout-submit-btn');
    const receivedInput = document.getElementById('checkout-amount-received');
    const toPayInput = document.getElementById('checkout-amount-to-pay');
    const balanceInput = document.getElementById('checkout-balance');

    const formatMoney = (val) => {
        const num = parseFloat(val);
        return isNaN(num) ? '0.00' : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const updateBalance = () => {
        const toPay = parseFloat(toPayInput.value.replace(/[^0-9.-]/g, '')) || 0;
        const received = parseFloat(receivedInput.value.replace(/[^0-9.-]/g, '')) || 0;
        balanceInput.value = formatMoney(toPay - received);
    };

    const closeModal = () => checkoutModal.classList.remove('active');

    window.openCheckoutModal = function() {
        if (!posCart.length) { alert('Cart is empty.'); return; }

        const round2 = n => Math.round((n + Number.EPSILON) * 100) / 100;

        const subtotal = round2(computePosSubtotal());
        const shipping = round2(parseFloat(document.getElementById('pos-shipping-amount')?.value) || 0);
        const taxSelId = document.getElementById('pos-tax-select')?.value || '';
        const taxRecord = posTaxCache.find(t => String(t.id) === taxSelId);
        const taxAmount = round2(taxRecord ? subtotal * (Number(taxRecord.percentage) || 0) : 0);
        const discount = round2(parseFloat(document.getElementById('pos-discount-amount')?.value) || 0);
        const preRoundTotal = round2(subtotal + shipping + taxAmount - discount);
        const { rounded: total } = window.computeBnmRounding(preRoundTotal);

        toPayInput.value = formatMoney(total);
        receivedInput.value = formatMoney(total);
        balanceInput.value = '0.00';
        document.getElementById('checkout-note').value = '';

        checkoutModal.classList.add('active');
        if (typeof jQuery !== 'undefined') {
            $('#checkout-payment-method').select2({ dropdownParent: $(checkoutModal) });
        }
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (checkoutModal) checkoutModal.addEventListener('click', (e) => { if (e.target === checkoutModal) closeModal(); });

    if (receivedInput) {
        receivedInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9.]/g, '');
            updateBalance();
        });
        receivedInput.addEventListener('focus', function() { this.select(); });
        receivedInput.addEventListener('blur', function() { this.value = formatMoney(this.value); });
    }

    if (submitBtn) submitBtn.addEventListener('click', handlePosCheckoutSubmit);
}

async function handlePosCheckoutSubmit() {
    const submitBtn = document.getElementById('checkout-submit-btn');
    const originalHtml = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';

    try {
        const round2 = n => Math.round((n + Number.EPSILON) * 100) / 100;
        
        const type = posTransTypesCache.find(t => String(t.id) === String(posMeta.typeId));
        if (!type) throw new Error('Please select a transaction type.');

        const subtotal = round2(computePosSubtotal());
        const shipping = round2(parseFloat(document.getElementById('pos-shipping-amount')?.value) || 0);
        const shipperId = document.getElementById('pos-shipper-select')?.value || null;
        const taxSelId = document.getElementById('pos-tax-select')?.value || '';
        const taxRecord = posTaxCache.find(t => String(t.id) === taxSelId);
        const taxAmount = round2(taxRecord ? subtotal * (Number(taxRecord.percentage) || 0) : 0);
        const discount = round2(parseFloat(document.getElementById('pos-discount-amount')?.value) || 0);
        const preRoundTotal = round2(subtotal + shipping + taxAmount - discount);
        const { rounded: total, rounding } = window.computeBnmRounding(preRoundTotal);
        const payMethodId = document.getElementById('checkout-payment-method')?.value || null;

        const receivedRaw = document.getElementById('checkout-amount-received').value;
        const received = parseFloat(String(receivedRaw).replace(/[^0-9.-]/g, '')) || 0;
        if (received < 0) throw new Error('Please enter a valid amount received.');

        const status = received >= total ? 3 : 1;

        const tellerScId = await resolvePosTellerScId();
        const transNo = await window.generateTransNo(type, posMeta.date, posStoreUrlCache);

        const { data: newTrans, error: transErr } = await window.supabaseClient.from('trans').insert({
            type: type.id,
            status,
            trans_no: transNo,
            date: posMeta.date,
            store: posActiveStoreId,
            teller: tellerScId,
            contact: posMeta.contactScId || null,
            rm_discount: discount,
            rounding,
            note: posMeta.note || null
        }).select('id').single();

        if (transErr || !newTrans) throw transErr || new Error('Failed to create transaction.');
        const newTransId = newTrans.id;

        const { error: itemsErr } = await window.supabaseClient.from('trans_product').insert(
            posCart.map(item => ({
                trans: newTransId,
                store_product: item.store_product_id,
                qty_order: item.qty,
                price_final: item.price
            }))
        );
        if (itemsErr) throw itemsErr;

        if (shipperId) {
            await window.supabaseClient.from('trans_ship').insert({
                trans: newTransId, status: 1, shipper: shipperId || null, amount: shipping
            });
        }
        if (taxRecord && Number(taxRecord.percentage) > 0) {
            await window.supabaseClient.from('trans_tax').insert({
                trans: newTransId, tax: taxRecord.id, amount: taxAmount
            });
        }

        if (received > 0) {
            await window.supabaseClient.from('trans_payment').insert({
                trans: newTransId,
                pay_ref: null,
                date: posMeta.date,
                rm_pay: received,
                teller: tellerScId,
                payer: posMeta.contactScId || null,
                pay_method: payMethodId,
                note: document.getElementById('checkout-note').value.trim() || null
            });
        }

        await window.applyStockMovement(type, posCart.map(item => {
            const sp = posProductsCache.find(s => String(s.id) === String(item.store_product_id));
            return { store_product: item.store_product_id, qty_order: item.qty, stock_control: sp?.product?.stock_control ?? 0 };
        }), 1);

        submitBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Paid!';
        submitBtn.style.backgroundColor = 'var(--success)';
        submitBtn.style.borderColor = 'var(--success)';

        setTimeout(() => {
            document.getElementById('checkoutModal').classList.remove('active');
            localStorage.setItem('view_trans_id', newTransId);
            navigateTo('transaction-view');
        }, 900);
    } catch (err) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHtml;
        alert('Checkout failed: ' + (err.message || 'unknown error'));
    }
}

async function resolvePosTellerScId() {
    const { data } = await window.supabaseClient
        .from('store_contact')
        .select('id')
        .eq('store', posActiveStoreId)
        .eq('contact', posCurrentContactId)
        .maybeSingle();
    return data?.id || null;
}

// --- Today Sales modal ---
function wirePosTodaySalesModal() {
    const modal = document.getElementById('pos-today-sales-modal');
    const openBtn = document.getElementById('pos-today-sales-btn');
    const closeBtn = document.getElementById('pos-close-today-sales-btn');
    const footerCloseBtn = document.getElementById('pos-today-sales-footer-close-btn');

    const close = () => modal && modal.classList.remove('active');
    const open = async () => {
        if (!modal) return;
        modal.classList.add('active');
        await loadPosTodaySales();
    };

    if (openBtn) openBtn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (footerCloseBtn) footerCloseBtn.addEventListener('click', close);
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.pos-print-dropdown')) {
            document.querySelectorAll('.pos-print-dropdown-menu').forEach(m => m.style.display = 'none');
        }
    });
}

function posTodayDateRange() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    return { start: window.formatDateTime(start), end: window.formatDateTime(end) };
}

async function loadPosTodaySales() {
    const tbody = document.getElementById('pos-today-sales-tbody');
    const badge = document.getElementById('pos-today-sales-date-badge');
    if (badge) badge.textContent = window.formatDateOnly(new Date());
    if (tbody) tbody.innerHTML = `<tr><td colspan="2" class="text-muted" style="text-align:center; padding:16px;">Loading...</td></tr>`;

    const tellerScId = await resolvePosTellerScId();
    if (!tellerScId) {
        if (tbody) tbody.innerHTML = `<tr><td colspan="2" class="text-muted" style="text-align:center; padding:16px;">Unable to determine your staff record for this store.</td></tr>`;
        return;
    }

    const { start, end } = posTodayDateRange();
    const { data, error } = await window.supabaseClient
        .from('trans')
        .select('id, trans_no, date')
        .eq('store', posActiveStoreId)
        .eq('teller', tellerScId)
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: false });

    if (error || !data || !data.length) {
        if (tbody) tbody.innerHTML = `<tr><td colspan="2" class="text-muted" style="text-align:center; padding:16px;">No sales recorded today.</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(r => `
        <tr>
            <td><a href="#" class="pos-today-sale-link" data-trans-id="${r.id}" style="color:#2563eb; font-weight:600; text-decoration:none;">${r.trans_no || '-'}</a></td>
            <td class="text-right">
                <div class="pos-print-dropdown" style="position: relative; display: inline-block;">
                    <button type="button" class="outline-btn pos-print-dropdown-btn" data-trans-id="${r.id}" style="padding: 6px 12px; font-size: 0.8rem;">
                        <i class="fa-solid fa-print"></i> <i class="fa-solid fa-chevron-down" style="font-size: 0.65em; margin-left: 4px;"></i>
                    </button>
                    <div class="pos-print-dropdown-menu" style="display:none; position:absolute; top:110%; right:0; background:var(--bg-card); border:1px solid var(--border-color); border-radius:var(--radius-md); box-shadow:var(--shadow-lg); min-width:140px; z-index:400; overflow:hidden;">
                        <a href="#" class="pos-print-receipt-link" data-trans-id="${r.id}" style="display:flex; align-items:center; gap:8px; padding:8px 14px; color:var(--text-main); text-decoration:none; font-size:0.85rem;"><i class="fa-solid fa-receipt" style="width:14px;"></i> Receipt</a>
                        <a href="#" class="pos-print-a4-link" data-trans-id="${r.id}" style="display:flex; align-items:center; gap:8px; padding:8px 14px; color:var(--text-main); text-decoration:none; font-size:0.85rem; border-top:1px solid var(--border-color);"><i class="fa-solid fa-file-lines" style="width:14px;"></i> A4</a>
                    </div>
                </div>
            </td>
        </tr>
    `).join('');

    tbody.querySelectorAll('.pos-today-sale-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            posOpenTransInNewTab(link.getAttribute('data-trans-id'));
        });
    });

    tbody.querySelectorAll('.pos-print-dropdown-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const menu = btn.nextElementSibling;
            const isOpen = menu.style.display === 'block';
            document.querySelectorAll('.pos-print-dropdown-menu').forEach(m => m.style.display = 'none');
            menu.style.display = isOpen ? 'none' : 'block';
        });
    });

    tbody.querySelectorAll('.pos-print-receipt-link').forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            document.querySelectorAll('.pos-print-dropdown-menu').forEach(m => m.style.display = 'none');
            await posPrintSale(link.getAttribute('data-trans-id'), 'receipt');
        });
    });
    tbody.querySelectorAll('.pos-print-a4-link').forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            document.querySelectorAll('.pos-print-dropdown-menu').forEach(m => m.style.display = 'none');
            await posPrintSale(link.getAttribute('data-trans-id'), 'a4');
        });
    });
}

function posOpenTransInNewTab(transId) {
    localStorage.setItem('view_trans_id', transId);
    const url = window.location.protocol === 'file:'
        ? window.location.pathname + '?page=transaction-view'
        : window.location.origin + '/transaction-view';
    window.open(url, '_blank');
}

// --- Print (Receipt / A4) for a past sale, fetched fresh ---
async function fetchPosSaleForPrint(transId) {
    const { data: trans, error } = await window.supabaseClient.from('trans').select(`
        id, trans_no, date, rm_discount, rounding, status, note,
        trans_type (id, name, iso, ope_rm, ope_qty),
        contact_sc:store_contact!trans_contact_fkey (id, contact (id, name)),
        teller_sc:store_contact!trans_teller_fkey (id, contact (id, name)),
        trans_product (id, store_product, qty_order, price_final),
        trans_ship (id, amount, shipper),
        trans_tax (id, tax, amount),
        trans_payment (id, pay_ref, date, rm_pay, note, pay_method (id, name))
    `).eq('id', transId).maybeSingle();

    if (error || !trans) return null;

    const spIds = (trans.trans_product || []).map(tp => tp.store_product).filter(Boolean);
    let spMap = {};
    if (spIds.length) {
        const { data: sps } = await window.supabaseClient
            .from('store_product')
            .select('id, product (id, sku, name, uom (id, name, iso))')
            .in('id', spIds);
        (sps || []).forEach(sp => { spMap[sp.id] = sp; });
    }

    const items = (trans.trans_product || []).map(tp => {
        const sp = spMap[tp.store_product];
        return {
            name: sp?.product?.name || '(deleted product)',
            sku: sp?.product?.sku || '',
            uom: sp?.product?.uom?.iso || '',
            price: Number(tp.price_final) || 0,
            qty: Number(tp.qty_order) || 0
        };
    });

    const [{ data: company }, { data: store }] = await Promise.all([
        window.supabaseClient.from('company').select('id, name, ssm, tel, email, web, address').limit(1).maybeSingle(),
        window.supabaseClient.from('store').select('id, name, url, email, tel, address').eq('id', posActiveStoreId).maybeSingle()
    ]);

    return {
        trans,
        transType: trans.trans_type,
        items,
        payments: trans.trans_payment || [],
        company: company || null,
        store: store || null,
        tellerName: trans.teller_sc?.contact?.name || '-'
    };
}

function posRound2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }

function posComputeTotals(sale) {
    const subtotal = posRound2(sale.items.reduce((s, i) => s + i.qty * i.price, 0));
    const shipping = posRound2((sale.trans.trans_ship || []).reduce((s, sh) => s + (Number(sh.amount) || 0), 0));
    const taxAmount = posRound2((sale.trans.trans_tax || []).reduce((s, tx) => s + (Number(tx.amount) || 0), 0));
    const discount = posRound2(Number(sale.trans.rm_discount) || 0);
    const rounding = posRound2(Number(sale.trans.rounding) || 0);
    const grandTotal = posRound2(subtotal + shipping + taxAmount - discount + rounding);
    const paid = posRound2(sale.payments.reduce((s, p) => s + (Number(p.rm_pay) || 0), 0));
    return { subtotal, shipping, taxAmount, discount, rounding, grandTotal, paid, balance: posRound2(grandTotal - paid) };
}

function posEscape(str) {
    return (str || '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function posFormatDMY(dateStr) {
    const d = dateStr ? new Date(dateStr) : new Date();
    if (isNaN(d.getTime())) return '-';
    const pad = n => String(n).padStart(2, '0');
    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
}
function posFormatTime12(dateStr) {
    const d = dateStr ? new Date(dateStr) : new Date();
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}
function posBuyerLabel(sale) {
    return sale.trans.contact_sc?.contact?.name ? sale.trans.contact_sc.contact.name.toUpperCase() : 'Cash Customer';
}
function posPaymentLines(sale) {
    return sale.payments.map(p => ({ method: p.pay_method?.name || 'Other', amount: Number(p.rm_pay) || 0, note: p.note || '' }));
}

function posOpenPrintWindow(html, title) {
    const printWindow = window.open('', '_blank', 'width=850,height=1000');
    if (!printWindow) { alert('Please allow pop-ups to print.'); return; }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.document.title = title;
    const doPrint = () => { printWindow.focus(); printWindow.print(); };
    if (printWindow.document.readyState === 'complete') setTimeout(doPrint, 200);
    else printWindow.onload = () => setTimeout(doPrint, 200);
}

function buildPosReceiptHtml(sale) {
    const company = sale.company, store = sale.store;
    const totals = posComputeTotals(sale);
    const paymentLines = posPaymentLines(sale);

    const itemsRows = sale.items.map(i => `
        <tr><td colspan="3" style="padding-top: 6px; font-weight: 600;">${posEscape(i.name)}<br><span style="font-size: 11px; color: #555;">${posEscape(i.sku)}</span></td></tr>
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
    <div class="center bold" style="font-size: 14px;">${posEscape(company?.name || 'COMPANY NAME')}</div>
    ${company?.ssm ? `<div class="center">[ ${posEscape(company.ssm)} ]</div>` : ''}
    <div class="center">${posEscape(company?.address || '').replace(/\n/g, '<br>')}</div>
    <div class="center">${[company?.tel, company?.email].filter(Boolean).map(posEscape).join(' | ')}</div>
    <div class="divider"></div>
    <div class="bold center">${posEscape((sale.transType?.name || '').toUpperCase())}</div>
    <div class="center">${posEscape(sale.trans.trans_no || '')}</div>
    <div class="center">${posEscape(posBuyerLabel(sale))}</div>
    <div class="divider"></div>
    <table>
        <thead><tr class="bold"><td>QTY</td><td class="text-right">PRICE [RM]</td><td class="text-right">TOTAL [RM]</td></tr></thead>
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
            <tr class="totals-row"><td colspan="2">*** Method: ${posEscape(p.method)}</td><td class="text-right">${p.amount.toFixed(2)}</td></tr>
            ${p.note ? `<tr class="totals-row"><td colspan="3" class="pay-note">Note: ${posEscape(p.note)}</td></tr>` : ''}
        `).join('')}
        <tr class="totals-row bold"><td colspan="2">BALANCE [RM]</td><td class="text-right">${Math.max(0, totals.balance).toFixed(2)}</td></tr>
    </table>
    <div class="divider"></div>
    <div class="center">${posEscape((sale.tellerName || '-').toUpperCase())} ${posEscape((store?.name || '').toUpperCase())} ${new Date().getFullYear()}</div>
    <div class="center">${posFormatDMY(new Date())} ${posFormatTime12(new Date())}</div>
    <div class="divider"></div>
    <div class="center bold">-- Thank You --</div>
</body></html>`;
}

function buildPosA4Html(sale) {
    const company = sale.company, store = sale.store;
    const totals = posComputeTotals(sale);

    const itemsRows = sale.items.map(i => `
        <tr>
            <td>${posEscape(i.name)}<br><span style="font-size: 11px; color: #666;">${posEscape(i.sku)}</span></td>
            <td class="text-right">${i.qty.toFixed(3)}${i.uom ? ' ' + posEscape(i.uom) : ''}</td>
            <td class="text-right">${i.price.toFixed(2)}</td>
            <td class="text-right">${(i.qty * i.price).toFixed(2)}</td>
        </tr>
    `).join('');

    const paymentRows = sale.payments.map(p => `
        <tr>
            <td>${posFormatDMY(p.date)}</td>
            <td>${posEscape((p.pay_method?.name || '-').toUpperCase())}</td>
            <td>${posEscape(p.pay_ref || '-')}</td>
            <td>${posEscape(p.note || '-')}</td>
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
    .info-grid .box-title { font-weight: 700; font-size: 11px; text-transform: uppercase; color: #666; margin-bottom: 6px; }
    table.items { width: 100%; border-collapse: collapse; margin-top: 10px; }
    table.items th, table.items td { border-bottom: 1px solid #ddd; padding: 8px; text-align: left; }
    table.items th { background: #f5f5f5; font-size: 11px; text-transform: uppercase; }
    table.items td.text-right, table.items th.text-right { text-align: right; }
    table.trans-details { width: 100%; border-collapse: collapse; margin: 10px 0 20px 0; }
    table.trans-details th, table.trans-details td { border: 1px solid #ccc; padding: 5px 8px; text-align: left; font-size: 12px; }
    table.trans-details th { background: #f5f5f5; font-size: 11px; text-transform: uppercase; }
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
    .payment-section h3 { font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #ddd; padding-bottom: 6px; }
</style>
</head>
<body>
    <div class="header">
        <div>
            <h1>${posEscape(company?.name || 'COMPANY NAME')}</h1>
            ${company?.ssm ? `<p>[ ${posEscape(company.ssm)} ]</p>` : ''}
            <p>${posEscape(company?.address || '').replace(/\n/g, '<br>')}</p>
            <p>${[company?.tel, company?.email].filter(Boolean).map(posEscape).join(' | ')}</p>
        </div>
        <div class="type-label">${posEscape((sale.transType?.name || '').toUpperCase())}</div>
    </div>
    <div class="info-grid">
        <div class="box">
            <div class="box-title">Buyer</div>
            <p><strong>${posEscape(posBuyerLabel(sale))}</strong></p>
        </div>
        <div class="box">
            <div class="box-title">Store</div>
            <p><strong>${posEscape((store?.name || '').toUpperCase())}</strong></p>
            <p>${posEscape(store?.address || '').replace(/\n/g, '<br>')}</p>
        </div>
    </div>
    <table class="trans-details">
        <thead><tr><th>Trans No</th><th>Date</th><th>Status</th><th>Teller</th><th>Note</th></tr></thead>
        <tbody>
            <tr>
                <td>${posEscape(sale.trans.trans_no || '')}</td>
                <td>${posFormatDMY(sale.trans.date)}</td>
                <td>${posEscape((POS_STATUS_LABELS[sale.trans.status] || '').toUpperCase())}</td>
                <td>${posEscape((sale.tellerName || '-').toUpperCase())}</td>
                <td>${posEscape(sale.trans.note || 'NONE')}</td>
            </tr>
        </tbody>
    </table>
    <table class="items">
        <thead><tr><th>Product</th><th class="text-right">Qty</th><th class="text-right">Price [RM]</th><th class="text-right">Total [RM]</th></tr></thead>
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
        <div class="print-date">Print Date : ${posFormatDMY(new Date())}</div>
        <div class="signature-line"></div>
        <div class="signature-label">${posEscape(posBuyerLabel(sale))}</div>
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

async function posPrintSale(transId, mode) {
    const sale = await fetchPosSaleForPrint(transId);
    if (!sale) { alert('Failed to load sale details.'); return; }
    const html = mode === 'receipt' ? buildPosReceiptHtml(sale) : buildPosA4Html(sale);
    posOpenPrintWindow(html, mode === 'receipt' ? 'Receipt' : 'Transaction');
}

// --- Reset POS page back to a fresh state (used by the Cancel Transaction flow) ---
window.resetPosPage = function() {
    const cancelModal = document.getElementById('cancelModal');
    if (cancelModal) cancelModal.classList.remove('active');

    posCart = [];

    const salesType = posTransTypesCache.find(t => t.name === 'Sales') || posTransTypesCache[0];
    posMeta = {
        contactScId: null,
        contactLabel: 'Cash Customer',
        typeId: salesType?.id || null,
        typeName: salesType?.name || '',
        date: window.formatDateTime(new Date()),
        note: ''
    };

    const shippingInput = document.getElementById('pos-shipping-amount');
    const discountInput = document.getElementById('pos-discount-amount');
    if (shippingInput) shippingInput.value = '0.00';
    if (discountInput) discountInput.value = '0.00';

    populatePosShipperSelect();
    populatePosTaxSelect();
    populatePosCategorySelector();

    const searchInput = document.getElementById('pos-product-search-input');
    if (searchInput) searchInput.value = '';

    renderPosProductGrid();
    renderPosCart();
    updatePosBadges();

    if (typeof window.initializeSelect2 === 'function') window.initializeSelect2();
};