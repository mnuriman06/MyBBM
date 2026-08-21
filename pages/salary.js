// pages/salary.js — Salary is an expense (category id = 1, "Gaji dan Upah")

const SALARY_CATEGORY_ID = 1;
const SALARY_PAGE_SIZE = 100;
const SAL_STATUS_WAITING = 1;
const SAL_STATUS_PAID = 2;
const SALARY_STATUS_LABELS = { [SAL_STATUS_WAITING]: 'Waiting', [SAL_STATUS_PAID]: 'Paid' };
const SALARY_STATUS_CLASS = { [SAL_STATUS_WAITING]: 'pending', [SAL_STATUS_PAID]: 'completed' };
const SALARY_STAFF_ROLES = ['admin', 'manager', 'cashier'];
const SALARY_TABLE_REF_EXPENSES = 3; // shared with expenses.js — same `expenses` table

let salaryStaffCache = [];        // store_contact rows (admin/manager/cashier) for active store
let salaryItemsCache = [];        // salary_item rows
let salaryCompanyCache = null;
let salaryStoreDetailsCache = null;
let salaryRowsCache = [];
let salaryStoreUrlCache = '';
let salaryPayMethodCache = [];
let addSalaryStagedLines = [];    // [{ salary_item, item_name, ope, date, rm }]
let addSalaryStagedPayments = []; // [{ pay_method, date, rm_pay, pay_ref, note }]
let viewSalaryLinesCache = [];
let viewSalaryPaymentsCache = [];
let salaryCurrentPage = 1;
let salaryTotalCount = 0;
let salaryActiveFilters = {};
let salaryActiveStoreId = null;

