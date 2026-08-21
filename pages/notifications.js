function render_notifications() {
    return `<div class="dashboard-body">
                <div class="page-header data-card" style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 16px; padding: 24px;">
                    <div style="flex-shrink: 0;">
                        <h1 style="margin-bottom: 4px;">Notifications</h1>
                        <p class="text-muted" style="margin: 0; font-size: 0.9rem;">You have 3 unread messages.</p>
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <div class="form-group" style="margin-bottom: 0; min-width: 200px;">
                            <label class="form-label">Search notifications...</label>
                            <input type="text" id="notif-search" placeholder=" " class="form-input" onkeyup="filterNotifications()">
                        </div>
                        <div class="form-group" style="margin-bottom: 0; min-width: 150px;">
                            <label class="form-label">Filter</label>
                            <select id="notif-filter" class="select2-search" data-placeholder="Filter" style="width: 100%;" onchange="filterNotifications()">
                                <option value="all">All</option>
                                <option value="unread" selected>Unread</option>
                                <option value="read">Read</option>
                            </select>
                        </div>
                        <button class="outline-btn" onclick="markAllRead()" style="white-space: nowrap; height: 42px;"><i class="fa-solid fa-check-double"></i> Mark all read</button>
                    </div>
                </div>

                <div class="data-card" style="padding: 0; background-color: transparent; border: none; box-shadow: none;">
                    <div class="notification-list">
                        
                        <!-- Unread Notification 1 -->
                        <div class="notification-item unread">
                            <div class="notification-icon icon-warning">
                                <i class="fa-solid fa-box-open"></i>
                            </div>
                            <div class="notification-content">
                                <h3>Low Stock Alert <span class="notification-time">10 mins ago</span></h3>
                                <p>The product <strong>Wireless Noise-Cancelling Headphones (WH-1002)</strong> is running low on stock. Only 2 items remaining.</p>
                                <div class="notification-actions">
                                    <button class="primary-btn btn-sm" onclick="window.location.href='stock.html'">View Stock</button>
                                    <button class="outline-btn btn-sm" onclick="this.closest('.notification-item').classList.remove('unread')">Mark as read</button>
                                </div>
                            </div>
                        </div>

                        <!-- Unread Notification 2 -->
                        <div class="notification-item unread">
                            <div class="notification-icon icon-success">
                                <i class="fa-solid fa-cash-register"></i>
                            </div>
                            <div class="notification-content">
                                <h3>New Online Order <span class="notification-time">1 hour ago</span></h3>
                                <p>A new online order (Ref: ORD-2026-892) has been successfully paid and is waiting for fulfillment. Total amount: RM 349.00.</p>
                                <div class="notification-actions">
                                    <button class="primary-btn btn-sm" onclick="window.location.href='transaction.html'">View Order</button>
                                    <button class="outline-btn btn-sm" onclick="this.closest('.notification-item').classList.remove('unread')">Mark as read</button>
                                </div>
                            </div>
                        </div>

                        <!-- Unread Notification 3 -->
                        <div class="notification-item unread">
                            <div class="notification-icon icon-wallet">
                                <i class="fa-solid fa-file-invoice-dollar"></i>
                            </div>
                            <div class="notification-content">
                                <h3>Pending Expense Reminder <span class="notification-time">3 hours ago</span></h3>
                                <p>You have an unpaid expense for <strong>Office Depot</strong> (Ref: EXP-2026-002) amounting to RM 850.00.</p>
                                <div class="notification-actions">
                                    <button class="primary-btn btn-sm" onclick="window.location.href='expenses.html'">View Expenses</button>
                                    <button class="outline-btn btn-sm" onclick="this.closest('.notification-item').classList.remove('unread')">Mark as read</button>
                                </div>
                            </div>
                        </div>

                        <!-- Read Notification 1 -->
                        <div class="notification-item">
                            <div class="notification-icon icon-info">
                                <i class="fa-solid fa-user-plus"></i>
                            </div>
                            <div class="notification-content">
                                <h3>New Staff Account Created <span class="notification-time">Yesterday, 14:30 PM</span></h3>
                                <p>A new staff account has been created for <strong>Peter Parker</strong>. They will need to verify their email address before logging in.</p>
                                <div class="notification-actions">
                                    <button class="outline-btn btn-sm" onclick="window.location.href='contact.html'">Manage Contact</button>
                                </div>
                            </div>
                        </div>

                        <!-- Read Notification 2 -->
                        <div class="notification-item">
                            <div class="notification-icon icon-info">
                                <i class="fa-solid fa-wrench"></i>
                            </div>
                            <div class="notification-content">
                                <h3>System Update Completed <span class="notification-time">May 12, 02:00 AM</span></h3>
                                <p>ADVRetail has been updated to version 2.4.1. This update includes performance improvements for the POS module and new transaction reporting features.</p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        

    `;
}

window.init_notifications = function() {
    const filterSelect = document.getElementById('notif-filter');
    const searchInput = document.getElementById('notif-search');
    
    if (filterSelect) {
        filterSelect.addEventListener('change', window.filterNotifications);
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', window.filterNotifications);
    }

    // Initialize default filter
    if (typeof window.filterNotifications === 'function') {
        window.filterNotifications();
    }
};

window.filterNotifications = function() {
    const filterEl = document.getElementById('notif-filter');
    const searchEl = document.getElementById('notif-search');
    
    if (!filterEl || !searchEl) return;
    
    const filterValue = filterEl.value;
    const searchValue = searchEl.value.toLowerCase();
    const items = document.querySelectorAll('.notification-item');
    
    items.forEach(item => {
        const isUnread = item.classList.contains('unread');
        const textContent = item.innerText.toLowerCase();
        
        let matchesFilter = true;
        if (filterValue === 'unread') matchesFilter = isUnread;
        if (filterValue === 'read') matchesFilter = !isUnread;
        
        let matchesSearch = textContent.includes(searchValue);
        
        if (matchesFilter && matchesSearch) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
};

window.markAllRead = function() {
    const unreadItems = document.querySelectorAll('.notification-item.unread');
    unreadItems.forEach(item => {
        item.classList.remove('unread');
        const markReadBtn = item.querySelector('.outline-btn.btn-sm');
        if(markReadBtn && markReadBtn.innerText === 'Mark as read') {
            markReadBtn.style.display = 'none';
        }
    });
    
    const badge = document.querySelector('.fa-bell + .badge');
    if(badge) {
        badge.style.display = 'none';
    }

    if (typeof window.filterNotifications === 'function') {
        window.filterNotifications();
    }
};