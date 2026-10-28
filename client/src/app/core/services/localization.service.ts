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
    /* Common */
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
    'common.select_placeholder': 'Chọn một mục...',
    'common.saving': 'Đang lưu...',

    /* Menu */
    'menu.dashboard': 'Tổng quan',
    'menu.catalog': 'Sản phẩm (ITEM)',
    'menu.inventory': 'Kho hàng',
    'menu.sales': 'Bán hàng (POS)',
    'menu.partners': 'Khách hàng & Đối tác',
    'menu.accounting': 'Kế toán tài chính',
    'menu.reports': 'Báo cáo',
    'menu.settings': 'Cài đặt',

    /* Multi-Branch */
    'branch.all_system': 'Toàn hệ thống (Tất cả chi nhánh)',
    'branch.all_system_desc': 'Xem tổng hợp số liệu từ toàn bộ công ty & các đơn vị thành viên',
    'branch.select_branch': 'Chọn chi nhánh',
    'branch.search_placeholder': 'Tìm tên, mã chi nhánh hoặc địa chỉ...',
    'branch.sub_level': 'cấp con',
    'branch.direct_parent': 'Trực thuộc',
    'branch.filter_hint': 'Khi chọn chi nhánh, hệ thống sẽ lọc dữ liệu của chi nhánh đó & các con trực thuộc.',
    'branch.headquarter': 'Trụ sở chính',

    /* Table General */
    'table.item_code': 'Mã SKU',
    'table.item_name': 'Tên sản phẩm',
    'table.barcode': 'Mã vạch',
    'table.uom': 'ĐVT',
    'table.warehouse': 'Kho lưu trữ',
    'table.qty': 'Số lượng',
    'table.price': 'Đơn giá',
    'table.amount': 'Thành tiền',
    'table.status': 'Trạng thái',
    'table.total_items': 'Tổng số bản ghi',
    'table.showing': 'Hiển thị',
    'table.stable': 'Ổn định',
    'table.low_stock': 'Sắp hết',
    'table.actions': 'Thao tác',
    'table.all': 'Tất cả',

    /* Dashboard */
    'dashboard.today_sales': 'Doanh thu hôm nay',
    'dashboard.total_items': 'Tổng mặt hàng',
    'dashboard.low_stock': 'Cảnh báo tồn kho',
    'dashboard.recent_orders': 'Đơn hàng gần đây',
    'dashboard.top_selling': 'Top sản phẩm bán chạy',
    'dashboard.refresh': 'Làm mới số liệu',
    'dashboard.subtitle': 'Hệ thống Quản trị Bán hàng, Tồn kho & Kế toán mở rộng ERPm',
    'dashboard.invoices_today': 'hóa đơn hôm nay',
    'dashboard.inventory_value_prefix': 'Trị giá kho:',
    'dashboard.need_create_receipt': 'Cần tạo phiếu nhập kho',
    'dashboard.accounting_journal': 'Sổ Cái Kế toán',
    'dashboard.entries_unit': 'bút toán',
    'dashboard.customer_debt_prefix': 'Công nợ KH:',
    'dashboard.quick_actions': 'Thao tác Nghiệp vụ Nhanh',
    'dashboard.action_catalog': 'Quản lý Sản phẩm',
    'dashboard.action_catalog_desc': 'Danh mục, bảng giá',
    'dashboard.action_pos': 'Tạo Hóa đơn (POS)',
    'dashboard.action_pos_desc': 'Thu ngân chạm nhanh',
    'dashboard.action_stock_in': 'Nhập kho Hàng',
    'dashboard.action_stock_in_desc': 'Phiếu nhập kho mới',
    'dashboard.action_partners': 'Sổ Khách hàng',
    'dashboard.action_partners_desc': 'Danh bạ & công nợ',
    'dashboard.action_stock_report': 'Báo cáo Tồn kho',
    'dashboard.action_stock_report_desc': 'Tồn kho theo thời gian',
    'dashboard.action_sales_history': 'Lịch sử Bán hàng',
    'dashboard.action_sales_history_desc': 'Hóa đơn & doanh thu',
    'dashboard.architecture_title': 'Kiến trúc & Công nghệ',
    'dashboard.connection_status': 'Trạng thái Kết nối',
    'dashboard.status_stable': 'Hoạt động ổn định',

    /* Catalog / Items */
    'catalog.title': 'Danh mục Sản phẩm & Dịch vụ',
    'catalog.subtitle': 'Quản lý danh mục hàng hóa, bảng giá bán, giá vốn và định mức tồn kho an toàn',
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
    'catalog.total_count': 'Tổng cộng:',
    'catalog.items_unit': 'mặt hàng',
    'catalog.retail_price': 'Giá bán lẻ:',
    'catalog.no_items_desc': 'Chưa có sản phẩm nào trong danh mục hoặc từ khóa tìm kiếm không khớp.',
    'catalog.add_first': '+ Thêm sản phẩm đầu tiên',
    'catalog.attributes': 'Thuộc tính mở rộng',
    'catalog.attributes_custom': 'Thuộc tính tùy chỉnh',

    /* Sales & POS */
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
    'sales.cart_empty': 'Giỏ hàng đang trống',
    'sales.cart_empty_hint': 'Nhấn vào sản phẩm bên trái để thêm',
    'sales.no_products_found': 'Không tìm thấy sản phẩm phù hợp.',

    /* Inventory */
    'inventory.title': 'Quản lý Tồn kho',
    'inventory.subtitle': 'Theo dõi số lượng tồn thời gian thực, cảnh báo tồn tối thiểu & nhập kho hàng hóa',
    'inventory.balances': 'Tồn kho Hiện thời',
    'inventory.warehouse': 'Kho hàng',
    'inventory.all_warehouses': 'Tất cả kho bãi',
    'inventory.qty_on_hand': 'Số lượng tồn',
    'inventory.avg_cost': 'Giá vốn BQ',
    'inventory.total_value': 'Giá trị tồn kho',
    'inventory.low_stock': 'Cảnh báo sắp hết',
    'inventory.stock_in_btn': '+ Nhập kho hàng',
    'inventory.receipt_title': 'Phiếu Nhập kho Hàng hóa',
    'inventory.supplier': 'Nhà cung cấp',
    'inventory.unit_cost': 'Đơn giá nhập',
    'inventory.quantity': 'Số lượng nhập',
    'inventory.save_receipt': 'Lưu & Cập nhật tồn kho',
    'inventory.total_items_in_stock': 'Tổng mặt hàng trong kho',
    'inventory.managed_across_branches': 'Đang quản lý trên toàn bộ chi nhánh',
    'inventory.total_stock_value': 'Tổng giá trị tồn kho',
    'inventory.avg_cost_note': 'Tính theo giá vốn bình quân tức thời',
    'inventory.low_stock_alert': 'Cảnh báo sắp hết hàng',
    'inventory.need_restock': 'Cần bổ sung nguồn hàng',
    'inventory.stock_safe': 'Tồn kho đều an toàn',
    'inventory.no_stock_data': 'Không tìm thấy dữ liệu tồn kho',
    'inventory.no_stock_desc': 'Không có bản ghi tồn kho nào khớp với điều kiện tìm kiếm hoặc kho được chọn.',
    'inventory.receipt_warehouse': 'Kho tiếp nhận',
    'inventory.select_supplier': '-- Chọn nhà cung ứng --',
    'inventory.select_item': '-- Chọn mặt hàng từ Danh mục --',
    'inventory.item_stock_in': 'Mặt hàng nhập kho',
    'inventory.receipt_notes': 'Ghi chú phiếu nhập',
    'inventory.receipt_notes_placeholder': 'VD: Nhập đợt 1 từ nhà cung ứng Ánh Dương',
    'inventory.search_placeholder': 'Tìm theo mã SKU, tên hàng hoặc barcode...',
    'inventory.records_count': 'vị trí kho',

    /* Partners */
    'partners.title': 'Khách hàng & Đối tác',
    'partners.subtitle': 'Quản lý danh bạ khách hàng, nhà cung ứng & theo dõi công nợ chi tiết',
    'partners.customers': 'Khách hàng',
    'partners.suppliers': 'Nhà cung cấp',
    'partners.debt_balance': 'Công nợ hiện tại',
    'partners.phone': 'Số điện thoại',
    'partners.address': 'Địa chỉ',
    'partners.tax_code': 'Mã số thuế',
    'partners.create_title': 'Thêm Khách hàng / Nhà cung cấp mới',
    'partners.type': 'Loại đối tác',
    'partners.credit_limit': 'Hạn mức nợ',
    'partners.total_partners': 'Tổng khách hàng & Nhà cung ứng',
    'partners.partners_count': 'đối tác',
    'partners.partners_desc': 'Khách hàng lẻ, Đại lý & Nhà cung cấp vật tư',
    'partners.total_debt': 'Tổng công nợ phải thu (KH)',
    'partners.total_debt_desc': 'Dư nợ tài khoản 131 từ các hóa đơn bán chịu',
    'partners.code': 'Mã đối tác',
    'partners.name': 'Tên đối tác / Doanh nghiệp',
    'partners.classification': 'Phân loại',
    'partners.no_partners': 'Không tìm thấy đối tác nào',
    'partners.no_partners_desc': 'Không có bản ghi đối tác nào phù hợp với bộ lọc hoặc từ khóa tìm kiếm.',
    'partners.add_new': '+ Thêm đối tác mới',
    'partners.search_placeholder': 'Tìm theo tên, SĐT, mã hoặc MST...',

    /* Statuses */
    'status.draft': 'Bản nháp',
    'status.posted': 'Đã ghi sổ',
    'status.cancelled': 'Đã hủy'
  },
  en: {
    /* Common */
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
    'common.select_placeholder': 'Select an option...',
    'common.saving': 'Saving...',

    /* Menu */
    'menu.dashboard': 'Dashboard',
    'menu.catalog': 'Items & Catalog',
    'menu.inventory': 'Inventory',
    'menu.sales': 'Sales & POS',
    'menu.partners': 'Partners & Customers',
    'menu.accounting': 'Accounting',
    'menu.reports': 'Reports',
    'menu.settings': 'Settings',

    /* Multi-Branch */
    'branch.all_system': 'Entire System (All Branches)',
    'branch.all_system_desc': 'Consolidated data across all company branches and units',
    'branch.select_branch': 'Select Branch',
    'branch.search_placeholder': 'Search by name, branch code or address...',
    'branch.sub_level': 'sub-branches',
    'branch.direct_parent': 'Under',
    'branch.filter_hint': 'Selecting a branch filters data including all descendant sub-branches.',
    'branch.headquarter': 'Headquarters',

    /* Table General */
    'table.item_code': 'SKU Code',
    'table.item_name': 'Item Name',
    'table.barcode': 'Barcode',
    'table.uom': 'UoM',
    'table.warehouse': 'Warehouse',
    'table.qty': 'Quantity',
    'table.price': 'Unit Price',
    'table.amount': 'Amount',
    'table.status': 'Status',
    'table.total_items': 'Total Records',
    'table.showing': 'Showing',
    'table.stable': 'Stable',
    'table.low_stock': 'Low Stock',
    'table.actions': 'Actions',
    'table.all': 'All',

    /* Dashboard */
    'dashboard.today_sales': "Today's Sales",
    'dashboard.total_items': 'Total Items',
    'dashboard.low_stock': 'Low Stock Alert',
    'dashboard.recent_orders': 'Recent Orders',
    'dashboard.top_selling': 'Top Selling Products',
    'dashboard.refresh': 'Refresh Metrics',
    'dashboard.subtitle': 'ERPm Extended Sales, Inventory & Accounting System',
    'dashboard.invoices_today': 'invoices today',
    'dashboard.inventory_value_prefix': 'Inventory Value:',
    'dashboard.need_create_receipt': 'Need to create stock receipt',
    'dashboard.accounting_journal': 'General Ledger',
    'dashboard.entries_unit': 'entries',
    'dashboard.customer_debt_prefix': 'Customer Debt:',
    'dashboard.quick_actions': 'Quick Operations',
    'dashboard.action_catalog': 'Product Catalog',
    'dashboard.action_catalog_desc': 'Categories, price list',
    'dashboard.action_pos': 'Create Invoice (POS)',
    'dashboard.action_pos_desc': 'Quick touch checkout',
    'dashboard.action_stock_in': 'Stock Receipt In',
    'dashboard.action_stock_in_desc': 'New stock receipt',
    'dashboard.action_partners': 'Customer Book',
    'dashboard.action_partners_desc': 'Directory & debts',
    'dashboard.action_stock_report': 'Stock Report',
    'dashboard.action_stock_report_desc': 'Realtime balances',
    'dashboard.action_sales_history': 'Sales History',
    'dashboard.action_sales_history_desc': 'Invoices & revenue',
    'dashboard.architecture_title': 'Architecture & Tech Stack',
    'dashboard.connection_status': 'Connection Status',
    'dashboard.status_stable': 'Operating stably',

    /* Catalog / Items */
    'catalog.title': 'Product & Service Catalog',
    'catalog.subtitle': 'Manage product catalog, sale prices, cost prices & safe stock levels',
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
    'catalog.total_count': 'Total:',
    'catalog.items_unit': 'items',
    'catalog.retail_price': 'Retail Price:',
    'catalog.no_items_desc': 'No products in catalog or search keyword did not match.',
    'catalog.add_first': '+ Add First Product',
    'catalog.attributes': 'Dynamic Attributes',
    'catalog.attributes_custom': 'Custom Attributes',

    /* Sales & POS */
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
    'sales.cart_empty': 'Cart is empty',
    'sales.cart_empty_hint': 'Click an item on the left to add to cart',
    'sales.no_products_found': 'No matching products found.',

    /* Inventory */
    'inventory.title': 'Inventory Management',
    'inventory.subtitle': 'Real-time stock tracking, minimum alert thresholds & warehouse stock-in',
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
    'inventory.total_items_in_stock': 'Total Items In Stock',
    'inventory.managed_across_branches': 'Managed across all branches',
    'inventory.total_stock_value': 'Total Inventory Value',
    'inventory.avg_cost_note': 'Calculated by real-time weighted average cost',
    'inventory.low_stock_alert': 'Low Stock Alert',
    'inventory.need_restock': 'Needs restock',
    'inventory.stock_safe': 'All stocks safe',
    'inventory.no_stock_data': 'No inventory data found',
    'inventory.no_stock_desc': 'No stock records match the selected warehouse or search filter.',
    'inventory.receipt_warehouse': 'Receiving Warehouse',
    'inventory.select_supplier': '-- Select Supplier --',
    'inventory.select_item': '-- Select Item from Catalog --',
    'inventory.item_stock_in': 'Item to Stock In',
    'inventory.receipt_notes': 'Receipt Notes',
    'inventory.receipt_notes_placeholder': 'E.g.: Batch 1 receipt from supplier',
    'inventory.search_placeholder': 'Search by SKU, item name or barcode...',
    'inventory.records_count': 'warehouse locations',

    /* Partners */
    'partners.title': 'Partners & Customers',
    'partners.subtitle': 'Manage customers, suppliers directory & detailed debt tracking',
    'partners.customers': 'Customers',
    'partners.suppliers': 'Suppliers',
    'partners.debt_balance': 'Current Debt Balance',
    'partners.phone': 'Phone',
    'partners.address': 'Address',
    'partners.tax_code': 'Tax Code',
    'partners.create_title': 'Add New Partner',
    'partners.type': 'Partner Type',
    'partners.credit_limit': 'Credit Limit',
    'partners.total_partners': 'Total Customers & Suppliers',
    'partners.partners_count': 'partners',
    'partners.partners_desc': 'Retail customers, agents & material suppliers',
    'partners.total_debt': 'Total Customer Debt Receivables',
    'partners.total_debt_desc': 'Account 131 balance from credit sales invoices',
    'partners.code': 'Partner Code',
    'partners.name': 'Partner / Company Name',
    'partners.classification': 'Classification',
    'partners.no_partners': 'No partners found',
    'partners.no_partners_desc': 'No partner records match the active filter or search keyword.',
    'partners.add_new': '+ Add New Partner',
    'partners.search_placeholder': 'Search by name, phone, code or tax ID...',

    /* Statuses */
    'status.draft': 'Draft',
    'status.posted': 'Posted',
    'status.cancelled': 'Cancelled'
  }
};

