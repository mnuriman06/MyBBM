function render_dashboard() {
    return `
            <div class="dashboard-body">
                <div class="page-header" style="margin-bottom: 24px;">
                    <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                        <h1 style="margin: 0;">Dashboard Overview</h1>
                        <span id="dashboard-active-store-badge" style="font-size: 0.85rem; font-weight: 600; color: var(--success); background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 4px 12px; border-radius: 20px; display: inline-flex; align-items: center; gap: 6px;"><i class="fa-solid fa-store"></i> <span id="dashboard-active-store-name">Loading...</span></span>
                    </div>
                </div>

                <!-- Stats Cards -->
                <div class="stats-grid" style="grid-template-columns: repeat(5, 1fr); gap: 16px;">
                    <!-- 1. Sales -->
                    <div class="stat-card">
                        <div class="stat-icon revenue"><i class="fa-solid fa-chart-line"></i></div>
                        <div class="stat-details">
                            <p>SALES</p>
                            <h3>4,520.50</h3>
                            <span class="trend positive"><i class="fa-solid fa-arrow-up"></i> +12.5%</span>
                        </div>
                    </div>
                    <!-- 2. Purchase -->
                    <div class="stat-card">
                        <div class="stat-icon orders"><i class="fa-solid fa-cart-shopping"></i></div>
                        <div class="stat-details">
                            <p>PURCHASE</p>
                            <h3>2,850.00</h3>
                            <span class="trend positive"><i class="fa-solid fa-arrow-up"></i> +8.4%</span>
                        </div>
                    </div>
                    <!-- 3. Stock Up -->
                    <div class="stat-card">
                        <div class="stat-icon" style="background-color: rgba(16, 185, 129, 0.1); color: var(--success);"><i class="fa-solid fa-boxes-stacked"></i></div>
                        <div class="stat-details">
                            <p>STOCK UP</p>
                            <h3>850.00</h3>
                            <span class="trend positive"><i class="fa-solid fa-arrow-up"></i> +4.7%</span>
                        </div>
                    </div>
                    <!-- 4. Return -->
                    <div class="stat-card">
                        <div class="stat-icon" style="background-color: var(--warning-bg); color: var(--warning);"><i class="fa-solid fa-rotate-left"></i></div>
                        <div class="stat-details">
                            <p>RETURN</p>
                            <h3>180.00</h3>
                            <span class="trend negative"><i class="fa-solid fa-arrow-down"></i> -2.1%</span>
                        </div>
                    </div>
                    <!-- 5. Expenses -->
                    <div class="stat-card">
                        <div class="stat-icon stock"><i class="fa-solid fa-file-invoice-dollar"></i></div>
                        <div class="stat-details">
                            <p>EXPENSES</p>
                            <h3>1,250.00</h3>
                            <span class="trend negative"><i class="fa-solid fa-arrow-down"></i> -1.5%</span>
                        </div>
                    </div>
                </div>

                <!-- Profit & Loss Table -->
                <div class="data-card" style="margin-bottom: 24px;">
                    <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
                        <h2 style="display: flex; align-items: center; gap: 12px; margin: 0;">
                            Profit & Lost 
                            <input type="month" class="form-input" value="2026-05" style="padding: 4px 8px; width: auto; font-size: 0.9rem;">
                        </h2>
                        <button class="outline-btn" title="Export as PDF" style="padding: 6px 12px;"><i class="fa-solid fa-file-pdf" style="color: #ef4444;"></i> Export PDF</button>
                    </div>
                    <div class="table-responsive" style="max-height: 400px; overflow-y: auto; overflow-x: auto; position: relative;">
                        <table class="data-table" style="min-width: 800px; border-collapse: separate; border-spacing: 0;">
                            <thead style="position: sticky; top: 0; background: #ffffff; z-index: 10;">
                                <tr>
                                    <th style="position: sticky; left: 0; top: 0; background: #ffffff; z-index: 11; width: 120px; box-shadow: 1px 1px 0 var(--border-color), 0 1px 0 var(--border-color);">DATE</th>
                                    <th style="box-shadow: 0 1px 0 var(--border-color);">SALES (+)</th>
                                    <th style="box-shadow: 0 1px 0 var(--border-color);">PURCHASE (-)</th>
                                    <th style="box-shadow: 0 1px 0 var(--border-color);">STOCK UP (+)</th>
                                    <th style="box-shadow: 0 1px 0 var(--border-color);">RETURN (-)</th>
                                    <th style="box-shadow: 0 1px 0 var(--border-color);">EXPENSES (-)</th>
                                    <th style="box-shadow: 0 1px 0 var(--border-color);">BALANCE</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${(() => {
                                    let rows = '';
                                    for (let i = 31; i >= 1; i--) {
                                        const sales = Math.floor(Math.random() * 5000) + 1000;
                                        const purchase = Math.floor(Math.random() * 3000) + 500;
                                        const stockUp = Math.floor(Math.random() * 800) + 100;
                                        const returns = Math.floor(Math.random() * 300) + 20;
                                        const expenses = Math.floor(Math.random() * 500) + 100;
                                        const balance = sales - purchase + stockUp - returns - expenses;
                                        const bColor = balance >= 0 ? '#10b981' : '#ef4444';
                                        
                                        rows += `
                                        <tr>
                                            <td style="position: sticky; left: 0; background: #ffffff; font-weight: 500; white-space: nowrap; box-shadow: 1px 0 0 var(--border-color); z-index: 1;">${window.formatDateOnly(`2026-05-${String(i).padStart(2,'0')}`)}</td>
                                            <td style="color: #10b981;">${sales.toFixed(2)}</td>
                                            <td style="color: #ef4444;">${purchase.toFixed(2)}</td>
                                            <td style="color: #10b981;">${stockUp.toFixed(2)}</td>
                                            <td style="color: #ef4444;">${returns.toFixed(2)}</td>
                                            <td style="color: #ef4444;">${expenses.toFixed(2)}</td>
                                            <td style="font-weight: bold; color: ${bColor};">${balance.toFixed(2)}</td>
                                        </tr>`;
                                    }
                                    return rows;
                                })()}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Charts Section -->
                <div class="charts-grid" style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px; margin-bottom: 24px;">
                    <!-- Bar Chart -->
                    <div class="data-card">
                        <div class="card-header">
                            <h2>Sales vs Purchase vs Expenses 2026</h2>
                        </div>
                        <div style="padding: 16px; position: relative; height: 300px;">
                            <canvas id="salesPurchaseChart"></canvas>
                        </div>
                    </div>

                    <!-- Pie Chart -->
                    <div class="data-card">
                        <div class="card-header">
                            <h2>Sales by Category</h2>
                        </div>
                        <div style="padding: 16px; position: relative; height: 300px; display: flex; justify-content: center; align-items: center;">
                            <canvas id="salesByCategoryChart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Tables Section -->
                <div class="data-section">
                    <!-- Recent Sales -->
                    <div class="data-card">
                        <div class="card-header">
                            <h2>Recent POS Sales</h2>
                            <a href="/transaction" data-link="transaction" class="view-all">View All</a>
                        </div>
                        <div class="table-responsive">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Time</th>
                                        <th>Items</th>
                                        <th>Total</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>#ORD-7352</td>
                                        <td>10:42 AM</td>
                                        <td>3</td>
                                        <td>$124.00</td>
                                        <td><span class="status completed">Completed</span></td>
                                    </tr>
                                    <tr>
                                        <td>#ORD-7351</td>
                                        <td>10:15 AM</td>
                                        <td>1</td>
                                        <td>$45.50</td>
                                        <td><span class="status completed">Completed</span></td>
                                    </tr>
                                    <tr>
                                        <td>#ORD-7350</td>
                                        <td>09:55 AM</td>
                                        <td>5</td>
                                        <td>$310.20</td>
                                        <td><span class="status pending">Pending</span></td>
                                    </tr>
                                    <tr>
                                        <td>#ORD-7349</td>
                                        <td>09:30 AM</td>
                                        <td>2</td>
                                        <td>$89.99</td>
                                        <td><span class="status completed">Completed</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Stock Management -->
                    <div class="data-card">
                        <div class="card-header">
                            <h2>Stock Alerts</h2>
                            <a href="/stock" data-link="stock" class="view-all">Manage Inventory</a>
                        </div>
                        <div class="table-responsive">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Product Name</th>
                                        <th>SKU</th>
                                        <th>In Stock</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Wireless Earbuds Pro</td>
                                        <td>WE-PRO-01</td>
                                        <td>5</td>
                                        <td><span class="stock-status critical">Critical</span></td>
                                    </tr>
                                    <tr>
                                        <td>Smart Watch Series 5</td>
                                        <td>SW-S5-BLK</td>
                                        <td>12</td>
                                        <td><span class="stock-status low">Low</span></td>
                                    </tr>
                                    <tr>
                                        <td>Ergonomic Keyboard</td>
                                        <td>EK-100-WHT</td>
                                        <td>18</td>
                                        <td><span class="stock-status low">Low</span></td>
                                    </tr>
                                    <tr>
                                        <td>USB-C Hub Adapter</td>
                                        <td>USB-C-HUB</td>
                                        <td>45</td>
                                        <td><span class="stock-status ok">Adequate</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
    `;
}

