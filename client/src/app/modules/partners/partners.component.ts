import { Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { CustomSelectComponent, SelectOption } from '../../shared/components/custom-select/custom-select.component';
import { PartnerService, CreatePartnerRequest, PartnerType } from '../../core/services/partner.service';
import { LocalizationService } from '../../core/services/localization.service';

@Component({
  selector: 'app-partners',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, CustomSelectComponent],
  templateUrl: './partners.component.html',
  styleUrls: ['./partners.component.scss']
})
export class PartnersComponent implements OnInit {
  public partnerService = inject(PartnerService);
  public localizationService = inject(LocalizationService);
  public PartnerType = PartnerType;

  public activeTypeTab: 'all' | 'customer' | 'vendor' = 'all';
  public searchKeyword = '';

  // Options for partner type select
  public partnerTypeOptions = computed<SelectOption[]>(() => [
    { value: PartnerType.Customer, label: this.localizationService.translate('partners.customers', 'Khách hàng'), icon: '👤' },
    { value: PartnerType.Vendor, label: this.localizationService.translate('partners.suppliers', 'Nhà cung cấp'), icon: '🏭' },
    { value: PartnerType.Both, label: this.localizationService.translate('common.all', 'Cả hai (KH & NCC)'), icon: '🔄' }
  ]);

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
      case PartnerType.Customer: return this.localizationService.translate('partners.customers', 'Khách hàng');
      case PartnerType.Vendor: return this.localizationService.translate('partners.suppliers', 'Nhà cung cấp');
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