function render_salary() {
    return `<div class="dashboard-body">
                <div class="page-header">
                    <h1>Salary Records</h1>
                    <div class="header-actions-group">
                        <button class="outline-btn" id="open-manage-sal-items-btn"><i class="fa-solid fa-tags"></i> Salary Items</button>
                        <button class="primary-btn" id="page-add-salary-btn"><i class="fa-solid fa-plus"></i> Salary</button>
                    </div>
                </div>

                <div class="stats-grid" id="salary-stats-grid"></div>

                <div class="filter-bar">
                    <div class="form-group">
                        <label class="form-label" style="top: 10px; font-size: 0.7rem; color: var(--primary); font-weight: 600;">Month From</label>
                        <input type="month" id="date-from" class="form-input">
                    </div>
                    <div class="form-group">
                        <label class="form-label" style="top: 10px; font-size: 0.7rem; color: var(--primary); font-weight: 600;">Month To</label>
                        <input type="month" id="date-to" class="form-input">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Staff</label>
                        <select id="search-staff" class="select2-search" style="width: 100%;"></select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Status</label>
                        <select id="search-status" class="select2-search" style="width: 100%;">
                            <option value="">All</option>
                            <option value="${SAL_STATUS_WAITING}">Waiting</option>
                            <option value="${SAL_STATUS_PAID}">Paid</option>
                        </select>
                    </div>
                    <div class="filter-actions" style="display: flex; gap: 12px; flex-shrink: 0;">
                        <button class="primary-btn search-submit-btn" id="salary-filter-btn" title="Search"><i class="fa-solid fa-magnifying-glass"></i></button>
                        <button class="primary-btn pdf-export-btn" id="salary-pdf-export-btn" style="background-color: var(--danger);" title="Export PDF"><i class="fa-solid fa-file-pdf"></i></button>
                    </div>
                </div>

                <div class="data-card">
                    <div id="table-view-container" class="table-responsive view-container active">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Ref #</th>
                                    <th>Datetime</th>
                                    <th>Staff</th>
                                    <th class="text-right">Amount</th>
                                    <th class="text-right">Payment</th>
                                    <th class="text-right">Balance</th>
                                </tr>
                            </thead>
                            <tbody id="salary-table-body">
                                <tr><td colspan="7" class="text-muted" style="text-align:center; padding: 24px;">Loading salary records...</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="pagination-container">
                        <div class="pagination-info" id="salary-pagination-info">Showing 0 entries</div>
                        <ul class="pagination" id="salary-pagination-list"></ul>
                    </div>
                </div>
            </div>

    <!-- Add Salary Modal -->
    <div id="add-salary-modal" class="modal-overlay">
        <div class="modal-content" style="max-width: 1200px;">
            <div class="modal-header">
                <h2>Add New Salary</h2>
                <button class="close-modal-btn" id="close-add-salary-btn"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body">
                <form id="add-salary-form" class="modal-form">
                    <div class="form-row">
                        <div class="form-group col-6">
                            <label class="form-label" style="top: 10px; font-size: 0.7rem; color: var(--primary); font-weight: 600;">Month</label>
                            <input type="month" id="salary-date" class="form-input" required>
                        </div>
                        <div class="form-group col-6">
                            <label class="form-label">Reference #</label>
                            <input type="text" id="salary-ref-preview" class="form-input" readonly disabled placeholder="Auto-generated on save">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-6">
                            <label class="form-label">Staff</label>
                            <select id="salary-staff" class="select2-search" data-placeholder="Staff" style="width: 100%;"><option></option></select>
                        </div>
                        <div class="form-group col-6">
                            <label class="form-label">Status</label>
                            <select id="salary-status" class="select2-search" data-placeholder="Status" style="width: 100%;">
                                <option value="${SAL_STATUS_WAITING}" selected>Waiting</option>
                                <option value="${SAL_STATUS_PAID}">Paid</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-6">
                            <label class="form-label">Amount (RM)</label>
                            <input type="text" id="salary-amount" class="form-input" readonly disabled value="0.00" style="font-weight: 700;">
                            <small class="text-muted" style="display:block; margin-top: 6px;">Computed automatically from the Salary Items below.</small>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-12">
                            <textarea id="salary-note" class="form-input" placeholder=" " style="height: 80px; resize: none;"></textarea>
                            <label class="form-label">Description / Notes</label>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-12">
                            <label class="form-label">Attachments</label>
                            <input type="file" id="salary-attachments" class="form-input" multiple accept="image/*,.pdf" style="padding: 10px;">
                        </div>
                    </div>

                    <!-- Salary Items -->
                    <div class="form-row">
                        <div class="form-group col-12">
                            <label class="form-label" style="margin-bottom: 10px; display: block;">Salary Items</label>
                            <div style="display: grid; grid-template-columns: 1.6fr 1fr 1fr auto; gap: 10px; align-items: end; padding: 14px; background: var(--bg-main); border-radius: 8px; border: 1px dashed var(--border-color); margin-bottom: 12px;">
                                <div>
                                    <label class="form-label" style="font-size: 0.75rem; margin-bottom: 4px; display: block;">Item</label>
                                    <select id="add-sal-item" class="select2-search" style="width: 100%;"></select>
                                </div>
                                <div>
                                    <label class="form-label" style="font-size: 0.75rem; margin-bottom: 4px; display: block;">Date</label>
                                    <input type="date" id="add-sal-item-date" class="form-input" style="height: 38px; padding: 6px 12px; font-size: 0.9rem;">
                                </div>
                                <div>
                                    <label class="form-label" style="font-size: 0.75rem; margin-bottom: 4px; display: block;">RM</label>
                                    <input type="text" id="add-sal-item-amount" class="form-input" style="height: 38px; padding: 6px 12px; font-size: 0.9rem;" placeholder="0.00">
                                </div>
                                <button type="button" id="add-sal-item-stage-btn" class="primary-btn" style="height: 38px;"><i class="fa-solid fa-plus"></i></button>
                            </div>

                            <table class="invoice-table" style="font-size: 0.85rem;">
                                <thead><tr><th>Date</th><th>Item</th><th class="text-right">Amount (RM)</th><th class="text-right" style="width: 60px;">Action</th></tr></thead>
                                <tbody id="add-sal-item-tbody">
                                    <tr><td colspan="4" class="text-muted" style="text-align:center; padding:12px;">No salary items added yet.</td></tr>
                                </tbody>
                            </table>
                            <div style="display: flex; justify-content: flex-end; margin-top: 10px; padding: 10px 14px; background: var(--bg-main); border-radius: 6px; font-size: 0.9rem;">
                                <span class="text-muted">Total: <strong id="add-sal-item-total" style="color: var(--text-main);">0.00</strong></span>
                            </div>
                        </div>
                    </div>

                    <!-- Payments -->
                    <div class="form-row">
                        <div class="form-group col-12">
                            <label class="form-label" style="margin-bottom: 10px; display: block;">Payments</label>
                            <div style="display: grid; grid-template-columns: 1.3fr 1.3fr 1fr 1fr 1.3fr auto; gap: 10px; align-items: end; padding: 14px; background: var(--bg-main); border-radius: 8px; border: 1px dashed var(--border-color); margin-bottom: 12px;">
                                <div>
                                    <label class="form-label" style="font-size: 0.75rem; margin-bottom: 4px; display: block;">Method</label>
                                    <select id="add-sal-pay-method" class="select2-search" style="width: 100%;"></select>
                                </div>
                                <div>
                                    <label class="form-label" style="font-size: 0.75rem; margin-bottom: 4px; display: block;">Date</label>
                                    <input type="date" id="add-sal-pay-date" class="form-input" style="height: 38px; padding: 6px 12px; font-size: 0.9rem;">
                                </div>
                                <div>
                                    <label class="form-label" style="font-size: 0.75rem; margin-bottom: 4px; display: block;">RM Pay</label>
                                    <input type="text" id="add-sal-pay-amount" class="form-input" style="height: 38px; padding: 6px 12px; font-size: 0.9rem;" placeholder="0.00">
                                </div>
                                <div>
                                    <label class="form-label" style="font-size: 0.75rem; margin-bottom: 4px; display: block;">Pay Ref</label>
                                    <input type="text" id="add-sal-pay-ref" class="form-input" style="height: 38px; padding: 6px 12px; font-size: 0.9rem;" placeholder="Optional">
                                </div>
                                <div>
                                    <label class="form-label" style="font-size: 0.75rem; margin-bottom: 4px; display: block;">Note</label>
                                    <input type="text" id="add-sal-pay-note" class="form-input" style="height: 38px; padding: 6px 12px; font-size: 0.9rem;" placeholder="Optional">
                                </div>
                                <button type="button" id="add-sal-pay-stage-btn" class="primary-btn" style="height: 38px;"><i class="fa-solid fa-plus"></i></button>
                            </div>

                            <table class="invoice-table" style="font-size: 0.85rem;">
                                <thead><tr><th>Date</th><th>Method</th><th>Pay Ref</th><th>Note</th><th class="text-right">Amount (RM)</th><th class="text-right" style="width: 60px;">Action</th></tr></thead>
                                <tbody id="add-sal-pay-tbody">
                                    <tr><td colspan="6" class="text-muted" style="text-align:center; padding:12px;">No payments added yet.</td></tr>
                                </tbody>
                            </table>

                            <div style="display: flex; justify-content: flex-end; gap: 24px; margin-top: 10px; padding: 10px 14px; background: var(--bg-main); border-radius: 6px; font-size: 0.9rem;">
                                <span class="text-muted">Amount: <strong id="add-sal-pay-summary-amount" style="color: var(--text-main);">0.00</strong></span>
                                <span class="text-muted">Paid: <strong id="add-sal-pay-summary-paid" style="color: var(--success);">0.00</strong></span>
                                <span class="text-muted">Balance: <strong id="add-sal-pay-summary-balance" style="color: var(--danger);">0.00</strong></span>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="action-btn" id="cancel-add-salary-btn">Cancel</button>
                <button type="submit" form="add-salary-form" class="primary-btn" id="save-add-salary-btn">Save Salary</button>
            </div>
        </div>
    </div>

    <!-- View / Edit Salary Modal -->
    <div id="view-salary-modal" class="modal-overlay">
        <div class="modal-content" style="max-width: 1200px;">
            <div class="modal-header">
                <h2 id="view-salary-modal-title">View Salary Details</h2>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <button type="button" class="outline-btn" id="view-salary-print-btn" style="padding: 6px 14px;"><i class="fa-solid fa-print"></i> Print</button>
                    <button class="close-modal-btn" id="close-view-salary-btn"><i class="fa-solid fa-xmark"></i></button>
                </div>
            </div>
            <div class="modal-body" style="padding: 24px;">
                <form id="view-salary-form" class="modal-form">
                    <div class="form-row">
                        <div class="form-group col-6">
                            <label class="form-label">Month</label>
                            <input type="month" id="view-salary-date" class="form-input">
                        </div>
                        <div class="form-group col-6">
                            <label class="form-label">Reference #</label>
                            <input type="text" id="view-salary-ref" class="form-input" readonly disabled>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-6">
                            <label class="form-label">Staff</label>
                            <select id="view-salary-staff" class="select2-search" style="width: 100%;"><option></option></select>
                        </div>
                        <div class="form-group col-6">
                            <label class="form-label">Status</label>
                            <select id="view-salary-status" class="select2-search" style="width: 100%;">
                                <option value="${SAL_STATUS_WAITING}">Waiting</option>
                                <option value="${SAL_STATUS_PAID}">Paid</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-6">
                            <label class="form-label">Amount (RM)</label>
                            <input type="text" id="view-salary-amount" class="form-input" readonly disabled style="font-weight: 700;">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-12">
                            <label class="form-label">Description / Notes</label>
                            <textarea id="view-salary-note" class="form-input" style="height: 60px; resize: none;"></textarea>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-12">
                            <label class="form-label">Attachments</label>
                            <ul id="view-salary-attachments-list" style="list-style: none; display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px;">
                                <li class="text-muted text-sm">No attachments.</li>
                            </ul>
                            <input type="file" id="view-salary-new-attachments" class="form-input" multiple accept="image/*,.pdf" style="padding: 10px;">
                        </div>
                    </div>

                    <!-- Salary Items (live) -->
                    <div class="form-row">
                        <div class="form-group col-12">
                            <label class="form-label" style="margin-bottom: 10px; display: block;">Salary Items</label>
                            <div style="display: grid; grid-template-columns: 1.6fr 1fr 1fr auto; gap: 10px; align-items: end; padding: 14px; background: var(--bg-main); border-radius: 8px; border: 1px dashed var(--border-color); margin-bottom: 12px;">
                                <div>
                                    <label class="form-label" style="font-size: 0.75rem; margin-bottom: 4px; display: block;">Item</label>
                                    <select id="view-sal-item" class="select2-search" style="width: 100%;"></select>
                                </div>
                                <div>
                                    <label class="form-label" style="font-size: 0.75rem; margin-bottom: 4px; display: block;">Date</label>
                                    <input type="date" id="view-sal-item-date" class="form-input" style="height: 38px; padding: 6px 12px; font-size: 0.9rem;">
                                </div>
                                <div>
                                    <label class="form-label" style="font-size: 0.75rem; margin-bottom: 4px; display: block;">RM</label>
                                    <input type="text" id="view-sal-item-amount" class="form-input" style="height: 38px; padding: 6px 12px; font-size: 0.9rem;" placeholder="0.00">
                                </div>
                                <button type="button" id="view-sal-item-add-btn" class="primary-btn" style="height: 38px;"><i class="fa-solid fa-plus"></i></button>
                            </div>

                            <table class="invoice-table" style="font-size: 0.85rem;">
                                <thead><tr><th>Date</th><th>Item</th><th class="text-right">Amount (RM)</th><th class="text-right" style="width: 60px;">Action</th></tr></thead>
                                <tbody id="view-sal-item-tbody">
                                    <tr><td colspan="4" class="text-muted" style="text-align:center; padding:12px;">Loading...</td></tr>
                                </tbody>
                            </table>
                            <div style="display: flex; justify-content: flex-end; margin-top: 10px; padding: 10px 14px; background: var(--bg-main); border-radius: 6px; font-size: 0.9rem;">
                                <span class="text-muted">Total: <strong id="view-sal-item-total" style="color: var(--text-main);">0.00</strong></span>
                            </div>
                        </div>
                    </div>

                    <!-- Payments (live) -->
                    <div class="form-row">
                        <div class="form-group col-12">
                            <label class="form-label" style="margin-bottom: 10px; display: block;">Payments</label>
                            <div style="display: grid; grid-template-columns: 1.3fr 1.3fr 1fr 1fr 1.3fr auto; gap: 10px; align-items: end; padding: 14px; background: var(--bg-main); border-radius: 8px; border: 1px dashed var(--border-color); margin-bottom: 12px;">
                                <div>
                                    <label class="form-label" style="font-size: 0.75rem; margin-bottom: 4px; display: block;">Method</label>
                                    <select id="view-sal-pay-method" class="select2-search" style="width: 100%;"></select>
                                </div>
                                <div>
                                    <label class="form-label" style="font-size: 0.75rem; margin-bottom: 4px; display: block;">Date</label>
                                    <input type="date" id="view-sal-pay-date" class="form-input" style="height: 38px; padding: 6px 12px; font-size: 0.9rem;">
                                </div>
                                <div>
                                    <label class="form-label" style="font-size: 0.75rem; margin-bottom: 4px; display: block;">RM Pay</label>
                                    <input type="text" id="view-sal-pay-amount" class="form-input" style="height: 38px; padding: 6px 12px; font-size: 0.9rem;" placeholder="0.00">
                                </div>
                                <div>
                                    <label class="form-label" style="font-size: 0.75rem; margin-bottom: 4px; display: block;">Pay Ref</label>
                                    <input type="text" id="view-sal-pay-ref" class="form-input" style="height: 38px; padding: 6px 12px; font-size: 0.9rem;" placeholder="Optional">
                                </div>
                                <div>
                                    <label class="form-label" style="font-size: 0.75rem; margin-bottom: 4px; display: block;">Note</label>
                                    <input type="text" id="view-sal-pay-note" class="form-input" style="height: 38px; padding: 6px 12px; font-size: 0.9rem;" placeholder="Optional">
                                </div>
                                <button type="button" id="view-sal-pay-add-btn" class="primary-btn" style="height: 38px;"><i class="fa-solid fa-plus"></i></button>
                            </div>

                            <table class="invoice-table" style="font-size: 0.85rem;">
                                <thead><tr><th>Date</th><th>Method</th><th>Pay Ref</th><th>Note</th><th class="text-right">Amount (RM)</th><th class="text-right" style="width: 60px;">Action</th></tr></thead>
                                <tbody id="view-sal-pay-tbody">
                                    <tr><td colspan="6" class="text-muted" style="text-align:center; padding:12px;">Loading payments...</td></tr>
                                </tbody>
                            </table>

                            <div style="display: flex; justify-content: flex-end; gap: 24px; margin-top: 10px; padding: 10px 14px; background: var(--bg-main); border-radius: 6px; font-size: 0.9rem;">
                                <span class="text-muted">Amount: <strong id="view-sal-pay-summary-amount" style="color: var(--text-main);">0.00</strong></span>
                                <span class="text-muted">Paid: <strong id="view-sal-pay-summary-paid" style="color: var(--success);">0.00</strong></span>
                                <span class="text-muted">Balance: <strong id="view-sal-pay-summary-balance" style="color: var(--danger);">0.00</strong></span>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer" style="justify-content: space-between;">
                <button type="button" class="action-btn" style="color: var(--danger); border-color: var(--danger);" id="delete-view-salary-btn"><i class="fa-regular fa-trash-can"></i> Delete</button>
                <div style="display: flex; gap: 12px;">
                    <button class="action-btn" id="cancel-view-salary-btn">Close</button>
                    <button type="button" class="primary-btn" id="save-view-salary-btn"><i class="fa-solid fa-floppy-disk"></i> Save</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Manage Salary Items Modal -->
    <div id="manage-sal-items-modal" class="modal-overlay">
        <div class="modal-content" style="max-width: 560px;">
            <div class="modal-header">
                <h2>Manage Salary Items</h2>
                <button class="close-modal-btn" id="close-manage-sal-items-btn"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body">
                <div class="form-row" style="align-items: flex-end;">
                    <div class="form-group col-5">
                        <label class="form-label">Item Name</label>
                        <input type="text" id="new-sal-item-name" placeholder=" " class="form-input">
                    </div>
                    <div class="form-group col-3">
                        <label class="form-label">ISO Code</label>
                        <input type="text" id="new-sal-item-iso" placeholder=" " class="form-input">
                    </div>
                    <div class="form-group col-3">
                        <label class="form-label">Type</label>
                        <select id="new-sal-item-ope" class="select2-search" style="width: 100%;">
                            <option value="1">Add (+)</option>
                            <option value="0">Deduct (-)</option>
                        </select>
                    </div>
                    <div class="form-group" style="flex: 0 0 auto;">
                        <button class="primary-btn" id="add-sal-item-cat-btn" style="height: 46px; width: 46px; padding: 0; justify-content: center;"><i class="fa-solid fa-plus"></i></button>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group col-6">
                        <label class="form-label">Amount Type</label>
                        <select id="new-sal-item-type" class="select2-search" style="width: 100%;">
                            <option value="0">RM (fixed)</option>
                            <option value="1">% (of Basic Salary)</option>
                        </select>
                    </div>
                    <div class="form-group col-6" id="new-sal-item-amt-group">
                        <label class="form-label">Default %</label>
                        <input type="text" id="new-sal-item-amt" placeholder="0.00" class="form-input">
                    </div>
                </div>
                <ul id="sal-item-manage-list" style="list-style: none; margin-top: 16px; display: flex; flex-direction: column; gap: 8px;"></ul>
            </div>
            <div class="modal-footer">
                <button class="action-btn" id="close-manage-sal-items-footer-btn">Close</button>
            </div>
        </div>
    </div>

    <!-- Salary Item Delete Blocked / Confirm -->
    <div id="sal-item-delete-blocked-modal" class="modal-overlay">
        <div class="modal-content small-modal">
            <div class="modal-title"><i class="fa-solid fa-triangle-exclamation" style="color: var(--danger); margin-right: 8px;"></i> Cannot Delete Salary Item</div>
            <div class="modal-text" id="sal-item-delete-blocked-text">This salary item cannot be deleted.</div>
            <div class="modal-actions">
                <button class="btn-modal-no" onclick="document.getElementById('sal-item-delete-blocked-modal').classList.remove('active')">OK</button>
            </div>
        </div>
    </div>
    <div id="sal-item-delete-confirm-modal" class="modal-overlay">
        <div class="modal-content small-modal">
            <div class="modal-title"><i class="fa-solid fa-triangle-exclamation" style="color: var(--danger); margin-right: 8px;"></i> Delete Salary Item</div>
            <div class="modal-text">Are you sure you want to delete this salary item? This cannot be undone.</div>
            <div class="modal-actions">
                <button class="btn-modal-yes" id="confirm-delete-sal-item-btn">YES, DELETE</button>
                <button class="btn-modal-no" onclick="document.getElementById('sal-item-delete-confirm-modal').classList.remove('active')">CANCEL</button>
            </div>
        </div>
    </div>

    <!-- Delete Salary Confirm -->
    <div id="salary-delete-confirm-modal" class="modal-overlay">
        <div class="modal-content small-modal">
            <div class="modal-title"><i class="fa-solid fa-triangle-exclamation" style="color: var(--danger); margin-right: 8px;"></i> Delete Salary</div>
            <div class="modal-text">Are you sure you want to delete this salary record? This cannot be undone.</div>
            <div class="modal-actions">
                <button class="btn-modal-yes" id="confirm-delete-salary-btn">YES, DELETE</button>
                <button class="btn-modal-no" onclick="document.getElementById('salary-delete-confirm-modal').classList.remove('active')">CANCEL</button>
            </div>
        </div>
    </div>
    `;
}

