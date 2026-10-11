import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, map, tap } from 'rxjs';

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
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
}

const MOCK_ITEMS: ItemDto[] = [
  {
    id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    code: 'SP0001',
    barcode: '8935001812345',
    name: 'Bút bi Thiên Long 0.5mm',
    translations: { vi: 'Bút bi Thiên Long 0.5mm', en: 'Thien Long Ballpoint Pen 0.5mm' },
    itemType: 1,
    categoryName: 'Văn phòng phẩm',
    baseUomId: '11111111-1111-1111-1111-111111111111',
    baseUomName: 'Cây',
    salePrice: 5000,
    costPrice: 3200,
    minStockAlert: 20,
    maxStockAlert: 500,
    isActive: true
  },
  {
    id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    code: 'SP0002',
    barcode: '8936002934567',
    name: 'Giấy in Double A A4 70gsm',
    translations: { vi: 'Giấy in Double A A4 70gsm', en: 'Double A Paper A4 70gsm' },
    itemType: 1,
    categoryName: 'Văn phòng phẩm',
    baseUomId: '22222222-2222-2222-2222-222222222222',
    baseUomName: 'Ram',
    salePrice: 78000,
    costPrice: 62000,
    minStockAlert: 10,
    maxStockAlert: 200,
    isActive: true
  },
  {
    id: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
    code: 'DV0001',
    barcode: '',
    name: 'Dịch vụ giao hàng tận nơi',
    translations: { vi: 'Dịch vụ giao hàng tận nơi', en: 'Door-to-door Delivery Service' },
    itemType: 2,
    categoryName: 'Dịch vụ',
    baseUomId: '33333333-3333-3333-3333-333333333333',
    baseUomName: 'Lượt',
    salePrice: 30000,
    costPrice: 0,
    minStockAlert: 0,
    maxStockAlert: 0,
    isActive: true
  }
];

@Injectable({
  providedIn: 'root'
})
export class ItemService {
  private readonly apiUrl = 'http://localhost:5000/api/v1/items';

  // Signals
  public items = signal<ItemDto[]>(MOCK_ITEMS);
  public isLoading = signal<boolean>(false);

  constructor(private http: HttpClient) {}

  public loadItems(keyword?: string): void {
    this.isLoading.set(true);
    const url = keyword ? `${this.apiUrl}?keyword=${encodeURIComponent(keyword)}` : this.apiUrl;

    this.http.get<{ success: boolean; data: PagedResult<ItemDto> }>(url)
      .pipe(
        catchError(() => {
          // If backend isn't running yet, filter from mock data
          const filtered = keyword
            ? MOCK_ITEMS.filter(i =>
                i.name.toLowerCase().includes(keyword.toLowerCase()) ||
                i.code.toLowerCase().includes(keyword.toLowerCase()) ||
                (i.barcode && i.barcode.includes(keyword)))
            : MOCK_ITEMS;
          return of({ success: true, data: { items: filtered, totalCount: filtered.length, pageIndex: 1, pageSize: 20, totalPages: 1 } });
        })
      )
      .subscribe(res => {
        if (res && res.success && res.data) {
          this.items.set(res.data.items);
        }
        this.isLoading.set(false);
      });
  }

  public createItem(request: CreateItemRequest): Observable<ItemDto> {
    return this.http.post<{ success: boolean; data: ItemDto }>(this.apiUrl, request)
      .pipe(
        map(res => res.data),
        catchError(() => {
          // Local fallback creation
          const newItem: ItemDto = {
            id: crypto.randomUUID(),
            code: request.code,
            barcode: request.barcode,
            name: request.name,
            translations: request.translations || { vi: request.name },
            itemType: request.itemType,
            baseUomId: request.baseUomId,
            baseUomName: 'Cái',
            salePrice: request.salePrice,
            costPrice: request.costPrice,
            minStockAlert: request.minStockAlert,
            maxStockAlert: request.maxStockAlert,
            description: request.description,
            isActive: true
          };
          MOCK_ITEMS.unshift(newItem);
          this.items.set([...MOCK_ITEMS]);
          return of(newItem);
        }),
        tap(() => this.loadItems())
      );
  }
}
