import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';

export interface TopSellingItemDto {
  itemCode: string;
  itemName: string;
  quantitySold: number;
  revenue: number;
}

export interface DashboardMetricsDto {
  todaySales: number;
  todayInvoiceCount: number;
  totalItems: number;
  lowStockCount: number;
  totalJournalEntries: number;
  totalInventoryValue: number;
  totalCustomerDebt: number;
  topSellingItems: TopSellingItemDto[];
}

const MOCK_METRICS: DashboardMetricsDto = {
  todaySales: 18450000,
  todayInvoiceCount: 14,
  totalItems: 3,
  lowStockCount: 1,
  totalJournalEntries: 36,
  totalInventoryValue: 1110000,
  totalCustomerDebt: 12500000,
  topSellingItems: [
    {
      itemCode: 'SP0002',
      itemName: 'Giấy in Double A A4 70gsm',
      quantitySold: 28,
      revenue: 2184000
    },
    {
      itemCode: 'SP0001',
      itemName: 'Bút bi Thiên Long 0.5mm',
      quantitySold: 120,
      revenue: 600000
    }
  ]
};

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly apiUrl = 'http://localhost:5000/api/v1/dashboard/metrics';

  public metrics = signal<DashboardMetricsDto>(MOCK_METRICS);
  public isLoading = signal<boolean>(false);

  constructor(private http: HttpClient) {}

  public loadMetrics(branchId?: string | null): void {
    this.isLoading.set(true);
    const url = branchId ? `${this.apiUrl}?branchId=${branchId}` : this.apiUrl;
    this.http.get<{ success: boolean; data: DashboardMetricsDto }>(url)
      .pipe(catchError(() => of({ success: true, data: MOCK_METRICS })))
      .subscribe(res => {
        if (res && res.success && res.data) {
          this.metrics.set(res.data);
        }
        this.isLoading.set(false);
      });
  }
}
