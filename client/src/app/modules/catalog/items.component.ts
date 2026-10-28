import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import {
  ItemService,
  ItemDto,
  CreateItemRequest,
  ItemAttributeDto,
  AttributeDataType
} from '../../core/services/item.service';
import { LocalizationService } from '../../core/services/localization.service';
import {
  CustomSelectComponent,
  SelectOption
} from '../../shared/components/custom-select/custom-select.component';

@Component({
  selector: 'app-items',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, CustomSelectComponent],
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.scss']
})
export class ItemsComponent implements OnInit {
  public searchKeyword = '';
  public showModal = signal(false);
  public nameEn = '';

  // Dynamic schema attributes model
  public customAttributes: Record<string, any> = {};
  public readonly AttributeDataType = AttributeDataType;

  public newItem: CreateItemRequest = {
    code: '',
    barcode: '',
    name: '',
    itemType: 1,
    baseUomId: '00000000-0000-0000-0000-000000000010',
    salePrice: 0,
    costPrice: 0,
    minStockAlert: 10,
    maxStockAlert: 500,
    attributes: {}
  };

  constructor(
    public itemService: ItemService,
    private localizationService: LocalizationService
  ) {}

  public get currentLang() {
    return this.localizationService.currentLang;
  }

  ngOnInit(): void {
    // Load active items and schema-driven dynamic attributes
    this.itemService.loadItems();
    this.itemService.loadAttributes();
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

  // Convert attribute string options into SelectOption array
  public getAttributeOptions(attr: ItemAttributeDto): SelectOption[] {
    return (attr.options || []).map(opt => ({
      value: opt,
      label: opt
    }));
  }

  // Retrieve formatted key-value pairs for display badges
  public getAttributeEntries(item: ItemDto): { key: string; label: string; value: any }[] {
    if (!item.attributes) return [];
    const attrDefs = this.itemService.attributes();
    return Object.entries(item.attributes)
      .filter(([_, val]) => val !== null && val !== undefined && val !== '')
      .map(([key, val]) => {
        const def = attrDefs.find(a => a.code === key);
        const label = def ? def.name : key;
        const displayVal = typeof val === 'boolean' ? (val ? 'Có' : 'Không') : val;
        return { key, label, value: displayVal };
      });
  }

  public openCreateModal(): void {
    this.newItem = {
      code: 'SP000' + (this.itemService.items().length + 1),
      barcode: '',
      name: '',
      itemType: 1,
      baseUomId: '00000000-0000-0000-0000-000000000010',
      salePrice: 10000,
      costPrice: 7000,
      minStockAlert: 10,
      maxStockAlert: 500,
      attributes: {}
    };
    this.nameEn = '';
    this.customAttributes = {};
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

    // Filter out empty or whitespace-only attribute values
    const cleanedAttributes: Record<string, any> = {};
    Object.entries(this.customAttributes).forEach(([key, val]) => {
      if (val !== null && val !== undefined && val !== '') {
        cleanedAttributes[key] = val;
      }
    });
    this.newItem.attributes = cleanedAttributes;

    this.itemService.createItem(this.newItem).subscribe({
      next: () => {
        this.closeModal();
      },
      error: (err) => {
        const errorMsg = err.error?.message || err.error?.errors?.[0] || 'Lỗi khi lưu sản phẩm vào cơ sở dữ liệu!';
        alert(errorMsg);
        console.error('Error creating item:', err);
      }
    });
  }
}
