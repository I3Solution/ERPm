import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { ItemService, ItemDto, CreateItemRequest } from '../../core/services/item.service';
import { LocalizationService } from '../../core/services/localization.service';

@Component({
  selector: 'app-items',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <div class="catalog-container">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900">
            {{ 'menu.catalog' | translate }}
          </h1>
          <p class="text-sm text-slate-500 mt-1">
            Quản lý danh mục hàng hóa, giá bán, giá vốn và định mức tồn kho
          </p>
        </div>

        <button (click)="openCreateModal()" class="btn-primary flex items-center justify-center gap-2">
          <span>+</span>
          <span>{{ 'common.create' | translate }}</span>
        </button>
      </div>

      <!-- Filter & Search Toolbar -->
      <div class="erpm-card mb-6">
        <div class="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div class="w-full sm:w-80 search-box">
            <span class="search-icon">🔍</span>
            <input
              type="text"
              [(ngModel)]="searchKeyword"
              (ngModelChange)="onSearch()"
              [placeholder]="'catalog.search_placeholder' | translate"
              class="search-input"
            />
          </div>

          <div class="text-xs text-slate-500 w-full sm:w-auto text-right">
            Tổng cộng: <strong class="text-slate-800">{{ itemService.items().length }}</strong> mặt hàng
          </div>
        </div>
      </div>

      <!-- Desktop View: Data Table -->
      <div class="desktop-only erpm-card p-0 overflow-hidden mb-6">
        <table class="erpm-table">
          <thead>
            <tr>
              <th>{{ 'catalog.item_code' | translate }}</th>
              <th>{{ 'catalog.barcode' | translate }}</th>
              <th>Tên sản phẩm</th>
              <th>{{ 'catalog.uom' | translate }}</th>
              <th class="text-right">{{ 'catalog.sale_price' | translate }}</th>
              <th class="text-right">{{ 'catalog.cost_price' | translate }}</th>
              <th>{{ 'common.status' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of itemService.items()">
              <td class="font-semibold text-indigo-600">{{ item.code }}</td>
              <td class="text-slate-500 font-mono text-xs">{{ item.barcode || '---' }}</td>
              <td>
                <div class="font-medium text-slate-900">
                  {{ getItemDisplayName(item) }}
                </div>
                <div *ngIf="item.translations && item.translations['en'] && currentLang() === 'vi'" class="text-xs text-slate-400">
                  EN: {{ item.translations['en'] }}
                </div>
              </td>
              <td>{{ item.baseUomName || 'Cái' }}</td>
              <td class="text-right font-semibold text-slate-900">
                {{ item.salePrice | number:'1.0-0' }} đ
              </td>
              <td class="text-right text-slate-500">
                {{ item.costPrice | number:'1.0-0' }} đ
              </td>
              <td>
                <span [class]="item.isActive ? 'badge-active' : 'badge-inactive'">
                  {{ (item.isActive ? 'common.active' : 'common.inactive') | translate }}
                </span>
              </td>
            </tr>

            <tr *ngIf="itemService.items().length === 0">
              <td colspan="7" class="text-center py-8 text-slate-400">
                {{ 'catalog.no_items' | translate }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile View: Card List -->
      <div class="mobile-only space-y-3 mb-6">
        <div *ngFor="let item of itemService.items()" class="erpm-card p-4">
          <div class="flex items-start justify-between">
            <div>
              <span class="text-xs font-semibold uppercase text-indigo-600">{{ item.code }}</span>
              <h3 class="text-base font-bold text-slate-900 mt-0.5">
                {{ getItemDisplayName(item) }}
              </h3>
              <p *ngIf="item.categoryName" class="text-xs text-slate-500">
                {{ item.categoryName }} • ĐVT: {{ item.baseUomName || 'Cái' }}
              </p>
            </div>
            <span [class]="item.isActive ? 'badge-active' : 'badge-inactive'">
              {{ (item.isActive ? 'common.active' : 'common.inactive') | translate }}
            </span>
          </div>

          <div class="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-sm">
            <span class="text-slate-500 text-xs">Giá bán lẻ:</span>
            <span class="font-bold text-slate-900 text-base">
              {{ item.salePrice | number:'1.0-0' }} đ
            </span>
          </div>
        </div>

        <div *ngIf="itemService.items().length === 0" class="erpm-card text-center py-8 text-slate-400 text-sm">
          {{ 'catalog.no_items' | translate }}
        </div>
      </div>
    </div>

    <!-- Create Modal Backdrop -->
    <div *ngIf="showModal()" class="modal-backdrop" (click)="closeModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100">
          <h2 class="text-lg font-bold text-slate-900">
            {{ 'catalog.create_title' | translate }}
          </h2>
          <button (click)="closeModal()" class="text-slate-400 hover:text-slate-600 text-xl font-bold">×</button>
        </div>

        <form (ngSubmit)="submitCreate()" class="space-y-4 mt-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="form-label">{{ 'catalog.item_code' | translate }} *</label>
              <input type="text" [(ngModel)]="newItem.code" name="code" required class="form-input" placeholder="SP0003" />
            </div>
            <div>
              <label class="form-label">{{ 'catalog.barcode' | translate }}</label>
              <input type="text" [(ngModel)]="newItem.barcode" name="barcode" class="form-input" placeholder="893..." />
            </div>
          </div>

          <div>
            <label class="form-label">{{ 'catalog.item_name' | translate }} *</label>
            <input type="text" [(ngModel)]="newItem.name" name="name" required class="form-input" placeholder="Tên sản phẩm tiếng Việt" />
          </div>

          <div>
            <label class="form-label">{{ 'catalog.item_name_en' | translate }} (Song ngữ)</label>
            <input type="text" [(ngModel)]="nameEn" name="nameEn" class="form-input" placeholder="English Product Name" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="form-label">{{ 'catalog.sale_price' | translate }} *</label>
              <input type="number" [(ngModel)]="newItem.salePrice" name="salePrice" required class="form-input" />
            </div>
            <div>
              <label class="form-label">{{ 'catalog.cost_price' | translate }}</label>
              <input type="number" [(ngModel)]="newItem.costPrice" name="costPrice" class="form-input" />
            </div>
          </div>

          <div class="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button type="button" (click)="closeModal()" class="btn-secondary">
              {{ 'common.cancel' | translate }}
            </button>
            <button type="submit" class="btn-primary">
              {{ 'common.save' | translate }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .catalog-container {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }
    .flex { display: flex; }
    .flex-col { flex-direction: column; }
    .items-center { align-items: center; }
    .justify-between { justify-content: space-between; }
    .justify-end { justify-content: flex-end; }
    .gap-2 { gap: 0.5rem; }
    .gap-3 { gap: 0.75rem; }
    .gap-4 { gap: 1rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    .mt-1 { margin-top: 0.25rem; }
    .mt-4 { margin-top: 1rem; }
    .pt-3 { padding-top: 0.75rem; }
    .pt-4 { padding-top: 1rem; }
    .p-0 { padding: 0 !important; }
    .p-4 { padding: 1rem; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .overflow-hidden { overflow: hidden; }

    .btn-primary {
      background-color: #4f46e5;
      color: #ffffff;
      padding: 0.625rem 1.25rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.875rem;
      border: none;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    .btn-primary:hover { background-color: #4338ca; }

    .btn-secondary {
      background-color: #f1f5f9;
      color: #475569;
      padding: 0.625rem 1.25rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.875rem;
      border: none;
      cursor: pointer;
    }
    .btn-secondary:hover { background-color: #e2e8f0; }

    .search-box {
      position: relative;
      width: 100%;
    }
    .search-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.875rem;
    }
    .search-input {
      width: 100%;
      padding: 0.5rem 0.75rem 0.5rem 2.25rem;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      font-size: 0.875rem;
      outline: none;
    }
    .search-input:focus {
      border-color: #4f46e5;
      box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.15);
    }

    .form-label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: #475569;
      margin-bottom: 0.25rem;
    }
    .form-input {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      font-size: 0.875rem;
      outline: none;
    }
    .form-input:focus {
      border-color: #4f46e5;
    }

    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 1rem;
    }
    .modal-content {
      background: white;
      border-radius: 16px;
      width: 100%;
      max-width: 540px;
      padding: 1.5rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }

    @media (min-width: 640px) {
      .sm\\:flex-row { flex-direction: row; }
      .sm\\:items-center { align-items: center; }
      .sm\\:w-80 { width: 20rem; }
      .sm\\:w-auto { width: auto; }
      .sm\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
  `]
})
export class ItemsComponent implements OnInit {
  public searchKeyword = '';
  public showModal = signal(false);
  public nameEn = '';

  public newItem: CreateItemRequest = {
    code: '',
    barcode: '',
    name: '',
    itemType: 1,
    baseUomId: '11111111-1111-1111-1111-111111111111',
    salePrice: 0,
    costPrice: 0,
    minStockAlert: 10,
    maxStockAlert: 500
  };

  constructor(
    public itemService: ItemService,
    private localizationService: LocalizationService
  ) {}

  public get currentLang() {
    return this.localizationService.currentLang;
  }

  ngOnInit(): void {
    this.itemService.loadItems();
  }

  public onSearch(): void {
    this.itemService.loadItems(this.searchKeyword);
  }

  public getItemDisplayName(item: ItemDto): string {
    const lang = this.currentLang();
    if (lang === 'en' && item.translations && item.translations['en']) {
      return item.translations['en'];
    }
    return item.name;
  }

  public openCreateModal(): void {
    this.newItem = {
      code: 'SP000' + (this.itemService.items().length + 1),
      barcode: '',
      name: '',
      itemType: 1,
      baseUomId: '11111111-1111-1111-1111-111111111111',
      salePrice: 10000,
      costPrice: 7000,
      minStockAlert: 10,
      maxStockAlert: 500
    };
    this.nameEn = '';
    this.showModal.set(true);
  }

  public closeModal(): void {
    this.showModal.set(false);
  }

  public submitCreate(): void {
    if (!this.newItem.code || !this.newItem.name) return;

    this.newItem.translations = {
      vi: this.newItem.name,
      en: this.nameEn || this.newItem.name
    };

    this.itemService.createItem(this.newItem).subscribe(() => {
      this.closeModal();
    });
  }
}
