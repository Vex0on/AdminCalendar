import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';

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

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchSlotsWithUsernames();
  }

  fetchSlotsWithUsernames() {
    this.http.get<any[]>('http://localhost:6300/slots-for-current-month')
      .subscribe({
        next: data => {
          this.slots = data;
        },
        error: err => {
          console.error('Error fetching slots with usernames:', err);
        }
      });
  }
}
