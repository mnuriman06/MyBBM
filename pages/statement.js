// pages/statement.js - Dynamic Statement of Account Page (Supabase-backed)

let stmtContactsCache = [];   // store_contact rows for active store (customer/supplier only)
let stmtTypeIds = { sales: null, purchase: null };
let stmtCompanyCache = null;
let stmtStoreCache = null;
let stmtActiveStoreId = null;

function formatCurrency(val) {
    return parseFloat(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function render_statement() {
    return `
        <div class="dashboard-body">
            <div class="invoice-page-container" style="max-width: 1100px; margin: 0 auto;">

                <!-- Action Bar -->
                <div class="invoice-actions" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <a href="#" data-link="dashboard" class="outline-btn" style="text-decoration: none; display: inline-flex; align-items: center; gap: 8px;"><i class="fa-solid fa-arrow-left"></i> Back to Dashboard</a>
                    <div style="display: flex; gap: 12px;">
                        <button class="outline-btn" onclick="window.print()"><i class="fa-solid fa-print"></i> Print</button>
                        <button class="outline-btn" id="statement-send-email-btn"><i class="fa-solid fa-envelope"></i> Send Email</button>
                    </div>
                </div>

                <!-- Statement Filters -->
                <div class="filter-bar" style="display: flex; gap: 16px; align-items: flex-end; margin-bottom: 24px; padding: 16px; background: white; border-radius: 8px; border: 1px solid var(--border-color);">
                    <div style="display: flex; flex-direction: column; flex: 1;">
                        <label class="text-sm text-muted" style="margin-bottom: 6px; font-weight: 500;">Filter by Contact</label>
                        <select id="statement-contact-filter" class="select2-search" data-placeholder="Select Contact..." style="width: 100%;">
                            <option></option>
                        </select>
                    </div>
                    <div style="display: flex; flex-direction: column;">
                        <label class="text-sm text-muted" style="margin-bottom: 6px; font-weight: 500;">Start Date</label>
                        <input type="date" id="statement-start-date" style="height: 46px; padding: 0 16px; border-radius: 10px; border: 1px solid var(--border-color); outline: none; width: 160px;">
                    </div>
                    <div style="display: flex; flex-direction: column;">
                        <label class="text-sm text-muted" style="margin-bottom: 6px; font-weight: 500;">End Date</label>
                        <input type="date" id="statement-end-date" style="height: 46px; padding: 0 16px; border-radius: 10px; border: 1px solid var(--border-color); outline: none; width: 160px;">
                    </div>
                    <div style="display: flex; flex-direction: column;">
                        <button class="primary-btn search-submit-btn" id="statement-filter-btn" style="height: 46px; width: 46px; padding: 0; display: flex; align-items: center; justify-content: center;"><i class="fa-solid fa-magnifying-glass"></i></button>
                    </div>
                </div>

                <!-- Statement Card -->
                <div class="invoice-card">

                    <!-- Company / Store Header -->
                    <div style="display: flex; justify-content: space-between; padding-bottom: 24px; margin-bottom: 24px; border-bottom: 1px solid var(--border-color);">
                        <div>
                            <h2 id="statement-company-name" style="font-size: 20px; font-weight: 700; margin: 0 0 4px 0;">-</h2>
                            <p id="statement-company-ssm" class="text-muted text-sm" style="margin: 0 0 4px 0;"></p>
                            <p id="statement-company-address" class="text-muted text-sm" style="margin: 0; white-space: pre-line; line-height: 1.5;"></p>
                            <p id="statement-company-contact" class="text-muted text-sm" style="margin: 4px 0 0 0;"></p>
                        </div>
                        <div style="text-align: right;">
                            <strong id="statement-store-name" style="display: block; margin-bottom: 4px;">-</strong>
                            <p id="statement-store-address" class="text-muted text-sm" style="margin: 0; white-space: pre-line;"></p>
                        </div>
                    </div>

                    <!-- Header -->
                    <div style="display: flex; justify-content: space-between; border-bottom: 2px solid var(--border-color); padding-bottom: 32px; margin-bottom: 32px;">
                        <div>
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                                <h2 style="font-size: 28px; font-weight: 700; color: var(--text-dark); margin: 0;">Statement of Account</h2>
                            </div>
                            <h3 id="statement-contact-name" style="font-size: 20px; font-weight: 600; color: var(--text-dark); margin: 0 0 8px 0;">-</h3>
                            <p id="statement-contact-address" class="text-muted text-sm" style="line-height: 1.6; white-space: pre-line;">-</p>
                        </div>
                        <div style="text-align: right; display: flex; flex-direction: column; justify-content: space-between;">
                            <div>
                                <h1 id="statement-header-balance" style="font-size: 28px; font-weight: 800; color: var(--danger); margin: 0 0 8px 0; letter-spacing: 1px;">RM 0.00</h1>
                                <p style="font-size: 14px; margin: 0; color: var(--text-dark); font-weight: 600;">Outstanding Balance</p>
                            </div>
                            <div style="margin-top: 24px;">
                                <p class="text-muted text-sm" style="margin: 0 0 4px 0;">Statement Period</p>
                                <p id="statement-period-display" style="font-weight: 600; color: var(--text-dark); margin: 0;">-</p>
                            </div>
                        </div>
                    </div>

                    <!-- Summary Cards -->
                    <div id="statement-summary-grid" class="stats-grid" style="margin-bottom: 32px; grid-template-columns: repeat(5, 1fr); gap: 16px;"></div>

                    <!-- Ledger Table -->
                    <table class="invoice-table" style="font-size: 13px;">
                        <thead>
                            <tr>
                                <th style="width: 15%;">Date</th>
                                <th style="width: 35%;">Ref#</th>
                                <th class="text-right" style="width: 15%;">Amount (RM)</th>
                                <th class="text-right" style="width: 15%;">Payment (RM)</th>
                                <th class="text-right" style="width: 20%; font-size: 14px;">Balance (RM)</th>
                            </tr>
                        </thead>
                        <tbody id="statement-ledger-tbody"></tbody>
                        <tfoot>
                            <tr style="background-color: #f8fafc;">
                                <td colspan="2" class="text-right" style="font-weight: 700; font-size: 13px; color: var(--text-muted); border-top: 2px solid var(--border-color);">GRAND TOTAL</td>
                                <td class="text-right" id="statement-total-invoiced-footer" style="font-weight: 700; font-size: 15px; color: var(--text-dark); border-top: 2px solid var(--border-color);">-</td>
                                <td class="text-right" id="statement-total-paid-footer" style="font-weight: 700; font-size: 15px; color: var(--success); border-top: 2px solid var(--border-color);">-</td>
                                <td class="text-right" id="statement-grand-balance-footer" style="font-weight: 800; font-size: 16px; color: var(--danger); border-top: 2px solid var(--border-color);">-</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    `;
}

window.init_statement = async function() {
    stmtActiveStoreId = await window.getActiveStoreId();
    if (!stmtActiveStoreId) return;

    const [{ data: contacts }, { data: types }, { data: company }, { data: store }] = await Promise.all([
        window.supabaseClient
            .from('store_contact')
            .select('id, contact (id, name, email, mobile, address, postcode, state (name)), role (name)')
            .eq('store', stmtActiveStoreId),
        window.supabaseClient.from('trans_type').select('id, name').in('name', ['Sales', 'Purchase']),
        window.supabaseClient.from('company').select('id, name, ssm, tel, email, address').limit(1).maybeSingle(),
        window.supabaseClient.from('store').select('id, name, address, tel, email').eq('id', stmtActiveStoreId).maybeSingle()
    ]);

    stmtContactsCache = (contacts || []).filter(c => c.contact &&
        ['customer', 'supplier'].includes((c.role?.name || '').toLowerCase()));
    stmtTypeIds.sales = (types || []).find(t => t.name === 'Sales')?.id || null;
    stmtTypeIds.purchase = (types || []).find(t => t.name === 'Purchase')?.id || null;
    stmtCompanyCache = company || null;
    stmtStoreCache = store || null;

    renderCompanyHeader();
    populateContactFilterSelect();

    const contactFilter = document.getElementById('statement-contact-filter');
    const startInput = document.getElementById('statement-start-date');
    const endInput = document.getElementById('statement-end-date');
    const filterBtn = document.getElementById('statement-filter-btn');

    // Default date range: 1st to last day of current month
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    startInput.value = toDateInputValue(firstDay);
    endInput.value = toDateInputValue(lastDay);

    // Pick contact from localStorage (set by topbar search), or default to the first available
    const preselectedScId = localStorage.getItem('statement_contact_sc') || (stmtContactsCache[0]?.id ?? '');
    if (contactFilter) {
        contactFilter.innerHTML = contactFilter.innerHTML; // no-op, keep options
        contactFilter.value = String(preselectedScId);
        if (typeof jQuery !== 'undefined') $(contactFilter).trigger('change');
    }

    await updateStatementDetails();

    if (filterBtn) filterBtn.addEventListener('click', updateStatementDetails);
    if (typeof jQuery !== 'undefined') {
        $(contactFilter).on('change', (e) => {
            if (e.target.value) {
                localStorage.setItem('statement_contact_sc', e.target.value);
                updateStatementDetails();
            }
        });
    }

    wireStatementSendEmail();
};

function toDateInputValue(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function renderCompanyHeader() {
    const c = stmtCompanyCache;
    const s = stmtStoreCache;

    const nameEl = document.getElementById('statement-company-name');
    const ssmEl = document.getElementById('statement-company-ssm');
    const addrEl = document.getElementById('statement-company-address');
    const contactEl = document.getElementById('statement-company-contact');
    const storeNameEl = document.getElementById('statement-store-name');
    const storeAddrEl = document.getElementById('statement-store-address');

    if (nameEl) nameEl.textContent = c?.name || 'ADVRetail';
    if (ssmEl) ssmEl.textContent = c?.ssm ? `[ ${c.ssm} ]` : '';
    if (addrEl) addrEl.textContent = c?.address || '';
    if (contactEl) contactEl.textContent = [c?.tel, c?.email].filter(Boolean).join('   |   ');
    if (storeNameEl) storeNameEl.textContent = (s?.name || '').toUpperCase();
    if (storeAddrEl) storeAddrEl.textContent = [s?.address, s?.tel, s?.email].filter(Boolean).join('\n');
}

function populateContactFilterSelect() {
    const el = document.getElementById('statement-contact-filter');
    if (!el) return;
    el.innerHTML = '<option></option>' + stmtContactsCache.map(c =>
        `<option value="${c.id}">${c.contact.name} (${c.role.name})</option>`
    ).join('');
    if (typeof window.initializeSelect2 === 'function') window.initializeSelect2();
}

// --- Core data fetch: pulls every trans for this contact+type, splits into
// "before start date" (folded into opening balance) and "within range" (ledger rows) ---
async function fetchStatementLedger(scId, typeId, startDate, endDate) {
    const empty = { openingBal: 0, rows: [] };
    if (!scId || !typeId) return empty;

    const { data, error } = await window.supabaseClient
        .from('trans')
        .select(`
            id, trans_no, date, rm_discount, rounding,
            trans_product (qty_order, price_final),
            trans_ship (amount),
            trans_tax (amount),
            trans_payment (rm_pay)
        `)
        .eq('contact', scId)
        .eq('type', typeId)
        .order('date', { ascending: true });

    if (error || !data) return empty;

    const rows = data.map(t => {
        const subtotal = (t.trans_product || []).reduce((s, tp) => s + (Number(tp.qty_order) || 0) * (Number(tp.price_final) || 0), 0);
        const shipping = (t.trans_ship || []).reduce((s, sh) => s + (Number(sh.amount) || 0), 0);
        const tax = (t.trans_tax || []).reduce((s, tx) => s + (Number(tx.amount) || 0), 0);
        const discount = Number(t.rm_discount) || 0;
        const rounding = Number(t.rounding) || 0;
        const amount = subtotal + shipping + tax - discount + rounding;
        const paid = (t.trans_payment || []).reduce((s, p) => s + (Number(p.rm_pay) || 0), 0);
        return { id: t.id, trans_no: t.trans_no, date: t.date, amount, paid };
    });

    const startBoundary = startDate + ' 00:00:00';
    const endBoundary = endDate + ' 23:59:59';

    const beforeStart = rows.filter(r => r.date && r.date < startBoundary);
    const inRange = rows.filter(r => r.date && r.date >= startBoundary && r.date <= endBoundary);

    const openingBal = beforeStart.reduce((s, r) => s + (r.amount - r.paid), 0);

    return { openingBal, rows: inRange };
}

async function updateStatementDetails() {
    const contactFilter = document.getElementById('statement-contact-filter');
    const startInput = document.getElementById('statement-start-date');
    const endInput = document.getElementById('statement-end-date');
    const displayPeriod = document.getElementById('statement-period-display');
    const nameEl = document.getElementById('statement-contact-name');
    const addressEl = document.getElementById('statement-contact-address');
    const headerBalEl = document.getElementById('statement-header-balance');
    const summaryGrid = document.getElementById('statement-summary-grid');
    const ledgerTbody = document.getElementById('statement-ledger-tbody');
    const footerInvoiced = document.getElementById('statement-total-invoiced-footer');
    const footerPaid = document.getElementById('statement-total-paid-footer');
    const footerBalance = document.getElementById('statement-grand-balance-footer');

    const scId = contactFilter?.value;
    if (!scId) return;

    const scRow = stmtContactsCache.find(c => String(c.id) === String(scId));
    if (!scRow) return;

    const isCustomer = (scRow.role?.name || '').toLowerCase() === 'customer';
    const typeId = isCustomer ? stmtTypeIds.sales : stmtTypeIds.purchase;

    const contact = scRow.contact;
    if (nameEl) nameEl.textContent = `${contact.name} (${scRow.role.name})`;
    if (addressEl) {
        const addrParts = [contact.address, contact.postcode, contact.state?.name, contact.email, contact.mobile].filter(Boolean);
        addressEl.textContent = addrParts.join('\n');
    }

    const startVal = startInput.value;
    const endVal = endInput.value;
    if (displayPeriod) displayPeriod.textContent = `${window.formatDateOnly(startVal)} - ${window.formatDateOnly(endVal)}`;

    const { openingBal, rows } = await fetchStatementLedger(scId, typeId, startVal, endVal);

    let totalInvoiced = 0, totalPaid = 0;
    rows.forEach(r => { totalInvoiced += r.amount; totalPaid += r.paid; });
    const totalUnpaid = totalInvoiced - totalPaid;
    const finalBalance = openingBal + totalInvoiced - totalPaid;

    if (headerBalEl) {
        headerBalEl.textContent = `RM ${formatCurrency(finalBalance)}`;
        headerBalEl.style.color = finalBalance > 0 ? 'var(--danger)' : 'var(--success)';
    }

    if (summaryGrid) {
        summaryGrid.innerHTML = `
            <div class="stat-card" style="padding: 16px;">
                <div class="stat-details"><p style="font-size: 0.75rem; margin-bottom: 2px;">OPENING BAL</p><h3 style="font-size: 1.1rem; font-weight: 700; margin: 0;">RM ${formatCurrency(openingBal)}</h3></div>
            </div>
            <div class="stat-card" style="padding: 16px;">
                <div class="stat-details"><p style="font-size: 0.75rem; margin-bottom: 2px;">TOTAL BILLED</p><h3 style="font-size: 1.1rem; font-weight: 700; margin: 0;">RM ${formatCurrency(totalInvoiced)}</h3></div>
            </div>
            <div class="stat-card" style="padding: 16px;">
                <div class="stat-details"><p style="font-size: 0.75rem; margin-bottom: 2px;">TOTAL UNPAID</p><h3 style="font-size: 1.1rem; font-weight: 700; color: var(--danger); margin: 0;">RM ${formatCurrency(totalUnpaid)}</h3></div>
            </div>
            <div class="stat-card" style="padding: 16px;">
                <div class="stat-details"><p style="font-size: 0.75rem; margin-bottom: 2px;">TOTAL PAID</p><h3 style="font-size: 1.1rem; font-weight: 700; color: var(--success); margin: 0;">RM ${formatCurrency(totalPaid)}</h3></div>
            </div>
            <div class="stat-card" style="padding: 16px;">
                <div class="stat-details"><p style="font-size: 0.75rem; margin-bottom: 2px;">BALANCE</p><h3 style="font-size: 1.1rem; font-weight: 700; color: var(--info); margin: 0;">RM ${formatCurrency(finalBalance)}</h3></div>
            </div>
        `;
    }

    if (ledgerTbody) {
        let rowsHtml = `
            <tr>
                <td style="color: var(--text-muted);">${window.formatDateOnly(startVal)}</td>
                <td><span class="status pending" style="background-color: #f1f5f9; color: var(--text-muted);">Opening Balance</span></td>
                <td class="text-right">-</td>
                <td class="text-right">-</td>
                <td class="text-right" style="font-weight: 700; font-size: 15px; color: var(--text-dark);">${formatCurrency(openingBal)}</td>
            </tr>
        `;

        let runningBal = openingBal;
        rows.forEach(r => {
            runningBal = runningBal + r.amount - r.paid;
            rowsHtml += `
                <tr>
                    <td style="color: var(--text-muted);">${window.formatDateTime(r.date)}</td>
                    <td><a href="#" class="ref-badge statement-view-trans" data-trans-id="${r.id}" style="color: #2563eb; text-decoration: none;">${r.trans_no || '-'}</a></td>
                    <td class="text-right">${formatCurrency(r.amount)}</td>
                    <td class="text-right" style="color: var(--success);">${formatCurrency(r.paid)}</td>
                    <td class="text-right" style="font-weight: 700; font-size: 15px; color: var(--text-dark);">${formatCurrency(runningBal)}</td>
                </tr>
            `;
        });

        ledgerTbody.innerHTML = rowsHtml;
        ledgerTbody.querySelectorAll('.statement-view-trans').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.setItem('view_trans_id', link.getAttribute('data-trans-id'));
                navigateTo('transaction-view');
            });
        });
    }

    if (footerInvoiced) footerInvoiced.textContent = formatCurrency(totalInvoiced);
    if (footerPaid) footerPaid.textContent = formatCurrency(totalPaid);
    if (footerBalance) footerBalance.textContent = formatCurrency(finalBalance);
}

