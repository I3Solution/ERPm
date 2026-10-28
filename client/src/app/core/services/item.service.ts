import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, map, tap } from 'rxjs';

export enum AttributeDataType {
  Text = 1,
  Number = 2,
  Select = 3,
  Date = 4,
  Boolean = 5
}

export interface ItemAttributeDto {
  id: string;
  categoryId?: string;
  categoryName?: string;
  code: string;
  name: string;
  dataType: AttributeDataType;
  options: string[];
  unit?: string;
  isRequired: boolean;
  isFilterable: boolean;
  sortOrder: number;
}

export interface ItemDto {
  id: string;
  code: string;
  barcode?: string;
  name: string;
  translations: Record<string, string>;
  itemType: number;
  categoryId?: string;
  categoryName?: string;
  baseUomId: string;
  baseUomName?: string;
  salePrice: number;
  costPrice: number;
  minStockAlert: number;
  maxStockAlert: number;
  imageUrl?: string;
  description?: string;
  isActive: boolean;
  attributes?: Record<string, any>;
}

export interface CreateItemRequest {
  code: string;
  barcode?: string;
  name: string;
  translations?: Record<string, string>;
  itemType: number;
  categoryId?: string;
  baseUomId: string;
  salePrice: number;
  costPrice: number;
  minStockAlert: number;
  maxStockAlert: number;
  description?: string;
  attributes?: Record<string, any>;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
}

const DEFAULT_ATTRIBUTES: ItemAttributeDto[] = [
  {
    id: 'attr-001',
    code: 'color',
    name: 'Màu sắc',
    dataType: AttributeDataType.Select,
    options: ['Xanh Dương', 'Đỏ', 'Đen', 'Trắng', 'Vàng'],
    isRequired: false,
    isFilterable: true,
    sortOrder: 1
  },
  {
    id: 'attr-002',
    code: 'size',
    name: 'Kích cỡ / Quy cách',
    dataType: AttributeDataType.Select,
    options: ['0.5mm', '0.7mm', 'A4', 'A3', 'S', 'M', 'L', 'XL'],
    isRequired: false,
    isFilterable: true,
    sortOrder: 2
  },
  {
    id: 'attr-003',
    code: 'origin',
    name: 'Xuất xứ',
    dataType: AttributeDataType.Text,
    options: [],
    isRequired: false,
    isFilterable: true,
    sortOrder: 3
  },
  {
    id: 'attr-004',
    code: 'warranty_months',
    name: 'Thời hạn bảo hành',
    dataType: AttributeDataType.Number,
    options: [],
    unit: 'tháng',
    isRequired: false,
    isFilterable: true,
    sortOrder: 4
  }
];

@Injectable({
  providedIn: 'root'
})
export class ItemService {
  private readonly apiUrl = 'http://localhost:5000/api/v1/items';
  private readonly attributesApiUrl = 'http://localhost:5000/api/v1/wms/item-attributes';

  // Signals
  public items = signal<ItemDto[]>([]);
  public attributes = signal<ItemAttributeDto[]>(DEFAULT_ATTRIBUTES);
  public isLoading = signal<boolean>(false);

  constructor(private http: HttpClient) {}

  public loadItems(keyword?: string): void {
    this.isLoading.set(true);
    const url = keyword ? `${this.apiUrl}?keyword=${encodeURIComponent(keyword)}` : this.apiUrl;

    this.http.get<{ success: boolean; data: PagedResult<ItemDto> }>(url)
      .subscribe({
        next: (res) => {
          if (res && res.success && res.data) {
            this.items.set(res.data.items);
          }
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to load items:', err);
          this.isLoading.set(false);
        }
      });
  }

  public loadAttributes(categoryId?: string): void {
    const url = categoryId
      ? `${this.attributesApiUrl}/by-category/${categoryId}`
      : `${this.attributesApiUrl}/by-category`;

    this.http.get<{ success: boolean; data: ItemAttributeDto[] }>(url)
      .pipe(
        catchError(() => of({ success: true, data: DEFAULT_ATTRIBUTES }))
      )
      .subscribe({
        next: (res) => {
          if (res && res.data && res.data.length > 0) {
            this.attributes.set(res.data);
          } else {
            this.attributes.set(DEFAULT_ATTRIBUTES);
          }
        }
      });
  }

  public createItem(request: CreateItemRequest): Observable<ItemDto> {
    return this.http.post<{ success: boolean; data: ItemDto }>(this.apiUrl, request)
      .pipe(
        map(res => res.data),
        tap(() => this.loadItems())
      );
  }
}
