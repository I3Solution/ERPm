import { Component, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { DashboardService } from '../../core/services/dashboard.service';
import { BranchService } from '../../core/services/branch.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  public dashboardService = inject(DashboardService);
  public branchService = inject(BranchService);

  constructor() {
    effect(() => {
      const branchId = this.branchService.getActiveBranchIdForQuery();
      this.dashboardService.loadMetrics(branchId);
    });
  }
}
