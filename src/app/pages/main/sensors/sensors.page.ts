import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
} from '@ionic/angular/standalone';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { inject } from '@angular/core';
import { SensorService } from 'src/app/services/sensor.service';
import { Position } from '@capacitor/geolocation';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sensors',
  templateUrl: './sensors.page.html',
  styleUrls: ['./sensors.page.scss'],
  standalone: true,
  imports: [
    IonCardContent,
    IonCardTitle,
    IonCardHeader,
    IonCard,
    IonContent,
    CommonModule,
    FormsModule,
    HeaderComponent,
  ],
})
export class SensorsPage implements OnInit, OnDestroy {
  sensorService = inject(SensorService);

  private coordinatesSubscription: Subscription | null = null;

  position: Position | null = null;

  constructor() {}

  ngOnInit() {
    this.sensorService.startWatchingGPS();

    this.coordinatesSubscription = this.sensorService
      .getCurrentCoordinates()
      .subscribe((data) => {
        this.position = data;
      });
  }

  ngOnDestroy() {
    if (this.coordinatesSubscription) {
      this.coordinatesSubscription.unsubscribe();
    }
    this.sensorService.stopWatchingGPS();
  }
}