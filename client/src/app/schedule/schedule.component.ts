import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User, Event } from './models';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.css']
})
export class ScheduleComponent implements OnInit {
  slots: any[] = [];
  today: Date = new Date();
  currentDate: Date = new Date();
  selectedSlot: any = null;
  isModalOpen: boolean = false;
  isEditing: boolean = false;
  availableEvents: Event[] = [];
  availableUsers: User[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchSlotsForMonth();
    this.fetchAvailableEvents();
    this.fetchAvailableUsers();
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

  fetchAvailableEvents() {
    this.http.get<any>('http://localhost:6300/events').subscribe({
      next: data => {
        this.availableEvents = data.events;
      },
      error: err => {
        console.error('Error fetching events:', err);
      }
    });
  }
  
  fetchAvailableUsers() {
    this.http.get<User[]>('http://localhost:6300/users').subscribe({
      next: data => {
        this.availableUsers = data;
      },
      error: err => {
        console.error('Error fetching users:', err);
      }
    });
  }

  openSlotModal(slot: any) {
    this.selectedSlot = { ...slot, events: Array.isArray(slot.events) ? [...slot.events] : [] };
    this.isModalOpen = true;
  }

  onEventChange(eventId: any, index: number) {
    const selectedEvent = this.availableEvents.find(e => e.id === eventId);
    if (selectedEvent) {
      this.selectedSlot.events[index] = selectedEvent;
    }
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedSlot = null;
  }

  enableEditing() {
    this.isEditing = true;
  }

  saveChanges() {
    const payload = {
      userIds: this.selectedSlot.users.map((user: User) => user.id),
      events: this.selectedSlot.events.map((event: Event) => ({ id: event.id })),
      comments: this.selectedSlot.comments 
    };

    this.http.put(`http://localhost:6300/slots/${this.selectedSlot.id}/edit`, payload)
      .subscribe({
        next: () => {
          this.isEditing = false;
          this.closeModal();
          this.fetchSlotsForMonth();
        },
        error: (err) => {
          console.error('Error saving changes:', err);
          alert('Nie udało się zapisać zmian. Spróbuj ponownie.');
        }
      });
  }

  changeMonth(offset: number) {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + offset, 1);
    this.fetchSlotsForMonth();
  }

  getCommentKeys(comments: any): string[] {
    return comments ? Object.keys(comments) : [];
  }
}
