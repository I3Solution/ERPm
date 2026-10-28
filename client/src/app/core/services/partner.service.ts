import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, map, tap } from 'rxjs';

export enum PartnerType {
  Customer = 1,
  Vendor = 2,
  Both = 3
}

export interface PartnerDto {
  id: string;
  code: string;
  name: string;
  partnerType: PartnerType;
  phone?: string;
  email?: string;
  address?: string;
  taxCode?: string;
  creditLimit: number;
  debtBalance: number;
  isActive: boolean;
}

export interface CreatePartnerRequest {
  code: string;
  name: string;
  partnerType: PartnerType;
  phone?: string;
  email?: string;
  address?: string;
  taxCode?: string;
  creditLimit: number;
  notes?: string;
}

const MOCK_PARTNERS: PartnerDto[] = [
  {
    id: '66666666-6666-6666-6666-666666666666',
    code: 'KH0001',
    name: 'Công ty TNHH Giải pháp Minh Khang',
    partnerType: PartnerType.Customer,
    phone: '0901234567',
    email: 'contact@minhkhang.vn',
    address: '123 Cầu Giấy, Hà Nội',
    taxCode: '0101234567',
    creditLimit: 50000000,
    debtBalance: 12500000,
    isActive: true
  },
  {
    id: '77777777-7777-7777-7777-777777777777',
    code: 'NCC0001',
    name: 'Nhà cung ứng Văn phòng phẩm Ánh Dương',
    partnerType: PartnerType.Vendor,
    phone: '0988765432',
    email: 'kinhdoanh@anhduong.vn',
    address: '45 Hai Bà Trưng, Hà Nội',
    taxCode: '0109876543',
    creditLimit: 100000000,
    debtBalance: 0,
    isActive: true
  }
];

@Injectable({
  providedIn: 'root'
})
export class PartnerService {
  private readonly apiUrl = 'http://localhost:5000/api/v1/partners';

  public partners = signal<PartnerDto[]>([]);
  public isLoading = signal<boolean>(false);

  constructor(private http: HttpClient) {}

  public loadPartners(): void {
    this.isLoading.set(true);
    this.http.get<{ success: boolean; data: PartnerDto[] }>(this.apiUrl)
      .subscribe({
        next: (res) => {
          if (res && res.success && res.data) {
            this.partners.set(res.data);
          }
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Lỗi khi tải danh sách đối tác:', err);
          this.isLoading.set(false);
        }
      });
  }

  public createPartner(request: CreatePartnerRequest): Observable<PartnerDto> {
    return this.http.post<{ success: boolean; data: PartnerDto }>(this.apiUrl, request)
      .pipe(
        map(res => res.data),
        tap(created => {
          this.partners.set([created, ...this.partners()]);
        })
      );
  }
}
