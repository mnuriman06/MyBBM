function renderTopbar() {
    return `
        <header class="top-header">
            <button class="icon-btn" id="sidebar-toggle" style="margin-right: 16px;"><i class="fa-solid fa-bars"></i></button>
            <div style="display: flex; align-items: center; gap: 8px; margin-right: auto; flex-wrap: nowrap;">
                <div class="floating-group" style="position: relative; width: 350px; margin-bottom: 0; flex-shrink: 0;">
                    <select id="top-search" class="select2-search" data-placeholder="VIEW OUTSTANDING" style="width: 100%;">
                        <option></option>
                    </select>
                </div>
                <button class="primary-btn search-submit-btn" onclick="const scId = document.getElementById('top-search').value; if(scId) { localStorage.setItem('statement_contact_sc', scId); navigateTo('statement'); }"><i class="fa-solid fa-magnifying-glass"></i></button>
                <button class="primary-btn search-submit-btn" onclick="openDrawerModal()" style="background-color: var(--danger); border-color: var(--danger); margin-left: 4px;" title="Drawer"><i class="fa-solid fa-cash-register"></i></button>
            </div>
            <div class="header-actions">
                <div class="quick-actions-row" style="display: flex; gap: 8px; border-right: 1px solid var(--border-color); padding-right: 24px;">
                    <div class="quick-add-dropdown" style="position: relative; display: inline-block;">
                        <button class="outline-btn" id="quick-add-btn" type="button">
                            <i class="fa-solid fa-bolt"></i> Quick Add <i class="fa-solid fa-chevron-down" style="font-size: 0.7em; margin-left: 4px;"></i>
                        </button>
                        <div id="quick-add-menu" style="display: none; position: absolute; top: 110%; left: 0; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); box-shadow: var(--shadow-lg); min-width: 160px; z-index: 400; overflow: hidden;">
                            <a href="#" id="quick-add-contact-link" style="display: flex; align-items: center; gap: 8px; padding: 10px 16px; color: var(--text-main); text-decoration: none; font-size: 0.9rem;"><i class="fa-solid fa-user-plus" style="width: 16px;"></i> Contact</a>
                            <a href="#" id="quick-add-expense-link" style="display: flex; align-items: center; gap: 8px; padding: 10px 16px; color: var(--text-main); text-decoration: none; font-size: 0.9rem; border-top: 1px solid var(--border-color);"><i class="fa-solid fa-file-invoice-dollar" style="width: 16px;"></i> Expenses</a>
                        </div>
                    </div>
                    <button class="outline-btn" data-link="pos"><i class="fa-solid fa-cash-register"></i> + POS</button>
                </div>
                <button class="icon-btn" data-link="notifications"><i class="fa-regular fa-bell"></i><span class="badge">3</span></button>
                <button class="icon-btn" style="color: var(--danger);" id="logout-btn" title="Logout"><i class="fa-solid fa-arrow-right-from-bracket"></i></button>
                <div class="user-profile" data-link="profile" style="cursor: pointer;">
                    <img src="https://ui-avatars.com/api/?name=Admin+User&background=6366f1&color=fff" alt="User">
                    <div class="user-info">
                        <span class="user-name">Admin User</span>
                        <span class="user-role">Manager</span>
                    </div>
                </div>
            </div>
        </header>

        <!-- Drawer Modal -->
        <div id="drawer-modal" class="modal-overlay" onclick="if(event.target === this) closeDrawerModal();">
            <div class="modal-content" style="max-width: 500px; border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); overflow: hidden;">
                <div class="modal-header" style="padding: 20px 24px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="font-size: 1.25rem; font-weight: 600; color: var(--text-main); margin: 0; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-cash-register" style="color: var(--danger);"></i> Collection Today
                    </h2>
                    <button class="close-modal-btn" onclick="closeDrawerModal()" style="background: transparent; border: none; font-size: 1.25rem; color: var(--text-muted); cursor: pointer; transition: var(--transition);">&times;</button>
                </div>
                <div class="modal-body" style="padding: 24px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tbody>
                            <tr style="border-bottom: 1px solid var(--border-color); height: 56px;">
                                <td style="font-weight: 600; font-size: 0.95rem; color: var(--text-main); padding: 12px 0;">MONEY IN</td>
                                <td style="text-align: right; padding: 12px 0;">
                                    <span id="drawer-money-in" style="font-weight: 700; font-size: 0.95rem; padding: 6px 16px; border-radius: 8px; background-color: var(--success-bg); color: var(--success);">RM 0.00</span>
                                </td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border-color); height: 56px;">
                                <td style="font-weight: 600; font-size: 0.95rem; color: var(--text-main); padding: 12px 0;">MONEY OUT</td>
                                <td style="text-align: right; padding: 12px 0;">
                                    <span id="drawer-money-out" style="font-weight: 700; font-size: 0.95rem; padding: 6px 16px; border-radius: 8px; background-color: var(--danger-bg); color: var(--danger);">RM 0.00</span>
                                </td>
                            </tr>
                            <tr style="height: 56px;">
                                <td style="font-weight: 600; font-size: 0.95rem; color: var(--text-main); padding: 12px 0;">BALANCE</td>
                                <td style="text-align: right; padding: 12px 0;">
                                    <span id="drawer-balance" style="font-weight: 700; font-size: 0.95rem; padding: 6px 16px; border-radius: 8px; background-color: var(--info-bg); color: var(--info);">RM 0.00</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="modal-footer" style="padding: 20px 24px; border-top: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 12px; background-color: var(--bg-main);">
                    <div style="display: flex; gap: 12px; width: 100%;">
                        <select id="drawer-print-month" class="form-input" style="flex: 1; height: 42px;"></select>
                        <select id="drawer-print-year" class="form-input" style="flex: 1; height: 42px;"></select>
                    </div>
                    <button class="primary-btn" id="drawer-print-collection-btn" style="width: 100%; height: 46px; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 600;" onclick="printDrawerCollection()">
                        <i class="fa-solid fa-file-pdf"></i> PRINT COLLECTION
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Quick Add dropdown — same outside-click/close-on-select pattern as .pos-print-dropdown
document.body.addEventListener('click', (e) => {
    const toggleBtn = e.target.closest('#quick-add-btn');
    const menu = document.getElementById('quick-add-menu');
    if (!menu) return;

    if (toggleBtn) {
        e.stopPropagation();
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
        return;
    }

    if (!e.target.closest('#quick-add-menu')) {
        menu.style.display = 'none';
    }
});

document.body.addEventListener('click', (e) => {
    if (e.target.closest('#quick-add-contact-link')) {
        e.preventDefault();
        document.getElementById('quick-add-menu').style.display = 'none';
        window.QuickAddContact.open();
    }
    if (e.target.closest('#quick-add-expense-link')) {
        e.preventDefault();
        document.getElementById('quick-add-menu').style.display = 'none';
        window.QuickAddExpense.open();
    }
});

// Event delegation: Listens to the whole body, but only triggers if the clicked item is your button
document.body.addEventListener('click', async (e) => {
    if (e.target && e.target.id === 'logout-btn') {
        e.preventDefault();
        console.log('Button click detected via delegation!');
        try {
            await window.supabaseClient.auth.signOut();
        } catch (err) {
            console.error(err);
        }
    }
});

// Populates the topbar's "VIEW OUTSTANDING" dropdown with customers/suppliers
// of the active store. Called from main.js's attachLayoutListeners() since
// renderTopbar() only returns markup and can't be async itself.
window.wireTopbarSearch = async function() {
    const sel = document.getElementById('top-search');
    if (!sel) return;

    const storeId = await window.getActiveStoreId();
    if (!storeId) return;

    const { data } = await window.supabaseClient
        .from('store_contact')
        .select('id, contact (id, name), role (name)')
        .eq('store', storeId);

    const relevant = (data || []).filter(c => c.contact &&
        ['customer', 'supplier'].includes((c.role?.name || '').toLowerCase()));

    const previousVal = sel.value;
    sel.innerHTML = '<option></option>' + relevant.map(c =>
        `<option value="${c.id}">${c.contact.name} (${c.role.name})</option>`
    ).join('');

    if (typeof jQuery !== 'undefined') {
        try { $(sel).select2('destroy'); } catch (e) {}
        $(sel).select2({ width: '100%' });
        if (previousVal) $(sel).val(previousVal).trigger('change');
    }
};

window.openDrawerModal = async function() {
    const modal = document.getElementById('drawer-modal');
    if (!modal) return;
    modal.classList.add('active');
    populateDrawerPrintSelectors();
    await populateDrawerTodayCollection();
};

window.closeDrawerModal = function() {
    const modal = document.getElementById('drawer-modal');
    if (modal) modal.classList.remove('active');
};

function populateDrawerPrintSelectors() {
    const monthSel = document.getElementById('drawer-print-month');
    const yearSel = document.getElementById('drawer-print-year');
    if (!monthSel || !yearSel) return;

    const now = new Date();
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    if (!monthSel.options.length) {
        monthSel.innerHTML = monthNames.map((name, idx) => `<option value="${idx + 1}">${name}</option>`).join('');
    }
    monthSel.value = String(now.getMonth() + 1);

    if (!yearSel.options.length) {
        const currentYear = now.getFullYear();
        let yearOptions = '';
        for (let y = currentYear; y !== 1999; y--) {
            yearOptions += `<option value="${y}">${y}</option>`;
        }
        yearSel.innerHTML = yearOptions;
    }
    yearSel.value = String(now.getFullYear());
}

function drawerTodayRange() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    return { start: window.formatDateTime(start), end: window.formatDateTime(end) };
}

// Resolves the Sales trans_type id once per call — "Money In" is scoped to
// customer (Sales) payments only, not Purchase/Return/etc.
async function fetchSalesTypeId() {
    const { data } = await window.supabaseClient.from('trans_type').select('id').eq('name', 'Sales').maybeSingle();
    return data?.id || null;
}

async function fetchStoreCustomerPaymentsSum(storeId, salesTypeId, startStr, endStr) {
    if (!salesTypeId) return 0;

    const { data: transRows } = await window.supabaseClient
        .from('trans')
        .select('id')
        .eq('store', storeId)
        .eq('type', salesTypeId);
    const transIds = (transRows || []).map(r => r.id);
    if (!transIds.length) return 0;

    const { data: payRows } = await window.supabaseClient
        .from('trans_payment')
        .select('rm_pay')
        .in('trans', transIds)
        .gte('date', startStr)
        .lte('date', endStr);

    return (payRows || []).reduce((s, p) => s + (Number(p.rm_pay) || 0), 0);
}

async function fetchStoreExpensesPaymentsSum(storeId, startStr, endStr) {
    const { data: supplierRows } = await window.supabaseClient.from('store_contact').select('id').eq('store', storeId);
    const supplierIds = (supplierRows || []).map(r => r.id);
    if (!supplierIds.length) return 0;

    const { data: expRows } = await window.supabaseClient.from('expenses').select('id').in('supplier', supplierIds);
    const expIds = (expRows || []).map(r => r.id);
    if (!expIds.length) return 0;

    const { data: payRows } = await window.supabaseClient
        .from('expenses_payment')
        .select('rm_pay')
        .in('expenses', expIds)
        .gte('date', startStr)
        .lte('date', endStr);

    return (payRows || []).reduce((s, p) => s + (Number(p.rm_pay) || 0), 0);
}

async function populateDrawerTodayCollection() {
    const inEl = document.getElementById('drawer-money-in');
    const outEl = document.getElementById('drawer-money-out');
    const balEl = document.getElementById('drawer-balance');
    if (inEl) inEl.textContent = 'Loading...';
    if (outEl) outEl.textContent = 'Loading...';
    if (balEl) balEl.textContent = 'Loading...';

    const storeId = await window.getActiveStoreId();
    if (!storeId) {
        if (inEl) inEl.textContent = 'RM 0.00';
        if (outEl) outEl.textContent = 'RM 0.00';
        if (balEl) balEl.textContent = 'RM 0.00';
        return;
    }

    const { start, end } = drawerTodayRange();
    const salesTypeId = await fetchSalesTypeId();
    const [moneyIn, moneyOut] = await Promise.all([
        fetchStoreCustomerPaymentsSum(storeId, salesTypeId, start, end),
        fetchStoreExpensesPaymentsSum(storeId, start, end)
    ]);
    const balance = moneyIn - moneyOut;

    if (inEl) inEl.textContent = `RM ${moneyIn.toFixed(2)}`;
    if (outEl) outEl.textContent = `RM ${moneyOut.toFixed(2)}`;
    if (balEl) balEl.textContent = `RM ${balance.toFixed(2)}`;
}

window.printDrawerCollection = async function() {
    const btn = document.getElementById('drawer-print-collection-btn');
    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert('PDF library not loaded. Please add jsPDF + jspdf-autotable to index.html.');
        return;
    }

    const monthSel = document.getElementById('drawer-print-month');
    const yearSel = document.getElementById('drawer-print-year');
    const month = parseInt(monthSel.value, 10);
    const year = parseInt(yearSel.value, 10);

    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    try {
        const storeId = await window.getActiveStoreId();
        if (!storeId) { alert('You are not assigned to any store.'); return; }

        const monthStart = new Date(year, month - 1, 1, 0, 0, 0);
        const monthEnd = new Date(year, month, 0, 23, 59, 59); // last day of month
        const startStr = window.formatDateTime(monthStart);
        const endStr = window.formatDateTime(monthEnd);
        const daysInMonth = monthEnd.getDate();

        const salesTypeId = await fetchSalesTypeId();

        // Money In: Sales trans_payment rows in range
        let inPayments = [];
        if (salesTypeId) {
            const { data: transRows } = await window.supabaseClient
                .from('trans').select('id').eq('store', storeId).eq('type', salesTypeId);
            const transIds = (transRows || []).map(r => r.id);
            if (transIds.length) {
                const { data } = await window.supabaseClient
                    .from('trans_payment')
                    .select('rm_pay, date')
                    .in('trans', transIds)
                    .gte('date', startStr)
                    .lte('date', endStr);
                inPayments = data || [];
            }
        }

        // Money Out: expenses_payment rows in range
        let outPayments = [];
        const { data: supplierRows } = await window.supabaseClient.from('store_contact').select('id').eq('store', storeId);
        const supplierIds = (supplierRows || []).map(r => r.id);
        if (supplierIds.length) {
            const { data: expRows } = await window.supabaseClient.from('expenses').select('id').in('supplier', supplierIds);
            const expIds = (expRows || []).map(r => r.id);
            if (expIds.length) {
                const { data } = await window.supabaseClient
                    .from('expenses_payment')
                    .select('rm_pay, date')
                    .in('expenses', expIds)
                    .gte('date', startStr)
                    .lte('date', endStr);
                outPayments = data || [];
            }
        }

        const dailyIn = {};
        const dailyOut = {};
        inPayments.forEach(p => {
            const day = (p.date || '').slice(0, 10);
            dailyIn[day] = (dailyIn[day] || 0) + (Number(p.rm_pay) || 0);
        });
        outPayments.forEach(p => {
            const day = (p.date || '').slice(0, 10);
            dailyOut[day] = (dailyOut[day] || 0) + (Number(p.rm_pay) || 0);
        });

        const rows = [];
        let totalIn = 0, totalOut = 0;
        for (let d = 1; d <= daysInMonth; d++) {
            const dayStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const moneyIn = dailyIn[dayStr] || 0;
            const moneyOut = dailyOut[dayStr] || 0;
            const balance = moneyIn - moneyOut;
            totalIn += moneyIn;
            totalOut += moneyOut;
            rows.push([window.formatDateOnly(dayStr), moneyIn.toFixed(2), moneyOut.toFixed(2), balance.toFixed(2)]);
        }

        const { data: store } = await window.supabaseClient.from('store').select('name, address, tel, email').eq('id', storeId).maybeSingle();

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
        const marginLeft = 40;
        let y = 44;

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

        const monthLabel = monthStart.toLocaleString('en-US', { month: 'long' });
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(20);
        doc.text(`Daily Collection - ${monthLabel} ${year}`, marginLeft, y);
        y += 12;

        doc.autoTable({
            head: [['Date', 'Money In (RM)', 'Money Out (RM)', 'Balance (RM)']],
            body: rows,
            foot: [['TOTAL', totalIn.toFixed(2), totalOut.toFixed(2), (totalIn - totalOut).toFixed(2)]],
            startY: y + 8,
            margin: { left: marginLeft, right: marginLeft },
            theme: 'grid',
            styles: { fontSize: 8.5, cellPadding: 6, lineColor: [203, 213, 225], lineWidth: 0.75 },
            headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold', lineColor: [99, 102, 241], lineWidth: 0.75 },
            footStyles: { fillColor: [248, 250, 252], textColor: 20, fontStyle: 'bold', lineColor: [203, 213, 225], lineWidth: 0.75 },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            columnStyles: {
                1: { halign: 'right' },
                2: { halign: 'right' },
                3: { halign: 'right' }
            },
            didParseCell: (data) => {
                if ([1, 2, 3].includes(data.column.index)) {
                    data.cell.styles.halign = 'right';
                }
            }
        });

        doc.save(`Collection_${year}-${String(month).padStart(2, '0')}.pdf`);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
    }
};

async function populateUserProfileHeader() {
    // Ensure data is loaded
    if (!window.currentUserProfile) {
        await window.getUserStores(); 
    }
    
    const profile = window.currentUserProfile;
    const activeStoreId = await window.getActiveStoreId();
    
    if (!profile) return;

    // Target your DOM elements
    const nameEl = document.querySelector('.user-name');
    const roleEl = document.querySelector('.user-role');
    const avatarEl = document.querySelector('.user-profile img');

    // If name more than 20 characters, truncate and add ellipsis
    if (nameEl) {
        const displayName = profile.name.length > 20 ? profile.name.slice(0, 20) + '...' : profile.name;
        nameEl.textContent = displayName;
    }
    if (avatarEl && profile.avatar) avatarEl.src = profile.avatar;

    // Find the specific role for the currently active store
    const currentRole = profile.roles.find(r => String(r.storeId) === activeStoreId);
    if (roleEl) {
        // Capitalize the first letter of the role
        const roleName = currentRole ? currentRole.roleName : 'Staff';
        roleEl.textContent = roleName.charAt(0).toUpperCase() + roleName.slice(1);
    }
}