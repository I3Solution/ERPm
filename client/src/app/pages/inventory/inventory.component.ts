import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { StockService, StockBalanceDto, CreateStockReceiptRequest } from '../../core/services/stock.service';
import { ItemService } from '../../core/services/item.service';
import { PartnerService, PartnerType } from '../../core/services/partner.service';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <div class="inventory-container">
      <!-- Header Bar -->
      <div class="page-header">
        <div>
          <h1 class="page-title">{{ 'inventory.title' | translate }}</h1>
          <p class="page-subtitle">Theo dõi số lượng tồn thời gian thực, cảnh báo tồn tối thiểu & nhập kho</p>
        </div>

        <div class="header-actions">
          <button (click)="openReceiptModal()" class="btn-primary">
            {{ 'inventory.stock_in_btn' | translate }}
          </button>
        </div>
      </div>

      <!-- Quick Metrics Grid -->
      <div class="metrics-grid">
        <div class="metric-card">
          <span class="metric-label">Tổng mặt hàng trong kho</span>
          <h3 class="metric-value">{{ stockService.balances().length }} SKU</h3>
        </div>
        <div class="metric-card">
          <span class="metric-label">Tổng giá trị tồn kho</span>
          <h3 class="metric-value text-indigo-600">{{ totalStockValue() | number:'1.0-0' }} đ</h3>
        </div>
        <div class="metric-card" [class.alert-card]="lowStockCount() > 0">
          <span class="metric-label">Cảnh báo sắp hết hàng</span>
          <h3 class="metric-value" [class.text-amber-600]="lowStockCount() > 0">
            {{ lowStockCount() }} mặt hàng
          </h3>
        </div>
      </div>

      <!-- Filter and Search Controls -->
      <div class="filter-bar">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            [(ngModel)]="searchKeyword"
            placeholder="Tìm theo mã SKU, tên hàng hoặc mã vạch..."
            class="search-input"
          />
        </div>

        <div class="warehouse-filter">
          <label class="text-xs text-slate-500 font-semibold mr-2">Kho:</label>
          <select [(ngModel)]="selectedWarehouseId" (change)="onWarehouseChange()" class="select-input">
            <option [ngValue]="null">{{ 'inventory.all_warehouses' | translate }}</option>
            <option *ngFor="let w of stockService.warehouses()" [value]="w.id">
              {{ w.name }} ({{ w.code }})
            </option>
          </select>
        </div>
      </div>

      <!-- Balances Table View -->
      <div class="table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Mã SKU</th>
              <th>Tên sản phẩm</th>
              <th>Mã vạch</th>
              <th>ĐVT</th>
              <th>Kho lưu trữ</th>
              <th class="text-right">{{ 'inventory.qty_on_hand' | translate }}</th>
              <th class="text-right">{{ 'inventory.avg_cost' | translate }}</th>
              <th class="text-right">{{ 'inventory.total_value' | translate }}</th>
              <th class="text-center">{{ 'common.status' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of filteredBalances()">
              <td class="font-bold text-slate-800">{{ item.itemCode }}</td>
              <td class="font-semibold text-slate-900">{{ item.itemName }}</td>
              <td class="text-slate-500 font-mono text-xs">{{ item.barcode || '—' }}</td>
              <td><span class="badge-uom">{{ item.uomName || 'Cái' }}</span></td>
              <td class="text-slate-600">{{ item.warehouseName }}</td>
              <td class="text-right font-bold" [class.text-amber-600]="item.isLowStock">
                {{ item.quantityOnHand | number:'1.0-2' }}
              </td>
              <td class="text-right text-slate-600">{{ item.averageCostPrice | number:'1.0-0' }} đ</td>
              <td class="text-right font-semibold text-indigo-700">
                {{ item.totalValue | number:'1.0-0' }} đ
              </td>
              <td class="text-center">
                <span *ngIf="item.isLowStock" class="badge-low-stock">
                  ⚠️ Sắp hết
                </span>
                <span *ngIf="!item.isLowStock" class="badge-ok">
                  ✓ Ổn định
                </span>
              </td>
            </tr>

            <tr *ngIf="filteredBalances().length === 0">
              <td colspan="9" class="text-center py-8 text-slate-400">
                Không có dữ liệu tồn kho phù hợp.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL: Quick Stock Receipt (Nhập kho hàng) -->
    <div *ngIf="showReceiptModal" class="modal-backdrop" (click)="showReceiptModal = false">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2 class="text-lg font-bold text-slate-900">{{ 'inventory.receipt_title' | translate }}</h2>
          <button (click)="showReceiptModal = false" class="modal-close-btn">✕</button>
        </div>

        <div class="modal-body space-y-4">
          <!-- Warehouse Selection -->
          <div>
            <label class="input-label">Kho tiếp nhận *</label>
            <select [(ngModel)]="receiptWarehouseId" class="modal-input">
              <option *ngFor="let w of stockService.warehouses()" [value]="w.id">
                {{ w.name }} ({{ w.code }})
              </option>
            </select>
          </div>

          <!-- Supplier Selection -->
          <div>
            <label class="input-label">{{ 'inventory.supplier' | translate }}</label>
            <select [(ngModel)]="receiptSupplierId" class="modal-input">
              <option [ngValue]="null">-- Chọn nhà cung ứng --</option>
              <option *ngFor="let s of suppliers()" [value]="s.id">
                {{ s.name }} ({{ s.phone || s.code }})
              </option>
            </select>
          </div>

          <!-- Item to Stock In -->
          <div>
            <label class="input-label">Mặt hàng nhập kho *</label>
            <select [(ngModel)]="receiptItemId" (change)="onReceiptItemSelect()" class="modal-input">
              <option [ngValue]="null">-- Chọn mặt hàng từ Danh mục --</option>
              <option *ngFor="let item of itemService.items()" [value]="item.id">
                [{{ item.code }}] {{ item.name }}
              </option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="input-label">{{ 'inventory.quantity' | translate }} *</label>
              <input
                type="number"
                [(ngModel)]="receiptQuantity"
                min="1"
                class="modal-input font-bold"
              />
            </div>
            <div>
              <label class="input-label">{{ 'inventory.unit_cost' | translate }} (đ) *</label>
              <input
                type="number"
                [(ngModel)]="receiptUnitCost"
                min="0"
                class="modal-input font-bold"
              />
            </div>
          </div>

          <div>
            <label class="input-label">Ghi chú phiếu nhập</label>
            <input
              type="text"
              [(ngModel)]="receiptNotes"
              placeholder="VD: Nhập đợt 1 từ nhà cung ứng Ánh Dương"
              class="modal-input"
            />
          </div>
        </div>

        <div class="modal-footer">
          <button (click)="showReceiptModal = false" class="btn-secondary">{{ 'common.cancel' | translate }}</button>
          <button
            (click)="submitStockReceipt()"
            [disabled]="!receiptItemId || receiptQuantity <= 0 || isSubmitting"
            class="btn-primary"
          >
            {{ isSubmitting ? 'Đang lưu...' : ('inventory.save_receipt' | translate) }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .inventory-container {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    .page-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #0f172a;
    }
    .page-subtitle {
      font-size: 0.875rem;
      color: #64748b;
      margin-top: 0.25rem;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .metric-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1rem 1.25rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }
    .metric-card.alert-card {
      border-color: #fef3c7;
      background: #fffbeb;
    }
    .metric-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
    }
    .metric-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #0f172a;
      margin-top: 0.375rem;
    }

    .filter-bar {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      align-items: center;
    }
    .search-box {
      flex: 1;
      position: relative;
    }
    .search-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
    }
    .search-input {
      width: 100%;
      padding: 0.5rem 0.75rem 0.5rem 2.25rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.875rem;
      background: #ffffff;
      outline: none;
    }
    .select-input {
      padding: 0.5rem 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.8125rem;
      background: #ffffff;
      outline: none;
    }

    .table-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow-x: auto;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    .data-table th {
      background: #f8fafc;
      padding: 0.75rem 1rem;
      text-align: left;
      font-weight: 600;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
      white-space: nowrap;
    }
    .data-table td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }
    .data-table tr:hover {
      background: #f8fafc;
    }

    .badge-uom {
      background: #f1f5f9;
      color: #475569;
      font-size: 0.75rem;
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
    }
    .badge-low-stock {
      background: #fef3c7;
      color: #d97706;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
    }
    .badge-ok {
      background: #ecfdf5;
      color: #059669;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
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
      max-width: 500px;
      width: 100%;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      overflow: hidden;
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
    }
    .modal-footer {
      padding: 1rem 1.25rem;
      border-top: 1px solid #f1f5f9;
      background: #f8fafc;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    .input-label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: #475569;
      margin-bottom: 0.25rem;
    }
    .modal-input {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.875rem;
      outline: none;
      box-sizing: border-box;
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
    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class InventoryComponent implements OnInit {
  public stockService = inject(StockService);
  public itemService = inject(ItemService);
  public partnerService = inject(PartnerService);

  public searchKeyword = '';
  public selectedWarehouseId: string | null = null;

  // Receipt Modal State
  public showReceiptModal = false;
  public receiptWarehouseId = '';
  public receiptSupplierId: string | null = null;
  public receiptItemId: string | null = null;
  public receiptQuantity = 10;
  public receiptUnitCost = 0;
  public receiptNotes = '';
  public isSubmitting = false;

  public suppliers = computed(() => {
    return this.partnerService.partners().filter(p => p.partnerType === PartnerType.Vendor || p.partnerType === PartnerType.Both);
  });

  public totalStockValue = computed(() => {
    return this.stockService.balances().reduce((sum, b) => sum + (b.totalValue || 0), 0);
  });

  public lowStockCount = computed(() => {
    return this.stockService.balances().filter(b => b.isLowStock).length;
  });

  public filteredBalances = computed(() => {
    let list = this.stockService.balances();
    if (this.selectedWarehouseId) {
      list = list.filter(b => b.warehouseId === this.selectedWarehouseId);
    }
    if (this.searchKeyword) {
      const kw = this.searchKeyword.toLowerCase().trim();
      list = list.filter(b =>
        b.itemName.toLowerCase().includes(kw) ||
        b.itemCode.toLowerCase().includes(kw) ||
        (b.barcode && b.barcode.includes(kw))
      );
    }
    return list;
  });

  ngOnInit(): void {
    this.stockService.loadWarehouses();
    this.stockService.loadBalances();
    this.itemService.loadItems();
    this.partnerService.loadPartners();
  }

  public onWarehouseChange(): void {
    this.stockService.loadBalances(this.selectedWarehouseId || undefined);
  }

  public openReceiptModal(): void {
    this.receiptWarehouseId = this.stockService.warehouses()[0]?.id || '44444444-4444-4444-4444-444444444444';
    this.receiptItemId = this.itemService.items()[0]?.id || null;
    this.onReceiptItemSelect();
    this.showReceiptModal = true;
  }

  public onReceiptItemSelect(): void {
    const item = this.itemService.items().find(i => i.id === this.receiptItemId);
    if (item) {
      this.receiptUnitCost = item.costPrice || 0;
    }
  }

  public submitStockReceipt(): void {
    if (!this.receiptItemId || this.receiptQuantity <= 0) return;

    this.isSubmitting = true;
    const req: CreateStockReceiptRequest = {
      warehouseId: this.receiptWarehouseId,
      supplierId: this.receiptSupplierId || undefined,
      notes: this.receiptNotes || undefined,
      items: [
        {
          itemId: this.receiptItemId,
          quantity: Number(this.receiptQuantity),
          unitPrice: Number(this.receiptUnitCost)
        }
      ]
    };

    this.stockService.createStockReceipt(req).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showReceiptModal = false;
        this.receiptNotes = '';
      },
      error: () => {
        this.isSubmitting = false;
      }
    });
  }
}
