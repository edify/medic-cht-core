import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'bytes',
  standalone: true
})
export class BytesPipe implements PipeTransform {
  transform(bytes: number, precision = 1): string {
    if (Number.isNaN(Number.parseFloat(String(bytes))) || !Number.isFinite(bytes) || bytes === 0) {
      return '< 1 kB';
    }
    const units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, Math.floor(index))).toFixed(precision) + ' ' + units[index];
  }
}