@Injectable({
  providedIn: 'root'
})
export class LocalizationService {
  private readonly apiUrl = 'http://localhost:5000/api/v1/localization';
  private readonly currentLangSignal = signal<'vi' | 'en'>('vi');

  // In-memory dual-dictionary cache for instant 0ms switching
  private inMemoryCache: Record<'vi' | 'en', Record<string, string>> = {
    vi: { ...DEFAULT_FALLBACK_DICTIONARY['vi'] },
    en: { ...DEFAULT_FALLBACK_DICTIONARY['en'] }
  };

  private readonly dictionarySignal = signal<Record<string, string>>(this.inMemoryCache['vi']);

  public currentLang = computed(() => this.currentLangSignal());
  public dictionary = computed(() => this.dictionarySignal());

  public languages = signal<Language[]>([
    { code: 'vi', name: 'Tiếng Việt', flagIcon: '🇻🇳' },
    { code: 'en', name: 'English', flagIcon: '🇺🇸' }
  ]);

  constructor(private http: HttpClient) {
    // 1. Hydrate memory cache from localStorage if previously stored
    this.hydrateFromStorage('vi');
    this.hydrateFromStorage('en');

    // 2. Read saved user language preference
    const savedLang = localStorage.getItem('erpm_lang') as 'vi' | 'en' | null;
    const initialLang: 'vi' | 'en' = (savedLang === 'vi' || savedLang === 'en') ? savedLang : 'vi';

    this.currentLangSignal.set(initialLang);
    this.dictionarySignal.set(this.inMemoryCache[initialLang]);

    // 3. Preload/Sync in background silently without blocking the UI
    this.syncBackground('vi');
    this.syncBackground('en');
  }

