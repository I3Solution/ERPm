import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ItemsComponent } from './pages/catalog/items.component';
import { PosComponent } from './pages/sales/pos.component';
import { InventoryComponent } from './pages/inventory/inventory.component';
import { PartnersComponent } from './pages/partners/partners.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'catalog', component: ItemsComponent },
  { path: 'sales', component: PosComponent },
  { path: 'inventory', component: InventoryComponent },
  { path: 'partners', component: PartnersComponent },
  { path: '**', redirectTo: 'dashboard' }
];
