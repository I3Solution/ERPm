import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { ItemService, ItemDto } from '../../core/services/item.service';
import { SalesService, CreateSalesInvoiceRequest, SalesInvoiceDto, PaymentMethod } from '../../core/services/sales.service';
import { PartnerService, PartnerDto } from '../../core/services/partner.service';
import { StockService } from '../../core/services/stock.service';

export interface CartLine {
  item: ItemDto;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
}

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <div class="pos-layout">
      <!-- Left Column: Product Selection Catalog -->
      <section class="pos-catalog-section">
        <!-- Search and Fast Filter Bar -->
        <div class="pos-search-bar">
          <div class="search-input-wrap">
            <span class="search-icon">🔍</span>
            <input
              type="text"
              [(ngModel)]="searchKeyword"
              (input)="onSearchInput()"
              [placeholder]="'sales.search_items' | translate"
              class="pos-search-input"
            />
            <button *ngIf="searchKeyword" (click)="searchKeyword = ''; onSearchInput()" class="clear-search-btn">✕</button>
          </div>
        </div>

        <!-- Product Grid -->
        <div class="product-grid">
          <div
            *ngFor="let item of filteredItems()"
            (click)="addToCart(item)"
            class="product-card"
          >
            <div class="product-card-body">
              <span class="product-sku">{{ item.code }}</span>
              <h3 class="product-name">{{ item.name }}</h3>
              <div class="product-card-footer">
                <span class="product-price">{{ item.salePrice | number:'1.0-0' }} đ</span>
                <span class="product-uom">{{ item.baseUomName || 'Cái' }}</span>
              </div>
            </div>
            <button class="add-btn" title="Thêm vào giỏ">+</button>
          </div>

          <div *ngIf="filteredItems().length === 0" class="empty-state">
            <span class="text-3xl">🔍</span>
            <p class="mt-2 text-sm text-slate-500">Không tìm thấy sản phẩm phù hợp.</p>
          </div>
        </div>
      </section>

      <!-- Right Column: Cart & Checkout Panel -->
      <aside class="pos-cart-panel">
        <!-- Customer & Order Header -->
        <div class="cart-header">
          <div class="customer-select-box">
            <label class="text-xs font-semibold text-slate-600 block mb-1">
              👤 {{ 'sales.customer' | translate }}
            </label>
            <select [(ngModel)]="selectedCustomerId" class="pos-select">
              <option [ngValue]="null">Khách lẻ (Walk-in Customer)</option>
              <option *ngFor="let p of partnerService.partners()" [value]="p.id">
                {{ p.name }} ({{ p.phone || p.code }})
              </option>
            </select>
          </div>
          <button (click)="clearCart()" [disabled]="cart().length === 0" class="clear-cart-btn" title="Xóa toàn bộ giỏ">
            🗑️
          </button>
        </div>

        <!-- Cart Items Scrollable List -->
        <div class="cart-items-list">
          <div *ngIf="cart().length === 0" class="empty-cart-state">
            <span class="text-4xl">🛒</span>
            <p class="text-sm font-medium text-slate-500 mt-2">Giỏ hàng đang trống</p>
            <p class="text-xs text-slate-400">Nhấn vào sản phẩm bên trái để thêm</p>
          </div>

          <div *ngFor="let line of cart(); let idx = index" class="cart-line-item">
            <div class="line-info">
              <span class="line-name">{{ line.item.name }}</span>
              <span class="line-price">{{ line.unitPrice | number:'1.0-0' }} đ / {{ line.item.baseUomName || 'Cái' }}</span>
            </div>
            <div class="line-controls">
              <div class="qty-stepper">
                <button type="button" (click)="updateQuantity(idx, -1)" class="step-btn">-</button>
                <input
                  type="number"
                  [ngModel]="line.quantity"
                  (ngModelChange)="setQuantity(idx, $event)"
                  min="1"
                  class="step-input"
                />
                <button type="button" (click)="updateQuantity(idx, 1)" class="step-btn">+</button>
              </div>
              <span class="line-total">{{ (line.quantity * line.unitPrice) | number:'1.0-0' }} đ</span>
              <button (click)="removeLine(idx)" class="remove-line-btn">✕</button>
            </div>
          </div>
        </div>

        <!-- Cart Financial Totals & Checkout Button -->
        <div class="cart-footer">
          <div class="summary-row">
            <span class="text-xs text-slate-500">{{ 'sales.subtotal' | translate }}</span>
            <span class="font-semibold text-slate-800">{{ subTotal() | number:'1.0-0' }} đ</span>
          </div>

          <div class="summary-row discount-row">
            <span class="text-xs text-slate-500">{{ 'sales.discount' | translate }}</span>
            <input
              type="number"
              [(ngModel)]="discountAmount"
              min="0"
              class="discount-input"
              placeholder="0"
            />
          </div>

          <div class="summary-row grand-total-row">
            <span class="text-base font-bold text-slate-900">{{ 'sales.total' | translate }}</span>
            <span class="text-xl font-extrabold text-indigo-600">{{ grandTotal() | number:'1.0-0' }} đ</span>
          </div>

          <button
            type="button"
            (click)="openPaymentModal()"
            [disabled]="cart().length === 0"
            class="checkout-pay-btn"
          >
            <span>💳 {{ 'sales.pay_btn' | translate }}</span>
            <span>{{ grandTotal() | number:'1.0-0' }} đ</span>
          </button>
        </div>
      </aside>
    </div>

    <!-- MODAL 1: Payment Checkout Confirmation -->
    <div *ngIf="showPaymentModal" class="modal-backdrop" (click)="showPaymentModal = false">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2 class="text-lg font-bold text-slate-900">{{ 'sales.checkout_title' | translate }}</h2>
          <button (click)="showPaymentModal = false" class="modal-close-btn">✕</button>
        </div>

        <div class="modal-body space-y-4">
          <!-- Total to Pay Highlight -->
          <div class="pay-amount-box">
            <span class="text-xs text-slate-500 uppercase tracking-wider font-semibold">Cần thanh toán</span>
            <h1 class="text-3xl font-extrabold text-indigo-600 mt-1">{{ grandTotal() | number:'1.0-0' }} đ</h1>
          </div>

          <!-- Payment Method Choice -->
          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">
              {{ 'sales.payment_method' | translate }}
            </label>
            <div class="payment-methods-grid">
              <button
                type="button"
                (click)="paymentMethod = PaymentMethod.Cash; onSelectMethod()"
                [class.active]="paymentMethod === PaymentMethod.Cash"
                class="method-btn"
              >
                💵 {{ 'sales.cash' | translate }}
              </button>
              <button
                type="button"
                (click)="paymentMethod = PaymentMethod.BankTransfer; onSelectMethod()"
                [class.active]="paymentMethod === PaymentMethod.BankTransfer"
                class="method-btn"
              >
                🏦 {{ 'sales.bank_transfer' | translate }}
              </button>
              <button
                type="button"
                (click)="paymentMethod = PaymentMethod.Credit; onSelectMethod()"
                [class.active]="paymentMethod === PaymentMethod.Credit"
                class="method-btn"
              >
                📝 {{ 'sales.credit' | translate }}
              </button>
            </div>
          </div>

          <!-- Cash Received & Change Due -->
          <div *ngIf="paymentMethod === PaymentMethod.Cash" class="space-y-3">
            <div>
              <label class="text-xs font-semibold text-slate-600 block mb-1">
                {{ 'sales.amount_paid' | translate }}
              </label>
              <input
                type="number"
                [(ngModel)]="amountPaid"
                class="pos-input text-lg font-bold text-slate-900"
              />
            </div>

            <!-- Quick Cash Denominations -->
            <div class="quick-cash-row">
              <button type="button" (click)="setQuickCash(grandTotal())" class="quick-cash-btn">Đủ tiền</button>
              <button type="button" (click)="setQuickCash(100000)" class="quick-cash-btn">100k</button>
              <button type="button" (click)="setQuickCash(200000)" class="quick-cash-btn">200k</button>
              <button type="button" (click)="setQuickCash(500000)" class="quick-cash-btn">500k</button>
            </div>

            <div class="change-box">
              <span class="text-xs text-slate-600 font-medium">{{ 'sales.change_due' | translate }}:</span>
              <span class="text-base font-bold" [class.text-emerald-600]="changeDue >= 0" [class.text-rose-600]="changeDue < 0">
                {{ changeDue | number:'1.0-0' }} đ
              </span>
            </div>
          </div>

          <!-- Order Notes -->
          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">Ghi chú đơn hàng</label>
            <input type="text" [(ngModel)]="orderNotes" placeholder="VD: Giao nhanh buổi chiều..." class="pos-input text-sm" />
          </div>
        </div>

        <div class="modal-footer">
          <button (click)="showPaymentModal = false" class="btn-secondary">{{ 'common.cancel' | translate }}</button>
          <button (click)="confirmCheckout()" [disabled]="isSubmitting" class="btn-primary">
            {{ isSubmitting ? 'Đang lưu...' : ('sales.confirm_payment' | translate) }}
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL 2: Receipt & Print Modal -->
    <div *ngIf="completedInvoice" class="modal-backdrop">
      <div class="modal-card receipt-card" (click)="$event.stopPropagation()">
        <!-- Receipt Content Section -->
        <div class="receipt-paper" id="printable-receipt">
          <div class="receipt-header">
            <h2 class="text-xl font-bold tracking-tight text-slate-900">ERPm STORE</h2>
            <p class="text-xs text-slate-500">Số 1 Phố Huế, Hoàn Kiếm, Hà Nội</p>
            <p class="text-xs text-slate-500">Hotline: 0901.234.567</p>
            <div class="receipt-divider"></div>
            <h3 class="text-sm font-bold uppercase tracking-wider text-slate-800">HÓA ĐƠN BÁN HÀNG</h3>
            <p class="text-xs text-slate-500 mt-0.5">Số: {{ completedInvoice.invoiceNumber }}</p>
            <p class="text-xs text-slate-400">{{ completedInvoice.invoiceDate | date:'dd/MM/yyyy HH:mm' }}</p>
            <p class="text-xs text-slate-600 mt-1">Khách: <strong>{{ completedInvoice.customerName }}</strong></p>
          </div>

          <div class="receipt-divider"></div>

          <table class="receipt-table">
            <thead>
              <tr>
                <th class="text-left">Món</th>
                <th class="text-center">SL</th>
                <th class="text-right">Đơn giá</th>
                <th class="text-right">T.Tiền</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of completedInvoice.items">
                <td class="text-left font-medium">{{ item.itemName }}</td>
                <td class="text-center">{{ item.quantity }}</td>
                <td class="text-right">{{ item.unitPrice | number:'1.0-0' }}</td>
                <td class="text-right font-semibold">{{ item.amount | number:'1.0-0' }}</td>
              </tr>
            </tbody>
          </table>

          <div class="receipt-divider"></div>

          <div class="receipt-totals space-y-1 text-xs">
            <div class="flex justify-between">
              <span>Tạm tính:</span>
              <span>{{ completedInvoice.subTotal | number:'1.0-0' }} đ</span>
            </div>
            <div *ngIf="completedInvoice.discountAmount > 0" class="flex justify-between text-amber-600">
              <span>Chiết khấu:</span>
              <span>-{{ completedInvoice.discountAmount | number:'1.0-0' }} đ</span>
            </div>
            <div class="flex justify-between font-bold text-sm text-slate-900 pt-1 border-t border-slate-200">
              <span>TỔNG TIỀN:</span>
              <span>{{ completedInvoice.totalAmount | number:'1.0-0' }} đ</span>
            </div>
            <div class="flex justify-between text-slate-600 pt-1">
              <span>Hình thức:</span>
              <span>{{ completedInvoice.paymentMethodName }}</span>
            </div>
            <div class="flex justify-between text-slate-600">
              <span>Đã thanh toán:</span>
              <span>{{ completedInvoice.paidAmount | number:'1.0-0' }} đ</span>
            </div>
            <div *ngIf="completedInvoice.remainingDebt > 0" class="flex justify-between text-rose-600 font-bold">
              <span>Còn nợ:</span>
              <span>{{ completedInvoice.remainingDebt | number:'1.0-0' }} đ</span>
            </div>
          </div>

          <div class="receipt-divider"></div>
          <div class="text-center text-xs text-slate-500 py-2">
            <p>Cảm ơn quý khách và hẹn gặp lại!</p>
            <p class="text-[10px] text-slate-400 mt-1">Hệ thống ERPm - Ghi sổ Kế toán tự động</p>
          </div>
        </div>

        <div class="modal-footer print-actions">
          <button (click)="closeReceiptModal()" class="btn-secondary">{{ 'sales.close' | translate }}</button>
          <button (click)="printReceipt()" class="btn-primary">🖨️ {{ 'sales.print' | translate }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pos-layout {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 1.25rem;
      padding: 1.25rem;
      height: calc(100vh - 65px);
      box-sizing: border-box;
    }
    @media (max-width: 900px) {
      .pos-layout {
        grid-template-columns: 1fr;
        height: auto;
      }
    }

    .pos-catalog-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      overflow-y: auto;
    }

    .pos-search-bar {
      display: flex;
      gap: 0.75rem;
    }
    .search-input-wrap {
      flex: 1;
      position: relative;
      display: flex;
      align-items: center;
    }
    .search-icon {
      position: absolute;
      left: 0.75rem;
      color: #94a3b8;
    }
    .pos-search-input {
      width: 100%;
      padding: 0.625rem 2rem 0.625rem 2.25rem;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      font-size: 0.875rem;
      outline: none;
      background-color: #ffffff;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    }
    .pos-search-input:focus {
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }
    .clear-search-btn {
      position: absolute;
      right: 0.75rem;
      background: none;
      border: none;
      cursor: pointer;
      color: #94a3b8;
    }

    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 0.875rem;
      padding-bottom: 2rem;
    }

    .product-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 0.875rem;
      cursor: pointer;
      transition: all 0.15s ease-in-out;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      user-select: none;
    }
    .product-card:hover {
      border-color: #4f46e5;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.08);
    }
    .product-sku {
      font-size: 0.65rem;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.05em;
    }
    .product-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: #0f172a;
      margin: 0.25rem 0 0.5rem 0;
      line-height: 1.25;
    }
    .product-card-footer {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-top: 0.5rem;
    }
    .product-price {
      font-size: 0.95rem;
      font-weight: 700;
      color: #4f46e5;
    }
    .product-uom {
      font-size: 0.7rem;
      color: #64748b;
      background: #f1f5f9;
      padding: 0.125rem 0.375rem;
      border-radius: 4px;
    }
    .add-btn {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: none;
      background: #eef2ff;
      color: #4f46e5;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 3rem;
      background: #ffffff;
      border-radius: 12px;
      border: 1px dashed #cbd5e1;
    }

    /* Cart Panel Styles */
    .pos-cart-panel {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 2px 8px rgba(0,0,0,0.03);
      overflow: hidden;
      height: 100%;
    }

    .cart-header {
      padding: 0.875rem 1rem;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      align-items: flex-end;
      gap: 0.5rem;
      background: #fafafa;
    }
    .customer-select-box {
      flex: 1;
    }
    .pos-select {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.8125rem;
      background: #ffffff;
      outline: none;
    }
    .clear-cart-btn {
      background: none;
      border: 1px solid #fee2e2;
      border-radius: 8px;
      padding: 0.5rem;
      cursor: pointer;
      color: #ef4444;
      background: #fff5f5;
    }
    .clear-cart-btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .cart-items-list {
      flex: 1;
      overflow-y: auto;
      padding: 0.75rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .empty-cart-state {
      text-align: center;
      margin: auto 0;
      padding: 2rem 0;
    }

    .cart-line-item {
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #f1f5f9;
    }
    .line-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.375rem;
    }
    .line-name {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #0f172a;
    }
    .line-price {
      font-size: 0.75rem;
      color: #64748b;
    }
    .line-controls {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .qty-stepper {
      display: inline-flex;
      align-items: center;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
    }
    .step-btn {
      width: 24px;
      height: 24px;
      background: #f8fafc;
      border: none;
      cursor: pointer;
      font-weight: bold;
      color: #334155;
    }
    .step-input {
      width: 32px;
      text-align: center;
      border: none;
      font-size: 0.8125rem;
      font-weight: 600;
      outline: none;
    }
    .line-total {
      font-size: 0.875rem;
      font-weight: 700;
      color: #0f172a;
    }
    .remove-line-btn {
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 0.25rem;
    }
    .remove-line-btn:hover {
      color: #ef4444;
    }

    .cart-footer {
      padding: 1rem;
      border-top: 1px solid #e2e8f0;
      background: #fafafa;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .discount-row {
      padding-top: 0.25rem;
    }
    .discount-input {
      width: 100px;
      text-align: right;
      padding: 0.25rem 0.5rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 0.75rem;
      outline: none;
    }
    .grand-total-row {
      padding-top: 0.5rem;
      border-top: 1px dashed #cbd5e1;
      margin-top: 0.25rem;
    }
    .checkout-pay-btn {
      margin-top: 0.5rem;
      width: 100%;
      background: #4f46e5;
      color: #ffffff;
      border: none;
      border-radius: 12px;
      padding: 0.875rem 1rem;
      font-size: 0.95rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
      transition: background 0.15s ease;
    }
    .checkout-pay-btn:hover:not(:disabled) {
      background: #4338ca;
    }
    .checkout-pay-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      box-shadow: none;
    }

    /* Modal Styles */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      z-index: 999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .modal-card {
      background: #ffffff;
      border-radius: 16px;
      max-width: 480px;
      width: 100%;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .modal-header {
      padding: 1rem 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #f1f5f9;
    }
    .modal-close-btn {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      color: #94a3b8;
    }
    .modal-body {
      padding: 1.25rem;
      overflow-y: auto;
      max-height: 75vh;
    }
    .modal-footer {
      padding: 1rem 1.25rem;
      border-top: 1px solid #f1f5f9;
      background: #f8fafc;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    .pay-amount-box {
      text-align: center;
      background: #eef2ff;
      padding: 1rem;
      border-radius: 12px;
      border: 1px solid #e0e7ff;
    }

    .payment-methods-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
      margin-top: 0.25rem;
    }
    .method-btn {
      padding: 0.625rem 0.25rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      background: #ffffff;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      text-align: center;
    }
    .method-btn.active {
      background: #4f46e5;
      color: #ffffff;
      border-color: #4f46e5;
    }

    .pos-input {
      width: 100%;
      padding: 0.625rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      box-sizing: border-box;
      outline: none;
    }
    .quick-cash-row {
      display: flex;
      gap: 0.5rem;
    }
    .quick-cash-btn {
      flex: 1;
      padding: 0.375rem;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      background: #f8fafc;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
    }
    .change-box {
      background: #f1f5f9;
      padding: 0.625rem 0.875rem;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .btn-secondary {
      padding: 0.5rem 1rem;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-primary {
      padding: 0.5rem 1.25rem;
      background: #4f46e5;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
    }

    /* Receipt Card */
    .receipt-card {
      max-width: 380px;
    }
    .receipt-paper {
      padding: 1.5rem 1.25rem;
      background: #ffffff;
      font-family: 'Courier New', Courier, monospace;
    }
    .receipt-header {
      text-align: center;
    }
    .receipt-divider {
      border-top: 1px dashed #cbd5e1;
      margin: 0.75rem 0;
    }
    .receipt-table {
      width: 100%;
      font-size: 0.75rem;
      border-collapse: collapse;
    }
    .receipt-table th {
      padding-bottom: 0.375rem;
      font-weight: 700;
      color: #475569;
    }
    .receipt-table td {
      padding: 0.25rem 0;
    }
    .print-actions {
      font-family: inherit;
    }
  `]
})
export class PosComponent implements OnInit {
  public itemService = inject(ItemService);
  public salesService = inject(SalesService);
  public partnerService = inject(PartnerService);
  public stockService = inject(StockService);

  public PaymentMethod = PaymentMethod;

  // Search & Filter state
  public searchKeyword = '';
  public selectedCustomerId: string | null = null;

  // Cart state
  public cart = signal<CartLine[]>([]);
  public discountAmount = 0;

  // Checkout Modal State
  public showPaymentModal = false;
  public paymentMethod: PaymentMethod = PaymentMethod.Cash;
  public amountPaid = 0;
  public orderNotes = '';
  public isSubmitting = false;

  // Receipt Modal
  public completedInvoice: SalesInvoiceDto | null = null;

  // Computed Totals
  public subTotal = computed(() => {
    return this.cart().reduce((sum, line) => sum + (line.quantity * line.unitPrice), 0);
  });

  public grandTotal = computed(() => {
    return Math.max(0, this.subTotal() - (this.discountAmount || 0));
  });

  public get changeDue(): number {
    return (this.amountPaid || 0) - this.grandTotal();
  }

  public filteredItems = computed(() => {
    const list = this.itemService.items();
    if (!this.searchKeyword) return list;
    const kw = this.searchKeyword.toLowerCase().trim();
    return list.filter(i =>
      i.name.toLowerCase().includes(kw) ||
      i.code.toLowerCase().includes(kw) ||
      (i.barcode && i.barcode.includes(kw))
    );
  });

  ngOnInit(): void {
    this.itemService.loadItems();
    this.partnerService.loadPartners();
    this.stockService.loadWarehouses();
  }

  public onSearchInput(): void {
    // Local filter handled by computed filteredItems
  }

  public addToCart(item: ItemDto): void {
    const current = [...this.cart()];
    const existing = current.find(l => l.item.id === item.id);

    if (existing) {
      existing.quantity += 1;
    } else {
      current.push({
        item,
        quantity: 1,
        unitPrice: item.salePrice,
        discountPercent: 0
      });
    }

    this.cart.set(current);
  }

  public updateQuantity(index: number, delta: number): void {
    const current = [...this.cart()];
    const line = current[index];
    if (!line) return;

    line.quantity += delta;
    if (line.quantity <= 0) {
      current.splice(index, 1);
    }
    this.cart.set(current);
  }

  public setQuantity(index: number, newQty: number): void {
    const current = [...this.cart()];
    const line = current[index];
    if (!line) return;

    line.quantity = Math.max(1, Number(newQty) || 1);
    this.cart.set(current);
  }

  public removeLine(index: number): void {
    const current = [...this.cart()];
    current.splice(index, 1);
    this.cart.set(current);
  }

  public clearCart(): void {
    this.cart.set([]);
    this.discountAmount = 0;
  }

  public openPaymentModal(): void {
    if (this.cart().length === 0) return;
    this.amountPaid = this.grandTotal();
    this.paymentMethod = PaymentMethod.Cash;
    this.showPaymentModal = true;
  }

  public onSelectMethod(): void {
    if (this.paymentMethod !== PaymentMethod.Cash) {
      this.amountPaid = this.grandTotal();
    }
  }

  public setQuickCash(amount: number): void {
    this.amountPaid = amount;
  }

  public confirmCheckout(): void {
    if (this.cart().length === 0) return;
    this.isSubmitting = true;

    const defaultWarehouseId = this.stockService.warehouses()[0]?.id || '44444444-4444-4444-4444-444444444444';

    const customerObj = this.partnerService.partners().find(p => p.id === this.selectedCustomerId);
    const customerName = customerObj ? customerObj.name : 'Khách lẻ';

    const req: CreateSalesInvoiceRequest = {
      customerId: this.selectedCustomerId || undefined,
      customerName,
      warehouseId: defaultWarehouseId,
      paymentMethod: this.paymentMethod,
      discountAmount: Number(this.discountAmount) || 0,
      paidAmount: this.paymentMethod === PaymentMethod.Credit ? 0 : Number(this.amountPaid),
      notes: this.orderNotes || undefined,
      items: this.cart().map(l => ({
        itemId: l.item.id,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        discountPercent: l.discountPercent
      }))
    };

    this.salesService.checkout(req).subscribe({
      next: (invoice) => {
        this.isSubmitting = false;
        this.showPaymentModal = false;
        this.clearCart();
        this.completedInvoice = invoice;
      },
      error: () => {
        this.isSubmitting = false;
      }
    });
  }

  public closeReceiptModal(): void {
    this.completedInvoice = null;
  }

  public printReceipt(): void {
    window.print();
  }
}
