import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { PartnerService, PartnerDto, CreatePartnerRequest, PartnerType } from '../../core/services/partner.service';

@Component({
  selector: 'app-partners',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <div class="partners-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">{{ 'partners.title' | translate }}</h1>
          <p class="page-subtitle">Quản lý danh bạ khách hàng, nhà cung ứng & theo dõi công nợ chi tiết</p>
        </div>

        <button (click)="openCreateModal()" class="btn-primary">
          + Thêm đối tác
        </button>
      </div>

      <!-- Quick Metrics Summary -->
      <div class="metrics-grid">
        <div class="metric-card">
          <span class="metric-label">Tổng khách hàng & NCC</span>
          <h3 class="metric-value">{{ partnerService.partners().length }} đối tác</h3>
        </div>
        <div class="metric-card">
          <span class="metric-label">Tổng công nợ phải thu (KH)</span>
          <h3 class="metric-value text-rose-600">{{ totalCustomerDebt() | number:'1.0-0' }} đ</h3>
        </div>
      </div>

      <!-- Filter Controls & Type Tabs -->
      <div class="filter-bar">
        <div class="type-tabs">
          <button
            type="button"
            (click)="activeTypeTab = 'all'"
            [class.active]="activeTypeTab === 'all'"
            class="tab-btn"
          >
            {{ 'common.all' | translate }} ({{ partnerService.partners().length }})
          </button>
          <button
            type="button"
            (click)="activeTypeTab = 'customer'"
            [class.active]="activeTypeTab === 'customer'"
            class="tab-btn"
          >
            {{ 'partners.customers' | translate }}
          </button>
          <button
            type="button"
            (click)="activeTypeTab = 'vendor'"
            [class.active]="activeTypeTab === 'vendor'"
            class="tab-btn"
          >
            {{ 'partners.suppliers' | translate }}
          </button>
        </div>

        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            [(ngModel)]="searchKeyword"
            placeholder="Tìm theo tên, số ĐT, mã hoặc MST..."
            class="search-input"
          />
        </div>
      </div>

      <!-- Partners Table View -->
      <div class="table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Mã</th>
              <th>Tên đối tác</th>
              <th>Phân loại</th>
              <th>{{ 'partners.phone' | translate }}</th>
              <th>{{ 'partners.tax_code' | translate }}</th>
              <th class="text-right">{{ 'partners.credit_limit' | translate }}</th>
              <th class="text-right">{{ 'partners.debt_balance' | translate }}</th>
              <th>{{ 'partners.address' | translate }}</th>
              <th class="text-center">{{ 'common.status' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of filteredPartners()">
              <td class="font-bold text-slate-800">{{ p.code }}</td>
              <td class="font-semibold text-slate-900">{{ p.name }}</td>
              <td>
                <span class="badge-type" [ngClass]="getTypeBadgeClass(p.partnerType)">
                  {{ getTypeLabel(p.partnerType) }}
                </span>
              </td>
              <td class="font-mono text-slate-600">{{ p.phone || '—' }}</td>
              <td class="font-mono text-slate-500 text-xs">{{ p.taxCode || '—' }}</td>
              <td class="text-right text-slate-600">{{ p.creditLimit | number:'1.0-0' }} đ</td>
              <td class="text-right font-bold" [class.text-rose-600]="p.debtBalance > 0" [class.text-slate-700]="p.debtBalance === 0">
                {{ p.debtBalance | number:'1.0-0' }} đ
              </td>
              <td class="text-xs text-slate-500 max-w-xs truncate">{{ p.address || '—' }}</td>
              <td class="text-center">
                <span class="badge-status-active">Hoạt động</span>
              </td>
            </tr>

            <tr *ngIf="filteredPartners().length === 0">
              <td colspan="9" class="text-center py-8 text-slate-400">
                Không tìm thấy đối tác nào.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL: Add Partner Modal -->
    <div *ngIf="showCreateModal" class="modal-backdrop" (click)="showCreateModal = false">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2 class="text-lg font-bold text-slate-900">{{ 'partners.create_title' | translate }}</h2>
          <button (click)="showCreateModal = false" class="modal-close-btn">✕</button>
        </div>

        <div class="modal-body space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="input-label">Mã đối tác *</label>
              <input type="text" [(ngModel)]="newPartnerCode" placeholder="VD: KH0002" class="modal-input" />
            </div>
            <div>
              <label class="input-label">{{ 'partners.type' | translate }} *</label>
              <select [(ngModel)]="newPartnerType" class="modal-input">
                <option [ngValue]="PartnerType.Customer">Khách hàng</option>
                <option [ngValue]="PartnerType.Vendor">Nhà cung cấp</option>
                <option [ngValue]="PartnerType.Both">Cả hai</option>
              </select>
            </div>
          </div>

          <div>
            <label class="input-label">Tên đối tác / Công ty *</label>
            <input type="text" [(ngModel)]="newPartnerName" placeholder="Tên khách hàng hoặc doanh nghiệp..." class="modal-input" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="input-label">{{ 'partners.phone' | translate }}</label>
              <input type="tel" [(ngModel)]="newPartnerPhone" placeholder="0901..." class="modal-input" />
            </div>
            <div>
              <label class="input-label">Email</label>
              <input type="email" [(ngModel)]="newPartnerEmail" placeholder="email@domain.com" class="modal-input" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="input-label">{{ 'partners.tax_code' | translate }}</label>
              <input type="text" [(ngModel)]="newPartnerTaxCode" placeholder="Mã số thuế doanh nghiệp" class="modal-input" />
            </div>
            <div>
              <label class="input-label">{{ 'partners.credit_limit' | translate }} (đ)</label>
              <input type="number" [(ngModel)]="newPartnerCreditLimit" min="0" class="modal-input" />
            </div>
          </div>

          <div>
            <label class="input-label">{{ 'partners.address' | translate }}</label>
            <input type="text" [(ngModel)]="newPartnerAddress" placeholder="Địa chỉ giao dịch..." class="modal-input" />
          </div>
        </div>

        <div class="modal-footer">
          <button (click)="showCreateModal = false" class="btn-secondary">{{ 'common.cancel' | translate }}</button>
          <button
            (click)="submitCreatePartner()"
            [disabled]="!newPartnerCode || !newPartnerName || isSubmitting"
            class="btn-primary"
          >
            {{ isSubmitting ? 'Đang lưu...' : ('common.save' | translate) }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .partners-container {
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
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }
    .type-tabs {
      display: inline-flex;
      background: #f1f5f9;
      border-radius: 8px;
      padding: 0.25rem;
      gap: 0.25rem;
    }
    .tab-btn {
      padding: 0.375rem 0.875rem;
      border: none;
      background: none;
      border-radius: 6px;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
    }
    .tab-btn.active {
      background: #ffffff;
      color: #0f172a;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }

    .search-box {
      flex: 1;
      max-width: 380px;
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

    .badge-type {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
    }
    .badge-customer {
      background: #e0f2fe;
      color: #0369a1;
    }
    .badge-vendor {
      background: #fef3c7;
      color: #b45309;
    }
    .badge-both {
      background: #f3e8ff;
      color: #7e22ce;
    }

    .badge-status-active {
      background: #ecfdf5;
      color: #059669;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
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
      max-width: 520px;
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
export class PartnersComponent implements OnInit {
  public partnerService = inject(PartnerService);
  public PartnerType = PartnerType;

  public activeTypeTab: 'all' | 'customer' | 'vendor' = 'all';
  public searchKeyword = '';

  // Create Modal
  public showCreateModal = false;
  public newPartnerCode = '';
  public newPartnerName = '';
  public newPartnerType: PartnerType = PartnerType.Customer;
  public newPartnerPhone = '';
  public newPartnerEmail = '';
  public newPartnerTaxCode = '';
  public newPartnerCreditLimit = 0;
  public newPartnerAddress = '';
  public isSubmitting = false;

  public totalCustomerDebt = computed(() => {
    return this.partnerService.partners()
      .filter(p => p.partnerType === PartnerType.Customer || p.partnerType === PartnerType.Both)
      .reduce((sum, p) => sum + (p.debtBalance || 0), 0);
  });

  public filteredPartners = computed(() => {
    let list = this.partnerService.partners();

    if (this.activeTypeTab === 'customer') {
      list = list.filter(p => p.partnerType === PartnerType.Customer || p.partnerType === PartnerType.Both);
    } else if (this.activeTypeTab === 'vendor') {
      list = list.filter(p => p.partnerType === PartnerType.Vendor || p.partnerType === PartnerType.Both);
    }

    if (this.searchKeyword) {
      const kw = this.searchKeyword.toLowerCase().trim();
      list = list.filter(p =>
        p.name.toLowerCase().includes(kw) ||
        p.code.toLowerCase().includes(kw) ||
        (p.phone && p.phone.includes(kw)) ||
        (p.taxCode && p.taxCode.includes(kw))
      );
    }

    return list;
  });

  ngOnInit(): void {
    this.partnerService.loadPartners();
  }

  public getTypeLabel(type: PartnerType): string {
    switch (type) {
      case PartnerType.Customer: return 'Khách hàng';
      case PartnerType.Vendor: return 'Nhà cung cấp';
      case PartnerType.Both: return 'KH & NCC';
      default: return 'Khác';
    }
  }

  public getTypeBadgeClass(type: PartnerType): string {
    switch (type) {
      case PartnerType.Customer: return 'badge-customer';
      case PartnerType.Vendor: return 'badge-vendor';
      case PartnerType.Both: return 'badge-both';
      default: return '';
    }
  }

  public openCreateModal(): void {
    const nextIdx = this.partnerService.partners().length + 1;
    this.newPartnerCode = `KH${nextIdx.toString().padStart(4, '0')}`;
    this.newPartnerName = '';
    this.newPartnerType = PartnerType.Customer;
    this.newPartnerPhone = '';
    this.newPartnerEmail = '';
    this.newPartnerTaxCode = '';
    this.newPartnerCreditLimit = 10000000;
    this.newPartnerAddress = '';
    this.showCreateModal = true;
  }

  public submitCreatePartner(): void {
    if (!this.newPartnerCode || !this.newPartnerName) return;

    this.isSubmitting = true;
    const req: CreatePartnerRequest = {
      code: this.newPartnerCode.trim().toUpperCase(),
      name: this.newPartnerName.trim(),
      partnerType: this.newPartnerType,
      phone: this.newPartnerPhone.trim() || undefined,
      email: this.newPartnerEmail.trim() || undefined,
      address: this.newPartnerAddress.trim() || undefined,
      taxCode: this.newPartnerTaxCode.trim() || undefined,
      creditLimit: Number(this.newPartnerCreditLimit) || 0
    };

    this.partnerService.createPartner(req).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showCreateModal = false;
      },
      error: () => {
        this.isSubmitting = false;
      }
    });
  }
}
