function render_outstanding() {
    return `<div class="dashboard-body">
                <div class="page-header">
                    <h1>Outstanding Accounts & Invoices</h1>
                    <div class="header-actions-group">
                        <button class="primary-btn" onclick="navigateTo('statement'); return false;"><i class="fa-solid fa-file-invoice"></i> View Statement</button>
                    </div>
                </div>

                <!-- Summary Cards -->
                <div class="stats-grid" style="margin-bottom: 24px;">
                    <div class="stat-card">
                        <div class="stat-icon" style="background-color: var(--danger-bg); color: var(--danger);"><i class="fa-solid fa-file-invoice-dollar"></i></div>
                        <div class="stat-details">
                            <p>TOTAL OUTSTANDING</p>
                            <h3 id="stat-total-outstanding">RM 2,861.10</h3>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon" style="background-color: var(--warning-bg); color: var(--warning);"><i class="fa-solid fa-clock"></i></div>
                        <div class="stat-details">
                            <p>OVERDUE INVOICES</p>
                            <h3 id="stat-overdue-count">3 Invoices</h3>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon" style="background-color: var(--info-bg); color: var(--info);"><i class="fa-solid fa-hourglass-half"></i></div>
                        <div class="stat-details">
                            <p>PENDING RECEIVABLES</p>
                            <h3 id="stat-pending-receivables">RM 1,850.00</h3>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon" style="background-color: #f1f5f9; color: #64748b;"><i class="fa-solid fa-user-clock"></i></div>
                        <div class="stat-details">
                            <p>UNPAID ACCOUNTS</p>
                            <h3 id="stat-unpaid-accounts-count">3 Accounts</h3>
                        </div>
                    </div>
                </div>

                <!-- Filter Bar -->
                <div class="filter-bar" style="display: flex; gap: 16px; align-items: flex-end; margin-bottom: 24px; padding: 16px; background: white; border-radius: 8px; border: 1px solid var(--border-color);">
                    <div class="form-group" style="position: relative; flex: 1;">
                        <label class="form-label" style="top: 10px; font-size: 0.7rem; color: var(--primary); font-weight: 600;">Search Contact / Invoice</label>
                        <input type="text" id="outstanding-search" class="form-input" placeholder="Search by name or reference...">
                    </div>
                    <div class="form-group" style="position: relative; width: 220px;">
                        <label class="form-label">Contact Type</label>
                        <select id="outstanding-type" class="select2-search" data-placeholder="Select Type" style="width: 100%;">
                            <option value="All" selected>All Types</option>
                            <option value="Customer">Customer (Sales)</option>
                            <option value="Supplier">Supplier (Purchase/Stock)</option>
                        </select>
                    </div>
                    <div class="form-group" style="position: relative; width: 220px;">
                        <label class="form-label">Overdue Range</label>
                        <select id="outstanding-range" class="select2-search" data-placeholder="Select Range" style="width: 100%;">
                            <option value="All" selected>All Overdue</option>
                            <option value="0-30">0 - 30 Days</option>
                            <option value="31-60">31 - 60 Days</option>
                            <option value="60+">Over 60 Days</option>
                        </select>
                    </div>
                    <button class="primary-btn search-submit-btn" id="btn-outstanding-filter" style="height: 46px; display: flex; align-items: center; justify-content: center;"><i class="fa-solid fa-magnifying-glass"></i></button>
                </div>

                <!-- Main Data Section -->
                <div class="data-card">
                    <div class="table-responsive view-container active">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Invoice / Ref</th>
                                    <th>Contact / Person</th>
                                    <th>Due Date</th>
                                    <th>Days Overdue</th>
                                    <th class="text-right">Total RM</th>
                                    <th class="text-right">Paid RM</th>
                                    <th class="text-right">Outstanding RM</th>
                                    <th class="text-center" style="width: 120px;">Action</th>
                                </tr>
                            </thead>
                            <tbody id="outstanding-table-body">
                                <!-- Dynamic Rows will be inserted here -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>`;
}

// In-memory mock outstanding database
let outstandingData = [
    {
        ref: "TRX-10024",
        type: "Supplier",
        person: "Tony Stark",
        phone: "019-8765432",
        email: "tony@stark.com",
        dueDate: "2026-05-10",
        total: 500.00,
        paid: 200.00,
        outstanding: 300.00,
        typeLabel: "Purchase"
    },
    {
        ref: "TRX-10026",
        type: "Customer",
        person: "Jane Doe",
        phone: "011-99887766",
        email: "jane.d@example.com",
        dueDate: "2026-05-01",
        total: 1250.00,
        paid: 0.00,
        outstanding: 1250.00,
        typeLabel: "Sales"
    },
    {
        ref: "TRX-10027",
        type: "Customer",
        person: "Robert Johnson",
        phone: "012-3456789",
        email: "robert.j@example.com",
        dueDate: "2026-04-15",
        total: 950.00,
        paid: 350.00,
        outstanding: 600.00,
        typeLabel: "Sales"
    },
    {
        ref: "TRX-10028",
        type: "Supplier",
        person: "Supplier A",
        phone: "-",
        email: "supplier@a.com",
        dueDate: "2026-03-10",
        total: 711.10,
        paid: 0.00,
        outstanding: 711.10,
        typeLabel: "Stock In"
    }
];

