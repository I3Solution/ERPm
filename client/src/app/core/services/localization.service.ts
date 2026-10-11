import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';

export interface Language {
  code: string;
  name: string;
  flagIcon: string;
}

const DEFAULT_FALLBACK_DICTIONARY: Record<string, Record<string, string>> = {
  vi: {
    'common.app_name': 'ERPm - Quản trị Bán hàng & Tồn kho',
    'common.save': 'Lưu lại',
    'common.cancel': 'Hủy bỏ',
    'common.search': 'Tìm kiếm...',
    'common.create': 'Thêm mới',
    'common.edit': 'Chỉnh sửa',
    'common.delete': 'Xóa',
    'common.actions': 'Hành động',
    'common.status': 'Trạng thái',
    'common.active': 'Đang hoạt động',
    'common.inactive': 'Ngừng hoạt động',
    'common.loading': 'Đang tải dữ liệu...',
    'common.all': 'Tất cả',

    'menu.dashboard': 'Tổng quan',
    'menu.catalog': 'Sản phẩm (ITEM)',
    'menu.inventory': 'Kho hàng',
    'menu.sales': 'Bán hàng (POS)',
    'menu.partners': 'Khách hàng & Đối tác',
    'menu.accounting': 'Kế toán tài chính',
    'menu.reports': 'Báo cáo',
    'menu.settings': 'Cài đặt',

    'dashboard.today_sales': 'Doanh thu hôm nay',
    'dashboard.total_items': 'Tổng mặt hàng',
    'dashboard.low_stock': 'Cảnh báo tồn kho',
    'dashboard.recent_orders': 'Đơn hàng gần đây',
    'dashboard.top_selling': 'Top sản phẩm bán chạy',

    'catalog.item_code': 'Mã SKU',
    'catalog.barcode': 'Mã vạch / QR',
    'catalog.item_name': 'Tên sản phẩm (Tiếng Việt)',
    'catalog.item_name_en': 'Tên sản phẩm (Tiếng Anh)',
    'catalog.sale_price': 'Giá bán',
    'catalog.cost_price': 'Giá vốn',
    'catalog.uom': 'Đơn vị tính',
    'catalog.category': 'Danh mục',
    'catalog.create_title': 'Thêm mới Sản phẩm / Hàng hóa',
    'catalog.search_placeholder': 'Tìm theo mã, tên hoặc mã vạch...',
    'catalog.no_items': 'Chưa có sản phẩm nào. Nhấn "+ Thêm mới" để tạo.',

    'status.draft': 'Bản nháp',
    'status.posted': 'Đã ghi sổ',
    'status.cancelled': 'Đã hủy',

    'sales.title': 'Bán hàng (POS)',
    'sales.search_items': 'Tìm món hoặc quét mã vạch...',
    'sales.cart': 'Giỏ hàng',
    'sales.customer': 'Khách hàng',
    'sales.guest_customer': 'Khách lẻ',
    'sales.subtotal': 'Tạm tính',
    'sales.discount': 'Chiết khấu (đ)',
    'sales.total': 'Tổng thanh toán',
    'sales.pay_btn': 'Thanh toán & Xuất hóa đơn',
    'sales.checkout_title': 'Xác nhận Thanh toán',
    'sales.payment_method': 'Phương thức thanh toán',
    'sales.cash': 'Tiền mặt',
    'sales.bank_transfer': 'Chuyển khoản NH',
    'sales.credit': 'Ghi nợ',
    'sales.amount_paid': 'Tiền khách đưa',
    'sales.change_due': 'Tiền thối lại',
    'sales.confirm_payment': 'Hoàn tất đơn',
    'sales.clear_cart': 'Xóa giỏ',
    'sales.invoice_success': 'Hóa đơn đã tạo và ghi sổ Kế toán thành công!',
    'sales.print': 'In hóa đơn',
    'sales.close': 'Đóng',

    'inventory.title': 'Quản lý Tồn kho',
    'inventory.balances': 'Tồn kho Hiện thời',
    'inventory.warehouse': 'Kho hàng',
    'inventory.all_warehouses': 'Tất cả kho',
    'inventory.qty_on_hand': 'Số lượng tồn',
    'inventory.avg_cost': 'Giá vốn BQ',
    'inventory.total_value': 'Giá trị tồn kho',
    'inventory.low_stock': 'Cảnh báo sắp hết',
    'inventory.stock_in_btn': '+ Nhập kho hàng',
    'inventory.receipt_title': 'Phiếu Nhập kho',
    'inventory.supplier': 'Nhà cung cấp',
    'inventory.unit_cost': 'Đơn giá nhập',
    'inventory.quantity': 'Số lượng nhập',
    'inventory.save_receipt': 'Lưu & Cập nhật tồn kho',

    'partners.title': 'Khách hàng & Đối tác',
    'partners.customers': 'Khách hàng',
    'partners.suppliers': 'Nhà cung cấp',
    'partners.debt_balance': 'Công nợ hiện tại',
    'partners.phone': 'Số điện thoại',
    'partners.address': 'Địa chỉ',
    'partners.tax_code': 'Mã số thuế',
    'partners.create_title': 'Thêm Khách hàng / Nhà cung cấp mới',
    'partners.type': 'Loại đối tác',
    'partners.credit_limit': 'Hạn mức nợ'
  },
  en: {
    'common.app_name': 'ERPm - Sales & Inventory Management',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.search': 'Search...',
    'common.create': 'Create New',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.actions': 'Actions',
    'common.status': 'Status',
    'common.active': 'Active',
    'common.inactive': 'Inactive',
    'common.loading': 'Loading...',
    'common.all': 'All',

    'menu.dashboard': 'Dashboard',
    'menu.catalog': 'Items & Catalog',
    'menu.inventory': 'Inventory',
    'menu.sales': 'Sales & POS',
    'menu.partners': 'Partners & Customers',
    'menu.accounting': 'Accounting',
    'menu.reports': 'Reports',
    'menu.settings': 'Settings',

    'dashboard.today_sales': "Today's Sales",
    'dashboard.total_items': 'Total Items',
    'dashboard.low_stock': 'Low Stock Alert',
    'dashboard.recent_orders': 'Recent Orders',
    'dashboard.top_selling': 'Top Selling Products',

    'catalog.item_code': 'SKU Code',
    'catalog.barcode': 'Barcode / QR',
    'catalog.item_name': 'Item Name (Vietnamese)',
    'catalog.item_name_en': 'Item Name (English)',
    'catalog.sale_price': 'Sale Price',
    'catalog.cost_price': 'Cost Price',
    'catalog.uom': 'UoM',
    'catalog.category': 'Category',
    'catalog.create_title': 'Add New Item / Product',
    'catalog.search_placeholder': 'Search by code, name or barcode...',
    'catalog.no_items': 'No items found. Click "+ Create New" to add one.',

    'status.draft': 'Draft',
    'status.posted': 'Posted',
    'status.cancelled': 'Cancelled',

    'sales.title': 'Point of Sale (POS)',
    'sales.search_items': 'Search item or scan barcode...',
    'sales.cart': 'Order Cart',
    'sales.customer': 'Customer',
    'sales.guest_customer': 'Walk-in Customer',
    'sales.subtotal': 'Subtotal',
    'sales.discount': 'Discount',
    'sales.total': 'Total',
    'sales.pay_btn': 'Checkout & Invoice',
    'sales.checkout_title': 'Payment Checkout',
    'sales.payment_method': 'Payment Method',
    'sales.cash': 'Cash',
    'sales.bank_transfer': 'Bank Transfer',
    'sales.credit': 'On Credit',
    'sales.amount_paid': 'Amount Received',
    'sales.change_due': 'Change Due',
    'sales.confirm_payment': 'Complete Sale',
    'sales.clear_cart': 'Clear Cart',
    'sales.invoice_success': 'Invoice generated and posted to GL ledger successfully!',
    'sales.print': 'Print Receipt',
    'sales.close': 'Close',

    'inventory.title': 'Inventory Management',
    'inventory.balances': 'Current Stock Balances',
    'inventory.warehouse': 'Warehouse',
    'inventory.all_warehouses': 'All Warehouses',
    'inventory.qty_on_hand': 'Qty On Hand',
    'inventory.avg_cost': 'Avg Cost',
    'inventory.total_value': 'Stock Value',
    'inventory.low_stock': 'Low Stock Alert',
    'inventory.stock_in_btn': '+ Stock Receipt In',
    'inventory.receipt_title': 'New Stock Receipt',
    'inventory.supplier': 'Supplier',
    'inventory.unit_cost': 'Unit Cost',
    'inventory.quantity': 'Quantity',
    'inventory.save_receipt': 'Save & Update Stock',

    'partners.title': 'Partners & Customers',
    'partners.customers': 'Customers',
    'partners.suppliers': 'Suppliers',
    'partners.debt_balance': 'Current Debt Balance',
    'partners.phone': 'Phone',
    'partners.address': 'Address',
    'partners.tax_code': 'Tax Code',
    'partners.create_title': 'Add New Partner',
    'partners.type': 'Partner Type',
    'partners.credit_limit': 'Credit Limit'
  }
};