window.init_salary = async function() {
    salaryActiveStoreId = await window.getActiveStoreId();
    if (!salaryActiveStoreId) {
        document.getElementById('salary-table-body').innerHTML =
            `<tr><td colspan="7" class="text-muted" style="text-align:center; padding:24px;">You are not assigned to any store.</td></tr>`;
        return;
    }

    const [{ data: staffRows }, { data: salaryItems }, { data: storeRow }, { data: payMethods }, { data: company }] = await Promise.all([
        window.supabaseClient
            .from('store_contact')
            .select('id, contact (id, name), role (name)')
            .eq('store', salaryActiveStoreId),
        window.supabaseClient.from('salary_item').select('id, name, iso, ope, type, amt, is_deletable').order('name'),
        window.supabaseClient.from('store').select('id, name, url, email, tel, address').eq('id', salaryActiveStoreId).maybeSingle(),
        window.supabaseClient.from('pay_method').select('id, name').order('name'),
        window.supabaseClient.from('company').select('id, name, ssm, tel, email, address').limit(1).maybeSingle()
    ]);

    salaryStaffCache = (staffRows || []).filter(s => s.contact &&
        SALARY_STAFF_ROLES.includes((s.role?.name || '').toLowerCase()));
    salaryItemsCache = salaryItems || [];
    salaryStoreUrlCache = storeRow?.url || '';
    salaryStoreDetailsCache = storeRow || null;
    salaryPayMethodCache = payMethods || [];
    salaryCompanyCache = company || null;

    populateSalarySelect('search-staff', salaryStaffCache.map(s => ({ id: s.id, name: s.contact.name })), 'All');
    populateSalarySelect('salary-staff', salaryStaffCache.map(s => ({ id: s.id, name: s.contact.name })));
    populateSalarySelect('view-salary-staff', salaryStaffCache.map(s => ({ id: s.id, name: s.contact.name })));

    const today = new Date();
    document.getElementById('date-from').value = salToMonthInputValue(today);
    document.getElementById('date-to').value = salToMonthInputValue(today);

    salaryCurrentPage = 1;
    readSalaryFiltersFromUI();
    await fetchAndRenderSalary();

    setupAddSalaryModal();
    setupViewSalaryModal();
    setupSalaryDeleteModal();
    setupManageSalItemsModal();
    setupSalItemDeleteModal();
    setupSalaryPdfExport();

    const filterBtn = document.getElementById('salary-filter-btn');
    if (filterBtn) filterBtn.addEventListener('click', () => { salaryCurrentPage = 1; readSalaryFiltersFromUI(); fetchAndRenderSalary(); });
    if (typeof jQuery !== 'undefined') {
        $('#search-staff, #search-status').on('change', () => { salaryCurrentPage = 1; readSalaryFiltersFromUI(); fetchAndRenderSalary(); });
    }

    if (typeof window.initializeSelect2 === 'function') window.initializeSelect2();
};

function salToDateInputValue(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function salToMonthInputValue(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}`;
}

// "YYYY-MM" -> first-of-month ISO date string, for DB storage / date-math.
function monthToRangeStart(monthStr) {
    return monthStr ? `${monthStr}-01T00:00:00` : '';
}

// "YYYY-MM" -> last-of-month ISO date string (inclusive), for range filters.
function monthToRangeEnd(monthStr) {
    if (!monthStr) return '';
    const [y, m] = monthStr.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    return `${monthStr}-${String(lastDay).padStart(2, '0')}T23:59:59`;
}

function formatSalaryMonthYear(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '-';
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
}

function populateSalarySelect(id, items, allLabel) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = (allLabel ? `<option value="">${allLabel}</option>` : '<option></option>')
        + items.map(i => `<option value="${i.id}">${i.name}</option>`).join('');
}

function populateSalaryItemSelect(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '<option></option>' + salaryItemsCache.map(i =>
        `<option value="${i.id}" data-ope="${i.ope}" data-type="${i.type}" data-amt="${i.amt ?? ''}">${i.name}${i.ope === 0 ? ' (-)' : ' (+)'}${i.type === 1 ? ' [%]' : ''}</option>`
    ).join('');
}

function populateSalaryPayMethodSelect(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = salaryPayMethodCache.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
}

// "Basic Salary" = the first staged/saved line that is RM-type (type 0) and adds (ope 1).
function findBasicSalaryAmount(lines, resolveItem) {
    for (const l of lines) {
        const item = resolveItem(l);
        if (item && item.ope === 1 && item.type === 0) return Number(l.rm) || 0;
    }
    return null;
}

// --- Stats ---
async function renderSalaryStatsGrid() {
    const grid = document.getElementById('salary-stats-grid');
    if (!grid) return;

    grid.style.gridTemplateColumns = `repeat(4, 1fr)`;
    grid.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon" style="background-color: var(--danger-bg); color: var(--danger);"><i class="fa-solid fa-money-bill-wave"></i></div>
            <div class="stat-details"><p>TOTAL RM</p><h3 id="stat-sal-total">-</h3></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background-color: var(--info-bg); color: var(--info);"><i class="fa-solid fa-file-invoice"></i></div>
            <div class="stat-details"><p>TOTAL RECORDS</p><h3 id="stat-sal-count">-</h3></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background-color: var(--warning-bg); color: var(--warning);"><i class="fa-solid fa-clock-rotate-left"></i></div>
            <div class="stat-details"><p>WAITING</p><h3 id="stat-sal-waiting">-</h3></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background-color: var(--success-bg); color: var(--success);"><i class="fa-solid fa-circle-check"></i></div>
            <div class="stat-details"><p>PAID</p><h3 id="stat-sal-paid">-</h3></div>
        </div>
    `;

    const staffIds = salaryStaffCache.map(s => s.id);
    if (!staffIds.length) {
        ['stat-sal-total', 'stat-sal-count', 'stat-sal-waiting', 'stat-sal-paid'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = id === 'stat-sal-count' ? '0' : 'RM 0.00';
        });
        return;
    }

    let query = window.supabaseClient.from('expenses').select('amount, status')
        .eq('category', SALARY_CATEGORY_ID).in('supplier', staffIds);
    query = applySalaryDateAndBaseFilters(query, { includeStatus: false });
    const { data } = await query;

    const rows = data || [];
    const total = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const waiting = rows.filter(r => r.status === SAL_STATUS_WAITING).reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const paid = rows.filter(r => r.status === SAL_STATUS_PAID).reduce((s, r) => s + (Number(r.amount) || 0), 0);

    document.getElementById('stat-sal-total').textContent = `RM ${total.toFixed(2)}`;
    document.getElementById('stat-sal-count').textContent = rows.length;
    document.getElementById('stat-sal-waiting').textContent = `RM ${waiting.toFixed(2)}`;
    document.getElementById('stat-sal-paid').textContent = `RM ${paid.toFixed(2)}`;
}

function readSalaryFiltersFromUI() {
    salaryActiveFilters = {
        dateFrom: document.getElementById('date-from')?.value || '',
        dateTo: document.getElementById('date-to')?.value || '',
        staff: document.getElementById('search-staff')?.value || '',
        status: document.getElementById('search-status')?.value || ''
    };
}

function applySalaryDateAndBaseFilters(query, { includeStatus }) {
    if (salaryActiveFilters.dateFrom) query = query.gte('date', monthToRangeStart(salaryActiveFilters.dateFrom));
    if (salaryActiveFilters.dateTo) query = query.lte('date', monthToRangeEnd(salaryActiveFilters.dateTo));
    if (salaryActiveFilters.staff) query = query.eq('supplier', salaryActiveFilters.staff);
    if (includeStatus && salaryActiveFilters.status) query = query.eq('status', salaryActiveFilters.status);
    return query;
}

function buildSalaryQuery({ forCount }) {
    const staffIds = salaryStaffCache.map(s => s.id);
    let query = window.supabaseClient
        .from('expenses')
        .select(`
            id, exp_no, status, amount, note, date,
            supplier ( id, contact ( id, name ) ),
            expenses_payment ( rm_pay )
        `, { count: forCount ? 'exact' : null })
        .eq('category', SALARY_CATEGORY_ID)
        .in('supplier', staffIds.length ? staffIds : [-1]);

    query = applySalaryDateAndBaseFilters(query, { includeStatus: true });
    return query.order('date', { ascending: false });
}

async function fetchAndRenderSalary() {
    const from = (salaryCurrentPage - 1) * SALARY_PAGE_SIZE;
    const to = from + SALARY_PAGE_SIZE - 1;

    const { data, error, count } = await buildSalaryQuery({ forCount: true }).range(from, to);

    if (error) {
        document.getElementById('salary-table-body').innerHTML =
            `<tr><td colspan="7" class="text-muted" style="text-align:center; padding:24px;">Failed to load salary records.</td></tr>`;
        return;
    }

    const rows = (data || []).filter(r => r.supplier);
    salaryRowsCache = rows;
    salaryTotalCount = count ?? rows.length;

    renderSalaryTable(rows, from);
    renderSalaryPagination();
    await renderSalaryStatsGrid();

    const shownFrom = rows.length ? from + 1 : 0;
    const shownTo = from + rows.length;
    const info = document.getElementById('salary-pagination-info');
    if (info) info.textContent = `Showing ${shownFrom} to ${shownTo} of ${salaryTotalCount} entries`;
}

