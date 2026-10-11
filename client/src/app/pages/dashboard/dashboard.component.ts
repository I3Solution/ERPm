import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { DashboardService } from '../../core/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  template: `
    <div class="dashboard-container">
      <!-- Welcome Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900">
            {{ 'menu.dashboard' | translate }}
          </h1>
          <p class="text-sm text-slate-500 mt-1">
            Hệ thống Quản trị Bán hàng, Tồn kho & Kế toán mở rộng ERPm
          </p>
        </div>
        <button
          type="button"
          (click)="dashboardService.loadMetrics()"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
        >
          🔄 Làm mới
        </button>
      </div>

      <!-- KPI Stat Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <!-- Card 1: Today's Sales -->
        <div class="erpm-card border-l-4 border-l-indigo-600">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {{ 'dashboard.today_sales' | translate }}
              </p>
              <h3 class="text-2xl font-bold text-slate-900 mt-1">
                {{ dashboardService.metrics().todaySales | number:'1.0-0' }} đ
              </h3>
              <span class="inline-flex items-center text-xs font-medium text-emerald-600 mt-1">
                {{ dashboardService.metrics().todayInvoiceCount }} hóa đơn hôm nay
              </span>
            </div>
            <div class="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg font-bold">
              💰
            </div>
          </div>
        </div>

        <!-- Card 2: Total Items -->
        <div class="erpm-card border-l-4 border-l-emerald-600">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {{ 'dashboard.total_items' | translate }}
              </p>
              <h3 class="text-2xl font-bold text-slate-900 mt-1">
                {{ dashboardService.metrics().totalItems }} SKU
              </h3>
              <span class="inline-flex items-center text-xs font-medium text-slate-500 mt-1">
                Trị giá kho: {{ dashboardService.metrics().totalInventoryValue | number:'1.0-0' }} đ
              </span>
            </div>
            <div class="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg font-bold">
              📦
            </div>
          </div>
        </div>

        <!-- Card 3: Low Stock Alert -->
        <div class="erpm-card border-l-4 border-l-amber-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {{ 'dashboard.low_stock' | translate }}
              </p>
              <h3 class="text-2xl font-bold text-amber-600 mt-1">
                {{ dashboardService.metrics().lowStockCount }} mặt hàng
              </h3>
              <span class="inline-flex items-center text-xs font-medium text-amber-600 mt-1">
                Cần tạo phiếu nhập kho
              </span>
            </div>
            <div class="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-lg font-bold">
              ⚠️
            </div>
          </div>
        </div>

        <!-- Card 4: Accounting Journal -->
        <div class="erpm-card border-l-4 border-l-sky-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Sổ Cái Kế toán
              </p>
              <h3 class="text-2xl font-bold text-slate-900 mt-1">
                {{ dashboardService.metrics().totalJournalEntries }} bút toán
              </h3>
              <span class="inline-flex items-center text-xs font-medium text-sky-600 mt-1">
                Công nợ KH: {{ dashboardService.metrics().totalCustomerDebt | number:'1.0-0' }} đ
              </span>
            </div>
            <div class="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center text-lg font-bold">
              📑
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Shortcuts & Recent Activity -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left: Quick Action Cards -->
        <div class="erpm-card lg:col-span-2">
          <h2 class="text-base font-semibold text-slate-900 mb-4">Thao tác Nhanh</h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <a routerLink="/catalog" class="shortcut-btn bg-indigo-50 hover:bg-indigo-100 text-indigo-700">
              <span class="text-2xl mb-1">🏷️</span>
              <span class="font-semibold text-xs">Quản lý Sản phẩm</span>
            </a>
            <a routerLink="/sales" class="shortcut-btn bg-emerald-50 hover:bg-emerald-100 text-emerald-700">
              <span class="text-2xl mb-1">🛒</span>
              <span class="font-semibold text-xs">Tạo Hóa đơn (POS)</span>
            </a>
            <a routerLink="/inventory" class="shortcut-btn bg-amber-50 hover:bg-amber-100 text-amber-700">
              <span class="text-2xl mb-1">📥</span>
              <span class="font-semibold text-xs">Nhập kho Hàng</span>
            </a>
            <a routerLink="/partners" class="shortcut-btn bg-purple-50 hover:bg-purple-100 text-purple-700">
              <span class="text-2xl mb-1">👥</span>
              <span class="font-semibold text-xs">Sổ Khách hàng</span>
            </a>
            <a routerLink="/inventory" class="shortcut-btn bg-sky-50 hover:bg-sky-100 text-sky-700">
              <span class="text-2xl mb-1">📊</span>
              <span class="font-semibold text-xs">Báo cáo Tồn kho</span>
            </a>
            <a routerLink="/sales" class="shortcut-btn bg-rose-50 hover:bg-rose-100 text-rose-700">
              <span class="text-2xl mb-1">📖</span>
              <span class="font-semibold text-xs">Lịch sử Bán hàng</span>
            </a>
          </div>
        </div>

        <!-- Right: System Architecture Status -->
        <div class="erpm-card">
          <h2 class="text-base font-semibold text-slate-900 mb-3">Kiến trúc Hệ thống</h2>
          <ul class="text-xs space-y-3 text-slate-600">
            <li class="flex items-center justify-between pb-2 border-b border-slate-100">
              <span class="font-medium">Backend API</span>
              <span class="badge-active">.NET 8 Clean Arch</span>
            </li>
            <li class="flex items-center justify-between pb-2 border-b border-slate-100">
              <span class="font-medium">Cơ sở Dữ liệu</span>
              <span class="badge-active">PostgreSQL 16</span>
            </li>
            <li class="flex items-center justify-between pb-2 border-b border-slate-100">
              <span class="font-medium">Frontend Framework</span>
              <span class="badge-active">Angular 18 Standalone</span>
            </li>
            <li class="flex items-center justify-between pb-2 border-b border-slate-100">
              <span class="font-medium">Hybrid Mobile</span>
              <span class="badge-active">Ionic 8 + Capacitor</span>
            </li>
            <li class="flex items-center justify-between">
              <span class="font-medium">Đa ngôn ngữ</span>
              <span class="badge-active">Tiếng Việt & English</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }
    .grid { display: grid; }
    .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
    .gap-4 { gap: 1rem; }
    .gap-6 { gap: 1.5rem; }
    .gap-3 { gap: 0.75rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    .mb-4 { margin-bottom: 1rem; }
    .mb-3 { margin-bottom: 0.75rem; }
    .mt-1 { margin-top: 0.25rem; }
    .flex { display: flex; }
    .items-center { align-items: center; }
    .justify-between { justify-content: space-between; }
    .font-bold { font-weight: 700; }
    .font-semibold { font-weight: 600; }
    .font-medium { font-weight: 500; }
    .text-2xl { font-size: 1.5rem; line-height: 2rem; }
    .text-base { font-size: 1rem; line-height: 1.5rem; }
    .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
    .text-xs { font-size: 0.75rem; line-height: 1rem; }
    .space-y-3 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.625rem; }
    .border-l-4 { border-left-width: 4px; }
    .border-l-indigo-600 { border-left-color: #4f46e5; }
    .border-l-emerald-600 { border-left-color: #10b981; }
    .border-l-amber-500 { border-left-color: #f59e0b; }
    .border-l-sky-500 { border-left-color: #0284c7; }
    .text-slate-900 { color: #0f172a; }
    .text-slate-500 { color: #64748b; }
    .text-slate-600 { color: #475569; }
    .text-indigo-600 { color: #4f46e5; }
    .text-emerald-600 { color: #10b981; }
    .text-amber-600 { color: #d97706; }
    .text-sky-600 { color: #0284c7; }
    .bg-indigo-50 { background-color: #eef2ff; }
    .bg-emerald-50 { background-color: #ecfdf5; }
    .bg-amber-50 { background-color: #fffbeb; }
    .bg-sky-50 { background-color: #f0f9ff; }
    .bg-purple-50 { background-color: #faf5ff; }
    .bg-rose-50 { background-color: #fff1f2; }
    .w-10 { width: 2.5rem; }
    .h-10 { height: 2.5rem; }
    .rounded-lg { border-radius: 0.5rem; }

    .shortcut-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1.25rem 0.75rem;
      border-radius: 12px;
      text-decoration: none;
      transition: all 0.2s ease;
      text-align: center;
    }
    .shortcut-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }

    @media (min-width: 768px) {
      .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .sm\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }
    @media (min-width: 1024px) {
      .lg\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .lg\\:grid-cols-3 { grid-template-columns: 2fr 1fr; }
      .lg\\:col-span-2 { grid-column: span 1 / span 1; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  public dashboardService = inject(DashboardService);

  ngOnInit(): void {
    this.dashboardService.loadMetrics();
  }
}