window.init_outstanding = function() {
    // Render the table rows dynamically
    renderOutstandingTable(outstandingData);

    // Initialize Select2
    initializeOutstandingSelect2();

    // Attach search and filter event listeners
    const searchBtn = document.getElementById('btn-outstanding-filter');
    if (searchBtn) {
        searchBtn.addEventListener('click', filterOutstandingData);
    }

    const searchInput = document.getElementById('outstanding-search');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                filterOutstandingData();
            }
        });
    }

    // Trigger filter on select changes
    if (typeof jQuery !== 'undefined') {
        $('#outstanding-type, #outstanding-range').on('change', filterOutstandingData);
    }
};

function calculateDaysOverdue(dueDateStr) {
    const today = new Date("2026-05-21"); // Current mock date
    const dueDate = new Date(dueDateStr);
    const diffTime = today - dueDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
}

function renderOutstandingTable(data) {
    const tbody = document.getElementById('outstanding-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    let totalOutstanding = 0;
    let overdueCount = 0;
    let pendingReceivables = 0;
    let unpaidAccounts = new Set();

    data.forEach(row => {
        const days = calculateDaysOverdue(row.dueDate);
        totalOutstanding += row.outstanding;
        unpaidAccounts.add(row.person);
        
        if (days > 0) {
            overdueCount++;
        }
        if (row.type === 'Customer') {
            pendingReceivables += row.outstanding;
        }

        const dateObj = new Date(row.dueDate);
        const formattedDueDate = window.formatDateOnly(row.dueDate);

        const daysBadgeClass = days > 60 ? 'status cancelled' : days > 30 ? 'status manager' : 'status pending';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <a href="#" onclick="navigateTo('transaction-view'); return false;" class="font-mono" style="color: #2563eb; font-weight: 600; text-decoration: none;">${row.ref}</a>
                        <span class="status ${row.type === 'Customer' ? 'staff' : 'customer'}" style="font-size: 0.7em; padding: 2px 6px;">${row.typeLabel}</span>
                    </div>
                </div>
            </td>
            <td>
                <div style="display: flex; flex-direction: column;">
                    <strong>${row.person}</strong>
                    <small class="text-muted">${row.phone}</small>
                </div>
            </td>
            <td>${formattedDueDate}</td>
            <td>
                <span class="${daysBadgeClass}" style="font-size: 0.8rem; padding: 4px 10px;">${days} Days</span>
            </td>
            <td class="text-right" style="font-weight: 500;">${row.total.toFixed(2)}</td>
            <td class="text-right" style="font-weight: 500; color: var(--success);">${row.paid.toFixed(2)}</td>
            <td class="text-right" style="font-weight: 700; color: var(--danger);">${row.outstanding.toFixed(2)}</td>
            <td class="text-center">
                <button class="action-btn" onclick="navigateTo('transaction-view')"><i class="fa-solid fa-eye"></i> View</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Update Statistics Cards
    const totalOutstandingEl = document.getElementById('stat-total-outstanding');
    const overdueCountEl = document.getElementById('stat-overdue-count');
    const pendingReceivablesEl = document.getElementById('stat-pending-receivables');
    const unpaidAccountsEl = document.getElementById('stat-unpaid-accounts-count');

    if (totalOutstandingEl) totalOutstandingEl.textContent = `RM ${totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (overdueCountEl) overdueCountEl.textContent = `${overdueCount} Invoice${overdueCount !== 1 ? 's' : ''}`;
    if (pendingReceivablesEl) pendingReceivablesEl.textContent = `RM ${pendingReceivables.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (unpaidAccountsEl) unpaidAccountsEl.textContent = `${unpaidAccounts.size} Account${unpaidAccounts.size !== 1 ? 's' : ''}`;
}

function filterOutstandingData() {
    const searchVal = (document.getElementById('outstanding-search')?.value || '').toLowerCase().trim();
    const typeVal = document.getElementById('outstanding-type')?.value || 'All';
    const rangeVal = document.getElementById('outstanding-range')?.value || 'All';

    const filtered = outstandingData.filter(row => {
        // Search filter
        const matchesSearch = row.ref.toLowerCase().includes(searchVal) || row.person.toLowerCase().includes(searchVal);
        
        // Type filter
        const matchesType = typeVal === 'All' || row.type === typeVal;

        // Overdue Range filter
        const days = calculateDaysOverdue(row.dueDate);
        let matchesRange = false;
        if (rangeVal === 'All') {
            matchesRange = true;
        } else if (rangeVal === '0-30') {
            matchesRange = days >= 0 && days <= 30;
        } else if (rangeVal === '31-60') {
            matchesRange = days > 30 && days <= 60;
        } else if (rangeVal === '60+') {
            matchesRange = days > 60;
        }

        return matchesSearch && matchesType && matchesRange;
    });

    renderOutstandingTable(filtered);
}

function initializeOutstandingSelect2() {
    if (typeof jQuery !== 'undefined' && $.fn.select2) {
        $('select.select2-search').each(function() {
            if (!$(this).hasClass("select2-hidden-accessible")) {
                $(this).select2({
                    width: '100%'
                });
            }
        });
    }
}