function renderSalaryPagination() {
    const list = document.getElementById('salary-pagination-list');
    if (!list) return;

    const totalPages = Math.max(1, Math.ceil(salaryTotalCount / SALARY_PAGE_SIZE));
    let html = `<li><button class="page-btn ${salaryCurrentPage === 1 ? 'disabled' : ''}" id="salary-page-prev"><i class="fa-solid fa-chevron-left"></i></button></li>`;
    for (let p = 1; p <= totalPages; p++) {
        html += `<li><button class="page-btn ${p === salaryCurrentPage ? 'active' : ''}" data-page="${p}">${p}</button></li>`;
    }
    html += `<li><button class="page-btn ${salaryCurrentPage === totalPages ? 'disabled' : ''}" id="salary-page-next"><i class="fa-solid fa-chevron-right"></i></button></li>`;
    list.innerHTML = html;

    list.querySelectorAll('.page-btn[data-page]').forEach(btn => {
        btn.addEventListener('click', () => { salaryCurrentPage = parseInt(btn.getAttribute('data-page'), 10); fetchAndRenderSalary(); });
    });
    const prevBtn = document.getElementById('salary-page-prev');
    const nextBtn = document.getElementById('salary-page-next');
    if (prevBtn) prevBtn.addEventListener('click', () => { if (salaryCurrentPage > 1) { salaryCurrentPage--; fetchAndRenderSalary(); } });
    if (nextBtn) nextBtn.addEventListener('click', () => { if (salaryCurrentPage < totalPages) { salaryCurrentPage++; fetchAndRenderSalary(); } });
}

function renderSalaryTable(rows, offset) {
    const tbody = document.getElementById('salary-table-body');
    if (!tbody) return;

    if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-muted" style="text-align:center; padding:24px;">No salary records found.</td></tr>`;
        return;
    }

    tbody.innerHTML = rows.map((r, i) => {
        const paid = (r.expenses_payment || []).reduce((s, p) => s + (Number(p.rm_pay) || 0), 0);
        const amount = Number(r.amount || 0);
        const balance = amount - paid;
        return `
        <tr>
            <td>${offset + i + 1}</td>
            <td>
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <a href="#" class="font-mono view-salary-link" data-sal-id="${r.id}" style="color: #2563eb; font-weight: 600; text-decoration: none;">${r.exp_no || '-'}</a>
                    <span class="status ${SALARY_STATUS_CLASS[r.status]}" style="font-size: 0.7em; padding: 2px 6px; width: fit-content;">${SALARY_STATUS_LABELS[r.status] || '-'}</span>
                </div>
            </td>
            <td>${formatSalaryMonthYear(r.date)}</td>
            <td>${r.supplier?.contact?.name || '-'}</td>
            <td class="text-right" style="font-weight: 500;">RM ${amount.toFixed(2)}</td>
            <td class="text-right" style="font-weight: 500; color: var(--success);">RM ${paid.toFixed(2)}</td>
            <td class="text-right" style="font-weight: 600; ${balance > 0 ? 'color: var(--danger);' : ''}">RM ${balance.toFixed(2)}</td>
        </tr>`;
    }).join('');

    tbody.querySelectorAll('.view-salary-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            openViewSalaryModalById(link.getAttribute('data-sal-id'));
        });
    });
}

// --- exp_no generation for salary: SAL-{url}-{year}-{seq} ---
async function generateSalaryNo(forMonth) {
    const year = parseInt((forMonth || '').split('-')[0], 10) || new Date().getFullYear();
    const urlPart = (salaryStoreUrlCache || 'STORE').toString().trim();
    const prefix = `SAL-${urlPart}-${year}-`;

    const { data } = await window.supabaseClient
        .from('expenses')
        .select('exp_no')
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

// Income (ope=1) first, then expenses (ope=0); within each group, order by salary_item id ascending.
function sortSalaryLines(lines) {
    return [...lines].sort((a, b) => {
        const itemA = salaryItemsCache.find(i => String(i.id) === String(a.salary_item));
        const itemB = salaryItemsCache.find(i => String(i.id) === String(b.salary_item));
        const opeA = itemA ? itemA.ope : 1;
        const opeB = itemB ? itemB.ope : 1;

        if (opeA !== opeB) return opeB - opeA; // ope=1 (income) before ope=0 (expense)

        const idA = Number(a.salary_item) || 0;
        const idB = Number(b.salary_item) || 0;
        return idA - idB;
    });
}

// --- Attachments (shared `media` table, same table_ref as expenses) ---
const SALARY_MEDIA_BUCKET = 'media';

async function uploadSalaryAttachments(expenseId, fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return { failures: [] };
    const failures = [];
    for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `expenses/${expenseId}/${Date.now()}-${safeName}`;
        const { error: uploadErr } = await window.supabaseClient.storage
            .from(SALARY_MEDIA_BUCKET).upload(path, file, { cacheControl: '3600', upsert: false });
        if (uploadErr) { failures.push({ name: file.name, error: uploadErr.message }); continue; }
        const { error: mediaErr } = await window.supabaseClient.from('media').insert({
            table_ref: SALARY_TABLE_REF_EXPENSES,
            table_ref_id: expenseId,
            path,
            file_name: file.name,
            created_by: await window.getCurrentContactId()
        });
        if (mediaErr) failures.push({ name: file.name, error: mediaErr.message });
    }
    return { failures };
}

async function deleteSalaryAttachment(mediaId, path) {
    await window.supabaseClient.storage.from(SALARY_MEDIA_BUCKET).remove([path]);
    const { error } = await window.supabaseClient.from('media').delete().eq('id', mediaId);
    return { error };
}

async function renderViewSalaryAttachments(expenseId) {
    const list = document.getElementById('view-salary-attachments-list');
    if (!list) return;

    const { data, error } = await window.supabaseClient
        .from('media').select('id, path, file_name')
        .eq('table_ref', SALARY_TABLE_REF_EXPENSES).eq('table_ref_id', expenseId).order('id');

    if (error || !data || !data.length) {
        list.innerHTML = `<li class="text-muted text-sm">No attachments.</li>`;
        return;
    }

    list.innerHTML = data.map(m => {
        const { data: urlData } = window.supabaseClient.storage.from(SALARY_MEDIA_BUCKET).getPublicUrl(m.path);
        return `
            <li data-media-id="${m.id}" data-media-path="${m.path}" style="display: flex; align-items: center; gap: 8px; padding: 6px 10px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-main);">
                <i class="fa-solid fa-paperclip text-muted"></i>
                <a href="${urlData.publicUrl}" target="_blank" rel="noopener" style="color: #2563eb; text-decoration: none; flex: 1; font-size: 0.9rem;">${m.file_name || m.path.split('/').pop()}</a>
                <button type="button" class="icon-action delete sal-attachment-delete-btn" title="Delete attachment"><i class="fa-solid fa-trash"></i></button>
            </li>`;
    }).join('');

    list.querySelectorAll('.sal-attachment-delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const li = btn.closest('li');
            const mediaId = li.getAttribute('data-media-id');
            const path = li.getAttribute('data-media-path');
            if (!confirm('Delete this attachment? This cannot be undone.')) return;
            btn.disabled = true;
            const { error: delErr } = await deleteSalaryAttachment(mediaId, path);
            btn.disabled = false;
            if (delErr) { alert('Failed to delete attachment.'); return; }
            li.remove();
            if (!list.children.length) list.innerHTML = `<li class="text-muted text-sm">No attachments.</li>`;
        });
    });
}

// --- Add Salary modal: staged Salary Items ---
function renderAddSalItemStagedTable() {
    const tbody = document.getElementById('add-sal-item-tbody');
    if (!tbody) return;

    if (!addSalaryStagedLines.length) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-muted" style="text-align:center; padding:12px;">No salary items added yet.</td></tr>`;
    } else {
        tbody.innerHTML = addSalaryStagedLines.map((l, idx) => {
            const suffix = l.type === 1 ? ` (${l.pct}%)` : (l.ope === 0 ? ' (-)' : ' (+)');
            return `
            <tr>
                <td>${l.date ? window.formatDateOnly(l.date) : '-'}</td>
                <td>${l.item_name}${suffix}</td>
                <td class="text-right" style="font-weight:600; ${l.ope === 0 ? 'color: var(--danger);' : 'color: var(--success);'}">${Number(l.rm || 0).toFixed(2)}</td>
                <td class="text-right"><button type="button" class="icon-action delete add-sal-item-remove-btn" data-idx="${idx}"><i class="fa-solid fa-trash"></i></button></td>
            </tr>`;
        }).join('');
    }

    tbody.querySelectorAll('.add-sal-item-remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            addSalaryStagedLines.splice(parseInt(btn.getAttribute('data-idx'), 10), 1);
            renderAddSalItemStagedTable();
            recomputeAddSalaryAmount();
        });
    });
}

function recomputeAddSalaryAmount() {
    const total = addSalaryStagedLines.reduce((s, l) => s + (l.ope === 0 ? -l.rm : l.rm), 0);
    document.getElementById('add-sal-item-total').textContent = total.toFixed(2);
    document.getElementById('salary-amount').value = total.toFixed(2);
    updateAddSalPaySummary();
}

function wireAddSalItemForm() {
    const stageBtn = document.getElementById('add-sal-item-stage-btn');
    if (!stageBtn) return;

    populateSalaryItemSelect('add-sal-item');
    const amountInput = document.getElementById('add-sal-item-amount');

    const applySelection = () => {
        const sel = document.getElementById('add-sal-item');
        const opt = sel.options[sel.selectedIndex];
        if (!opt || !opt.value) return;
        const type = parseInt(opt.getAttribute('data-type'), 10);
        const defaultAmt = opt.getAttribute('data-amt');

        if (type === 1) {
            const basic = findBasicSalaryAmount(addSalaryStagedLines, l =>
                salaryItemsCache.find(i => String(i.id) === String(l.salary_item)));
            amountInput.readOnly = true;
            if (basic == null) {
                amountInput.value = '';
                amountInput.placeholder = 'Add Basic Salary first';
            } else {
                const pct = defaultAmt ? Number(defaultAmt) : 0;
                amountInput.value = (basic * pct / 100).toFixed(2);
            }
        } else {
            amountInput.readOnly = false;
            amountInput.placeholder = '0.00';
            if (defaultAmt) amountInput.value = Number(defaultAmt).toFixed(2);
        }
    };

    if (typeof jQuery !== 'undefined') {
        $('#add-sal-item').on('change', applySelection);
    } else {
        document.getElementById('add-sal-item').addEventListener('change', applySelection);
    }

    stageBtn.addEventListener('click', () => {
        const sel = document.getElementById('add-sal-item');
        const itemId = sel.value;
        if (!itemId) { alert('Please select a salary item.'); return; }
        const item = salaryItemsCache.find(i => String(i.id) === itemId);
        const dateVal = document.getElementById('add-sal-item-date').value;

        let amount;
        if (item.type === 1) {
            const basic = findBasicSalaryAmount(addSalaryStagedLines, l =>
                salaryItemsCache.find(i => String(i.id) === String(l.salary_item)));
            if (basic == null) { alert('Please add a Basic Salary (RM, +) line first before adding percentage-based items.'); return; }
            amount = Math.round((basic * (Number(item.amt) || 0) / 100) * 100) / 100;
        } else {
            amount = parseFloat(document.getElementById('add-sal-item-amount').value);
        }

        if (isNaN(amount) || amount <= 0) { alert('Please enter a valid amount.'); return; }

        addSalaryStagedLines.push({
            salary_item: itemId,
            item_name: item?.name || '-',
            ope: item?.ope ?? 1,
            type: item?.type ?? 0,
            pct: item.type === 1 ? Number(item.amt) || 0 : null,
            date: dateVal || salToDateInputValue(new Date()),
            rm: amount
        });

        document.getElementById('add-sal-item-amount').value = '';
        document.getElementById('add-sal-item-amount').readOnly = false;
        document.getElementById('add-sal-item-amount').placeholder = '0.00';
        sel.value = '';
        if (typeof jQuery !== 'undefined') $(sel).trigger('change.select2');
        renderAddSalItemStagedTable();
        recomputeAddSalaryAmount();
    });
}

