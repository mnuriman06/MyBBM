async function renderSidebar(currentPath) {
    const activeStoreId = localStorage.getItem('active_store_id');
    const userStores = await window.getUserStores();
    const storeInfo = userStores.find(e => e.id == activeStoreId);

    return `
        <aside class="sidebar">
            <div class="sidebar-header">
                <div class="logo">
                    <i class="fa-solid fa-shop"></i>
                    <span>ADVRetail</span>
                </div>
            </div>
            <ul class="nav-links">
                <li class="${currentPath === 'dashboard' || currentPath === '' || currentPath === '/' ? 'active' : ''}"><a href="/dashboard" data-link="dashboard"><i class="fa-solid fa-chart-line"></i> Dashboard</a></li>
                <li class="${currentPath === 'contact' ? 'active' : ''}"><a href="/contact" data-link="contact"><i class="fa-solid fa-users"></i> Contact</a></li>
                <li class="${currentPath === 'store' ? 'active' : ''}"><a href="/store" data-link="store"><i class="fa-solid fa-store"></i> Store</a></li>
                <li class="${currentPath === 'product' ? 'active' : ''}"><a href="/product" data-link="product"><i class="fa-solid fa-bag-shopping"></i> Product</a></li>
                <li class="${currentPath === 'stock' ? 'active' : ''}"><a href="/stock" data-link="stock"><i class="fa-solid fa-boxes-stacked"></i> Stock</a></li>
                <li class="${currentPath === 'transaction' || currentPath === 'transaction-view' ? 'active' : ''}"><a href="/transaction" data-link="transaction"><i class="fa-solid fa-right-left"></i> Transactions</a></li>
                <li class="${currentPath === 'expenses' ? 'active' : ''}"><a href="/expenses" data-link="expenses"><i class="fa-solid fa-wallet"></i> Expenses</a></li>
                <li class="${currentPath === 'salary' ? 'active' : ''}"><a href="/salary" data-link="salary"><i class="fa-solid fa-money-check-dollar"></i> Salary</a></li>
            </ul>
            <div class="sidebar-footer" style="padding: 0;">
                <div class="store-selector-box" style="padding: 16px 20px; border-bottom: 1px solid var(--border-color); background-color: #f8fafc; margin-bottom: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <label class="form-label" style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted); margin: 0; display: block; letter-spacing: 0.5px;">ACTIVE STORE</label>
                        <a href="javascript:void(0);" id="active-store-details-link" style="color: var(--primary); font-size: 1rem;" title="Store Profile"><i class="fa-solid fa-store"></i></a>
                    </div>
                    <select id="global-store-selector" class="select2-search" data-placeholder="Select Store" style="width: 100%;">
                        ${userStores.map((elem) => { return `<option value="${elem.id}" ${String(activeStoreId) === String(elem.id) ? 'selected' : ''}>${elem.name}</option>`; }).join("")}
                    </select>
                </div>
            </div>
        </aside>

        <!-- Global Store Change Modal -->
        <div id="global-store-modal" class="modal-overlay">
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h2 style="margin: 0; font-size: 1.25rem;">Change Active Store</h2>
                    <button type="button" class="close-modal-btn" onclick="cancelGlobalStoreChange()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--text-muted);"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="modal-body" style="padding: 24px;">
                    <p style="margin: 0; color: var(--text-muted); font-size: 0.95rem; line-height: 1.5;">Are you sure you want to change the active store? This will reload your dashboard context.</p>
                </div>
                <div class="modal-footer" style="padding: 16px 24px; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 12px;">
                    <button type="button" class="outline-btn" onclick="cancelGlobalStoreChange()">No</button>
                    <button type="button" class="primary-btn" onclick="confirmGlobalStoreChange()">Yes</button>
                </div>
            </div>
        </div>
    `;
}