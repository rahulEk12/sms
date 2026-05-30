import { getInvoices, payInvoice } from './db.js';
import { openModal, closeModal } from './app.js';

let allInvoices = [];
let currentSearch = '';
let currentStatusFilter = '';

export async function initFees(container) {
    allInvoices = await getInvoices();
    currentSearch = '';
    currentStatusFilter = '';

    renderLayout(container);
    renderBillingCards();
    renderTable();
    setupListeners();
}

function renderLayout(container) {
    container.innerHTML = `
        <!-- Billing Overview Cards -->
        <div class="stats-grid" id="billing-overview-cards" style="margin-bottom: 24px;">
            <!-- Rendered dynamically -->
        </div>

        <div class="glass-card">
            <!-- Controls Row -->
            <div class="controls-row">
                <div class="search-wrapper">
                    <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input type="text" class="search-input" id="invoice-search" placeholder="Search by student name or Invoice ID...">
                </div>
                
                <div class="filters-wrapper">
                    <select class="select-input" id="invoice-status-filter">
                        <option value="">All Payments</option>
                        <option value="Paid">Fully Paid</option>
                        <option value="Partially Paid">Partially Paid</option>
                        <option value="Unpaid">Unpaid</option>
                    </select>
                </div>
            </div>

            <!-- Invoices Table -->
            <div class="table-responsive">
                <table class="custom-table">
                    <thead>
                        <tr>
                            <th>Invoice ID</th>
                            <th>Student</th>
                            <th>Class</th>
                            <th>Date Issued</th>
                            <th>Amount</th>
                            <th>Paid Amount</th>
                            <th>Outstanding</th>
                            <th>Status</th>
                            <th style="text-align: right;">Action</th>
                        </tr>
                    </thead>
                    <tbody id="invoices-table-body">
                        <!-- Loaded dynamically -->
                    </tbody>
                </table>
            </div>

            <div id="no-invoices-message" style="display: none; text-align: center; padding: 40px; color: var(--text-muted);">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 12px; opacity: 0.5;">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
                <p>No billing invoices found matching the criteria.</p>
            </div>
        </div>
    `;
}

const formatINR = (num) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(num);
};

function renderBillingCards() {
    let totalBilled = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;

    allInvoices.forEach(inv => {
        totalBilled += inv.amount;
        if (inv.status === 'Paid') {
            totalCollected += inv.amount;
        } else if (inv.status === 'Partially Paid') {
            totalCollected += inv.paidAmount;
            totalOutstanding += (inv.amount - inv.paidAmount);
        } else {
            totalOutstanding += inv.amount;
        }
    });

    const cardsContainer = document.getElementById('billing-overview-cards');
    cardsContainer.innerHTML = `
        <div class="glass-card stat-card" style="border-left: 4px solid var(--primary);">
            <div class="stat-info">
                <span class="stat-label">Total Invoiced Value</span>
                <span class="stat-value" style="font-size: 1.6rem; font-weight: 800; color: var(--text-primary);">${formatINR(totalBilled)}</span>
            </div>
        </div>
        <div class="glass-card stat-card" style="border-left: 4px solid var(--success);">
            <div class="stat-info">
                <span class="stat-label">Fees Collected</span>
                <span class="stat-value" style="font-size: 1.6rem; font-weight: 800; color: var(--success);">${formatINR(totalCollected)}</span>
            </div>
        </div>
        <div class="glass-card stat-card" style="border-left: 4px solid var(--danger);">
            <div class="stat-info">
                <span class="stat-label">Outstanding Amount</span>
                <span class="stat-value" style="font-size: 1.6rem; font-weight: 800; color: var(--danger);">${formatINR(totalOutstanding)}</span>
            </div>
        </div>
    `;
}

