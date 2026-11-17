import { expect, test } from '@playwright/test';
import { Api } from '../support/api';
import { ADMIN_PASSWORD, API_URL } from '../support/env';

// End-to-end API flow for S26.7:
// Credit SalesInvoice (with DueDate) -> AR Aging + Statement + General Journal -> ReceiptVoucher FIFO -> Reports reflect reduced debt & balanced ledger.

test('S26.7 accounting flow: credit invoice -> AR aging & statement -> FIFO receipt -> reduced debt & balanced journal', async () => {
  const admin = await Api.login('admin', ADMIN_PASSWORD);
  const warehouses = await admin.get<any[]>('/stock/warehouses');
  const warehouse = warehouses[0];
  const branchId = warehouse.branchId;
  const uoms = (await admin.get<any>('/wms/units-of-measure?pageSize=20')).items;
  const uom = uoms[0];
  const accounts = await admin.get<any[]>('/accounting/accounts?isPostable=true');
  const acc1111 = accounts.find(a => a.code === '1111') ?? accounts[0];

  const suffix = Date.now().toString().slice(-6);
  const cashFund = await admin.post<any>('/accounting/treasury/cash-funds', {
    code: `CF-E2E-${suffix}`,
    name: `Cash Fund E2E ${suffix}`,
    branchId,
    accountId: acc1111.id,
    openingBalance: 500_000,
    isActive: true
  });

  const partner = await admin.post<any>('/partners', {
    code: `KH-E2E-${suffix}`,
    name: `Customer E2E ${suffix}`,
    partnerType: 1,
    isUnlimitedCredit: true
  });

  const item = await admin.post<any>('/items', {
    code: `SVC-E2E-${suffix}`,
    name: `Service E2E ${suffix}`,
    itemType: 2,
    baseUomId: uom.id,
    salePrice: 1_000_000,
    costPrice: 0,
    vatRate: 0,
    minStockAlert: 0,
    maxStockAlert: 0
  });

  const due45DaysAgo = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString();
  const invoice = await admin.post<any>('/sales/pos-checkout', {
    requestId: crypto.randomUUID(),
    branchId,
    customerId: partner.id,
    customerName: partner.name,
    warehouseId: warehouse.id,
    paymentMethod: 3, // Debt
    dueDate: due45DaysAgo,
    items: [{ itemId: item.id, quantity: 1, unitPrice: 1_000_000, discountPercent: 0 }]
  });
  expect(invoice.remainingDebt).toBe(1_000_000);

  // 1. AR Aging before payment (45 days overdue -> 31-60 bucket)
  const agingBefore = await admin.get<any>(`/accounting/reports/ar-aging?customerId=${partner.id}`);
  expect(agingBefore.total31To60).toBe(1_000_000);
  expect(agingBefore.grandTotal).toBe(1_000_000);

  // 2. AR Aging Excel export returns valid .xlsx binary
  const exportRes = await fetch(`${API_URL}/api/v1/accounting/reports/ar-aging/export?customerId=${partner.id}`, {
    headers: { Authorization: `Bearer ${(admin as any).token}` }
  });
  expect(exportRes.status).toBe(200);
  expect(exportRes.headers.get('content-type')).toContain('spreadsheetml.sheet');
  expect((await exportRes.arrayBuffer()).byteLength).toBeGreaterThan(0);

  // 3. Statement of Account before payment
  const stmtBefore = await admin.get<any>(`/accounting/reports/statement-of-account/${partner.id}`);
  expect(stmtBefore.closingBalance).toBe(1_000_000);

  // 4. Post ReceiptVoucher with AutoAllocateFifo = true for 400,000
  await admin.post<any>('/accounting/receipt-vouchers', {
    branchId,
    paymentMethod: 1, // Cash
    cashFundId: cashFund.id,
    partnerId: partner.id,
    payerName: partner.name,
    amount: 400_000,
    receiptType: 1, // CustomerPayment
    autoAllocateFifo: true
  });

  // 5. AR Aging & Statement reflect reduced debt (600,000)
  const agingAfter = await admin.get<any>(`/accounting/reports/ar-aging?customerId=${partner.id}`);
  expect(agingAfter.grandTotal).toBe(600_000);

  const stmtAfter = await admin.get<any>(`/accounting/reports/statement-of-account/${partner.id}`);
  expect(stmtAfter.closingBalance).toBe(600_000);

  // 6. General Journal is balanced & Treasury Ledger reflects cash in
  const journal = await admin.get<any>(`/accounting/reports/general-journal?branchId=${branchId}`);
  expect(journal.isBalanced).toBe(true);
  expect(journal.totalDebit).toBe(journal.totalCredit);

  const treasuryLedger = await admin.get<any>(`/accounting/reports/treasury-ledger?method=1&fundOrBankId=${cashFund.id}`);
  expect(treasuryLedger.totalIn).toBe(400_000);
  expect(treasuryLedger.closingBalance).toBe(900_000);
});
