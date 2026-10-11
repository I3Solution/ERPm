import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, map, tap } from 'rxjs';

export interface WarehouseDto {
  id: string;
  code: string;
  name: string;
  translations?: Record<string, string>;
  address?: string;
  isDefault: boolean;
}

export interface StockBalanceDto {
  warehouseId: string;
  warehouseName: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  barcode?: string;
  uomName?: string;
  quantityOnHand: number;
  averageCostPrice: number;
  totalValue: number;
  isLowStock: boolean;
}

export interface StockReceiptItemRequest {
  itemId: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateStockReceiptRequest {
  warehouseId: string;
  supplierId?: string;
  notes?: string;
  items: StockReceiptItemRequest[];
}

const MOCK_WAREHOUSES: WarehouseDto[] = [
  {
    id: '44444444-4444-4444-4444-444444444444',
    code: 'KHO-TONG',
    name: 'Kho Tổng Hà Nội',
    address: 'Số 1 Phố Huế, Hoàn Kiếm, Hà Nội',
    isDefault: true
  }
];

const MOCK_BALANCES: StockBalanceDto[] = [
  {
    warehouseId: '44444444-4444-4444-4444-444444444444',
    warehouseName: 'Kho Tổng Hà Nội',
    itemId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    itemCode: 'SP0001',
    itemName: 'Bút bi Thiên Long 0.5mm',
    barcode: '8935001812345',
    uomName: 'Cây',
    quantityOnHand: 250,
    averageCostPrice: 3200,
    totalValue: 800000,
    isLowStock: false
  },
  {
    warehouseId: '44444444-4444-4444-4444-444444444444',
    warehouseName: 'Kho Tổng Hà Nội',
    itemId: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    itemCode: 'SP0002',
    itemName: 'Giấy in Double A A4 70gsm',
    barcode: '8936002934567',
    uomName: 'Ram',
    quantityOnHand: 5,
    averageCostPrice: 62000,
    totalValue: 310000,
    isLowStock: true // Low stock alert! (min is 10)
  }
];

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private readonly apiUrl = 'http://localhost:5000/api/v1/stock';

  // Signals
  public warehouses = signal<WarehouseDto[]>(MOCK_WAREHOUSES);
  public balances = signal<StockBalanceDto[]>(MOCK_BALANCES);
  public isLoading = signal<boolean>(false);

  constructor(private http: HttpClient) {}

  public loadWarehouses(): void {
    this.http.get<{ success: boolean; data: WarehouseDto[] }>(`${this.apiUrl}/warehouses`)
      .pipe(catchError(() => of({ success: true, data: MOCK_WAREHOUSES })))
      .subscribe(res => {
        if (res && res.success && res.data) {
          this.warehouses.set(res.data);
        }
      });
  }

  public loadBalances(warehouseId?: string): void {
    this.isLoading.set(true);
    const url = warehouseId ? `${this.apiUrl}/balances?warehouseId=${warehouseId}` : `${this.apiUrl}/balances`;

    this.http.get<{ success: boolean; data: StockBalanceDto[] }>(url)
      .pipe(
        catchError(() => {
          const list = warehouseId
            ? MOCK_BALANCES.filter(b => b.warehouseId === warehouseId)
            : MOCK_BALANCES;
          return of({ success: true, data: list });
        })
      )
      .subscribe(res => {
        if (res && res.success && res.data) {
          this.balances.set(res.data);
        }
        this.isLoading.set(false);
      });
  }

  public createStockReceipt(request: CreateStockReceiptRequest): Observable<boolean> {
    return this.http.post<{ success: boolean; data: boolean }>(`${this.apiUrl}/receipts`, request)
      .pipe(
        map(res => res.data),
        tap(() => this.loadBalances(request.warehouseId)),
        catchError(() => {
          // Local fallback simulation
          for (const item of request.items) {
            const found = this.balances().find(b => b.itemId === item.itemId);
            if (found) {
              found.quantityOnHand += Number(item.quantity);
              found.averageCostPrice = Number(item.unitPrice);
              found.totalValue = found.quantityOnHand * found.averageCostPrice;
              found.isLowStock = found.quantityOnHand <= 10;
            }
          }
          this.balances.set([...this.balances()]);
          return of(true);
        })
      );
  }
}