  /**
   * Switch language immediately (0ms instant UI update)
   */
  public setLanguage(lang: 'vi' | 'en'): void {
    if (this.currentLangSignal() === lang && Object.keys(this.dictionarySignal()).length > 0) {
      return;
    }

    this.currentLangSignal.set(lang);
    localStorage.setItem('erpm_lang', lang);

    // Synchronous immediate switch from in-memory cache (< 1ms)
    const activeDict = this.inMemoryCache[lang] || DEFAULT_FALLBACK_DICTIONARY[lang];
    this.dictionarySignal.set(activeDict);

    // Sync updates in background (Stale-While-Revalidate)
    this.syncBackground(lang);
  }

  public translate(key: string, defaultText?: string): string {
    const current = this.currentLangSignal();
    const activeDict = this.dictionarySignal();

    if (activeDict && activeDict[key]) {
      return activeDict[key];
    }

    const fallback = DEFAULT_FALLBACK_DICTIONARY[current];
    if (fallback && fallback[key]) {
      return fallback[key];
    }

    return defaultText || key;
  }

  private hydrateFromStorage(lang: 'vi' | 'en'): void {
    try {
      const stored = localStorage.getItem(`erpm_dict_${lang}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.inMemoryCache[lang] = { ...this.inMemoryCache[lang], ...parsed };
      }
    } catch {
      // Ignore parse errors, use in-memory fallback
    }
  }

  private lastSyncTime: Record<'vi' | 'en', number> = { vi: 0, en: 0 };
  private readonly SYNC_COOLDOWN_MS = 5 * 60 * 1000; // 5 phút cooldown tránh spam server

  private syncBackground(lang: 'vi' | 'en', force = false): void {
    const now = Date.now();
    // Bỏ qua nếu vừa mới đồng bộ trong vòng 5 phút (trừ khi ép buộc bằng force = true)
    if (!force && (now - this.lastSyncTime[lang] < this.SYNC_COOLDOWN_MS)) {
      return;
    }

    const fallback = DEFAULT_FALLBACK_DICTIONARY[lang] || DEFAULT_FALLBACK_DICTIONARY['vi'];
    this.http.get<{ success: boolean; data: Record<string, string> }>(`${this.apiUrl}/${lang}`)
      .pipe(
        catchError(() => of({ success: false, data: {} }))
      )
      .subscribe({
        next: (res) => {
          this.lastSyncTime[lang] = Date.now();
          if (res && res.data && Object.keys(res.data).length > 0) {
            const merged = { ...fallback, ...res.data };
            this.inMemoryCache[lang] = merged;

            // Lưu vào localStorage để tái sử dụng ngay khi mở lại tab/F5
            try {
              localStorage.setItem(`erpm_dict_${lang}`, JSON.stringify(res.data));
            } catch { }

            // Nếu người dùng đang đứng ở ngôn ngữ này, làm mới giao diện
            if (this.currentLangSignal() === lang) {
              this.dictionarySignal.set(merged);
            }
          }
        }
      });
  }

  /**
   * Gọi khi muốn ép buộc làm mới bản dịch từ Backend (ví dụ sau khi sửa từ điển trong Admin Cài đặt)
   */
  public forceRefreshTranslations(): void {
    this.syncBackground('vi', true);
    this.syncBackground('en', true);
  }
}