function renderTable() {
    const tableBody = document.getElementById('invoices-table-body');
    const emptyMsg = document.getElementById('no-invoices-message');

    const filtered = allInvoices.filter(inv => {
        const matchesSearch = inv.studentName.toLowerCase().includes(currentSearch) || 
                              inv.id.toLowerCase().includes(currentSearch);
        
        const matchesStatus = currentStatusFilter === '' || inv.status === currentStatusFilter;

        return matchesSearch && matchesStatus;
    });

    if (filtered.length === 0) {
        tableBody.innerHTML = '';
        emptyMsg.style.display = 'block';
        return;
    }

    emptyMsg.style.display = 'none';
    tableBody.innerHTML = filtered.map(inv => {
        const paid = inv.status === 'Paid' ? inv.amount : (inv.status === 'Unpaid' ? 0 : inv.paidAmount);
        const outstanding = inv.amount - paid;
        
        let statusBadge = 'badge-success';
        if (inv.status === 'Unpaid') statusBadge = 'badge-danger';
        else if (inv.status === 'Partially Paid') statusBadge = 'badge-warning';

        const needsPayment = inv.status !== 'Paid';

        return `
            <tr>
                <td>
                    <span style="font-family: monospace; font-weight: 700; color: var(--text-primary);">${inv.id}</span>
                </td>
                <td>
                    <span style="font-weight: 600; color: var(--text-primary);">${inv.studentName}</span>
                </td>
                <td>
                    <span>${inv.class}</span>
                </td>
                <td>
                    <span style="font-size: 0.85rem;">${inv.date}</span>
                </td>
                <td>
                    <span style="font-weight: 700;">${formatINR(inv.amount)}</span>
                </td>
                <td>
                    <span style="color: var(--success); font-weight: 600;">${formatINR(paid)}</span>
                </td>
                <td>
                    <span style="color: ${outstanding > 0 ? 'var(--danger)' : 'var(--text-muted)'}; font-weight: 600;">${formatINR(outstanding)}</span>
                </td>
                <td>
                    <span class="badge ${statusBadge}">${inv.status}</span>
                </td>
                <td style="text-align: right;">
                    ${needsPayment ? `
                        <button class="btn btn-secondary btn-sm pay-invoice-btn" data-id="${inv.id}" title="Receive Payment">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="2" y="4" width="20" height="16" rx="2" ry="2"/>
                                <line x1="12" y1="18" x2="12" y2="18.01"/>
                            </svg>
                            Pay
                        </button>
                    ` : `
                        <button class="btn btn-secondary btn-sm" disabled style="opacity: 0.5; cursor: not-allowed;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            Settled
                        </button>
                    `}
                </td>
            </tr>
        `;
    }).join('');
}

function setupListeners() {
    const searchInput = document.getElementById('invoice-search');
    const statusFilter = document.getElementById('invoice-status-filter');
    const tableBody = document.getElementById('invoices-table-body');

    searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value.toLowerCase().trim();
        renderTable();
    });

    statusFilter.addEventListener('change', (e) => {
        currentStatusFilter = e.target.value;
        renderTable();
    });

    tableBody.addEventListener('click', (e) => {
        const payBtn = e.target.closest('.pay-invoice-btn');
        if (payBtn) {
            const invoiceId = payBtn.getAttribute('data-id');
            const invoice = allInvoices.find(inv => inv.id === invoiceId);
            if (invoice) openPayModal(invoice);
        }
    });
}

function openPayModal(invoice) {
    const paid = invoice.status === 'Paid' ? invoice.amount : (invoice.status === 'Unpaid' ? 0 : invoice.paidAmount);
    const outstanding = invoice.amount - paid;

    const contentHtml = `
        <form id="pay-form">
            <input type="hidden" name="invoiceId" value="${invoice.id}">
            
            <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); padding: 16px; border-radius: var(--radius-md); margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: var(--text-muted); font-size: 0.85rem;">Student Name</span>
                    <span style="font-weight: 600;">${invoice.studentName} (Class ${invoice.class})</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: var(--text-muted); font-size: 0.85rem;">Total Invoice Amount</span>
                    <span style="font-weight: 700;">${formatINR(invoice.amount)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: var(--text-muted); font-size: 0.85rem;">Already Paid</span>
                    <span style="color: var(--success); font-weight: 600;">${formatINR(paid)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border-color); padding-top: 8px; margin-top: 8px;">
                    <span style="color: var(--text-primary); font-weight: 600;">Net Outstanding Balance</span>
                    <span style="color: var(--danger); font-weight: 700;">${formatINR(outstanding)}</span>
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">Payment Received Amount (INR)</label>
                <input type="number" name="amountPaid" class="form-input" min="1" max="${outstanding}" required value="${outstanding}" placeholder="Enter amount to receive...">
                <span style="display: block; font-size: 0.72rem; color: var(--text-muted); margin-top: 6px;">Maximum amount allowed is outstanding balance: ${formatINR(outstanding)}</span>
            </div>

            <div class="form-actions">
                <button type="button" class="btn btn-secondary" id="modal-pay-cancel">Cancel</button>
                <button type="submit" class="btn btn-primary">Process Payment</button>
            </div>
        </form>
    `;

    openModal(`Receive Payment: ${invoice.id}`, contentHtml);

    const form = document.getElementById('pay-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const invId = formData.get('invoiceId');
        const amt = parseFloat(formData.get('amountPaid') || 0);

        await payInvoice(invId, amt);
        closeModal();

        // Refresh views
        allInvoices = await getInvoices();
        renderBillingCards();
        renderTable();
    });

    document.getElementById('modal-pay-cancel').addEventListener('click', closeModal);
}
