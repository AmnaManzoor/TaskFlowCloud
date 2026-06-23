import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'initials',
})
export class InitialsPipe implements PipeTransform {
  transform(value: string | null | undefined, maxParts = 2): string {
    if (!value?.trim()) {
      return '';
    }

    return value
      .trim()
      .split(/\s+/)
      .slice(0, maxParts)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }
}