@Injectable({
  providedIn: 'root'
})
export class LocalizationService {
  private readonly apiUrl = 'http://localhost:5000/api/v1/localization';
  private readonly STORAGE_KEY = 'erpm_lang';

  // Signals
  public currentLang = signal<'vi' | 'en'>(
    (localStorage.getItem(this.STORAGE_KEY) as 'vi' | 'en') || 'vi'
  );

  public dictionary = signal<Record<string, string>>(
    DEFAULT_FALLBACK_DICTIONARY[this.currentLang()] || {}
  );

  public availableLanguages = signal<Language[]>([
    { code: 'vi', name: 'Tiếng Việt', flagIcon: '🇻🇳' },
    { code: 'en', name: 'English', flagIcon: '🇺🇸' }
  ]);

  constructor(private http: HttpClient) {
    this.loadDictionary(this.currentLang());
  }

  public setLanguage(lang: 'vi' | 'en'): void {
    if (this.currentLang() === lang) return;
    this.currentLang.set(lang);
    localStorage.setItem(this.STORAGE_KEY, lang);
    this.loadDictionary(lang);
  }

  public translate(key: string, defaultValue?: string): string {
    const dict = this.dictionary();
    return dict[key] ?? defaultValue ?? key;
  }

  private loadDictionary(lang: string): void {
    // 1. First set local fallback
    const fallback = DEFAULT_FALLBACK_DICTIONARY[lang] || {};
    this.dictionary.set({ ...fallback });

    // 2. Fetch from backend to sync fresh translations
    this.http.get<{ success: boolean; data: { entries: Record<string, string> } }>(`${this.apiUrl}/${lang}`)
      .pipe(
        catchError(() => of(null))
      )
      .subscribe(res => {
        if (res && res.success && res.data && res.data.entries) {
          this.dictionary.set({
            ...fallback,
            ...res.data.entries
          });
        }
      });
  }
}
