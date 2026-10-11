import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, map, tap } from 'rxjs';

export enum PaymentMethod {
  Cash = 1,
  BankTransfer = 2,
  Credit = 3
}

export interface SalesInvoiceItemRequest {
  itemId: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
}

export interface CreateSalesInvoiceRequest {
  customerId?: string;
  customerName?: string;
  warehouseId: string;
  paymentMethod: PaymentMethod;
  discountAmount?: number;
  paidAmount?: number;
  notes?: string;
  items: SalesInvoiceItemRequest[];
}

export interface SalesInvoiceItemDto {
  itemId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface SalesInvoiceDto {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  paymentMethodName: string;
  subTotal: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingDebt: number;
  items: SalesInvoiceItemDto[];
}

const MOCK_INVOICES: SalesInvoiceDto[] = [
  {
    id: 'e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b',
    invoiceNumber: 'HD-20261011-0001',
    invoiceDate: new Date().toISOString(),
    customerName: 'Khách lẻ',
    paymentMethodName: 'Tiền mặt',
    subTotal: 156000,
    discountAmount: 0,
    totalAmount: 156000,
    paidAmount: 156000,
    remainingDebt: 0,
    items: [
      {
        itemId: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
        itemCode: 'SP0002',
        itemName: 'Giấy in Double A A4 70gsm',
        quantity: 2,
        unitPrice: 78000,
        amount: 156000
      }
    ]
  }
];

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  private readonly apiUrl = 'http://localhost:5000/api/v1/sales';

  public invoices = signal<SalesInvoiceDto[]>(MOCK_INVOICES);
  public isLoading = signal<boolean>(false);

  constructor(private http: HttpClient) {}

  public loadInvoices(): void {
    this.isLoading.set(true);
    this.http.get<{ success: boolean; data: SalesInvoiceDto[] }>(`${this.apiUrl}/invoices`)
      .pipe(catchError(() => of({ success: true, data: MOCK_INVOICES })))
      .subscribe(res => {
        if (res && res.success && res.data) {
          this.invoices.set(res.data);
        }
        this.isLoading.set(false);
      });
  }

  public checkout(request: CreateSalesInvoiceRequest): Observable<SalesInvoiceDto> {
    return this.http.post<{ success: boolean; data: SalesInvoiceDto }>(`${this.apiUrl}/pos-checkout`, request)
      .pipe(
        map(res => res.data),
        tap(created => {
          this.invoices.set([created, ...this.invoices()]);
        }),
        catchError(() => {
          // Local fallback creation
          const subTotal = request.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
          const discount = request.discountAmount || 0;
          const totalAmount = Math.max(0, subTotal - discount);
          const paidAmount = request.paidAmount !== undefined ? request.paidAmount : totalAmount;
          const remainingDebt = Math.max(0, totalAmount - paidAmount);

          const methodMap: Record<number, string> = {
            1: 'Tiền mặt',
            2: 'Chuyển khoản NH',
            3: 'Ghi nợ'
          };

          const invoice: SalesInvoiceDto = {
            id: crypto.randomUUID(),
            invoiceNumber: `HD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
            invoiceDate: new Date().toISOString(),
            customerName: request.customerName || 'Khách lẻ',
            paymentMethodName: methodMap[request.paymentMethod] || 'Tiền mặt',
            subTotal,
            discountAmount: discount,
            totalAmount,
            paidAmount,
            remainingDebt,
            items: request.items.map(i => ({
              itemId: i.itemId,
              itemCode: 'SKU',
              itemName: 'Sản phẩm',
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              amount: i.quantity * i.unitPrice
            }))
          };

          this.invoices.set([invoice, ...this.invoices()]);
          return of(invoice);
        })
      );
  }
}
