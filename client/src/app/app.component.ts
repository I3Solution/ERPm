import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from './shared/pipes/translate.pipe';
import { LocalizationService } from './core/services/localization.service';

import { BranchTreeSelectComponent } from './shared/components/branch-tree-select/branch-tree-select.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
    BranchTreeSelectComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(private localizationService: LocalizationService) {}

  public get currentLang() {
    return this.localizationService.currentLang;
  }

  public setLanguage(lang: 'vi' | 'en'): void {
    this.localizationService.setLanguage(lang);
  }
}
