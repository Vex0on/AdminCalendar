import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';

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

  constructor(private http: HttpClient, private router: Router) {}

  forgot() {
    this.http.post<any>('http://localhost:6300/forgot-password', this.forgotData).subscribe({
      next: response => {
        console.log('Password reset sent', response);
        this.router.navigate(['/login']);
      },
      error: error => {
        console.error('Login error', error);
      }
    });
  }  
}