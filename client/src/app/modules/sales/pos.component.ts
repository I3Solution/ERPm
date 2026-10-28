import { Component, OnInit, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { CustomSelectComponent, SelectOption } from '../../shared/components/custom-select/custom-select.component';
import { ItemService, ItemDto } from '../../core/services/item.service';
import { SalesService, CreateSalesInvoiceRequest, SalesInvoiceDto, PaymentMethod } from '../../core/services/sales.service';
import { PartnerService } from '../../core/services/partner.service';
import { StockService } from '../../core/services/stock.service';
import { BranchService } from '../../core/services/branch.service';
import { LocalizationService } from '../../core/services/localization.service';

export interface CartLine {
  item: ItemDto;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
}

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, CustomSelectComponent],
  templateUrl: './pos.component.html',
  styleUrls: ['./pos.component.scss']
})
export class PosComponent implements OnInit {
  public itemService = inject(ItemService);
  public salesService = inject(SalesService);
  public partnerService = inject(PartnerService);
  public stockService = inject(StockService);
  public branchService = inject(BranchService);
  public localizationService = inject(LocalizationService);

  public PaymentMethod = PaymentMethod;

  public customerOptions = computed<SelectOption[]>(() => {
    const walkInLabel = this.localizationService.translate('sales.guest_customer', 'Khách lẻ (Walk-in Customer)');
    const list: SelectOption[] = [
      { value: null, label: walkInLabel, icon: '👤' }
    ];
    for (const p of this.partnerService.partners()) {
      list.push({
        value: p.id,
        label: p.name,
        sublabel: p.phone || p.code,
        icon: '👤'
      });
    }
    return list;
  });

  constructor() {
    effect(() => {
      const branchId = this.branchService.getActiveBranchIdForQuery();
      this.stockService.loadWarehouses(branchId);
      this.salesService.loadInvoices(branchId);
    });
  }

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
      branchId: this.branchService.getActiveBranchIdForQuery() || undefined,
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