function renderAddSalPayStagedTable() {
    const tbody = document.getElementById('add-sal-pay-tbody');
    if (!tbody) return;

    if (!addSalaryStagedPayments.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-muted" style="text-align:center; padding:12px;">No payments added yet.</td></tr>`;
    } else {
        tbody.innerHTML = addSalaryStagedPayments.map((p, idx) => {
            const methodName = salaryPayMethodCache.find(m => String(m.id) === String(p.pay_method))?.name || '-';
            return `
                <tr>
                    <td>${p.date ? window.formatDateOnly(p.date) : '-'}</td>
                    <td>${methodName}</td>
                    <td>${p.pay_ref || '-'}</td>
                    <td>${p.note || '-'}</td>
                    <td class="text-right" style="font-weight:600; color: var(--success);">${Number(p.rm_pay || 0).toFixed(2)}</td>
                    <td class="text-right"><button type="button" class="icon-action delete add-sal-pay-remove-btn" data-idx="${idx}"><i class="fa-solid fa-trash"></i></button></td>
                </tr>`;
        }).join('');
    }

    tbody.querySelectorAll('.add-sal-pay-remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            addSalaryStagedPayments.splice(parseInt(btn.getAttribute('data-idx'), 10), 1);
            renderAddSalPayStagedTable();
            updateAddSalPaySummary();
        });
    });
}

function updateAddSalPaySummary() {
    const amount = parseFloat(document.getElementById('salary-amount')?.value) || 0;
    const paid = addSalaryStagedPayments.reduce((s, p) => s + (Number(p.rm_pay) || 0), 0);
    document.getElementById('add-sal-pay-summary-amount').textContent = amount.toFixed(2);
    document.getElementById('add-sal-pay-summary-paid').textContent = paid.toFixed(2);
    document.getElementById('add-sal-pay-summary-balance').textContent = (amount - paid).toFixed(2);
}

function wireAddSalPayForm() {
    const stageBtn = document.getElementById('add-sal-pay-stage-btn');
    if (!stageBtn) return;

    stageBtn.addEventListener('click', () => {
        const methodId = document.getElementById('add-sal-pay-method').value;
        const dateVal = document.getElementById('add-sal-pay-date').value;
        const amount = parseFloat(document.getElementById('add-sal-pay-amount').value);
        const ref = document.getElementById('add-sal-pay-ref').value.trim();
        const note = document.getElementById('add-sal-pay-note').value.trim();

        if (isNaN(amount) || amount <= 0) { alert('Please enter a valid payment amount.'); return; }

        const totalAmount = parseFloat(document.getElementById('salary-amount').value) || 0;
        const alreadyStaged = addSalaryStagedPayments.reduce((s, p) => s + (Number(p.rm_pay) || 0), 0);
        const balance = totalAmount - alreadyStaged;

        if (amount > balance + 0.001) {
            alert(`Amount cannot exceed the outstanding balance of RM ${Math.max(0, balance).toFixed(2)}.`);
            return;
        }

        addSalaryStagedPayments.push({
            pay_method: methodId || null,
            date: dateVal || salToDateInputValue(new Date()),
            rm_pay: amount,
            pay_ref: ref || null,
            note: note || null
        });

        document.getElementById('add-sal-pay-amount').value = '';
        document.getElementById('add-sal-pay-ref').value = '';
        document.getElementById('add-sal-pay-note').value = '';

        renderAddSalPayStagedTable();
        updateAddSalPaySummary();
    });
}

async function resolveSalaryTellerScId() {
    const contactId = await window.getCurrentContactId();
    const { data } = await window.supabaseClient
        .from('store_contact').select('id')
        .eq('store', salaryActiveStoreId).eq('contact', contactId).maybeSingle();
    return data?.id || null;
}

function setupAddSalaryModal() {
    const modal = document.getElementById('add-salary-modal');
    const openBtn = document.getElementById('page-add-salary-btn');
    const closeBtn = document.getElementById('close-add-salary-btn');
    const cancelBtn = document.getElementById('cancel-add-salary-btn');
    const form = document.getElementById('add-salary-form');
    const dateInput = document.getElementById('salary-date');
    const refPreview = document.getElementById('salary-ref-preview');

    const close = () => modal && modal.classList.remove('active');
    const open = async () => {
        if (!modal) return;
        form.querySelectorAll('input, select, textarea').forEach(el => {
            if (el.id !== 'salary-status' && el.id !== 'salary-amount') el.value = '';
            if (typeof jQuery !== 'undefined' && el.classList.contains('select2-search')) $(el).val(null).trigger('change');
        });
        document.getElementById('salary-attachments').value = '';
        document.getElementById('salary-amount').value = '0.00';

        addSalaryStagedLines = [];
        addSalaryStagedPayments = [];
        document.getElementById('add-sal-item-date').value = salToDateInputValue(new Date());
        document.getElementById('add-sal-pay-date').value = salToDateInputValue(new Date());
        populateSalaryItemSelect('add-sal-item');
        populateSalaryPayMethodSelect('add-sal-pay-method');
        renderAddSalItemStagedTable();
        renderAddSalPayStagedTable();
        recomputeAddSalaryAmount();

        const todayStr = salToMonthInputValue(new Date());
        dateInput.value = todayStr;
        refPreview.value = 'Generating...';
        refPreview.value = await generateSalaryNo(todayStr);
        modal.classList.add('active');
        if (typeof window.initializeSelect2 === 'function') window.initializeSelect2();
    };

    if (openBtn) openBtn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (cancelBtn) cancelBtn.addEventListener('click', close);
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

    dateInput.addEventListener('change', async () => {
        if (dateInput.value) refPreview.value = await generateSalaryNo(dateInput.value);
    });

    wireAddSalItemForm();
    wireAddSalPayForm();

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('save-add-salary-btn');
            const originalText = submitBtn.innerHTML;

            const dateVal = dateInput.value; // "YYYY-MM"
            const staffId = document.getElementById('salary-staff').value;
            const amount = parseFloat(document.getElementById('salary-amount').value) || 0;

            if (!dateVal || !staffId) { alert('Month and Staff are required.'); return; }
            if (!addSalaryStagedLines.length) { alert('Please add at least one salary item.'); return; }

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

            const basePayload = {
                date: `${dateVal}-01`,
                supplier: staffId,
                category: SALARY_CATEGORY_ID,
                amount,
                status: parseInt(document.getElementById('salary-status').value, 10) || SAL_STATUS_WAITING,
                note: document.getElementById('salary-note').value.trim(),
            };

            const MAX_ATTEMPTS = 3;
            let error = null, inserted = null;
            for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
                const expNo = await generateSalaryNo(dateVal);
                const { data, error: insertErr } = await window.supabaseClient
                    .from('expenses').insert({ ...basePayload, exp_no: expNo }).select('id').single();
                if (!insertErr) { inserted = data; error = null; break; }
                if (insertErr.code === '23505' && attempt < MAX_ATTEMPTS) continue;
                error = insertErr;
                break;
            }

            if (error) {
                alert(error.code === '23505' ? 'Could not generate a unique reference number, please try saving again.' : 'Failed to save salary record.');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                return;
            }

            const { error: linesErr } = await window.supabaseClient.from('expenses_salary').insert(
                addSalaryStagedLines.map(l => ({
                    expenses: inserted.id,
                    salary_item: l.salary_item,
                    date: l.date,
                    rm: l.rm
                }))
            );
            if (linesErr) alert('Salary saved, but one or more salary items failed to save: ' + linesErr.message);

            if (addSalaryStagedPayments.length) {
                const tellerScId = await resolveSalaryTellerScId();
                const { error: payErr } = await window.supabaseClient.from('expenses_payment').insert(
                    addSalaryStagedPayments.map(p => ({
                        expenses: inserted.id,
                        pay_method: p.pay_method,
                        date: p.date,
                        rm_pay: p.rm_pay,
                        pay_ref: p.pay_ref,
                        note: p.note,
                        teller: tellerScId
                    }))
                );
                if (payErr) alert('Salary saved, but one or more payments failed to save: ' + payErr.message);
            }

            const fileInput = document.getElementById('salary-attachments');
            const { failures } = await uploadSalaryAttachments(inserted.id, fileInput.files);
            if (failures.length) {
                alert(`Salary saved, but ${failures.length} attachment(s) failed to upload:\n` +
                    failures.map(f => `- ${f.name}: ${f.error}`).join('\n'));
            }

            submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Saved!';
            submitBtn.style.backgroundColor = 'var(--success)';
            setTimeout(async () => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                submitBtn.style.backgroundColor = '';
                close();
                salaryCurrentPage = 1;
                await fetchAndRenderSalary();
            }, 800);
        });
    }
}

// --- View / Edit Salary modal ---
function openViewSalaryModalById(salId) {
    const row = salaryRowsCache.find(r => String(r.id) === String(salId));
    if (!row) return;
    populateViewSalaryModal(row);
    renderViewSalaryAttachments(row.id);

    populateSalaryItemSelect('view-sal-item');
    populateSalaryPayMethodSelect('view-sal-pay-method');
    document.getElementById('view-sal-item-date').value = salToDateInputValue(new Date());
    document.getElementById('view-sal-pay-date').value = salToDateInputValue(new Date());
    if (typeof jQuery !== 'undefined') {
        $('#view-sal-item').trigger('change');
        $('#view-sal-pay-method').trigger('change');
    }

    renderViewSalaryItems(row.id);
    renderViewSalaryPayments(row.id);

    document.getElementById('view-salary-modal').classList.add('active');
}

