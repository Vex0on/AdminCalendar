import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, HttpClientModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  registerData = {
    email: '',
    username: '',
    password: ''
  };

  constructor(private http: HttpClient, private router: Router) {}

  register() {
    this.http.post<any>('http://localhost:6300/register', this.registerData).subscribe({
      next: response => {
        console.log('Registration successful', response);
        this.router.navigate(['/login']);
      },
      error: error => {
        console.error('Login error', error);
      }
    });
  }  
}
