import { Pipe, PipeTransform } from '@angular/core';
import { LocalizationService } from '../../core/services/localization.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false // Ensure changes update immediately when signal changes
})
export class TranslatePipe implements PipeTransform {
  constructor(private localizationService: LocalizationService) {}

  transform(key: string, defaultValue?: string): string {
    return this.localizationService.translate(key, defaultValue);
  }
}