async function populateDashboardActiveStoreBadge() {
    const nameEl = document.getElementById('dashboard-active-store-name');
    if (!nameEl) return;

    const activeStoreId = await window.getActiveStoreId();
    const userStores = await window.getUserStores();
    const activeStore = userStores.find(s => String(s.id) === String(activeStoreId));

    nameEl.textContent = activeStore?.name || '-';
}

// Function to run after HTML is injected (e.g., to render charts)
function init_dashboard() {
    // Populate the active store name badge next to the page title.
    populateDashboardActiveStoreBadge();
    
    // We attempt to find the chart initialization logic from the original script
    // and execute it here so the charts render properly when the dashboard loads.
    
    // Check if Chart is available and canvas exists
    const spCanvas = document.getElementById('salesPurchaseChart');
    const catCanvas = document.getElementById('salesByCategoryChart');
    
    if (typeof Chart !== 'undefined') {
        if (spCanvas) {
            new Chart(spCanvas.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                    datasets: [
                        { label: 'Sales', data: [65000, 59000, 80000, 81000, 56000, 55000, 40000, 60000, 75000, 90000, 85000, 110000], backgroundColor: '#6366f1' },
                        { label: 'Purchase', data: [28000, 48000, 40000, 19000, 86000, 27000, 90000, 45000, 55000, 65000, 50000, 70000], backgroundColor: '#cbd5e1' },
                        { label: 'Expenses', data: [15000, 22000, 18000, 14000, 28000, 12000, 25000, 18000, 20000, 22000, 16000, 25000], backgroundColor: '#f43f5e' }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
        
        if (catCanvas) {
            new Chart(catCanvas.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['Electronics', 'Clothing', 'Food', 'Accessories'],
                    datasets: [{
                        data: [300, 50, 100, 40],
                        backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ec4899']
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
    }
}
