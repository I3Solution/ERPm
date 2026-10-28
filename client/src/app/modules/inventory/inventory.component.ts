import { Component, OnInit, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { CustomSelectComponent, SelectOption } from '../../shared/components/custom-select/custom-select.component';
import { StockService, CreateStockReceiptRequest } from '../../core/services/stock.service';
import { ItemService } from '../../core/services/item.service';
import { PartnerService, PartnerType } from '../../core/services/partner.service';
import { BranchService } from '../../core/services/branch.service';
import { LocalizationService } from '../../core/services/localization.service';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, CustomSelectComponent],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss']
})
export class InventoryComponent implements OnInit {
  public stockService = inject(StockService);
  public itemService = inject(ItemService);
  public partnerService = inject(PartnerService);
  public branchService = inject(BranchService);
  public localizationService = inject(LocalizationService);

  public searchKeyword = '';
  public selectedWarehouseId: string | null = null;

  // Options for custom selects
  public warehouseOptions = computed<SelectOption[]>(() => {
    const allLabel = this.localizationService.translate('inventory.all_warehouses', 'Tất cả kho bãi');
    const list: SelectOption[] = [
      { value: null, label: allLabel, icon: '🏢' }
    ];
    for (const w of this.stockService.warehouses()) {
      list.push({
        value: w.id,
        label: `${w.name} (${w.code})`,
        icon: '📦'
      });
    }
    return list;
  });

  public receiptWarehouseOptions = computed<SelectOption[]>(() => {
    return this.stockService.warehouses().map(w => ({
      value: w.id,
      label: `${w.name} (${w.code})`,
      icon: '🏢'
    }));
  });

  public receiptSupplierOptions = computed<SelectOption[]>(() => {
    const defaultPlaceholder = this.localizationService.translate('inventory.select_supplier', '-- Chọn nhà cung ứng --');
    const list: SelectOption[] = [
      { value: null, label: defaultPlaceholder, icon: '👤' }
    ];
    for (const s of this.suppliers()) {
      list.push({
        value: s.id,
        label: s.name,
        sublabel: s.code,
        icon: '🏭'
      });
    }
    return list;
  });

  public receiptItemOptions = computed<SelectOption[]>(() => {
    return this.itemService.items().map(i => ({
      value: i.id,
      label: i.name,
      sublabel: `${i.code} • ${i.baseUomName || 'ĐVT'}`,
      icon: '🏷️'
    }));
  });

  constructor() {
    effect(() => {
      const branchId = this.branchService.getActiveBranchIdForQuery();
      this.stockService.loadWarehouses(branchId);
      this.stockService.loadBalances(this.selectedWarehouseId, branchId);
    });
  }

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
    this.itemService.loadItems();
    this.partnerService.loadPartners();
  }

  public onWarehouseChange(): void {
    const branchId = this.branchService.getActiveBranchIdForQuery();
    this.stockService.loadBalances(this.selectedWarehouseId || undefined, branchId);
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