function wireStatementSendEmail() {
    const btn = document.getElementById('statement-send-email-btn');
    if (!btn) return;
    btn.addEventListener('click', handleStatementSendEmail);
}

// Builds the same A4-style statement as a PDF, base64-encodes it, and calls the Edge Function.
async function handleStatementSendEmail() {
    const btn = document.getElementById('statement-send-email-btn');
    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert('PDF library not loaded. Please add jsPDF + jspdf-autotable to index.html.');
        return;
    }

    const contactFilter = document.getElementById('statement-contact-filter');
    const scId = contactFilter?.value;
    const scRow = stmtContactsCache.find(c => String(c.id) === String(scId));
    if (!scRow) { alert('Please select a contact first.'); return; }

    const recipientEmail = scRow.contact?.email;
    if (!recipientEmail) {
        alert(`${scRow.contact?.name || 'This contact'} has no email address on file.`);
        return;
    }

    const actualRecipient = recipientEmail;

    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';

    try {
        const pdfBase64 = await buildStatementPdfBase64(scRow);
        const startVal = document.getElementById('statement-start-date').value;
        const endVal = document.getElementById('statement-end-date').value;
        const filename = `Statement_${scRow.contact.name.replace(/[^a-zA-Z0-9]/g, '_')}_${startVal}_to_${endVal}.pdf`;

        const { data, error } = await window.supabaseClient.functions.invoke('send-statement-email', {
            body: {
                to: actualRecipient,
                contactName: scRow.contact.name,
                subject: `Statement of Account - ${window.formatDateOnly(startVal)} to ${window.formatDateOnly(endVal)}`,
                htmlBody: `<p>Dear ${scRow.contact.name},</p><p>Please find attached your statement of account for the period ${window.formatDateOnly(startVal)} to ${window.formatDateOnly(endVal)}.</p><p>Thank you.</p>`,
                pdfBase64,
                pdfFilename: filename
            }
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        btn.innerHTML = '<i class="fa-solid fa-check"></i> Sent!';
        btn.style.backgroundColor = 'var(--success)';
        btn.style.color = 'white';
        setTimeout(() => {
            btn.disabled = false;
            btn.innerHTML = originalHtml;
            btn.style.backgroundColor = '';
            btn.style.color = '';
        }, 2000);
    } catch (err) {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
        alert('Failed to send email: ' + (err.message || 'unknown error'));
    }
}

// Renders the current statement (as shown on screen) into a PDF and returns it as base64.
async function buildStatementPdfBase64(scRow) {
    const startVal = document.getElementById('statement-start-date').value;
    const endVal = document.getElementById('statement-end-date').value;
    const isCustomer = (scRow.role?.name || '').toLowerCase() === 'customer';
    const typeId = isCustomer ? stmtTypeIds.sales : stmtTypeIds.purchase;

    const { openingBal, rows } = await fetchStatementLedger(scRow.id, typeId, startVal, endVal);

    let totalInvoiced = 0, totalPaid = 0;
    rows.forEach(r => { totalInvoiced += r.amount; totalPaid += r.paid; });
    const finalBalance = openingBal + totalInvoiced - totalPaid;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const marginLeft = 40;
    let y = 44;

    const company = stmtCompanyCache;
    const store = stmtStoreCache;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text(company?.name || 'ADVRetail', marginLeft, y);
    y += 18;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(90);
    if (company?.ssm) { doc.text(`[ ${company.ssm} ]`, marginLeft, y); y += 13; }
    if (company?.address) { doc.text(company.address, marginLeft, y); y += 13; }
    const contactLine = [company?.tel, company?.email].filter(Boolean).join('   |   ');
    if (contactLine) { doc.text(contactLine, marginLeft, y); y += 13; }

    y += 8;
    doc.setDrawColor(226, 232, 240);
    doc.line(marginLeft, y, doc.internal.pageSize.getWidth() - marginLeft, y);
    y += 20;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(20);
    doc.text('STATEMENT OF ACCOUNT', marginLeft, y);
    y += 20;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`${scRow.contact.name} (${scRow.role.name})`, marginLeft, y);
    y += 14;
    doc.setFontSize(9);
    doc.setTextColor(90);
    const addrParts = [scRow.contact.address, scRow.contact.postcode, scRow.contact.state?.name].filter(Boolean);
    if (addrParts.length) { doc.text(addrParts.join(', '), marginLeft, y); y += 12; }
    if (scRow.contact.email) { doc.text(scRow.contact.email, marginLeft, y); y += 12; }

    doc.setTextColor(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`Period: ${window.formatDateOnly(startVal)} to ${window.formatDateOnly(endVal)}`, marginLeft, y);
    y += 8;

    const tableRows = [
        [window.formatDateOnly(startVal), 'Opening Balance', '-', '-', openingBal.toFixed(2)]
    ];
    let runningBal = openingBal;
    rows.forEach(r => {
        runningBal = runningBal + r.amount - r.paid;
        tableRows.push([
            window.formatDateTime(r.date),
            r.trans_no || '-',
            r.amount.toFixed(2),
            r.paid.toFixed(2),
            runningBal.toFixed(2)
        ]);
    });

    doc.autoTable({
        head: [['Date', 'Ref#', 'Amount (RM)', 'Payment (RM)', 'Balance (RM)']],
        body: tableRows,
        foot: [['', 'GRAND TOTAL', totalInvoiced.toFixed(2), totalPaid.toFixed(2), finalBalance.toFixed(2)]],
        startY: y + 10,
        margin: { left: marginLeft, right: marginLeft },
        theme: 'grid',
        styles: { fontSize: 8.5, cellPadding: 6, lineColor: [203, 213, 225], lineWidth: 0.75 },
        headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
        footStyles: { fillColor: [248, 250, 252], textColor: 20, fontStyle: 'bold' },
        columnStyles: {
            2: { halign: 'right' },
            3: { halign: 'right' },
            4: { halign: 'right' }
        },
        didParseCell: (data) => {
            // Right-align the numeric columns across header, body, and footer rows
            if ([2, 3, 4].includes(data.column.index)) {
                data.cell.styles.halign = 'right';
            }
            // Right-align the "GRAND TOTAL" label itself in the footer row
            if (data.section === 'foot' && data.column.index === 1) {
                data.cell.styles.halign = 'right';
            }
        }
    });

    // jsPDF outputs a data URI like "data:application/pdf;filename=...;base64,XXXX"
    // — strip the prefix so we hand Resend raw base64.
    const dataUri = doc.output('datauristring');
    return dataUri.split(',')[1];
}