function populateViewSalaryModal(row) {
    document.getElementById('view-salary-date').value = row.date ? row.date.slice(0, 7) : '';
    document.getElementById('view-salary-ref').value = row.exp_no || '';
    document.getElementById('view-salary-amount').value = Number(row.amount || 0).toFixed(2);
    document.getElementById('view-salary-note').value = row.note || '';

    const staffSel = document.getElementById('view-salary-staff');
    if (staffSel) {
        staffSel.value = row.supplier?.id || '';
        if (typeof jQuery !== 'undefined') $(staffSel).trigger('change');
    }
    const statusSel = document.getElementById('view-salary-status');
    if (statusSel) {
        statusSel.value = row.status || SAL_STATUS_WAITING;
        if (typeof jQuery !== 'undefined') $(statusSel).trigger('change');
    }

    document.getElementById('view-salary-modal').dataset.salId = row.id;
}

// --- View: Salary Items (live insert/delete + recompute Amount) ---
async function fetchSalaryItemsFor(expenseId) {
    const { data, error } = await window.supabaseClient
        .from('expenses_salary')
        .select('id, date, rm, salary_item')
        .eq('expenses', expenseId)
        .order('date', { ascending: false });
    return error ? [] : (data || []);
}

function recomputeViewSalaryTotal() {
    const total = viewSalaryLinesCache.reduce((s, l) => {
        const item = salaryItemsCache.find(i => String(i.id) === String(l.salary_item));
        const ope = item ? item.ope : 1;
        return s + (ope === 0 ? -Number(l.rm || 0) : Number(l.rm || 0));
    }, 0);
    document.getElementById('view-sal-item-total').textContent = total.toFixed(2);
    document.getElementById('view-salary-amount').value = total.toFixed(2);
    updateViewSalPaySummary(total);
    return total;
}

async function renderViewSalaryItems(expenseId) {
    viewSalaryLinesCache = sortSalaryLines(await fetchSalaryItemsFor(expenseId));
    const tbody = document.getElementById('view-sal-item-tbody');
    if (!tbody) return;

    if (!viewSalaryLinesCache.length) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-muted" style="text-align:center; padding:12px;">No salary items recorded.</td></tr>`;
    } else {
        tbody.innerHTML = viewSalaryLinesCache.map(l => {
            const item = salaryItemsCache.find(i => String(i.id) === String(l.salary_item));
            const ope = item ? item.ope : 1;
            const suffix = item && item.type === 1 ? ` (${item.amt}%)` : (ope === 0 ? ' (-)' : ' (+)');
            return `
                <tr data-line-id="${l.id}">
                    <td>${l.date ? window.formatDateOnly(l.date) : '-'}</td>
                    <td>${item?.name || '(deleted item)'}${suffix}</td>
                    <td class="text-right" style="font-weight:600; ${ope === 0 ? 'color: var(--danger);' : 'color: var(--success);'}">${Number(l.rm || 0).toFixed(2)}</td>
                    <td class="text-right"><button type="button" class="icon-action delete view-sal-item-remove-btn"><i class="fa-solid fa-trash"></i></button></td>
                </tr>`;
        }).join('');
    }

    tbody.querySelectorAll('.view-sal-item-remove-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const lineId = btn.closest('tr').getAttribute('data-line-id');
            if (!confirm('Delete this salary item line? This cannot be undone.')) return;
            const { error } = await window.supabaseClient.from('expenses_salary').delete().eq('id', lineId);
            if (error) { alert('Failed to delete salary item.'); return; }
            const total = await syncViewSalaryAmountToDb(expenseId);
            await renderViewSalaryItems(expenseId);
        });
    });

    recomputeViewSalaryTotal();
}

// Keeps expenses.amount in sync with the live-edited salary item lines.
async function syncViewSalaryAmountToDb(expenseId) {
    const lines = await fetchSalaryItemsFor(expenseId);
    const total = lines.reduce((s, l) => {
        const item = salaryItemsCache.find(i => String(i.id) === String(l.salary_item));
        const ope = item ? item.ope : 1;
        return s + (ope === 0 ? -Number(l.rm || 0) : Number(l.rm || 0));
    }, 0);
    await window.supabaseClient.from('expenses').update({ amount: total }).eq('id', expenseId);
    return total;
}

function wireViewSalItemForm() {
    const addBtn = document.getElementById('view-sal-item-add-btn');
    if (!addBtn) return;

    const amountInput = document.getElementById('view-sal-item-amount');
    const applySelection = () => {
        const sel = document.getElementById('view-sal-item');
        const opt = sel.options[sel.selectedIndex];
        if (!opt || !opt.value) return;
        const type = parseInt(opt.getAttribute('data-type'), 10);
        const defaultAmt = opt.getAttribute('data-amt');

        if (type === 1) {
            const basic = findBasicSalaryAmount(viewSalaryLinesCache, l =>
                salaryItemsCache.find(i => String(i.id) === String(l.salary_item)));
            amountInput.readOnly = true;
            if (basic == null) {
                amountInput.value = '';
                amountInput.placeholder = 'Add Basic Salary first';
            } else {
                const pct = defaultAmt ? Number(defaultAmt) : 0;
                amountInput.value = (basic * pct / 100).toFixed(2);
            }
        } else {
            amountInput.readOnly = false;
            amountInput.placeholder = '0.00';
            if (defaultAmt) amountInput.value = Number(defaultAmt).toFixed(2);
        }
    };

    if (typeof jQuery !== 'undefined') {
        $('#view-sal-item').off('change.prefill').on('change.prefill', applySelection);
    } else {
        document.getElementById('view-sal-item').addEventListener('change', applySelection);
    }

    addBtn.addEventListener('click', async () => {
        const modal = document.getElementById('view-salary-modal');
        const salId = modal.dataset.salId;
        const itemId = document.getElementById('view-sal-item').value;
        const dateVal = document.getElementById('view-sal-item-date').value;
        if (!itemId) { alert('Please select a salary item.'); return; }
        const item = salaryItemsCache.find(i => String(i.id) === itemId);

        let amount;
        if (item.type === 1) {
            const basic = findBasicSalaryAmount(viewSalaryLinesCache, l =>
                salaryItemsCache.find(i => String(i.id) === String(l.salary_item)));
            if (basic == null) { alert('Please add a Basic Salary (RM, +) line first before adding percentage-based items.'); return; }
            amount = Math.round((basic * (Number(item.amt) || 0) / 100) * 100) / 100;
        } else {
            amount = parseFloat(document.getElementById('view-sal-item-amount').value);
        }
        if (isNaN(amount) || amount <= 0) { alert('Please enter a valid amount.'); return; }

        addBtn.disabled = true;
        const { error } = await window.supabaseClient.from('expenses_salary').insert({
            expenses: salId,
            salary_item: itemId,
            date: dateVal || salToDateInputValue(new Date()),
            rm: amount
        });
        addBtn.disabled = false;

        if (error) { alert('Failed to add salary item.'); return; }

        document.getElementById('view-sal-item-amount').value = '';
        document.getElementById('view-sal-item-amount').readOnly = false;
        await syncViewSalaryAmountToDb(salId);
        await renderViewSalaryItems(salId);
    });
}

// --- View: Payments (live insert/delete) ---
async function fetchSalaryPaymentsFor(expenseId) {
    const { data, error } = await window.supabaseClient
        .from('expenses_payment')
        .select('id, pay_ref, date, rm_pay, note, pay_method (id, name)')
        .eq('expenses', expenseId)
        .order('date', { ascending: false });
    return error ? [] : (data || []);
}

function updateViewSalPaySummary(amount) {
    const paid = viewSalaryPaymentsCache.reduce((s, p) => s + (Number(p.rm_pay) || 0), 0);
    document.getElementById('view-sal-pay-summary-amount').textContent = Number(amount || 0).toFixed(2);
    document.getElementById('view-sal-pay-summary-paid').textContent = paid.toFixed(2);
    document.getElementById('view-sal-pay-summary-balance').textContent = (Number(amount || 0) - paid).toFixed(2);
}

async function renderViewSalaryPayments(expenseId) {
    viewSalaryPaymentsCache = await fetchSalaryPaymentsFor(expenseId);
    const tbody = document.getElementById('view-sal-pay-tbody');
    if (!tbody) return;

    if (!viewSalaryPaymentsCache.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-muted" style="text-align:center; padding:12px;">No payments recorded.</td></tr>`;
    } else {
        tbody.innerHTML = viewSalaryPaymentsCache.map(p => `
            <tr data-pay-id="${p.id}">
                <td>${p.date ? window.formatDateOnly(p.date) : '-'}</td>
                <td>${p.pay_method?.name || '-'}</td>
                <td>${p.pay_ref || '-'}</td>
                <td>${p.note || '-'}</td>
                <td class="text-right" style="font-weight:600; color: var(--success);">${Number(p.rm_pay || 0).toFixed(2)}</td>
                <td class="text-right"><button type="button" class="icon-action delete view-sal-pay-remove-btn"><i class="fa-solid fa-trash"></i></button></td>
            </tr>`).join('');
    }

    tbody.querySelectorAll('.view-sal-pay-remove-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const payId = btn.closest('tr').getAttribute('data-pay-id');
            if (!confirm('Delete this payment? This cannot be undone.')) return;
            const { error } = await window.supabaseClient.from('expenses_payment').delete().eq('id', payId);
            if (error) { alert('Failed to delete payment.'); return; }
            await renderViewSalaryPayments(expenseId);
        });
    });

    const total = document.getElementById('view-salary-amount').value;
    updateViewSalPaySummary(parseFloat(total) || 0);
}

function wireViewSalPayForm() {
    const addBtn = document.getElementById('view-sal-pay-add-btn');
    if (!addBtn) return;

    addBtn.addEventListener('click', async () => {
        const modal = document.getElementById('view-salary-modal');
        const salId = modal.dataset.salId;
        const methodId = document.getElementById('view-sal-pay-method').value;
        const dateVal = document.getElementById('view-sal-pay-date').value;
        const amount = parseFloat(document.getElementById('view-sal-pay-amount').value);
        const ref = document.getElementById('view-sal-pay-ref').value.trim();
        const note = document.getElementById('view-sal-pay-note').value.trim();

        if (isNaN(amount) || amount <= 0) { alert('Please enter a valid payment amount.'); return; }

        const totalAmount = parseFloat(document.getElementById('view-salary-amount').value) || 0;
        const alreadyPaid = viewSalaryPaymentsCache.reduce((s, p) => s + (Number(p.rm_pay) || 0), 0);
        const balance = totalAmount - alreadyPaid;

        if (amount > balance + 0.001) {
            alert(`Amount cannot exceed the outstanding balance of RM ${Math.max(0, balance).toFixed(2)}.`);
            return;
        }

        addBtn.disabled = true;
        const tellerScId = await resolveSalaryTellerScId();

        const { error } = await window.supabaseClient.from('expenses_payment').insert({
            expenses: salId,
            pay_method: methodId || null,
            date: dateVal || salToDateInputValue(new Date()),
            rm_pay: amount,
            pay_ref: ref || null,
            note: note || null,
            teller: tellerScId
        });

        addBtn.disabled = false;
        if (error) { alert('Failed to record payment.'); return; }

        document.getElementById('view-sal-pay-amount').value = '';
        document.getElementById('view-sal-pay-ref').value = '';
        document.getElementById('view-sal-pay-note').value = '';

        await renderViewSalaryPayments(salId);
    });
}

