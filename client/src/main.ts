import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { LOCALE_ID } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import localePl from '@angular/common/locales/pl'; 
import { appConfig } from './app/app.config';

registerLocaleData(localePl);

bootstrapApplication(AppComponent, {
  providers: [
    ...appConfig.providers, 
    { provide: LOCALE_ID, useValue: 'pl' } 
  ]
}).catch((err) => console.error(err));
