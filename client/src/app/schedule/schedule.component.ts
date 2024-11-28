import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule, registerLocaleData } from '@angular/common';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.css']
})
export class ScheduleComponent implements OnInit {
  slots: any[] = [];
  today: Date = new Date();
  currentDate: Date = new Date();

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchSlotsForMonth();
  }

  fetchSlotsForMonth() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth() + 1;
    this.http
      .get<any[]>(`http://localhost:6300/slots-for-month?year=${year}&month=${month}`)
      .subscribe({
        next: data => {
          this.slots = data;
        },
        error: err => {
          console.error('Error fetching slots for month:', err);
        }
      });
  }

  goToPreviousMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.fetchSlotsForMonth();
  }

  goToNextMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.fetchSlotsForMonth();
  }
}