function setupViewSalaryModal() {
    const modal = document.getElementById('view-salary-modal');
    const closeBtn = document.getElementById('close-view-salary-btn');
    const cancelBtn = document.getElementById('cancel-view-salary-btn');
    const saveBtn = document.getElementById('save-view-salary-btn');
    const deleteBtn = document.getElementById('delete-view-salary-btn');
    const printBtn = document.getElementById('view-salary-print-btn');

    const close = () => modal && modal.classList.remove('active');

    if (closeBtn) closeBtn.addEventListener('click', close);
    if (cancelBtn) cancelBtn.addEventListener('click', close);
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

    wireViewSalItemForm();
    wireViewSalPayForm();

    if (printBtn) {
        printBtn.addEventListener('click', async () => {
            const salId = modal.dataset.salId;
            const row = salaryRowsCache.find(r => String(r.id) === String(salId));
            if (!row) return;

            printBtn.disabled = true;
            const originalHtml = printBtn.innerHTML;
            printBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

            const [lines, payments] = await Promise.all([
                fetchSalaryItemsFor(salId),
                fetchSalaryPaymentsFor(salId)
            ]);

            printBtn.disabled = false;
            printBtn.innerHTML = originalHtml;

            const html = buildSalaryA4Html(row, lines, payments, salaryCompanyCache, salaryStoreDetailsCache);
            openSalaryPrintWindow(html, 'Salary ' + (row.exp_no || ''));
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const salId = modal.dataset.salId;

            const dateVal = document.getElementById('view-salary-date').value; // "YYYY-MM"
            const staffId = document.getElementById('view-salary-staff').value;
            if (!dateVal || !staffId) { alert('Month and Staff are required.'); return; }

            saveBtn.disabled = true;
            const originalHtml = saveBtn.innerHTML;
            saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

            // Amount is always derived from the live salary item lines — recompute
            // rather than trust the (readonly) field, in case it drifted.
            const amount = await syncViewSalaryAmountToDb(salId);

            const payload = {
                date: `${dateVal}-01`,
                supplier: staffId,
                category: SALARY_CATEGORY_ID,
                amount,
                status: parseInt(document.getElementById('view-salary-status').value, 10) || SAL_STATUS_WAITING,
                note: document.getElementById('view-salary-note').value.trim(),
            };

            const { error } = await window.supabaseClient.from('expenses').update(payload).eq('id', salId);

            if (error) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = originalHtml;
                alert('Failed to save changes.');
                return;
            }

            const newFilesInput = document.getElementById('view-salary-new-attachments');
            const { failures } = await uploadSalaryAttachments(salId, newFilesInput.files);
            newFilesInput.value = '';

            saveBtn.disabled = false;
            saveBtn.innerHTML = originalHtml;

            if (failures.length) {
                alert(`Changes saved, but ${failures.length} attachment(s) failed to upload:\n` +
                    failures.map(f => `- ${f.name}: ${f.error}`).join('\n'));
            }

            close();
            await fetchAndRenderSalary();
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            close();
            document.getElementById('salary-delete-confirm-modal').dataset.salId = modal.dataset.salId;
            document.getElementById('salary-delete-confirm-modal').classList.add('active');
        });
    }
}

function setupSalaryDeleteModal() {
    const confirmBtn = document.getElementById('confirm-delete-salary-btn');
    if (!confirmBtn) return;
    confirmBtn.addEventListener('click', async () => {
        const confirmModal = document.getElementById('salary-delete-confirm-modal');
        const salId = confirmModal.dataset.salId;

        confirmBtn.disabled = true;
        const originalHtml = confirmBtn.innerHTML;
        confirmBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Deleting...';

        // expenses_salary / expenses_payment rows aren't FK-cascaded in this schema,
        // so clear them out explicitly before removing the parent expense.
        await window.supabaseClient.from('expenses_salary').delete().eq('expenses', salId);
        await window.supabaseClient.from('expenses_payment').delete().eq('expenses', salId);
        const { error } = await window.supabaseClient.from('expenses').delete().eq('id', salId);

        confirmBtn.disabled = false;
        confirmBtn.innerHTML = originalHtml;
        confirmModal.classList.remove('active');

        if (error) { alert('Failed to delete salary record.'); return; }

        await fetchAndRenderSalary();
    });
}

// --- Manage Salary Items modal ---
function setupManageSalItemsModal() {
    const modal = document.getElementById('manage-sal-items-modal');
    const openBtn = document.getElementById('open-manage-sal-items-btn');
    const closeBtn = document.getElementById('close-manage-sal-items-btn');
    const footerCloseBtn = document.getElementById('close-manage-sal-items-footer-btn');
    const addBtn = document.getElementById('add-sal-item-cat-btn');
    const newNameInput = document.getElementById('new-sal-item-name');
    const newTypeSel = document.getElementById('new-sal-item-type');
    const newAmtGroup = document.getElementById('new-sal-item-amt-group');

    const toggleAmtGroup = () => {
        const isPct = newTypeSel.value === '1';
        newAmtGroup.style.display = isPct ? 'flex' : 'none';
        if (!isPct) document.getElementById('new-sal-item-amt').value = '';
    };

    const close = () => modal && modal.classList.remove('active');
    const open = async () => {
        if (!modal) return;
        newNameInput.value = '';
        document.getElementById('new-sal-item-iso').value = '';
        document.getElementById('new-sal-item-amt').value = '';
        document.getElementById('new-sal-item-ope').value = '1';
        newTypeSel.value = '0';
        toggleAmtGroup();
        if (typeof jQuery !== 'undefined') $('#new-sal-item-ope, #new-sal-item-type').trigger('change');
        await renderSalItemManageList();
        modal.classList.add('active');
        if (typeof window.initializeSelect2 === 'function') window.initializeSelect2();
    };

    if (openBtn) openBtn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (footerCloseBtn) footerCloseBtn.addEventListener('click', close);
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

    if (typeof jQuery !== 'undefined') {
        $(newTypeSel).on('change', toggleAmtGroup);
    } else {
        newTypeSel.addEventListener('change', toggleAmtGroup);
    }

    if (addBtn) {
        addBtn.addEventListener('click', async () => {
            const name = newNameInput.value.trim();
            const iso = document.getElementById('new-sal-item-iso').value.trim();
            const ope = parseInt(document.getElementById('new-sal-item-ope').value, 10);
            const type = parseInt(newTypeSel.value, 10);
            const amtRaw = document.getElementById('new-sal-item-amt').value.trim();
            if (!name) return;

            // RM-type items never carry a default amount — only % items do.
            const amt = type === 1 ? (amtRaw ? parseFloat(amtRaw) : null) : null;

            addBtn.disabled = true;
            const { error } = await window.supabaseClient.from('salary_item').insert({
                name, iso: iso || null, ope, type, amt
            });
            addBtn.disabled = false;

            if (error) { alert('Failed to add salary item.'); return; }

            newNameInput.value = '';
            document.getElementById('new-sal-item-iso').value = '';
            document.getElementById('new-sal-item-amt').value = '';
            await refreshSalItemData();
            await renderSalItemManageList();
        });
    }
}

async function refreshSalItemData() {
    const { data } = await window.supabaseClient.from('salary_item').select('id, name, iso, ope, type, amt, is_deletable').order('name');
    salaryItemsCache = data || [];
    if (typeof window.initializeSelect2 === 'function') window.initializeSelect2();
}

async function renderSalItemManageList() {
    const list = document.getElementById('sal-item-manage-list');
    if (!list) return;

    if (!salaryItemsCache.length) {
        list.innerHTML = `<li class="text-muted text-sm" style="text-align:center; padding: 16px 0;">No salary items yet.</li>`;
        return;
    }

    list.innerHTML = salaryItemsCache.map(c => {
        const isDeletable = c.is_deletable !== 0;
        const amtLabel = c.amt != null ? (c.type === 1 ? `${c.amt}%` : `RM ${Number(c.amt).toFixed(2)}`) : null;
        return `
        <li data-item-id="${c.id}" style="display: flex; align-items: center; gap: 8px; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-main);">
            <div class="sal-item-display-wrap" style="flex: 1; display: flex; flex-direction: column;">
                <span class="sal-item-display-name" style="font-weight: 500;">${c.name}${c.ope === 0 ? ' <span style="color: var(--danger);">(-)</span>' : ' <span style="color: var(--success);">(+)</span>'}${!isDeletable ? ' <span class="text-muted text-sm">(system)</span>' : ''}</span>
                <span class="sal-item-display-iso text-muted text-sm">${c.iso || '-'}${amtLabel ? ` · Default ${amtLabel}` : ''}</span>
            </div>
            <input type="text" class="form-input sal-item-edit-name" value="${c.name}" placeholder="Name" style="flex: 1; display: none; height: 34px; padding: 0 10px;">
            <input type="text" class="form-input sal-item-edit-iso" value="${c.iso || ''}" placeholder="ISO" style="width: 70px; display: none; height: 34px; padding: 0 10px;">
            <select class="form-input sal-item-edit-ope" style="width: 90px; display: none; height: 34px; padding: 0 6px;">
                <option value="1" ${c.ope !== 0 ? 'selected' : ''}>Add (+)</option>
                <option value="0" ${c.ope === 0 ? 'selected' : ''}>Deduct (-)</option>
            </select>
            <select class="form-input sal-item-edit-type" style="width: 70px; display: none; height: 34px; padding: 0 6px;">
                <option value="0" ${c.type !== 1 ? 'selected' : ''}>RM</option>
                <option value="1" ${c.type === 1 ? 'selected' : ''}>%</option>
            </select>
            <input type="text" class="form-input sal-item-edit-amt" value="${c.amt != null ? c.amt : ''}" placeholder="Amt" style="width: 70px; display: none; height: 34px; padding: 0 10px;">
            <button class="icon-action sal-item-edit-btn" title="Edit"><i class="fa-solid fa-pen"></i></button>
            <button class="icon-action sal-item-save-btn" title="Save" style="display:none;"><i class="fa-solid fa-check"></i></button>
            <button class="icon-action delete sal-item-delete-btn" title="${isDeletable ? 'Delete' : 'This item cannot be deleted'}" ${isDeletable ? '' : 'disabled style="opacity:0.4; cursor:not-allowed;"'}><i class="fa-solid fa-trash"></i></button>
        </li>`;
    }).join('');

    list.querySelectorAll('li').forEach(li => {
        const itemId = li.getAttribute('data-item-id');
        const item = salaryItemsCache.find(i => String(i.id) === String(itemId));
        const displayWrap = li.querySelector('.sal-item-display-wrap');
        const editName = li.querySelector('.sal-item-edit-name');
        const editType = li.querySelector('.sal-item-edit-type');
        const editIso = li.querySelector('.sal-item-edit-iso');
        const editOpe = li.querySelector('.sal-item-edit-ope');
        const editAmt = li.querySelector('.sal-item-edit-amt');
        const editBtn = li.querySelector('.sal-item-edit-btn');
        const saveBtn = li.querySelector('.sal-item-save-btn');
        const deleteBtn = li.querySelector('.sal-item-delete-btn');

        editBtn.addEventListener('click', () => {
            displayWrap.style.display = 'none';
            editName.style.display = 'block';
            editIso.style.display = 'block';
            editOpe.style.display = 'block';
            editType.style.display = 'block';
            editAmt.style.display = editType.value === '1' ? 'block' : 'none';
            editBtn.style.display = 'none';
            saveBtn.style.display = 'inline-flex';
            editName.focus();
        });

        editType.addEventListener('change', () => {
            editAmt.style.display = editType.value === '1' ? 'block' : 'none';
            if (editType.value !== '1') editAmt.value = '';
        });

        saveBtn.addEventListener('click', async () => {
            const newName = editName.value.trim();
            const newIso = editIso.value.trim();
            const newOpe = parseInt(editOpe.value, 10);
            const newType = parseInt(editType.value, 10);
            const newAmt = newType === 1 ? editAmt.value.trim() : '';
            if (!newName) return;

            saveBtn.disabled = true;
            const { error } = await window.supabaseClient
                .from('salary_item')
                .update({ name: newName, iso: newIso || null, ope: newOpe, type: newType, amt: newAmt ? parseFloat(newAmt) : null })
                .eq('id', itemId);
            saveBtn.disabled = false;

            if (error) { alert('Failed to update salary item.'); return; }
            await refreshSalItemData();
            await renderSalItemManageList();
        });

        if (deleteBtn && !deleteBtn.disabled) {
            deleteBtn.addEventListener('click', () => requestDeleteSalItem(itemId, item));
        }
    });
}

