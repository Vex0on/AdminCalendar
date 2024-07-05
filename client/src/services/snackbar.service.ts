import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class SnackbarService {

  constructor(private snackBar: MatSnackBar) { }

  openSuccess(message: string) {
    this.openSnackbar(message, 'OK', 'success-snackbar');
  }

  openError(message: string) {
    this.openSnackbar(message, 'Spróbuj ponownie!', 'failure-snackbar');
  }

  private openSnackbar(message: string, action: string, panelClass: string) {
    this.snackBar.open(message, action, {
      duration: 10000,
      panelClass: [panelClass],
    });
  }
}
