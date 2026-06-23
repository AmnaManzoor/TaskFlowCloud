import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.open(message, 'success-snackbar', 4000);
  }

  error(message: string): void {
    this.open(message, 'error-snackbar', 6000);
  }

  info(message: string): void {
    this.open(message, 'info-snackbar', 4000);
  }

  warning(message: string): void {
    this.open(message, 'warning-snackbar', 5000);
  }

  private open(message: string, panelClass: string, duration: number): void {
    this.snackBar.open(message, 'Close', {
      duration,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [panelClass],
    });
  }
}