let pendingDeleteSalItemId = null;

async function requestDeleteSalItem(itemId, item) {
    if (item && item.is_deletable === 0) {
        document.getElementById('sal-item-delete-blocked-text').textContent =
            `This salary item is marked as non-deletable and cannot be removed.`;
        document.getElementById('sal-item-delete-blocked-modal').classList.add('active');
        return;
    }

    pendingDeleteSalItemId = itemId;

    const { count } = await window.supabaseClient
        .from('expenses_salary')
        .select('id', { count: 'exact', head: true })
        .eq('salary_item', itemId);

    if (count > 0) {
        document.getElementById('sal-item-delete-blocked-text').textContent =
            `This salary item cannot be deleted because ${count} record(s) still use it.`;
        document.getElementById('sal-item-delete-blocked-modal').classList.add('active');
        return;
    }

    document.getElementById('sal-item-delete-confirm-modal').classList.add('active');
}

function setupSalItemDeleteModal() {
    const confirmBtn = document.getElementById('confirm-delete-sal-item-btn');
    if (!confirmBtn) return;
    confirmBtn.addEventListener('click', async () => {
        const modal = document.getElementById('sal-item-delete-confirm-modal');
        confirmBtn.disabled = true;
        const originalHtml = confirmBtn.innerHTML;
        confirmBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Deleting...';

        const { error } = await window.supabaseClient.from('salary_item').delete().eq('id', pendingDeleteSalItemId);

        confirmBtn.disabled = false;
        confirmBtn.innerHTML = originalHtml;
        modal.classList.remove('active');

        if (error) { alert('Failed to delete salary item.'); return; }

        await refreshSalItemData();
        await renderSalItemManageList();
    });
}

// --- PDF Export ---
function setupSalaryPdfExport() {
    const btn = document.getElementById('salary-pdf-export-btn');
    if (!btn) return;
    btn.addEventListener('click', generateSalaryPdf);
}

function buildActiveSalaryFilterRows() {
    const staff = salaryStaffCache.find(s => String(s.id) === String(salaryActiveFilters.staff));
    return [
        ['Date From', salaryActiveFilters.dateFrom || 'All'],
        ['Date To', salaryActiveFilters.dateTo || 'All'],
        ['Staff', salaryActiveFilters.staff ? (staff ? staff.contact.name : salaryActiveFilters.staff) : 'All'],
        ['Status', salaryActiveFilters.status ? SALARY_STATUS_LABELS[salaryActiveFilters.status] : 'All']
    ];
}

async function generateSalaryPdf() {
    const btn = document.getElementById('salary-pdf-export-btn');
    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert('PDF library not loaded. Please add jsPDF + jspdf-autotable to index.html.');
        return;
    }

    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    try {
        const { data: allRows, error } = await buildSalaryQuery({ forCount: false });
        if (error) { alert('Failed to load salary records for export.'); return; }

        const rows = (allRows || []).filter(r => r.supplier);
        if (!rows.length) { alert('No salary records match the current filters.'); return; }

        const { data: store } = await window.supabaseClient.from('store').select('name, address, tel, email').eq('id', salaryActiveStoreId).maybeSingle();

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

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(20);
        doc.text('Salary List', marginLeft, y);
        y += 12;

        const filterRows = buildActiveSalaryFilterRows();
        doc.autoTable({
            body: filterRows,
            startY: y + 8,
            margin: { left: marginLeft, right: marginLeft },
            theme: 'grid',
            styles: { fontSize: 8.5, cellPadding: 5, lineColor: [203, 213, 225], lineWidth: 0.75 },
            columnStyles: { 0: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 100 }, 1: { textColor: 60 } },
            tableWidth: 320
        });

        const filterTableEndY = doc.lastAutoTable.finalY;

        const tableRows = rows.map(r => {
            const paid = (r.expenses_payment || []).reduce((s, p) => s + (Number(p.rm_pay) || 0), 0);
            const amount = Number(r.amount || 0);
            const balance = amount - paid;
            return [
                r.exp_no || '-',
                formatSalaryMonthYear(r.date),
                r.supplier?.contact?.name || '-',
                SALARY_STATUS_LABELS[r.status] || '-',
                amount.toFixed(2),
                paid.toFixed(2),
                balance.toFixed(2)
            ];
        });

        doc.autoTable({
            head: [['Ref #', 'Date', 'Staff', 'Status', 'Amount (RM)', 'Payment (RM)', 'Balance (RM)']],
            body: tableRows,
            startY: filterTableEndY + 16,
            margin: { left: marginLeft, right: marginLeft },
            theme: 'grid',
            styles: { fontSize: 8.5, cellPadding: 6, lineColor: [203, 213, 225], lineWidth: 0.75 },
            headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold', lineColor: [99, 102, 241], lineWidth: 0.75 },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            columnStyles: { 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' } },
            didParseCell: (data) => { if ([4, 5, 6].includes(data.column.index)) data.cell.styles.halign = 'right'; }
        });

        const dateStamp = new Date().toISOString().slice(0, 10);
        doc.save(`Salary_${dateStamp}.pdf`);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
    }
}

function openSalaryPrintWindow(html, title) {
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

function salEscape(str) {
    return (str || '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function salFormatDMY(dateStr) {
    const d = dateStr ? new Date(dateStr) : new Date();
    if (isNaN(d.getTime())) return '-';
    const pad = n => String(n).padStart(2, '0');
    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
}

function buildSalaryA4Html(row, lines, payments, company, store) {
    const amount = Number(row.amount || 0);
    const paid = payments.reduce((s, p) => s + (Number(p.rm_pay) || 0), 0);
    const balance = amount - paid;

    const sortedLines = sortSalaryLines(lines);
    const lineRows = sortedLines.map(l => {
        const item = salaryItemsCache.find(i => String(i.id) === String(l.salary_item));
        const ope = item ? item.ope : 1;
        const suffix = item && item.type === 1 ? ` (${item.amt}%)` : '';
        return `
            <tr>
                <td>${salEscape(item?.name || '(deleted item)')}${suffix}</td>
                <td class="text-right">${ope === 0 ? '-' : '+'}${Number(l.rm || 0).toFixed(2)}</td>
            </tr>
        `;
    }).join('');

    const paymentRows = payments.map(p => `
        <tr>
            <td>${salFormatDMY(p.date)}</td>
            <td>${salEscape((p.pay_method?.name || '-').toUpperCase())}</td>
            <td>${salEscape(p.pay_ref || '-')}</td>
            <td>${salEscape(p.note || '-')}</td>
            <td class="text-right">${Number(p.rm_pay || 0).toFixed(2)}</td>
        </tr>
    `).join('');

    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Salary</title>
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
            <h1>${salEscape(company?.name || 'COMPANY NAME')}</h1>
            ${company?.ssm ? `<p>[ ${salEscape(company.ssm)} ]</p>` : ''}
            <p>${salEscape(company?.address || '').replace(/\n/g, '<br>')}</p>
            <p>${[company?.tel, company?.email].filter(Boolean).map(salEscape).join(' | ')}</p>
        </div>
        <div class="type-label">SALARY</div>
    </div>

    <div class="info-grid">
        <div class="box">
            <div class="box-title">Staff</div>
            <p><strong>${salEscape(row.supplier?.contact?.name || '-')}</strong></p>
        </div>
        <div class="box">
            <div class="box-title">Store</div>
            <p><strong>${salEscape((store?.name || '').toUpperCase())}</strong></p>
            <p>${salEscape(store?.address || '').replace(/\n/g, '<br>')}</p>
        </div>
    </div>

    <table class="trans-details">
        <thead>
            <tr><th>Ref #</th><th>Month</th><th>Status</th></tr>
        </thead>
        <tbody>
            <tr>
                <td>${salEscape(row.exp_no || '')}</td>
                <td>${salEscape(formatSalaryMonthYear(row.date))}</td>
                <td>${salEscape((SALARY_STATUS_LABELS[row.status] || '').toUpperCase())}</td>
            </tr>
        </tbody>
    </table>

    ${row.note ? `<p><strong>Note:</strong> ${salEscape(row.note)}</p>` : ''}

    <table class="items">
        <thead>
            <tr><th>Salary Item</th><th class="text-right">Amount [RM]</th></tr>
        </thead>
        <tbody>${lineRows || '<tr><td colspan="2">No salary items recorded.</td></tr>'}</tbody>
    </table>

    <div class="totals-box">
        <div class="row grand"><span>Amount To Pay [RM]</span><span>${amount.toFixed(2)}</span></div>
    </div>

    <div class="signoff">
        <div class="print-date">Print Date : ${salFormatDMY(new Date())}</div>
        <div class="signature-line"></div>
        <div class="signature-label">${salEscape(row.supplier?.contact?.name || '-')}</div>
        <div>I received the salary amount above</div>
    </div>

    <div class="payment-section">
        <h3>Payment Information</h3>
        <table class="payments">
            <thead><tr><th>Date</th><th>Method</th><th>Pay Ref</th><th>Note</th><th class="text-right">RM</th></tr></thead>
            <tbody>${paymentRows || '<tr><td colspan="5">No payments recorded.</td></tr>'}</tbody>
            <tfoot>
                <tr><td colspan="4" class="text-right">Total Payment [RM]</td><td class="text-right">${paid.toFixed(2)}</td></tr>
                <tr><td colspan="4" class="text-right">Balance [RM]</td><td class="text-right">${Math.max(0, balance).toFixed(2)}</td></tr>
            </tfoot>
        </table>
    </div>
</body></html>`;
}