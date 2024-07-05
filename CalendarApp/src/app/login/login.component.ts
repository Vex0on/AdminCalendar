import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, HttpClientModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginData = {
    identifier: '',
    password: ''
  };

  constructor(private http: HttpClient, private router:Router) {}

  login() {
    this.http.post<any>('http://localhost:6300/login', this.loginData).subscribe({
      next: response => {
        console.log('Login successful', response);
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        this.router.navigate(['/schedule']);
      },
      error: error => {
        console.error('Login error', error);
      }
    });
  }  

}