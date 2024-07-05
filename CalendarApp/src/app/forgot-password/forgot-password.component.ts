import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { SnackbarService } from '../../services/snackbar.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, HttpClientModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  forgotData = {
    email: '',
  };

  constructor(private http: HttpClient, private router: Router, private snackbarService: SnackbarService) {}

  forgot() {
    this.http.post<any>('http://localhost:6300/forgot-password', this.forgotData).subscribe({
      next: response => {
        console.log('Password reset sent', response);
        this.snackbarService.openSuccess('Instrukcje resetowania hasła zostały wysłane. Za chwilę zostaniesz przekierowany na stronę logowania.');
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 10000);
      },
      error: error => {
        console.error('Password reset error', error);
        this.snackbarService.openError('Wystąpił błąd podczas wysyłania instrukcji resetowania hasła.');
      }
    });
  }
}